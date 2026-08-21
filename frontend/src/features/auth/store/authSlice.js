import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: {
    id: null,
    name: null,
    role: null, // e.g., 'TOURIST', 'AUTHORITY'
    onboardingComplete: null,
  },
  isAuthenticated: false,
  initialized: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuth: (state, action) => {
      state.user = action.payload.user;
      state.isAuthenticated = true;
    },
    setInitialized: (state) => {
      state.initialized = true;
    },
    logout: (state) => {
      state.user = initialState.user;
      state.isAuthenticated = false;
    },
  },
});

export const { setAuth, setInitialized, logout } = authSlice.actions;
export default authSlice.reducer;
