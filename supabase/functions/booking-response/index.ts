import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// import { Twilio } from 'https://esm.sh/twilio@4.19.0';

serve(async (req) => {
  console.log('--- booking-response function invoked ---');
  console.log(`Request Method: ${req.method}`);
  console.log(`Request URL: ${req.url}`);

  const url = new URL(req.url);
  const env = url.searchParams.get('env');

  const webAppUrl = env === 'dev'
    ? 'http://localhost:8080'
    : Deno.env.get('WEB_APP_URL') ?? 'https://masajbymelinda.ro';
  const redirectUrl = new URL('/booking-confirmation', webAppUrl);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Missing Supabase environment variables');
      redirectUrl.searchParams.set('status', 'error');
      redirectUrl.searchParams.set('message', 'Serviciul întâmpină probleme tehnice. Vă rugăm să încercați mai târziu.');
      return new Response(null, { status: 302, headers: { ...corsHeaders, 'Location': redirectUrl.toString() } });
    }

    // Create service role client for internal operations
    const supabaseClient = createClient(
      supabaseUrl,
      serviceRoleKey
    );

    // Get token from URL parameters
    const token = url.searchParams.get('token');
    const action = url.searchParams.get('action')?.toLowerCase();
    const booking_id = url.searchParams.get('booking_id');

    // Validate required parameters
    if (!token || !action || !booking_id) {
      redirectUrl.searchParams.set('status', 'error');
      redirectUrl.searchParams.set('message', 'Link-ul este incomplet. Vă rugăm să folosiți link-ul din email.');
      return new Response(null, { status: 302, headers: { ...corsHeaders, 'Location': redirectUrl.toString() } });
    }
    
    if (action && !['accept', 'decline'].includes(action)) {
      redirectUrl.searchParams.set('status', 'error');
      redirectUrl.searchParams.set('message', 'Acțiunea solicitată nu este validă.');
      return new Response(null, { status: 302, headers: { ...corsHeaders, 'Location': redirectUrl.toString() } });
    }

    // Authenticate using the token
    // The token serves as authentication - we validate it exists, is not expired, and matches the booking
    // This provides secure, authenticated access without requiring JWT tokens
    
    // 1. Validate token (this is our authentication mechanism)
    const { data: tokenData, error: tokenError } = await supabaseClient
      .from('booking_response_tokens')
      .select('*')
      .eq('token', token)
      .single();

    // Authentication failure: invalid or expired token
    if (tokenError || !tokenData) {
      console.error('Token validation failed:', tokenError);
      redirectUrl.searchParams.set('status', 'error');
      redirectUrl.searchParams.set('message', 'Link-ul pe care l-ați accesat este invalid sau a fost deja folosit. Vă rugăm să ne contactați direct pentru a rezolva rezervarea.');
      return new Response(null, { status: 302, headers: { ...corsHeaders, 'Location': redirectUrl.toString() } });
    }

    // Log token data for traceability
    console.log('Token validated:', { tokenId: tokenData.id, bookingId: tokenData.booking_id });

    // Check if token is expired
    if (new Date(tokenData.expires_at) < new Date()) {
      redirectUrl.searchParams.set('status', 'error');
      redirectUrl.searchParams.set('message', 'Link-ul pe care l-ați accesat a expirat. Vă rugăm să ne contactați direct pentru a rezolva rezervarea.');
      return new Response(null, { status: 302, headers: { ...corsHeaders, 'Location': redirectUrl.toString() } });
    }

    // 2. Verify token matches booking ID (additional security check)
    if (tokenData.booking_id !== booking_id) {
      console.error('Token booking_id mismatch:', tokenData.booking_id, 'vs', booking_id);
      redirectUrl.searchParams.set('status', 'error');
      redirectUrl.searchParams.set('message', 'Link-ul pe care l-ați accesat este invalid. Vă rugăm să folosiți link-ul din email.');
      return new Response(null, { status: 302, headers: { ...corsHeaders, 'Location': redirectUrl.toString() } });
    }

    // 3. Verify booking exists and is in suggested status
    const { data: booking, error: bookingError } = await supabaseClient
      .from('bookings')
      .select('status, suggested_date, suggested_time')
      .eq('id', booking_id)
      .single();

    if (bookingError || !booking) {
      redirectUrl.searchParams.set('status', 'error');
      redirectUrl.searchParams.set('bookingId', booking_id);
      redirectUrl.searchParams.set('message', 'Rezervarea nu a fost găsită sau nu mai așteaptă o sugestie de modificare. Vă rugăm să ne contactați direct pentru asistență.');
      return new Response(null, { status: 302, headers: { ...corsHeaders, 'Location': redirectUrl.toString() } });
    }
    
    if (booking.status !== 'suggested') {
      redirectUrl.searchParams.set('status', 'error');
      redirectUrl.searchParams.set('bookingId', booking_id);
      redirectUrl.searchParams.set('message', 'Link-ul nu mai este valid deoarece starea rezervării s-a schimbat. Vă rugăm să ne contactați pentru clarificări.');
      return new Response(null, { status: 302, headers: { ...corsHeaders, 'Location': redirectUrl.toString() } });
    }

    if (action === 'accept') {
      if (!booking.suggested_date || !booking.suggested_time) {
        redirectUrl.searchParams.set('status', 'error');
        redirectUrl.searchParams.set('bookingId', booking_id);
        redirectUrl.searchParams.set('message', 'Data sau ora sugerată lipsesc. Vă rugăm contactați-ne pentru a remedia problema.');
        return new Response(null, { status: 302, headers: { ...corsHeaders, 'Location': redirectUrl.toString() } });
      }
    }

    const { data: updatedBooking, error: rpcError } = await supabaseClient
      .rpc('handle_booking_response', {
        p_booking_id: booking_id,
        p_token_id: tokenData.id,
        p_action: action,
      })
      .single();

    if (rpcError || !updatedBooking) {
      console.error('RPC call to handle_booking_response failed or returned no data', {
        booking_id,
        action,
        error: rpcError,
      });
      redirectUrl.searchParams.set('status', 'error');
      redirectUrl.searchParams.set('bookingId', booking_id);
      redirectUrl.searchParams.set('message', 'Nu am putut actualiza rezervarea. Este posibil ca starea acesteia să se fi schimbat. Vă rugăm reîncercați sau contactați-ne.');
      return new Response(null, { status: 302, headers: { ...corsHeaders, 'Location': redirectUrl.toString() } });
    }
    
    // If successful, redirect to web-app
    redirectUrl.searchParams.set('action', action);
    redirectUrl.searchParams.set('status', 'success');
    redirectUrl.searchParams.set('bookingId', booking_id);

    return new Response(null, {
      status: 302,
      headers: { ...corsHeaders, 'Location': redirectUrl.toString() },
    });

  } catch (error) {
    const requestId = crypto.randomUUID();
    console.error(`[${requestId}] Unhandled error:`, error);
    
    const message = `A apărut o eroare neașteptată. Vă rugăm să contactați suportul. ID referință: ${requestId}`;
    
    redirectUrl.searchParams.set('status', 'error');
    redirectUrl.searchParams.set('message', message);

    return new Response(null, {
      status: 302,
      headers: { ...corsHeaders, 'Location': redirectUrl.toString() },
    });
  }
});
