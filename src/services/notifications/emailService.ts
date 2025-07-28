import { 
  SENDGRID_FROM_EMAIL, 
  SENDGRID_FROM_NAME,
  EMAIL_NOTIFICATIONS_ENABLED 
} from './config';
import { 
  NotificationPayload, 
  NotificationResult, 
  BookingNotificationData 
} from './types';
import { logNotification } from './loggingService';

// Email templates
const emailTemplates = {
  booking_created: (data: BookingNotificationData): { subject: string; html: string; text: string } => {
    const subject = `Booking Confirmation - ${data.serviceName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #8b5cf6;">Booking Confirmation</h2>
        <p>Dear ${data.userName},</p>
        <p>Your booking has been confirmed successfully!</p>
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Booking Details:</h3>
          <p><strong>Service:</strong> ${data.serviceName}</p>
          <p><strong>Date & Time:</strong> ${data.dateTime}</p>
          <p><strong>Duration:</strong> ${data.duration} minutes</p>
          <p><strong>Price:</strong> ${data.price} RON</p>
          <p><strong>Status:</strong> ${data.status}</p>
        </div>
        <p>We look forward to seeing you!</p>
        <p>Best regards,<br>Masaj by Melinda</p>
      </div>
    `;
    const text = `
      Booking Confirmation
      
      Dear ${data.userName},
      
      Your booking has been confirmed successfully!
      
      Booking Details:
      - Service: ${data.serviceName}
      - Date & Time: ${data.dateTime}
      - Duration: ${data.duration} minutes
      - Price: ${data.price} RON
      - Status: ${data.status}
      
      We look forward to seeing you!
      
      Best regards,
      Masaj by Melinda
    `;
    return { subject, html, text };
  },

  booking_updated: (data: BookingNotificationData): { subject: string; html: string; text: string } => {
    const subject = `Booking Updated - ${data.serviceName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #8b5cf6;">Booking Updated</h2>
        <p>Dear ${data.userName},</p>
        <p>Your booking has been updated successfully!</p>
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Updated Booking Details:</h3>
          <p><strong>Service:</strong> ${data.serviceName}</p>
          <p><strong>Date & Time:</strong> ${data.dateTime}</p>
          <p><strong>Duration:</strong> ${data.duration} minutes</p>
          <p><strong>Price:</strong> ${data.price} RON</p>
          <p><strong>Status:</strong> ${data.status}</p>
        </div>
        <p>If you have any questions, please contact us.</p>
        <p>Best regards,<br>Masaj by Melinda</p>
      </div>
    `;
    const text = `
      Booking Updated
      
      Dear ${data.userName},
      
      Your booking has been updated successfully!
      
      Updated Booking Details:
      - Service: ${data.serviceName}
      - Date & Time: ${data.dateTime}
      - Duration: ${data.duration} minutes
      - Price: ${data.price} RON
      - Status: ${data.status}
      
      If you have any questions, please contact us.
      
      Best regards,
      Masaj by Melinda
    `;
    return { subject, html, text };
  },

  booking_cancelled: (data: BookingNotificationData): { subject: string; html: string; text: string } => {
    const subject = `Booking Cancelled - ${data.serviceName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ef4444;">Booking Cancelled</h2>
        <p>Dear ${data.userName},</p>
        <p>Your booking has been cancelled.</p>
        <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Cancelled Booking Details:</h3>
          <p><strong>Service:</strong> ${data.serviceName}</p>
          <p><strong>Date & Time:</strong> ${data.dateTime}</p>
          <p><strong>Duration:</strong> ${data.duration} minutes</p>
          <p><strong>Price:</strong> ${data.price} RON</p>
        </div>
        <p>If you have any questions or would like to reschedule, please contact us.</p>
        <p>Best regards,<br>Masaj by Melinda</p>
      </div>
    `;
    const text = `
      Booking Cancelled
      
      Dear ${data.userName},
      
      Your booking has been cancelled.
      
      Cancelled Booking Details:
      - Service: ${data.serviceName}
      - Date & Time: ${data.dateTime}
      - Duration: ${data.duration} minutes
      - Price: ${data.price} RON
      
      If you have any questions or would like to reschedule, please contact us.
      
      Best regards,
      Masaj by Melinda
    `;
    return { subject, html, text };
  },

  reminder: (data: BookingNotificationData): { subject: string; html: string; text: string } => {
    const subject = `Appointment Reminder - ${data.serviceName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #8b5cf6;">Appointment Reminder</h2>
        <p>Dear ${data.userName},</p>
        <p>This is a friendly reminder about your upcoming appointment tomorrow.</p>
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Appointment Details:</h3>
          <p><strong>Service:</strong> ${data.serviceName}</p>
          <p><strong>Date & Time:</strong> ${data.dateTime}</p>
          <p><strong>Duration:</strong> ${data.duration} minutes</p>
          <p><strong>Price:</strong> ${data.price} RON</p>
        </div>
        <p>We look forward to seeing you!</p>
        <p>Best regards,<br>Masaj by Melinda</p>
      </div>
    `;
    const text = `
      Appointment Reminder
      
      Dear ${data.userName},
      
      This is a friendly reminder about your upcoming appointment tomorrow.
      
      Appointment Details:
      - Service: ${data.serviceName}
      - Date & Time: ${data.dateTime}
      - Duration: ${data.duration} minutes
      - Price: ${data.price} RON
      
      We look forward to seeing you!
      
      Best regards,
      Masaj by Melinda
    `;
    return { subject, html, text };
  }
};

