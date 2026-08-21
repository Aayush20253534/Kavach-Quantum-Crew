import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

export function PublicRoute() {
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  if (isAuthenticated) {
    if (user?.role === 'TOURIST') {
      return <Navigate to="/tourist/dashboard" replace />;
    }
    if (user?.role === 'AUTHORITY') {
      return <Navigate to="/authority/dashboard" replace />;
    }
    // Fallback if role is unknown
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
