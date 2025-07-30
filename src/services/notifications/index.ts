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

// Export hooks
export {
  useBookingNotifications
} from './hooks';

// Export configuration
export {
  EMAIL_NOTIFICATIONS_ENABLED,
  SMS_NOTIFICATIONS_ENABLED,
  NOTIFICATION_QUEUE_ENABLED,
  validateConfig
} from './config'; 