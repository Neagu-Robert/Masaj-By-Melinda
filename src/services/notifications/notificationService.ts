import { sendEmailNotification, retryEmailNotification } from './emailService';
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

    return {
      userId: data.user_id,
      bookingCreationEnabled: data.booking_creation_enabled,
      bookingUpdateEnabled: data.booking_update_enabled,
      bookingCancellationEnabled: data.booking_cancellation_enabled,
      passwordChangeEnabled: data.password_change_enabled,
      reminderEnabled: (data as any).reminder_enabled ?? true
    };
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    return null;
  }
};

/**
 * Get service details from database
 */
const getServiceDetails = async (serviceId: number | null, serviceName: string): Promise<{ duration: number; price: number }> => {
  try {
    let service = null;

    // Try to get service by ID first
    if (serviceId) {
      const { data, error } = await supabase
        .from('services')
        .select('duration, price')
        .eq('id', serviceId)
        .single();

      if (!error && data) {
        service = data;
      }
    }

    // If not found by ID, try by name (only if serviceName is not empty)
    if (!service && serviceName && serviceName.trim() !== '') {
      const { data, error } = await supabase
        .from('services')
        .select('duration, price')
        .eq('name', serviceName)
        .eq('is_active', true)
        .single();

      if (!error && data) {
        service = data;
      }
    }

    // Return service details or defaults
    return {
      duration: service?.duration || 60,
      price: service?.price || 140.00
    };
  } catch (error) {
    console.error('Error fetching service details:', error);
    return {
      duration: 60,
      price: 140.00
    };
  }
};

/**
 * Send a notification through the appropriate channels based on notification type
 */
