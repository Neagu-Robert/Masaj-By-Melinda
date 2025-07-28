import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey',
};

// Load SendGrid API key from sendgrid.env
const loadSendGridApiKey = (): string => {
  try {
    const envPath = path.join(process.cwd(), 'src', 'sendgrid.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const apiKeyMatch = envContent.match(/SENDGRID_API_KEY=['"]([^'"]+)['"]/);
      if (apiKeyMatch) {
        return apiKeyMatch[1];
      }
    }
  } catch (error) {
    console.error('Error loading SendGrid API key from file:', error);
  }
  
  // Fallback to environment variable
  return process.env.SENDGRID_API_KEY || '';
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-client-info, apikey');
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
    return;
  }

  try {
    const { to, subject, htmlContent, textContent } = req.body;

    // Validate required fields
    if (!to || !subject || !htmlContent) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.status(400).json({
        success: false,
        error: 'Missing required fields: to, subject, and htmlContent are required'
      });
      return;
    }

    // Load SendGrid API key
    const sendGridApiKey = loadSendGridApiKey();
    if (!sendGridApiKey) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.status(500).json({
        success: false,
        error: 'SendGrid API key is not configured'
      });
      return;
    }

    // Prepare SendGrid request body
    const sendGridBody = {
      personalizations: [
        {
          to: [{ email: to }],
          subject: subject,
        },
      ],
      from: {
        email: 'noreply@masajbymelinda.com',
        name: 'Masaj by Melinda',
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
    const response = await axios.post('https://api.sendgrid.com/v3/mail/send', sendGridBody, {
      headers: {
        'Authorization': `Bearer ${sendGridApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-client-info, apikey');

    // Return success response
    res.status(200).json({
      success: true,
      messageId: response.data?.id || `email_${Date.now()}`,
      status: 'SENT',
    });

  } catch (error: any) {
    console.error('Error sending email:', error);

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-client-info, apikey');

    // Return error response
    res.status(500).json({
      success: false,
      error: error.response?.data?.errors?.[0]?.message || error.message || 'Failed to send email',
      details: {
        status: error.response?.status,
        statusText: error.response?.statusText,
        sendGridError: error.response?.data
      }
    });
  }
} 