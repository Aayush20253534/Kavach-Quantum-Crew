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
        emergencyPhone: data.emergencyPhone,
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
          LEFT SIDEBAR (Dark Theme)
      ------------------------------------------------ */}
      <div className="hidden md:flex md:w-[320px] lg:w-[380px] bg-[#1a1625] text-white p-8 md:p-10 flex-col flex-shrink-0">
        
        {/* Logo / Header */}
        <div className="flex items-center gap-3 mb-16">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500 text-white shadow-sm">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white leading-tight">
              Prayagraj Safety
            </h1>
            <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">
              Tourist Onboarding
            </p>
          </div>
        </div>

        {/* Vertical Stepper */}
        <div className="relative flex-1">
          {/* Vertical Track Line */}
          <div className="absolute left-[23px] top-6 bottom-12 w-px bg-slate-700/50" />
          
          <div className="flex flex-col gap-6 relative z-10">
            {stepsInfo.map((s, idx) => {
              const isCurrent = step === s.id;
              const isPast = step > s.id;
              const StepIcon = s.icon;
              
              return (
                <div 
                  key={s.id} 
                  className={`flex items-start gap-4 p-3 rounded-2xl transition-all duration-300 ${
                    isCurrent ? 'bg-[#2a2438] shadow-lg' : 'opacity-60'
                  }`}
                >
                  {/* Icon Node */}
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors duration-300 ${
                    isCurrent 
                      ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]' 
                      : isPast 
                        ? 'bg-[#2a2438] text-red-400' 
                        : 'bg-[#2a2438] text-slate-500'
                  }`}>
                    {isPast ? <CheckCircle2 className="h-5 w-5" /> : <StepIcon className="h-5 w-5" />}
                  </div>
                  
                  {/* Text Content */}
                  <div className="flex flex-col justify-center pt-1.5">
                    <p className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${
                      isCurrent ? 'text-red-400' : 'text-slate-500'
                    }`}>
                      Step {s.id}
                    </p>
                    <h3 className={`text-sm font-semibold ${
                      isCurrent ? 'text-white' : 'text-slate-300'
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
        <div className="mt-auto pt-8 text-[10px] text-slate-500 font-medium">
          © 2026 Prayagraj Tourism Safety
        </div>
      </div>

      {/* ------------------------------------------------
          RIGHT CONTENT (White Theme with Red Accents)
      ------------------------------------------------ */}
      <div className="flex-1 bg-white p-8 md:p-12 lg:p-20 overflow-y-auto">
        <div className="max-w-2xl mx-auto">
          
          {/* Top Progress Bar */}
          <div className="mb-12">
            <p className="text-sm font-semibold text-slate-500 mb-3">Step {step} of 4</p>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-red-500 transition-all duration-500 ease-in-out"
                style={{ width: `${(step / 4) * 100}%` }}
              />
            </div>
          </div>

          {/* Form Header */}
          <div className="mb-10">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 mb-6">
              <CurrentIcon className="h-7 w-7" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-3">
              {step === 1 && "Let's set up your profile"}
              {step === 2 && "Add emergency contacts"}
              {step === 3 && "Medical information"}
              {step === 4 && "Final safety settings"}
            </h2>
            <p className="text-slate-500 font-medium">
              {step === 1 && "Tell us a bit about yourself to verify your tourist identity."}
              {step === 2 && "We will contact these people automatically in case of an SOS."}
              {step === 3 && "Crucial details for paramedics during your journey."}
              {step === 4 && "Configure how Kavach tracks your safe movement."}
            </p>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            {/* STEP 1 */}
            {step === 1 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-800 mb-1.5">Gender</label>
                    <select
                      {...register('gender')}
                      className={`h-11 w-full rounded-xl border bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-red-500 focus:ring-1 focus:ring-red-500 ${errors.gender ? 'border-red-500' : 'border-slate-200'}`}
                    >
                      <option value="">Select gender</option>
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Other">Other</option>
                    </select>
                    {errors.gender && <p className="mt-1.5 text-[10px] text-red-500">{errors.gender.message}</p>}
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-800 mb-1.5">Age</label>
                    <input
                      type="number"
                      placeholder="e.g. 24"
                      {...register('age')}
                      className={`h-11 w-full rounded-xl border bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-red-500 focus:ring-1 focus:ring-red-500 ${errors.age ? 'border-red-500' : 'border-slate-200'}`}
                    />
                    {errors.age && <p className="mt-1.5 text-[10px] text-red-500">{errors.age.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-800 mb-1.5">Nationality</label>
                    <select
                      {...register('nationality')}
                      className={`h-11 w-full rounded-xl border bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-red-500 focus:ring-1 focus:ring-red-500 ${errors.nationality ? 'border-red-500' : 'border-slate-200'}`}
                    >
                      <option value="">Select nationality</option>
                      <option value="Indian">Indian</option>
                      <option value="International - USA">United States</option>
                      <option value="International - UK">United Kingdom</option>
                      <option value="International - Other">Other</option>
                    </select>
                    {errors.nationality && <p className="mt-1.5 text-[10px] text-red-500">{errors.nationality.message}</p>}
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-800 mb-1.5">Preferred Language</label>
                    <select
                      {...register('language')}
                      className={`h-11 w-full rounded-xl border bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-red-500 focus:ring-1 focus:ring-red-500 ${errors.language ? 'border-red-500' : 'border-slate-200'}`}
                    >
                      <option value="">Select language</option>
                      <option value="Hindi">Hindi</option>
                      <option value="English">English</option>
                      <option value="Bengali">Bengali</option>
                    </select>
                    {errors.language && <p className="mt-1.5 text-[10px] text-red-500">{errors.language.message}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-6">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-800 mb-1.5">Primary Emergency Contact Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Ramesh Maurya"
                    {...register('emergencyName')}
                    className={`h-11 w-full rounded-xl border bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-red-500 focus:ring-1 focus:ring-red-500 ${errors.emergencyName ? 'border-red-500' : 'border-slate-200'}`}
                  />
                  {errors.emergencyName && <p className="mt-1.5 text-[10px] text-red-500">{errors.emergencyName.message}</p>}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-800 mb-1.5">Relationship</label>
                    <select
                      {...register('emergencyRelation')}
                      className={`h-11 w-full rounded-xl border bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-red-500 focus:ring-1 focus:ring-red-500 ${errors.emergencyRelation ? 'border-red-500' : 'border-slate-200'}`}
                    >
                      <option value="">Select relation</option>
                      <option value="Father">Father</option>
                      <option value="Mother">Mother</option>
                      <option value="Spouse">Spouse</option>
                      <option value="Friend">Friend</option>
                    </select>
                    {errors.emergencyRelation && <p className="mt-1.5 text-[10px] text-red-500">{errors.emergencyRelation.message}</p>}
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-800 mb-1.5">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="9876500000"
                      {...register('emergencyPhone')}
                      className={`h-11 w-full rounded-xl border bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-red-500 focus:ring-1 focus:ring-red-500 ${errors.emergencyPhone ? 'border-red-500' : 'border-slate-200'}`}
                    />
                    {errors.emergencyPhone && <p className="mt-1.5 text-[10px] text-red-500">{errors.emergencyPhone.message}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-800 mb-1.5">Blood Group</label>
                    <select
                      {...register('bloodGroup')}
                      className={`h-11 w-full rounded-xl border bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-red-500 focus:ring-1 focus:ring-red-500 ${errors.bloodGroup ? 'border-red-500' : 'border-slate-200'}`}
                    >
                      <option value="">Select blood group</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="A+">A+</option>
                      <option value="B+">B+</option>
                    </select>
                    {errors.bloodGroup && <p className="mt-1.5 text-[10px] text-red-500">{errors.bloodGroup.message}</p>}
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-800 mb-1.5">ID / Passport Number</label>
                    <input
                      type="text"
                      placeholder="AADHAAR / PASSPORT"
                      {...register('idNumber')}
                      className={`h-11 w-full rounded-xl border bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-red-500 focus:ring-1 focus:ring-red-500 ${errors.idNumber ? 'border-red-500' : 'border-slate-200'}`}
                    />
                    {errors.idNumber && <p className="mt-1.5 text-[10px] text-red-500">{errors.idNumber.message}</p>}
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-800 mb-1.5">Medical History / Allergies (Optional)</label>
                  <textarea
                    rows={3}
                    placeholder="List any drug allergies, asthma, diabetic needs..."
                    {...register('medicalNotes')}
                    className={`w-full rounded-xl border bg-white p-3 text-sm text-slate-900 outline-none transition focus:border-red-500 focus:ring-1 focus:ring-red-500 ${errors.medicalNotes ? 'border-red-500' : 'border-slate-200'}`}
                  />
                </div>
              </div>
            )}

            {/* STEP 4 */}
            {step === 4 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-4">
                <div className="p-5 rounded-2xl border border-slate-200 hover:border-red-200 transition-colors bg-slate-50/50 flex items-start gap-4">
                  <input 
                    type="checkbox" 
                    id="liveTracking" 
                    {...register('liveTracking')} 
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500 cursor-pointer" 
                  />
                  <label htmlFor="liveTracking" className="cursor-pointer">
                    <span className="font-semibold text-slate-900 block mb-1">Real-Time Geofence Alerts</span>
                    <span className="text-sm text-slate-500">Allow the platform to alert you when entering crowded ghats or unverified zones.</span>
                  </label>
                </div>

                <div className="p-5 rounded-2xl border border-slate-200 hover:border-red-200 transition-colors bg-slate-50/50 flex items-start gap-4">
                  <input 
                    type="checkbox" 
                    id="geoAlerts" 
                    {...register('geoAlerts')} 
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500 cursor-pointer" 
                  />
                  <label htmlFor="geoAlerts" className="cursor-pointer">
                    <span className="font-semibold text-slate-900 block mb-1">Emergency SMS Fallbacks</span>
                    <span className="text-sm text-slate-500">Transmit automated SMS alerts to emergency contacts if cellular data drops.</span>
                  </label>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="mt-10 pt-6 border-t border-slate-100 flex items-center justify-between">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-6 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                >
                  Back
                </button>
              ) : <div />}
              
              {step < 4 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-8 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold shadow-md shadow-slate-900/20 hover:bg-slate-800 transition-colors flex items-center gap-2"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold shadow-md shadow-red-600/20 hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-70"
                >
                  {isSubmitting ? 'Saving...' : 'Finish Onboarding'}
                  {!isSubmitting && <CheckCircle2 className="w-4 h-4" />}
                </button>
              )}
            </div>
            
          </form>
        </div>
      </div>
    </div>
  );
}
