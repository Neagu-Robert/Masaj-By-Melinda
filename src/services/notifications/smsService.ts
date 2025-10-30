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
    return `Masaj by Melinda: Rezervare nouă creată de clientul ${data.userName}. Serviciu: ${data.serviceName}, Dată: ${data.dateTime}, Durată: ${data.duration} min.`;
  },

  // User updates booking from profile - Admin receives SMS with updated info
  booking_updated_profile: (data: BookingNotificationData): string => {
    return `Masaj by Melinda: Rezervare actualizată de ${data.userName}. Detalii noi: ${data.serviceName} pe ${data.dateTime}, Durată: ${data.duration} min.`;
  },

  // User cancels booking from profile - Admin receives SMS with cancellation info
  booking_cancelled_profile: (data: BookingNotificationData): string => {
    return `Masaj by Melinda: Rezervare anulată de ${data.userName}. Rezervare anulată: ${data.serviceName} pe ${data.dateTime}.`;
  },

  // Admin creates booking - Admin receives SMS with booking info
  booking_created_admin: (data: BookingNotificationData): string => {
    return `Masaj by Melinda: Rezervare nouă creată de admin. Client: ${data.userName}, Serviciu: ${data.serviceName}, Dată: ${data.dateTime}, Durată: ${data.duration} min.`;
  },

  // Admin updates booking - Admin receives SMS with updated info
  booking_updated_admin: (data: BookingNotificationData): string => {
    return `Masaj by Melinda: Rezervare actualizată de admin. Client: ${data.userName}, Serviciu: ${data.serviceName}, Dată: ${data.dateTime}, Durată: ${data.duration} min.`;
  }
  ,
  // Recurring enabled by user
  recurring_created_profile: (data: BookingNotificationData): string => {
    const meta = data.notes ? ` (${data.notes})` : '';
    return `Masaj by Melinda: O rezervare recurentă a fost activată de ${data.userName} pentru ${data.serviceName} începând cu ${data.dateTime}${meta}.`;
  },
  // Recurring cancelled by user
  recurring_cancelled_profile: (data: BookingNotificationData): string => {
    return `Masaj by Melinda: O rezervare recurentă a fost anulată de ${data.userName} pentru ${data.serviceName} (original ${data.dateTime}).`;
  }
  ,
  // Single-instance cancelled by user (notify admins)
  recurring_instance_cancelled_profile: (data: BookingNotificationData): string => {
    return `Masaj by Melinda: O singură instanță recurentă a fost anulată de ${data.userName} pentru ${data.serviceName} pe ${data.dateTime}.`;
  },
  // Single-instance cancelled by admin (template included for completeness)
  recurring_instance_cancelled_admin: (data: BookingNotificationData): string => {
    return `Masaj by Melinda: O singură instanță recurentă a fost anulată de admin pentru ${data.userName} - ${data.serviceName} pe ${data.dateTime}.`;
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
    console.error('Notificările SMS nu sunt configurate sau activate');
    return {
      success: false,
      channel: 'sms',
      error: new Error('Notificările SMS nu sunt configurate sau activate'),
      timestamp: Date.now()
    };
  }

  if (!payload.recipient.phone) {
    console.error('Numărul de telefon al destinatarului este obligatoriu');
    return {
      success: false,
      channel: 'sms',
      error: new Error('Numărul de telefon al destinatarului este obligatoriu'),
      timestamp: Date.now()
    };
  }

  try {
    // Get the appropriate template
    const templateFn = smsTemplates[payload.type];
    if (!templateFn) {
      throw new Error(`Șablonul SMS nu a fost găsit pentru tipul de notificare: ${payload.type}`);
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
      console.error('Eroare API SMS:', response.status, response.statusText, errorText);
      
      if (response.status === 0 || response.status === 403) {
        throw new Error('Eroare CORS sau de rețea - serviciul SMS este temporar indisponibil');
      }
      
      throw new Error(`Eroare API SMS: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Eroare la trimiterea SMS-ului');
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
    console.error('Eroare la trimiterea notificării SMS:', error);

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
    console.error(`S-au atins numărul maxim de reîncercări (${MAX_RETRY_ATTEMPTS}) pentru notificarea SMS`);
    return {
      success: false,
      channel: 'sms',
      error: new Error(`S-au atins numărul maxim de reîncercări (${MAX_RETRY_ATTEMPTS})`),
      timestamp: Date.now()
    };
  }

  // Wait before retrying (exponential backoff)
  const delay = RETRY_DELAY_MS * Math.pow(2, retryCount);
  await new Promise(resolve => setTimeout(resolve, delay));

  console.log(`Se reîncearcă notificarea SMS (încercarea ${retryCount + 1}/${MAX_RETRY_ATTEMPTS})`);
  
  try {
    const result = await sendSmsNotification(payload);
    
    // If SMS was accepted but we want to be extra sure, we could add additional verification
    if (result.success && result.details) {
      console.log('Reîncercarea SMS a avut succes, cu detalii:', result.details);
    }
    
    return result;
  } catch (error) {
    console.error(`Reîncercarea SMS ${retryCount + 1} a eșuat:`, error);
    return retrySmsNotification(payload, retryCount + 1);
  }
}; 