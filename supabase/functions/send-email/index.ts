import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import sgMail from 'https://esm.sh/@sendgrid/mail@8.1.1';

const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY');
const SENDGRID_FROM_EMAIL = Deno.env.get('SENDGRID_FROM_EMAIL') || 'masajbymelinda@gmail.com';
const SENDGRID_FROM_NAME = Deno.env.get('SENDGRID_FROM_NAME') || 'Masaj by Melinda';

console.log('Email function loaded. SendGrid API key present:', !!SENDGRID_API_KEY);
console.log('From email:', SENDGRID_FROM_EMAIL);
console.log('From name:', SENDGRID_FROM_NAME);

// Initialize SendGrid
if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
  console.log('SendGrid API key set successfully');
} else {
  console.error('SendGrid API key not found in environment variables');
}

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

    // Check if SendGrid is configured
    if (!SENDGRID_API_KEY) {
      return new Response(JSON.stringify({
        success: false,
        error: 'SendGrid API key not configured'
      }), { status: 500, headers });
    }

    const msg = {
      to,
      from: {
        email: SENDGRID_FROM_EMAIL,
        name: SENDGRID_FROM_NAME,
      },
      subject,
      text: textContent,
      html: htmlContent,
    };

    console.log('Attempting to send email to:', to);
    console.log('From:', SENDGRID_FROM_EMAIL);
    console.log('Subject:', subject);
    console.log('Message object:', JSON.stringify(msg, null, 2));

    await sgMail.send(msg);

    console.log('Email sent successfully');

    return new Response(JSON.stringify({
      success: true,
      status: 'SENT',
      messageId: `email_${Date.now()}`
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