import type { VercelRequest, VercelResponse } from '@vercel/node';
import sgMail from '@sendgrid/mail';
import { createClient } from '@supabase/supabase-js';
import { format, addDays } from 'date-fns';

// Type definitions
interface Booking {
  id: string;
  first_name: string;
  last_name: string;
  service_type: string;
  booking_date: string;
  booking_time: string;
  user_id?: string;
  service_id?: number | null;
  profiles?: {
    email: string;
  };
}

interface ServiceDetails {
  duration: number;
  price: number;
}

interface ReminderResult {
  id: string;
  success: boolean;
  reason?: string;
}

// Initialize SendGrid
const SENDGRID_API_KEY: string = process.env.SENDGRID_API_KEY || '';
const SENDGRID_FROM_EMAIL: string = process.env.SENDGRID_FROM_EMAIL || 'masajbymelinda@gmail.com';
const SENDGRID_FROM_NAME: string = process.env.SENDGRID_FROM_NAME || 'Masaj by Melinda';

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

// Create Supabase client
const supabaseUrl: string = process.env.SUPABASE_URL || '';
const supabaseServiceKey: string = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Email template for booking reminders
const generateReminderEmailHtml = (booking: Booking, serviceDetails: ServiceDetails): string => {
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
};

const generateReminderEmailText = (booking: Booking, serviceDetails: ServiceDetails): string => {
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
};

// Send reminder email
const sendReminderEmail = async (booking: Booking, userEmail: string, serviceDetails: ServiceDetails): Promise<boolean> => {
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
      text: generateReminderEmailText(booking, serviceDetails),
      html: generateReminderEmailHtml(booking, serviceDetails)
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
  } catch (error: any) {
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

// Get service details from services table
const getServiceDetails = async (serviceId: number | null, serviceName: string): Promise<ServiceDetails> => {
  try {
    let service: ServiceDetails | null = null;

    // Try to get service by ID first
    if (serviceId) {
      const { data, error } = await supabase
        .from('services')
        .select('duration, price')
        .eq('id', serviceId)
        .single();

      if (!error && data) {
        service = data as ServiceDetails;
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
        service = data as ServiceDetails;
      }
    }

    // Return service details or defaults
    return {
      duration: service?.duration || 60,
      price: service?.price || 140.00
    };
  } catch (error: any) {
    console.error('Error fetching service details:', error);
    return {
      duration: 60,
      price: 140.00
    };
  }
};

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    // Get tomorrow's date in YYYY-MM-DD format
    const tomorrow = addDays(new Date(), 1);
    const tomorrowFormatted = format(tomorrow, 'yyyy-MM-dd');
    
    console.log(`Sending reminders for bookings on ${tomorrowFormatted}`);
    
    // Get all bookings for tomorrow with user profiles and service details
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        *,
        profiles:profiles(email),
        services:services(duration, price)
      `)
      .eq('booking_date', tomorrowFormatted);
    
    if (bookingsError) {
      throw new Error(`Error fetching bookings: ${bookingsError.message}`);
    }
    
    console.log(`Found ${bookings?.length || 0} bookings for tomorrow`);
    
    // Send reminder emails for each booking
    const results: ReminderResult[] = await Promise.all(
      (bookings || []).map(async (booking: Booking) => {
        // Skip if no user email
        if (!booking.profiles?.email) {
          console.log(`No email found for booking ${booking.id}`);
          return { id: booking.id, success: false, reason: 'no_email' };
        }
        
        // Get service details
        const serviceDetails = await getServiceDetails(
          booking.service_id || null, 
          booking.service_type
        );
        
        // Send reminder email
        const success = await sendReminderEmail(booking, booking.profiles.email, serviceDetails);
        return { id: booking.id, success };
      })
    );
    
    // Count successful and failed reminders
    const successful = results.filter(r => r.success).length;
    const failed = results.length - successful;
    
    res.status(200).json({
      success: true,
      message: `Processed ${results.length} reminders. ${successful} sent successfully, ${failed} failed.`,
      results
    });
  } catch (error: any) {
    console.error('Error processing reminders:', error);
    
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
} 