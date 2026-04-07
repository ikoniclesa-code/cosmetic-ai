import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";

type SubscriptionRow = Database["public"]["Tables"]["subscriptions"]["Row"];
export type DerivedSubscriptionStatus =
  | "none"
  | "active"
  | "canceling"
  | "past_due"
  | "canceled"
  | "incomplete";

export interface SubscriptionStatus {
  hasAccess: boolean;
  status: "active" | "canceled" | "past_due" | "incomplete" | "none";
  planType: string | null;
  billingCycle: string | null;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  monthlyCredits: number;
  message: string | null;
}

export function getDerivedSubscriptionStatus(
  subscription: SubscriptionRow | null
): DerivedSubscriptionStatus {
  if (!subscription) return "none";

  const periodEnd = subscription.current_period_end
    ? new Date(subscription.current_period_end)
    : null;
  const isPeriodValid = periodEnd ? new Date() < periodEnd : false;

  if (subscription.status === "active" && subscription.cancel_at_period_end) {
    return isPeriodValid ? "canceling" : "canceled";
  }

  if (subscription.status === "active") return "active";
  if (subscription.status === "past_due") return "past_due";
  if (subscription.status === "canceled") return "canceled";
  return "incomplete";
}

export async function checkSubscriptionAccess(
  userId: string
): Promise<SubscriptionStatus> {
  const supabase = createAdminClient();

  const { data: subData } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .single();

  const subscription = subData as SubscriptionRow | null;

  if (!subscription) {
    return {
      hasAccess: false,
      status: "none",
      planType: null,
      billingCycle: null,
      cancelAtPeriodEnd: false,
      currentPeriodEnd: null,
      monthlyCredits: 0,
      message: "Nemate aktivnu pretplatu. Izaberite plan da biste počeli.",
    };
  }

  const now = new Date();
  const periodEnd = subscription.current_period_end
    ? new Date(subscription.current_period_end)
    : null;
  const isPeriodValid = periodEnd ? now < periodEnd : false;

  if (subscription.status === "active" && !subscription.cancel_at_period_end) {
    return {
      hasAccess: true,
      status: "active",
      planType: subscription.plan_type,
      billingCycle: subscription.billing_cycle,
      cancelAtPeriodEnd: false,
      currentPeriodEnd: subscription.current_period_end,
      monthlyCredits: subscription.monthly_credits,
      message: null,
    };
  }

  if (subscription.status === "active" && subscription.cancel_at_period_end) {
    return {
      hasAccess: isPeriodValid,
      status: "active",
      planType: subscription.plan_type,
      billingCycle: subscription.billing_cycle,
      cancelAtPeriodEnd: true,
      currentPeriodEnd: subscription.current_period_end,
      monthlyCredits: subscription.monthly_credits,
      message: isPeriodValid
        ? `Pretplata je otkazana. Važi do ${formatDateSr(periodEnd!)}.`
        : "Pretplata je istekla. Izaberite novi plan.",
    };
  }

  if (subscription.status === "past_due") {
    return {
      hasAccess: isPeriodValid,
      status: "past_due",
      planType: subscription.plan_type,
      billingCycle: subscription.billing_cycle,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      currentPeriodEnd: subscription.current_period_end,
      monthlyCredits: subscription.monthly_credits,
      message: "Plaćanje nije uspelo. Ažurirajte način plaćanja.",
    };
  }

  if (subscription.status === "canceled") {
    return {
      hasAccess: false,
      status: "canceled",
      planType: subscription.plan_type,
      billingCycle: subscription.billing_cycle,
      cancelAtPeriodEnd: false,
      currentPeriodEnd: subscription.current_period_end,
      monthlyCredits: 0,
      message: "Pretplata je otkazana. Izaberite novi plan da nastavite.",
    };
  }

  return {
    hasAccess: false,
    status: "incomplete",
    planType: subscription.plan_type,
    billingCycle: subscription.billing_cycle,
    cancelAtPeriodEnd: false,
    currentPeriodEnd: null,
    monthlyCredits: 0,
    message: "Pretplata nije kompletirana. Završite plaćanje.",
  };
}

function formatDateSr(date: Date): string {
  return date.toLocaleDateString("sr-Latn-RS", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
