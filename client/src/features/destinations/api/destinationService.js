import apiClient from '../../../services/apiClient';

export const destinationService = {
  list: async ({ search, featured, limit = 10 } = {}) => {
    const response = await apiClient.get('/destinations', {
      params: { search: search || undefined, featured, limit },
    });
    return response.data?.data ?? response.data ?? [];
  },
};
