import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowRight,
  CheckCircle2,
  HeartPulse,
  FileUp,
  Loader2,
  MapPin,
  PhoneCall,
  ShieldCheck,
  User,
} from 'lucide-react';

import { completeOnboarding } from '../../auth/store/authSlice';
import apiClient from '../../../services/apiClient';
import { profileService } from '../../profile/api/profileService';
import { ScrollableSelect } from '../components/ScrollableSelect';
import {
  BLOOD_GROUPS,
  GOVERNMENT_ID_TYPES,
  LANGUAGES,
  NATIONALITIES,
  RELATIONSHIPS,
  getNationalityFlag,
} from '../constants/onboardingOptions';

const tenDigitPhone = z
  .string()
  .regex(/^\d{10}$/, 'Phone number must contain exactly 10 digits');

const onboardingSchema = z
  .object({
    gender: z.string().min(1, 'Please select gender'),
    age: z.coerce.number().int().min(0, 'Age cannot be negative').max(100, 'Age cannot be above 100'),
    dateOfBirth: z.string().min(1, 'Date of birth is required'),
    nationality: z.string().min(1, 'Please select nationality'),
    language: z.string().min(1, 'Please select preferred language'),
    emergencyName: z.string().trim().min(2, 'Emergency contact name is required').max(120),
    emergencyRelation: z.string().min(1, 'Relationship is required'),
    emergencyPhone: tenDigitPhone,
    bloodGroup: z.enum(['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-']),
    medicalNotes: z.string().max(5000).optional(),
    idType: z.enum(['AADHAAR', 'PASSPORT']),
    idNumber: z.string().trim().min(1, 'ID number is required'),
    liveTracking: z.boolean().refine((value) => value === true, {
      message: 'Please consent to live location sharing',
    }),
    geoAlerts: z.boolean().refine((value) => value === true, {
      message: 'Please consent to safety/geofence data sharing',
    }),
  })
  .superRefine((data, context) => {
    if (data.idType === 'AADHAAR' && !/^\d{12}$/.test(data.idNumber)) {
      context.addIssue({
        code: 'custom',
        path: ['idNumber'],
        message: 'Aadhaar number must contain exactly 12 digits',
      });
    }

    if (
      data.idType === 'PASSPORT' &&
      !/^[A-Za-z0-9]{6,20}$/.test(data.idNumber)
    ) {
      context.addIssue({
        code: 'custom',
        path: ['idNumber'],
        message: 'Passport ID must be 6 to 20 letters or digits',
      });
    }
  });

const stepsInfo = [
  { id: 1, title: 'Your Profile', desc: 'Identity details', icon: User },
  { id: 2, title: 'Emergency', desc: 'Family contacts', icon: PhoneCall },
  { id: 3, title: 'Medical', desc: 'Health and ID', icon: HeartPulse },
  { id: 4, title: 'Safety Settings', desc: 'App permissions', icon: ShieldCheck },
];

const digitsOnly = (event, maxLength) => {
  event.target.value = event.target.value.replace(/\D/g, '').slice(0, maxLength);
};

