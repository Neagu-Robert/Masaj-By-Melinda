import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { addDays, format } from 'https://esm.sh/date-fns@3.6.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

type CreateRecurringPayload = {
  bookingId: string;
  recurrenceType: 'weekly' | 'biweekly';
  horizonDays: 30 | 60 | 90;
  confirm?: boolean;
  selectedDates?: string[];
};

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
};

function normalizeTime(t: string): string {
  // Ensure HH:MM format
  const parts = t.split(':');
  return `${parts[0].padStart(2, '0')}:${(parts[1] || '00').padStart(2, '0')}`;
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

async function isSlotBlocked(dateStr: string, timeStr: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('availabilities')
    .select('is_available')
    .eq('date', dateStr)
    .eq('hour', timeStr.length === 5 ? `${timeStr}:00` : timeStr)
    .maybeSingle();
  if (error) {
    // If table exists but query fails, be safe and treat as not blocked
    return false;
  }
  if (!data) return false; // no explicit rule => allowed
  return data.is_available === false;
}

async function isDoubleBooked(dateStr: string, timeStr: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('bookings')
    .select('id')
    .eq('booking_date', dateStr)
    .eq('booking_time', timeStr)
    .limit(1);
  if (error) return false;
  return (data?.length || 0) > 0;
}

serve(async (req) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
  }

  try {
    const payload = (await req.json()) as CreateRecurringPayload;
    const { bookingId, recurrenceType, horizonDays, confirm, selectedDates } = payload;

    if (!bookingId || !recurrenceType || !horizonDays) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers });
    }

    // Load original booking
    const { data: booking, error: bookingErr } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingErr || !booking) {
      throw new Error(`Original booking not found: ${bookingErr?.message || ''}`);
    }

    const original = booking as BookingRow;
    const originalDate = new Date(original.booking_date);
    const step = recurrenceType === 'biweekly' ? 14 : 7;

    // Determine horizon from today
    const now = new Date();
    const until = addDays(new Date(now.getFullYear(), now.getMonth(), now.getDate()), horizonDays);

    // Start generating candidates from the first recurrence AFTER the original booking date
    // This ensures the original date is NOT included in preview/creation
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
      const blocked = await isSlotBlocked(c.date, c.time);
      if (blocked) {
        preview.push({ date: c.date, time: c.time, available: false, reason: 'blocked' });
        continue;
      }
      const taken = await isDoubleBooked(c.date, c.time);
      if (taken) {
        preview.push({ date: c.date, time: c.time, available: false, reason: 'taken' });
        continue;
      }
      preview.push({ date: c.date, time: c.time, available: true });
    }

    if (!confirm) {
      // Return preview only
      return new Response(JSON.stringify({
        success: true,
        preview,
        meta: {
          horizonDays,
          day: dayName,
          hour: timeStr,
          until: format(until, 'yyyy-MM-dd'),
          recurrenceType,
        }
      }), { status: 200, headers });
    }

    // Create instances: do NOT create rows in bookings table.
    // Only record planned instances in recurring_bookings with status reflecting availability
    const createdInstances: any[] = [];
    const skippedInstances: any[] = [];

    // Treat provided selectedDates (even empty array) as explicit filter; undefined means all
    const selectedSet = Array.isArray(selectedDates) ? new Set(selectedDates) : undefined;
    const instancesToProcess = selectedDates === undefined
      ? preview
      : preview.filter((p) => selectedSet!.has(p.date));

    // Batch rows to minimize round trips
    const availableRows: any[] = [];
    const unavailableRows: any[] = [];
    const availableInst: typeof preview = [] as any;
    const unavailableInst: typeof preview = [] as any;

    for (const inst of instancesToProcess) {
      const common = {
        booking_id: original.id,
        recurrence_type: recurrenceType,
        until: format(until, 'yyyy-MM-dd'),
        day: dayName,
        hour: inst.time.length === 5 ? `${inst.time}:00` : inst.time,
        date: inst.date,
      };
      if (inst.available) {
        availableRows.push({ ...common, status: true });
        availableInst.push(inst);
      } else {
        unavailableRows.push({ ...common, status: false });
        unavailableInst.push(inst);
      }
    }

    if (availableRows.length > 0) {
      const { error } = await supabase
        .from('recurring_bookings')
        .insert(availableRows);
      if (error) {
        skippedInstances.push(...availableInst.map((i) => ({ ...i, available: false, reason: 'insert_failed' })));
      } else {
        createdInstances.push(...availableInst);
      }
    }

    if (unavailableRows.length > 0) {
      const { error } = await supabase
        .from('recurring_bookings')
        .insert(unavailableRows);
      if (error) {
        skippedInstances.push(...unavailableInst.map((i) => ({ ...i, available: false, reason: 'insert_failed' })));
      } else {
        // These were unavailable by preview rules; still record as skipped for response
        skippedInstances.push(...unavailableInst);
      }
    }

    // Mark original booking as recurring (only toggle flag; do not create future booking rows)
    await supabase
      .from('bookings')
      .update({ recurring: true })
      .eq('id', original.id);

    return new Response(JSON.stringify({
      success: true,
      createdCount: createdInstances.length,
      skippedCount: skippedInstances.length,
      createdInstances,
      skippedInstances,
    }), { status: 200, headers });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: (error as Error).message }), { status: 500, headers });
  }
});
