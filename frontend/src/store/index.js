import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/store/authSlice';
// Import feature reducers here later

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});
