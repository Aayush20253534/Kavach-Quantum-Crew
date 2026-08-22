import apiClient from '../../../services/apiClient';

export const profileService = {
  /**
   * Submit initial tourist onboarding data (safety profile, medical, contacts).
   */
  submitOnboarding: async (data) => {
    const response = await apiClient.post('/tourists/me/onboarding', data);
    return response.data;
  },

  /**
   * Fetch current tourist profile details.
   */
  getProfile: async () => {
    const response = await apiClient.get('/tourists/me');
    return response.data;
  },

  /**
   * Update specific profile fields.
   */
  updateProfile: async (data) => {
    const response = await apiClient.patch('/tourists/me', data);
    return response.data;
  }
};
