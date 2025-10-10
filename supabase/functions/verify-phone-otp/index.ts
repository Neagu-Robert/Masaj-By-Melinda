import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// TODO: Implement a secure OTP hashing and comparison mechanism
const verifyOTP = async (submittedOtp: string, storedHash: string) => submittedOtp === storedHash; // Placeholder

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { phone, otp } = await req.json();

    if (!phone || !otp) {
      return new Response(JSON.stringify({ error: 'Phone number and OTP are required.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: verification, error: fetchError } = await supabase
      .from('otp_verifications')
      .select('*')
      .eq('phone', phone)
      .single();

    if (fetchError || !verification) {
      return new Response(JSON.stringify({ error: 'Invalid phone number or verification not started.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    if (new Date() > new Date(verification.expires_at)) {
      // Clean up expired OTP
      await supabase.from('otp_verifications').delete().eq('id', verification.id);
      return new Response(JSON.stringify({ error: 'OTP has expired. Please request a new one.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const isValid = await verifyOTP(otp, verification.otp_hash);

    if (!isValid) {
      return new Response(JSON.stringify({ error: 'Invalid OTP.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // If the user is registered, update their profile
    if (verification.user_id) {
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({
          phone: verification.phone,
          phone_verified: true,
          phone_verified_at: new Date().toISOString(),
        })
        .eq('id', verification.user_id);

      if (profileUpdateError) {
        console.error('Error updating profile:', profileUpdateError);
        throw new Error('Failed to update profile verification status.');
      }
    }

    // Clean up the used OTP record
    await supabase.from('otp_verifications').delete().eq('id', verification.id);

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
