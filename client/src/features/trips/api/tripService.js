import apiClient from '../../../services/apiClient';

const unwrap = (response) => {
  const payload = response?.data;
  if (payload && Object.prototype.hasOwnProperty.call(payload, 'data')) {
    return payload.data;
  }
  return payload;
};

export const tripService = {
  async planTripWithAI(data) {
    return unwrap(await apiClient.post('/trips/ai-plan', data));
  },
  async createTrip(data) {
    return unwrap(await apiClient.post('/trips', data));
  },
  async getCurrentTrip() {
    return unwrap(await apiClient.get('/trips/current'));
  },
  async getTripHistory(params = {}) {
    return unwrap(await apiClient.get('/trips/history', { params }));
  },
  async getTrip(tripId) {
    return unwrap(await apiClient.get(`/trips/${tripId}`));
  },
  async startTrip(tripId, location = {}) {
    return unwrap(await apiClient.post(`/trips/${tripId}/start`, location));
  },
  async extendTrip(tripId, plannedEndAt) {
    return unwrap(await apiClient.post(`/trips/${tripId}/extend`, { plannedEndAt }));
  },
  async completeTrip(tripId) {
    return unwrap(await apiClient.post(`/trips/${tripId}/complete`));
  },
  async cancelTrip(tripId) {
    return unwrap(await apiClient.post(`/trips/${tripId}/cancel`));
  },
  async issueSafetyId(tripId) {
    return unwrap(await apiClient.post(`/trips/${tripId}/safety-id`));
  },
  async grantConsent(tripId, type) {
    return unwrap(await apiClient.post(`/trips/${tripId}/consents`, { type }));
  },
  async scheduleCheckIn(tripId, dueAt) {
    return unwrap(await apiClient.post(`/safety/trips/${tripId}/check-ins`, { dueAt }));
  },
  async getCheckIns(tripId) {
    return unwrap(await apiClient.get(`/safety/trips/${tripId}/check-ins`));
  },
  async completeCheckIn(checkInId) {
    return unwrap(await apiClient.post(`/safety/check-ins/${checkInId}/complete`));
  },
};
