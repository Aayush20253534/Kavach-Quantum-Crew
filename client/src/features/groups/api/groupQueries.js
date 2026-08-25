import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { groupService } from './groupService';
import { tripKeys } from '../../trips/api/tripQueries';

export const groupKeys = {
  all: ['groups'],
  tripGroup: (tripId) => [...groupKeys.all, 'trip', tripId],
  detail: (groupId) => [...groupKeys.all, 'detail', groupId],
};

export const useGroupForTrip = (tripId) => {
  return useQuery({
    queryKey: groupKeys.tripGroup(tripId),
    queryFn: () => groupService.getGroupForTrip(tripId),
    enabled: !!tripId,
    retry: false, // Might return 404 if no group exists for trip
  });
};

export const useCreateGroupForTrip = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: groupService.createGroupForTrip,
    onSuccess: (data, tripId) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.tripGroup(tripId) });
    },
  });
};

export const useCreateInvitation = () => {
  return useMutation({
    mutationFn: groupService.createInvitation,
  });
};

export const useJoinGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: groupService.joinGroup,
    onSuccess: () => {
      // Invalidate current trip because joining a group sets it as your active trip
      queryClient.invalidateQueries({ queryKey: tripKeys.current() });
    },
  });
};
