// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

type CancelRecurringInstancePayload = {
  instanceId: string; // UUID of recurring_bookings row
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
    const payload = (await req.json()) as CancelRecurringInstancePayload;
    const { instanceId } = payload;

    if (!instanceId) {
      return new Response(JSON.stringify({ error: 'Missing instanceId' }), { status: 400, headers });
    }

    // Retrieve instance details before deletion
    const { data: instance, error: fetchErr } = await supabase
      .from('recurring_bookings')
      .select('*')
      .eq('id', instanceId)
      .single();

    if (fetchErr || !instance) {
      throw new Error(fetchErr?.message || 'Recurring instance not found');
    }

    // Delete the specific recurring instance
    const { error: deleteErr } = await supabase
      .from('recurring_bookings')
      .delete()
      .eq('id', instanceId);

    if (deleteErr) {
      throw new Error(deleteErr.message);
    }

    return new Response(JSON.stringify({ success: true, deletedInstance: instance }), { status: 200, headers });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: (error as Error).message }), { status: 500, headers });
  }
});


