import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

export function RoleRoute({ allowedRoles }) {
  const { user } = useSelector((state) => state.auth);

  if (!allowedRoles.includes(user?.role)) {
    // If not authorized for this role, send them to their appropriate dashboard or home
    if (user?.role === 'TOURIST') {
      return <Navigate to="/tourist/dashboard" replace />;
    }
    if (user?.role === 'AUTHORITY') {
      return <Navigate to="/authority/dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }

  // If the user is a TOURIST and hasn't completed onboarding, enforce it
  if (user?.role === 'TOURIST' && !user?.onboardingComplete) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}
