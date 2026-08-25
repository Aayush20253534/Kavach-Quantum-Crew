import apiClient from '../../../services/apiClient';

const unwrap = (response) => response.data?.data ?? response.data;

export const safetyService = {
  async triggerSOS(data) {
    return unwrap(await apiClient.post('/sos', data));
  },

  async reportHazard(data) {
    return unwrap(await apiClient.post('/hazards', data));
  },

  async listMyHazards(params = {}) {
    return unwrap(await apiClient.get('/hazards', { params: { mine: true, ...params } }));
  },

  async listMyIncidents(params = {}) {
    return unwrap(await apiClient.get('/incidents/mine', { params }));
  },

  async uploadEvidence(file, targetId, targetType) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('targetId', targetId);
    formData.append('targetType', targetType);

    return unwrap(
      await apiClient.post('/evidence', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    );
  },

  async getAlerts(params = {}) {
    return unwrap(await apiClient.get('/alerts', { params }));
  },

  async acknowledgeAlert(alertId) {
    return unwrap(await apiClient.post(`/alerts/${alertId}/acknowledge`));
  },
};
