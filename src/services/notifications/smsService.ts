// Import only the necessary types and configurations
import { 
  INFOBIP_API_KEY, 
  INFOBIP_SENDER_NUMBER,
  MAX_RETRY_ATTEMPTS,
  RETRY_DELAY_MS,
  SMS_NOTIFICATIONS_ENABLED
} from './config';
import { 
  NotificationPayload, 
  NotificationResult, 
  BookingNotificationData 
} from './types';
import { logNotification } from './loggingService';

// SMS templates - All SMS notifications are sent to admins only
const smsTemplates = {
  // Customer creates booking - Admin receives SMS with customer info
  booking_created_customer: (data: BookingNotificationData): string => {
    return `Masaj by Melinda: New booking created by customer ${data.userName}. Service: ${data.serviceName}, Date: ${data.dateTime}, Duration: ${data.duration} min.`;
  },

  // User updates booking from profile - Admin receives SMS with updated info
  booking_updated_profile: (data: BookingNotificationData): string => {
    return `Masaj by Melinda: Booking updated by ${data.userName}. New details: ${data.serviceName} on ${data.dateTime}, Duration: ${data.duration} min.`;
  },

  // User cancels booking from profile - Admin receives SMS with cancellation info
  booking_cancelled_profile: (data: BookingNotificationData): string => {
    return `Masaj by Melinda: Booking cancelled by ${data.userName}. Cancelled booking: ${data.serviceName} on ${data.dateTime}.`;
  },

  // Admin creates booking - Admin receives SMS with booking info
  booking_created_admin: (data: BookingNotificationData): string => {
    return `Masaj by Melinda: New booking created by admin. Customer: ${data.userName}, Service: ${data.serviceName}, Date: ${data.dateTime}, Duration: ${data.duration} min.`;
  },

  // Admin updates booking - Admin receives SMS with updated info
  booking_updated_admin: (data: BookingNotificationData): string => {
    return `Masaj by Melinda: Booking updated by admin. Customer: ${data.userName}, Service: ${data.serviceName}, Date: ${data.dateTime}, Duration: ${data.duration} min.`;
  }
};

/**
 * Get the API base URL based on environment
 */
const getApiBaseUrl = (): string => {
  // In development, use the Express server
  if (import.meta.env.DEV) {
    return 'http://localhost:3003';
  }
  // In production, use the Vercel API route
  return 'https://masajbymelinda.ro';
};

/**
 * Check if SMS is properly configured
 */
const isSmsConfigured = (): boolean => {
  // For testing: Allow SMS if enabled, even without Infobip credentials
  // The actual SMS sending is handled by the Vercel API route
  return !!(
    SMS_NOTIFICATIONS_ENABLED
    // && INFOBIP_API_KEY && INFOBIP_SENDER_NUMBER  // Commented out for testing
  );
};

/**
 * Send an SMS notification via Supabase Edge Function
 */
export const sendSmsNotification = async (
  payload: NotificationPayload
): Promise<NotificationResult> => {
  if (!isSmsConfigured()) {
    console.error('SMS notifications are not configured or enabled');
    return {
      success: false,
      channel: 'sms',
      error: new Error('SMS notifications are not configured or enabled'),
      timestamp: Date.now()
    };
  }

  if (!payload.recipient.phone) {
    console.error('Recipient phone number is required');
    return {
      success: false,
      channel: 'sms',
      error: new Error('Recipient phone number is required'),
      timestamp: Date.now()
    };
  }

  try {
    // Get the appropriate template
    const templateFn = smsTemplates[payload.type];
    if (!templateFn) {
      throw new Error(`SMS template not found for notification type: ${payload.type}`);
    }

    // Generate the SMS content from template
    const smsContent = templateFn(payload.data as BookingNotificationData);

    // Format the phone number (ensure it starts with +)
    const formattedPhone = payload.recipient.phone.startsWith('+') 
      ? payload.recipient.phone 
      : `+${payload.recipient.phone}`;

    // Call the Vercel API route
    const apiBaseUrl = getApiBaseUrl();
    const response = await fetch(`${apiBaseUrl}/api/send-sms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: formattedPhone,
        message: smsContent
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    if (!data.success) {
      throw new Error(data.error || 'Failed to send SMS');
    }

    // Log the successful notification
    await logNotification({
      notificationType: payload.type,
      channel: 'sms',
      recipientId: payload.recipient.userId,
      recipientPhone: formattedPhone,
      success: true,
      messageId: data.messageId,
      sentAt: new Date().toISOString(),
      data: payload.data
    });

    return {
      success: true,
      channel: 'sms',
      messageId: data.messageId,
      timestamp: Date.now()
    };

  } catch (error) {
    console.error('Error sending SMS notification:', error);

    // Log the failed attempt
    await logNotification({
      notificationType: payload.type,
      channel: 'sms',
      recipientId: payload.recipient.userId,
      recipientPhone: payload.recipient.phone,
      success: false,
      error: error.message,
      sentAt: new Date().toISOString(),
      data: payload.data
    });

    return {
      success: false,
      channel: 'sms',
      error: error,
      timestamp: Date.now()
    };
  }
};

/**
 * Retry sending an SMS notification
 */
export const retrySmsNotification = async (
  payload: NotificationPayload,
  retryCount = 0
): Promise<NotificationResult> => {
  if (retryCount >= MAX_RETRY_ATTEMPTS) {
    console.error(`Max retry attempts (${MAX_RETRY_ATTEMPTS}) reached for SMS notification`);
    return {
      success: false,
      channel: 'sms',
      error: new Error(`Max retry attempts (${MAX_RETRY_ATTEMPTS}) reached`),
      timestamp: Date.now()
    };
  }

  // Wait before retrying (exponential backoff)
  const delay = RETRY_DELAY_MS * Math.pow(2, retryCount);
  await new Promise(resolve => setTimeout(resolve, delay));

  console.log(`Retrying SMS notification (attempt ${retryCount + 1}/${MAX_RETRY_ATTEMPTS})`);
  return sendSmsNotification(payload);
}; 