import React from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { BookingsProvider } from "../../contexts/BookingsContext";
import { AvailabilitiesProvider } from "../../contexts/AvailabilitiesContext";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";

const navItems = [
  { name: "Bookings", path: "/admin/bookings" },
  { name: "Availabilities", path: "/admin/availabilities" },
  { name: "Analytics", path: "/admin/analytics" },
  { name: "Users", path: "/admin/users" },
  { name: "Audit Logs", path: "/admin/auditlogs" }
];

const actionItems = [
  { name: "View Site", path: "/home" },
]

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <BookingsProvider>
      <AvailabilitiesProvider>
        <div className="flex h-screen bg-gray-900 text-white">
          {/* Sidebar */}
          <aside className="w-64 bg-gray-800/50 text-white border-r border-gray-800 flex flex-col">
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
            <header className="h-16 bg-gray-800/50 border-b border-gray-800 flex items-center px-6 justify-between">
              <h1 className="text-2xl font-semibold text-violet-400">Dashboard</h1>
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full bg-violet-400 text-gray-900 hover:bg-violet-300"
                  onClick={() => navigate('/profile')}
                >
                  <User className="h-6 w-6" />
                </Button>
                <span className="text-gray-400">Admin User</span>
              </div>
            </header>
            {/* Content */}
            <main className="flex-1 p-6 overflow-y-auto bg-gray-900 text-white">
              <Outlet />
            </main>
          </div>
        </div>
      </AvailabilitiesProvider>
    </BookingsProvider>
  );
} 