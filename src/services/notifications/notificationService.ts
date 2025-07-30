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

    // If not found by ID, try by name
    if (!service) {
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
 * Send reminder notifications using Vercel API route
 */
const sendReminderNotifications = async (): Promise<NotificationResult[]> => {
  const results: NotificationResult[] = [];
  
  try {
    // Get the API base URL based on environment
    const apiBaseUrl = import.meta.env.DEV 
      ? 'http://localhost:3003' 
      : 'https://masajbymelinda.ro';
    
    // Call the Vercel API route for reminders
    const response = await fetch(`${apiBaseUrl}/api/send-reminders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    if (!data.success) {
      throw new Error(data.message || 'Failed to send reminders');
    }

    // Log successful reminder processing
    await logNotification({
      notificationType: 'reminder',
      channel: 'email',
      recipientId: null, // System-wide reminder
      success: true,
      sentAt: new Date().toISOString(),
      data: { message: data.message, results: data.results }
    });

    results.push({
      success: true,
      channel: 'email',
      messageId: `reminder-${Date.now()}`,
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('Error sending reminder notifications:', error);
    
    // Log failed reminder processing
    await logNotification({
      notificationType: 'reminder',
      channel: 'email',
      recipientId: null, // System-wide reminder
      success: false,
      error: error.message,
      sentAt: new Date().toISOString()
    });

    results.push({
      success: false,
      channel: 'email',
      error: error as Error,
      timestamp: Date.now()
    });
  }

  return results;
};

/**
 * Send SMS notifications to all admin numbers
 */
const sendAdminSmsNotifications = async (
  notificationType: string,
  bookingData: any
): Promise<NotificationResult[]> => {
  const results: NotificationResult[] = [];
  
  // Get service details for accurate duration and price
  const serviceDetails = await getServiceDetails(bookingData.serviceId, bookingData.serviceName);
  
  // Update booking data with service details
  const enrichedBookingData = {
    ...bookingData,
    duration: serviceDetails.duration,
    price: serviceDetails.price
  };
  
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
        data: enrichedBookingData
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

  // Get service details for accurate duration and price
  const serviceDetails = await getServiceDetails(payload.data.serviceId, payload.data.serviceName);
  
        // Update payload data with service details
      const enrichedPayload = {
        ...payload,
        data: {
          ...payload.data,
          duration: serviceDetails.duration,
          price: serviceDetails.price,
        }
      };

  // Handle different notification types according to new specifications
  switch (payload.type) {
    case 'booking_created_customer':
      // Send email to customer and SMS to admins
      if (shouldSendEmail && payload.recipient.email) {
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
      
      // Send SMS to admins
      const adminSmsResults = await sendAdminSmsNotifications(payload.type, enrichedPayload.data);
      results.push(...adminSmsResults);
      break;

    case 'booking_updated_profile':
    case 'booking_cancelled_profile':
      // Send email to customer and SMS to admins
      if (shouldSendEmail && payload.recipient.email) {
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
      
      // Send SMS to admins
      const adminSmsResults2 = await sendAdminSmsNotifications(payload.type, enrichedPayload.data);
      results.push(...adminSmsResults2);
      break;

    case 'booking_created_admin':
      // Only send SMS to admins
      const adminSmsResults3 = await sendAdminSmsNotifications(payload.type, enrichedPayload.data);
      results.push(...adminSmsResults3);
      break;

    case 'booking_updated_admin':
      // Send email to customer and SMS to admins
      if (shouldSendEmail && payload.recipient.email) {
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
      
      // Send SMS to admins
      const adminSmsResults4 = await sendAdminSmsNotifications(payload.type, enrichedPayload.data);
      results.push(...adminSmsResults4);
      break;

    case 'booking_cancelled_admin':
      // Only send email to customer (no SMS to admins)
      if (shouldSendEmail && payload.recipient.email) {
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
      // Send reminder email to customer only (no SMS)
      if (shouldSendEmail && payload.recipient.email) {
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

    default:
      // Default behavior for other notification types
      // Send email notification
      if (shouldSendEmail && payload.recipient.email) {
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

      // Send SMS notification
      if (shouldSendSMS && payload.recipient.phone) {
        try {
          const smsResult = await sendSmsNotification(enrichedPayload);
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

/**
 * Send reminder notifications (for manual triggering)
 */
export const sendReminders = async (): Promise<NotificationResult[]> => {
  console.log('Sending reminder notifications...');
  return await sendReminderNotifications();
}; 