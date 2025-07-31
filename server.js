import express from 'express';
import cors from 'cors';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3003;

// CORS configuration
const corsOptions = {
  origin: ['http://localhost:8080', 'http://localhost:8081', 'http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-client-info', 'apikey']
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Parse JSON bodies
app.use(express.json());

// Load environment variables from .env.local
const loadEnvVariables = () => {
  try {
    const envPath = path.join(__dirname, '.env.local');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const envVars = {};
      
      // Parse each line
      envContent.split('\n').forEach(line => {
        line = line.trim();
        if (line && !line.startsWith('#')) {
          const [key, ...valueParts] = line.split('=');
          if (key && valueParts.length > 0) {
            const value = valueParts.join('=').replace(/^["']|["']$/g, ''); // Remove quotes
            envVars[key] = value;
          }
        }
      });
      
      return envVars;
    }
  } catch (error) {
    console.error('Error loading .env.local file:', error);
  }
  
  return {};
};

// Load environment variables
const envVars = loadEnvVariables();

// Load SendGrid API key
const loadSendGridApiKey = () => {
  // First try .env.local with VITE_ prefix
  if (envVars.VITE_SENDGRID_API_KEY) {
    return envVars.VITE_SENDGRID_API_KEY;
  }
  
  // Then try .env.local without prefix
  if (envVars.SENDGRID_API_KEY) {
    return envVars.SENDGRID_API_KEY;
  }
  
  // Fallback to environment variable with VITE_ prefix
  if (process.env.VITE_SENDGRID_API_KEY) {
    return process.env.VITE_SENDGRID_API_KEY;
  }
  
  // Fallback to environment variable without prefix
  return process.env.SENDGRID_API_KEY || '';
};

// Load Infobip API key
const loadInfobipApiKey = () => {
  // First try .env.local with VITE_ prefix
  if (envVars.VITE_INFOBIP_API_KEY) {
    return envVars.VITE_INFOBIP_API_KEY;
  }
  
  // Then try .env.local without prefix
  if (envVars.INFOBIP_API_KEY) {
    return envVars.INFOBIP_API_KEY;
  }
  
  // Fallback to environment variable with VITE_ prefix
  if (process.env.VITE_INFOBIP_API_KEY) {
    return process.env.VITE_INFOBIP_API_KEY;
  }
  
  // Fallback to environment variable without prefix
  return process.env.INFOBIP_API_KEY || '';
};

// Load Infobip sender number
const loadInfobipSenderNumber = () => {
  // First try .env.local with VITE_ prefix
  if (envVars.VITE_INFOBIP_SENDER_NUMBER) {
    return envVars.VITE_INFOBIP_SENDER_NUMBER;
  }
  
  // Then try .env.local without prefix
  if (envVars.INFOBIP_SENDER_NUMBER) {
    return envVars.INFOBIP_SENDER_NUMBER;
  }
  
  // Fallback to environment variable with VITE_ prefix
  if (process.env.VITE_INFOBIP_SENDER_NUMBER) {
    return process.env.VITE_INFOBIP_SENDER_NUMBER;
  }
  
  // Fallback to environment variable without prefix
  return process.env.INFOBIP_SENDER_NUMBER || '';
};

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Notification API server is running',
    endpoints: {
      email: '/api/send-email',
      sms: '/api/send-sms',
      health: '/api/health'
    }
  });
});

