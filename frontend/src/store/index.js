import { configureStore } from '@reduxjs/toolkit';

// Import feature reducers here later

export const store = configureStore({
  reducer: {
    // auth: authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});
