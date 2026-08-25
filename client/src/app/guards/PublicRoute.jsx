import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

export function PublicRoute() {
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  if (isAuthenticated) {
    if (user?.role === 'TOURIST') {
      return <Navigate to="/tourist/dashboard" replace />;
    }
    if (user?.role === 'DISASTER_MANAGER') {
      return <Navigate to="/authority/dashboard" replace />;
    }
    if (user?.role === 'SYSTEM_ADMIN') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    // Authenticated users should never fall back to the public landing page.
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
