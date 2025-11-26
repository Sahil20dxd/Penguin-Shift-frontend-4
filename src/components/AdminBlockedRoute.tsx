// src/components/AdminBlockedRoute.tsx
// Blocks admin users from accessing user-only routes (like /shift pages)

import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/useAuth";

interface AdminBlockedRouteProps {
  children: React.ReactNode;
}

export default function AdminBlockedRoute({ children }: AdminBlockedRouteProps) {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-600 text-lg">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth?mode=login" replace />;
  }

  // Block admins from accessing user-only features
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'CURATOR' 
    || user?.role === 'ROLE_ADMIN' || user?.role === 'ROLE_CURATOR';
  
  if (isAdmin) {
    return <Navigate to="/profile" replace />;
  }

  return <>{children}</>;
}

