
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import NotFound from "./pages/NotFound";
import BookingPage from "./pages/BookingPage";
import PachetePage from "./pages/PachetePage";
import ProfilePage from "./pages/ProfilePage";
import DashboardLayout from "./pages/admin/DashboardLayout";
import AdminHome from "./pages/admin/AdminHome";
import Bookings from "./pages/admin/Bookings";
import Availabilities from "./pages/admin/Availabilities";
import Analytics from "./pages/admin/Analytics";
import Users from "./pages/admin/Users";
import Settings from "./pages/admin/Settings";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import NotAuthorized from "./pages/NotAuthorized";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AuthPage />} />
            <Route path="/home" element={<Index />} />
            <Route path="/book" element={<BookingPage />} />
            <Route path="/pachete" element={<PachetePage />} />
            <Route path="/profile" element={
              <ProtectedRoute allowedRoles={['admin', 'customer']}>
                <ProfilePage />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route index element={<AdminHome />} />
              <Route path="bookings" element={<Bookings />} />
              <Route path="availabilities" element={<Availabilities />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="users" element={<Users />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            <Route path="/not-authorized" element={<NotAuthorized />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
