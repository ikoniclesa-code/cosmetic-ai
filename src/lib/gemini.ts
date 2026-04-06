import { GoogleGenerativeAI, type Part } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);

export const IMAGE_MODEL = "gemini-3-pro-image-preview";

export function getImageModel() {
  return genAI.getGenerativeModel({
    model: IMAGE_MODEL,
    generationConfig: {
      responseModalities: ["IMAGE", "TEXT"],
    } as Parameters<typeof genAI.getGenerativeModel>[0]["generationConfig"] & {
      responseModalities: string[];
    },
  });
}

export function buildImageParts(
  prompt: string,
  imageBase64?: string,
  imageMimeType?: string
): (string | Part)[] {
  const parts: (string | Part)[] = [prompt];

  if (imageBase64 && imageMimeType) {
    parts.push({
      inlineData: {
        mimeType: imageMimeType,
        data: imageBase64,
      },
    });
  }

  return parts;
}

export interface GeminiImageResult {
  imageBase64: string;
  mimeType: string;
  text?: string;
}

export function extractImageFromResponse(
  response: Awaited<ReturnType<ReturnType<typeof getImageModel>["generateContent"]>>
): GeminiImageResult | null {
  const candidates = response.response.candidates;
  if (!candidates || candidates.length === 0) return null;

  const parts = candidates[0].content?.parts;
  if (!parts) return null;

  let imageBase64: string | null = null;
  let mimeType: string | null = null;
  let text: string | undefined;

  for (const part of parts) {
    if ("inlineData" in part && part.inlineData) {
      imageBase64 = part.inlineData.data;
      mimeType = part.inlineData.mimeType;
    }
    if ("text" in part && part.text) {
      text = part.text;
    }
  }

  if (!imageBase64 || !mimeType) return null;

  return { imageBase64, mimeType, text };
}
