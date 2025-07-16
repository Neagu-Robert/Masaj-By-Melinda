import React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";

const navItems = [
  { name: "Bookings", path: "/admin/bookings" },
  { name: "Availabilities", path: "/admin/availabilities" },
  { name: "Analytics", path: "/admin/analytics" },
  { name: "Users", path: "/admin/users" },
  { name: "Settings", path: "/admin/settings" },
];

export default function DashboardLayout() {
  const location = useLocation();
  return (
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
      </aside>
      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-background text-foreground">
        {/* Header */}
        <header className="h-16 bg-card border-b border-border flex items-center px-6 justify-between">
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <div className="flex items-center space-x-4">
            {/* Placeholder for user info/avatar */}
            <div className="w-8 h-8 bg-muted rounded-full" />
            <span className="text-muted-foreground">Admin User</span>
          </div>
        </header>
        {/* Content */}
        <main className="flex-1 p-6 overflow-y-auto bg-background text-foreground">
          <Outlet />
        </main>
      </div>
    </div>
  );
} 