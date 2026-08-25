import apiClient from '../../../services/apiClient';

export const dashboardService = {
  getTouristSummary: async (location) => {
    const params = location
      ? { latitude: location.lat, longitude: location.lng }
      : {};
    const response = await apiClient.get('/dashboard/tourist', { params });
    return response.data?.data ?? response.data;
  },
};
