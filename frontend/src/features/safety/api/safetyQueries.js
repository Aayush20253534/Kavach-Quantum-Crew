import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { safetyService } from './safetyService';

export const safetyKeys = {
  all: ['safety'],
  alerts: () => [...safetyKeys.all, 'alerts'],
};

export const useTriggerSOS = () => {
  return useMutation({
    mutationFn: safetyService.triggerSOS,
  });
};

export const useReportHazard = () => {
  return useMutation({
    mutationFn: safetyService.reportHazard,
  });
};

export const useUploadEvidence = () => {
  return useMutation({
    mutationFn: ({ file, targetId, targetType }) => safetyService.uploadEvidence(file, targetId, targetType)
  });
};

export const useAlerts = () => {
  return useQuery({
    queryKey: safetyKeys.alerts(),
    queryFn: safetyService.getAlerts,
    refetchInterval: 15000, // Poll every 15s for new alerts until WebSockets
  });
};
