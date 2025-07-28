import { sendEmailNotification, retryEmailNotification } from './emailService';
import { sendSmsNotification, retrySmsNotification } from './smsService';
import { logNotification } from './loggingService';
import { NotificationPayload, NotificationResult, NotificationPreference } from './types';
import { supabase } from '../../integrations/supabase/client';

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
 * Send a notification through the appropriate channels
 */
export const sendNotification = async (payload: NotificationPayload): Promise<NotificationResult[]> => {
  const results: NotificationResult[] = [];
  
  // Get user preferences (skip for demo users)
  const preferences = await getUserPreferences(payload.recipient.userId);
  
  // For demo users or when no preferences exist, send both email and SMS
  const shouldSendEmail = !preferences || preferences.emailEnabled;
  const shouldSendSMS = !preferences || preferences.smsEnabled;

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