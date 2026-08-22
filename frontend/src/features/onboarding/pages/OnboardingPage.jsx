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
  ArrowLeft,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Textarea } from '../../../components/ui/Textarea';
import { Card, CardContent, CardFooter } from '../../../components/ui/Card';
import { completeOnboarding } from '../../auth/store/authSlice';

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
      gender: 'Female',
      age: '24',
      nationality: 'Indian',
      language: 'Hindi',
      emergencyName: 'Ramesh Maurya',
      emergencyRelation: 'Father',
      emergencyPhone: '9876500000',
      bloodGroup: 'O+',
      medicalNotes: 'No chronic illness or known drug allergies.',
      idNumber: 'AADHAAR-XXXX-8924',
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
      dispatch(
        completeOnboarding({
          gender: data.gender,
          age: data.age,
          nationality: data.nationality,
          emergencyContact: {
            name: data.emergencyName,
            relation: data.emergencyRelation,
            phone: data.emergencyPhone,
          },
          medicalInfo: {
            bloodGroup: data.bloodGroup,
            notes: data.medicalNotes || 'None',
          },
          safetySettings: {
            liveTracking: data.liveTracking,
            geoAlerts: data.geoAlerts,
          },
        })
      );
      navigate('/tourist/dashboard');
    } catch (e) {
      console.error(e);
    }
  };

  const stepsInfo = [
    { title: 'Personal', desc: 'Identity & Language' },
    { title: 'Emergency', desc: 'Family Contacts' },
    { title: 'Medical', desc: 'Blood & Health' },
    { title: 'Consent', desc: 'Live Radar Permissions' },
  ];

  return (
    <div className="min-h-screen bg-[#060B16] text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 relative">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-xl relative z-10 space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#111c30] border border-sky-500/30 text-xs text-sky-400 font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>KAVACH SAFETY INITIALIZATION</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Safety Onboarding Wizard
          </h1>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Essential safety information for first responders during your journey in Prayagraj.
          </p>
        </div>

        {/* Step Indicator Progress Bar */}
        <div className="p-4 rounded-2xl bg-[#0d1526] border border-slate-800">
          <div className="grid grid-cols-4 gap-2 text-center">
            {stepsInfo.map((s, idx) => {
              const num = idx + 1;
              const isDone = step > num;
              const isCurrent = step === num;
              return (
                <div key={num} className="space-y-1">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      isDone
                        ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                        : isCurrent
                        ? 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]'
                        : 'bg-slate-800'
                    }`}
                  />
                  <p className={`text-[11px] font-bold ${isCurrent ? 'text-sky-400' : isDone ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {s.title}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Multi-Step Card */}
        <Card variant="elevated" className="border-slate-800 shadow-2xl">
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="p-6 sm:p-8 space-y-5">
              {/* STEP 1: Personal Profile */}
              {step === 1 && (
                <div className="space-y-4 text-left animate-in fade-in duration-300">
                  <div className="border-b border-slate-800 pb-3">
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <User className="w-5 h-5 text-sky-400" />
                      Step 1: Personal & Demographic Info
                    </h2>
                    <p className="text-xs text-slate-400">Basic details for tourist registry verification.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Select
                      label="Gender"
                      error={errors.gender?.message}
                      {...register('gender')}
                    >
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </Select>

                    <Input
                      label="Age"
                      type="number"
                      placeholder="24"
                      error={errors.age?.message}
                      {...register('age')}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Select
                      label="Nationality"
                      error={errors.nationality?.message}
                      {...register('nationality')}
                    >
                      <option value="Indian">Indian</option>
                      <option value="International - USA">United States</option>
                      <option value="International - UK">United Kingdom</option>
                      <option value="International - France">France</option>
                      <option value="International - Australia">Australia</option>
                      <option value="International - Other">Other</option>
                    </Select>

                    <Select
                      label="Preferred Language"
                      error={errors.language?.message}
                      {...register('language')}
                    >
                      <option value="Hindi">Hindi (हिंदी)</option>
                      <option value="English">English</option>
                      <option value="Bengali">Bengali (বাংলা)</option>
                      <option value="Tamil">Tamil (தமிழ்)</option>
                      <option value="Telugu">Telugu (తెలుగు)</option>
                      <option value="Marathi">Marathi (मराठी)</option>
                    </Select>
                  </div>
                </div>
              )}

              {/* STEP 2: Emergency Contacts */}
              {step === 2 && (
                <div className="space-y-4 text-left animate-in fade-in duration-300">
                  <div className="border-b border-slate-800 pb-3">
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <PhoneCall className="w-5 h-5 text-red-400" />
                      Step 2: Emergency Contact Information
                    </h2>
                    <p className="text-xs text-slate-400">Automatic SOS alerts and SMS updates will be routed here.</p>
                  </div>

                  <Input
                    label="Primary Emergency Contact Name"
                    placeholder="e.g. Ramesh Maurya"
                    error={errors.emergencyName?.message}
                    {...register('emergencyName')}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <Select
                      label="Relationship"
                      error={errors.emergencyRelation?.message}
                      {...register('emergencyRelation')}
                    >
                      <option value="Father">Father</option>
                      <option value="Mother">Mother</option>
                      <option value="Spouse">Spouse</option>
                      <option value="Sibling">Sibling</option>
                      <option value="Friend">Friend</option>
                      <option value="Guardian">Guardian</option>
                    </Select>

                    <Input
                      label="Emergency Phone Number"
                      type="tel"
                      placeholder="9876500000"
                      error={errors.emergencyPhone?.message}
                      {...register('emergencyPhone')}
                    />
                  </div>
                </div>
              )}

              {/* STEP 3: Medical & Travel Verification */}
              {step === 3 && (
                <div className="space-y-4 text-left animate-in fade-in duration-300">
                  <div className="border-b border-slate-800 pb-3">
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <HeartPulse className="w-5 h-5 text-emerald-400" />
                      Step 3: Medical Safety & Identity
                    </h2>
                    <p className="text-xs text-slate-400">Paramedic teams access this during urgent care at Sangam booths.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Select
                      label="Blood Group"
                      error={errors.bloodGroup?.message}
                      {...register('bloodGroup')}
                    >
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </Select>

                    <Input
                      label="ID / Passport Number (Masked)"
                      placeholder="e.g. AADHAAR / PASSPORT"
                      error={errors.idNumber?.message}
                      {...register('idNumber')}
                    />
                  </div>

                  <Textarea
                    label="Medical History / Allergies / Conditions"
                    placeholder="List any drug allergies, asthma, diabetic needs, or physical assistance requirements..."
                    rows={3}
                    error={errors.medicalNotes?.message}
                    {...register('medicalNotes')}
                  />
                </div>
              )}

              {/* STEP 4: Consent & Radar Activation */}
              {step === 4 && (
                <div className="space-y-4 text-left animate-in fade-in duration-300">
                  <div className="border-b border-slate-800 pb-3">
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-sky-400" />
                      Step 4: Safety & Privacy Settings
                    </h2>
                    <p className="text-xs text-slate-400">Configure how Kavach shields your travel in Prayagraj.</p>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="p-4 rounded-xl bg-[#080d18] border border-slate-800 flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="liveTracking"
                        {...register('liveTracking')}
                        className="mt-1 h-4 w-4 rounded bg-[#060b16] border-slate-700 text-sky-500 focus:ring-sky-500"
                      />
                      <label htmlFor="liveTracking" className="text-xs text-slate-300 cursor-pointer">
                        <span className="font-bold text-white block">Real-Time Geofence Location Sharing</span>
                        Allow the platform to alert you when entering crowded ghats, deep water barriers, or unverified zones.
                      </label>
                    </div>

                    <div className="p-4 rounded-xl bg-[#080d18] border border-slate-800 flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="geoAlerts"
                        {...register('geoAlerts')}
                        className="mt-1 h-4 w-4 rounded bg-[#060b16] border-slate-700 text-sky-500 focus:ring-sky-500"
                      />
                      <label htmlFor="geoAlerts" className="text-xs text-slate-300 cursor-pointer">
                        <span className="font-bold text-white block">Automatic Emergency SMS Fallbacks</span>
                        Transmit automated SMS alerts to emergency contacts if cellular data drops in remote Kumbh sectors.
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>

            <CardFooter className="p-6 sm:p-8 pt-0 flex justify-between border-t border-slate-800/80">
              {step > 1 ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={prevStep}
                  leftIcon={ArrowLeft}
                  className="text-slate-300"
                >
                  Previous
                </Button>
              ) : (
                <div />
              )}

              {step < 4 ? (
                <Button
                  type="button"
                  variant="primary"
                  onClick={nextStep}
                  rightIcon={ArrowRight}
                >
                  Continue to Step {step + 1}
                </Button>
              ) : (
                <Button
                  type="submit"
                  variant="success"
                  isLoading={isSubmitting}
                  rightIcon={CheckCircle2}
                >
                  Finish & Activate Safety Dashboard
                </Button>
              )}
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
