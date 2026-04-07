import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe, getPriceId, PLAN_CREDITS } from "@/lib/stripe";
import { checkRateLimit } from "@/lib/rate-limit";
import type { ApiResponse } from "@/types/api";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const rateLimit = checkRateLimit("api", user.id);
    if (!rateLimit.allowed) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Too many requests. Please wait a moment." },
        { status: 429 }
      );
    }

    const { planType, billingCycle } = await request.json();

    if (!["starter", "pro", "pro_plus"].includes(planType)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Invalid plan type" },
        { status: 400 }
      );
    }

    if (!["monthly", "yearly"].includes(billingCycle)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Invalid billing cycle" },
        { status: 400 }
      );
    }

    const priceId = getPriceId(planType, billingCycle);
    if (!priceId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Price not configured" },
        { status: 500 }
      );
    }

    const adminSupabase = createAdminClient();
    const { data: existingSub } = await adminSupabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .single();

    let customerId = existingSub?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email!,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      customerId = customer.id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        supabase_user_id: user.id,
        plan_type: planType,
        billing_cycle: billingCycle,
        monthly_credits: String(PLAN_CREDITS[planType] || 0),
      },
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
          plan_type: planType,
          billing_cycle: billingCycle,
          monthly_credits: String(PLAN_CREDITS[planType] || 0),
        },
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { url: session.url },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json<ApiResponse>(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
