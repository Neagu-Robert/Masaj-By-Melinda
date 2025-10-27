
# Masaj by Melinda

Welcome to the official repository for **Masaj by Melinda**, a professional wellness and massage services booking website.

## Table of Contents

- [Project Overview](#project-overview)
- [Main Functionalities](#main-functionalities)
- [Supabase Integration](#supabase-integration)
- [Technologies & Tools](#technologies--tools)
- [Folder Structure](#folder-structure)
- [How to Run Locally](#how-to-run-locally)
- [Further Resources](#further-resources)

---

## Project Overview

**Masaj by Melinda** is a web application designed to present and schedule professional massage and device therapy services. Users can explore available treatments, check details, and book appointments directly through a streamlined UI on desktop or mobile. The platform includes robust user authentication, profile management, and a comprehensive admin dashboard for managing the business.

---

## Main Functionalities

### 1. Service Presentation
- **Overview:** Visitors can explore a catalog of massage services and device-based treatments with detailed descriptions, durations, and pricing.
- **Purpose:** To inform customers about offerings and benefits, helping them choose the service that best fits their needs.
- **Implementation:**  
  - Sections: "Masaje" and "Tratamente cu dispozitive"
  - Each service/treatment includes name, benefits, duration, price, and images for device therapies.

### 2. Booking System
- **Overview:** Users can book sessions by selecting a preferred service, date, and time. The system supports both registered users and guests.
- **Purpose:** Streamlines appointment scheduling with real-time availability checks to prevent double-booking.
- **Implementation:**  
  - Multi-step form (contact info, service selection, date & time, booking summary)
  - Real-time availability checks.
  - **Recurring Bookings:** Users and admins can set up weekly or biweekly appointments.

### 3. User Authentication & Profile Management
- **Overview:** Users can create an account, log in, reset their password, and manage their profile. Guest access is also supported.
- **Purpose:** Provides a personalized experience, allowing users to view booking history and manage their information.
- **Implementation:**
  - Secure user registration and login.
  - OTP-based phone number verification.
  - Profile dashboard to edit personal details, change password, and manage notification preferences.
  - Calendar view of past and upcoming bookings.

### 4. Advanced Admin Dashboard
- **Overview:** A secure, role-protected area for business management.
- **Purpose:** To give the site administrator full control over bookings, user management, and business insights.
- **Implementation:**
  - **Bookings & Availabilities:** Full CRUD control over appointments and work hours.
  - **User Management:** View, ban, unban, and delete customer accounts.
  - **Analytics:** Visual charts displaying booking trends, popular services, and peak hours.
  - **Audit Logs:** Tracks all significant admin actions for accountability.

### 5. Notification System
- **Overview:** Automated email and SMS notifications for important events.
- **Purpose:** Keeps users and admins informed about booking statuses and account changes.
- **Implementation:**
  - Emails for booking confirmations, updates, cancellations, and reminders.
  - Users can customize their email notification preferences in their profile.

### 6. Responsive Navigation and Layout
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
| **React** | UI construction | Manages components, state, and app logic |
| **Vite** | App bundling/dev server | Fast local development and builds |
| **TypeScript** | Type safety | Improves robustness and maintainability |
| **Tailwind CSS** | Utility-first styling | Rapid layout and mobile-first design; media queries for responsiveness |
| **shadcn/ui** | Prebuilt UI components | Used for cards, forms, buttons, toasts, etc. |
| **lucide-react** | Modern React SVG icons | Provides visually appealing iconography |
| **Supabase** | Database & backend as a service | Booking storage and availability checking |
| **react-hook-form** | Form state management | Efficient validation and controlled forms for Booking |
| **react-router-dom** | Client-side routing | Navigates between main page, booking, and packages pages |
| **sonner** | UI toast notifications | Friendly popup notifications for booking feedback |
| **date-fns** | Date manipulation | Ensures correct formatting and date-picking logic |
| **next-themes** | Theme support | Manages light/dark mode for toasts |
| **Other libraries** | Various helpers | See package.json for full dependency list |

---

## Folder Structure

```
src/
  components/         # Reusable React components
    admin/            # Components specific to the admin dashboard
    auth/             # Components for authentication (e.g., OTP modal)
    booking/          # Components for the multi-step booking form
    profile/          # Components for the user profile page
    ui/               # General-purpose UI components (from shadcn/ui)
  contexts/           # React Context providers for global state management
  hooks/              # Custom React hooks
  integrations/       # Third-party service integrations (e.g., Supabase client)
  lib/                # Utility functions and shared libraries
  pages/              # Top-level page components for routing
    admin/            # Page components for the admin dashboard
  services/           # Business logic and API services
    auth/             # Authentication-related services
    notifications/    # Logic for sending email/SMS notifications
    recurring/        # Services for managing recurring bookings
  supabase/           # Supabase migrations and edge functions
public/
  lovable-uploads/    # Service and device treatment images
```

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
