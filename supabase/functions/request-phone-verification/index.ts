import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// TODO: Implement a secure OTP generation and hashing mechanism
const generateOTP = () => '123456'; // Placeholder
const hashOTP = async (otp: string) => otp; // Placeholder

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { phone, userId } = await req.json();

    if (!phone || !/^\+40\d{9}$/.test(phone)) {
      return new Response(JSON.stringify({ error: 'Invalid phone number format. Use +40XXXXXXXXX.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const otp = generateOTP();
    const otp_hash = await hashOTP(otp);
    const expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes from now

    // Upsert to handle cases where a user requests a new OTP
    const { error: upsertError } = await supabase.from('otp_verifications').upsert(
      {
        phone,
        otp_hash,
        expires_at,
        user_id: userId, // Will be null for guests
      },
      { onConflict: 'phone' }
    );

    if (upsertError) {
      console.error('Error saving OTP:', upsertError);
      throw new Error('Could not save OTP information.');
    }

    // TODO: Integrate with Infobip API to send the SMS
    console.log(`--- SMS to ${phone} ---`);
    console.log(`Your verification code is: ${otp}`);
    console.log(`-----------------------`);

    return new Response(JSON.stringify({ success: true, message: 'OTP sent successfully.' }), {
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
