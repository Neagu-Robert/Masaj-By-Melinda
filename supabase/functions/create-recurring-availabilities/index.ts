import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { addDays, format, isBefore, isAfter } from 'https://esm.sh/date-fns@3.6.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

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

serve(async (req) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    // Allow headers used by supabase-js functions.invoke
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Content-Type': 'application/json',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
  }

  try {
    const payload = (await req.json()) as CreateRecurringAvailabilityPayload;
    const { hour, recurrenceType, horizonDays, startDate, weekdays = [], confirm } = payload;

    if (!hour || !recurrenceType || !horizonDays) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers });
    }

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
      return new Response(JSON.stringify({ success: true, preview, meta: { hour: hhmm, start: format(start, 'yyyy-MM-dd'), until: format(until, 'yyyy-MM-dd'), recurrenceType, weekdays } }), { status: 200, headers });
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
      throw new Error(`Failed to create recurring availability: ${parentErr?.message || ''}`);
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

    return new Response(JSON.stringify({ success: true, createdCount, skippedCount, id: parentRow.id }), { status: 200, headers });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: (error as Error).message }), { status: 500, headers });
  }
});


