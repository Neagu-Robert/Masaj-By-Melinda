import React, { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { BookingsProvider } from "../../contexts/BookingsContext";
import { AvailabilitiesProvider } from "../../contexts/AvailabilitiesContext";
import { Button } from "@/components/ui/button";
import { User, Menu, X } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const navItems = [
  { name: "Rezervări", path: "/admin/bookings" },
  { name: "Confirmări", path: "/admin/confirmari" },
  { name: "Disponibilități", path: "/admin/availabilities" },
  { name: "Analize", path: "/admin/analytics" },
  { name: "Utilizatori", path: "/admin/users" },
  { name: "Jurnale de Audit", path: "/admin/auditlogs" }
];

const actionItems = [
  { name: "Vezi Site-ul", path: "/home" },
]

import type { MetaFunction } from "react-router";

export const meta: MetaFunction = () => {
  return [{ name: "robots", content: "noindex, nofollow" }];
};

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleNavigation = (path: string) => {
    setIsMobileMenuOpen(false);
    // Qwiet SAST warning-sink-redirect: false positive — React Router client-side SPA routing with path from static navItems/actionItems internal routes, not a user-controlled URL.
    navigate(path);
  };

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <BookingsProvider>
        <AvailabilitiesProvider>
          <div className="flex h-screen bg-gray-900 text-white">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex w-64 bg-gray-800/50 text-white border-r border-gray-800 flex-col">
              <div className="h-16 flex items-center justify-center font-bold text-2xl border-b border-gray-800 bg-gray-800/50 text-violet-400">
                Admin
              </div>
              <nav className="flex-1 py-4">
                <ul className="space-y-2">
                  {navItems.map((item) => (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        className={`block px-6 py-2 rounded transition-colors font-medium ${
                          location.pathname.startsWith(item.path)
                            ? "bg-violet-400/20 text-violet-300"
                            : "hover:bg-violet-400/10 hover:text-violet-200"
                        }`}
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
              <div className="mt-auto p-4 border-t border-gray-800">
                <ul className="space-y-2">
                  {actionItems.map((item) => (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        className="block px-6 py-2 rounded transition-colors font-medium hover:bg-pink-500/20 hover:text-pink-400"
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col bg-gray-900 text-white">
              {/* Header */}
              <header className="h-16 bg-gray-800/50 border-b border-gray-800 flex items-center px-4 md:px-6 justify-between">
                <div className="flex items-center">
                  {/* Mobile Menu Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden text-gray-300 hover:text-white hover:bg-white/10 mr-3"
                    onClick={handleMobileMenuToggle}
                  >
                    {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                  </Button>
                  <h1 className="text-xl md:text-2xl font-semibold text-violet-400">Panou de Bord</h1>
                </div>
                <div className="flex items-center space-x-2 md:space-x-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full bg-violet-400 text-gray-900 hover:bg-violet-300"
                    onClick={() => navigate('/profile')}
                  >
                    <User className="h-5 w-5 md:h-6 md:w-6" />
                  </Button>
                  <span className="text-gray-400 text-sm md:text-base hidden sm:block">Utilizator Admin</span>
                </div>
              </header>

              {/* Mobile Navigation Menu */}
              {isMobileMenuOpen && (
                <div className="md:hidden bg-gray-800/90 border-b border-gray-700">
                  <div className="px-4 py-2">
                    <div className="text-sm font-medium text-gray-400 mb-2 px-2">Navigație</div>
                    <div className="space-y-1">
                      {navItems.map((item) => (
                        <Button
                          key={item.path}
                          variant="ghost"
                          className={`w-full justify-start h-12 text-left ${
                            location.pathname.startsWith(item.path)
                              ? "bg-violet-400/20 text-violet-300"
                              : "text-gray-300 hover:text-white hover:bg-white/10"
                          }`}
                          onClick={() => handleNavigation(item.path)}
                        >
                          {item.name}
                        </Button>
                      ))}
                    </div>
                    <div className="mt-4 pt-2 border-t border-gray-700">
                      <div className="text-sm font-medium text-gray-400 mb-2 px-2">Acțiuni</div>
                      <div className="space-y-1">
                        {actionItems.map((item) => (
                          <Button
                            key={item.path}
                            variant="ghost"
                            className="w-full justify-start h-12 text-left text-gray-300 hover:text-white hover:bg-white/10"
                            onClick={() => handleNavigation(item.path)}
                          >
                            {item.name}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Content */}
              <main className="flex-1 p-4 md:p-6 overflow-y-auto bg-gray-900 text-white">
                <Outlet />
              </main>
            </div>
          </div>
        </AvailabilitiesProvider>
      </BookingsProvider>
    </ProtectedRoute>
  );
} 