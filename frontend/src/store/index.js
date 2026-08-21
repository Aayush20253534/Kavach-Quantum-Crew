import { configureStore } from '@reduxjs/toolkit';
<<<<<<< HEAD
=======
import authReducer from '../features/auth/store/authSlice';
>>>>>>> 49c12ff8e761bf868f772210a5186b9bb53cbbfe

// Import feature reducers here later

export const store = configureStore({
  reducer: {
<<<<<<< HEAD
    // auth: authReducer,
=======
    auth: authReducer,
>>>>>>> 49c12ff8e761bf868f772210a5186b9bb53cbbfe
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});
