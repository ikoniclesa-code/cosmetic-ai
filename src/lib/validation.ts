import { t, type Language } from "@/lib/i18n";

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];
export const MIN_PROMPT_LENGTH = 3;
export const MAX_PROMPT_LENGTH = 2000;
export const MIN_PASSWORD_LENGTH = 8;

export type ValidationErrorKey =
  | "promptTooShort"
  | "promptTooLong"
  | "promptRequired"
  | "imageRequired"
  | "invalidFormat"
  | "fileTooLarge"
  | "invalidEmail"
  | "registerPasswordShort"
  | "registerNameShort";

export function validateEmail(email: string): ValidationErrorKey | null {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !re.test(email)) {
    return "invalidEmail";
  }
  return null;
}

export function validatePassword(password: string): ValidationErrorKey | null {
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    return "registerPasswordShort";
  }
  return null;
}

export function validatePrompt(prompt: string): ValidationErrorKey | null {
  if (!prompt || prompt.trim().length < MIN_PROMPT_LENGTH) {
    return "promptTooShort";
  }
  if (prompt.length > MAX_PROMPT_LENGTH) {
    return "promptTooLong";
  }
  return null;
}

export function validateImageFile(file: File): ValidationErrorKey | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return "invalidFormat";
  }
  if (file.size > MAX_FILE_SIZE) {
    return "fileTooLarge";
  }
  return null;
}

export function validateFullName(name: string): ValidationErrorKey | null {
  if (!name || name.trim().length < 2) {
    return "registerNameShort";
  }
  return null;
}

export function getValidationMessage(
  key: ValidationErrorKey | null,
  lang: Language = "sr"
): string | null {
  if (!key) return null;
  return t(lang, "errors", key);
}

export function mapApiErrorToKey(
  status: number,
  errorMessage?: string
): string {
  switch (status) {
    case 401:
      return "unauthorized";
    case 402:
      return "insufficientCredits";
    case 403:
      return errorMessage?.includes("subscription")
        ? "noSubscription"
        : "forbidden";
    case 404:
      return "notFound";
    case 429:
      return "rateLimited";
    case 502:
      return "aiServiceError";
    case 504:
      return "aiServiceTimeout";
    default:
      if (status >= 500) return "serverError";
      return "generic";
  }
}
