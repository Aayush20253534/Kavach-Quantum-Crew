import apiClient from '../../../services/apiClient';

export const notificationService = {
  list: async (limit = 20) => {
    const response = await apiClient.get('/notifications', { params: { limit } });
    return response.data?.data ?? response.data ?? [];
  },
  unreadCount: async () => {
    const response = await apiClient.get('/notifications/unread-count');
    return response.data?.data?.count ?? 0;
  },
  markRead: async (notificationId) => {
    const response = await apiClient.patch(`/notifications/${notificationId}/read`);
    return response.data?.data ?? response.data;
  },
  markAllRead: async () => {
    const response = await apiClient.patch('/notifications/read-all');
    return response.data?.data ?? response.data;
  },
};
