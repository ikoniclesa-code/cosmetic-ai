import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getImageModel,
  IMAGE_MODEL,
  extractImageFromResponse,
} from "@/lib/gemini";
import { CREDIT_COSTS, hasEnoughCredits, deductCredits } from "@/lib/credits";
import { checkRateLimit } from "@/lib/rate-limit";
import { checkSubscriptionAccess } from "@/lib/subscription";
import { validatePrompt, getValidationMessage } from "@/lib/validation";
import { retryAsync, withTimeout } from "@/lib/utils";
import type { GenerateImageRequest, ApiResponse } from "@/types/api";
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

    const rateLimit = checkRateLimit("generate-image", user.id);
    if (!rateLimit.allowed) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: `Rate limit exceeded. Try again in ${Math.ceil(rateLimit.resetIn / 1000)}s.`,
        },
        { status: 429 }
      );
    }

    const subStatus = await checkSubscriptionAccess(user.id);
    if (!subStatus.hasAccess) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: subStatus.message || "No active subscription" },
        { status: 403 }
      );
    }

    const body: GenerateImageRequest = await request.json();

    const promptErrorKey = validatePrompt(body.prompt);
    if (promptErrorKey) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: getValidationMessage(promptErrorKey) || promptErrorKey },
        { status: 400 }
      );
    }

    const enough = await hasEnoughCredits(user.id, "image_from_prompt");
    if (!enough) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Insufficient credits" },
        { status: 402 }
      );
    }

    const adminSupabase = createAdminClient();

    const enhancedPrompt = await buildEnhancedPrompt(
      adminSupabase,
      user.id,
      body.prompt,
      body.businessId
    );

    const { data: genData, error: genError } = await adminSupabase
      .from("generations")
      .insert({
        user_id: user.id,
        business_id: body.businessId || null,
        type: "image_from_prompt" as const,
        prompt: body.prompt,
        credits_used: CREDIT_COSTS.image_from_prompt,
        ai_model: IMAGE_MODEL,
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
      const model = getImageModel();

      const result = await withTimeout(
        retryAsync(async () => {
          return await model.generateContent(enhancedPrompt);
        }, 5, 4000)
      );

      const imageResult = extractImageFromResponse(result);
      if (!imageResult) {
        throw new Error("No image generated");
      }

      const imageBuffer = Buffer.from(imageResult.imageBase64, "base64");
      const ext = mimeToExtension(imageResult.mimeType);
      const storagePath = `${user.id}/${Date.now()}_${randomId()}.${ext}`;

      const { error: uploadError } = await adminSupabase.storage
        .from("generated")
        .upload(storagePath, imageBuffer, {
          contentType: imageResult.mimeType,
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Storage upload failed: ${uploadError.message}`);
      }

      const { data: signedUrlData } = await adminSupabase.storage
        .from("generated")
        .createSignedUrl(storagePath, 60 * 60 * 24 * 365);

      const imageUrl = signedUrlData?.signedUrl ?? storagePath;

      await adminSupabase
        .from("generations")
        .update({
          result_image_url: imageUrl,
          status: "completed" as const,
        })
        .eq("id", generation.id);

      const remainingCredits = await deductCredits(
        user.id,
        "image_from_prompt",
        generation.id
      );

      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          id: generation.id,
          type: "image_from_prompt",
          result_image_url: imageUrl,
          credits_used: CREDIT_COSTS.image_from_prompt,
          credits_remaining: remainingCredits,
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

      const isTimeout = errorMessage.includes("AI_TIMEOUT");
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: isTimeout
            ? "Generation timed out. Please try again."
            : "Failed to generate image. Please try again later.",
        },
        { status: isTimeout ? 504 : 502 }
      );
    }
  } catch (error) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function buildEnhancedPrompt(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
  prompt: string,
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

  const contextParts: string[] = [];

  if (business) {
    if (business.industry) {
      contextParts.push(
        business.industry === "cosmetics"
          ? "Style: professional cosmetics/beauty product photography"
          : "Style: clean household product photography"
      );
    }
    if (business.name) {
      contextParts.push(`Brand: ${business.name}`);
    }
  }

  contextParts.push("Quality: high-resolution, commercial quality, social media ready");

  return `${prompt}\n\n${contextParts.join(". ")}.`;
}

function mimeToExtension(mimeType: string): string {
  const map: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
  };
  return map[mimeType] || "png";
}

function randomId(): string {
  return Math.random().toString(36).substring(2, 9);
}
