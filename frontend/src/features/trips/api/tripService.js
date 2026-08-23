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
  },

  // Check-ins (Phase 3)
  scheduleCheckIn: async (tripId, data) => {
    const response = await apiClient.post(`/safety/trips/${tripId}/check-ins`, data);
    return response.data;
  },
  getCheckIns: async (tripId) => {
    const response = await apiClient.get(`/safety/trips/${tripId}/check-ins`);
    return response.data;
  },
  completeCheckIn: async (checkInId, data) => {
    const response = await apiClient.post(`/safety/check-ins/${checkInId}/complete`, data);
    return response.data;
  }
};
