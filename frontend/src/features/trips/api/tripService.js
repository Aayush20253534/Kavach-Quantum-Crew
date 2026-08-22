import apiClient from '../../../services/apiClient';

export const tripService = {
  createTrip: async (data) => {
    const response = await apiClient.post('/trips', data);
    return response.data;
  },

  getCurrentTrip: async () => {
    const response = await apiClient.get('/trips/current');
    return response.data;
  },

  getTripHistory: async () => {
    const response = await apiClient.get('/trips/history');
    return response.data;
  },

  getTrip: async (tripId) => {
    const response = await apiClient.get(`/trips/${tripId}`);
    return response.data;
  },

  startTrip: async (tripId) => {
    const response = await apiClient.post(`/trips/${tripId}/start`);
    return response.data;
  },

  completeTrip: async (tripId) => {
    const response = await apiClient.post(`/trips/${tripId}/complete`);
    return response.data;
  },

  cancelTrip: async (tripId) => {
    const response = await apiClient.post(`/trips/${tripId}/cancel`);
    return response.data;
  }
};
