import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getImageModel,
  IMAGE_MODEL,
  buildImageParts,
  extractImageFromResponse,
} from "@/lib/gemini";
import { CREDIT_COSTS, hasEnoughCredits, deductCredits } from "@/lib/credits";
import { checkRateLimit } from "@/lib/rate-limit";
import { checkSubscriptionAccess } from "@/lib/subscription";
import { validatePrompt, getValidationMessage, ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE } from "@/lib/validation";
import { retryAsync, withTimeout } from "@/lib/utils";
import type { ApiResponse } from "@/types/api";
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

    const formData = await request.formData();
    const file = formData.get("image") as File | null;
    const prompt = formData.get("prompt") as string | null;
    const businessId = formData.get("businessId") as string | null;

    if (!file) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Image file is required" },
        { status: 400 }
      );
    }

    if (!prompt) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Prompt is required" },
        { status: 400 }
      );
    }

    const promptErrorKey = validatePrompt(prompt);
    if (promptErrorKey) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: getValidationMessage(promptErrorKey) || promptErrorKey },
        { status: 400 }
      );
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Only JPG, PNG, and WebP images are allowed" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "File size must be under 10 MB" },
        { status: 400 }
      );
    }

    const enough = await hasEnoughCredits(user.id, "image_from_upload");
    if (!enough) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Insufficient credits" },
        { status: 402 }
      );
    }

    const adminSupabase = createAdminClient();

    const fileBytes = await file.arrayBuffer();
    const fileBuffer = Buffer.from(fileBytes);
    const uploadExt = mimeToExtension(file.type);
    const uploadPath = `${user.id}/${Date.now()}_${randomId()}.${uploadExt}`;

    const { error: uploadStorageError } = await adminSupabase.storage
      .from("uploads")
      .upload(uploadPath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadStorageError) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Failed to upload image" },
        { status: 500 }
      );
    }

    const { data: inputSignedUrl } = await adminSupabase.storage
      .from("uploads")
      .createSignedUrl(uploadPath, 60 * 60 * 24 * 365);

    const inputImageUrl = inputSignedUrl?.signedUrl ?? uploadPath;

    const enhancedPrompt = await buildEnhancedPrompt(
      adminSupabase,
      user.id,
      prompt,
      businessId ?? undefined
    );

    const { data: genData, error: genError } = await adminSupabase
      .from("generations")
      .insert({
        user_id: user.id,
        business_id: businessId || null,
        type: "image_from_upload" as const,
        prompt,
        input_image_url: inputImageUrl,
        credits_used: CREDIT_COSTS.image_from_upload,
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
      const imageBase64 = fileBuffer.toString("base64");
      const parts = buildImageParts(enhancedPrompt, imageBase64, file.type);

      const model = getImageModel();

      const result = await withTimeout(
        retryAsync(async () => {
          return await model.generateContent(parts);
        }, 5, 4000)
      );

      const imageResult = extractImageFromResponse(result);
      if (!imageResult) {
        throw new Error("No image generated");
      }

      const generatedBuffer = Buffer.from(imageResult.imageBase64, "base64");
      const genExt = mimeToExtension(imageResult.mimeType);
      const generatedPath = `${user.id}/${Date.now()}_${randomId()}.${genExt}`;

      const { error: genUploadError } = await adminSupabase.storage
        .from("generated")
        .upload(generatedPath, generatedBuffer, {
          contentType: imageResult.mimeType,
          upsert: false,
        });

      if (genUploadError) {
        throw new Error(`Storage upload failed: ${genUploadError.message}`);
      }

      const { data: genSignedUrl } = await adminSupabase.storage
        .from("generated")
        .createSignedUrl(generatedPath, 60 * 60 * 24 * 365);

      const resultImageUrl = genSignedUrl?.signedUrl ?? generatedPath;

      await adminSupabase
        .from("generations")
        .update({
          result_image_url: resultImageUrl,
          status: "completed" as const,
        })
        .eq("id", generation.id);

      const remainingCredits = await deductCredits(
        user.id,
        "image_from_upload",
        generation.id
      );

      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          id: generation.id,
          type: "image_from_upload",
          input_image_url: inputImageUrl,
          result_image_url: resultImageUrl,
          credits_used: CREDIT_COSTS.image_from_upload,
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
      const industryStyle =
        business.industry === "cosmetics"
          ? "Style: professional cosmetics/beauty product photography"
          : business.industry === "home_chemistry"
            ? "Style: clean household product photography"
            : "Style: blend premium cosmetics aesthetics with clean household product clarity";
      contextParts.push(industryStyle);
    }
    if (business.name) {
      contextParts.push(`Brand: ${business.name}`);
    }
  }

  contextParts.push(
    "Quality: high-resolution, commercial quality, social media ready"
  );
  contextParts.push(
    "Use the uploaded image as reference and transform it according to the prompt"
  );

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
