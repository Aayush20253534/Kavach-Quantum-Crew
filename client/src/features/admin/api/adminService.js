import apiClient from '../../../services/apiClient';

const unwrap = (response) => response.data?.data ?? response.data;

export const adminService = {
  async getDashboardSummary() {
    return unwrap(await apiClient.get('/admin/dashboard'));
  },

  async getAccounts(params = {}) {
    return unwrap(await apiClient.get('/admin/accounts', { params }));
  },

  async getAccount(role, accountId) {
    return unwrap(await apiClient.get(`/admin/accounts/${role}/${accountId}`));
  },

  async updateAccountStatus(role, accountId, statusData) {
    return unwrap(
      await apiClient.patch(
        `/admin/accounts/${role}/${accountId}/status`,
        statusData,
      ),
    );
  },

  async getResources(resource, params = {}) {
    return unwrap(
      await apiClient.get(`/admin/resources/${resource}`, { params }),
    );
  },

  async getAuditLogs(params = {}) {
    return unwrap(await apiClient.get('/audit', { params }));
  },

  async getAuditSummary(params = {}) {
    return unwrap(await apiClient.get('/audit/summary', { params }));
  },

  async getObservabilityMetrics() {
    return unwrap(await apiClient.get('/observability/metrics'));
  },

  async getDiagnostics() {
    return unwrap(await apiClient.get('/observability/diagnostics'));
  },





  async getDestinations(params = {}) {
    return unwrap(await apiClient.get('/admin/destinations', { params }));
  },

  async createDestination(data) {
    return unwrap(await apiClient.post('/admin/destinations', data));
  },

  async updateDestination(destinationId, data) {
    return unwrap(
      await apiClient.patch(`/admin/destinations/${destinationId}`, data),
    );
  },

  async deleteDestination(destinationId) {
    return unwrap(
      await apiClient.delete(`/admin/destinations/${destinationId}`),
    );
  },

  async uploadDestinationImage(destinationId, file) {
    const form = new FormData();
    form.append('image', file);

    return unwrap(
      await apiClient.post(
        `/admin/destinations/${destinationId}/image`,
        form,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        },
      ),
    );
  },
};
