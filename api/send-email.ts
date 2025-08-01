import type { VercelRequest, VercelResponse } from '@vercel/node';

// Type definitions
interface EmailRequest {
  to: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
}

interface EmailResponse {
  success: boolean;
  messageId?: string;
  status?: string;
  error?: string;
  details?: any;
}

interface SendGridPersonalization {
  to: Array<{ email: string }>;
  subject: string;
}

interface SendGridContent {
  type: string;
  value: string;
}

interface SendGridFrom {
  email: string;
  name: string;
}

interface SendGridRequest {
  personalizations: SendGridPersonalization[];
  from: SendGridFrom;
  content: SendGridContent[];
}

interface SendGridResponse {
  id?: string;
  errors?: Array<{
    message: string;
    field?: string;
    help?: string;
  }>;
}

// SendGrid configuration
const SENDGRID_API_KEY: string | undefined = process.env.SENDGRID_API_KEY;
const SENDGRID_FROM_EMAIL: string = process.env.SENDGRID_FROM_EMAIL || 'masajbymelinda@gmail.com';
const SENDGRID_FROM_NAME: string = process.env.SENDGRID_FROM_NAME || 'Masaj by Melinda';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  // DYNAMIC IMPORT for SendGrid
  const sgMail = (await import('@sendgrid/mail')).default;

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
    const { to, subject, htmlContent, textContent }: EmailRequest = req.body;

    // Validate required parameters
    if (!to || !subject || !htmlContent) {
      res.status(400).json({
        success: false,
        error: 'Missing required parameters: to, subject, and htmlContent are required'
      });
      return;
    }

    // Check if SendGrid is configured
    if (!SENDGRID_API_KEY) {
      console.error('SendGrid API key is not configured');
      res.status(500).json({
        success: false,
        error: 'SendGrid API key is not configured'
      });
      return;
    }

    // Prepare SendGrid request
    const sendGridBody: SendGridRequest = {
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

    const result: SendGridResponse = await response.json();

    if (!response.ok) {
      console.error('SendGrid API error:', result);
      res.status(500).json({
        success: false,
        error: 'SendGrid API error',
        details: {
          status: response.status,
          statusText: response.statusText,
          sendGridError: result
        }
      });
      return;
    }

    // Return success response
    const responseData: EmailResponse = {
      success: true,
      messageId: result?.id || `email_${Date.now()}`,
      status: 'SENT',
    };

    res.status(200).json(responseData);

  } catch (error: any) {
    console.error('Email sending error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send email',
      details: error.message
    });
  }
} 