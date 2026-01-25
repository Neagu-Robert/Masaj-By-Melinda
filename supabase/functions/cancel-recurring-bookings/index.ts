import { createAdminClient } from '../_shared/supabase-client.ts';
import { compose, corsMiddleware, authMiddleware, rateLimitMiddleware, validationMiddleware, loggingMiddleware, errorHandlerMiddleware, createJsonResponse, createErrorResponse } from '../_shared/middleware.ts';
import { CancelRecurringBookingsSchema } from '../_shared/validation.ts';
import { requireOwnership, logAdminAction } from '../_shared/auth.ts';
import { logBookingEvent } from '../_shared/logger.ts';
import { addDays, format } from 'https://esm.sh/date-fns@3.6.0';

// Handler function with security layers
const handler = async (req: Request, context: any) => {
  const { bookingId } = context.validatedData;
  const supabase = createAdminClient();

  try {
    // Fetch original booking
    const { data: original, error: origErr } = await supabase
      .from('bookings')
      .select('id, service_type, booking_time, user_id')
      .eq('id', bookingId)
      .single();

    if (origErr || !original) {
      return createErrorResponse('Booking not found.', 404, 'BOOKING_NOT_FOUND', context.rateLimitInfo);
    }

    // Check ownership - user must own the booking or be admin
    if (original.user_id !== context.user.id && context.profile?.role !== 'admin') {
      return createErrorResponse('Access denied. You can only manage your own bookings.', 403, 'ACCESS_DENIED', context.rateLimitInfo);
    }

    // Load recurrence rows
    const { data: recRows, error: recErr } = await supabase
      .from('recurring_bookings')
      .select('date, hour')
      .eq('booking_id', bookingId);

    if (recErr) {
      console.error('Error fetching recurring rows:', recErr);
      return createErrorResponse('Failed to load recurring bookings.', 500, 'DATABASE_ERROR', context.rateLimitInfo);
    }

    const tomorrow = addDays(new Date(), 1);
    const tomorrowStr = format(tomorrow, 'yyyy-MM-dd');

    if (!recRows || recRows.length === 0) {
      // No recurring bookings found, just update the flag
      await supabase.from('bookings').update({ recurring: false }).eq('id', bookingId);

      logBookingEvent('recurring_cancelled', bookingId, context.user.id, req, {
        deletedCount: 0,
        reason: 'no_recurring_found',
      });

      return createJsonResponse({
        success: true,
        deletedCount: 0,
        message: 'No recurring bookings found to cancel.',
      }, 200, context.rateLimitInfo);
    }

    // Normalize time for comparison
    const normalizeTime = (t: string): string => {
      const parts = t.split(':');
      return `${parts[0].padStart(2, '0')}:${(parts[1] || '00').padStart(2, '0')}`;
    };

    const origTime = normalizeTime(original.booking_time);

    // Delete future bookings that match the recurrence pattern
    let deletedCount = 0;
    for (const r of recRows) {
      const dateStr = r.date as string;
      if (!dateStr || dateStr < tomorrowStr) continue;

      const hour = normalizeTime((r.hour as string) || origTime);

      const { count, error } = await supabase
        .from('bookings')
        .delete({ count: 'exact' })
        .eq('booking_date', dateStr)
        .eq('booking_time', hour)
        .eq('service_type', original.service_type)
        .neq('id', bookingId);

      if (!error) {
        deletedCount += count || 0;
      }
    }

    // Remove all recurrence plan rows
    await supabase
      .from('recurring_bookings')
      .delete()
      .eq('booking_id', bookingId);

    // Update original booking recurring flag
    await supabase.from('bookings').update({ recurring: false }).eq('id', bookingId);

    // Log successful cancellation
    logBookingEvent('recurring_cancelled', bookingId, context.user.id, req, {
      deletedCount,
      totalRecurring: recRows.length,
    });

    if (context.profile?.role === 'admin') {
      logAdminAction('cancel_recurring_bookings', context.user.id, bookingId, {
        deletedCount,
        originalUserId: original.user_id,
      }, req);
    }

    return createJsonResponse({
      success: true,
      deletedCount,
      message: `Successfully cancelled ${deletedCount} recurring bookings.`,
    }, 200, context.rateLimitInfo);

  } catch (error) {
    console.error('Cancel recurring bookings error:', error);
    return createErrorResponse('Failed to cancel recurring bookings.', 500, 'INTERNAL_ERROR', context.rateLimitInfo);
  }
};

// Apply security middleware
const securedHandler = compose(
  corsMiddleware,
  loggingMiddleware,
  errorHandlerMiddleware,
  authMiddleware, // CRITICAL: Require authentication
  rateLimitMiddleware({
    identifier: (req, context) => context.user?.id || 'unknown',
    endpoint: 'cancel-recurring-bookings',
    limit: 20,
    window: 3600, // 20 cancellations per hour per user
  }),
  validationMiddleware(CancelRecurringBookingsSchema)
)(handler);

// Export the secured handler
Deno.serve(securedHandler);
