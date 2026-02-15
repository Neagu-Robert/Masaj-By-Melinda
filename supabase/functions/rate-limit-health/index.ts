// Rate Limit Health Check Edge Function
// Validates Upstash Redis integration and all three rate limiting algorithms

// Minimal imports - NO supabase-js or auth dependencies to keep cold start fast
import {
  slidingWindowRateLimit,
  tokenBucketRateLimit,
  fixedWindowRateLimit,
} from "../_shared/rate-limit.ts";
// @ts-expect-error - Deno runtime supports ESM imports from URLs
import { Redis } from "https://esm.sh/@upstash/redis@1.28.0";

// --- MINIMAL CORS HEADERS (no middleware.ts dependency) ---
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

// --- MINIMAL LOGGING (no logger.ts dependency) ---
function simpleLog(level: string, message: string, context?: Record<string, any>): void {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    endpoint: 'rate-limit-health',
    message,
    context,
  }));
}

// --- RESPONSE HELPERS ---
function createJsonResponse(data: any, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders,
  });
}

// --- MAIN HANDLER ---
async function handler(req: Request): Promise<Response> {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  // 1. SAFETY TIMEOUT: Force fail if logic takes > 5 seconds
  // This prevents "Zombie" functions that hang forever
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<Response>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error("Function execution timed out internally")), 5000);
  });

  const logicPromise = (async () => {
    const startTime = Date.now();
    simpleLog("INFO", "Rate limit health check started", { endpoint: "rate-limit-health" });

    // Initialize response
    const response = {
      timestamp: startTime,
      redis: { connected: false, latency: 0, error: undefined as string | undefined },
      algorithms: {
        slidingWindow: { success: false, latency: 0, error: undefined as string | undefined },
        tokenBucket: { success: false, latency: 0, error: undefined as string | undefined },
        fixedWindow: { success: false, latency: 0, error: undefined as string | undefined },
      },
      summary: { allTestsPassed: false, totalLatency: 0, recommendations: [] as string[] },
    };

    // --- SETUP & VALIDATION ---
    // @ts-expect-error
    const url = Deno.env.get("UPSTASH_REDIS_REST_URL");
    // @ts-expect-error
    const token = Deno.env.get("UPSTASH_REDIS_REST_TOKEN");

    if (!url || !token) {
      response.summary.recommendations.push("Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN");
      return createJsonResponse(response, 500);
    }

    // --- REDIS CONNECTION TEST ---
    const redisStart = Date.now();
    const redis = new Redis({ url, token });
    try {
      const ping = await redis.ping(); // PING is faster than SET/GET
      response.redis.connected = (ping === "PONG");
      response.redis.latency = Date.now() - redisStart;
    } catch (err) {
      response.redis.error = String(err);
      response.redis.latency = Date.now() - redisStart;
      return createJsonResponse(response, 500); // Fail fast if Redis is down
    }

    // --- PARALLEL ALGORITHM TESTS ---
    if (response.redis.connected) {
      const id = `test-${Date.now()}`;
      
      // Helper for cleaner parallel calls
      const runTest = async (fn: any, name: string) => {
        const start = Date.now();
        try {
          await fn(id, name, 10, 60); // Run ONCE
          return { success: true, latency: Date.now() - start, error: undefined };
        } catch (e) {
          return { success: false, latency: Date.now() - start, error: String(e) };
        }
      };

      const [sliding, tokenResult, fixed] = await Promise.all([
        runTest(slidingWindowRateLimit, "health-check-sliding"),
        runTest(tokenBucketRateLimit, "health-check-token"),
        runTest(fixedWindowRateLimit, "health-check-fixed"),
      ]);

      response.algorithms.slidingWindow = sliding;
      response.algorithms.tokenBucket = tokenResult;
      response.algorithms.fixedWindow = fixed;
    }

    // --- SUMMARY ---
    response.summary.totalLatency = Date.now() - startTime;
    response.summary.allTestsPassed = 
      response.redis.connected && 
      response.algorithms.slidingWindow.success && 
      response.algorithms.tokenBucket.success && 
      response.algorithms.fixedWindow.success;

    // Log completion
    simpleLog("INFO", "Health check finished", { latency: response.summary.totalLatency });

    return createJsonResponse(response, response.summary.allTestsPassed ? 200 : 500);
  })();

  // Race the logic against the timeout, then clear the timer
  try {
    const result = await Promise.race([logicPromise, timeoutPromise]);
    return result;
  } catch (err) {
    console.error("CRASH:", err);
    return createJsonResponse({ error: String(err) }, 500);
  } finally {
    // CRITICAL: Clear timeout to prevent delayed rejection after response is sent
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  }
}

// --- MODERN NATIVE SERVER ---
// Wire Deno.serve directly to slim handler (no middleware bloat)
// @ts-expect-error
Deno.serve(async (req) => {
  try {
    return await handler(req);
  } catch (err) {
    console.error("HANDLER FAILURE:", err);
    return createJsonResponse({ error: "Internal Server Error" }, 500);
  }
});