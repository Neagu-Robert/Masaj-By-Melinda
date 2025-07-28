// Notification Service Configuration
import { loadSendGridApiKey, loadInfobipApiKey, loadInfobipSenderNumber } from './utils';

// SendGrid configuration
export const SENDGRID_API_KEY = loadSendGridApiKey() || import.meta.env.VITE_SENDGRID_API_KEY || '';
export const SENDGRID_FROM_EMAIL = import.meta.env.VITE_SENDGRID_FROM_EMAIL || 'noreply@masajbymelinda.com';
export const SENDGRID_FROM_NAME = import.meta.env.VITE_SENDGRID_FROM_NAME || 'Masaj by Melinda';

// Infobip configuration
export const INFOBIP_API_KEY = loadInfobipApiKey() || import.meta.env.VITE_INFOBIP_API_KEY || '';
export const INFOBIP_SENDER_NUMBER = loadInfobipSenderNumber() || import.meta.env.VITE_INFOBIP_SENDER_NUMBER || '';

// General notification settings
export const NOTIFICATION_QUEUE_ENABLED = import.meta.env.VITE_NOTIFICATION_QUEUE_ENABLED === 'true';
export const MAX_RETRY_ATTEMPTS = parseInt(import.meta.env.VITE_MAX_RETRY_ATTEMPTS || '3', 10);
export const RETRY_DELAY_MS = parseInt(import.meta.env.VITE_RETRY_DELAY_MS || '5000', 10);

// Feature flags - enable SMS by default if Infobip is configured
export const EMAIL_NOTIFICATIONS_ENABLED = import.meta.env.VITE_EMAIL_NOTIFICATIONS_ENABLED !== 'false';
export const SMS_NOTIFICATIONS_ENABLED = INFOBIP_API_KEY && INFOBIP_SENDER_NUMBER;

// Validate required configuration
export const validateConfig = () => {
  const missingVars = [];
  
  if (EMAIL_NOTIFICATIONS_ENABLED && !SENDGRID_API_KEY) {
    missingVars.push('VITE_SENDGRID_API_KEY or sendgrid.env file');
  }
  
  if (SMS_NOTIFICATIONS_ENABLED) {
    if (!INFOBIP_API_KEY) missingVars.push('VITE_INFOBIP_API_KEY or infobip.env file');
    if (!INFOBIP_SENDER_NUMBER) missingVars.push('VITE_INFOBIP_SENDER_NUMBER or infobip.env file');
  }
  
  if (missingVars.length > 0) {
    console.error(`Missing required environment variables: ${missingVars.join(', ')}`);
    return false;
  }
  
  return true;
}; 