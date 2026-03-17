import { createAdminClient } from '../_shared/supabase-client.ts';
import { compose, corsMiddleware, authMiddleware, rateLimitMiddleware, validationMiddleware, loggingMiddleware, errorHandlerMiddleware, createJsonResponse, createErrorResponse } from '../_shared/middleware.ts';
import { CreateRecurringBookingsSchema } from '../_shared/validation.ts';
import { requireOwnership } from '../_shared/auth.ts';
import { logBookingEvent, logAdminAction } from '../_shared/logger.ts';
import { addDays, format } from 'https://esm.sh/date-fns@3.6.0';

// Type definitions
type BookingRow = {
  id: string;
  service_type: string;
  service_id: number | null;
  booking_date: string; // YYYY-MM-DD
  booking_time: string; // HH:MM or HH:MM:SS
  first_name: string;
  last_name: string;
  phone_number: string;
  user_id: string | null;
  recurring?: boolean;
};

function normalizeTime(t: string): string {
  // Ensure HH:MM:SS format
  const parts = t.split(':');
  return `${parts[0].padStart(2, '0')}:${(parts[1] || '00').padStart(2, '0')}:${(parts[2] || '00').padStart(2, '0')}`;
}

function getDayName(date: Date): string {
  return ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][date.getDay()];
}

function* iterateRecurrence(startDate: Date, untilDate: Date, stepDays: number): Generator<Date> {
  let current = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  while (current <= untilDate) {
    yield new Date(current);
    current = addDays(current, stepDays);
  }
}

async function isSlotBlocked(supabase: any, dateStr: string, timeStr: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('availabilities')
    .select('is_available')
    .eq('date', dateStr)
    .eq('hour', timeStr)
    .maybeSingle();
  if (error) {
    // If table exists but query fails, be safe and treat as not blocked
    return false;
  }
  if (!data) return false; // no explicit rule => allowed
  return data.is_available === false;
}

async function isDoubleBooked(supabase: any, dateStr: string, timeStr: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('bookings')
    .select('id')
    .eq('booking_date', dateStr)
    .eq('booking_time', timeStr)
    .limit(1);
  if (error) return false;
  return (data?.length || 0) > 0;
}

// Handler function with security layers
const handler = async (req: Request, context: any) => {
  const { bookingId, recurrenceType, horizonDays, confirm, selectedDates } = context.validatedData;
  const supabase = createAdminClient();

  try {
    // Load original booking
    const { data: booking, error: bookingErr } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingErr || !booking) {
      return createErrorResponse('Booking not found.', 404, 'BOOKING_NOT_FOUND', context.rateLimitInfo);
    }

    const original = booking as BookingRow;

    // Check ownership - user must own the booking or be admin
    const ownershipResult = await requireOwnership(req, original.user_id || '');
    if (ownershipResult instanceof Response) {
      return ownershipResult;
    }

    // Check if booking is already recurring
    if (original.recurring) {
      return createErrorResponse('This booking is already recurring.', 400, 'ALREADY_RECURRING', context.rateLimitInfo);
    }

    const originalDate = new Date(original.booking_date);
    const step = recurrenceType === 'biweekly' ? 14 : 7;

    // Determine horizon from today
    const now = new Date();
    const until = addDays(new Date(now.getFullYear(), now.getMonth(), now.getDate()), horizonDays);

    // Start generating candidates from the first recurrence AFTER the original booking date
    let first = addDays(new Date(originalDate.getFullYear(), originalDate.getMonth(), originalDate.getDate()), step);
    // If that first recurrence already passed relative to 'now', advance until it is in horizon window
    while (first <= now) {
      first = addDays(first, step);
    }

    const timeStr = normalizeTime(original.booking_time);
    const dayName = getDayName(originalDate);

    const candidates: { date: string; time: string }[] = [];
    for (const d of iterateRecurrence(first, until, step)) {
      candidates.push({ date: format(d, 'yyyy-MM-dd'), time: timeStr });
    }

    // Check availability and double-booking
    const preview: { date: string; time: string; available: boolean; reason?: string }[] = [];
    for (const c of candidates) {
      const blocked = await isSlotBlocked(supabase, c.date, c.time);
      if (blocked) {
        preview.push({ date: c.date, time: c.time, available: false, reason: 'blocked' });
        continue;
      }
      const taken = await isDoubleBooked(supabase, c.date, c.time);
      if (taken) {
        preview.push({ date: c.date, time: c.time, available: false, reason: 'taken' });
        continue;
      }
      preview.push({ date: c.date, time: c.time, available: true });
    }

    if (!confirm) {
      // Return preview only
      logBookingEvent('recurring_preview', bookingId, context.user.id, req, {
        recurrenceType,
        horizonDays,
        candidateCount: preview.length,
      });

      return createJsonResponse({
        success: true,
        preview,
        meta: {
          horizonDays,
          day: dayName,
          hour: timeStr,
          until: format(until, 'yyyy-MM-dd'),
          recurrenceType,
        }
      }, 200, context.rateLimitInfo);
    }

    // Create instances with transaction for atomicity
    const createdInstances: any[] = [];
    const skippedInstances: any[] = [];

    // Treat provided selectedDates (even empty array) as explicit filter; undefined means all
    const selectedSet = Array.isArray(selectedDates) ? new Set(selectedDates) : undefined;
    const instancesToProcess = selectedDates === undefined
      ? preview
      : preview.filter((p) => selectedSet!.has(p.date));

    // Use transaction for atomic operations
    const { data: transactionResult, error: transactionError } = await supabase.rpc('create_recurring_bookings_transaction', {
      p_booking_id: original.id,
      p_recurrence_type: recurrenceType,
      p_until_date: format(until, 'yyyy-MM-dd'),
      p_day_name: dayName,
      p_hour: timeStr,
      p_instances: instancesToProcess.map(inst => ({
        date: inst.date,
        available: inst.available,
      })),
    });

    if (transactionError) {
      console.error('Transaction failed:', transactionError);
      return createErrorResponse('Failed to create recurring bookings.', 500, 'TRANSACTION_FAILED', context.rateLimitInfo);
    }

    // Parse transaction result
    const result = transactionResult as { created: any[], skipped: any[] };
    createdInstances.push(...result.created);
    skippedInstances.push(...result.skipped);

    // Log successful creation
    logBookingEvent('recurring_created', bookingId, context.user.id, req, {
      recurrenceType,
      horizonDays,
      createdCount: createdInstances.length,
      skippedCount: skippedInstances.length,
    });

    // Check if user is admin for audit logging
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', context.user.id)
      .single();

    if (userProfile?.role === 'admin') {
      logAdminAction('create_recurring_bookings', context.user.id, bookingId, {
        recurrenceType,
        horizonDays,
        createdCount: createdInstances.length,
      }, req);
    }

    return createJsonResponse({
      success: true,
      createdCount: createdInstances.length,
      skippedCount: skippedInstances.length,
      createdInstances,
      skippedInstances,
    }, 200, context.rateLimitInfo);

  } catch (error) {
    console.error('Create recurring bookings error:', error);
    return createErrorResponse('Failed to process recurring bookings.', 500, 'INTERNAL_ERROR', context.rateLimitInfo);
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
    endpoint: 'create-recurring-bookings',
    limit: 10,
    window: 3600, // 10 requests per hour per user
  }),
  validationMiddleware(CreateRecurringBookingsSchema)
)(handler);

// Export the secured handler
Deno.serve(securedHandler);
