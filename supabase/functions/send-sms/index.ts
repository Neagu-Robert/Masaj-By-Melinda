import { compose, corsMiddleware, rateLimitMiddleware, validationMiddleware, loggingMiddleware, errorHandlerMiddleware, createJsonResponse, createErrorResponse } from '../_shared/middleware.ts';
import { SendSMSSchema } from '../_shared/validation.ts';

const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_SID');
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');
const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER');

// Handler function with security layers
const handler = async (req: Request, context: any) => {
  const { to, message } = context.validatedData;

  // Validate internal shared secret (DB trigger → send-sms authentication)
  // Fail-closed: if the secret is not configured, reject the request entirely.
  const expectedSecret = Deno.env.get('INTERNAL_SMS_SHARED_SECRET');
  const providedSecret = req.headers.get('x-internal-secret');

  if (!expectedSecret) {
    console.error('[send-sms] INTERNAL_SMS_SHARED_SECRET not configured — rejecting request (fail-closed)');
    return createErrorResponse('SMS service is not properly configured.', 500, 'SERVICE_UNAVAILABLE', context.rateLimitInfo);
  }

  if (providedSecret !== expectedSecret) {
    return createErrorResponse('Unauthorized', 401, 'UNAUTHORIZED', context.rateLimitInfo);
  }

  // Check Twilio configuration
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    return createErrorResponse('SMS service credentials are not configured.', 500, 'SERVICE_UNAVAILABLE', context.rateLimitInfo);
  }

  if (!TWILIO_PHONE_NUMBER) {
    return createErrorResponse('SMS sender number is not configured.', 500, 'SERVICE_UNAVAILABLE', context.rateLimitInfo);
  }

  try {
    console.log('Attempting to send SMS to:', to);
    console.log('Message:', message);
    console.log('From:', TWILIO_PHONE_NUMBER);

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;

    const body = new URLSearchParams();
    body.append('To', to);
    body.append('From', TWILIO_PHONE_NUMBER);
    body.append('Body', message);

    const authHeader = 'Basic ' + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

    // Send SMS via Twilio API
    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    const result = await response.json();
    console.log('Twilio response status:', response.status);
    console.log('Twilio response body:', JSON.stringify(result, null, 2));

    if (!response.ok) {
      console.error('Twilio API error:', result);
      return createErrorResponse(result.message || 'Failed to send SMS.', 500, 'SMS_SEND_FAILED', context.rateLimitInfo);
    }

    console.log('SMS sent successfully. Message SID:', result.sid);
    console.log('SMS status:', result.status);

    return createJsonResponse({
      success: true,
      messageId: result.sid,
      status: result.status.toUpperCase(),
      to: to, // Include recipient for confirmation
    }, 200, context.rateLimitInfo);

  } catch (error) {
    console.error('Error sending SMS:', error);
    return createErrorResponse('Failed to send SMS.', 500, 'SMS_SEND_FAILED', context.rateLimitInfo);
  }
};

// Apply security middleware
const securedHandler = compose(
  corsMiddleware,
  loggingMiddleware,
  errorHandlerMiddleware,
  validationMiddleware(SendSMSSchema),
  // Rate limit by phone number (SMS cost protection)
  rateLimitMiddleware({
    identifier: (req, context) => context.validatedData?.to || 'unknown',
    endpoint: 'send-sms',
    limit: 5,
    window: 3600, // 5 SMS per hour per phone (expensive)
  }),
  // Additional IP-based rate limiting
  rateLimitMiddleware({
    identifier: (req, context) => context.ip || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown',
    endpoint: 'send-sms-ip',
    limit: 20,
    window: 3600, // 20 SMS per hour per IP
  })
)(handler);

// Export the secured handler
Deno.serve(securedHandler);