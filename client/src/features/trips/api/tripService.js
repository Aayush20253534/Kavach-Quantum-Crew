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
    // MOCK RESPONSE: The backend endpoint POST /api/trip/plan does not exist yet.
    // Returning the mock payload specified in trip-planner-api-docs.md for frontend testing.
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          itinerary: {
            city: data.city,
            days: Array.from({ length: data.num_days }, (_, i) => ({
              day: i + 1,
              places: [
                {
                  name: `${data.city} Fort`,
                  start_time: "09:00",
                  end_time: "10:30",
                  url: "https://maps.google.com/?cid=123456",
                  thumbnail: "https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?auto=format&fit=crop&q=80&w=400"
                },
                {
                  name: `Central ${data.city} Market`,
                  start_time: "13:00",
                  end_time: "15:00",
                  url: null,
                  thumbnail: null
                }
              ]
            }))
          },
          hotels: {
            city: data.city,
            hotels: [
              {
                name: "Hotel Budget Inn",
                price: 1200.0,
                rating: 3.8,
                hotel_class: "3-star",
                thumbnail: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=400"
              },
              {
                name: "Hotel Mid Range",
                price: 3500.0,
                rating: 4.2,
                hotel_class: "4-star",
                thumbnail: "https://images.unsplash.com/photo-1551882547-ff40c0d5f502?auto=format&fit=crop&q=80&w=400"
              },
              {
                name: "Hotel Grand Palace",
                price: 5400.0,
                rating: 4.6,
                hotel_class: "5-star",
                thumbnail: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=400"
              }
            ]
          }
        });
      }, 2500); // simulate 2.5 seconds of AI generation time
    });
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
