import apiClient from '../../../services/apiClient';

export const authorityService = {
  // Phase 1: Incident Loop
  getIncidentQueue: async () => {
    const response = await apiClient.get('/disaster-management/incidents');
    return response.data;
  },

  getIncidentDetails: async (incidentId) => {
    const response = await apiClient.get(`/disaster-management/incidents/${incidentId}`);
    return response.data;
  },

  acknowledgeIncident: async (incidentId) => {
    const response = await apiClient.post(`/disaster-management/incidents/${incidentId}/acknowledge`);
    return response.data;
  },

  startIncident: async (incidentId) => {
    const response = await apiClient.post(`/disaster-management/incidents/${incidentId}/start`);
    return response.data;
  },

  resolveIncident: async (incidentId, data) => {
    const response = await apiClient.post(`/disaster-management/incidents/${incidentId}/resolve`, data);
    return response.data;
  },

  getIncidentMessages: async (incidentId) => {
    const response = await apiClient.get(`/incidents/${incidentId}/messages`);
    return response.data;
  },

  sendIncidentMessage: async (incidentId, data) => {
    const response = await apiClient.post(`/incidents/${incidentId}/messages`, data);
    return response.data;
  },

  getIncidentEvidence: async () => {
    const response = await apiClient.get('/evidence');
    return response.data;
  },

  // Phase 2: Dispatch & Zones (Will be implemented later, but placeholders are good)
  getUnits: async () => {
    const response = await apiClient.get('/dispatch/units');
    return response.data;
  },
  
  getRiskZones: async () => {
    const response = await apiClient.get('/risk-zones');
    return response.data;
  }
};
