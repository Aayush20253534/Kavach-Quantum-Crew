import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  ShieldCheck, 
  User, 
  HeartPulse, 
  PhoneCall, 
  Lock, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft,
<<<<<<< HEAD
  Sparkles,
  MapPin,
  FileText
=======
  MapPin
>>>>>>> f0a68452 (feat: implement authentication module with login page, onboarding structure, and reusable UI form components)
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Textarea } from '../../../components/ui/Textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../../components/ui/Card';
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

const CollageBackground = ({ step }) => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Base rotation from step, plus smooth rotation from scroll
  // We add 45 degrees so the initial state has diagonal X lines instead of vertical/horizontal +
  const rotation = 45 + (step - 1) * 90 + scrollY * 0.15; 

  return (
    <div className="hidden lg:block relative w-full h-full bg-slate-50 overflow-hidden select-none">
      
      {/* THE SPINNING WHEEL */}
      <div 
        className="absolute top-1/2 left-[10%] w-[160vh] h-[160vh] rounded-full overflow-hidden transition-transform duration-[1500ms] ease-out shadow-[0_0_50px_rgba(0,0,0,0.1)]"
        style={{ transform: `translate(-50%, -50%) rotate(${rotation}deg)` }}
      >
        {/* Quadrant 1 (Top Right) */}
        <div className="absolute top-0 right-0 w-[50%] h-[50%] border-l-[8px] border-b-[8px] border-white overflow-hidden bg-slate-200">
          <img 
            src="https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1200&q=80" 
            className="w-full h-full object-cover transition-transform duration-[1500ms] ease-out"
            style={{ transform: `scale(1.6) rotate(${-rotation}deg)` }}
            alt="Fort"
          />
          <div className="absolute inset-0 bg-black/10" />
        </div>

        {/* Quadrant 2 (Bottom Right) */}
        <div className="absolute bottom-0 right-0 w-[50%] h-[50%] border-l-[8px] border-t-[8px] border-white overflow-hidden bg-slate-300">
          <img 
            src="https://images.unsplash.com/photo-1595658658481-d53d3f999875?auto=format&fit=crop&w=1200&q=80" 
            className="w-full h-full object-cover transition-transform duration-[1500ms] ease-out"
            style={{ transform: `scale(1.6) rotate(${-rotation}deg)` }}
            alt="Garden"
          />
          <div className="absolute inset-0 bg-black/10" />
        </div>

        {/* Quadrant 3 (Bottom Left) */}
        <div className="absolute bottom-0 left-0 w-[50%] h-[50%] border-r-[8px] border-t-[8px] border-white overflow-hidden bg-slate-400">
          <img 
            src="https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1200&q=80" 
            className="w-full h-full object-cover transition-transform duration-[1500ms] ease-out"
            style={{ transform: `scale(1.6) rotate(${-rotation}deg)` }}
            alt="Memorial"
          />
          <div className="absolute inset-0 bg-black/10" />
        </div>

        {/* Quadrant 4 (Top Left) */}
        <div className="absolute top-0 left-0 w-[50%] h-[50%] border-r-[8px] border-b-[8px] border-white overflow-hidden bg-slate-500">
          <img 
            src="https://images.unsplash.com/photo-1582719478250-c89d14c77345?auto=format&fit=crop&w=1200&q=80" 
            className="w-full h-full object-cover transition-transform duration-[1500ms] ease-out"
            style={{ transform: `scale(1.6) rotate(${-rotation}deg)` }}
            alt="Stay"
          />
          <div className="absolute inset-0 bg-black/10" />
        </div>
      </div>

      {/* Left Image Overlay (The curved cover) */}
      <div 
        className="absolute top-0 left-0 h-full w-[54%] z-10 overflow-hidden border-r-[12px] border-white shadow-[15px_0_30px_-5px_rgba(0,0,0,0.15)]"
        style={{ borderTopRightRadius: '12% 50%', borderBottomRightRadius: '12% 50%' }}
      >
        <img src="https://images.unsplash.com/photo-1609766857041-ed402ea8069a?auto=format&fit=crop&w=1600&q=90" alt="Sangam" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
        
        <div className="absolute top-[40%] left-12 text-white max-w-sm drop-shadow-2xl">
          <h1 className="text-6xl font-black uppercase tracking-widest drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]">
            PRAYAGRAJ
          </h1>
          <h2 className="text-[1.3rem] font-bold mt-4 drop-shadow-md tracking-wide">
            Triveni Sangam & Heritage
          </h2>
          <p className="text-sm font-bold mt-1 text-sky-300 drop-shadow-md uppercase tracking-widest">
            Kavach Explorer 5★
          </p>
        </div>
      </div>

      {/* Bottom Logo Overlay */}
      <div className="absolute bottom-6 right-6 z-20 flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur-md rounded-full border border-white/50 text-slate-900 font-bold shadow-lg">
        <MapPin className="w-3.5 h-3.5 text-sky-600" />
        <span className="text-[10px] uppercase tracking-widest font-black">tourist.kavach.in</span>
      </div>
    </div>
  );
};

