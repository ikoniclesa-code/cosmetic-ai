export interface Plan {
  id: "starter" | "pro" | "pro_plus";
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  monthlyCredits: number;
  features: string[];
}

export const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    monthlyPrice: 19.9,
    yearlyPrice: 199.0,
    monthlyCredits: 800,
    features: [
      "800 credits per month",
      "Text generation",
      "Image generation",
      "Image from upload",
      "Generation history",
      "Basic analytics",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    monthlyPrice: 39.9,
    yearlyPrice: 383.0,
    monthlyCredits: 1800,
    features: [
      "1,800 credits per month",
      "Text generation",
      "Image generation",
      "Image from upload",
      "Generation history",
      "Advanced analytics",
      "Priority support",
    ],
  },
  {
    id: "pro_plus",
    name: "Pro+",
    monthlyPrice: 59.9,
    yearlyPrice: 575.0,
    monthlyCredits: 3000,
    features: [
      "3,000 credits per month",
      "Text generation",
      "Image generation",
      "Image from upload",
      "Generation history",
      "Advanced analytics",
      "Priority support",
      "Early access to new features",
    ],
  },
];

export function getPlanById(id: string): Plan | undefined {
  return PLANS.find((p) => p.id === id);
}

export function getPlanPrice(
  planId: string,
  cycle: "monthly" | "yearly"
): number {
  const plan = getPlanById(planId);
  if (!plan) return 0;
  return cycle === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;
}
