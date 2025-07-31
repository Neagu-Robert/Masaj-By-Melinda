import type { VercelRequest, VercelResponse } from '@vercel/node';

// SendGrid configuration
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'masajbymelinda@gmail.com';
const SENDGRID_FROM_NAME = process.env.SENDGRID_FROM_NAME || 'Masaj by Melinda';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { to, subject, htmlContent, textContent } = req.body;

    // Validate required parameters
    if (!to || !subject || !htmlContent) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: to, subject, and htmlContent are required'
      });
    }

    // Check if SendGrid is configured
    if (!SENDGRID_API_KEY) {
      console.error('SendGrid API key is not configured');
      return res.status(500).json({
        success: false,
        error: 'SendGrid API key is not configured'
      });
    }

    // Prepare SendGrid request
    const sendGridBody = {
      personalizations: [
        {
          to: [{ email: to }],
          subject: subject,
        },
      ],
      from: {
        email: SENDGRID_FROM_EMAIL,
        name: SENDGRID_FROM_NAME,
      },
      content: [
        {
          type: 'text/html',
          value: htmlContent,
        },
        ...(textContent ? [{
          type: 'text/plain',
          value: textContent,
        }] : []),
      ],
    };

    // Send email via SendGrid API
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sendGridBody),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('SendGrid API error:', result);
      return res.status(500).json({
        success: false,
        error: 'SendGrid API error',
        details: {
          status: response.status,
          statusText: response.statusText,
          sendGridError: result
        }
      });
    }

    // Return success response
    return res.status(200).json({
      success: true,
      messageId: result?.id || `email_${Date.now()}`,
      status: 'SENT',
    });

  } catch (error) {
    console.error('Email sending error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to send email',
      details: error.message
    });
  }
} 