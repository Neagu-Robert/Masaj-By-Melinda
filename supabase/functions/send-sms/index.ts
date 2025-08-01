import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const INFOBIP_API_KEY = Deno.env.get('INFOBIP_API_KEY');
const INFOBIP_SENDER_NUMBER = Deno.env.get('INFOBIP_SENDER_NUMBER');

console.log('SMS function loaded. Infobip API key present:', !!INFOBIP_API_KEY);
console.log('Infobip sender number:', INFOBIP_SENDER_NUMBER);

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

    if (!INFOBIP_API_KEY) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Infobip API key is not configured'
      }), { status: 500, headers });
    }

    if (!INFOBIP_SENDER_NUMBER) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Infobip sender number is not configured'
      }), { status: 500, headers });
    }

    console.log('Attempting to send SMS to:', to);
    console.log('Message:', message);
    console.log('From:', INFOBIP_SENDER_NUMBER);

    // Send SMS via Infobip API
    const response = await fetch('https://api.infobip.com/sms/2/text/advanced', {
      method: 'POST',
      headers: {
        'Authorization': `App ${INFOBIP_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            destinations: [{ to }],
            from: INFOBIP_SENDER_NUMBER,
            text: message,
          },
        ],
        // Add webhook for delivery tracking (optional)
        // webhookUrl: 'https://your-domain.com/sms-webhook'
      }),
    });

    const result = await response.json();
    console.log('Infobip response status:', response.status);
    console.log('Infobip response body:', JSON.stringify(result, null, 2));

    if (!response.ok) {
      console.error('Infobip API error:', result);
      return new Response(JSON.stringify({
        success: false,
        error: result?.requestError?.serviceException?.text || 'Failed to send SMS',
        details: {
          status: response.status,
          statusText: response.statusText,
          infobipError: result
        }
      }), { status: 500, headers });
    }

    console.log('SMS sent successfully. Message ID:', result.messages?.[0]?.messageId);
    console.log('SMS status:', result.messages?.[0]?.status?.groupName);

    return new Response(JSON.stringify({
      success: true,
      messageId: result.messages?.[0]?.messageId,
      status: result.messages?.[0]?.status?.groupName || 'PENDING',
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