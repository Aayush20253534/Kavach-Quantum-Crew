import apiClient from '../../../services/apiClient';

export const emergencyServicesApi = {
  getMe: () => apiClient.get('/emergency-services/me'),
  updateLocation: (data) => apiClient.patch('/emergency-services/me/location', data),
  getDispatches: () => apiClient.get('/emergency-services/me/dispatches'),
  updateDispatchLocation: (dispatchId, data) => 
    apiClient.patch(`/emergency-services/dispatches/${dispatchId}/location`, data),
  updateDispatchStatus: (dispatchId, data) => 
    apiClient.patch(`/emergency-services/dispatches/${dispatchId}/status`, data),
};
