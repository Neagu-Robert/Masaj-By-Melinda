import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { addDays, format } from 'https://esm.sh/date-fns@3.6.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

type CancelRecurringPayload = {
  bookingId: string;
};

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
    const payload = (await req.json()) as CancelRecurringPayload;
    const { bookingId } = payload;

    if (!bookingId) {
      return new Response(JSON.stringify({ error: 'Missing bookingId' }), { status: 400, headers });
    }

    // Fetch original booking for matching service/time
    const { data: original, error: origErr } = await supabase
      .from('bookings')
      .select('id, service_type, booking_time')
      .eq('id', bookingId)
      .single();

    if (origErr || !original) {
      throw new Error(`Original booking not found: ${origErr?.message || ''}`);
    }

    // Load recurrence rows
    const { data: recRows, error: recErr } = await supabase
      .from('recurring_bookings')
      .select('date, hour')
      .eq('booking_id', bookingId);

    if (recErr) {
      throw new Error(`Error fetching recurring rows: ${recErr.message}`);
    }

    const tomorrow = addDays(new Date(), 1);
    const tomorrowStr = format(tomorrow, 'yyyy-MM-dd');

    if (!recRows || recRows.length === 0) {
      await supabase.from('bookings').update({ recurring: false }).eq('id', bookingId);
      return new Response(JSON.stringify({ success: true, deletedCount: 0 }), { status: 200, headers });
    }

    // Normalize original time to HH:MM for comparison
    const normalize = (t: string) => {
      const parts = t.split(':');
      return `${parts[0].padStart(2, '0')}:${(parts[1] || '00').padStart(2, '0')}`;
    };

    const origTime = normalize(original.booking_time);

    // Delete bookings on dates in recurrence >= tomorrow that match service + time and are not the original
    let deletedCount = 0;
    for (const r of recRows) {
      const dateStr = r.date as string;
      if (!dateStr || dateStr < tomorrowStr) continue;

      const hour = normalize((r.hour as string) || origTime);

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

    // Remove all recurrence plan rows for this booking (cleanup both future and past plan entries)
    await supabase
      .from('recurring_bookings')
      .delete()
      .eq('booking_id', bookingId);

    // Toggle original booking recurring flag off
    await supabase.from('bookings').update({ recurring: false }).eq('id', bookingId);

    return new Response(JSON.stringify({ success: true, deletedCount }), { status: 200, headers });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: (error as Error).message }), { status: 500, headers });
  }
});
