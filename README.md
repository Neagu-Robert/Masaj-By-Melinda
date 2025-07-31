
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

**Masaj by Melinda** is a web application designed to present and schedule professional massage and device therapy services. Users can explore available treatments, check details, and book appointments directly through a streamlined UI on desktop or mobile. Admins can view bookings and manage service availabilities (requires expansion).

---

## Main Functionalities

### 1. Service Presentation
- **Overview:** Visitors can explore a catalog of massage services and device-based treatments with detailed descriptions, durations, and pricing.
- **Purpose:** To inform customers about offerings and benefits, helping them choose the service that best fits their needs.
- **Implementation:**  
  - Sections: "Masaje" and "Tratamente cu dispozitive"
  - Each service/treatment includes name, benefits, duration, price, and images for device therapies.

### 2. Booking System
- **Overview:** Users can book sessions by selecting a preferred service, date, and time.
- **Purpose:** Streamlines appointment scheduling, eliminating the need for calls or manual logging.
- **Implementation:**  
  - Multi-step form (contact info, service selection, date & time, booking summary)
  - Real-time availability: Selectable slots reflect current bookings to prevent double-booking.
  - Confirmation toast and redirect after booking.

### 3. Responsive Navigation and Layout
- **Overview:** Navbar adapts for desktop (inline links) and mobile (hamburger menu) with smooth scrolling.
- **Purpose:** Ensure easy access and smooth user journey on all devices.
- **Implementation:**  
  - Uses Tailwind for adaptive layout and spacing
  - All interactive elements sized for touch on mobile

### 4. Contact & Information
- **Overview:** A dedicated contact section offers details for reaching out with questions or special requests.
- **Purpose:** Encourages communication and supports users who prefer direct contact.

### 5. Modern Visual Design
- **Overview:** Images, gradients, and blur effects provide a relaxing and professional feel.
- **Purpose:** Promote trust and showcase professionalism.

---

## Supabase Integration

- **Database:** Uses Supabase (PostgreSQL) to store bookings
- **Booking Availability:** Queries the database to disable already-booked slots in real time
- **Insertions:** When booking, user data is inserted with validation to ensure no time collisions
- **Security:** All client connections use Supabase's anon key; currently bookings are public, but can be protected with authentication if needed.

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
  components/         # UI, booking, and shared components
  components/booking/ # Multi-step booking form components
  components/ui/      # Reusable UI primitives (shadcn)
  integrations/
    supabase/         # Supabase SDK client
  pages/              # Routing pages (Index.tsx, BookingPage.tsx, etc.)
  hooks/              # Custom React hooks
  lib/                # Utility functions (e.g., Tailwind class merger)
public/
  lovable-uploads/    # Service and device treatment images
```

---

## How to Run Locally

1. **Clone the repository**
   ```sh
   git clone <YOUR_GIT_URL>
   cd <YOUR_PROJECT_NAME>
   ```

2. **Install dependencies**
   ```sh
   npm install
   ```

3. **Run the development server**
   ```sh
   npm run dev
   ```

4. **Open the app**
   - Visit [http://localhost:8080](http://localhost:8080) in your browser

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
