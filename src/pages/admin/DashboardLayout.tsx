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
  { name: "Settings", path: "/admin/settings" },
];

const actionItems = [
  { name: "View Site", path: "/home" },
]

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <AvailabilitiesProvider>
      <BookingsProvider>
        <div className="flex min-h-screen bg-background text-foreground">
          {/* Sidebar */}
          <aside className="w-64 bg-sidebar text-sidebar-foreground border-r border-border flex flex-col">
            <div className="h-16 flex items-center justify-center font-bold text-xl border-b border-border bg-sidebar">
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
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      }`}
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="mt-auto p-4 border-t border-border">
              <ul className="space-y-2">
                {actionItems.map((item) => (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className="block px-6 py-2 rounded transition-colors font-medium hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
          {/* Main Content */}
          <div className="flex-1 flex flex-col bg-background text-foreground">
            {/* Header */}
            <header className="h-16 bg-card border-b border-border flex items-center px-6 justify-between">
              <h1 className="text-2xl font-semibold">Dashboard</h1>
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                  onClick={() => navigate('/profile')}
                >
                  <User className="h-6 w-6" />
                </Button>
                <span className="text-muted-foreground">Admin User</span>
              </div>
            </header>
            {/* Content */}
            <main className="flex-1 p-6 overflow-y-auto bg-background text-foreground">
              <Outlet />
            </main>
          </div>
        </div>
      </BookingsProvider>
    </AvailabilitiesProvider>
  );
} 