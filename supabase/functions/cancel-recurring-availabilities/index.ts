import { createAdminClient } from '../_shared/supabase-client.ts';
import { compose, corsMiddleware, adminMiddleware, rateLimitMiddleware, validationMiddleware, loggingMiddleware, errorHandlerMiddleware, createJsonResponse, createErrorResponse } from '../_shared/middleware.ts';
import { CancelRecurringAvailabilitiesSchema } from '../_shared/validation.ts';
import { logAdminAction } from '../_shared/auth.ts';

// Handler function with security layers
const handler = async (req: Request, context: any) => {
  const { recurringId } = context.validatedData;
  const supabase = createAdminClient();

  try {
    // Verify the recurring availability exists
    const { data: existing, error: checkError } = await supabase
      .from('recurring_availabilities')
      .select('id')
      .eq('id', recurringId)
      .single();

    if (checkError || !existing) {
      return createErrorResponse('Recurring availability not found.', 404, 'NOT_FOUND', context.rateLimitInfo);
    }

    // Delete parent row; FK cascade removes generated availability rows
    const { error: delErr } = await supabase
      .from('recurring_availabilities')
      .delete()
      .eq('id', recurringId);

    if (delErr) {
      console.error('Delete recurring availability error:', delErr);
      return createErrorResponse('Failed to cancel recurring availability.', 500, 'DELETE_FAILED', context.rateLimitInfo);
    }

    // Log admin action
    logAdminAction('cancel_recurring_availabilities', context.user.id, recurringId, {}, req);

    return createJsonResponse({
      success: true,
      message: 'Recurring availability cancelled successfully.',
    }, 200, context.rateLimitInfo);

  } catch (error) {
    console.error('Cancel recurring availability error:', error);
    return createErrorResponse('Failed to cancel recurring availability.', 500, 'INTERNAL_ERROR', context.rateLimitInfo);
  }
};

// Apply security middleware
const securedHandler = compose(
  corsMiddleware,
  loggingMiddleware,
  errorHandlerMiddleware,
  adminMiddleware, // CRITICAL: Require admin role
  rateLimitMiddleware({
    identifier: (req, context) => context.user?.id || 'unknown',
    endpoint: 'cancel-recurring-availabilities',
    limit: 30,
    window: 3600, // 30 requests per hour per admin
  }),
  validationMiddleware(CancelRecurringAvailabilitiesSchema)
)(handler);

// Export the secured handler
Deno.serve(securedHandler);


