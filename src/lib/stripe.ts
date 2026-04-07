import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
  typescript: true,
});

export const STRIPE_PRICE_MAP: Record<string, string> = {
  starter_monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY!,
  starter_yearly: process.env.STRIPE_PRICE_STARTER_YEARLY!,
  pro_monthly: process.env.STRIPE_PRICE_PRO_MONTHLY!,
  pro_yearly: process.env.STRIPE_PRICE_PRO_YEARLY!,
  pro_plus_monthly: process.env.STRIPE_PRICE_PRO_PLUS_MONTHLY!,
  pro_plus_yearly: process.env.STRIPE_PRICE_PRO_PLUS_YEARLY!,
};

export const PLAN_CREDITS: Record<string, number> = {
  starter: 800,
  pro: 1800,
  pro_plus: 3000,
};

export function getPriceId(
  planType: string,
  billingCycle: string
): string | null {
  const key = `${planType}_${billingCycle}`;
  return STRIPE_PRICE_MAP[key] || null;
}
