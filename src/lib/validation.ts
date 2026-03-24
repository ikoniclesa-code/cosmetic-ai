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

export function validateEmail(email: string): string | null {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !re.test(email)) {
    return "Invalid email address";
  }
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  }
  return null;
}

export function validatePrompt(prompt: string): string | null {
  if (!prompt || prompt.trim().length < MIN_PROMPT_LENGTH) {
    return `Prompt must be at least ${MIN_PROMPT_LENGTH} characters`;
  }
  if (prompt.length > MAX_PROMPT_LENGTH) {
    return `Prompt must be at most ${MAX_PROMPT_LENGTH} characters`;
  }
  return null;
}

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return "Only JPG, PNG, and WebP images are allowed";
  }
  if (file.size > MAX_FILE_SIZE) {
    return "File size must be under 10 MB";
  }
  return null;
}

export function validateFullName(name: string): string | null {
  if (!name || name.trim().length < 2) {
    return "Name must be at least 2 characters";
  }
  return null;
}
