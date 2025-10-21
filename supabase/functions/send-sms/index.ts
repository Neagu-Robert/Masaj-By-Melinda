import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_SID');
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');
const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER');

console.log('SMS function loaded. Twilio Account SID present:', !!TWILIO_ACCOUNT_SID);
console.log('Twilio sender number:', TWILIO_PHONE_NUMBER);

serve(async (req) => {
  // CORS headers
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
    return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), { status: 405, headers });
  }

  try {
    const { to, message } = await req.json();

    if (!to || !message) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required parameters: to and message are required'
      }), { status: 400, headers });
    }

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Twilio credentials are not configured'
      }), { status: 500, headers });
    }

    if (!TWILIO_PHONE_NUMBER) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Twilio sender number is not configured'
      }), { status: 500, headers });
    }

    console.log('Attempting to send SMS to:', to);
    console.log('Message:', message);
    console.log('From:', TWILIO_PHONE_NUMBER);

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;

    const body = new URLSearchParams();
    body.append('To', to);
    body.append('From', TWILIO_PHONE_NUMBER);
    body.append('Body', message);

    const authHeader = 'Basic ' + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

    // Send SMS via Twilio API
    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    const result = await response.json();
    console.log('Twilio response status:', response.status);
    console.log('Twilio response body:', JSON.stringify(result, null, 2));

    if (!response.ok) {
      console.error('Twilio API error:', result);
      return new Response(JSON.stringify({
        success: false,
        error: result.message || 'Failed to send SMS',
        details: {
          status: response.status,
          statusText: response.statusText,
          twilioError: result
        }
      }), { status: 500, headers });
    }

    console.log('SMS sent successfully. Message SID:', result.sid);
    console.log('SMS status:', result.status);

    return new Response(JSON.stringify({
      success: true,
      messageId: result.sid,
      status: result.status.toUpperCase(),
      details: result
    }), { status: 200, headers });

  } catch (error) {
    console.error('Error sending SMS:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to send SMS',
      details: error.message
    }), { status: 500, headers });
  }
});