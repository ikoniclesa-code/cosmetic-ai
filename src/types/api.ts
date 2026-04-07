export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
}

export interface GenerateTextRequest {
  prompt: string;
  imageUrl?: string;
  businessId?: string;
}

export interface GenerateImageRequest {
  prompt: string;
  businessId?: string;
}

export interface GenerateImageFromUploadRequest {
  prompt: string;
  businessId?: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface OnboardingRequest {
  name?: string;
  industry?: "cosmetics" | "home_chemistry" | "both";
  description?: string;
  targetAudience?: string;
  communicationTone?: string;
  socialNetworks?: string[];
}

export interface CreateCheckoutRequest {
  planType: "starter" | "pro" | "pro_plus";
  billingCycle: "monthly" | "yearly";
}

export interface AdminCreditAdjustmentRequest {
  amount: number;
  reason: string;
}
