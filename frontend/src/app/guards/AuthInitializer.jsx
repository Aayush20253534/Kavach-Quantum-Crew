import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setInitialized, setAuth, logout } from '../../features/auth/store/authSlice';
import { FullPageLoader } from '../../components/ui/Loader';
import { authService } from '../../features/auth/api/authService';

export function AuthInitializer({ children }) {
  const dispatch = useDispatch();
  const { initialized } = useSelector((state) => state.auth);

  useEffect(() => {
    const checkSession = async () => {
      const token = localStorage.getItem('quantum_access_token');
      if (!token) {
        dispatch(setInitialized());
        return;
      }
      
      try {
        const data = await authService.getMe();
        dispatch(setAuth({ user: data.data || data }));
      } catch (error) {
        // Handle no active session
        localStorage.removeItem('quantum_access_token');
        dispatch(logout());
      } finally {
        dispatch(setInitialized());
      }
    };

    checkSession();
  }, [dispatch]);

  if (!initialized) {
    return <FullPageLoader />;
  }

  return <>{children}</>;
}
