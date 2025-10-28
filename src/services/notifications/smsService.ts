// Import only the necessary types and configurations
import { 
  TWILIO_SID,
  TWILIO_AUTH_TOKEN,
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
  ,
  // Recurring enabled by user
  recurring_created_profile: (data: BookingNotificationData): string => {
    const meta = data.notes ? ` (${data.notes})` : '';
    return `Masaj by Melinda: A recurring booking has been enabled by ${data.userName} for ${data.serviceName} starting ${data.dateTime}${meta}.`;
  },
  // Recurring cancelled by user
  recurring_cancelled_profile: (data: BookingNotificationData): string => {
    return `Masaj by Melinda: A recurring booking has been cancelled by ${data.userName} for ${data.serviceName} (original ${data.dateTime}).`;
  }
  ,
  // Single-instance cancelled by user (notify admins)
  recurring_instance_cancelled_profile: (data: BookingNotificationData): string => {
    return `Masaj by Melinda: A single recurring instance has been cancelled by ${data.userName} for ${data.serviceName} on ${data.dateTime}.`;
  },
  // Single-instance cancelled by admin (template included for completeness)
  recurring_instance_cancelled_admin: (data: BookingNotificationData): string => {
    return `Masaj by Melinda: A single recurring instance has been cancelled by admin for ${data.userName}'s ${data.serviceName} on ${data.dateTime}.`;
  }
};

/**
 * Get the API base URL based on environment
 */
import { getSupabaseFunctionUrl, supabaseAuthHeader } from '@/lib/supabase-functions';

/**
 * Check if SMS is properly configured
 */
const isSmsConfigured = (): boolean => {
  return !!(
    SMS_NOTIFICATIONS_ENABLED &&
    TWILIO_SID &&
    TWILIO_AUTH_TOKEN
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

    const AUTH_HEADER = await supabaseAuthHeader();

    // Call the Vercel API route
    const response = await fetch(getSupabaseFunctionUrl('send-sms'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...AUTH_HEADER,
      },
      body: JSON.stringify({
        to: formattedPhone,
        message: smsContent
      })
    });

    // Handle CORS and network errors
    if (!response.ok) {
      const errorText = await response.text();
      console.error('SMS API error:', response.status, response.statusText, errorText);
      
      if (response.status === 0 || response.status === 403) {
        throw new Error('CORS or network error - SMS service temporarily unavailable');
      }
      
      throw new Error(`SMS API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

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
      data: {
        ...payload.data,
        smsDetails: data.details, // Include Twilio response details
        smsStatus: data.status
      }
    });

    return {
      success: true,
      channel: 'sms',
      messageId: data.messageId,
      timestamp: Date.now(),
      details: data.details // Include additional details for debugging
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
  
  try {
    const result = await sendSmsNotification(payload);
    
    // If SMS was accepted but we want to be extra sure, we could add additional verification
    if (result.success && result.details) {
      console.log('SMS retry successful with details:', result.details);
    }
    
    return result;
  } catch (error) {
    console.error(`SMS retry ${retryCount + 1} failed:`, error);
    return retrySmsNotification(payload, retryCount + 1);
  }
}; 