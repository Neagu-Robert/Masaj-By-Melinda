
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import NotFound from "./pages/NotFound";
import BookingPage from "./pages/BookingPage";
import PachetePage from "./pages/PachetePage";
import ProfilePage from "./pages/ProfilePage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import BookingConfirmationPage from "./pages/BookingConfirmationPage";
import DashboardLayout from "./pages/admin/DashboardLayout";
import AdminHome from "./pages/admin/AdminHome";
import Bookings from "./pages/admin/Bookings";
import Availabilities from "./pages/admin/Availabilities";
import Analytics from "./pages/admin/Analytics";
import Users from "./pages/admin/Users";
import AuditLogs from "./pages/admin/AuditLogs";
import Confirmari from "./pages/admin/Confirmari";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ServicesProvider } from "./contexts/ServicesContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import NotAuthorized from "./pages/NotAuthorized";
import { ErrorBoundary } from "./components/ErrorBoundary";


const queryClient = new QueryClient();

function App() {
  const { status, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-violet-600" role="status">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  if (status === "banned") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="bg-gray-800 p-8 rounded shadow-md w-full max-w-sm text-center">
          <h2 className="text-2xl font-bold mb-4 text-red-400">Account Banned</h2>
          <p className="text-white mb-4">
            Your account has been banned. Please contact support if you believe this is a mistake.
          </p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ServicesProvider>
          <Toaster />
          <Sonner />
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/booking-confirmation" element={<BookingConfirmationPage />} />
              <Route path="/home" element={<Index />} />
              <Route path="/book" element={<BookingPage />} />
              <Route path="/pachete" element={<PachetePage />} />
              <Route path="/profile" element={
                <ProtectedRoute allowedRoles={['admin', 'customer']}>
                  <ProfilePage />
                </ProtectedRoute>
              } />
              <Route path="/admin" element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <DashboardLayout />
                </ProtectedRoute>
              }>
                <Route index element={<AdminHome />} />
                <Route path="bookings" element={<Bookings />} />
                <Route path="availabilities" element={<Availabilities />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="users" element={<Users />} />
                <Route path="auditlogs" element={<AuditLogs />} />
                <Route path="confirmari" element={<Confirmari />} />
          
              </Route>
              <Route path="/not-authorized" element={<NotAuthorized />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ErrorBoundary>
        </ServicesProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
