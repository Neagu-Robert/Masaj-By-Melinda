// Export types
export * from './types';

// Export main notification service
export { 
  notify, 
  sendNotification
} from './notificationService';

// Export logging service
export {
  logNotification,
  getUserNotificationLogs,
  getNotificationStats
} from './loggingService';

// Export utility functions
export {
  loadSendGridApiKey,
  loadInfobipApiKey,
  loadInfobipSenderNumber,
  testSendGridApiKey,
  testInfobipApiKey
} from './utils';

// Export test utility
export { testNotificationConfig } from './testApiKey';

// Export status component
export { NotificationConfigStatus } from './status';

// Export demo component
export { NotificationDemo } from './demo';

// Export configuration
export {
  EMAIL_NOTIFICATIONS_ENABLED,
  SMS_NOTIFICATIONS_ENABLED,
  NOTIFICATION_QUEUE_ENABLED,
  validateConfig
} from './config'; 