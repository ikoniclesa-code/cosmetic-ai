import { createAdminClient } from "@/lib/supabase/admin";

export const CREDIT_COSTS = {
  text: 1,
  image_from_prompt: 14,
  image_from_upload: 14,
} as const;

export const INITIAL_FREE_CREDITS = 20;

export type GenerationType = keyof typeof CREDIT_COSTS;

export async function getUserCredits(userId: string): Promise<number> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("credits")
    .eq("id", userId)
    .single();

  if (error || !data) {
    throw new Error("Failed to fetch user credits");
  }

  return data.credits;
}

export async function hasEnoughCredits(
  userId: string,
  type: GenerationType
): Promise<boolean> {
  const credits = await getUserCredits(userId);
  return credits >= CREDIT_COSTS[type];
}

export async function deductCredits(
  userId: string,
  type: GenerationType,
  generationId: string
): Promise<number> {
  const cost = CREDIT_COSTS[type];
  const supabase = createAdminClient();

  const { data: profile, error: fetchError } = await supabase
    .from("profiles")
    .select("credits")
    .eq("id", userId)
    .single();

  if (fetchError || !profile) {
    throw new Error("Failed to fetch user profile");
  }

  if (profile.credits < cost) {
    throw new Error("Insufficient credits");
  }

  const newCredits = profile.credits - cost;

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ credits: newCredits, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (updateError) {
    throw new Error("Failed to deduct credits");
  }

  await supabase.from("credit_transactions").insert({
    user_id: userId,
    amount: -cost,
    type: "usage",
    description: `Used ${cost} credit(s) for ${type}`,
    generation_id: generationId,
  });

  return newCredits;
}

export type CreditTransactionType =
  | "subscription_renewal"
  | "usage"
  | "admin_adjustment"
  | "initial_free"
  | "refund";

export async function addCredits(
  userId: string,
  amount: number,
  type: CreditTransactionType,
  description: string
): Promise<number> {
  const supabase = createAdminClient();

  const { data: profile, error: fetchError } = await supabase
    .from("profiles")
    .select("credits")
    .eq("id", userId)
    .single();

  if (fetchError || !profile) {
    throw new Error("Failed to fetch user profile");
  }

  const newCredits = profile.credits + amount;

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ credits: newCredits, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (updateError) {
    throw new Error("Failed to add credits");
  }

  await supabase.from("credit_transactions").insert({
    user_id: userId,
    amount,
    type,
    description,
  });

  return newCredits;
}
