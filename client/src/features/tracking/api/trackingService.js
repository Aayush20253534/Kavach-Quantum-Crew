import apiClient from '../../../services/apiClient';

const unwrap = (response) => response.data?.data ?? response.data;

export const trackingService = {
  async getRiskZones() {
    return unwrap(await apiClient.get('/risk-zones', { params: { active: true } }));
  },

  async sendPing(data) {
    const payload = {
      tripId: data.tripId,
      latitude: data.lat,
      longitude: data.lng,
      accuracyM: Math.max(1, data.accuracy || 1),
      timestamp: new Date(data.timestamp || Date.now()).toISOString(),
      ...(Number.isFinite(data.speed) && data.speed >= 0 ? { speedMps: data.speed } : {}),
      ...(Number.isFinite(data.heading) ? { headingDeg: data.heading } : {}),
      ...(Number.isInteger(data.batteryLevel) ? { batteryLevel: data.batteryLevel } : {}),
      networkStatus: navigator.onLine ? 'UNKNOWN' : 'OFFLINE',
    };
    return unwrap(await apiClient.post('/tracking/pings', payload));
  },

  async getLatestLocation(tripId) {
    return unwrap(await apiClient.get('/tracking/latest', { params: { tripId } }));
  },

  async getLatestLocations(groupId) {
    if (!groupId) return [];
    return unwrap(await apiClient.get(`/tracking/groups/${groupId}`));
  },

  async grantConsent(tripId) {
    return unwrap(await apiClient.post(`/tracking/consent/${tripId}`));
  },

  async revokeConsent(tripId) {
    return unwrap(await apiClient.delete(`/tracking/consent/${tripId}`));
  },
};
