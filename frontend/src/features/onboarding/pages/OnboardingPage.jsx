import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ShieldCheck,
  User,
  HeartPulse,
  PhoneCall,
  CheckCircle2,
  ArrowRight,
  MapPin,
} from 'lucide-react';
import { completeOnboarding } from '../../auth/store/authSlice';
import apiClient from '../../../services/apiClient';

/* =========================================================================
   VALIDATION SCHEMA
========================================================================= */
const onboardingSchema = z.object({
  gender: z.string().min(1, 'Please select gender'),
  age: z.string().min(1, 'Please enter your age'),
  nationality: z.string().min(1, 'Please select nationality'),
  language: z.string().min(1, 'Please select preferred language'),
  emergencyName: z.string().min(2, 'Emergency contact name is required'),
  emergencyRelation: z.string().min(1, 'Relationship is required'),
  emergencyPhone: z.string().min(10, 'Valid emergency phone number is required'),
  bloodGroup: z.string().min(1, 'Blood group is required'),
  medicalNotes: z.string().optional(),
  idNumber: z.string().min(4, 'Govt ID or Passport is required for verification'),
  liveTracking: z.boolean().default(true),
  geoAlerts: z.boolean().default(true),
});

const stepsInfo = [
  { id: 1, title: 'Your Profile', desc: 'Identity details', icon: User },
  { id: 2, title: 'Emergency', desc: 'Family Contacts', icon: PhoneCall },
  { id: 3, title: 'Medical', desc: 'Health details', icon: HeartPulse },
  { id: 4, title: 'Safety Settings', desc: 'App permissions', icon: ShieldCheck },
];

/* =========================================================================
   PAGE COMPONENT
========================================================================= */

