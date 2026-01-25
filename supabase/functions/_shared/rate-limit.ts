// Distributed rate limiting using Upstash Redis with sliding window algorithm

import { Redis } from "https://esm.sh/@upstash/redis@1.28.0";
import { corsHeaders } from "./cors.ts";

interface RateLimitConfig {
  identifier: string;
  endpoint: string;
  limit: number;
  window: number; // seconds
  cost?: number; // for token bucket
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

// Upstash Redis client setup
let redis: Redis;

function getRedisClient(): Redis {
  if (!redis) {
    const url = Deno.env.get("UPSTASH_REDIS_REST_URL");
    const token = Deno.env.get("UPSTASH_REDIS_REST_TOKEN");

    if (!url || !token) {
      throw new Error("Missing Upstash Redis configuration: UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN required");
    }

    redis = new Redis({
      url,
      token,
    });
  }
  return redis;
}

// Key generation functions
export function getRateLimitKey(identifier: string, endpoint: string): string {
  return `ratelimit:${endpoint}:${identifier}`;
}

// Core rate limiting function with sliding window counter
export async function checkRateLimit(config: RateLimitConfig): Promise<RateLimitResult> {
  const client = getRedisClient();
  const key = getRateLimitKey(config.identifier, config.endpoint);

  // Use sliding window counter algorithm
  const now = Date.now();
  const windowStart = now - (config.window * 1000);

  try {
    // Add current request to the sorted set
    await client.zadd(key, now, now.toString());

    // Remove old entries outside the window
    await client.zremrangebyscore(key, 0, windowStart);

    // Count requests in current window
    const requestCount = await client.zcard(key);

    // Set expiry on the key (window + buffer)
    await client.expire(key, config.window + 60); // 60 second buffer

    const allowed = requestCount <= config.limit;
    const remaining = Math.max(0, config.limit - requestCount);
    const resetAt = now + (config.window * 1000);

    return { allowed, remaining, resetAt };
  } catch (error) {
    console.error("Rate limiting error:", error);
    // Fail open - allow request if Redis is unavailable
    return { allowed: true, remaining: config.limit - 1, resetAt: now + (config.window * 1000) };
  }
}

// Rate limiting strategies

// Sliding Window Counter - most endpoints
export async function slidingWindowRateLimit(
  identifier: string,
  endpoint: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  return checkRateLimit({ identifier, endpoint, limit, window: windowSeconds });
}

// Token Bucket - for OTP verification (allow bursts but limit sustained abuse)
export async function tokenBucketRateLimit(
  identifier: string,
  endpoint: string,
  capacity: number,
  refillRate: number // tokens per second
): Promise<RateLimitResult> {
  const client = getRedisClient();
  const key = `tokenbucket:${endpoint}:${identifier}`;

  try {
    const now = Date.now() / 1000; // seconds
    const script = `
      local key = KEYS[1]
      local capacity = tonumber(ARGV[1])
      local refill_rate = tonumber(ARGV[2])
      local now = tonumber(ARGV[3])
      local cost = 1

      local data = redis.call('HMGET', key, 'tokens', 'last_refill')
      local tokens = tonumber(data[1]) or capacity
      local last_refill = tonumber(data[2]) or now

      -- Calculate tokens to add since last refill
      local time_passed = now - last_refill
      local tokens_to_add = time_passed * refill_rate
      tokens = math.min(capacity, tokens + tokens_to_add)

      local allowed = tokens >= cost
      if allowed then
        tokens = tokens - cost
      end

      redis.call('HMSET', key, 'tokens', tokens, 'last_refill', now)
      redis.call('EXPIRE', key, math.ceil(capacity / refill_rate) * 2)

      return { allowed and 1 or 0, tokens, math.ceil(capacity / refill_rate) }
    `;

    const result = await client.eval(script, [key], [capacity, refillRate, now]) as [number, number, number];

    const allowed = result[0] === 1;
    const remaining = Math.floor(result[1]);
    const resetAt = Date.now() + (result[2] * 1000);

    return { allowed, remaining, resetAt };
  } catch (error) {
    console.error("Token bucket rate limiting error:", error);
    // Fail open
    return { allowed: true, remaining: capacity - 1, resetAt: Date.now() + (capacity / refillRate * 1000) };
  }
}

// Fixed Window - for admin actions (simpler, sufficient for low-frequency operations)
export async function fixedWindowRateLimit(
  identifier: string,
  endpoint: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const client = getRedisClient();
  const now = Math.floor(Date.now() / 1000);
  const window = Math.floor(now / windowSeconds);
  const key = `fixedwindow:${endpoint}:${identifier}:${window}`;

  try {
    const count = await client.incr(key);
    if (count === 1) {
      await client.expire(key, windowSeconds * 2); // Expire after 2 windows
    }

    const allowed = count <= limit;
    const remaining = Math.max(0, limit - count);
    const resetAt = (window + 1) * windowSeconds * 1000;

    return { allowed, remaining, resetAt };
  } catch (error) {
    console.error("Fixed window rate limiting error:", error);
    // Fail open
    return { allowed: true, remaining: limit - 1, resetAt: (now + windowSeconds) * 1000 };
  }
}

// Endpoint-specific limits (constants)
export const RATE_LIMITS = {
  // OTP endpoints - strict limits due to SMS costs and abuse potential
  OTP_REQUEST: { limit: 3, window: 300 }, // 3 requests per 5 minutes per phone
  OTP_VERIFY: { limit: 5, window: 900 }, // 5 attempts per 15 minutes per phone

  // Booking endpoints
  RECURRING_BOOKING: { limit: 10, window: 3600 }, // 10 requests per hour per user
  CANCEL_RECURRING_BOOKING: { limit: 20, window: 3600 }, // 20 cancellations per hour per user

  // Admin endpoints
  RECURRING_AVAILABILITY: { limit: 20, window: 3600 }, // 20 requests per hour per admin
  CANCEL_RECURRING_AVAILABILITY: { limit: 30, window: 3600 }, // 30 requests per hour per admin
  DELETE_USER: { limit: 5, window: 3600 }, // 5 deletions per hour per admin

  // Notification endpoints
  SEND_EMAIL: { limit: 10, window: 3600 }, // 10 emails per hour per recipient
  SEND_SMS: { limit: 5, window: 3600 }, // 5 SMS per hour per phone (expensive)
  BOOKING_RESPONSE: { limit: 3, window: 3600 }, // 3 responses per hour per token

  // Global protection
  GLOBAL_IP: { limit: 100, window: 60 }, // 100 requests per minute per IP (DDoS protection)
  GLOBAL_USER: { limit: 200, window: 60 }, // 200 requests per minute per user
} as const;

// Error response helper
export function createRateLimitResponse(resetAt: number): Response {
  const headers = new Headers({
    ...corsHeaders,
    "Content-Type": "application/json",
    "X-RateLimit-Reset": Math.floor(resetAt / 1000).toString(),
    "Retry-After": Math.ceil((resetAt - Date.now()) / 1000).toString(),
  });

  return new Response(
    JSON.stringify({
      error: "Too many requests",
      message: "Rate limit exceeded. Please try again later.",
      retryAfter: Math.ceil((resetAt - Date.now()) / 1000),
    }),
    {
      status: 429,
      headers,
    }
  );
}

// Multi-layer rate limiting helper
export async function checkMultiLayerRateLimit(
  layers: Array<{ identifier: string; endpoint: string; limit: number; window: number }>
): Promise<RateLimitResult> {
  let mostRestrictive: RateLimitResult = { allowed: true, remaining: Infinity, resetAt: Date.now() };

  for (const layer of layers) {
    const result = await slidingWindowRateLimit(layer.identifier, layer.endpoint, layer.limit, layer.window);

    if (!result.allowed) {
      return result; // Immediately return if any layer blocks
    }

    // Update most restrictive result
    if (result.remaining < mostRestrictive.remaining) {
      mostRestrictive = result;
    }
    if (result.resetAt > mostRestrictive.resetAt) {
      mostRestrictive.resetAt = result.resetAt;
    }
  }

  return mostRestrictive;
}
