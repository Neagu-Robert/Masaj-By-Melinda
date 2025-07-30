import { sendEmailNotification, retryEmailNotification } from './emailService';
import { sendSmsNotification, retrySmsNotification } from './smsService';
import { logNotification } from './loggingService';
import { NotificationPayload, NotificationResult, NotificationPreference } from './types';
import { supabase } from '../../integrations/supabase/client';
import { ADMIN_PHONE_NUMBERS } from './config';

/**
 * Get user notification preferences
 */
const getUserPreferences = async (userId: string | null): Promise<NotificationPreference | null> => {
  // Skip preference check for demo users (null userId)
  if (!userId) {
    console.log('Skipping preference check for demo user');
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle(); // Use maybeSingle instead of single to avoid errors

    if (error) {
      console.error('Error fetching user preferences:', error);
      return null;
    }

    // If no preferences found, return null (will use defaults)
    if (!data) {
      console.log('No preferences found for user, using defaults');
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    return null;
  }
};

/**
 * Send SMS notifications to all admin numbers
 */
const sendAdminSmsNotifications = async (
  notificationType: string,
  bookingData: any
): Promise<NotificationResult[]> => {
  const results: NotificationResult[] = [];
  
  // Send SMS to all admin numbers using the notification type as template
  for (const adminPhone of ADMIN_PHONE_NUMBERS) {
    try {
      const adminPayload: NotificationPayload = {
        type: notificationType as any, // Use the notification type directly as template
        recipient: {
          userId: null, // Admin notifications don't have a specific user
          email: '', // Not needed for SMS
          phone: adminPhone,
          name: 'Admin'
        },
        data: bookingData
      };

      const smsResult = await sendSmsNotification(adminPayload);
      results.push(smsResult);
    } catch (error) {
      console.error('Error sending admin SMS notification:', error);
      results.push({
        success: false,
        channel: 'sms',
        error: error as Error,
        timestamp: Date.now()
      });
    }
  }

  return results;
};

/**
 * Send a notification through the appropriate channels based on notification type
 */
export const sendNotification = async (payload: NotificationPayload): Promise<NotificationResult[]> => {
  const results: NotificationResult[] = [];
  
  // Get user preferences (skip for demo users)
  const preferences = await getUserPreferences(payload.recipient.userId);
  
  // For demo users or when no preferences exist, send both email and SMS
  const shouldSendEmail = !preferences || preferences.emailEnabled;
  const shouldSendSMS = !preferences || preferences.smsEnabled;

  // Handle different notification types according to new specifications
  switch (payload.type) {
    case 'booking_created_customer':
      // Send email to customer and SMS to admins
      if (shouldSendEmail && payload.recipient.email) {
        try {
          const emailResult = await sendEmailNotification(payload);
          results.push(emailResult);
        } catch (error) {
          console.error('Error sending email notification:', error);
          results.push({
            success: false,
            channel: 'email',
            error: error as Error,
            timestamp: Date.now()
          });
        }
      }
      
      // Send SMS to admins
      const adminSmsResults = await sendAdminSmsNotifications(payload.type, payload.data);
      results.push(...adminSmsResults);
      break;

    case 'booking_updated_profile':
    case 'booking_cancelled_profile':
      // Send email to customer and SMS to admins
      if (shouldSendEmail && payload.recipient.email) {
        try {
          const emailResult = await sendEmailNotification(payload);
          results.push(emailResult);
        } catch (error) {
          console.error('Error sending email notification:', error);
          results.push({
            success: false,
            channel: 'email',
            error: error as Error,
            timestamp: Date.now()
          });
        }
      }
      
      // Send SMS to admins
      const adminSmsResults2 = await sendAdminSmsNotifications(payload.type, payload.data);
      results.push(...adminSmsResults2);
      break;

    case 'booking_created_admin':
      // Only send SMS to admins
      const adminSmsResults3 = await sendAdminSmsNotifications(payload.type, payload.data);
      results.push(...adminSmsResults3);
      break;

    case 'booking_updated_admin':
      // Send email to customer and SMS to admins
      if (shouldSendEmail && payload.recipient.email) {
        try {
          const emailResult = await sendEmailNotification(payload);
          results.push(emailResult);
        } catch (error) {
          console.error('Error sending email notification:', error);
          results.push({
            success: false,
            channel: 'email',
            error: error as Error,
            timestamp: Date.now()
          });
        }
      }
      
      // Send SMS to admins
      const adminSmsResults4 = await sendAdminSmsNotifications(payload.type, payload.data);
      results.push(...adminSmsResults4);
      break;

    case 'booking_cancelled_admin':
      // Only send email to customer (no SMS to admins)
      if (shouldSendEmail && payload.recipient.email) {
        try {
          const emailResult = await sendEmailNotification(payload);
          results.push(emailResult);
        } catch (error) {
          console.error('Error sending email notification:', error);
          results.push({
            success: false,
            channel: 'email',
            error: error as Error,
            timestamp: Date.now()
          });
        }
      }
      break;

    case 'reminder':
      // Send reminder email to customer only (no SMS)
      if (shouldSendEmail && payload.recipient.email) {
        try {
          const emailResult = await sendEmailNotification(payload);
          results.push(emailResult);
        } catch (error) {
          console.error('Error sending email notification:', error);
          results.push({
            success: false,
            channel: 'email',
            error: error as Error,
            timestamp: Date.now()
          });
        }
      }
      break;

    default:
      // Default behavior for other notification types
      // Send email notification
      if (shouldSendEmail && payload.recipient.email) {
        try {
          const emailResult = await sendEmailNotification(payload);
          results.push(emailResult);
        } catch (error) {
          console.error('Error sending email notification:', error);
          results.push({
            success: false,
            channel: 'email',
            error: error as Error,
            timestamp: Date.now()
          });
        }
      }

      // Send SMS notification
      if (shouldSendSMS && payload.recipient.phone) {
        try {
          const smsResult = await sendSmsNotification(payload);
          results.push(smsResult);
        } catch (error) {
          console.error('Error sending SMS notification:', error);
          results.push({
            success: false,
            channel: 'sms',
            error: error as Error,
            timestamp: Date.now()
          });
        }
      }
      break;
  }

  return results;
};

/**
 * Send a notification with retry logic
 */
export const notify = async (payload: NotificationPayload): Promise<NotificationResult[]> => {
  console.log('Sending notification:', payload.type, 'to:', payload.recipient.email);
  
  const results = await sendNotification(payload);
  
  // Handle retries for failed notifications
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (!result.success && result.error) {
      console.log(`Retrying ${result.channel} notification...`);
      
      let retryResult: NotificationResult;
      if (result.channel === 'email') {
        retryResult = await retryEmailNotification(payload);
      } else {
        retryResult = await retrySmsNotification(payload);
      }
      
      results[i] = retryResult;
    }
  }
  
  return results;
}; 