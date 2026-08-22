import apiClient from '../../../services/apiClient';

export const trackingService = {
  getRiskZones: async () => {
    const response = await apiClient.get('/risk-zones');
    return response.data; // e.g. { items: [...] }
  },

  sendPing: async (data) => {
    // data = { lat, lng, tripId, accuracy, etc. }
    const response = await apiClient.post('/tracking/pings', data);
    return response.data;
  },

  getLatestLocations: async (groupId) => {
    const url = groupId ? `/tracking/groups/${groupId}` : `/tracking/latest`;
    const response = await apiClient.get(url);
    return response.data;
  }
};
