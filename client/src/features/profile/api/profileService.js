import apiClient from '../../../services/apiClient';

const unwrap = (response) => response.data?.data ?? response.data;

export const profileService = {
  async submitOnboarding(data) {
    return unwrap(await apiClient.post('/tourists/me/onboarding', data));
  },

  async getProfile() {
    return unwrap(await apiClient.get('/tourists/me'));
  },

  async updateProfile(data) {
    return unwrap(await apiClient.patch('/tourists/me', data));
  },


  async uploadMedicalDocument(file) {
    const form = new FormData();
    form.append('document', file);

    return unwrap(
      await apiClient.post('/tourists/me/medical-document', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    );
  },

  async uploadProfileImage(file) {
    const form = new FormData();
    form.append('image', file);

    return unwrap(
      await apiClient.post('/tourists/me/profile-image', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    );
  },
};
