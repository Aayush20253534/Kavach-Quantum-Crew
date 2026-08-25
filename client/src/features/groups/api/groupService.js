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
  async previewJoinGroup(inviteToken) {
    return unwrap(await apiClient.post('/groups/join/preview', { inviteToken }));
  },
  async joinGroup(inviteToken) {
    return unwrap(await apiClient.post('/groups/join', { inviteToken }));
  },
  async previewJoinGroupByQr(qrToken) {
    return unwrap(await apiClient.post('/groups/join/qr/preview', { qrToken }));
  },
  async joinGroupByQr(qrToken) {
    return unwrap(await apiClient.post('/groups/join/qr', { qrToken }));
  },
  async getJoinRequestStatus(requestId) {
    return unwrap(await apiClient.get(`/groups/join/requests/${requestId}`));
  },
  async getPendingJoinRequests(groupId) {
    return unwrap(await apiClient.get(`/groups/${groupId}/join-requests`));
  },
  async approveJoinRequest(groupId, requestId) {
    return unwrap(await apiClient.post(`/groups/${groupId}/join-requests/${requestId}/approve`));
  },
  async rejectJoinRequest(groupId, requestId) {
    return unwrap(await apiClient.post(`/groups/${groupId}/join-requests/${requestId}/reject`));
  },
  async getSignalLossCases(tripId) {
    return unwrap(await apiClient.get('/signal-loss-cases', { params: { tripId } }));
  },
  async respondToSignalLoss(caseId, response) {
    return unwrap(await apiClient.post(`/signal-loss-cases/${caseId}/respond`, { response }));
  },
  async leaveGroup(groupId) {
    return unwrap(await apiClient.post(`/groups/${groupId}/leave`));
  },
  async removeMember(groupId, memberId) {
    return unwrap(await apiClient.delete(`/groups/${groupId}/members/${memberId}`));
  },
};
