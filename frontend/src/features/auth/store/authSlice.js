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
  user: savedAuth?.user || {
    id: 'usr_demo_101',
    name: 'Prachi Maurya',
    username: 'prachi_m',
    email: 'prachi@touristsafety.in',
    phone: '+91 98765 43210',
    role: 'TOURIST', // 'TOURIST' | 'AUTHORITY' | 'ADMIN'
    onboardingComplete: true,
    emergencyContact: {
      name: 'Ramesh Maurya',
      relation: 'Father',
      phone: '+91 98765 00000',
    },
    medicalInfo: {
      bloodGroup: 'O+',
      allergies: 'None',
      notes: 'No chronic condition',
    },
    safetySettings: {
      liveTracking: true,
      geoFenceAlerts: true,
      smsFallback: true,
    },
  },
  isAuthenticated: savedAuth?.isAuthenticated ?? true, // Default to demo logged-in for immediate exploration
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