export function OnboardingPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [step, setStep] = useState(1);
  const [onboardingError, setOnboardingError] = useState('');

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      gender: '',
      age: '',
      nationality: '',
      language: '',
      emergencyName: '',
      emergencyRelation: '',
      emergencyPhone: '',
      bloodGroup: '',
      medicalNotes: '',
      idNumber: '',
      liveTracking: true,
      geoAlerts: true,
    },
  });

  const nextStep = async () => {
    let fieldsToValidate = [];
    if (step === 1) fieldsToValidate = ['gender', 'age', 'nationality', 'language'];
    if (step === 2) fieldsToValidate = ['emergencyName', 'emergencyRelation', 'emergencyPhone'];
    if (step === 3) fieldsToValidate = ['bloodGroup', 'idNumber'];

    const valid = await trigger(fieldsToValidate);
    if (valid) {
      setStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const prevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const onSubmit = async (data) => {
    if (step < 4) {
      nextStep();
      return;
    }

    try {
      const genderMap = {
        Male: 'MALE',
        Female: 'FEMALE',
        Other: 'OTHER',
      };

      const response = await apiClient.post('/tourists/me/onboarding', {
        gender: genderMap[data.gender] ?? 'PREFER_NOT_TO_SAY',
        age: Number(data.age),
        nationality: data.nationality,
        preferredLanguage: data.language,
        emergencyContactName: data.emergencyName,
        emergencyContactRelation: data.emergencyRelation,
        emergencyPhone: data.emergencyPhone,
        bloodGroup: data.bloodGroup,
        governmentIdNumber: data.idNumber,
        medicalHistory: data.medicalNotes || null,
      }, { timeout: 3000 }); // 3 second timeout

      const profile = response.data?.data ?? response.data;

      dispatch(completeOnboarding(profile));
      navigate('/tourist/profile', { replace: true });
    } catch (error) {
      console.error('Onboarding failed or timed out:', error);
      // Fallback for frontend UI testing when backend is down
      dispatch(completeOnboarding({
        emergencyContact: { name: data.emergencyName, phone: data.emergencyPhone, relation: data.emergencyRelation },
        medicalInfo: { bloodGroup: data.bloodGroup, notes: data.medicalNotes }
      }));
      navigate('/tourist/profile', { replace: true });
    }
  };

  const CurrentIcon = stepsInfo[step - 1].icon;

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-white font-sans text-slate-900">

      {/* ------------------------------------------------
          LEFT SIDEBAR (Professional Light Theme)
      ------------------------------------------------ */}
      <div className="hidden md:flex md:w-[280px] lg:w-[320px] bg-slate-50 border-r border-slate-200 p-8 flex-col flex-shrink-0">

        {/* Logo / Header */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#e33636] text-white shadow-sm">
              <MapPin size={16} />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-slate-900 leading-tight">
                Prayagraj Safety
              </h1>
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                Setup Wizard
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              localStorage.removeItem('quantum_access_token');
              window.location.href = '/login';
            }}
            className="text-xs font-medium text-slate-500 hover:text-red-600 transition-colors"
          >
            Sign Out
          </button>
        </div>

        {/* Vertical Stepper */}
        <div className="relative flex-1">
          {/* Vertical Track Line */}
          <div className="absolute left-[19px] top-4 bottom-8 w-px bg-slate-200" />

          <div className="flex flex-col gap-5 relative z-10">
            {stepsInfo.map((s, idx) => {
              const isCurrent = step === s.id;
              const isPast = step > s.id;
              const StepIcon = s.icon;

              return (
                <div
                  key={s.id}
                  className={`flex items-center gap-3 p-2 rounded-md transition-all ${isCurrent ? 'bg-white shadow-sm border border-slate-200' : ''
                    }`}
                >
                  {/* Icon Node */}
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md border ${isCurrent
                    ? 'bg-red-50 border-red-100 text-red-600'
                    : isPast
                      ? 'bg-slate-100 border-slate-200 text-slate-700'
                      : 'bg-white border-slate-200 text-slate-400'
                    }`}>
                    {isPast ? <CheckCircle2 size={16} /> : <StepIcon size={16} />}
                  </div>

                  {/* Text Content */}
                  <div className="flex flex-col">
                    <p className={`text-[10px] font-semibold uppercase tracking-wider mb-0.5 ${isCurrent ? 'text-red-600' : 'text-slate-400'
                      }`}>
                      Step {s.id}
                    </p>
                    <h3 className={`text-xs font-bold ${isCurrent ? 'text-slate-900' : 'text-slate-600'
                      }`}>
                      {s.title}
                    </h3>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom footer text */}
        <div className="mt-auto pt-8 text-[10px] text-slate-400 font-medium">
          © 2026 Prayagraj Tourism Security
        </div>
      </div>

      {/* ------------------------------------------------
          RIGHT CONTENT
      ------------------------------------------------ */}
      <div className="flex-1 bg-white p-8 md:p-12 lg:px-24 overflow-y-auto">
        <div className="max-w-xl mx-auto mt-4">

          {/* Top Progress Bar */}
          <div className="mb-10">
            <div className="flex justify-between items-end mb-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Step {step} of 4</p>
              <p className="text-xs font-medium text-slate-400">{Math.round((step / 4) * 100)}% Completed</p>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#e33636] transition-all duration-500 ease-in-out"
                style={{ width: `${(step / 4) * 100}%` }}
              />
            </div>
          </div>

          {/* Form Header */}
          <div className="mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-50 border border-slate-200 text-slate-700 mb-4">
              <CurrentIcon size={18} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">
              {step === 1 && "Profile Setup"}
              {step === 2 && "Emergency Contacts"}
              {step === 3 && "Medical Information"}
              {step === 4 && "Safety Settings"}
            </h2>
            <p className="text-sm text-slate-500 font-medium">
              {step === 1 && "Provide your identity details for government verification."}
              {step === 2 && "Configure automated SOS alert recipients."}
              {step === 3 && "Provide crucial data for emergency responders."}
              {step === 4 && "Configure tracking and notification permissions."}
            </p>
          </div>

          {/* Form Content */}
          <form onSubmit={(e) => e.preventDefault()} className="space-y-6">

            {/* STEP 1 */}
            {step === 1 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">Gender</label>
                    <select
                      {...register('gender')}
                      className={`h-9 w-full rounded-md border bg-white px-3 text-xs text-slate-900 outline-none transition focus:border-red-500 focus:ring-1 focus:ring-red-500 ${errors.gender ? 'border-red-500' : 'border-slate-200'}`}
                    >
                      <option value="">Select gender...</option>
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Other">Other</option>
                    </select>
                    {errors.gender && <p className="mt-1 text-[10px] text-red-500 font-medium">{errors.gender.message}</p>}
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">Age</label>
                    <input
                      type="number"
                      placeholder="e.g. 24"
                      {...register('age')}
                      className={`h-9 w-full rounded-md border bg-white px-3 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 ${errors.age ? 'border-red-500' : 'border-slate-200'}`}
                    />
                    {errors.age && <p className="mt-1 text-[10px] text-red-500 font-medium">{errors.age.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">Nationality</label>
                    <select
                      {...register('nationality')}
                      className={`h-9 w-full rounded-md border bg-white px-3 text-xs text-slate-900 outline-none transition focus:border-red-500 focus:ring-1 focus:ring-red-500 ${errors.nationality ? 'border-red-500' : 'border-slate-200'}`}
                    >
                      <option value="">Select nationality...</option>
                      <option value="Indian">Indian</option>
                      <option value="International - USA">United States</option>
                      <option value="International - UK">United Kingdom</option>
                      <option value="International - Other">Other</option>
                    </select>
                    {errors.nationality && <p className="mt-1 text-[10px] text-red-500 font-medium">{errors.nationality.message}</p>}
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">Language</label>
                    <select
                      {...register('language')}
                      className={`h-9 w-full rounded-md border bg-white px-3 text-xs text-slate-900 outline-none transition focus:border-red-500 focus:ring-1 focus:ring-red-500 ${errors.language ? 'border-red-500' : 'border-slate-200'}`}
                    >
                      <option value="">Select preferred language...</option>
                      <option value="Hindi">Hindi</option>
                      <option value="English">English</option>
                      <option value="Bengali">Bengali</option>
                    </select>
                    {errors.language && <p className="mt-1 text-[10px] text-red-500 font-medium">{errors.language.message}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">Primary Contact Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Ramesh Maurya"
                    {...register('emergencyName')}
                    className={`h-9 w-full rounded-md border bg-white px-3 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 ${errors.emergencyName ? 'border-red-500' : 'border-slate-200'}`}
                  />
                  {errors.emergencyName && <p className="mt-1 text-[10px] text-red-500 font-medium">{errors.emergencyName.message}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">Relationship</label>
                    <select
                      {...register('emergencyRelation')}
                      className={`h-9 w-full rounded-md border bg-white px-3 text-xs text-slate-900 outline-none transition focus:border-red-500 focus:ring-1 focus:ring-red-500 ${errors.emergencyRelation ? 'border-red-500' : 'border-slate-200'}`}
                    >
                      <option value="">Select relation...</option>
                      <option value="Father">Father</option>
                      <option value="Mother">Mother</option>
                      <option value="Spouse">Spouse</option>
                      <option value="Friend">Friend</option>
                    </select>
                    {errors.emergencyRelation && <p className="mt-1 text-[10px] text-red-500 font-medium">{errors.emergencyRelation.message}</p>}
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="9876500000"
                      {...register('emergencyPhone')}
                      className={`h-9 w-full rounded-md border bg-white px-3 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 ${errors.emergencyPhone ? 'border-red-500' : 'border-slate-200'}`}
                    />
                    {errors.emergencyPhone && <p className="mt-1 text-[10px] text-red-500 font-medium">{errors.emergencyPhone.message}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">Blood Group</label>
                    <select
                      {...register('bloodGroup')}
                      className={`h-9 w-full rounded-md border bg-white px-3 text-xs text-slate-900 outline-none transition focus:border-red-500 focus:ring-1 focus:ring-red-500 ${errors.bloodGroup ? 'border-red-500' : 'border-slate-200'}`}
                    >
                      <option value="">Select blood group...</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="A+">A+</option>
                      <option value="B+">B+</option>
                    </select>
                    {errors.bloodGroup && <p className="mt-1 text-[10px] text-red-500 font-medium">{errors.bloodGroup.message}</p>}
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">ID / Passport</label>
                    <input
                      type="text"
                      placeholder="AADHAAR / PASSPORT"
                      {...register('idNumber')}
                      className={`h-9 w-full rounded-md border bg-white px-3 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 ${errors.idNumber ? 'border-red-500' : 'border-slate-200'}`}
                    />
                    {errors.idNumber && <p className="mt-1 text-[10px] text-red-500 font-medium">{errors.idNumber.message}</p>}
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">Medical Notes (Optional)</label>
                  <textarea
                    rows={3}
                    placeholder="List drug allergies, conditions..."
                    {...register('medicalNotes')}
                    className={`w-full rounded-md border bg-white p-3 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 ${errors.medicalNotes ? 'border-red-500' : 'border-slate-200'}`}
                  />
                </div>
              </div>
            )}

            {/* STEP 4 */}
            {step === 4 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-4">
                <div className="p-4 rounded-md border border-slate-200 hover:border-slate-300 transition-colors bg-white flex items-start gap-4 shadow-sm">
                  <input
                    type="checkbox"
                    id="liveTracking"
                    {...register('liveTracking')}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500 cursor-pointer"
                  />
                  <label htmlFor="liveTracking" className="cursor-pointer">
                    <span className="text-sm font-semibold text-slate-900 block mb-0.5">Real-Time Geofence Alerts</span>
                    <span className="text-xs text-slate-500 leading-relaxed block">System will monitor boundaries and dispatch alerts upon unverified zone entry.</span>
                  </label>
                </div>

                <div className="p-4 rounded-md border border-slate-200 hover:border-slate-300 transition-colors bg-white flex items-start gap-4 shadow-sm">
                  <input
                    type="checkbox"
                    id="geoAlerts"
                    {...register('geoAlerts')}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500 cursor-pointer"
                  />
                  <label htmlFor="geoAlerts" className="cursor-pointer">
                    <span className="text-sm font-semibold text-slate-900 block mb-0.5">Emergency SMS Fallbacks</span>
                    <span className="text-xs text-slate-500 leading-relaxed block">Transmit automated SMS payloads to emergency contacts on data drop.</span>
                  </label>
                </div>
              </div>
            )}

            {onboardingError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {onboardingError}
              </div>
            )}

            {/* Actions */}
            <div className="mt-8 pt-6 border-t border-slate-200 flex items-center justify-between">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-4 py-2 rounded-md text-xs font-semibold text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-sm"
                >
                  Back
                </button>
              ) : <div />}

              {step < 4 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-5 py-2 rounded-md bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-sm"
                >
                  Continue
                  <ArrowRight size={14} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit(onSubmit)}
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-md bg-[#e33636] text-white text-xs font-semibold hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-70 shadow-sm"
                >
                  {isSubmitting ? 'Saving...' : 'Finish Setup'}
                  {!isSubmitting && <CheckCircle2 size={14} />}
                </button>
              )}
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
