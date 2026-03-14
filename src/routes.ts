import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  // Public routes
  index("pages/Index.tsx"),
  route("auth", "pages/AuthPage.tsx"),
  route("forgot-password", "pages/ForgotPasswordPage.tsx"),
  route("reset-password", "pages/ResetPasswordPage.tsx"),
  route("booking-confirmation", "pages/BookingConfirmationPage.tsx"),
  route("book", "pages/BookingPage.tsx"),
  route("pachete", "pages/PachetePage.tsx"),
  route("not-authorized", "pages/NotAuthorized.tsx"),

  // Protected profile
  route("profile", "pages/ProfilePage.tsx"),

  // /home → / redirect
  route("home", "routes/home-redirect.tsx"),

  // Admin layout with children
  route("admin", "pages/admin/DashboardLayout.tsx", [
    index("pages/admin/AdminHome.tsx"),
    route("bookings", "pages/admin/Bookings.tsx"),
    route("availabilities", "pages/admin/Availabilities.tsx"),
    route("analytics", "pages/admin/Analytics.tsx"),
    route("users", "pages/admin/Users.tsx"),
    route("auditlogs", "pages/admin/AuditLogs.tsx"),
    route("confirmari", "pages/admin/Confirmari.tsx"),
  ]),

  // Catch-all
  route("*", "pages/NotFound.tsx"),
] satisfies RouteConfig;
