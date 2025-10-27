import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_SID');
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');
const TWILIO_VERIFY_SID = Deno.env.get('TWILIO_VERIFY_SID');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { phone, otp, userId } = await req.json();

    if (!phone || !/^\+40\d{9}$/.test(phone) || !otp) {
      return new Response(JSON.stringify({ error: 'A valid phone number and OTP are required.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_VERIFY_SID) {
      return new Response(JSON.stringify({ error: 'Twilio credentials are not configured.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    const twilioUrl = `https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SID}/VerificationCheck`;
    const authHeader = 'Basic ' + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: phone,
        Code: otp,
      }).toString(),
    });

    const result = await response.json();

    if (!response.ok || result.status !== 'approved') {
      console.error('Twilio Verify API error:', result);
      const errorMessage = result.message || 'Invalid OTP.';
      return new Response(JSON.stringify({ error: errorMessage }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // If verification is successful, update the user's profile
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    if (userId) {
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({
          phone: phone,
          phone_verified: true,
          phone_verified_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (profileUpdateError) {
        console.error('Error updating profile:', profileUpdateError);
        // Do not throw an error to the client, just log it
      }
    }

    return new Response(JSON.stringify({ success: true, message: 'Phone number verified successfully.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Internal Server Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
