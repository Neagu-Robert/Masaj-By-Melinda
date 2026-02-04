import { useAuth } from "../contexts/AuthContext";
import { Navigate } from "react-router-dom";
import React from "react";

export function ProtectedRoute({ children, allowedRoles = ['admin'] }) {
  const { user, role, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>; // Or a spinner component
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  if (!allowedRoles.includes(role)) {
    return <Navigate to="/not-authorized" replace />;
  }

  return <>{children}</>;
} 