import apiClient from '../../../services/apiClient';

export const adminService = {
  getAccounts: async () => {
    const response = await apiClient.get('/admin/accounts');
    return response.data;
  },

  updateAccountStatus: async (role, accountId, statusData) => {
    const response = await apiClient.patch(`/admin/accounts/${role}/${accountId}/status`, statusData);
    return response.data;
  },

  getAuditLogs: async (params) => {
    const response = await apiClient.get('/audit', { params });
    return response.data;
  },
  
  getAuditSummary: async () => {
    const response = await apiClient.get('/audit/summary');
    return response.data;
  },

  getObservabilityMetrics: async () => {
    const response = await apiClient.get('/observability/metrics');
    return response.data;
  },
  
  getDashboardSummary: async () => {
    const response = await apiClient.get('/admin/dashboard');
    return response.data;
  },

  // Integrations
  getIntegrations: async () => {
    const response = await apiClient.get('/integrations/capabilities');
    return response.data;
  },

  // Jobs
  triggerEscalationRun: async () => {
    const response = await apiClient.post('/escalations/run');
    return response.data;
  },
  triggerNotificationSweep: async () => {
    const response = await apiClient.post('/notification-deliveries/process-due');
    return response.data;
  },
  triggerMonitoringSweep: async () => {
    const response = await apiClient.post('/monitoring/sweep');
    return response.data;
  }
};
