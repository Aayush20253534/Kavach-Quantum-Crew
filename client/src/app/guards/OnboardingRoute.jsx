import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

export function OnboardingRoute() {
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'TOURIST') {
    return (
      <Navigate
        to={user?.role === 'DISASTER_MANAGER' ? '/authority/dashboard' : '/'}
        replace
      />
    );
  }

  if (user?.onboardingCompleted) {
    return <Navigate to="/tourist/dashboard" replace />;
  }

  return <Outlet />;
}
