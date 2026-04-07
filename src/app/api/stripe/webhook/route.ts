import { NextRequest, NextResponse } from "next/server";
import { stripe, PLAN_CREDITS } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { addCredits } from "@/lib/credits";
import type Stripe from "stripe";
import type { Json } from "@/types/database";

type PlanType = "starter" | "pro" | "pro_plus";
type BillingCycle = "monthly" | "yearly";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${message}` },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  const { data: existingEvent } = await supabase
    .from("stripe_events")
    .select("id")
    .eq("stripe_event_id", event.id)
    .single();

  if (existingEvent) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  await supabase.from("stripe_events").insert({
    stripe_event_id: event.id,
    event_type: event.type,
    processed: false,
    data: JSON.parse(JSON.stringify(event.data.object)) as Json,
  });

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session,
          supabase
        );
        break;

      case "invoice.paid":
        await handleInvoicePaid(event.data.object, supabase);
        break;

      case "invoice.payment_failed":
        await handlePaymentFailed(event.data.object, supabase);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object, supabase);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object, supabase);
        break;
    }

    await supabase
      .from("stripe_events")
      .update({ processed: true })
      .eq("stripe_event_id", event.id);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Handler error";
    console.error(`Webhook handler error for ${event.type}:`, message);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}

function getSubscriptionId(obj: Record<string, unknown>): string | null {
  const sub = obj.subscription;
  if (typeof sub === "string") return sub;
  if (sub && typeof sub === "object" && "id" in sub)
    return (sub as { id: string }).id;
  return null;
}

async function getSubscriptionData(subscriptionId: string) {
  const sub = await stripe.subscriptions.retrieve(subscriptionId);
  const data = sub as unknown as Record<string, unknown>;
  return {
    metadata: (data.metadata || {}) as Record<string, string>,
    current_period_start: data.current_period_start as number | undefined,
    current_period_end: data.current_period_end as number | undefined,
    cancel_at_period_end: data.cancel_at_period_end as boolean | undefined,
    status: data.status as string,
  };
}

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
  supabase: ReturnType<typeof createAdminClient>
) {
  const userId = session.metadata?.supabase_user_id;
  if (!userId) return;

  const planType = (session.metadata?.plan_type || "starter") as PlanType;
  const billingCycle = (session.metadata?.billing_cycle ||
    "monthly") as BillingCycle;
  const monthlyCredits = parseInt(
    session.metadata?.monthly_credits || "0",
    10
  );
  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id;
  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id;

  if (!customerId) return;

  let periodStart: string | null = null;
  let periodEnd: string | null = null;

  if (subscriptionId) {
    const sub = await getSubscriptionData(subscriptionId);
    if (sub.current_period_start) {
      periodStart = new Date(sub.current_period_start * 1000).toISOString();
    }
    if (sub.current_period_end) {
      periodEnd = new Date(sub.current_period_end * 1000).toISOString();
    }
  }

  const { data: existingSub } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("user_id", userId)
    .single();

  const subData = {
    stripe_customer_id: customerId,
    stripe_subscription_id: subscriptionId || null,
    plan_type: planType,
    billing_cycle: billingCycle,
    status: "active" as const,
    monthly_credits: monthlyCredits,
    current_period_start: periodStart,
    current_period_end: periodEnd,
    cancel_at_period_end: false,
  };

  if (existingSub) {
    await supabase
      .from("subscriptions")
      .update(subData)
      .eq("user_id", userId);
  } else {
    await supabase
      .from("subscriptions")
      .insert({ user_id: userId, ...subData });
  }

  await supabase
    .from("profiles")
    .update({ credits: monthlyCredits })
    .eq("id", userId);

  await addCredits(
    userId,
    monthlyCredits,
    "subscription_renewal",
    `Initial credits for ${planType} plan (${billingCycle})`
  );
}

async function handleInvoicePaid(
  invoiceObj: Stripe.Event.Data.Object,
  supabase: ReturnType<typeof createAdminClient>
) {
  const invoice = invoiceObj as unknown as Record<string, unknown>;
  const subscriptionId = getSubscriptionId(invoice);
  if (!subscriptionId) return;

  if (invoice.billing_reason === "subscription_create") {
    return;
  }

  const sub = await getSubscriptionData(subscriptionId);
  const userId = sub.metadata?.supabase_user_id;
  if (!userId) return;

  const planType = (sub.metadata?.plan_type || "starter") as PlanType;
  const billingCycle = (sub.metadata?.billing_cycle ||
    "monthly") as BillingCycle;
  const monthlyCredits = PLAN_CREDITS[planType] || 0;

  const updateData: Record<string, unknown> = {
    status: "active",
  };
  if (sub.current_period_start) {
    updateData.current_period_start = new Date(
      sub.current_period_start * 1000
    ).toISOString();
  }
  if (sub.current_period_end) {
    updateData.current_period_end = new Date(
      sub.current_period_end * 1000
    ).toISOString();
  }

  await supabase
    .from("subscriptions")
    .update(updateData)
    .eq("user_id", userId);

  await supabase
    .from("profiles")
    .update({ credits: monthlyCredits })
    .eq("id", userId);

  await addCredits(
    userId,
    monthlyCredits,
    "subscription_renewal",
    `Monthly renewal credits for ${planType} plan (${billingCycle})`
  );
}

async function handlePaymentFailed(
  invoiceObj: Stripe.Event.Data.Object,
  supabase: ReturnType<typeof createAdminClient>
) {
  const invoice = invoiceObj as unknown as Record<string, unknown>;
  const subscriptionId = getSubscriptionId(invoice);
  if (!subscriptionId) return;

  const sub = await getSubscriptionData(subscriptionId);
  const userId = sub.metadata?.supabase_user_id;
  if (!userId) return;

  await supabase
    .from("subscriptions")
    .update({ status: "past_due" })
    .eq("user_id", userId);
}

async function handleSubscriptionUpdated(
  subObj: Stripe.Event.Data.Object,
  supabase: ReturnType<typeof createAdminClient>
) {
  const subscription = subObj as unknown as Record<string, unknown>;
  const metadata = (subscription.metadata || {}) as Record<string, string>;
  const userId = metadata.supabase_user_id;
  if (!userId) return;

  const planType = (metadata.plan_type || "starter") as PlanType;
  const billingCycle = (metadata.billing_cycle || "monthly") as BillingCycle;
  const monthlyCredits = PLAN_CREDITS[planType] || 0;

  const rawStatus = subscription.status as string;
  const status =
    rawStatus === "active"
      ? ("active" as const)
      : rawStatus === "past_due"
        ? ("past_due" as const)
        : rawStatus === "canceled"
          ? ("canceled" as const)
          : ("incomplete" as const);

  const updateData: Record<string, unknown> = {
    plan_type: planType,
    billing_cycle: billingCycle,
    monthly_credits: monthlyCredits,
    status,
    cancel_at_period_end: subscription.cancel_at_period_end as boolean,
  };

  if (subscription.current_period_start) {
    updateData.current_period_start = new Date(
      (subscription.current_period_start as number) * 1000
    ).toISOString();
  }
  if (subscription.current_period_end) {
    updateData.current_period_end = new Date(
      (subscription.current_period_end as number) * 1000
    ).toISOString();
  }

  await supabase
    .from("subscriptions")
    .update(updateData)
    .eq("user_id", userId);
}

async function handleSubscriptionDeleted(
  subObj: Stripe.Event.Data.Object,
  supabase: ReturnType<typeof createAdminClient>
) {
  const subscription = subObj as unknown as Record<string, unknown>;
  const metadata = (subscription.metadata || {}) as Record<string, string>;
  const userId = metadata.supabase_user_id;
  if (!userId) return;

  await supabase
    .from("subscriptions")
    .update({
      status: "canceled",
      cancel_at_period_end: false,
    })
    .eq("user_id", userId);
}
