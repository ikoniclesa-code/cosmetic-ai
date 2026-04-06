import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { openai, TEXT_MODEL } from "@/lib/openai";
import { CREDIT_COSTS, hasEnoughCredits, deductCredits } from "@/lib/credits";
import { checkRateLimit } from "@/lib/rate-limit";
import { validatePrompt } from "@/lib/validation";
import { retryAsync } from "@/lib/utils";
import type { GenerateTextRequest, ApiResponse } from "@/types/api";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import type { Database } from "@/types/database";

type GenerationRow = Database["public"]["Tables"]["generations"]["Row"];
type BusinessRow = Database["public"]["Tables"]["businesses"]["Row"];

export const maxDuration = 60;

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

    const rateLimit = checkRateLimit("generate-text", user.id);
    if (!rateLimit.allowed) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: `Rate limit exceeded. Try again in ${Math.ceil(rateLimit.resetIn / 1000)}s.`,
        },
        { status: 429 }
      );
    }

    const body: GenerateTextRequest = await request.json();

    const promptError = validatePrompt(body.prompt);
    if (promptError) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: promptError },
        { status: 400 }
      );
    }

    const enough = await hasEnoughCredits(user.id, "text");
    if (!enough) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Insufficient credits" },
        { status: 402 }
      );
    }

    const adminSupabase = createAdminClient();

    const businessContext = await getBusinessContext(
      adminSupabase,
      user.id,
      body.businessId
    );

    const { data: genData, error: genError } = await adminSupabase
      .from("generations")
      .insert({
        user_id: user.id,
        business_id: body.businessId || null,
        type: "text" as const,
        prompt: body.prompt,
        input_image_url: body.imageUrl || null,
        credits_used: CREDIT_COSTS.text,
        ai_model: TEXT_MODEL,
        status: "pending" as const,
      })
      .select()
      .single();

    const generation = genData as GenerationRow | null;

    if (genError || !generation) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Failed to create generation record" },
        { status: 500 }
      );
    }

    try {
      const messages = buildMessages(
        buildSystemPrompt(businessContext),
        body.prompt,
        body.imageUrl
      );

      const result = await retryAsync(async () => {
        return await openai.chat.completions.create({
          model: TEXT_MODEL,
          messages,
          max_tokens: 1500,
          temperature: 0.8,
        });
      });

      const generatedText = result.choices[0]?.message?.content;
      if (!generatedText) {
        throw new Error("No text generated");
      }

      const tokensUsed = result.usage?.total_tokens ?? null;

      await adminSupabase
        .from("generations")
        .update({
          result_text: generatedText,
          tokens_used: tokensUsed,
          status: "completed" as const,
        })
        .eq("id", generation.id);

      const remainingCredits = await deductCredits(
        user.id,
        "text",
        generation.id
      );

      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          id: generation.id,
          type: "text",
          result_text: generatedText,
          credits_used: CREDIT_COSTS.text,
          credits_remaining: remainingCredits,
          tokens_used: tokensUsed,
        },
      });
    } catch (aiError) {
      const errorMessage =
        aiError instanceof Error ? aiError.message : "AI service unavailable";

      await adminSupabase
        .from("generations")
        .update({
          status: "failed" as const,
          error_message: errorMessage,
        })
        .eq("id", generation.id);

      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Failed to generate text. Please try again later.",
        },
        { status: 502 }
      );
    }
  } catch (error) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

function buildSystemPrompt(businessContext: string): string {
  const base = `You are an expert social media content creator. Your task is to generate engaging, creative, and on-brand social media posts.

Guidelines:
- Create content that is ready to post on social media
- Include relevant hashtags when appropriate
- Keep the tone consistent with the brand voice
- Make the content engaging and shareable
- Write in the same language as the user's prompt`;

  if (businessContext) {
    return `${base}\n\n${businessContext}`;
  }
  return base;
}

function buildMessages(
  systemPrompt: string,
  userPrompt: string,
  imageUrl?: string
): ChatCompletionMessageParam[] {
  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
  ];

  if (imageUrl) {
    messages.push({
      role: "user",
      content: [
        { type: "text", text: userPrompt },
        { type: "image_url", image_url: { url: imageUrl } },
      ],
    });
  } else {
    messages.push({ role: "user", content: userPrompt });
  }

  return messages;
}

async function getBusinessContext(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
  businessId?: string
): Promise<string> {
  let business: BusinessRow | null = null;

  if (businessId) {
    const { data } = await supabase
      .from("businesses")
      .select("*")
      .eq("id", businessId)
      .eq("user_id", userId)
      .single();
    business = data as BusinessRow | null;
  } else {
    const { data } = await supabase
      .from("businesses")
      .select("*")
      .eq("user_id", userId)
      .limit(1)
      .single();
    business = data as BusinessRow | null;
  }

  if (!business) return "";

  const parts: string[] = [];
  if (business.name) parts.push(`Brand: ${business.name}`);
  if (business.industry) {
    parts.push(
      `Industry: ${business.industry === "cosmetics" ? "Cosmetics & Beauty" : "Household Cleaning & Home Chemistry"}`
    );
  }
  if (business.description) parts.push(`Description: ${business.description}`);
  if (business.target_audience)
    parts.push(`Target Audience: ${business.target_audience}`);
  if (business.communication_tone)
    parts.push(`Tone: ${business.communication_tone}`);
  if (business.social_networks?.length) {
    parts.push(`Social Networks: ${business.social_networks.join(", ")}`);
  }

  return parts.length > 0
    ? `Brand Context:\n${parts.join("\n")}`
    : "";
}
