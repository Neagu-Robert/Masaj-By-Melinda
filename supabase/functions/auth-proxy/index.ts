import { compose, corsMiddleware, globalIPRateLimitMiddleware, rateLimitMiddleware, validationMiddleware, loggingMiddleware, errorHandlerMiddleware, createJsonResponse, createErrorResponse } from '../_shared/middleware.ts';
import { AuthProxySchema, sanitizeEmail } from '../_shared/validation.ts';
import { createAdminClient } from '../_shared/supabase-client.ts';
import { logAuthFailure, logSecurityEvent } from '../_shared/logger.ts';

// Handler function with security layers
const handler = async (req: Request, context: any) => {
  const { email, password } = context.validatedData;

  // Normalize email for consistent processing
  const normalizedEmail = sanitizeEmail(email);

  try {
    // Use admin client to bypass RLS for auth operations
    const supabase = createAdminClient();

    // Call Supabase Auth server-side to authenticate user
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: password,
    });

    // Handle authentication failure
    if (error || !data.session) {
      // Extract domain from email for logging (avoid logging full email)
      const emailDomain = normalizedEmail.includes('@') 
        ? normalizedEmail.split('@')[1] 
        : 'unknown';

      logAuthFailure(context.endpoint, `Login failed for domain: ${emailDomain}`, req);

      // Return generic error message to prevent user enumeration
      return createErrorResponse(
        'Something went wrong, try again',
        401,
        'AUTH_FAILED',
        context.rateLimitInfo
      );
    }

    // Success - return session tokens and user data
    return createJsonResponse({
      session: data.session,
      user: data.user,
    }, 200, context.rateLimitInfo);

  } catch (error) {
    // Log critical errors
    logSecurityEvent('auth_proxy_error', req, {
      error: error instanceof Error ? error.message : 'Unknown error',
      emailDomain: normalizedEmail.includes('@') 
        ? normalizedEmail.split('@')[1] 
        : 'unknown',
    });

    // Return generic error message
    return createErrorResponse(
      'Something went wrong, try again',
      500,
      'AUTH_FAILED',
      context.rateLimitInfo
    );
  }
};

// Apply security middleware stack
const securedHandler = compose(
  corsMiddleware,
  globalIPRateLimitMiddleware,
  loggingMiddleware,
  errorHandlerMiddleware,
  // Validate request body first (needed for email-based rate limiting)
  validationMiddleware(AuthProxySchema),
  // Rate limit by email (5 attempts per 4 minutes)
  rateLimitMiddleware({
    identifier: (req, context) => sanitizeEmail(context.validatedData?.email || 'unknown'),
    endpoint: 'auth-proxy-email',
    limit: 5,
    window: 240, // 4 minutes
    strategy: 'sliding',
  }),
  // Additional IP-based rate limiting (5 attempts per 4 minutes)
  rateLimitMiddleware({
    identifier: (req, context) => context.ip || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown',
    endpoint: 'auth-proxy-ip',
    limit: 5,
    window: 240, // 4 minutes
    strategy: 'sliding',
  })
)(handler);

// Export the secured handler
Deno.serve(securedHandler);
