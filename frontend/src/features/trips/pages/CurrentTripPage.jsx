import React from 'react';
import { useCurrentTrip, useStartTrip, useCompleteTrip, useCancelTrip } from '../api/tripQueries';
import { Link } from 'react-router-dom';

export function CurrentTripPage() {
  const { data: trip, isLoading, error } = useCurrentTrip();
  const startTripMutation = useStartTrip();
  const completeTripMutation = useCompleteTrip();
  const cancelTripMutation = useCancelTrip();

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading current trip...</div>;
  }

  // If there's no trip (e.g., 404 from backend when no trip is active/planned)
  if (error && error.response?.status === 404) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-4">Active Trip</h1>
        <div className="bg-white p-12 rounded-lg shadow-sm border border-gray-200 text-center">
          <h2 className="text-xl font-semibold mb-2">No Active or Planned Trips</h2>
          <p className="text-gray-600 mb-6">You don't have any upcoming trips planned yet.</p>
          <Link to="/tourist/trips/create" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
            Plan a New Trip
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">Failed to load trip: {error.message}</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Your Trip: {trip?.name}</h1>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-6">
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="block text-sm text-gray-500">Destination</span>
            <span className="font-semibold text-lg">{trip?.destination}</span>
          </div>
          <div>
            <span className="block text-sm text-gray-500">Status</span>
            <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold mt-1">
              {trip?.status}
            </span>
          </div>
          <div>
            <span className="block text-sm text-gray-500">Start Date</span>
            <span className="font-medium">{new Date(trip?.startDate).toLocaleDateString()}</span>
          </div>
          <div>
            <span className="block text-sm text-gray-500">Type</span>
            <span className="font-medium">{trip?.type}</span>
          </div>
        </div>

        <div className="pt-6 border-t flex gap-4">
          {trip?.status === 'PLANNED' && (
            <button 
              onClick={() => startTripMutation.mutate(trip.id)}
              disabled={startTripMutation.isPending}
              className="bg-green-600 text-white px-6 py-2 rounded font-medium hover:bg-green-700 disabled:opacity-50"
            >
              Start Trip Now
            </button>
          )}

          {trip?.status === 'ACTIVE' && (
            <button 
              onClick={() => completeTripMutation.mutate(trip.id)}
              disabled={completeTripMutation.isPending}
              className="bg-blue-600 text-white px-6 py-2 rounded font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              Mark as Completed
            </button>
          )}

          {(trip?.status === 'PLANNED' || trip?.status === 'ACTIVE') && (
            <button 
              onClick={() => {
                if(window.confirm('Are you sure you want to cancel this trip?')) {
                  cancelTripMutation.mutate(trip.id);
                }
              }}
              disabled={cancelTripMutation.isPending}
              className="bg-red-50 text-red-600 border border-red-200 px-6 py-2 rounded font-medium hover:bg-red-100 disabled:opacity-50"
            >
              Cancel Trip
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
