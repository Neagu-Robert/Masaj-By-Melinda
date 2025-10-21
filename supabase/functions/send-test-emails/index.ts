// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { BookingNotificationData } from './types.ts';

const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY') || '';
const BREVO_FROM_EMAIL = Deno.env.get('BREVO_FROM_EMAIL') || 'masajbymelinda@gmail.com';
const BREVO_FROM_NAME = Deno.env.get('BREVO_FROM_NAME') || 'Masaj by Melinda';

const testUserEmails = [
  'masterroberto636@gmail.com',
  'robertneagu814@gmail.com',
  'rneagu988@gmail.com',
  'robert.neagu@alazar.ro',
  'neagumelinda25@gmail.com',
  'melindaneagu22@gmail.com',
];

const emailTemplates = {
  booking_created_customer: (data: BookingNotificationData): { subject: string; html: string; text: string } => {
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

  booking_updated_profile: (data: BookingNotificationData): { subject: string; html: string; text: string } => {
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

  booking_updated_admin: (data: BookingNotificationData): { subject: string; html: string; text: string } => {
    const subject = `Booking Updated by Admin - ${data.serviceName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #8b5cf6;">Booking Updated</h2>
        <p>Dear ${data.userName},</p>
        <p>Your booking has been updated by our staff.</p>
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Updated Booking Details:</h3>
          <p><strong>Service:</strong> ${data.serviceName}</p>
          <p><strong>Date & Time:</strong> ${data.dateTime}</p>
          <p><strong>Duration:</strong> ${data.duration} minutes</p>
          <p><strong>Price:</strong> ${data.price} RON</p>
          <p><strong>Status:</strong> ${data.status}</p>
        </div>
        <p>If you have any questions about these changes, please contact us.</p>
        <p>Best regards,<br>Masaj by Melinda</p>
      </div>
    `;
    const text = `
      Booking Updated by Admin
      
      Dear ${data.userName},
      
      Your booking has been updated by our staff.
      
      Updated Booking Details:
      - Service: ${data.serviceName}
      - Date & Time: ${data.dateTime}
      - Duration: ${data.duration} minutes
      - Price: ${data.price} RON
      - Status: ${data.status}
      
      If you have any questions about these changes, please contact us.
      
      Best regards,
      Masaj by Melinda
    `;
    return { subject, html, text };
  },

  booking_cancelled_profile: (data: BookingNotificationData): { subject: string; html: string; text: string } => {
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

  booking_cancelled_admin: (data: BookingNotificationData): { subject: string; html: string; text: string } => {
    const subject = `Booking Cancelled by Admin - ${data.serviceName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ef4444;">Booking Cancelled</h2>
        <p>Dear ${data.userName},</p>
        <p>Your booking has been cancelled by our staff.</p>
        <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Cancelled Booking Details:</h3>
          <p><strong>Service:</strong> ${data.serviceName}</p>
          <p><strong>Date & Time:</strong> ${data.dateTime}</p>
          <p><strong>Duration:</strong> ${data.duration} minutes</p>
          <p><strong>Price:</strong> ${data.price} RON</p>
        </div>
        <p>If you have any questions about this cancellation, please contact us.</p>
        <p>Best regards,<br>Masaj by Melinda</p>
      </div>
    `;
    const text = `
      Booking Cancelled by Admin
      
      Dear ${data.userName},
      
      Your booking has been cancelled by our staff.
      
      Cancelled Booking Details:
      - Service: ${data.serviceName}
      - Date & Time: ${data.dateTime}
      - Duration: ${data.duration} minutes
      - Price: ${data.price} RON
      
      If you have any questions about this cancellation, please contact us.
      
      Best regards,
      Masaj by Melinda
    `;
    return { subject, html, text };
  },

  recurring_created_profile: (data: BookingNotificationData): { subject: string; html: string; text: string } => {
    const subject = `Recurring Enabled - ${data.serviceName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">Recurring Booking Enabled</h2>
        <p>Dear ${data.userName},</p>
        <p>Your booking has been set to recur.</p>
        <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Recurring Details:</h3>
          <p><strong>Service:</strong> ${data.serviceName}</p>
          <p><strong>Start:</strong> ${data.dateTime}</p>
          <p><strong>Recurrence:</strong> ${data.notes || 'Weekly/Biweekly'}</p>
        </div>
        <p>You can disable the recurrence at any time from your profile.</p>
        <p>Best regards,<br>Masaj by Melinda</p>
      </div>
    `;
    const text = `
      Recurring Booking Enabled
      
      Dear ${data.userName},
      
      Your booking has been set to recur.
      
      Recurring Details:
      - Service: ${data.serviceName}
      - Start: ${data.dateTime}
      - Recurrence: ${data.notes || 'Weekly/Biweekly'}
      
      You can disable the recurrence at any time from your profile.
      
      Best regards,
      Masaj by Melinda
    `;
    return { subject, html, text };
  },

  recurring_cancelled_profile: (data: BookingNotificationData): { subject: string; html: string; text: string } => {
    const subject = `Recurring Disabled - ${data.serviceName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ef4444;">Recurring Booking Disabled</h2>
        <p>Dear ${data.userName},</p>
        <p>Your recurring booking has been cancelled. Future recurring instances have been removed.</p>
        <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Cancelled Recurrence:</h3>
          <p><strong>Service:</strong> ${data.serviceName}</p>
          <p><strong>Original:</strong> ${data.dateTime}</p>
        </div>
        <p>If this was a mistake, you can re-enable recurrence from your profile.</p>
        <p>Best regards,<br>Masaj by Melinda</p>
      </div>
    `;
    const text = `
      Recurring Booking Disabled
      
      Dear ${data.userName},
      
      Your recurring booking has been cancelled. Future recurring instances have been removed.
      
      Cancelled Recurrence:
      - Service: ${data.serviceName}
      - Original: ${data.dateTime}
      
      If this was a mistake, you can re-enable recurrence from your profile.
      
      Best regards,
      Masaj by Melinda
    `;
    return { subject, html, text };
  },

  recurring_created_admin: (data: BookingNotificationData): { subject: string; html: string; text: string } => {
    const subject = `Recurring Enabled by Admin - ${data.serviceName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">Recurring Booking Enabled (Admin)</h2>
        <p>Dear ${data.userName},</p>
        <p>Your booking has been set to recur by our staff.</p>
        <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Recurring Details:</h3>
          <p><strong>Service:</strong> ${data.serviceName}</p>
          <p><strong>Start:</strong> ${data.dateTime}</p>
          <p><strong>Recurrence:</strong> ${data.notes || 'Weekly/Biweekly'}</p>
        </div>
        <p>If this was not intended, please contact us.</p>
        <p>Best regards,<br>Masaj by Melinda</p>
      </div>
    `;
    const text = `
      Recurring Booking Enabled (Admin)
      
      Dear ${data.userName},
      
      Your booking has been set to recur by our staff.
      
      Recurring Details:
      - Service: ${data.serviceName}
      - Start: ${data.dateTime}
      - Recurrence: ${data.notes || 'Weekly/Biweekly'}
      
      If this was not intended, please contact us.
      
      Best regards,
      Masaj by Melinda
    `;
    return { subject, html, text };
  },

  recurring_cancelled_admin: (data: BookingNotificationData): { subject: string; html: string; text: string } => {
    const subject = `Recurring Disabled by Admin - ${data.serviceName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ef4444;">Recurring Booking Disabled (Admin)</h2>
        <p>Dear ${data.userName},</p>
        <p>Your recurring booking has been cancelled by our staff. Future recurring instances have been removed.</p>
        <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Cancelled Recurrence:</h3>
          <p><strong>Service:</strong> ${data.serviceName}</p>
          <p><strong>Original:</strong> ${data.dateTime}</p>
        </div>
        <p>If this was not intended, please contact us.</p>
        <p>Best regards,<br>Masaj by Melinda</p>
      </div>
    `;
    const text = `
      Recurring Booking Disabled (Admin)
      
      Dear ${data.userName},
      
      Your recurring booking has been cancelled by our staff. Future recurring instances have been removed.
      
      Cancelled Recurrence:
      - Service: ${data.serviceName}
      - Original: ${data.dateTime}
      
      If this was not intended, please contact us.
      
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
  },

  password_changed: (data: BookingNotificationData): { subject: string; html: string; text: string } => {
    const subject = `Password Changed Successfully`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">Password Changed</h2>
        <p>Dear ${data.userName},</p>
        <p>Your password has been successfully changed.</p>
        <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Account Security Update:</h3>
          <p><strong>Account:</strong> ${data.userEmail}</p>
          <p><strong>Change Date:</strong> ${data.dateTime}</p>
        </div>
        <p>If you did not make this change, please contact us immediately for assistance.</p>
        <p>Best regards,<br>Masaj by Melinda</p>
      </div>
    `;
    const text = `
      Password Changed Successfully
      
      Dear ${data.userName},
      
      Your password has been successfully changed.
      
      Account Security Update:
      - Account: ${data.userEmail}
      - Change Date: ${data.dateTime}
      
      If you did not make this change, please contact us immediately for assistance.
      
      Best regards,
      Masaj by Melinda
    `;
    return { subject, html, text };
  },

  password_reset_requested: (data: BookingNotificationData): { subject: string; html: string; text: string } => {
    const subject = `Password Reset Requested`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">Password Reset Succesfuly</h2>
        <p>Dear ${data.userName},</p>
        <p>We received a request to reset your password for your Masaj by Melinda account.</p>
        <div style="background-color: #fffbeb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Account Information:</h3>
          <p><strong>Account:</strong> ${data.userEmail}</p>
          <p><strong>Request Date:</strong> ${data.dateTime}</p>
        </div>
        <p>If you did not request this password reset, please ignore this email. Your password will remain unchanged.</p>
        <p>If you did request this reset, please check your email for the reset link and follow the instructions.</p>
        <p>For security reasons, password reset links expire after a short time.</p>
        <p>Best regards,<br>Masaj by Melinda</p>
      </div>
    `;
    const text = `
      Password Reset Requested
      
      Dear ${data.userName},
      
      We received a request to reset your password for your Masaj by Melinda account.
      
      Account Information:
      - Account: ${data.userEmail}
      - Request Date: ${data.dateTime}
      
      If you did not request this password reset, please ignore this email. Your password will remain unchanged.
      
      If you did request this reset, please check your email for the reset link and follow the instructions.
      
      For security reasons, password reset links expire after a short time.
      
      Best regards,
      Masaj by Melinda
    `;
    return { subject, html, text };
  }
};

serve(async (req) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const { data: state, error: fetchError } = await supabase
      .from('test_email_state')
      .select('last_sent_index')
      .eq('id', 1)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch test email state: ${fetchError.message}`);
    }

    const lastIndex = state?.last_sent_index ?? -1;
    const nextIndex = (lastIndex + 1) % testUserEmails.length;
    const recipientEmail = testUserEmails[nextIndex];

    const templateKeys = Object.keys(emailTemplates);
    const randomTemplateKey = templateKeys[Math.floor(Math.random() * templateKeys.length)];
    const template = emailTemplates[randomTemplateKey];
    
    const hardcodedData: BookingNotificationData = {
      userName: 'Test User',
      userEmail: recipientEmail,
      serviceName: 'Test Service',
      dateTime: new Date().toLocaleString('ro-RO'),
      duration: 60,
      price: 150,
      status: 'Confirmed',
      notes: 'This is a test note.',
    };

    const { subject, html, text } = template(hardcodedData);

    const brevoPayload = {
      to: [{ email: recipientEmail }],
      sender: {
        email: BREVO_FROM_EMAIL,
        name: BREVO_FROM_NAME,
      },
      subject,
      htmlContent: html,
      textContent: text,
    };

    await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(brevoPayload),
    });

    const { error: updateError } = await supabase
      .from('test_email_state')
      .update({ last_sent_index: nextIndex, updated_at: new Date().toISOString() })
      .eq('id', 1);

    if (updateError) {
      console.error(`Failed to update test email state: ${updateError.message}`);
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Test email sent to ${recipientEmail} with template ${randomTemplateKey}.`
    }), { status: 200, headers });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      message: error.message
    }), { status: 500, headers });
  }
});
