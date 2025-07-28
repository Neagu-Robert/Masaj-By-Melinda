# Notification System

This module provides a comprehensive notification system for Masaj by Melinda, supporting both email (via SendGrid) and SMS (via Infobip).

## Features

- Multi-channel notifications (email and SMS)
- Template-based message generation
- Notification preferences management
- Notification delivery logging
- Retry mechanism for failed notifications
- Asynchronous queue for non-blocking notification sending

## Setup

### API Keys

There are two ways to provide the SendGrid API key:

1. **Using a sendgrid.env file:**
   Create a `sendgrid.env` file in the root directory with the following content:
   ```
   SENDGRID_API_KEY='your_sendgrid_api_key'
   ```

2. **Using environment variables:**
   Add the following environment variables to your `.env` file:

   ```
   # SendGrid (Email Notifications)
   VITE_SENDGRID_API_KEY=your_sendgrid_api_key
   VITE_SENDGRID_FROM_EMAIL=noreply@masajbymelinda.com
   VITE_SENDGRID_FROM_NAME=Masaj by Melinda

   # Infobip (SMS Notifications)
   VITE_INFOBIP_API_KEY=your_infobip_api_key
   VITE_INFOBIP_SENDER_NUMBER=your_infobip_sender_number

   # Notification Settings
   VITE_EMAIL_NOTIFICATIONS_ENABLED=true
   VITE_SMS_NOTIFICATIONS_ENABLED=true
   VITE_NOTIFICATION_QUEUE_ENABLED=true
   VITE_MAX_RETRY_ATTEMPTS=3
   VITE_RETRY_DELAY_MS=5000
   ```

> **Note**: The system will first check for a SendGrid API key in the `sendgrid.env` file, and if not found, it will fall back to the `VITE_SENDGRID_API_KEY` environment variable. Similarly, it will check for Infobip credentials in the `infobip.env` file.

### Email Implementation

The email functionality is implemented via a Vercel API route that uses the SendGrid API. This approach keeps your SendGrid credentials secure on the backend while allowing email notifications from the frontend.

The API route is located at `api/send-email.ts` and handles:
- Email message sending via SendGrid API
- HTML and plain text email templates
- Error handling and response formatting
- CORS handling for cross-origin requests

### SMS Implementation

The SMS functionality is implemented via a Supabase Edge Function that uses the Infobip API. This approach keeps your Infobip credentials secure on the backend while allowing SMS notifications from the frontend.

The Edge Function is located at `supabase/functions/send-sms/` and handles:
- SMS message sending via Infobip API
- Error handling and response formatting
- CORS handling for cross-origin requests

### Deploying the API Route

The Vercel API route will be automatically deployed when you deploy your Vercel project. Make sure to:

1. Add the `sendgrid.env` file to your project root
2. Deploy to Vercel
3. The API route will be available at `/api/send-email`

### Deploying SMS Edge Function

To deploy the SMS Edge Function:

```bash
supabase functions deploy send-sms
```

### Database Setup

Run the SQL migration in `supabase/migrations/20250724_notification_tables.sql` to create the necessary tables:

- `notification_logs` - Records of all notification attempts
- `notification_preferences` - User preferences for notifications

## Usage

### Basic Usage

```tsx
import { notify } from '@/services/notifications';

// Send a notification
await notify({
  type: 'booking_created',
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

- `booking_created` - Sent when a new booking is created
- `booking_updated` - Sent when a booking is updated
- `booking_cancelled` - Sent when a booking is cancelled
- `reminder` - Sent as a reminder for upcoming bookings

## Automated Reminders

Booking reminders are sent automatically via a Supabase Edge Function scheduled to run daily at 6 PM (Europe/Bucharest timezone). The function sends reminders for bookings scheduled for the next day.

To deploy the function:

```bash
supabase functions deploy send-booking-reminders
```

## Architecture

- `config.ts` - Configuration settings and environment variables
- `types.ts` - TypeScript interfaces and types
- `emailService.ts` - Vercel API route integration for email notifications
- `smsService.ts` - Infobip integration for SMS notifications
- `loggingService.ts` - Notification logging functionality
- `notificationService.ts` - Core notification service with queue
- `hooks.ts` - React hooks for using notifications in components
- `index.ts` - Main exports 