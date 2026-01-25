import { compose, corsMiddleware, rateLimitMiddleware, validationMiddleware, loggingMiddleware, errorHandlerMiddleware, createJsonResponse, createErrorResponse } from '../_shared/middleware.ts';
import { SendEmailSchema } from '../_shared/validation.ts';

const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY');
const SENDER_EMAIL = Deno.env.get('BREVO_FROM_EMAIL') || 'masajbymelinda@gmail.com';
const SENDER_NAME = Deno.env.get('BREVO_FROM_NAME') || 'Masaj by Melinda';

// Handler function with security layers
const handler = async (req: Request, context: any) => {
  const { to, subject, htmlContent, textContent } = context.validatedData;

  // Check Brevo configuration
  if (!BREVO_API_KEY) {
    return createErrorResponse('Email service is not configured.', 500, 'SERVICE_UNAVAILABLE', context.rateLimitInfo);
  }

  try {
    const brevoPayload = {
      sender: {
        name: SENDER_NAME,
        email: SENDER_EMAIL,
      },
      to: [
        {
          email: to,
        },
      ],
      subject,
      htmlContent,
      textContent,
    };

    console.log('Attempting to send email to:', to);
    console.log('From:', SENDER_EMAIL);
    console.log('Subject:', subject);
    console.log('Brevo payload:', JSON.stringify(brevoPayload, null, 2));

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(brevoPayload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Brevo API error:', response.status, errorBody);
      return createErrorResponse('Failed to send email.', 500, 'EMAIL_SEND_FAILED', context.rateLimitInfo);
    }

    const result = await response.json();
    console.log('Email sent successfully via Brevo. Message ID:', result.messageId);

    return createJsonResponse({
      success: true,
      status: 'SENT',
      messageId: result.messageId || `email_${Date.now()}`,
      to: to, // Include recipient for confirmation
    }, 200, context.rateLimitInfo);

  } catch (error) {
    console.error('Error sending email:', error);
    return createErrorResponse('Failed to send email.', 500, 'EMAIL_SEND_FAILED', context.rateLimitInfo);
  }
};

// Apply security middleware
const securedHandler = compose(
  corsMiddleware,
  loggingMiddleware,
  errorHandlerMiddleware,
  validationMiddleware(SendEmailSchema),
  // Rate limit by recipient email
  rateLimitMiddleware({
    identifier: (req, context) => context.validatedData?.to || 'unknown',
    endpoint: 'send-email',
    limit: 10,
    window: 3600, // 10 emails per hour per recipient
  }),
  // Additional IP-based rate limiting
  rateLimitMiddleware({
    identifier: (req, context) => context.ip || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown',
    endpoint: 'send-email-ip',
    limit: 50,
    window: 3600, // 50 emails per hour per IP
  })
)(handler);

// Export the secured handler
Deno.serve(securedHandler);