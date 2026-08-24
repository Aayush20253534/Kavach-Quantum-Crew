import apiClient from '../../../services/apiClient';

const unwrap = (response) => response.data?.data ?? response.data;

export const credentialService = {
  async getMyCredential(tripId) {
    return unwrap(await apiClient.get(`/credentials/trips/${tripId}/me`));
  },
  async getGroupCredential(groupId) {
    return unwrap(await apiClient.get(`/credentials/groups/${groupId}`));
  },
  async verify(token) {
    return unwrap(await apiClient.get(`/credentials/verify/${encodeURIComponent(token)}`));
  },
};