export function OnboardingPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
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
    { title: 'Personal', desc: 'Identity' },
    { title: 'Emergency', desc: 'Family Contacts' },
    { title: 'Medical', desc: 'Health' },
    { title: 'Consent', desc: 'Permissions' },
  ];

  return (
    <div className="min-h-screen w-full bg-slate-50 flex flex-col lg:flex-row overflow-x-hidden">
      {/* ------------------------------------------------
          LEFT HALF: CUSTOM CLIP-PATH COLLAGE
      ------------------------------------------------ */}
      <div className="hidden lg:block lg:w-[50%] xl:w-[55%] relative h-screen sticky top-0">
        <CollageBackground step={step} />
      </div>

      {/* ------------------------------------------------
          RIGHT HALF: ONBOARDING FORM (LIGHT THEME)
      ------------------------------------------------ */}
      <div className="flex-1 min-h-screen flex flex-col justify-center p-4 sm:p-8 lg:p-12 relative z-20 bg-slate-50 lg:border-l lg:border-slate-200">
        <div className="w-full max-w-xl mx-auto space-y-6">
          {/* Header Branding */}
          <div className="text-left space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 border border-sky-100 text-xs text-sky-600 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>KAVACH SAFETY INITIALIZATION</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Safety Onboarding Wizard
            </h1>
            <p className="text-sm text-slate-500 max-w-md">
              Essential safety information for first responders during your journey in Prayagraj.
            </p>
          </div>

          {/* Step Indicator Progress Bar */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <div className="grid grid-cols-4 gap-2 text-center">
              {stepsInfo.map((s, idx) => {
                const num = idx + 1;
                const isDone = step > num;
                const isCurrent = step === num;
                return (
                  <div key={num} className="space-y-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        isDone
                          ? 'bg-emerald-500 shadow-sm'
                          : isCurrent
                          ? 'bg-sky-500 shadow-sm'
                          : 'bg-slate-200'
                      }`}
                    />
                    <p className={`text-[11px] font-bold ${isCurrent ? 'text-sky-600' : isDone ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {s.title}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Multi-Step Card */}
          <Card variant="elevated" className="border-slate-200 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl overflow-hidden">
            <form onSubmit={handleSubmit(onSubmit)}>
              <CardContent className="p-6 sm:p-8 space-y-5">
                {/* STEP 1: Personal Profile */}
                {step === 1 && (
                  <div className="space-y-4 text-left animate-in fade-in duration-300">
                    <div className="border-b border-slate-100 pb-3">
                      <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <User className="w-5 h-5 text-sky-500" />
                        Step 1: Personal & Demographic Info
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">Basic details for tourist registry verification.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <Select
                        variant="light"
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
                        variant="light"
                        label="Age"
                        type="number"
                        placeholder="24"
                        error={errors.age?.message}
                        {...register('age')}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <Select
                        variant="light"
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
                        variant="light"
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
                    <div className="border-b border-slate-100 pb-3">
                      <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <PhoneCall className="w-5 h-5 text-red-500" />
                        Step 2: Emergency Contact Information
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">Automatic SOS alerts and SMS updates will be routed here.</p>
                    </div>

                    <Input
                      variant="light"
                      label="Primary Emergency Contact Name"
                      placeholder="e.g. Ramesh Maurya"
                      error={errors.emergencyName?.message}
                      {...register('emergencyName')}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <Select
                        variant="light"
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
                        variant="light"
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
                    <div className="border-b border-slate-100 pb-3">
                      <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <HeartPulse className="w-5 h-5 text-emerald-500" />
                        Step 3: Medical Safety & Identity
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">Paramedic teams access this during urgent care at Sangam booths.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <Select
                        variant="light"
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
                        variant="light"
                        label="ID / Passport Number (Masked)"
                        placeholder="e.g. AADHAAR / PASSPORT"
                        error={errors.idNumber?.message}
                        {...register('idNumber')}
                      />
                    </div>

                    <Textarea
                      variant="light"
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
                    <div className="border-b border-slate-100 pb-3">
                      <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-sky-500" />
                        Step 4: Safety & Privacy Settings
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">Configure how Kavach shields your travel in Prayagraj.</p>
                    </div>

                    <div className="space-y-3 pt-2">
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                        <input
                          type="checkbox"
                          id="liveTracking"
                          {...register('liveTracking')}
                          className="mt-1 h-4 w-4 rounded bg-white border-slate-300 text-sky-600 focus:ring-sky-600"
                        />
                        <label htmlFor="liveTracking" className="text-xs text-slate-600 cursor-pointer">
                          <span className="font-bold text-slate-900 block">Real-Time Geofence Location Sharing</span>
                          Allow the platform to alert you when entering crowded ghats, deep water barriers, or unverified zones.
                        </label>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                        <input
                          type="checkbox"
                          id="geoAlerts"
                          {...register('geoAlerts')}
                          className="mt-1 h-4 w-4 rounded bg-white border-slate-300 text-sky-600 focus:ring-sky-600"
                        />
                        <label htmlFor="geoAlerts" className="text-xs text-slate-600 cursor-pointer">
                          <span className="font-bold text-slate-900 block">Automatic Emergency SMS Fallbacks</span>
                          Transmit automated SMS alerts to emergency contacts if cellular data drops in remote Kumbh sectors.
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>

              <CardFooter className="p-6 sm:p-8 pt-0 flex justify-between border-t border-slate-100">
                {step > 1 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={prevStep}
                    leftIcon={ArrowLeft}
                    className="text-slate-500 hover:text-slate-900 hover:bg-slate-100"
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
                    Finish & Activate Dashboard
                  </Button>
                )}
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
