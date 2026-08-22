import { createSlice } from '@reduxjs/toolkit';

// Retrieve initial auth state from localStorage if available (demo/persistent support)
const savedAuth = (() => {
  try {
    const raw = localStorage.getItem('kavach_auth');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
})();

const initialState = {
  user: savedAuth?.user || null,
  isAuthenticated: savedAuth?.isAuthenticated ?? false,
  initialized: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuth: (state, action) => {
      state.user = action.payload.user;
      state.isAuthenticated = true;
      try {
        localStorage.setItem('kavach_auth', JSON.stringify({ user: state.user, isAuthenticated: true }));
      } catch (e) {}
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      try {
        localStorage.setItem('kavach_auth', JSON.stringify({ user: state.user, isAuthenticated: state.isAuthenticated }));
      } catch (e) {}
    },
    completeOnboarding: (state, action) => {
      state.user = { ...state.user, ...action.payload, onboardingComplete: true };
      try {
        localStorage.setItem('kavach_auth', JSON.stringify({ user: state.user, isAuthenticated: state.isAuthenticated }));
      } catch (e) {}
    },
    setInitialized: (state) => {
      state.initialized = true;
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      try {
        localStorage.removeItem('kavach_auth');
      } catch (e) {}
    },
  },
});

export const { setAuth, updateUser, completeOnboarding, setInitialized, logout } = authSlice.actions;
export default authSlice.reducer;
