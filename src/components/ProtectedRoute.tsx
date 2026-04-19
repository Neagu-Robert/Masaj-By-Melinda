import { useAuth } from "../contexts/AuthContext";
import { Navigate } from "react-router";
import React from "react";

export function ProtectedRoute({ children, allowedRoles = ['admin'] }) {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div
          className="animate-spin rounded-full h-32 w-32 border-b-2 border-violet-600"
          role="status"
        >
          <span className="sr-only">Se încarcă...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/home" replace />;
  }
  
  if (!allowedRoles.includes(role)) {
    return <Navigate to="/not-authorized" replace />;
  }

  return <>{children}</>;
} 