import apiClient from '../../../services/apiClient';

export const safetyService = {
  triggerSOS: async () => {
    // SOS doesn't always need a payload if the backend derives location from recent pings or trip
    const response = await apiClient.post('/sos');
    return response.data;
  },

  reportHazard: async (data) => {
    const response = await apiClient.post('/hazards', data);
    return response.data;
  },

  uploadEvidence: async (file, targetId, targetType) => {
    // targetType might be 'INCIDENT' or 'HAZARD'
    const formData = new FormData();
    formData.append('file', file);
    formData.append('targetId', targetId);
    formData.append('targetType', targetType);

    const response = await apiClient.post('/evidence', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  getAlerts: async () => {
    const response = await apiClient.get('/alerts');
    return response.data;
  }
};
