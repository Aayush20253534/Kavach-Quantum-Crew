import React from 'react';
import { useTripHistory } from '../api/tripQueries';

export function TripHistoryPage() {
  const { data, isLoading, error } = useTripHistory();

  if (isLoading) return <div className="p-8 text-center">Loading history...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Failed to load history</div>;

  const trips = data?.items || data || [];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Trip History</h1>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {trips.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No completed or cancelled trips found.</p>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4 font-medium text-gray-500">Name</th>
                <th className="p-4 font-medium text-gray-500">Destination</th>
                <th className="p-4 font-medium text-gray-500">Date</th>
                <th className="p-4 font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {trips.map(trip => (
                <tr key={trip.id} className="hover:bg-gray-50">
                  <td className="p-4 font-medium">{trip.name}</td>
                  <td className="p-4 text-gray-600">{trip.destination}</td>
                  <td className="p-4 text-gray-600">{new Date(trip.startDate).toLocaleDateString()}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      trip.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {trip.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
