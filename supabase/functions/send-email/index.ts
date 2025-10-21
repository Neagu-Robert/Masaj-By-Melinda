import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY');
const SENDER_EMAIL = Deno.env.get('BREVO_FROM_EMAIL') || 'masajbymelinda@gmail.com';
const SENDER_NAME = Deno.env.get('BREVO_FROM_NAME') || 'Masaj by Melinda';

console.log('Email function loaded. Brevo API key present:', !!BREVO_API_KEY);
console.log('Sender email:', SENDER_EMAIL);
console.log('Sender name:', SENDER_NAME);

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
    const { to, subject, htmlContent, textContent } = await req.json();

    if (!to || !subject || !htmlContent) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required parameters: to, subject, and htmlContent are required'
      }), { status: 400, headers });
    }

    // Check if Brevo is configured
    if (!BREVO_API_KEY) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Brevo API key not configured'
      }), { status: 500, headers });
    }

    const brevoPayload = {
      sender: {
        name: SENDER_NAME,
        email: SENDER_EMAIL,
      },
      to: [
        {
          email: to,
        },
      ],
      subject,
      htmlContent,
      textContent,
    };

    console.log('Attempting to send email to:', to);
    console.log('From:', SENDER_EMAIL);
    console.log('Subject:', subject);
    console.log('Brevo payload:', JSON.stringify(brevoPayload, null, 2));

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(brevoPayload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Brevo API error:', response.status, errorBody);
      throw new Error(`Brevo API responded with status ${response.status}: ${errorBody}`);
    }

    const result = await response.json();
    console.log('Email sent successfully via Brevo. Message ID:', result.messageId);

    return new Response(JSON.stringify({
      success: true,
      status: 'SENT',
      messageId: result.messageId || `email_${Date.now()}`
    }), { status: 200, headers });

  } catch (error) {
    console.error('Error sending email:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to send email',
      details: error.toString()
    }), { status: 500, headers });
  }
});