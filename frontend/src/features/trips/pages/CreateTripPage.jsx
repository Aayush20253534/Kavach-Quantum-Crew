import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useCreateTrip } from '../api/tripQueries';

export function CreateTripPage() {
  const navigate = useNavigate();
  const createTripMutation = useCreateTrip();
  const [error, setError] = useState('');

  const { register, handleSubmit, watch, formState: { isSubmitting } } = useForm({
    defaultValues: {
      type: 'SOLO',
      name: '',
      destination: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: ''
    }
  });

  const tripType = watch('type');

  const onSubmit = async (data) => {
    setError('');
    try {
      const trip = await createTripMutation.mutateAsync({
        type: data.type,
        name: data.name,
        destination: data.destination,
        startDate: data.startDate,
        endDate: data.endDate
      });

      // If it's a group trip, we might want to redirect to /tourist/groups/create?tripId=...
      if (data.type === 'GROUP') {
        navigate(`/tourist/groups/create?tripId=${trip.id}`);
      } else {
        navigate('/tourist/trips/current');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create trip.');
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Plan a New Trip</h1>
      
      {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">{error}</div>}

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Trip Name</label>
            <input 
              {...register("name")} 
              required
              placeholder="e.g. Kumbh Mela 2025" 
              className="w-full border p-2 rounded" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
            <input 
              {...register("destination")} 
              required
              placeholder="e.g. Prayagraj Sangam" 
              className="w-full border p-2 rounded" 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input 
                {...register("startDate")} 
                required
                type="date"
                className="w-full border p-2 rounded" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input 
                {...register("endDate")} 
                required
                type="date"
                className="w-full border p-2 rounded" 
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Trip Type</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer p-3 border rounded hover:bg-gray-50 flex-1">
                <input type="radio" value="SOLO" {...register("type")} className="w-4 h-4 text-blue-600" />
                <span>Solo Trip</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer p-3 border rounded hover:bg-gray-50 flex-1">
                <input type="radio" value="GROUP" {...register("type")} className="w-4 h-4 text-blue-600" />
                <span>Group Trip</span>
              </label>
            </div>
            {tripType === 'GROUP' && (
              <p className="text-sm text-gray-500 mt-2">
                You will be able to generate a QR code to invite friends after creating the trip.
              </p>
            )}
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting || createTripMutation.isPending}
            className="w-full bg-blue-600 text-white p-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting || createTripMutation.isPending ? "Creating..." : "Create Trip"}
          </button>
        </form>
      </div>
    </div>
  );
}
