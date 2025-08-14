// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { format, addDays } from 'https://esm.sh/date-fns@3.6.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

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
    // Compute threshold date (30 days before "today").
    // This function will be scheduled at Europe/Bucharest midnight via cron.json.
    const threshold = format(addDays(new Date(), -30), 'yyyy-MM-dd');

    // Delete old bookings
    const { error: delBookingsError, count: bookingsDeleted } = await supabase
      .from('bookings')
      .delete({ count: 'exact' })
      .lt('booking_date', threshold);

    if (delBookingsError) {
      throw new Error(`Error deleting old bookings: ${delBookingsError.message}`);
    }

    // Delete old availability rows
    const { error: delAvailError, count: availDeleted } = await supabase
      .from('availabilities')
      .delete({ count: 'exact' })
      .lt('date', threshold);

    if (delAvailError) {
      throw new Error(`Error deleting old availabilities: ${delAvailError.message}`);
    }

    return new Response(
      JSON.stringify({ success: true, threshold, bookingsDeleted: bookingsDeleted || 0, availabilitiesDeleted: availDeleted || 0 }),
      { status: 200, headers }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers }
    );
  }
});