export function OnboardingPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [step, setStep] = useState(1);
  const [onboardingError, setOnboardingError] = useState('');
  const [medicalUpload, setMedicalUpload] = useState({
    state: 'idle',
    name: '',
    url: '',
    error: '',
  });

  const {
    register,
    control,
    handleSubmit,
    trigger,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      gender: '',
      age: '',
      dateOfBirth: '',
      nationality: '',
      language: '',
      emergencyName: '',
      emergencyRelation: '',
      emergencyPhone: '',
      bloodGroup: 'O+',
      medicalNotes: '',
      idType: 'AADHAAR',
      idNumber: '',
      liveTracking: false,
      geoAlerts: false,
    },
  });

  const idType = watch('idType');

  const nextStep = async () => {
    let fields = [];
    if (step === 1) fields = ['gender', 'age', 'dateOfBirth', 'nationality', 'language'];
    if (step === 2) fields = ['emergencyName', 'emergencyRelation', 'emergencyPhone'];
    if (step === 3) fields = ['bloodGroup', 'idType', 'idNumber'];
    if (step === 4) fields = ['liveTracking', 'geoAlerts'];
    if (await trigger(fields)) setStep((current) => Math.min(current + 1, 4));
  };

  const handleMedicalDocument = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowed = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
    ];

    if (!allowed.includes(file.type)) {
      setMedicalUpload({
        state: 'error',
        name: file.name,
        url: '',
        error: 'Upload a PDF, JPEG, PNG, or WebP file.',
      });
      event.target.value = '';
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setMedicalUpload({
        state: 'error',
        name: file.name,
        url: '',
        error: 'Medical document must be 10 MB or smaller.',
      });
      event.target.value = '';
      return;
    }

    setMedicalUpload({
      state: 'uploading',
      name: file.name,
      url: '',
      error: '',
    });

    try {
      const result = await profileService.uploadMedicalDocument(file);
      setMedicalUpload({
        state: 'done',
        name: result?.document?.name || file.name,
        url: result?.document?.url || '',
        error: '',
      });
    } catch (error) {
      setMedicalUpload({
        state: 'error',
        name: file.name,
        url: '',
        error:
          error?.response?.data?.error?.message ||
          error?.message ||
          'Medical document upload failed.',
      });
    } finally {
      event.target.value = '';
    }
  };

  const onSubmit = async (data) => {
    if (step < 4) return nextStep();

    setOnboardingError('');
    try {
      const genderMap = {
        Male: 'MALE',
        Female: 'FEMALE',
        Other: 'OTHER',
        'Prefer not to say': 'PREFER_NOT_TO_SAY',
      };

      const response = await apiClient.post('/tourists/me/onboarding', {
        gender: genderMap[data.gender] ?? 'PREFER_NOT_TO_SAY',
        age: data.age,
        dateOfBirth: data.dateOfBirth,
        nationality: data.nationality,
        preferredLanguage: data.language,
        emergencyContactName: data.emergencyName.trim(),
        emergencyContactRelation: data.emergencyRelation,
        emergencyPhone: data.emergencyPhone,
        bloodGroup: data.bloodGroup,
        governmentIdType: data.idType,
        governmentIdNumber: data.idNumber.trim().toUpperCase(),
        medicalHistory: data.medicalNotes?.trim() || null,
        liveTrackingEnabled: data.liveTracking,
        geoAlertsEnabled: data.geoAlerts,
      });

      const profile = response.data?.data ?? response.data;
      dispatch(completeOnboarding(profile));
      navigate('/tourist/dashboard', { replace: true });
    } catch (error) {
      setOnboardingError(
        error?.response?.data?.error?.message ||
          error?.message ||
          'Unable to complete onboarding. Please try again.',
      );
    }
  };

  const CurrentIcon = stepsInfo[step - 1].icon;

  return (
    <div className="tourist-font min-h-screen w-full flex flex-col md:flex-row bg-white text-slate-900 overflow-hidden">
      <aside className="hidden md:flex md:w-[280px] lg:w-[320px] bg-slate-50 border-r border-slate-200 p-8 flex-col shrink-0">
        <div className="flex items-center gap-3 mb-12">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-red-600 text-white">
            <MapPin size={17} />
          </div>
          <div>
            <h1 className="text-sm font-black">KAVACH Tourist Safety</h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Profile setup</p>
          </div>
        </div>

        <div className="space-y-3">
          {stepsInfo.map((item) => {
            const active = item.id === step;
            const done = item.id < step;
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className={`rounded-lg border p-3 flex items-center gap-3 ${
                  active ? 'bg-white border-red-200 shadow-sm' : 'border-transparent'
                }`}
              >
                <div className={`w-9 h-9 rounded-md flex items-center justify-center ${
                  active ? 'bg-red-50 text-red-600' : done ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                }`}>
                  {done ? <CheckCircle2 size={16} /> : <Icon size={16} />}
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase">Step {item.id}</p>
                  <p className="text-xs font-black">{item.title}</p>
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      <main className="flex-1 min-w-0 h-screen overflow-y-auto">
        <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-7 sm:py-10 md:py-12">
          <div className="mb-8">
            <div className="flex justify-between text-xs text-slate-500 mb-2">
              <span>Step {step} of 4</span>
              <span>{step * 25}% complete</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-red-600 transition-all" style={{ width: `${step * 25}%` }} />
            </div>
          </div>

          <div className="mb-7">
            <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center mb-4">
              <CurrentIcon size={18} />
            </div>
            <h2 className="text-2xl font-black">
              {step === 1 && 'Profile Setup'}
              {step === 2 && 'Emergency Contact'}
              {step === 3 && 'Medical & Identity'}
              {step === 4 && 'Safety Settings'}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {step === 1 && 'Tell us who you are and your preferred language.'}
              {step === 2 && 'Choose who should be contacted during an emergency.'}
              {step === 3 && 'Add health information and a verified identity document.'}
              {step === 4 && 'Choose the safety features you want enabled.'}
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {step === 1 && (
              <>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Gender" error={errors.gender?.message}>
                    <Controller
                      control={control}
                      name="gender"
                      render={({ field }) => (
                        <ScrollableSelect
                          {...field}
                          options={['Female', 'Male', 'Other', 'Prefer not to say']}
                          placeholder="Select gender"
                          error={errors.gender}
                        />
                      )}
                    />
                  </Field>

                  <Field label="Age" error={errors.age?.message}>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={3}
                      placeholder="Select age"
                      {...register('age')}
                      onInput={(event) => {
                        const digits = event.target.value.replace(/\D/g, '').slice(0, 3);
                        if (!digits) {
                          event.target.value = '';
                          return;
                        }
                        event.target.value = String(Math.min(100, Number(digits)));
                      }}
                      className="onboarding-control"
                    />
                  </Field>

                  <Field label="Date of Birth" error={errors.dateOfBirth?.message}>
                    <input type="date" {...register('dateOfBirth')} className="onboarding-control" />
                  </Field>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Nationality" error={errors.nationality?.message}>
                    <Controller
                      control={control}
                      name="nationality"
                      render={({ field }) => (
                        <ScrollableSelect
                          {...field}
                          options={NATIONALITIES}
                          placeholder="Select nationality"
                          error={errors.nationality}
                          searchable
                          searchPlaceholder="Search nationality"
                          optionPrefix={(option) => getNationalityFlag(option)}
                        />
                      )}
                    />
                  </Field>

                  <Field label="Preferred Language" error={errors.language?.message}>
                    <Controller
                      control={control}
                      name="language"
                      render={({ field }) => (
                        <ScrollableSelect
                          {...field}
                          options={LANGUAGES}
                          placeholder="Select language"
                          error={errors.language}
                        />
                      )}
                    />
                  </Field>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <Field label="Primary Contact Name" error={errors.emergencyName?.message}>
                  <input
                    {...register('emergencyName')}
                    className="onboarding-control"
                    placeholder="Emergency contact name"
                    maxLength={120}
                  />
                </Field>

                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Relationship" error={errors.emergencyRelation?.message}>
                    <Controller
                      control={control}
                      name="emergencyRelation"
                      render={({ field }) => (
                        <ScrollableSelect
                          {...field}
                          options={RELATIONSHIPS}
                          placeholder="Select relation"
                          error={errors.emergencyRelation}
                        />
                      )}
                    />
                  </Field>

                  <Field label="Phone Number" error={errors.emergencyPhone?.message}>
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      placeholder="9876543210"
                      {...register('emergencyPhone')}
                      onInput={(event) => digitsOnly(event, 10)}
                      className="onboarding-control"
                    />
                  </Field>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Blood Group" error={errors.bloodGroup?.message}>
                    <Controller
                      control={control}
                      name="bloodGroup"
                      render={({ field }) => (
                        <ScrollableSelect
                          {...field}
                          options={BLOOD_GROUPS}
                          placeholder="Select blood group"
                          error={errors.bloodGroup}
                        />
                      )}
                    />
                  </Field>

                  <Field label="ID Type" error={errors.idType?.message}>
                    <Controller
                      control={control}
                      name="idType"
                      render={({ field }) => (
                        <ScrollableSelect
                          {...field}
                          options={GOVERNMENT_ID_TYPES}
                          placeholder="Select ID type"
                          error={errors.idType}
                        />
                      )}
                    />
                  </Field>
                </div>

                <Field
                  label={idType === 'AADHAAR' ? 'Aadhaar Number' : 'Passport Number'}
                  error={errors.idNumber?.message}
                >
                  <input
                    {...register('idNumber')}
                    inputMode={idType === 'AADHAAR' ? 'numeric' : 'text'}
                    maxLength={idType === 'AADHAAR' ? 12 : 20}
                    onInput={(event) => {
                      if (idType === 'AADHAAR') digitsOnly(event, 12);
                      else event.target.value = event.target.value.replace(/[^A-Za-z0-9]/g, '').slice(0, 20).toUpperCase();
                    }}
                    placeholder={idType === 'AADHAAR' ? '12-digit Aadhaar number' : 'Passport ID'}
                    className="onboarding-control uppercase"
                  />
                </Field>

                <Field label="Medical Notes (Optional)" error={errors.medicalNotes?.message}>
                  <textarea
                    rows={4}
                    maxLength={5000}
                    {...register('medicalNotes')}
                    className="onboarding-control h-auto min-h-28 px-3 py-4 resize-y leading-5"
                    placeholder="Allergies, conditions, medications, or other emergency information"
                  />
                </Field>

                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
                  <label className="flex cursor-pointer items-start gap-3">
                    <div className="mt-0.5 rounded-lg bg-white border border-slate-200 p-2">
                      {medicalUpload.state === 'uploading' ? (
                        <Loader2 className="w-4 h-4 animate-spin text-red-600" />
                      ) : (
                        <FileUp className="w-4 h-4 text-slate-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-slate-800">
                        Upload medical history (optional)
                      </p>
                      <p className="text-[10px] text-slate-500 mt-1">
                        PDF, JPEG, PNG or WebP, up to 10 MB.
                      </p>
                      {medicalUpload.name && (
                        <p className={`mt-2 text-[10px] font-semibold break-all ${
                          medicalUpload.state === 'done'
                            ? 'text-emerald-600'
                            : medicalUpload.state === 'error'
                              ? 'text-red-600'
                              : 'text-slate-500'
                        }`}>
                          {medicalUpload.state === 'done'
                            ? `Uploaded: ${medicalUpload.name}`
                            : medicalUpload.error || medicalUpload.name}
                        </p>
                      )}
                    </div>
                    <input
                      type="file"
                      accept=".pdf,image/jpeg,image/png,image/webp"
                      className="hidden"
                      disabled={medicalUpload.state === 'uploading'}
                      onChange={handleMedicalDocument}
                    />
                  </label>
                </div>
              </>
            )}

            {step === 4 && (
              <div className="space-y-3">
                <p className="text-xs text-slate-500">
                  These permissions are not pre-selected. Read them and provide consent explicitly.
                </p>
                <Toggle
                  register={register('liveTracking')}
                  title="Consent to Live Location Sharing"
                  description="Allow KAVACH to share your live location while an active trip is being monitored."
                  error={errors.liveTracking?.message}
                />
                <Toggle
                  register={register('geoAlerts')}
                  title="Consent to Safety & Geofence Sharing"
                  description="Allow KAVACH to evaluate your location against safety zones and send geofence alerts."
                  error={errors.geoAlerts?.message}
                />
              </div>
            )}

            {onboardingError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {onboardingError}
              </div>
            )}

            <div className="pt-5 border-t border-slate-200 flex justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep((current) => Math.max(1, current - 1))}
                className={`px-4 py-2.5 rounded-lg border text-xs font-bold ${step === 1 ? 'invisible' : ''}`}
              >
                Back
              </button>

              {step < 4 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-5 py-2.5 rounded-lg bg-slate-900 text-white text-xs font-bold flex items-center gap-2"
                >
                  Continue <ArrowRight size={14} />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-lg bg-red-600 text-white text-xs font-bold disabled:opacity-60"
                >
                  {isSubmitting ? 'Saving...' : 'Finish Setup'}
                </button>
              )}
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-[10px] font-semibold text-red-600">{error}</p>}
    </div>
  );
}

function Toggle({ register, title, description, error }) {
  return (
    <div>
      <label className={`flex items-start gap-3 p-4 border rounded-xl bg-white ${
        error ? 'border-red-300' : 'border-slate-200'
      }`}>
        <input type="checkbox" {...register} className="mt-0.5 w-4 h-4 accent-red-600" />
        <span>
          <span className="block text-sm font-black">{title}</span>
          <span className="block text-xs text-slate-500 mt-1">{description}</span>
        </span>
      </label>
      {error && <p className="mt-1 text-[10px] font-semibold text-red-600">{error}</p>}
    </div>
  );
}
