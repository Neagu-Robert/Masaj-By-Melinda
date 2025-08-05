import React from "react";

export default function AdminHome() {
  return (
    <div className="max-w-2xl mx-auto mt-12 bg-gray-800/50 rounded-lg shadow-lg p-8">
      <h2 className="text-2xl font-bold mb-4 text-violet-400">Welcome to the Admin Dashboard</h2>
      <p className="text-white mb-2">Select a section from the sidebar to begin managing the application.</p>
      <p className="text-gray-400">Use the navigation on the left to access bookings, availabilities, analytics, users, and audit logs.</p>
    </div>
  );
} 