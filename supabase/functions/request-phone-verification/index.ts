import { compose, corsMiddleware, globalIPRateLimitMiddleware, rateLimitMiddleware, validationMiddleware, loggingMiddleware, errorHandlerMiddleware, createJsonResponse, createErrorResponse, RATE_LIMITS } from '../_shared/middleware.ts';
import { RequestPhoneVerificationSchema } from '../_shared/validation.ts';
import { logOTPEvent } from '../_shared/logger.ts';
import { captureException } from '../_shared/sentry.ts';

const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_SID');
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');
const TWILIO_VERIFY_SID = Deno.env.get('TWILIO_VERIFY_SID');

// Handler function with security layers
const handler = async (req: Request, context: any) => {
  const { phone } = context.validatedData;

  // Check Twilio configuration
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_VERIFY_SID) {
    return createErrorResponse('SMS service is not configured.', 500, 'SERVICE_UNAVAILABLE', context.rateLimitInfo);
  }

  try {
    const twilioUrl = `https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SID}/Verifications`;
    const authHeader = 'Basic ' + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: phone,
        Channel: 'sms',
      }).toString(),
    });

    const result = await response.json();

    if (!response.ok) {
      logOTPEvent('otp_failed', phone, req, {
        twilioError: result.message || 'Unknown Twilio error',
        statusCode: response.status,
      });

      // Check for Twilio rate-limit errors before generic 500 fallback
      const twilioErrorCode = result.code;
      const isRateLimitError =
        twilioErrorCode === 60203 || // Max send attempts reached for this number
        twilioErrorCode === 60212 || // Too many concurrent requests
        twilioErrorCode === 20429 || // Too many requests (general)
        response.status === 429;     // HTTP 429 from Twilio

      if (isRateLimitError) {
        // Send to Sentry with lower severity for expected rate-limit errors
        captureException(new Error('Twilio rate limit exceeded'), {
          tags: { layer: 'backend', function: 'request-phone-verification', feature: 'otp', severity: 'warning' },
          extra: { statusCode: response.status, twilioCode: twilioErrorCode }
        });

        return createErrorResponse('Rate limit exceeded. Please wait before requesting another code.', 429, 'PROVIDER_RATE_LIMITED', context.rateLimitInfo, { retryAfter: 60 });
      }

      // Send to Sentry for other Twilio errors
      captureException(new Error('Twilio SMS send failed'), {
        tags: { layer: 'backend', function: 'request-phone-verification', feature: 'otp', severity: 'critical' },
        extra: { statusCode: response.status }
      });

      // Don't expose Twilio errors to client
      return createErrorResponse('Failed to send verification code. Please try again.', 500, 'SMS_SEND_FAILED', context.rateLimitInfo);
    }

    // Log successful OTP request
    logOTPEvent('otp_requested', phone, req, {
      twilioSid: result.sid,
    });

    return createJsonResponse({
      success: true,
      message: 'Verification code sent successfully.',
      // Don't expose sensitive timing information
    }, 200, context.rateLimitInfo);

  } catch (error) {
    logOTPEvent('otp_failed', phone, req, {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    // Send to Sentry
    if (error instanceof Error) {
      captureException(error, {
        tags: { layer: 'backend', function: 'request-phone-verification', feature: 'otp', severity: 'critical' }
      });
    }

    return createErrorResponse('Failed to send verification code. Please try again.', 500, 'SMS_SEND_FAILED', context.rateLimitInfo);
  }
};

// Apply security middleware
const securedHandler = compose(
  corsMiddleware,
  globalIPRateLimitMiddleware,
  loggingMiddleware,
  errorHandlerMiddleware,
  // Validate request body first (needed for phone-based rate limiting)
  validationMiddleware(RequestPhoneVerificationSchema),
  // Rate limit by phone number (sliding window)
  rateLimitMiddleware({
    identifier: (req, context) => context.validatedData?.phone || 'unknown',
    endpoint: 'request-phone-verification',
    limit: RATE_LIMITS.OTP_REQUEST.limit,
    window: RATE_LIMITS.OTP_REQUEST.window,
    strategy: 'sliding',
    failClosed: true,
  }),
  // Additional IP-based rate limiting
  rateLimitMiddleware({
    identifier: (req, context) => context.ip || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown',
    endpoint: 'request-phone-verification-ip',
    limit: 5,
    window: 300, // 10 requests per 5 minutes per IP
    failClosed: true,
  })
)(handler);

// Export the secured handler
Deno.serve(securedHandler);
