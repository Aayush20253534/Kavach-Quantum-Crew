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

  // Phase 2: Dispatch & Zones
  getUnits: async () => {
    const response = await apiClient.get('/dispatch/units');
    return response.data;
  },
  assignUnit: async (dispatchId, data) => {
    const response = await apiClient.post(`/dispatch/${dispatchId}/assign`, data);
    return response.data;
  },
  
  getRiskZones: async () => {
    const response = await apiClient.get('/risk-zones');
    return response.data;
  },
  createRiskZone: async (data) => {
    const response = await apiClient.post('/risk-zones', data);
    return response.data;
  },
  activateRiskZone: async (zoneId) => {
    const response = await apiClient.post(`/risk-zones/${zoneId}/activate`);
    return response.data;
  },
  deactivateRiskZone: async (zoneId) => {
    const response = await apiClient.post(`/risk-zones/${zoneId}/deactivate`);
    return response.data;
  },
  
  // Phase 1 Extensions: Hazards
  getHazards: async () => {
    const response = await apiClient.get('/hazards');
    return response.data;
  },
  verifyHazard: async (hazardId) => {
    const response = await apiClient.patch(`/hazards/${hazardId}/verify`);
    return response.data;
  },
  rejectHazard: async (hazardId) => {
    const response = await apiClient.patch(`/hazards/${hazardId}/reject`);
    return response.data;
  },
  resolveHazard: async (hazardId) => {
    const response = await apiClient.patch(`/hazards/${hazardId}/resolve`);
    return response.data;
  },

  // Phase 1 Extensions: Responders
  getResponders: async () => {
    const response = await apiClient.get('/disaster-management/responders');
    return response.data;
  },
  updateResponderStatus: async (statusData) => {
    // Assuming updating own status for now
    const response = await apiClient.patch('/disaster-management/responders/me/status', statusData);
    return response.data;
  },

  // Phase 1 Extensions: Analytics
  getAnalyticsOverview: async () => {
    const response = await apiClient.get('/analytics/overview');
    return response.data;
  },
  getIncidentAnalytics: async () => {
    const response = await apiClient.get('/analytics/incidents');
    return response.data;
  },
  getResponseTimeAnalytics: async () => {
    const response = await apiClient.get('/analytics/response-times');
    return response.data;
  }
};
