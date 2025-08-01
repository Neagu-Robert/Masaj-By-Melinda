import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import sgMail from 'https://esm.sh/@sendgrid/mail@8.1.1';
import { format, addDays } from 'https://esm.sh/date-fns@3.6.0';

const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY') || '';
const SENDGRID_FROM_EMAIL = Deno.env.get('SENDGRID_FROM_EMAIL') || 'masajbymelinda@gmail.com';
const SENDGRID_FROM_NAME = Deno.env.get('SENDGRID_FROM_NAME') || 'Masaj by Melinda';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function generateReminderEmailHtml(booking, serviceDetails) {
  const { first_name, last_name, service_type, booking_date, booking_time } = booking;
  const fullName = `${first_name} ${last_name}`.trim();
  const duration = serviceDetails.duration;
  const price = serviceDetails.price;
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #8b5cf6;">Appointment Reminder</h2>
      <p>Dear ${fullName},</p>
      <p>This is a friendly reminder about your upcoming appointment tomorrow.</p>
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Appointment Details:</h3>
        <p><strong>Service:</strong> ${service_type}</p>
        <p><strong>Date & Time:</strong> ${booking_date} at ${booking_time}</p>
        <p><strong>Duration:</strong> ${duration} minutes</p>
        <p><strong>Price:</strong> ${price} RON</p>
      </div>
      <p>We look forward to seeing you!</p>
      <p>Best regards,<br>Masaj by Melinda</p>
    </div>
  `;
}

function generateReminderEmailText(booking, serviceDetails) {
  const { first_name, last_name, service_type, booking_date, booking_time } = booking;
  const fullName = `${first_name} ${last_name}`.trim();
  const duration = serviceDetails.duration;
  const price = serviceDetails.price;
  return `
    Appointment Reminder
    
    Dear ${fullName},
    
    This is a friendly reminder about your upcoming appointment tomorrow.
    
    Appointment Details:
    - Service: ${service_type}
    - Date & Time: ${booking_date} at ${booking_time}
    - Duration: ${duration} minutes
    - Price: ${price} RON
    
    We look forward to seeing you!
    
    Best regards,
    Masaj by Melinda
  `;
}

async function getServiceDetails(serviceId, serviceName) {
  try {
    let service = null;
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
    return {
      duration: service?.duration || 60,
      price: service?.price || 140.00
    };
  } catch (error) {
    return {
      duration: 60,
      price: 140.00
    };
  }
}

serve(async (req) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
  }

  try {
    // Get tomorrow's date in YYYY-MM-DD format
    const tomorrow = addDays(new Date(), 1);
    const tomorrowFormatted = format(tomorrow, 'yyyy-MM-dd');

    // Get all bookings for tomorrow with user profiles and service details
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`*, profiles:profiles(email), services:services(duration, price)`)
      .eq('booking_date', tomorrowFormatted);

    if (bookingsError) {
      throw new Error(`Error fetching bookings: ${bookingsError.message}`);
    }

    // Send reminder emails for each booking
    const results = await Promise.all(
      (bookings || []).map(async (booking) => {
        if (!booking.profiles?.email) {
          return { id: booking.id, success: false, reason: 'no_email' };
        }
        const serviceDetails = await getServiceDetails(
          booking.service_id || null,
          booking.service_type
        );
        try {
          const msg = {
            to: booking.profiles.email,
            from: {
              email: SENDGRID_FROM_EMAIL,
              name: SENDGRID_FROM_NAME
            },
            subject: 'Reminder: Your Upcoming Appointment - Masaj by Melinda',
            text: generateReminderEmailText(booking, serviceDetails),
            html: generateReminderEmailHtml(booking, serviceDetails)
          };
          await sgMail.send(msg);
          // Optionally, log to notification_logs table here
          return { id: booking.id, success: true };
        } catch (error) {
          // Optionally, log to notification_logs table here
          return { id: booking.id, success: false, reason: error.message };
        }
      })
    );

    const successful = results.filter(r => r.success).length;
    const failed = results.length - successful;

    return new Response(JSON.stringify({
      success: true,
      message: `Processed ${results.length} reminders. ${successful} sent successfully, ${failed} failed.`,
      results
    }), { status: 200, headers });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      message: error.message
    }), { status: 500, headers });
  }
});