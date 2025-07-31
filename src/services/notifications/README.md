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
   Create a `sendgrid.env` file in the `src` directory with the following content:
   ```
   SENDGRID_API_KEY='your_sendgrid_api_key'
   ```

2. **Using environment variables:**
   Add the following environment variables to your `.env` file:

   ```
   # SendGrid (Email Notifications)
   VITE_SENDGRID_API_KEY=your_sendgrid_api_key
   VITE_SENDGRID_FROM_EMAIL=masajbymelinda@gmail.com
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

The email functionality is implemented via Vercel API routes that use the SendGrid API. This approach keeps your SendGrid credentials secure on the backend while allowing email notifications from the frontend.

The Vercel API route is located at `api/send-email.ts` and handles:
- Email message sending via SendGrid API
- HTML and plain text email templates
- Error handling and response formatting
- CORS handling for cross-origin requests

### SMS Implementation

The SMS functionality is implemented via Vercel API routes that use the Infobip API. This approach keeps your Infobip credentials secure on the backend while allowing SMS notifications from the frontend.

The Vercel API route is located at `api/send-sms.ts` and handles:
- SMS message sending via Infobip API
- Error handling and response formatting
- CORS handling for cross-origin requests

### Running the Vercel API Routes

The Vercel API routes are automatically deployed when you deploy your application to Vercel. The routes are available at:

- Email: `https://masajbymelinda.ro/api/send-email`
- SMS: `https://masajbymelinda.ro/api/send-sms`

For local development, you can still use the Express server by running:

```bash
# Run the Express server only
npm run server

# Run both the Vite dev server and Express server concurrently
npm run dev:full
```

The Express server will be available at `http://localhost:3003` and provides the `/api/send-email` endpoint for local development.

### Database Setup

In `supabase/migrations/20250724_notification_tables.sql` there's a sql code that has been used to generate the following database tables in Supabase:

- `notification_logs` - Records of all notification attempts
- `notification_preferences` - User preferences for notifications. In the profile page, the users will be able to edit notification preferencies to change what type of notification they can recieve.


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

to be implemented 

## Architecture

- `config.ts` - Configuration settings and environment variables
- `types.ts` - TypeScript interfaces and types
- `emailService.ts` - Vercel API route integration for email notifications
- `smsService.ts` - Vercel API route integration for SMS notifications
- `loggingService.ts` - Notification logging functionality
- `notificationService.ts` - Core notification service with queue
- `hooks.ts` - React hooks for using notifications in components
- `index.ts` - Main exports
- `api/send-email.ts` - Vercel API route for email notifications
- `api/send-sms.ts` - Vercel API route for SMS notifications 

## Notification implementations
- `booking_created_customer` - When booked from the customer's booking page, will send and email to the logged in customers and an sms to the admin numbers responsible with booking handleing (booking responsible admins to be implemented)
- `booking_updated_profile` - When a user updates a booking, from his profile page, an email is sent to the user and a sms to the admins responsible (just like previously)
- `booking_cancelled_profile` - When a user cancells a booking, from his profile page, an email is sent to the user and a sms to the admins responsible (just like previously)
- `booking_created_admin` - when a admin creates a booking using the admin form, only an sms is sent to the responsible admins
- `booking_updated_admin` - if an admin updates a booking using the admin page, an email is sent to the customer of which the booking belonged to and an sms to the responsible admins.
- `booking_cancelled_admin` - if an admin cancells a booking using the admin page, an email is sent to the customer of which the booking belonged. No sms is sent to any admins.
- `booking_reminder` - a reminder email should be sent to the customers one day prior the their booking at 12:00 AM (Bucharest time).  