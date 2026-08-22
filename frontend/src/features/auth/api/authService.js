import apiClient from '../../../services/apiClient';

export const authService = {
  /**
   * Register a new tourist account.
   * Returns generic message on success, requiring email verification.
   */
  register: async (data) => {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },

  /**
   * Verify the tourist email using 6-digit OTP.
   * Successful response issues access/refresh tokens.
   */
  verifyEmail: async (data) => {
    const response = await apiClient.post('/auth/verify-email', data);
    return response.data;
  },

  /**
   * Request a replacement OTP.
   */
  resendVerification: async (data) => {
    const response = await apiClient.post('/auth/resend-verification', data);
    return response.data;
  },

  /**
   * Login using identifier and password.
   */
  login: async (credentials) => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },

  /**
   * Fetch the current authenticated user profile.
   */
  getMe: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  /**
   * Revoke the current refresh session.
   */
  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },
};
