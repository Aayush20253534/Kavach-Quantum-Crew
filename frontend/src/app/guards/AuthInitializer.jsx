import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { FullPageLoader } from '../../components/ui/Loader';
import { authService } from '../../features/auth/api/authService';
import {
  logout,
  setAuth,
  setInitialized,
} from '../../features/auth/store/authSlice';
import {
  getAccessToken,
  refreshSession,
  resetAuthFailure,
} from '../../services/apiClient';

export function AuthInitializer({ children }) {
  const dispatch = useDispatch();
  const { initialized } = useSelector((state) => state.auth);

  useEffect(() => {
    let active = true;

    const failSession = () => {
      if (!active) return;
      dispatch(logout());
    };

    const checkSession = async () => {
      try {
        resetAuthFailure();

        let user;

        if (getAccessToken()) {
          const data = await authService.getMe();
          user = data?.data ?? data;
        } else {
          const refreshed = await refreshSession();
          user = refreshed.user;

          if (!user) {
            const data = await authService.getMe();
            user = data?.data ?? data;
          }
        }

        if (active && user) {
          dispatch(setAuth({ user }));
        } else if (active) {
          dispatch(logout());
        }
      } catch {
        failSession();
      } finally {
        if (active) dispatch(setInitialized());
      }
    };

    const onAuthFailed = () => failSession();

    window.addEventListener('quantum_auth_failed', onAuthFailed);
    checkSession();

    return () => {
      active = false;
      window.removeEventListener('quantum_auth_failed', onAuthFailed);
    };
  }, [dispatch]);

  if (!initialized) {
    return <FullPageLoader />;
  }

  return <>{children}</>;
}
