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
import { supabase } from '../../integrations/supabase/client';

// SMS templates
const smsTemplates = {
  booking_created: (data: BookingNotificationData): string => {
    return `Masaj by Melinda: Your booking for ${data.serviceName} on ${data.dateTime} has been confirmed. Duration: ${data.duration} min. Thank you!`;
  },

  booking_updated: (data: BookingNotificationData): string => {
    return `Masaj by Melinda: Your booking has been updated. New details: ${data.serviceName} on ${data.dateTime}. Duration: ${data.duration} min.`;
  },

  booking_cancelled: (data: BookingNotificationData): string => {
    return `Masaj by Melinda: Your booking for ${data.serviceName} on ${data.dateTime} has been cancelled. Please contact us if you have any questions.`;
  },

  reminder: (data: BookingNotificationData): string => {
    return `Masaj by Melinda: Reminder for your appointment tomorrow: ${data.serviceName} at ${data.dateTime}. We look forward to seeing you!`;
  }
};

/**
 * Check if SMS is properly configured
 */
const isSmsConfigured = (): boolean => {
  return !!(
    SMS_NOTIFICATIONS_ENABLED &&
    INFOBIP_API_KEY && 
    INFOBIP_SENDER_NUMBER
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

    // Call the Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('send-sms', {
      body: {
        to: formattedPhone,
        message: smsContent
      }
    });

    if (error) {
      throw new Error(`Edge Function error: ${error.message}`);
    }

    if (!data || !data.success) {
      throw new Error(data?.error || 'Failed to send SMS');
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