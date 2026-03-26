export const CREDIT_CONFIG = {
  initialFree: 0,
  costs: {
    text: 1,
    image_from_prompt: 14,
    image_from_upload: 14,
  },
  planCredits: {
    starter: 800,
    pro: 1800,
    pro_plus: 3000,
  },
} as const;
