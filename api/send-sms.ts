import type { VercelRequest, VercelResponse } from '@vercel/node';

// Type definitions
interface SmsRequest {
  to: string;
  message: string;
}

interface SmsResponse {
  success: boolean;
  messageId?: string;
  status?: string;
  error?: string;
  details?: any;
}

interface InfobipMessage {
  destinations: Array<{ to: string }>;
  from: string;
  text: string;
}

interface InfobipRequest {
  messages: InfobipMessage[];
}

interface InfobipResponse {
  messages?: Array<{
    messageId?: string;
    status?: {
      groupName?: string;
    };
  }>;
  requestError?: {
    serviceException?: {
      text?: string;
    };
  };
}

// Infobip configuration
const INFOBIP_API_KEY: string | undefined = process.env.INFOBIP_API_KEY;
const INFOBIP_SENDER_NUMBER: string | undefined = process.env.INFOBIP_SENDER_NUMBER;

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Method not allowed' });
    return;
  }

  try {
    const { to, message }: SmsRequest = req.body;

    // Validate required parameters
    if (!to || !message) {
      res.status(400).json({
        success: false,
        error: 'Missing required parameters: to and message are required'
      });
      return;
    }

    // Check if Infobip is configured
    if (!INFOBIP_API_KEY) {
      console.error('Infobip API key is not configured');
      res.status(500).json({
        success: false,
        error: 'Infobip API key is not configured'
      });
      return;
    }

    if (!INFOBIP_SENDER_NUMBER) {
      console.error('Infobip sender number is not configured');
      res.status(500).json({
        success: false,
        error: 'Infobip sender number is not configured'
      });
      return;
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
      } as InfobipRequest),
    });

    const result: InfobipResponse = await response.json();

    if (!response.ok) {
      console.error('Infobip API error:', result);
      res.status(500).json({
        success: false,
        error: result?.requestError?.serviceException?.text || 'Failed to send SMS',
        details: {
          status: response.status,
          statusText: response.statusText,
          infobipError: result
        }
      });
      return;
    }

    console.log('SMS sent successfully:', result);

    // Return success response
    const responseData: SmsResponse = {
      success: true,
      messageId: result.messages?.[0]?.messageId,
      status: result.messages?.[0]?.status?.groupName || 'PENDING',
    };

    res.status(200).json(responseData);

  } catch (error: any) {
    console.error('SMS sending error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send SMS',
      details: error.message
    });
  }
} 