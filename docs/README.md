
# Masaj by Melinda

Welcome to the official repository for **Masaj by Melinda**, a professional wellness and massage services booking website serving clients in Romania.

## Table of Contents

- [Project Overview](#project-overview)
- [Main Functionalities](#main-functionalities)
- [Supabase Integration](#supabase-integration)
- [Technologies & Tools](#technologies--tools)
- [Folder Structure](#folder-structure)
- [Documentation](#documentation)
- [Environment Variables](#environment-variables)
- [How to Run Locally](#how-to-run-locally)
- [Further Resources](#further-resources)

---

## Project Overview

**Masaj by Melinda** is a modern web application designed to present and schedule professional massage and device therapy services. Users can explore available treatments, check details, and book appointments directly through a streamlined UI on desktop or mobile. The platform includes robust user authentication, profile management, and a comprehensive admin dashboard for managing the business.

---

## Main Functionalities

### 1. Service Presentation
- **Overview:** Visitors can explore a catalog of massage services and device-based treatments with detailed descriptions, durations, and pricing.
- **Purpose:** To inform customers about offerings and benefits, helping them choose the service that best fits their needs.
- **Implementation:**  
  - Sections: "Masaje" and "Tratamente cu dispozitive"
  - Each service/treatment includes name, benefits, duration, price, and images for device therapies.

### 2. Advanced Booking System
- **Overview:** Flexible booking system supporting both structured and free-text booking requests, with an admin confirmation workflow.
- **Purpose:** Streamlines appointment scheduling with real-time availability checks and flexible request handling.
- **Implementation:**  
  - Multi-step form (contact info, service selection, date & time, booking summary)
  - **Free-text booking requests:** Customers can provide date/time in natural language (e.g., "luni dimineața")
  - **Admin confirmation flow:** Unconfirmed bookings appear on the `Confirmari` admin page where admin can confirm, reject, or suggest alternative times
  - **Booking status lifecycle:** `unconfirmed → confirmed / rejected / suggested`
  - **Booking-response email tokens:** Customers receive unique links to accept/decline admin suggestions
  - Real-time availability checks
  - **Recurring Bookings:** Users and admins can set up weekly or biweekly appointments via `create-recurring-bookings` edge function
  - **Recurring Availabilities:** Admins can create repeating blocked time slots

### 3. User Authentication & Profile Management
- **Overview:** Users can create an account, log in, reset their password, and manage their profile. Guest access is also supported.
- **Purpose:** Provides a personalized experience, allowing users to view booking history and manage their information.
- **Implementation:**
  - Secure user registration and login via `auth-proxy` edge function with rate limiting
  - OTP-based phone number verification (Twilio Verify integration)
  - Profile dashboard to edit personal details, change password, and manage notification preferences
  - Calendar view of past and upcoming bookings

### 4. Advanced Admin Dashboard
- **Overview:** A secure, role-protected area for business management.
- **Purpose:** To give the site administrator full control over bookings, user management, and business insights.
- **Implementation:**
  - **Confirmari:** Review and respond to unconfirmed booking requests (new dedicated page)
  - **Bookings & Availabilities:** Full CRUD control over appointments and work hours
  - **User Management:** View, ban, unban, and delete customer accounts
  - **Analytics:** Visual charts displaying booking trends, popular services, and peak hours (using recharts)
  - **Audit Logs:** Tracks all significant admin actions for accountability

### 5. Notification System
- **Overview:** Automated email and SMS notifications for important events.
- **Purpose:** Keeps users and admins informed about booking statuses and account changes.
- **Implementation:**
  - **Email notifications (Brevo):** 18 email templates covering booking confirmations, updates, cancellations, reminders, password changes, admin actions
  - **SMS notifications (Twilio):** Admin SMS alerts for new bookings; 11 SMS templates
  - **Notification preferences:** Users can customize which notifications they receive
  - **Reminder cron:** Daily email reminders for next-day appointments

### 6. Error Tracking & Monitoring
- **Overview:** Comprehensive error tracking across frontend and backend.
- **Purpose:** Real-time visibility into application errors and performance issues.
- **Implementation:**
  - **Sentry integration:** Frontend (`@sentry/react` v10) and backend (HTTP Store API)
  - **PII sanitization:** Email and phone number masking in error reports
  - **Single project approach:** Both layers report to same Sentry project, distinguished by `layer` tag

### 7. Rate Limiting & Security
- **Overview:** Multi-layered rate limiting to prevent abuse and ensure fair usage.
- **Purpose:** Protect API endpoints from spam and brute-force attacks.
- **Implementation:**
  - **Upstash Redis:** Distributed rate-limit state across serverless functions
  - **Multiple algorithms:** Sliding window (most endpoints), token bucket (OTP), fixed window (admin actions)
  - **Fail-closed OTP endpoints:** Phone verification fails safely when Redis unavailable
  - **Global IP rate limiting:** 100 req/min/IP across all functions

### 8. Responsive Navigation and Layout
- **Overview:** Navbar adapts for desktop (inline links) and mobile (hamburger menu) with smooth scrolling.
- **Purpose:** Ensure easy access and smooth user journey on all devices.

---

## Supabase Integration

- **Database:** Uses Supabase (PostgreSQL) to store bookings, user profiles, availabilities, and application data.
- **Authentication:** Manages user sign-ups, logins, and row-level security to protect data.
- **Edge Functions:** Serverless functions handle backend logic for:
  - Sending OTPs for phone verification.
  - Creating and managing recurring bookings.
  - Securely deleting user data.
  - Sending notifications.
- **Security:** All client connections use Supabase's anon key, with Row Level Security policies protecting user and admin data.

---

## Technologies & Tools

| Tool | Purpose | Usage in Project |
|------|---------|-----------------|
| **React 18** | UI construction | Manages components, state, and app logic |
| **Vite 5 (SWC)** | App bundling/dev server | Fast local development and builds |
| **TypeScript 5** | Type safety | Improves robustness and maintainability |
| **Tailwind CSS 3** | Utility-first styling | Rapid layout and mobile-first design; media queries for responsiveness |
| **shadcn/ui** | Prebuilt UI components (Radix UI) | Used for cards, forms, buttons, toasts, etc. |
| **lucide-react** | Modern React SVG icons | Provides visually appealing iconography |
| **Supabase** | Database & backend as a service | PostgreSQL database, Auth, Edge Functions (Deno runtime) |
| **react-hook-form** | Form state management | Efficient validation and controlled forms for Booking |
| **react-router-dom v6** | Client-side routing | Navigates between public, authenticated, and admin pages |
| **TanStack React Query v5** | Server state management | Data fetching, caching, and synchronization |
| **@sentry/react v10** | Error tracking (Frontend) | Real-time error monitoring with PII sanitization |
| **Upstash Redis** | Rate limiting | Distributed rate-limit state for serverless functions |
| **Brevo** | Transactional email | Booking confirmations, reminders, notifications (18 templates) |
| **Twilio Verify** | Phone verification | OTP-based phone number verification |
| **Twilio Messages** | SMS notifications | Admin alerts for new bookings (11 templates) |
| **@upstash/ratelimit** | Rate limiting library | Sliding window, token bucket, fixed window algorithms |
| **sonner** | UI toast notifications | Friendly popup notifications for booking feedback |
| **date-fns** | Date manipulation | Ensures correct formatting and date-picking logic |
| **zod** | Schema validation | Request/response validation across frontend and backend |
| **recharts** | Data visualization | Admin analytics charts (booking trends, popular services) |
| **next-themes** | Theme support | Manages light/dark mode for toasts |

---

## Folder Structure

```
src/
  components/         # Reusable React components
    admin/            # Admin dashboard components (Sidebar, BookingFormModal, etc.)
    auth/             # Authentication components (OTP modal, phone verification)
    booking/          # Multi-step booking form (ServiceSelection, DateTimeSelection, ContactForm)
    profile/          # User profile components (BookingsList, EditProfileModal, PasswordChangeModal)
    ui/               # General-purpose UI components from shadcn/ui (Button, Input, Card, etc.)
  contexts/           # React Context providers for global state management
    AuthContext.tsx             # User session, role, status, Sentry user tagging
    BookingsContext.tsx         # Bookings CRUD + real-time subscription
    ServicesContext.tsx         # Active services list
    AvailabilitiesContext.tsx   # Availabilities CRUD + real-time subscription
    PhoneVerificationContext.tsx # OTP flow state, rate-limit countdown
  hooks/              # Custom React hooks
  integrations/       # Third-party service integrations
    supabase/         # Supabase client initialization
  lib/                # Utility functions and shared libraries
    booking-utils.ts           # Time slots, date validation, token generation
    audit-logger.ts            # Admin action logging
    rate-limit-manager.ts      # Frontend rate-limit state management (sessionStorage)
    supabase-functions.ts      # invokeRateLimited wrapper with Sentry integration
    utils.ts                   # cn() and other helpers
  pages/              # Top-level page components for routing
    Index.tsx                  # Landing page (Navbar, Hero, Services, Footer)
    AuthPage.tsx               # Login/register with rate limiting
    BookingPage.tsx            # Multi-step booking form
    BookingConfirmationPage.tsx # Post-booking success page
    ProfilePage.tsx            # User dashboard
    PachetePage.tsx            # Packages/pricing page
    ForgotPasswordPage.tsx     # Password reset request
    ResetPasswordPage.tsx      # Password reset confirmation
    admin/                     # Admin dashboard pages
      AdminHome.tsx            # Dashboard overview with stats
      Bookings.tsx             # Bookings management
      Availabilities.tsx       # Availability management
      Confirmari.tsx           # Unconfirmed booking review page
      Analytics.tsx            # Charts for booking trends
      Users.tsx                # User management (ban, unban, delete)
      AuditLogs.tsx            # Admin action audit trail
  services/           # Business logic and API services
    auth/             # Authentication services (passwordReset.ts)
    notifications/    # Notification services
      emailService.ts          # 18 email templates (Romanian HTML + plain text)
      smsService.ts            # 11 SMS templates (Romanian)
    recurring/        # Recurring booking/availability services
  main.tsx            # Application entry point (Sentry init, providers)
  App.tsx             # Route definitions (QueryClient, ServicesProvider, ErrorBoundary)
  index.css           # Global styles, CSS variables, custom scrollbar

supabase/
  functions/          # Edge Functions (Deno runtime)
    _shared/          # Shared utilities across edge functions
      auth.ts                  # getAuthenticatedUser, requireAuth, requireAdmin, etc.
      cors.ts                  # corsHeaders, handleCors()
      logger.ts                # Structured JSON logging with PII sanitization
      middleware.ts            # compose(), middleware chain, response helpers
      rate-limit.ts            # Upstash Redis client, rate-limit algorithms
      sentry.ts                # HTTP Store API reporter for backend errors
      supabase-client.ts       # createAdminClient, createUserClient
      validation.ts            # Zod schemas, validateRequest, sanitization
    auth-proxy/                # Password-grant login proxy with rate limiting
    booking-response/          # Process admin accept/decline via token
    cancel-recurring-bookings/ # Delete future recurring booking instances
    cancel-recurring-instance/ # Delete single recurring_bookings row (legacy)
    cleanup-old-data/          # Cron: delete bookings/availabilities >30 days old
    create-booking/            # Insert booking via service role; send email + admin SMS
    create-recurring-availabilities/ # Preview + confirm recurring blocked slots
    create-recurring-bookings/ # Preview + confirm recurring booking instances
    delete-user/               # Delete user from Supabase Auth (cascade deletes)
    rate-limit-health/         # Diagnostic: test Upstash + all 3 algorithms
    request-phone-verification/ # Send OTP via Twilio Verify
    send-email/                # Send transactional email via Brevo API
    send-reminders/            # Cron: send appointment reminder emails
    send-sms/                  # Send SMS via Twilio Messages API
    send-test-emails/          # Round-robin test emails with all templates
    verify-phone-otp/          # Verify OTP; escalating lockout after 5 failures
  migrations/         # Database migrations (chronological)
    20240729120000_phone_verification.sql        # phone_verified, otp_verifications table
    20250101_add_booking_status.sql              # booking_status enum, status, suggested_*
    20250102_booking_response_tokens.sql         # booking_response_tokens table
    20250203_add_booking_text_requests.sql       # requested_date_text, requested_time_text
    20250808_recurring_bookings.sql              # recurring flag, recurring_bookings table
    20250813_recurring_availabilities.sql        # recurring_availabilities table
    20250814_create_test_email_state.sql         # test_email_state table
    20251110_handle_booking_response.sql         # handle_booking_response PL/pgSQL function
    20260216_124123_tighten_bookings_rls.sql     # Remove client INSERT policies

public/
  lovable-uploads/    # Service and device treatment images

docs/               # Additional documentation
  DEPLOYMENT.md     # Deployment guide
  SECURITY.md       # Security policies
```

---

## Documentation

For detailed information about the project architecture and implementations:

- **[FRONTEND.MD](FRONTEND.MD)** — Frontend architecture, component tree, routing, contexts, auth flow, design system
- **[BACKEND.MD](BACKEND.MD)** — Backend architecture, database tables, edge functions, middleware, rate limiting, RLS policies
- **[IMPLEMENTATIONS.MD](IMPLEMENTATIONS.MD)** — Third-party integrations (Brevo, Twilio, Vercel, Sentry, Upstash Redis)
- **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** — Deployment guide
- **[docs/SECURITY.md](docs/SECURITY.md)** — Security policies and best practices

---

## Environment Variables

### Frontend (Vite - inlined at build time)

| Variable | Purpose | Required |
|---|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `VITE_SENTRY_DSN` | Sentry project DSN (frontend) | No (optional) |
| `VITE_SENTRY_ENVIRONMENT` | Sentry environment (e.g., production, staging) | No (optional) |
| `VITE_SENTRY_SAMPLE_RATE` | Sentry trace sample rate (default: 0.5) | No (optional) |
| `VITE_SENTRY_ERROR_SAMPLE_RATE` | Sentry error sample rate (default: 1.0) | No (optional) |
| `VITE_BREVO_API_KEY` | Brevo API key (config validation only) | No (optional) |
| `VITE_BREVO_FROM_EMAIL` | Brevo sender email (config validation only) | No (optional) |
| `VITE_BREVO_FROM_NAME` | Brevo sender name (config validation only) | No (optional) |
| `VITE_TWILIO_SID` | Twilio Account SID (config validation only) | No (optional) |
| `VITE_TWILIO_AUTH_TOKEN` | Twilio Auth Token (config validation only) | No (optional) |

### Backend (Supabase Secrets)

| Secret | Purpose | Required |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (bypasses RLS) | Yes |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST API URL | Yes |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST API token | Yes |
| `SENTRY_DSN` | Sentry project DSN (backend) | No (optional) |
| `SENTRY_ENVIRONMENT` | Sentry environment (backend) | No (optional) |
| `BREVO_API_KEY` | Brevo API key (email sending) | Yes |
| `BREVO_FROM_EMAIL` | Brevo sender email | Yes |
| `BREVO_FROM_NAME` | Brevo sender name | Yes |
| `TWILIO_SID` | Twilio Account SID | Yes |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token | Yes |
| `TWILIO_VERIFY_SID` | Twilio Verify Service SID | Yes |
| `TWILIO_PHONE_NUMBER` | Twilio phone number (SMS sending) | Yes |
| `ADMIN_PHONE_NUMBERS` | Comma-separated admin phone numbers (SMS alerts) | Yes |

---

## How to Run Locally

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/masaj-by-melinda.git
   cd masaj-by-melinda
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   - Copy `.env.example` to `.env.local`
   - Fill in all required `VITE_*` variables
   - Note: `VITE_SENTRY_DSN` is optional; Sentry will not initialize if omitted

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Access the app:**
   - Open [http://localhost:5173](http://localhost:5173) in your browser

---

## Further Resources

- **Lovable Documentation:** [https://docs.lovable.dev/](https://docs.lovable.dev/)
- **Supabase Docs:** [https://supabase.com/docs](https://supabase.com/docs)
- **shadcn/ui Library:** [https://ui.shadcn.com/](https://ui.shadcn.com/)
- **Tailwind CSS:** [https://tailwindcss.com/docs](https://tailwindcss.com/docs)
- **lucide-react:** [https://lucide.dev/](https://lucide.dev/)
- **Project URL:** [https://lovable.dev/projects/35cb7cf4-25d1-4d62-a4ac-655a61e70b49](https://lovable.dev/projects/35cb7cf4-25d1-4d62-a4ac-655a61e70b49)

---
If you have questions, suggestions, or want to contribute, feel free to open an issue or contact the project owner.
