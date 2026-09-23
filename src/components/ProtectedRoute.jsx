import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";

export default function ProtectedRoute() {
  const { isAdmin, isLoadingAuth } = useAuth();
  const location = useLocation();
  if (isLoadingAuth) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center" role="status" aria-label="Loading">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#e5e5ea] border-t-[#0071e3]" />
      </div>
    );
  }
  if (!isAdmin) {
    return <Navigate to={`/login?returnTo=${encodeURIComponent(location.pathname)}`} replace />;
  }
  return <Outlet />;
}
