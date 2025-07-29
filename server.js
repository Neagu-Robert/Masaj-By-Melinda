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

// Load SendGrid API key from sendgrid.env
const loadSendGridApiKey = () => {
  try {
    const envPath = path.join(__dirname, 'src', 'sendgrid.env');
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

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Email API server is running' });
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

// Start server with error handling
const startServer = () => {
  try {
    app.listen(PORT, () => {
      console.log(`Email API server running on port ${PORT}`);
      console.log(`Health check available at: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer(); 