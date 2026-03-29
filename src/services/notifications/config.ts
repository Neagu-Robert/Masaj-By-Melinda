// Notification Service Configuration

// General notification settings
export const MAX_RETRY_ATTEMPTS = parseInt(import.meta.env.VITE_MAX_RETRY_ATTEMPTS || '3', 10);
export const RETRY_DELAY_MS = parseInt(import.meta.env.VITE_RETRY_DELAY_MS || '5000', 10);

// Feature flags
export const EMAIL_NOTIFICATIONS_ENABLED = import.meta.env.VITE_EMAIL_NOTIFICATIONS_ENABLED !== 'false';