import apiClient from '../../../services/apiClient';

export const authorityService = {
  getAllIncidents: async () => {
    // Assuming backend provides this endpoint for authorities
    const response = await apiClient.get('/hazards'); 
    return response.data;
  },

  getAllAlerts: async () => {
    // Assuming backend provides this endpoint for authorities to see global SOS
    const response = await apiClient.get('/alerts');
    return response.data;
  },

  resolveIncident: async (incidentId) => {
    const response = await apiClient.patch(`/hazards/${incidentId}`, { status: 'RESOLVED' });
    return response.data;
  }
};
