import { createAdminClient } from '../_shared/supabase-client.ts';
import { compose, corsMiddleware, adminMiddleware, rateLimitMiddleware, validationMiddleware, loggingMiddleware, errorHandlerMiddleware, createJsonResponse, createErrorResponse } from '../_shared/middleware.ts';
import { CreateRecurringAvailabilitiesSchema } from '../_shared/validation.ts';
import { logAdminAction } from '../_shared/logger.ts';
import { addDays, format, isBefore, isAfter } from 'https://esm.sh/date-fns@3.6.0';

type RecurrenceType = 'daily' | 'weekly' | 'biweekly';

type CreateRecurringAvailabilityPayload = {
  hour: string; // HH:MM or HH:MM:SS
  recurrenceType: RecurrenceType;
  horizonDays: 30 | 60 | 90;
  startDate?: string; // yyyy-MM-dd (local)
  weekdays?: number[]; // 0..6, optional, used for weekly/biweekly; for daily acts as filter if provided
  confirm?: boolean;
};

function normalizeTimeToHHMM(t: string): string {
  const [h = '00', m = '00'] = t.split(':');
  return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
}

function normalizeTimeToHHMMSS(t: string): string {
  const [h = '00', m = '00', s = '00'] = t.split(':');
  return `${h.padStart(2, '0')}:${m.padStart(2, '0')}:${s.padStart(2, '0')}`;
}

function* iterateDaily(start: Date, until: Date) {
  let current = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  while (!isAfter(current, until)) {
    yield new Date(current);
    current = addDays(current, 1);
  }
}

function* iterateWeekly(start: Date, until: Date, stepDays: number, weekdays: number[]) {
  // For each target weekday, find the first occurrence >= start, then iterate by stepDays
  for (const wd of weekdays) {
    let current = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    // advance to next target weekday
    const delta = (wd - current.getDay() + 7) % 7;
    if (delta !== 0) current = addDays(current, delta);
    while (!isAfter(current, until)) {
      yield new Date(current);
      current = addDays(current, stepDays);
    }
  }
}

// Handler function with security layers
const handler = async (req: Request, context: any) => {
  const { hour, recurrenceType, horizonDays, startDate, weekdays = [], confirm } = context.validatedData;
  const supabase = createAdminClient();

  try {

    const hhmm = normalizeTimeToHHMM(hour);
    const hhmmss = normalizeTimeToHHMMSS(hour);

    // Determine time window
    const today = new Date();
    const start = startDate
      ? new Date(startDate + 'T00:00:00')
      : new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1); // default tomorrow
    const until = addDays(new Date(start.getFullYear(), start.getMonth(), start.getDate()), horizonDays);

    // Preload booked sets for quick checks
    const [bookingsRes, recurBookRes] = await Promise.all([
      supabase
        .from('bookings')
        .select('booking_date')
        .eq('booking_time', hhmm)
        .gte('booking_date', format(start, 'yyyy-MM-dd'))
        .lte('booking_date', format(until, 'yyyy-MM-dd')),
      supabase
        .from('recurring_bookings')
        .select('date')
        .eq('status', true)
        .eq('hour', hhmmss)
        .gte('date', format(start, 'yyyy-MM-dd'))
        .lte('date', format(until, 'yyyy-MM-dd')),
    ]);

    const takenDates = new Set<string>();
    for (const row of (bookingsRes.data || []) as any[]) takenDates.add(row.booking_date);
    for (const row of (recurBookRes.data || []) as any[]) takenDates.add(row.date);

    // Preload existing availability rows for this hour
    const { data: existingAvail } = await supabase
      .from('availabilities')
      .select('date, hour, is_available')
      .eq('hour', hhmmss)
      .gte('date', format(start, 'yyyy-MM-dd'))
      .lte('date', format(until, 'yyyy-MM-dd'));

    const blockedAvail = new Set<string>();
    for (const row of (existingAvail || []) as any[]) {
      if (row.is_available === false) blockedAvail.add(row.date);
    }

    // Generate candidate dates
    const candidates: { date: string; time: string }[] = [];
    if (recurrenceType === 'daily') {
      for (const d of iterateDaily(start, until)) {
        if (weekdays.length && !weekdays.includes(d.getDay())) continue;
        candidates.push({ date: format(d, 'yyyy-MM-dd'), time: hhmm });
      }
    } else {
      const step = recurrenceType === 'biweekly' ? 14 : 7;
      const days = weekdays.length ? weekdays : [start.getDay()];
      for (const d of iterateWeekly(start, until, step, days)) {
        candidates.push({ date: format(d, 'yyyy-MM-dd'), time: hhmm });
      }
    }

    // Build preview
    const preview: { date: string; time: string; available: boolean; reason?: string }[] = [];
    for (const c of candidates) {
      if (takenDates.has(c.date)) {
        preview.push({ date: c.date, time: c.time, available: false, reason: 'taken' });
        continue;
      }
      if (blockedAvail.has(c.date)) {
        preview.push({ date: c.date, time: c.time, available: false, reason: 'already_blocked' });
        continue;
      }
      preview.push({ date: c.date, time: c.time, available: true });
    }

    if (!confirm) {
      return createJsonResponse({
        success: true,
        preview,
        meta: { hour: hhmm, start: format(start, 'yyyy-MM-dd'), until: format(until, 'yyyy-MM-dd'), recurrenceType, weekdays }
      }, 200, context.rateLimitInfo);
    }

    // Confirm: create parent row, then insert only available instances as blocked availabilities linked by FK
    const { data: parentRow, error: parentErr } = await supabase
      .from('recurring_availabilities')
      .insert([{
        recurrence_type: recurrenceType,
        weekdays,
        hour: hhmmss,
        start_date: format(start, 'yyyy-MM-dd'),
        until: format(until, 'yyyy-MM-dd'),
      }])
      .select('*')
      .single();

    if (parentErr || !parentRow) {
      return createErrorResponse(`Failed to create recurring availability: ${parentErr?.message || ''}`, 500, 'CREATION_FAILED', context.rateLimitInfo);
    }

    let createdCount = 0;
    let skippedCount = 0;
    for (const inst of preview) {
      if (!inst.available) { skippedCount++; continue; }
      const { error: insErr } = await supabase
        .from('availabilities')
        .insert([{
          date: inst.date,
          hour: `${inst.time}:00`,
          is_available: false,
          recurring_availability_id: parentRow.id,
        }])
        .select('id')
        .single();
      if (insErr) { skippedCount++; } else { createdCount++; }
    }

    // Log admin action
    logAdminAction('create_recurring_availabilities', context.user.id, parentRow.id, {
      recurrenceType,
      horizonDays,
      createdCount,
      skippedCount,
    }, req);

    return createJsonResponse({
      success: true,
      createdCount,
      skippedCount,
      id: parentRow.id
    }, 200, context.rateLimitInfo);

  } catch (error) {
    console.error('Create recurring availabilities error:', error);
    return createErrorResponse('Failed to process recurring availabilities.', 500, 'INTERNAL_ERROR', context.rateLimitInfo);
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
    endpoint: 'create-recurring-availabilities',
    limit: 20,
    window: 3600, // 20 requests per hour per admin
  }),
  validationMiddleware(CreateRecurringAvailabilitiesSchema)
)(handler);

// Export the secured handler
Deno.serve(securedHandler);


