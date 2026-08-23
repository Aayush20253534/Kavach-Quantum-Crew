import apiClient from '../../../services/apiClient';

const unwrap = (response) => response.data?.data ?? response.data;

export const groupService = {
  async createGroupForTrip(tripId) {
    return unwrap(await apiClient.post(`/groups/trips/${tripId}`));
  },
  async getGroupForTrip(tripId) {
    return unwrap(await apiClient.get(`/groups/trips/${tripId}`));
  },
  async getGroupDetails(groupId) {
    return unwrap(await apiClient.get(`/groups/${groupId}`));
  },
  async createInvitation(groupId, expiresInMinutes = 60) {
    return unwrap(await apiClient.post(`/groups/${groupId}/invitations`, { expiresInMinutes }));
  },
  async joinGroup(inviteToken) {
    return unwrap(await apiClient.post('/groups/join', { inviteToken }));
  },
  async leaveGroup(groupId) {
    return unwrap(await apiClient.post(`/groups/${groupId}/leave`));
  },
  async removeMember(groupId, memberId) {
    return unwrap(await apiClient.delete(`/groups/${groupId}/members/${memberId}`));
  },
};
