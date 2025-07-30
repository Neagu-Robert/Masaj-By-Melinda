import type { VercelRequest, VercelResponse } from '@vercel/node';

// Infobip configuration
const INFOBIP_API_KEY = process.env.INFOBIP_API_KEY;
const INFOBIP_SENDER_NUMBER = process.env.INFOBIP_SENDER_NUMBER;

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
    const { to, message } = req.body;

    // Validate required parameters
    if (!to || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: to and message are required'
      });
    }

    // Check if Infobip is configured
    if (!INFOBIP_API_KEY) {
      console.error('Infobip API key is not configured');
      return res.status(500).json({
        success: false,
        error: 'Infobip API key is not configured'
      });
    }

    if (!INFOBIP_SENDER_NUMBER) {
      console.error('Infobip sender number is not configured');
      return res.status(500).json({
        success: false,
        error: 'Infobip sender number is not configured'
      });
    }

    console.log(`Sending SMS to: ${to}, message: ${message.substring(0, 50)}...`);

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
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Infobip API error:', result);
      return res.status(500).json({
        success: false,
        error: result?.requestError?.serviceException?.text || 'Failed to send SMS',
        details: {
          status: response.status,
          statusText: response.statusText,
          infobipError: result
        }
      });
    }

    console.log('SMS sent successfully:', result);

    // Return success response
    return res.status(200).json({
      success: true,
      messageId: result.messages?.[0]?.messageId,
      status: result.messages?.[0]?.status?.groupName || 'PENDING',
    });

  } catch (error) {
    console.error('SMS sending error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to send SMS',
      details: error.message
    });
  }
} 