export const sendNotification = async (payload: NotificationPayload): Promise<NotificationResult[]> => {
  const results: NotificationResult[] = [];
  
  // Get user preferences (skip for demo users)
  const preferences = await getUserPreferences(payload.recipient.userId);
  
  // Get user role (used for logging purposes)
  let userRole = 'customer'; // Default
  if (payload.recipient.userId) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', payload.recipient.userId)
        .single();
      userRole = profile?.role || 'customer';
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  }

  // Get service details for accurate duration and price (skip for password changes)
  let enrichedPayload = payload;
  
  if (payload.type !== 'password_changed') {
    const serviceDetails = await getServiceDetails(payload.data.serviceId, payload.data.serviceName);
    
    // Update payload data with service details
    enrichedPayload = {
      ...payload,
      data: {
        ...payload.data,
        duration: serviceDetails.duration,
        price: serviceDetails.price,
      }
    };
  }

  // Determine if email notifications should be sent based on preferences
  const shouldSendEmailNotification = (notificationType: string): boolean => {
    if (!preferences) {
      console.log(`No preferences found for user ${payload.recipient.userId}, defaulting to send email notification for ${notificationType}`);
      return true; // Default to sending if no preferences
    }
    
    let shouldSend = false;
    switch (notificationType) {
      case 'booking_created_customer':
        shouldSend = preferences.bookingCreationEnabled;
        break;
      case 'booking_updated_profile':
      case 'booking_updated_admin':
        shouldSend = preferences.bookingUpdateEnabled;
        break;
      case 'booking_cancelled_profile':
      case 'booking_cancelled_admin':
        shouldSend = preferences.bookingCancellationEnabled;
        break;
      case 'reminder':
        shouldSend = preferences.reminderEnabled;
        break;
      case 'password_changed':
      case 'password_reset_requested':
        shouldSend = preferences.passwordChangeEnabled;
        break;
      default:
        shouldSend = true;
    }
    
    console.log(`Email notification preference check for ${notificationType}: ${shouldSend} (user: ${payload.recipient.userId})`);
    return shouldSend;
  };

  // Handle different notification types according to new specifications
  switch (payload.type) {
    case 'booking_created_customer':
      // Send email to customer (check email preferences)
      if (shouldSendEmailNotification(payload.type) && payload.recipient.email) {
        try {
          const emailResult = await sendEmailNotification(enrichedPayload);
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

    case 'booking_updated_profile':
    case 'booking_cancelled_profile':
      // Send email to customer (check email preferences)
      if (shouldSendEmailNotification(payload.type) && payload.recipient.email) {
        try {
          const emailResult = await sendEmailNotification(enrichedPayload);
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

    case 'booking_updated_admin':
      // Send email to customer (check email preferences)
      if (shouldSendEmailNotification(payload.type) && payload.recipient.email) {
        try {
          const emailResult = await sendEmailNotification(enrichedPayload);
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

    case 'booking_cancelled_admin':
      // Only send email to customer (check email preferences)
      if (shouldSendEmailNotification(payload.type) && payload.recipient.email) {
        try {
          const emailResult = await sendEmailNotification(enrichedPayload);
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
      // Send reminder email to customer only (check email preferences)
      if (shouldSendEmailNotification(payload.type) && payload.recipient.email) {
        try {
          const emailResult = await sendEmailNotification(enrichedPayload);
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

    case 'password_changed':
      // Send password change notification email to user (check email preferences)
      if (shouldSendEmailNotification(payload.type) && payload.recipient.email) {
        try {
          const emailResult = await sendEmailNotification(enrichedPayload);
          results.push(emailResult);
        } catch (error) {
          console.error('Error sending password change notification:', error);
          results.push({
            success: false,
            channel: 'email',
            error: error as Error,
            timestamp: Date.now()
          });
        }
      }
      break;

    case 'password_reset_requested':
      // Send password reset request notification email to user (check email preferences)
      if (shouldSendEmailNotification(payload.type) && payload.recipient.email) {
        try {
          const emailResult = await sendEmailNotification(enrichedPayload);
          results.push(emailResult);
        } catch (error) {
          console.error('Error sending password reset request notification:', error);
          results.push({
            success: false,
            channel: 'email',
            error: error as Error,
            timestamp: Date.now()
          });
        }
      }
      break;

    case 'booking_approval_needed':
      // Send email to customer (always send, critical communication)
      if (payload.recipient.email) {
        try {
          const emailResult = await sendEmailNotification(enrichedPayload);
          results.push(emailResult);
        } catch (error) {
          console.error('Error sending approval needed email:', error);
          results.push({
            success: false,
            channel: 'email',
            error: error as Error,
            timestamp: Date.now()
          });
        }
      }
      break;

    case 'booking_confirmed_by_admin':
      // Send email to customer (always send, critical communication)
      if (payload.recipient.email) {
        try {
          const emailResult = await sendEmailNotification(enrichedPayload);
          results.push(emailResult);
        } catch (error) {
          console.error('Error sending confirmation email:', error);
          results.push({
            success: false,
            channel: 'email',
            error: error as Error,
            timestamp: Date.now()
          });
        }
      }
      // NO SMS to admin - admin performed this action themselves
      break;

    case 'booking_rejected_by_admin':
      // Send email to customer (always send, critical communication)
      if (payload.recipient.email) {
        try {
          const emailResult = await sendEmailNotification(enrichedPayload);
          results.push(emailResult);
        } catch (error) {
          console.error('Error sending rejection email:', error);
          results.push({
            success: false,
            channel: 'email',
            error: error as Error,
            timestamp: Date.now()
          });
        }
      }
      // NO SMS to admin - admin performed this action themselves
      break;

    case 'booking_suggestion_sent':
      // Send email to customer (always send, critical communication with Yes/No buttons)
      if (payload.recipient.email) {
        try {
          const emailResult = await sendEmailNotification(enrichedPayload);
          results.push(emailResult);
        } catch (error) {
          console.error('Error sending suggestion email:', error);
          results.push({
            success: false,
            channel: 'email',
            error: error as Error,
            timestamp: Date.now()
          });
        }
      }
      // NO SMS to admin - admin performed this action themselves
      break;

    default:
      // Default behavior for other notification types
      // Send email notification (check email preferences)
      if (shouldSendEmailNotification(payload.type) && payload.recipient.email) {
        try {
          const emailResult = await sendEmailNotification(enrichedPayload);
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
        retryResult = result;
      }
      
      results[i] = retryResult;
    }
  }
  
  return results;
}; 