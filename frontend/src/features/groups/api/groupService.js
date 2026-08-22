import apiClient from '../../../services/apiClient';

export const groupService = {
  createGroupForTrip: async (tripId) => {
    const response = await apiClient.post(`/groups/trips/${tripId}`);
    return response.data;
  },

  getGroupForTrip: async (tripId) => {
    const response = await apiClient.get(`/groups/trips/${tripId}`);
    return response.data;
  },

  getGroupDetails: async (groupId) => {
    const response = await apiClient.get(`/groups/${groupId}`);
    return response.data;
  },

  createInvitation: async (groupId) => {
    const response = await apiClient.post(`/groups/${groupId}/invitations`);
    return response.data; // Should return { token, ... }
  },

  joinGroup: async (token) => {
    const response = await apiClient.post(`/groups/join`, { token });
    return response.data;
  },
  
  leaveGroup: async (groupId) => {
    const response = await apiClient.post(`/groups/${groupId}/leave`);
    return response.data;
  }
};
