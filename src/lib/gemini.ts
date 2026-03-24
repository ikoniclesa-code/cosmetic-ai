import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);

export const IMAGE_MODEL = "gemini-3-pro-image-preview";

export function getImageModel() {
  return genAI.getGenerativeModel({ model: IMAGE_MODEL });
}