/**
 * Check if email is properly configured
 */
const isEmailConfigured = (): boolean => {
  return !!(
    EMAIL_NOTIFICATIONS_ENABLED &&
    SENDGRID_FROM_EMAIL &&
    SENDGRID_FROM_NAME
  );
};

/**
 * Send an email notification via Vercel API route
 */
export const sendEmailNotification = async (
  payload: NotificationPayload
): Promise<NotificationResult> => {
  if (!isEmailConfigured()) {
    console.error('Email notifications are not configured or enabled');
    return {
      success: false,
      channel: 'email',
      error: new Error('Email notifications are not configured or enabled'),
      timestamp: Date.now()
    };
  }

  if (!payload.recipient.email) {
    console.error('Recipient email is required');
    return {
      success: false,
      channel: 'email',
      error: new Error('Recipient email is required'),
      timestamp: Date.now()
    };
  }

  try {
    // Get the appropriate template
    const templateFn = emailTemplates[payload.type];
    if (!templateFn) {
      throw new Error(`Email template not found for notification type: ${payload.type}`);
    }

    // Generate the email content from template
    const emailContent = templateFn(payload.data as BookingNotificationData);

    // Call the Vercel API route
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: payload.recipient.email,
        subject: emailContent.subject,
        htmlContent: emailContent.html,
        textContent: emailContent.text
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    if (!data.success) {
      throw new Error(data.error || 'Failed to send email');
    }

    // Log the successful notification
    await logNotification({
      notificationType: payload.type,
      channel: 'email',
      recipientId: payload.recipient.userId,
      recipientEmail: payload.recipient.email,
      success: true,
      messageId: data.messageId,
      sentAt: new Date().toISOString(),
      data: payload.data
    });

    return {
      success: true,
      channel: 'email',
      messageId: data.messageId,
      timestamp: Date.now()
    };

  } catch (error) {
    console.error('Error sending email notification:', error);

    // Log the failed attempt
    await logNotification({
      notificationType: payload.type,
      channel: 'email',
      recipientId: payload.recipient.userId,
      recipientEmail: payload.recipient.email,
      success: false,
      error: error.message,
      sentAt: new Date().toISOString(),
      data: payload.data
    });

    return {
      success: false,
      channel: 'email',
      error: error,
      timestamp: Date.now()
    };
  }
};

/**
 * Retry sending an email notification
 */
export const retryEmailNotification = async (
  payload: NotificationPayload,
  retryCount = 0
): Promise<NotificationResult> => {
  if (retryCount >= 3) { // Fixed retry count for Vercel API
    const error = new Error(`Maximum retry attempts (3) reached for email notification type: ${payload.type}`);
    
    // Log the final failed attempt
    await logNotification({
      notificationType: payload.type,
      channel: 'email',
      recipientId: payload.recipient.userId,
      recipientEmail: payload.recipient.email,
      success: false,
      error: error.message,
      sentAt: new Date().toISOString(),
      data: payload.data,
      retryCount
    });
    
    return {
      success: false,
      channel: 'email',
      error,
      timestamp: Date.now()
    };
  }

  try {
    return await sendEmailNotification(payload);
  } catch (error) {
    console.error(`Email retry ${retryCount + 1}/3 failed:`, error);
    
    // Exponential backoff for retries
    const delay = Math.pow(2, retryCount) * 1000;
    await new Promise(resolve => setTimeout(resolve, delay));
    
    return retryEmailNotification(payload, retryCount + 1);
  }
}; 