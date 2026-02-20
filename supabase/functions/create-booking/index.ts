import { createAdminClient } from '../_shared/supabase-client.ts';
import { compose, corsMiddleware, authMiddleware, rateLimitMiddleware, validationMiddleware, loggingMiddleware, errorHandlerMiddleware, createJsonResponse, createErrorResponse } from '../_shared/middleware.ts';
import { CreateBookingSchema } from '../_shared/validation.ts';
import { log, logError, logBookingEvent } from '../_shared/logger.ts';
import { captureException } from '../_shared/sentry.ts';

// Handler function with security layers
const handler = async (req: Request, context: any) => {
  const { full_name, phone_number, service_type, service_id, requested_date_text, requested_time_text } = context.validatedData;
  const userId = context.user.id;
  const supabase = createAdminClient();

  try {
    // Split full_name into first_name and last_name
    const nameParts = full_name.trim().split(/\s+/);
    const first_name = nameParts[0];
    const last_name = nameParts.slice(1).join(' ') || '';

    // Create booking data
    const bookingData = {
      user_id: userId,
      first_name,
      last_name,
      phone_number,
      service_type,
      service_id,
      requested_date_text,
      requested_time_text,
      status: 'unconfirmed',
    };

    // Insert booking using service role
    const { data: booking, error: insertError } = await supabase
      .from('bookings')
      .insert([bookingData])
      .select()
      .single();

    if (insertError || !booking) {
      logError(new Error('Booking insert failed'), 'create-booking', { error: insertError, userId }, req);
      captureException(new Error('Booking insert failed'), {
        tags: { layer: 'backend', function: 'create-booking', feature: 'booking', severity: 'critical' },
        extra: { userId, insertError }
      });
      return createErrorResponse('Something went wrong, try again', 500, 'BOOKING_INSERT_FAILED', context.rateLimitInfo);
    }

    const bookingId = booking.id;

    // Log successful booking creation
    logBookingEvent('created', bookingId, userId, req, { service_type, requested_date_text });

    // Attempt to trigger notification (silent failure)
    try {
      // Get user email for notification
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', userId)
        .single();

      if (profile?.email) {
        // Prepare email payload for booking_created_customer notification
        const SENDER_NAME = (Deno as any).env.get('BREVO_FROM_NAME') || 'Masaj by Melinda';
        const emailSubject = `Rezervare primită - ${service_type}`;
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #8b5cf6;">Rezervare primită!</h2>
            <p>Bună ${first_name},</p>
            <p>Cererea dumneavoastră de rezervare a fost trimisă cu succes!</p>
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Detalii rezervare:</h3>
              <p><strong>Serviciu:</strong> ${service_type}</p>
              <p><strong>Data:</strong> ${requested_date_text}</p>
              ${requested_time_text ? `<p><strong>Ora:</strong> ${requested_time_text}</p>` : ''}
              <p><strong>Status:</strong> În așteptare confirmare</p>
            </div>
            <p>Veți fi contactat în curând pentru confirmare.</p>
            <p>Cu stimă,<br>${SENDER_NAME}</p>
          </div>
        `;
        const emailText = `Rezervare primită!\n\nBună ${first_name},\n\nCererea dumneavoastră de rezervare a fost trimisă cu succes!\n\nDetalii rezervare:\n- Serviciu: ${service_type}\n- Data: ${requested_date_text}\n${requested_time_text ? `- Ora: ${requested_time_text}\n` : ''}- Status: În așteptare confirmare\n\nVeți fi contactat în curând pentru confirmare.\n\nCu stimă,\n${SENDER_NAME}`;

        // Call send-email Edge Function
        const SUPABASE_URL = (Deno as any).env.get('SUPABASE_URL');
        const ANON_KEY = (Deno as any).env.get('SUPABASE_ANON_KEY');
        
        if (SUPABASE_URL && ANON_KEY) {
          const emailResponse = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${ANON_KEY}`,
            },
            body: JSON.stringify({
              to: profile.email,
              subject: emailSubject,
              htmlContent: emailHtml,
              textContent: emailText,
            }),
          });

          if (!emailResponse.ok) {
            const errorText = await emailResponse.text();
            logError(new Error('Email notification failed'), 'create-booking', { error: errorText, bookingId, email: profile.email }, req);
          } else {
            log('INFO', 'Email notification sent successfully', { bookingId, email: profile.email });
          }
        }
      }
    } catch (notificationError) {
      logError(notificationError instanceof Error ? notificationError : new Error('Notification failed'), 'create-booking', { bookingId }, req);
      // Don't block the response
    }

    // Send SMS notifications to admin phones directly via Twilio (non-blocking)
    try {
      const adminPhonesRaw = (Deno as any).env.get('ADMIN_PHONE_NUMBERS');
      const adminPhones = adminPhonesRaw
        ? adminPhonesRaw.split(',').map((phone: string) => phone.trim()).filter((phone: string) => phone.length > 0)
        : [];

      if (adminPhones.length === 0) {
        log('WARN', 'No admin phone numbers configured (ADMIN_PHONE_NUMBERS secret missing), skipping SMS', { bookingId });
      } else {
        const TWILIO_SID = (Deno as any).env.get('TWILIO_SID');
        const TWILIO_AUTH_TOKEN = (Deno as any).env.get('TWILIO_AUTH_TOKEN');
        const TWILIO_PHONE_NUMBER = (Deno as any).env.get('TWILIO_PHONE_NUMBER');

        if (!TWILIO_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
          log('WARN', 'Twilio credentials not configured, skipping SMS notifications', { bookingId });
        } else {
          const bookingIdShort = bookingId.slice(0, 8);
          const timepart = requested_time_text ? `, ${requested_time_text}` : '';
          let smsMessage = `Rezervare noua: ${service_type} - ${requested_date_text}${timepart}. Client: ${first_name} ${last_name} ${phone_number}. ID: ${bookingIdShort}`;

          if (smsMessage.length > 160) {
            smsMessage = smsMessage.slice(0, 157) + '...';
          }

          const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`;
          const authHeader = 'Basic ' + btoa(`${TWILIO_SID}:${TWILIO_AUTH_TOKEN}`);

          const smsPromises = adminPhones.map(async (adminPhone: string) => {
            const body = new URLSearchParams();
            body.append('To', adminPhone);
            body.append('From', TWILIO_PHONE_NUMBER);
            body.append('Body', smsMessage);

            const response = await fetch(twilioUrl, {
              method: 'POST',
              headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: body.toString(),
            });

            const result = await response.json();

            if (!response.ok) {
              logError(new Error('Admin SMS Twilio API error'), 'create-booking', {
                twilioStatus: response.status,
                twilioError: result.message || result.code,
                bookingId,
                adminPhone,
              }, req);
            } else {
              log('INFO', 'Admin SMS sent successfully', { bookingId, adminPhone, messageSid: result.sid });
            }
          });

          const smsResults = await Promise.allSettled(smsPromises);
          for (const result of smsResults) {
            if (result.status === 'rejected') {
              logError(
                result.reason instanceof Error ? result.reason : new Error('Admin SMS network error'),
                'create-booking',
                { bookingId },
                req,
              );
            }
          }
        }
      }
    } catch (smsError) {
      logError(smsError instanceof Error ? smsError : new Error('SMS notification failed'), 'create-booking', { bookingId }, req);
    }

    // Format success message with time text
    const timeDisplay = requested_time_text ? `, ${requested_time_text}` : '';
    const successMessage = `Rezervare primită! Cererea dumneavoastră pentru ${service_type} (${requested_date_text}${timeDisplay}) a fost trimisă cu succes. Veți fi contactat pentru confirmare.`;

    return createJsonResponse({
      success: true,
      booking_id: bookingId,
      message: successMessage,
    }, 200, context.rateLimitInfo);

  } catch (error) {
    logError(error instanceof Error ? error : new Error('Create booking error'), 'create-booking', { userId }, req);
    if (error instanceof Error) {
      captureException(error, {
        tags: { layer: 'backend', function: 'create-booking', feature: 'booking', severity: 'critical' },
        user: { id: userId }
      });
    }
    return createErrorResponse('Something went wrong, try again', 500, 'INTERNAL_ERROR', context.rateLimitInfo);
  }
};

// Apply security middleware
const securedHandler = compose(
  corsMiddleware,
  loggingMiddleware,
  errorHandlerMiddleware,
  authMiddleware, // CRITICAL: Require authentication
  // Primary rate limit: userId-based
  rateLimitMiddleware({
    identifier: (req, context) => context.user?.id || 'unknown',
    endpoint: 'create-booking',
    limit: 10,
    window: 3600, // 10 bookings per hour per user
    strategy: 'sliding',
  }),
  // Secondary rate limit: IP-based
  rateLimitMiddleware({
    identifier: (req, context) => context.ip || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown',
    endpoint: 'create-booking-ip',
    limit: 10,
    window: 3600, // 10 bookings per hour per IP
    strategy: 'sliding',
  }),
  validationMiddleware(CreateBookingSchema)
)(handler);

// Export the secured handler
(Deno as any).serve(securedHandler);
