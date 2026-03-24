const rateMap = new Map<string, { count: number; resetTime: number }>();

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  "generate-text": { maxRequests: 20, windowMs: 60_000 },
  "generate-image": { maxRequests: 5, windowMs: 60_000 },
  login: { maxRequests: 5, windowMs: 60_000 },
  api: { maxRequests: 60, windowMs: 60_000 },
};

export function checkRateLimit(
  key: string,
  identifier: string,
  config?: RateLimitConfig
): { allowed: boolean; remaining: number; resetIn: number } {
  const limit = config || RATE_LIMITS[key] || RATE_LIMITS.api;
  const compositeKey = `${key}:${identifier}`;
  const now = Date.now();

  const entry = rateMap.get(compositeKey);

  if (!entry || now > entry.resetTime) {
    rateMap.set(compositeKey, {
      count: 1,
      resetTime: now + limit.windowMs,
    });
    return {
      allowed: true,
      remaining: limit.maxRequests - 1,
      resetIn: limit.windowMs,
    };
  }

  if (entry.count >= limit.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: entry.resetTime - now,
    };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: limit.maxRequests - entry.count,
    resetIn: entry.resetTime - now,
  };
}

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateMap.entries()) {
    if (now > entry.resetTime) {
      rateMap.delete(key);
    }
  }
}, 60_000);
