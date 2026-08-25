import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authorityService } from './authorityService';

export const authorityKeys = {
  all: ['authority'],
  incidents: () => [...authorityKeys.all, 'incidents'],
  alerts: () => [...authorityKeys.all, 'alerts'],
};

export const useAllIncidents = () => {
  return useQuery({
    queryKey: authorityKeys.incidents(),
    queryFn: authorityService.getAllIncidents,
    refetchInterval: 30000,
  });
};

export const useAllAlerts = () => {
  return useQuery({
    queryKey: authorityKeys.alerts(),
    queryFn: authorityService.getAllAlerts,
    refetchInterval: 15000,
  });
};

export const useResolveIncident = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authorityService.resolveIncident,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authorityKeys.incidents() });
    }
  });
};
