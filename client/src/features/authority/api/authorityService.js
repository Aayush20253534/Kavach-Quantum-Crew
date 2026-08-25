import apiClient from '../../../services/apiClient';

const unwrap = (response) => {
  const payload = response?.data;
  return payload && Object.prototype.hasOwnProperty.call(payload, 'data') ? payload.data : payload;
};

export const authorityService = {
  getDashboard: async () => unwrap(await apiClient.get('/disaster-management/dashboard')),
  getJurisdictionOverview: async () =>
    unwrap(await apiClient.get('/disaster-management/jurisdiction-overview')),
  getAllIncidents: async () => unwrap(await apiClient.get('/disaster-management/incidents')),
  getAllAlerts: async () => unwrap(await apiClient.get('/hazards')),
  getMe: async () => unwrap(await apiClient.get('/disaster-management/responders/me')),
  // Phase 1: Incident Loop
  getIncidentQueue: async () => {
    const response = await apiClient.get('/disaster-management/incidents');
    return unwrap(response);
  },

  getIncidentDetails: async (incidentId) => {
    const response = await apiClient.get(`/disaster-management/incidents/${incidentId}`);
    return unwrap(response);
  },

  acknowledgeIncident: async (incidentId) => {
    const response = await apiClient.post(`/disaster-management/incidents/${incidentId}/acknowledge`);
    return unwrap(response);
  },

  startIncident: async (incidentId) => {
    const response = await apiClient.post(`/disaster-management/incidents/${incidentId}/start`);
    return unwrap(response);
  },

  resolveIncident: async (incidentId, data) => {
    const note = data?.note || data?.resolutionNotes || 'Resolved by disaster management';
    const response = await apiClient.post(`/disaster-management/incidents/${incidentId}/resolve`, { note });
    return unwrap(response);
  },

  getIncidentMessages: async (incidentId) => {
    const response = await apiClient.get(`/incidents/${incidentId}/messages`);
    return unwrap(response);
  },

  sendIncidentMessage: async (incidentId, data) => {
    const response = await apiClient.post(`/incidents/${incidentId}/messages`, data);
    return unwrap(response);
  },

  getIncidentEvidence: async () => {
    const response = await apiClient.get('/evidence');
    return unwrap(response);
  },

  // Phase 2: Dispatch & Zones
  getActiveDispatches: async () => unwrap(await apiClient.get('/dispatch/active')),
  getDispatchTracking: async (dispatchId) => unwrap(await apiClient.get(`/emergency-services/tracking/${dispatchId}`)),
  getUnits: async () => {
    const response = await apiClient.get('/dispatch/units');
    return unwrap(response);
  },
  assignUnit: async (dispatchId, data) => {
    const response = await apiClient.post(`/dispatch/${dispatchId}/assign`, data);
    return unwrap(response);
  },
  
  getRiskZones: async () => {
    const response = await apiClient.get('/risk-zones');
    return unwrap(response);
  },
  createRiskZone: async (data) => {
    const response = await apiClient.post('/risk-zones', data);
    return unwrap(response);
  },
  activateRiskZone: async (zoneId) => {
    const response = await apiClient.post(`/risk-zones/${zoneId}/activate`);
    return unwrap(response);
  },
  deactivateRiskZone: async (zoneId) => {
    const response = await apiClient.post(`/risk-zones/${zoneId}/deactivate`);
    return unwrap(response);
  },
  
  // Phase 1 Extensions: Hazards
  getHazards: async () => {
    const response = await apiClient.get('/hazards');
    return unwrap(response);
  },
  verifyHazard: async (hazardId) => {
    const response = await apiClient.patch(`/hazards/${hazardId}/verify`);
    return unwrap(response);
  },
  rejectHazard: async (hazardId) => {
    const response = await apiClient.patch(`/hazards/${hazardId}/reject`);
    return unwrap(response);
  },
  resolveHazard: async (hazardId) => {
    const response = await apiClient.patch(`/hazards/${hazardId}/resolve`);
    return unwrap(response);
  },

  // Phase 1 Extensions: Responders
  getResponders: async () => {
    const response = await apiClient.get('/disaster-management/responders');
    return unwrap(response);
  },
  updateResponderStatus: async (statusData) => {
    // Assuming updating own status for now
    const response = await apiClient.patch('/disaster-management/responders/me/status', statusData);
    return unwrap(response);
  },

  // Phase 1 Extensions: Analytics
  getAnalyticsOverview: async () => {
    const response = await apiClient.get('/analytics/overview');
    return unwrap(response);
  },
  getIncidentAnalytics: async (params = {}) => {
    const response = await apiClient.get('/analytics/incidents', { params });
    return unwrap(response);
  },
  getResponderAnalytics: async () => {
    const response = await apiClient.get('/analytics/responders');
    return unwrap(response);
  },
  getResponseTimeAnalytics: async (params = {}) => {
    const response = await apiClient.get('/analytics/response-times', { params });
    return unwrap(response);
  }
};
