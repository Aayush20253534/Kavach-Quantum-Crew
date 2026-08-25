import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationService } from './notificationService';

const keys = {
  list: ['notifications', 'list'],
  unread: ['notifications', 'unread'],
};

export const useNotifications = () => useQuery({
  queryKey: keys.list,
  queryFn: () => notificationService.list(20),
  refetchInterval: 30000,
});

export const useUnreadNotificationCount = () => useQuery({
  queryKey: keys.unread,
  queryFn: notificationService.unreadCount,
  refetchInterval: 30000,
});

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationService.markRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.list });
      queryClient.invalidateQueries({ queryKey: keys.unread });
    },
  });
};

export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationService.markAllRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.list });
      queryClient.invalidateQueries({ queryKey: keys.unread });
    },
  });
};
