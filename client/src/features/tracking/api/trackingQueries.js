import { useQuery, useMutation } from '@tanstack/react-query';
import { trackingService } from './trackingService';

export const trackingKeys = {
  all: ['tracking'],
  riskZones: () => [...trackingKeys.all, 'risk-zones'],
  latestLocations: (groupId) => [...trackingKeys.all, 'latest-locations', groupId],
};

export const useRiskZones = () => {
  return useQuery({
    queryKey: trackingKeys.riskZones(),
    queryFn: trackingService.getRiskZones,
    staleTime: 60 * 1000 * 15, // Cache risk zones for 15 mins
  });
};

export const useLatestLocations = (groupId) => {
  return useQuery({
    queryKey: trackingKeys.latestLocations(groupId),
    queryFn: () => trackingService.getLatestLocations(groupId),
    refetchInterval: 10000, // Poll every 10 seconds until Socket.IO is ready
  });
};

export const useSendPing = () => {
  return useMutation({
    mutationFn: trackingService.sendPing,
    // Note: Do not invalidate queries on ping to save bandwidth; socket or polling will update others
  });
};
