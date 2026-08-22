import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tripService } from './tripService';

export const tripKeys = {
  all: ['trips'],
  current: () => [...tripKeys.all, 'current'],
  history: () => [...tripKeys.all, 'history'],
  detail: (id) => [...tripKeys.all, 'detail', id],
};

export const useCurrentTrip = () => {
  return useQuery({
    queryKey: tripKeys.current(),
    queryFn: tripService.getCurrentTrip,
    retry: false, // Don't retry if no current trip exists (404)
  });
};

export const useTripHistory = () => {
  return useQuery({
    queryKey: tripKeys.history(),
    queryFn: tripService.getTripHistory,
  });
};

export const useTripDetail = (tripId) => {
  return useQuery({
    queryKey: tripKeys.detail(tripId),
    queryFn: () => tripService.getTrip(tripId),
    enabled: !!tripId,
  });
};

export const useCreateTrip = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tripService.createTrip,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tripKeys.current() });
      queryClient.invalidateQueries({ queryKey: tripKeys.history() });
    },
  });
};

export const useStartTrip = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tripService.startTrip,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tripKeys.current() });
    },
  });
};

export const useCompleteTrip = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tripService.completeTrip,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tripKeys.current() });
      queryClient.invalidateQueries({ queryKey: tripKeys.history() });
    },
  });
};

export const useCancelTrip = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tripService.cancelTrip,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tripKeys.current() });
      queryClient.invalidateQueries({ queryKey: tripKeys.history() });
    },
  });
};
