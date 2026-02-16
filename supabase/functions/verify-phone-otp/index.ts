import { createAdminClient } from '../_shared/supabase-client.ts';
import { compose, corsMiddleware, globalIPRateLimitMiddleware, rateLimitMiddleware, validationMiddleware, loggingMiddleware, errorHandlerMiddleware, createJsonResponse, createErrorResponse, RATE_LIMITS } from '../_shared/middleware.ts';
import { requireAuth } from '../_shared/auth.ts';
import { VerifyPhoneOTPSchema } from '../_shared/validation.ts';
import { logOTPEvent } from '../_shared/logger.ts';
import { Redis } from "https://esm.sh/@upstash/redis@1.28.0";

const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_SID');
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');
const TWILIO_VERIFY_SID = Deno.env.get('TWILIO_VERIFY_SID');

// Timing attack mitigation - consistent response delay
const VERIFICATION_DELAY = 1000; // 1 second

// OTP failure tracking for escalating lockout
const OTP_FAILURE_THRESHOLD = 5; // Lock out after 5 failures
const OTP_LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes lockout
const FAILURE_WINDOW = 15 * 60 * 1000; // Track failures for 15 minutes

let redis: Redis;

function getRedisClient(): Redis {
  if (!redis) {
    const url = Deno.env.get("UPSTASH_REDIS_REST_URL");
    const token = Deno.env.get("UPSTASH_REDIS_REST_TOKEN");

    if (!url || !token) {
      throw new Error("Missing Upstash Redis configuration");
    }

    redis = new Redis({
      url,
      token,
    });
  }
  return redis;
}

// Check if phone/IP is currently locked out due to excessive failures
async function checkOTPLockout(phone: string, ip: string): Promise<{ locked: boolean; lockoutExpiresAt?: number }> {
  try {
    const client = getRedisClient();
    const now = Date.now();

    // Check phone lockout
    const phoneLockoutKey = `otp:lockout:phone:${phone}`;
    const phoneLockout = await client.get(phoneLockoutKey);

    if (phoneLockout && parseInt(phoneLockout as string) > now) {
      return { locked: true, lockoutExpiresAt: parseInt(phoneLockout as string) };
    }

    // Check IP lockout
    const ipLockoutKey = `otp:lockout:ip:${ip}`;
    const ipLockout = await client.get(ipLockoutKey);

    if (ipLockout && parseInt(ipLockout as string) > now) {
      return { locked: true, lockoutExpiresAt: parseInt(ipLockout as string) };
    }

    return { locked: false };
  } catch (error) {
    console.error('Error checking OTP lockout:', error);
    // Fail open - allow attempt if Redis is unavailable
    return { locked: false };
  }
}

// Get current failure count for phone/IP combination
async function getOTPFailureCount(phone: string, ip: string): Promise<number> {
  try {
    const client = getRedisClient();
    const now = Date.now();
    const windowStart = now - FAILURE_WINDOW;

    // Clean up old failures and count current ones
    const phoneKey = `otp:failures:phone:${phone}`;
    const ipKey = `otp:failures:ip:${ip}`;

    // Remove old entries and count remaining
    await client.zremrangebyscore(phoneKey, 0, windowStart);
    await client.zremrangebyscore(ipKey, 0, windowStart);

    const phoneCount = await client.zcard(phoneKey);
    const ipCount = await client.zcard(ipKey);

    // Use the higher count for more restrictive behavior
    return Math.max(phoneCount, ipCount);
  } catch (error) {
    console.error('Error getting OTP failure count:', error);
    return 0; // Fail open
  }
}

// Record an OTP verification failure
async function recordOTPFailure(phone: string, ip: string): Promise<void> {
  try {
    const client = getRedisClient();
    const now = Date.now();

    const phoneKey = `otp:failures:phone:${phone}`;
    const ipKey = `otp:failures:ip:${ip}`;

    // Add failure timestamp to sorted sets
    await client.zadd(phoneKey, now, now.toString());
    await client.zadd(ipKey, now, now.toString());

    // Set expiry on the keys
    await client.expire(phoneKey, Math.ceil(FAILURE_WINDOW / 1000) + 60);
    await client.expire(ipKey, Math.ceil(FAILURE_WINDOW / 1000) + 60);

    // Check if we should lock out
    const failureCount = await getOTPFailureCount(phone, ip);
    if (failureCount >= OTP_FAILURE_THRESHOLD) {
      const lockoutExpiresAt = now + OTP_LOCKOUT_DURATION;

      const phoneLockoutKey = `otp:lockout:phone:${phone}`;
      const ipLockoutKey = `otp:lockout:ip:${ip}`;

      await client.setex(phoneLockoutKey, Math.ceil(OTP_LOCKOUT_DURATION / 1000), lockoutExpiresAt.toString());
      await client.setex(ipLockoutKey, Math.ceil(OTP_LOCKOUT_DURATION / 1000), lockoutExpiresAt.toString());
    }
  } catch (error) {
    console.error('Error recording OTP failure:', error);
    // Don't fail the request if we can't record the failure
  }
}

// Clear failure records on successful verification
async function clearOTPFailures(phone: string, ip: string): Promise<void> {
  try {
    const client = getRedisClient();

    const phoneKey = `otp:failures:phone:${phone}`;
    const ipKey = `otp:failures:ip:${ip}`;
    const phoneLockoutKey = `otp:lockout:phone:${phone}`;
    const ipLockoutKey = `otp:lockout:ip:${ip}`;

    await Promise.all([
      client.del(phoneKey),
      client.del(ipKey),
      client.del(phoneLockoutKey),
      client.del(ipLockoutKey),
    ]);
  } catch (error) {
    console.error('Error clearing OTP failures:', error);
    // Don't fail the request if we can't clear failures
  }
}

