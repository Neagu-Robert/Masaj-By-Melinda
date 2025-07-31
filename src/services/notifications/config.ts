// Notification Service Configuration

// SendGrid configuration
export const SENDGRID_API_KEY = import.meta.env.VITE_SENDGRID_API_KEY || '';
export const SENDGRID_FROM_EMAIL = import.meta.env.VITE_SENDGRID_FROM_EMAIL || 'masajbymelinda@gmail.com';
export const SENDGRID_FROM_NAME = import.meta.env.VITE_SENDGRID_FROM_NAME || 'Masaj by Melinda';

// Infobip configuration
export const INFOBIP_API_KEY = import.meta.env.VITE_INFOBIP_API_KEY || '';
export const INFOBIP_SENDER_NUMBER = import.meta.env.VITE_INFOBIP_SENDER_NUMBER || '';

// Admin contact configuration for SMS notifications
export const ADMIN_PHONE_NUMBERS = import.meta.env.VITE_ADMIN_PHONE_NUMBERS?.split(',') || [
  '+40745038809'
   // Replace with actual admin phone numbers
];

// General notification settings
export const NOTIFICATION_QUEUE_ENABLED = import.meta.env.VITE_NOTIFICATION_QUEUE_ENABLED === 'true';
export const MAX_RETRY_ATTEMPTS = parseInt(import.meta.env.VITE_MAX_RETRY_ATTEMPTS || '3', 10);
export const RETRY_DELAY_MS = parseInt(import.meta.env.VITE_RETRY_DELAY_MS || '5000', 10);

// Feature flags - enable SMS by default if Infobip is configured
export const EMAIL_NOTIFICATIONS_ENABLED = import.meta.env.VITE_EMAIL_NOTIFICATIONS_ENABLED !== 'false';
// For testing: Enable SMS even without Infobip credentials since we use Vercel API routes
export const SMS_NOTIFICATIONS_ENABLED = import.meta.env.VITE_SMS_NOTIFICATIONS_ENABLED !== 'false' || (INFOBIP_API_KEY && INFOBIP_SENDER_NUMBER);

// Validate required configuration
export const validateConfig = () => {
  const missingVars = [];
  
  if (EMAIL_NOTIFICATIONS_ENABLED && !SENDGRID_API_KEY) {
    missingVars.push('VITE_SENDGRID_API_KEY environment variable');
  }
  
  if (SMS_NOTIFICATIONS_ENABLED) {
    if (!INFOBIP_API_KEY) missingVars.push('VITE_INFOBIP_API_KEY environment variable');
    if (!INFOBIP_SENDER_NUMBER) missingVars.push('VITE_INFOBIP_SENDER_NUMBER environment variable');
  }
  
  if (missingVars.length > 0) {
    console.error(`Missing required environment variables: ${missingVars.join(', ')}`);
    return false;
  }
  
  return true;
}; 