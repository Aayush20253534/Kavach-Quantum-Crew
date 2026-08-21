import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setInitialized } from '../../features/auth/store/authSlice';
import { FullPageLoader } from '../../components/ui/Loader';

export function AuthInitializer({ children }) {
  const dispatch = useDispatch();
  const { initialized } = useSelector((state) => state.auth);

  useEffect(() => {
    const checkSession = async () => {
      try {
        // TODO: Replace with actual API call to verify session
        // const response = await apiClient.get('/auth/me');
        // dispatch(setAuth({ user: response.data }));
      } catch (error) {
        // Handle no active session
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
