import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const disabled = () => process.env.RATE_LIMIT_DISABLED === "true";

function hasRedisEnv(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  );
}

function makeLimiter(
  prefix: string,
  requests: number,
  window: "1 s" | "1 m" | "1 h" | "1 d"
): Ratelimit | null {
  if (!hasRedisEnv()) return null;
  const redis = Redis.fromEnv();
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, window),
    prefix: `sal-quiz:${prefix}`,
    analytics: false,
  });
}

/**
 * Very high ceilings — only blunt scripted abuse (thousands/hour per IP).
 * Shared NAT / viral traffic: real users rarely hit these.
 * Tune via code if you ever need stricter caps.
 */
const submitLimiter = makeLimiter("submit", 5000, "1 h");

/** GET /api/responses, /api/rami-levy — effectively unlimited for normal UI use. */
const readLimiter = makeLimiter("read", 10000, "1 m");

let warnedMissingRedis = false;

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: number;
};

export async function limitSurveySubmit(ip: string): Promise<RateLimitResult> {
  if (disabled() || !submitLimiter) {
    if (
      process.env.NODE_ENV === "production" &&
      !hasRedisEnv() &&
      !warnedMissingRedis
    ) {
      warnedMissingRedis = true;
      console.warn(
        "[rate-limit] UPSTASH_REDIS_REST_URL/TOKEN not set — submission rate limit disabled. Set Upstash Redis for public abuse protection."
      );
    }
    return {
      allowed: true,
      limit: 0,
      remaining: 999,
      reset: Date.now(),
    };
  }
  const out = await submitLimiter.limit(ip);
  return {
    allowed: out.success,
    limit: out.limit,
    remaining: out.remaining,
    reset: out.reset,
  };
}

export async function limitApiRead(ip: string): Promise<RateLimitResult> {
  if (disabled() || !readLimiter) {
    return {
      allowed: true,
      limit: 0,
      remaining: 999,
      reset: Date.now(),
    };
  }
  const out = await readLimiter.limit(ip);
  return {
    allowed: out.success,
    limit: out.limit,
    remaining: out.remaining,
    reset: out.reset,
  };
}
