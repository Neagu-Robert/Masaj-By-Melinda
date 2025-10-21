//comment for commit, ignore

# Notification System

This module provides a comprehensive notification system for Masaj by Melinda, supporting both email (via Brevo) and SMS (via Twilio).

## Features

- Multi-channel notifications (email and SMS)
- Template-based message generation
- Notification preferences management
- Notification delivery logging
- Retry mechanism for failed notifications
- Asynchronous queue for non-blocking notification sending

## Setup

### API Keys

The notification system uses Supabase Edge Functions for secure API key handling. The following environment variables need to be set in your Supabase project secrets:

```
# Brevo (Email Notifications)
BREVO_API_KEY=your_brevo_api_key
BREVO_FROM_EMAIL=masajbymelinda@gmail.com
BREVO_FROM_NAME=Masaj by Melinda

# Twilio (SMS Notifications)
TWILIO_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
```

### Frontend Environment Variables

For local development, create a `.env.local` file in the root of your project and add the following variables. These are required for the client-side application to function correctly.

```
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Twilio (for client-side checks)
VITE_TWILIO_SID=your_twilio_sid
VITE_TWILIO_AUTH_TOKEN=your_twilio_auth_token
VITE_TWILIO_PHONE_NUMBER=your_twilio_phone_number

# Brevo (for client-side checks)
VITE_BREVO_API_KEY=your_brevo_api_key
```

### Email Implementation

The email functionality is implemented via Supabase Edge Functions that use the Brevo API. This approach keeps your Brevo credentials secure on the backend while allowing email notifications from the frontend.

The Supabase Edge Function is located at `supabase/functions/send-email/index.ts` and handles:
- Email message sending via Brevo API
- HTML and plain text email templates
- Error handling and response formatting
- CORS handling for cross-origin requests

### SMS Implementation

The SMS functionality is implemented via Supabase Edge Functions that use the Twilio API. This approach keeps your Twilio credentials secure on the backend while allowing SMS notifications from the frontend.

The Supabase Edge Function is located at `supabase/functions/send-sms/index.ts` and handles:
- SMS message sending via Twilio API
- Error handling and response formatting
- CORS handling for cross-origin requests

### Running the Supabase Edge Functions

The Supabase Edge Functions are automatically deployed when you deploy your Supabase project. The functions are available at:

- Email: `https://dgzmqlwqlfmdbnwqjjjr.functions.supabase.co/send-email`
- SMS: `https://dgzmqlwqlfmdbnwqjjjr.functions.supabase.co/send-sms`
- Reminders: `https://dgzmqlwqlfmdbnwqjjjr.functions.supabase.co/send-reminders`

For local development, you can run the Supabase CLI to test the functions locally:

```bash
# Start Supabase locally
supabase start

# Test the functions
supabase functions serve
```

### Database Setup

In `supabase/migrations/20250724_notification_tables.sql` there's a sql code that has been used to generate the following database tables in Supabase:

- `notification_logs` - Records of all notification attempts
- `notification_preferences` - User preferences for notifications. In the profile page, the users will be able to edit notification preferencies to change what type of notification they can recieve.

### Basic Usage

```tsx
import { notify } from '@/services/notifications';

// Send a notification
await notify({
  type: 'booking_created_customer',
  recipient: {
    userId: 'user-uuid',
    email: 'user@example.com',
    phone: '+40123456789',
    name: 'John Doe'
  },
  data: {
    bookingId: 'booking-uuid',
    userId: 'user-uuid',
    userName: 'John Doe',
    userEmail: 'user@example.com',
    userPhone: '+40123456789',
    serviceName: 'Masaj de relaxare',
    dateTime: '2025-07-25 14:00',
    duration: 60,
    price: 150,
    status: 'confirmed'
  }
});
```

### Using the Hook

```tsx
import { useBookingNotifications } from '@/services/notifications/hooks';

function BookingComponent() {
  const { sendBookingConfirmation } = useBookingNotifications();
  
  const handleBookingCreated = async (booking) => {
    await sendBookingConfirmation({
      bookingId: booking.id,
      userId: booking.userId,
      userName: `${booking.firstName} ${booking.lastName}`,
      userEmail: booking.email,
      userPhone: booking.phoneNumber,
      serviceName: booking.serviceType,
      bookingDate: booking.bookingDate,
      bookingTime: booking.bookingTime,
      duration: 60,
      price: 150,
      status: 'confirmed'
    });
  };
  
  return (
    // Component JSX
  );
}
```

## Notification Types

- `booking_created_customer` - Sent when a customer creates a new booking
- `booking_updated_profile` - Sent when a user updates their booking from profile
- `booking_cancelled_profile` - Sent when a user cancels their booking from profile
- `booking_created_admin` - Sent when an admin creates a booking
- `booking_updated_admin` - Sent when an admin updates a booking
- `booking_cancelled_admin` - Sent when an admin cancels a booking
- `reminder` - Sent as a reminder for upcoming bookings

## Automated Reminders

The reminder system is implemented via a Supabase Edge Function (`supabase/functions/send-reminders/index.ts`) that runs on a cron schedule to send reminder emails to customers one day before their appointments.

## Architecture

- `config.ts` - Configuration settings and environment variables
- `types.ts` - TypeScript interfaces and types
- `emailService.ts` - Supabase Edge Function integration for email notifications
- `smsService.ts` - Supabase Edge Function integration for SMS notifications
- `loggingService.ts` - Notification logging functionality
- `notificationService.ts` - Core notification service with queue
- `hooks.ts` - React hooks for using notifications in components
- `index.ts` - Main exports
- `supabase/functions/send-email/index.ts` - Supabase Edge Function for email notifications
- `supabase/functions/send-sms/index.ts` - Supabase Edge Function for SMS notifications
- `supabase/functions/send-reminders/index.ts` - Supabase Edge Function for reminder notifications

## Notification implementations
- `booking_created_customer` - When booked from the customer's booking page, will send and email to the logged in customers and an sms to the admin numbers responsible with booking handleing (booking responsible admins to be implemented)
- `booking_updated_profile` - When a user updates a booking, from his profile page, an email is sent to the user and a sms to the admins responsible (just like previously)
- `booking_cancelled_profile` - When a user cancells a booking, from his profile page, an email is sent to the user and a sms to the admins responsible (just like previously)
- `booking_created_admin` - when a admin creates a booking using the admin form, only an sms is sent to the responsible admins
- `booking_updated_admin` - if an admin updates a booking using the admin page, an email is sent to the customer of which the booking belonged to and an sms to the responsible admins.
- `booking_cancelled_admin` - if an admin cancells a booking using the admin page, an email is sent to the customer of which the booking belonged. No sms is sent to any admins.
- `booking_reminder` - a reminder email should be sent to the customers one day prior the their booking at 12:00 AM (Bucharest time).  