// Handler function with security layers
const handler = async (req: Request, context: any) => {
  const { phone, otp, userId } = context.validatedData;
  const startTime = Date.now();

  // Check if phone/IP is currently locked out
  const lockoutCheck = await checkOTPLockout(phone, context.ip || 'unknown');
  if (lockoutCheck.locked) {
    logOTPEvent('otp_failed', phone, req, {
      reason: 'lockout_active',
      lockoutExpiresAt: lockoutCheck.lockoutExpiresAt,
      userId: userId || 'guest',
    });

    return createErrorResponse('Too many failed attempts. Please try again later.', 429, 'TOO_MANY_ATTEMPTS', context.rateLimitInfo);
  }

  // Get current failure count for escalating delay
  const failureCount = await getOTPFailureCount(phone, context.ip || 'unknown');
  const escalatingDelay = VERIFICATION_DELAY + (failureCount * 500); // Add 500ms per failure

  // If userId is provided, verify it matches authenticated user
  if (userId) {
    if (!context.user) {
      return createErrorResponse('Authentication required to update profile.', 401, 'AUTHENTICATION_REQUIRED', context.rateLimitInfo);
    }

    // Verify the provided userId matches the authenticated user
    // In Supabase, the user ID from auth is context.user.id
    if (userId !== context.user.id) {
      return createErrorResponse('Cannot update profile for different user.', 403, 'FORBIDDEN', context.rateLimitInfo);
    }
  }

  // Check Twilio configuration
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_VERIFY_SID) {
    return createErrorResponse('Phone verification service is not configured.', 500, 'SERVICE_UNAVAILABLE', context.rateLimitInfo);
  }

  try {
    const twilioUrl = `https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SID}/VerificationCheck`;
    const authHeader = 'Basic ' + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: phone,
        Code: otp,
      }).toString(),
    });

    const result = await response.json();
    const isValidOTP = response.ok && result.status === 'approved';

    if (isValidOTP) {
      // Clear failure records on successful verification
      await clearOTPFailures(phone, context.ip || 'unknown');

      // Log successful verification
      logOTPEvent('otp_verified', phone, req, {
        userId: userId || 'guest',
        twilioSid: result.sid,
      });

      // Update profile if userId provided
      if (userId) {
        const supabase = createAdminClient();
        const { error: profileUpdateError } = await supabase
          .from('profiles')
          .update({
            phone: phone,
            phone_verified: true,
            phone_verified_at: new Date().toISOString(),
          })
          .eq('id', userId);

        if (profileUpdateError) {
          console.error('Profile update failed:', profileUpdateError);
          // Log but don't fail the verification
        }
      }

      // Apply escalating timing delay to prevent timing attacks
      const elapsed = Date.now() - startTime;
      if (elapsed < escalatingDelay) {
        await new Promise(resolve => setTimeout(resolve, escalatingDelay - elapsed));
      }

      return createJsonResponse({
        success: true,
        message: 'Phone number verified successfully.',
      }, 200, context.rateLimitInfo);

    } else {
      // Record the failure for lockout tracking
      await recordOTPFailure(phone, context.ip || 'unknown');

      // Log failed verification attempt
      const failureReason = !response.ok ? 'twilio_error' : 'invalid_otp';
      logOTPEvent('otp_failed', phone, req, {
        reason: failureReason,
        userId: userId || 'guest',
        twilioError: result.message,
        failureCount: failureCount + 1,
      });

      // Apply escalating timing delay to prevent timing attacks
      const elapsed = Date.now() - startTime;
      if (elapsed < escalatingDelay) {
        await new Promise(resolve => setTimeout(resolve, escalatingDelay - elapsed));
      }

      return createErrorResponse('Invalid verification code.', 400, 'INVALID_OTP', context.rateLimitInfo);
    }

  } catch (error) {
    // Log unexpected errors
    logOTPEvent('otp_failed', phone, req, {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: userId || 'guest',
    });

    // Apply timing delay even for errors
    const elapsed = Date.now() - startTime;
    if (elapsed < VERIFICATION_DELAY) {
      await new Promise(resolve => setTimeout(resolve, VERIFICATION_DELAY - elapsed));
    }

    return createErrorResponse('Verification failed. Please try again.', 500, 'VERIFICATION_FAILED', context.rateLimitInfo);
  }
};

// Apply security middleware
const securedHandler = compose(
  corsMiddleware,
  globalIPRateLimitMiddleware,
  loggingMiddleware,
  errorHandlerMiddleware,
  // Validate request body first (needed for phone-based rate limiting)
  validationMiddleware(VerifyPhoneOTPSchema),
  // Conditional authentication (only required if userId is provided in request)
  async (req, context) => {
    const { userId } = context.validatedData || {};
    if (userId) {
      // Require authentication when userId is provided
      const authResult = await requireAuth(req);
      if (authResult instanceof Response) {
        return authResult;
      }
      context.user = authResult.user;
    }
    // No authentication required for guest verification
  },
  // Rate limit by phone number (token bucket for burst tolerance)
  rateLimitMiddleware({
    identifier: (req, context) => context.validatedData?.phone || 'unknown',
    endpoint: 'verify-phone-otp',
    limit: RATE_LIMITS.OTP_VERIFY.limit,
    window: RATE_LIMITS.OTP_VERIFY.window,
    strategy: 'token',
    failClosed: true,
  }),
  // Additional IP-based rate limiting
  rateLimitMiddleware({
    identifier: (req, context) => context.ip || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown',
    endpoint: 'verify-phone-otp-ip',
    limit: 15,
    window: 900, // 20 attempts per 15 minutes per IP
    failClosed: true,
  })
)(handler);

// Export the secured handler
Deno.serve(securedHandler);
