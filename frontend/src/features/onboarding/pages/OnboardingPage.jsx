import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { profileService } from '../../profile/api/profileService';
import { setAuth } from '../../auth/store/authSlice';

export function OnboardingPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [error, setError] = useState('');

  const { register, control, handleSubmit, formState: { isSubmitting } } = useForm({
    defaultValues: {
      bloodType: '',
      medicalConditions: '',
      emergencyContacts: [{ name: '', phone: '', relationship: '' }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "emergencyContacts"
  });

  const onSubmit = async (data) => {
    setError('');
    try {
      // Format the data if necessary
      const payload = {
        medical: {
          bloodType: data.bloodType,
          conditions: data.medicalConditions ? data.medicalConditions.split(',').map(s => s.trim()) : []
        },
        emergencyContacts: data.emergencyContacts.filter(c => c.name && c.phone)
      };

      await profileService.submitOnboarding(payload);
      
      // Update local Redux state so the OnboardingRoute guard passes
      dispatch(setAuth({
        user: { ...user, onboardingComplete: true }
      }));
      
      navigate('/tourist/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete onboarding. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-lg">
        <h1 className="text-2xl font-bold mb-2">Complete Your Safety Profile</h1>
        <p className="text-gray-600 mb-6 text-sm">We need a few details to ensure your safety during trips.</p>
        
        {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">{error}</div>}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Medical Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Medical Information (Optional)</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Blood Type</label>
              <select {...register("bloodType")} className="w-full border p-2 rounded bg-white">
                <option value="">Select Type...</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Medical Conditions</label>
              <input 
                {...register("medicalConditions")} 
                placeholder="e.g. Asthma, Peanut Allergy (comma separated)" 
                className="w-full border p-2 rounded" 
              />
            </div>
          </div>

          {/* Emergency Contacts */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Emergency Contacts</h3>
            
            {fields.map((item, index) => (
              <div key={item.id} className="p-4 border rounded bg-gray-50 space-y-3 relative">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-500">Contact {index + 1}</span>
                  {index > 0 && (
                    <button type="button" onClick={() => remove(index)} className="text-red-500 text-sm hover:underline">
                      Remove
                    </button>
                  )}
                </div>
                
                <input 
                  {...register(`emergencyContacts.${index}.name`)} 
                  placeholder="Full Name" 
                  className="w-full border p-2 rounded" 
                  required={index === 0}
                />
                <input 
                  {...register(`emergencyContacts.${index}.phone`)} 
                  placeholder="Phone Number" 
                  className="w-full border p-2 rounded" 
                  required={index === 0}
                />
                <input 
                  {...register(`emergencyContacts.${index}.relationship`)} 
                  placeholder="Relationship (e.g. Parent, Friend)" 
                  className="w-full border p-2 rounded" 
                  required={index === 0}
                />
              </div>
            ))}
            
            <button 
              type="button" 
              onClick={() => append({ name: '', phone: '', relationship: '' })}
              className="text-blue-600 text-sm font-medium hover:underline"
            >
              + Add another contact
            </button>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white p-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 mt-4"
          >
            {isSubmitting ? "Saving Profile..." : "Complete Setup"}
          </button>
        </form>
      </div>
    </div>
  );
}