// Email API route
app.post('/api/send-email', async (req, res) => {
  console.log('=== EMAIL API ROUTE HIT ===');
  console.log('Request received at:', new Date().toISOString());
  console.log('Request headers:', req.headers);
  console.log('Request body:', req.body);
  
  try {
    console.log('Received email request:', req.body);
    
    const { to, subject, htmlContent, textContent } = req.body;

    // Validate required fields
    if (!to || !subject || !htmlContent) {
      console.log('Missing required fields:', { to, subject, htmlContent });
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: to, subject, and htmlContent are required'
      });
    }

    // Load SendGrid API key
    const sendGridApiKey = loadSendGridApiKey();
    if (!sendGridApiKey) {
      console.log('SendGrid API key not configured');
      return res.status(500).json({
        success: false,
        error: 'SendGrid API key is not configured'
      });
    }

    console.log('SendGrid API key loaded successfully');

    // Prepare SendGrid request body
    const sendGridBody = {
      personalizations: [
        {
          to: [{ email: to }],
          subject: subject,
        },
      ],
      from: {
        email: 'masajbymelinda@gmail.com', // Updated to your verified email
        name: 'Masaj by Melinda',
      },
      content: [
        // ALWAYS put text/plain first if it exists
        ...(textContent ? [{
          type: 'text/plain',
          value: textContent,
        }] : []),
        // ALWAYS put text/html second
        {
          type: 'text/html',
          value: htmlContent,
        },
      ],
    };

    // Add debugging to see exactly what we're sending
    console.log('SendGrid request body:', JSON.stringify(sendGridBody, null, 2));
    console.log('Content array length:', sendGridBody.content.length);
    console.log('Content types:', sendGridBody.content.map(c => c.type));

    console.log('Sending email via SendGrid API...');

    // Send email via SendGrid API
    const response = await axios.post('https://api.sendgrid.com/v3/mail/send', sendGridBody, {
      headers: {
        'Authorization': `Bearer ${sendGridApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('SendGrid API response:', response.status, response.data);

    // Return success response
    res.status(200).json({
      success: true,
      messageId: response.data?.id || `email_${Date.now()}`,
      status: 'SENT',
    });

  } catch (error) {
    console.error('Error sending email:', error);

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
});

// Handle OPTIONS requests for CORS preflight
app.options('/api/send-email', (req, res) => {
  res.status(200).end();
});

// SMS API route
app.post('/api/send-sms', async (req, res) => {
  console.log('=== SMS API ROUTE HIT ===');
  console.log('Request received at:', new Date().toISOString());
  console.log('Request headers:', req.headers);
  console.log('Request body:', req.body);
  
  try {
    console.log('Received SMS request:', req.body);
    
    const { to, message } = req.body;

    // Validate required fields
    if (!to || !message) {
      console.log('Missing required fields:', { to, message });
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: to and message are required'
      });
    }

    // Load Infobip credentials
    const infobipApiKey = loadInfobipApiKey();
    const infobipSenderNumber = loadInfobipSenderNumber();
    
    if (!infobipApiKey) {
      console.log('Infobip API key not configured');
      return res.status(500).json({
        success: false,
        error: 'Infobip API key is not configured'
      });
    }

    if (!infobipSenderNumber) {
      console.log('Infobip sender number not configured');
      return res.status(500).json({
        success: false,
        error: 'Infobip sender number is not configured'
      });
    }

    console.log('Infobip credentials loaded successfully');
    console.log(`Sending SMS to: ${to}, message: ${message.substring(0, 50)}...`);

    // Send SMS via Infobip API
    const response = await axios.post('https://api.infobip.com/sms/2/text/advanced', {
      messages: [
        {
          destinations: [{ to }],
          from: infobipSenderNumber,
          text: message,
        },
      ],
    }, {
      headers: {
        'Authorization': `App ${infobipApiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    console.log('Infobip API response:', response.status, response.data);

    // Return success response
    res.status(200).json({
      success: true,
      messageId: response.data.messages?.[0]?.messageId,
      status: response.data.messages?.[0]?.status?.groupName || 'PENDING',
    });

  } catch (error) {
    console.error('Error sending SMS:', error);

    // Return error response
    res.status(500).json({
      success: false,
      error: error.response?.data?.requestError?.serviceException?.text || error.message || 'Failed to send SMS',
      details: {
        status: error.response?.status,
        statusText: error.response?.statusText,
        infobipError: error.response?.data
      }
    });
  }
});

// Handle OPTIONS requests for SMS CORS preflight
app.options('/api/send-sms', (req, res) => {
  res.status(200).end();
});

// Start server with error handling
const startServer = () => {
  try {
    app.listen(PORT, () => {
      console.log(`Notification API server running on port ${PORT}`);
      console.log(`Health check available at: http://localhost:${PORT}/api/health`);
      console.log(`Email endpoint: http://localhost:${PORT}/api/send-email`);
      console.log(`SMS endpoint: http://localhost:${PORT}/api/send-sms`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer(); 