import { createAdminClient } from '../_shared/supabase-client.ts';
import { compose, corsMiddleware, rateLimitMiddleware, validationMiddleware, loggingMiddleware, errorHandlerMiddleware, createJsonResponse, createErrorResponse } from '../_shared/middleware.ts';
import { BookingResponseSchema } from '../_shared/validation.ts';
import { logSecurityEvent } from '../_shared/logger.ts';

// import { Twilio } from 'https://esm.sh/twilio@4.19.0';

// Handler function with security layers
const handler = async (req: Request, context: any) => {
  const { token, response, reason } = context.validatedData;
  const supabase = createAdminClient();

  try {
    // Validate token exists and is unused in booking_tokens table
    const { data: tokenData, error: tokenError } = await supabase
      .from('booking_response_tokens')
      .select('*')
      .eq('token', token)
      .is('used_at', null) // Only unused tokens
      .single();

    if (tokenError || !tokenData) {
      logSecurityEvent('invalid_token_used', req, {
        token: token.substring(0, 8) + '...', // Log partial token for debugging
        error: tokenError?.message || 'Token not found or already used'
      });
      return createErrorResponse('Token invalid sau deja folosit.', 400, 'INVALID_TOKEN', context.rateLimitInfo);
    }

    // Check if token is expired
    if (new Date(tokenData.expires_at) < new Date()) {
      logSecurityEvent('expired_token_used', req, {
        tokenId: tokenData.id,
        expiredAt: tokenData.expires_at
      });
      return createErrorResponse('Token expirat.', 400, 'TOKEN_EXPIRED', context.rateLimitInfo);
    }

    // Update booking status and mark token as used
    const { data: updatedBooking, error: updateError } = await supabase
      .rpc('handle_booking_response', {
        p_booking_id: tokenData.booking_id,
        p_token_id: tokenData.id,
        p_action: response,
      })
      .single();

    if (updateError || !updatedBooking) {
      logSecurityEvent('booking_update_failed', req, {
        tokenId: tokenData.id,
        bookingId: tokenData.booking_id,
        action: response,
        error: updateError?.message
      });
      return createErrorResponse('Nu s-a putut actualiza rezervarea.', 500, 'UPDATE_FAILED', context.rateLimitInfo);
    }

    // Log successful event
    logSecurityEvent('booking_response_processed', req, {
      tokenId: tokenData.id,
      bookingId: tokenData.booking_id,
      action: response,
      reason: reason || null
    });

    return createJsonResponse({
      success: true,
      action: response,
      bookingId: tokenData.booking_id,
      message: `Rezervarea a fost ${response === 'accept' ? 'acceptată' : 'refuzată'} cu succes.`
    }, 200, context.rateLimitInfo);

  } catch (error) {
    console.error('Booking response error:', error);
    logSecurityEvent('booking_response_error', req, {
      error: error instanceof Error ? error.message : String(error)
    });
    return createErrorResponse('Eroare internă la procesarea răspunsului.', 500, 'INTERNAL_ERROR', context.rateLimitInfo);
  }
};

// Apply security middleware
const securedHandler = compose(
  corsMiddleware,
  loggingMiddleware,
  errorHandlerMiddleware,
  validationMiddleware(BookingResponseSchema),
  rateLimitMiddleware({
    identifier: (req, context) => context.validatedData?.token || 'unknown',
    endpoint: 'booking-response',
    limit: 3,
    window: 3600, // 3 responses per hour per token
  })
)(handler);

// Export the secured handler
Deno.serve(securedHandler);
