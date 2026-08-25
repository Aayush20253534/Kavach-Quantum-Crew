import { useQuery } from '@tanstack/react-query';
import { dashboardService } from './dashboardService';

export const useTouristDashboardSummary = (location) => useQuery({
  queryKey: ['dashboard', 'tourist', location?.lat?.toFixed?.(4), location?.lng?.toFixed?.(4)],
  queryFn: () => dashboardService.getTouristSummary(location),
  refetchInterval: 30000,
  staleTime: 15000,
});
