import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useReportHazard, useUploadEvidence } from '../../safety/api/safetyQueries';
import { useGeolocation } from '../../tracking/hooks/useGeolocation';

export function ReportIncidentPage() {
  const navigate = useNavigate();
  const reportMutation = useReportHazard();
  const uploadMutation = useUploadEvidence();
  const [error, setError] = useState('');
  
  // We can track location to attach to the hazard
  const { location } = useGeolocation(null, false); 
  // Normally we would just pull from active trip, but we'll ask navigator.geolocation directly if we have to.

  const { register, handleSubmit, watch, formState: { isSubmitting } } = useForm({
    defaultValues: {
      type: 'GENERAL',
      description: '',
      severity: 'MEDIUM'
    }
  });
  const files = watch('evidenceFile');

  const onSubmit = async (data) => {
    setError('');
    try {
      // 1. Report the hazard
      const hazardPayload = {
        type: data.type,
        description: data.description,
        severity: data.severity,
        lat: location?.lat || 25.4358, // Fallback for Prayagraj if GPS is not ready
        lng: location?.lng || 81.8463,
      };

      const hazard = await reportMutation.mutateAsync(hazardPayload);
      
      // 2. Upload Evidence if a file was selected
      if (files && files.length > 0) {
        const file = files[0];
        await uploadMutation.mutateAsync({
          file,
          targetId: hazard.id,
          targetType: 'HAZARD'
        });
      }

      alert('Incident reported successfully. Authorities have been notified.');
      navigate('/tourist/dashboard');
      
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit report. Please try again.');
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Report an Incident / Hazard</h1>
      
      {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">{error}</div>}

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Incident Type</label>
            <select {...register("type")} className="w-full border p-2 rounded bg-white" required>
              <option value="GENERAL">General Safety Concern</option>
              <option value="MEDICAL">Medical Emergency</option>
              <option value="FIRE">Fire</option>
              <option value="CRIME">Suspicious / Criminal Activity</option>
              <option value="LOST_PERSON">Lost Person</option>
              <option value="INFRASTRUCTURE">Infrastructure Damage (e.g. Broken Bridge)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
            <select {...register("severity")} className="w-full border p-2 rounded bg-white" required>
              <option value="LOW">Low - Needs Attention</option>
              <option value="MEDIUM">Medium - Potential Risk</option>
              <option value="HIGH">High - Immediate Risk</option>
              <option value="CRITICAL">Critical - Life Threatening</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea 
              {...register("description")} 
              required
              rows={4}
              placeholder="Please provide details about what happened..." 
              className="w-full border p-2 rounded resize-none" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Photo Evidence (Optional)</label>
            <input 
              type="file" 
              accept="image/*"
              {...register("evidenceFile")} 
              className="w-full border p-2 rounded bg-gray-50" 
            />
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting || reportMutation.isPending || uploadMutation.isPending}
            className="w-full bg-red-600 text-white p-3 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
          >
            {isSubmitting || reportMutation.isPending || uploadMutation.isPending ? "Submitting Report..." : "Submit Incident Report"}
          </button>
        </form>
      </div>
    </div>
  );
}
