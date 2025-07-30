import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { format, addDays } from 'https://esm.sh/date-fns@2';

// SendGrid client for sending emails
import sgMail from 'https://esm.sh/@sendgrid/mail@7';

// Initialize SendGrid
const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY') || '';
const SENDGRID_FROM_EMAIL = Deno.env.get('SENDGRID_FROM_EMAIL') || 'noreply@masajbymelinda.com';
const SENDGRID_FROM_NAME = Deno.env.get('SENDGRID_FROM_NAME') || 'Masaj by Melinda';

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

// Create a Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Email template for booking reminders
const generateReminderEmailHtml = (booking: any) => {
  const { first_name, last_name, service_type, booking_date, booking_time } = booking;
  const fullName = `${first_name} ${last_name}`.trim();
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #8b5cf6;">Appointment Reminder</h2>
      <p>Dear ${fullName},</p>
      <p>This is a friendly reminder about your upcoming appointment tomorrow.</p>
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Appointment Details:</h3>
        <p><strong>Service:</strong> ${service_type}</p>
        <p><strong>Date & Time:</strong> ${booking_date} at ${booking_time}</p>
        <p><strong>Duration:</strong> 60 minutes</p>
        <p><strong>Price:</strong> 150 RON</p>
      </div>
      <p>We look forward to seeing you!</p>
      <p>Best regards,<br>Masaj by Melinda</p>
    </div>
  `;
};

const generateReminderEmailText = (booking: any) => {
  const { first_name, last_name, service_type, booking_date, booking_time } = booking;
  const fullName = `${first_name} ${last_name}`.trim();
  
  return `
    Appointment Reminder
    
    Dear ${fullName},
    
    This is a friendly reminder about your upcoming appointment tomorrow.
    
    Appointment Details:
    - Service: ${service_type}
    - Date & Time: ${booking_date} at ${booking_time}
    - Duration: 60 minutes
    - Price: 150 RON
    
    We look forward to seeing you!
    
    Best regards,
    Masaj by Melinda
  `;
};

// Send reminder email
const sendReminderEmail = async (booking: any, userEmail: string) => {
  if (!SENDGRID_API_KEY) {
    console.error('SendGrid API key is not configured');
    return false;
  }

  try {
    const msg = {
      to: userEmail,
      from: {
        email: SENDGRID_FROM_EMAIL,
        name: SENDGRID_FROM_NAME
      },
      subject: 'Reminder: Your Upcoming Appointment - Masaj by Melinda',
      text: generateReminderEmailText(booking),
      html: generateReminderEmailHtml(booking)
    };

    await sgMail.send(msg);
    
    // Log the notification
    await supabase.from('notification_logs').insert({
      notification_type: 'reminder',
      channel: 'email',
      recipient_id: booking.user_id,
      recipient_email: userEmail,
      success: true,
      sent_at: new Date().toISOString(),
      data: booking
    });
    
    return true;
  } catch (error) {
    console.error('Error sending email notification:', error);
    
    // Log the failed notification
    await supabase.from('notification_logs').insert({
      notification_type: 'reminder',
      channel: 'email',
      recipient_id: booking.user_id,
      recipient_email: userEmail,
      success: false,
      error: error.message || 'Unknown error',
      sent_at: new Date().toISOString(),
      data: booking
    });
    
    return false;
  }
};

// Main handler function
serve(async (req) => {
  try {
    // Get tomorrow's date in YYYY-MM-DD format
    const tomorrow = addDays(new Date(), 1);
    const tomorrowFormatted = format(tomorrow, 'yyyy-MM-dd');
    
    console.log(`Sending reminders for bookings on ${tomorrowFormatted}`);
    
    // Get all bookings for tomorrow
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*, profiles:profiles(email)')
      .eq('booking_date', tomorrowFormatted);
    
    if (bookingsError) {
      throw new Error(`Error fetching bookings: ${bookingsError.message}`);
    }
    
    console.log(`Found ${bookings.length} bookings for tomorrow`);
    
    // Send reminder emails for each booking
    const results = await Promise.all(
      bookings.map(async (booking) => {
        // Skip if no user email
        if (!booking.profiles?.email) {
          console.log(`No email found for booking ${booking.id}`);
          return { id: booking.id, success: false, reason: 'no_email' };
        }
        
        // Send reminder email
        const success = await sendReminderEmail(booking, booking.profiles.email);
        return { id: booking.id, success };
      })
    );
    
    // Count successful and failed reminders
    const successful = results.filter(r => r.success).length;
    const failed = results.length - successful;
    
    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${results.length} reminders. ${successful} sent successfully, ${failed} failed.`,
        results
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('Error processing reminders:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
}); 