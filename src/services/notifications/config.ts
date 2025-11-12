// Notification Service Configuration

// Brevo configuration
export const BREVO_API_KEY = import.meta.env.VITE_BREVO_API_KEY || '';
export const BREVO_FROM_EMAIL = import.meta.env.VITE_BREVO_FROM_EMAIL || 'masajbymelinda@gmail.com';
export const BREVO_FROM_NAME = import.meta.env.VITE_BREVO_FROM_NAME || 'Masaj by Melinda';

// Twilio configuration
export const TWILIO_SID = import.meta.env.VITE_TWILIO_SID || '';
export const TWILIO_AUTH_TOKEN = import.meta.env.VITE_TWILIO_AUTH_TOKEN || '';
export const TWilio_PHONE_NUMBER = import.meta.env.VITE_TWILIO_PHONE_NUMBER || '';

// Admin contact configuration for SMS notifications
export const ADMIN_PHONE_NUMBERS = import.meta.env.VITE_ADMIN_PHONE_NUMBERS?.split(',') || [
  '+40745038809'
   // Replace with actual admin phone numbers
];

// Booking response callback URL for email Yes/No buttons
export const BOOKING_RESPONSE_CALLBACK_URL = import.meta.env.VITE_BOOKING_RESPONSE_CALLBACK_URL || 'https://your-project.supabase.co/functions/v1/booking-response';

// General notification settings
export const NOTIFICATION_QUEUE_ENABLED = import.meta.env.VITE_NOTIFICATION_QUEUE_ENABLED === 'true';
export const MAX_RETRY_ATTEMPTS = parseInt(import.meta.env.VITE_MAX_RETRY_ATTEMPTS || '3', 10);
export const RETRY_DELAY_MS = parseInt(import.meta.env.VITE_RETRY_DELAY_MS || '5000', 10);

// Feature flags
export const EMAIL_NOTIFICATIONS_ENABLED = import.meta.env.VITE_EMAIL_NOTIFICATIONS_ENABLED !== 'false';
// Enable SMS if Twilio SID and Auth Token are configured
export const SMS_NOTIFICATIONS_ENABLED = import.meta.env.VITE_SMS_NOTIFICATIONS_ENABLED !== 'false' && !!(TWILIO_SID && TWILIO_AUTH_TOKEN);

// Validate required configuration
export const validateConfig = () => {
  const missingVars = [];
  
  if (EMAIL_NOTIFICATIONS_ENABLED && !BREVO_API_KEY) {
    missingVars.push('VITE_BREVO_API_KEY environment variable');
  }
  
  if (SMS_NOTIFICATIONS_ENABLED) {
    if (!TWILIO_SID) missingVars.push('VITE_TWILIO_SID environment variable');
    if (!TWILIO_AUTH_TOKEN) missingVars.push('VITE_TWILIO_AUTH_TOKEN environment variable');
    if (!TWilio_PHONE_NUMBER) missingVars.push('VITE_TWILIO_PHONE_NUMBER environment variable');
  }
  
  if (missingVars.length > 0) {
    console.error(`Missing required environment variables: ${missingVars.join(', ')}`);
    return false;
  }
  
  return true;
}; 