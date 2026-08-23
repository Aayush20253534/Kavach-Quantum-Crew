import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  AlertCircle,
  Camera,
  Check,
  Heart,
  Loader2,
  MapPin,
  Save,
  ShieldCheck,
  User,
} from 'lucide-react';

import { updateUser } from '../../auth/store/authSlice';
import { profileService } from '../api/profileService';

const EMPTY_FORM = {
  name: '',
  email: '',
  phone: '',
  emergencyPhone: '',
  emergencyContactName: '',
  emergencyContactRelation: '',
  bloodGroup: 'O+',
  medicalHistory: '',
  nationality: '',
  preferredLanguage: '',
  governmentIdNumber: '',
  liveTrackingEnabled: true,
  geoAlertsEnabled: true,
};

const apiMessage = (error, fallback) =>
  error?.response?.data?.error?.message || error?.message || fallback;

export function ProfilePage() {
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const avatarUrl = previewUrl || profile?.profilePic || '';

  const initials = useMemo(() => {
    const value = form.name?.trim() || profile?.username || 'T';
    return value
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  }, [form.name, profile?.username]);

  const hydrate = (data) => {
    setProfile(data);
    setForm({
      name: data?.name || '',
      email: data?.email || '',
      phone: data?.phone || '',
      emergencyPhone: data?.emergencyContact || '',
      emergencyContactName: data?.emergencyContactName || '',
      emergencyContactRelation: data?.emergencyContactRelation || '',
      bloodGroup: data?.bloodGroup || 'O+',
      medicalHistory: data?.medicalHistory || '',
      nationality: data?.nationality || '',
      preferredLanguage: data?.preferredLanguage || '',
      governmentIdNumber: data?.governmentIdNumber || '',
      liveTrackingEnabled: data?.liveTrackingEnabled ?? true,
      geoAlertsEnabled: data?.geoAlertsEnabled ?? true,
    });
  };

  useEffect(() => {
    let active = true;

    profileService
      .getProfile()
      .then((data) => {
        if (!active) return;
        hydrate(data);
        dispatch(updateUser(data));
      })
      .catch((requestError) => {
        if (active) {
          setError(apiMessage(requestError, 'Unable to load your safety profile.'));
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [dispatch]);

  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );

  const setField = (field, value) =>
    setForm((current) => ({ ...current, [field]: value }));

  const handleImagePick = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setError('Choose a JPEG, PNG, or WebP image.');
      event.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Profile image must be 5 MB or smaller.');
      event.target.value = '';
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedImage(file);
    setPreviewUrl(URL.createObjectURL(file));
    setError('');
    setSuccess('');
  };

  const uploadImage = async () => {
    if (!selectedImage) return;

    setUploadingImage(true);
    setError('');
    setSuccess('');

    try {
      const result = await profileService.uploadProfileImage(selectedImage);
      hydrate(result.profile);
      dispatch(updateUser(result.profile));
      setSelectedImage(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      setSuccess('Profile photo uploaded securely.');
    } catch (requestError) {
      setError(apiMessage(requestError, 'Unable to upload profile photo.'));
    } finally {
      setUploadingImage(false);
    }
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const updated = await profileService.updateProfile({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        emergencyPhone: form.emergencyPhone.trim(),
        emergencyContactName: form.emergencyContactName.trim(),
        emergencyContactRelation: form.emergencyContactRelation.trim(),
        bloodGroup: form.bloodGroup,
        medicalHistory: form.medicalHistory.trim() || null,
        nationality: form.nationality.trim(),
        preferredLanguage: form.preferredLanguage.trim(),
        governmentIdNumber: form.governmentIdNumber.trim(),
        liveTrackingEnabled: form.liveTrackingEnabled,
        geoAlertsEnabled: form.geoAlertsEnabled,
      });

      hydrate(updated);
      dispatch(updateUser(updated));
      setSuccess(
        updated.emailVerified === false && updated.email !== profile?.email
          ? 'Profile saved. Verify your new email before your next login.'
          : 'Safety profile updated.',
      );
    } catch (requestError) {
      setError(apiMessage(requestError, 'Unable to update your safety profile.'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[55vh] flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-600 text-sm font-semibold">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading safety profile
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1120px] mx-auto space-y-6 pb-10">
      <div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-rose-600" />
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Safety Profile
          </h1>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Identity, emergency and medical information available to the safety workflow.
        </p>
      </div>

      {(error || success) && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm font-semibold flex items-start gap-2 ${
            error
              ? 'border-red-200 bg-red-50 text-red-700'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700'
          }`}
        >
          {error ? (
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          ) : (
            <Check className="w-4 h-4 mt-0.5 shrink-0" />
          )}
          {error || success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <aside className="lg:col-span-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-7 flex flex-col items-center bg-slate-50/70 border-b border-slate-100">
              <div className="relative">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-slate-200 border-4 border-white shadow-md flex items-center justify-center">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={`${form.name || 'Tourist'} profile`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl font-black text-slate-500">
                      {initials}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute right-0 bottom-1 w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center border-4 border-white shadow-md hover:bg-slate-800"
                  aria-label="Choose profile photo"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImagePick}
                className="hidden"
              />

              <h2 className="mt-5 text-lg font-black text-slate-900 text-center">
                {form.name || profile?.username}
              </h2>
              <p className="text-xs font-semibold text-slate-500">
                @{profile?.username}
              </p>

              {selectedImage && (
                <button
                  type="button"
                  onClick={uploadImage}
                  disabled={uploadingImage}
                  className="mt-4 w-full rounded-lg bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white text-xs font-black uppercase tracking-wider px-4 py-3 flex items-center justify-center gap-2"
                >
                  {uploadingImage ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                  Upload photo
                </button>
              )}
            </div>

            <div className="p-6 space-y-5">
              <ProfileFact icon={Heart} label="Blood group" value={form.bloodGroup || 'Not set'} />
              <ProfileFact icon={MapPin} label="Nationality" value={form.nationality || 'Not set'} />
              <ProfileFact
                icon={ShieldCheck}
                label="Safety status"
                value={profile?.onboardingCompleted ? 'Profile active' : 'Onboarding incomplete'}
              />
            </div>
          </div>
        </aside>

        <main className="lg:col-span-8">
          <form
            onSubmit={saveProfile}
            className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden"
          >
            <SectionHeader
              icon={User}
              title="Personal information"
              description="Keep contact and identity details current."
            />
            <div className="p-6 sm:p-8 space-y-8">
              <div className="grid sm:grid-cols-2 gap-5">
                <Field label="Full name" value={form.name} onChange={(value) => setField('name', value)} required />
                <Field label="Phone" value={form.phone} onChange={(value) => setField('phone', value)} required />
                <Field label="Email" type="email" value={form.email} onChange={(value) => setField('email', value)} required />
                <Field label="Preferred language" value={form.preferredLanguage} onChange={(value) => setField('preferredLanguage', value)} required />
                <Field label="Nationality" value={form.nationality} onChange={(value) => setField('nationality', value)} required />
                <Field label="Government ID number" value={form.governmentIdNumber} onChange={(value) => setField('governmentIdNumber', value)} required />
              </div>

              <SectionTitle icon={ShieldCheck} title="Emergency contact" />
              <div className="grid sm:grid-cols-3 gap-5">
                <Field label="Contact name" value={form.emergencyContactName} onChange={(value) => setField('emergencyContactName', value)} required />
                <Field label="Relation" value={form.emergencyContactRelation} onChange={(value) => setField('emergencyContactRelation', value)} required />
                <Field label="Emergency phone" value={form.emergencyPhone} onChange={(value) => setField('emergencyPhone', value)} required />
              </div>

              <SectionTitle icon={Heart} title="Medical information" />
              <div className="grid sm:grid-cols-3 gap-5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Blood group
                  </label>
                  <select
                    value={form.bloodGroup}
                    onChange={(event) => setField('bloodGroup', event.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-semibold rounded-lg px-4 py-3 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                  >
                    {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((group) => (
                      <option key={group} value={group}>{group}</option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Medical notes / allergies
                  </label>
                  <textarea
                    rows={4}
                    value={form.medicalHistory}
                    onChange={(event) => setField('medicalHistory', event.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-semibold rounded-lg px-4 py-3 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 resize-y"
                    placeholder="Allergies, conditions, medicines or other emergency information"
                  />
                </div>
              </div>

              <SectionTitle icon={MapPin} title="Safety permissions" />
              <div className="grid sm:grid-cols-2 gap-4">
                <ToggleCard
                  title="Live tracking"
                  description="Allow trip safety features to use live location."
                  checked={form.liveTrackingEnabled}
                  onChange={(value) => setField('liveTrackingEnabled', value)}
                />
                <ToggleCard
                  title="Geo alerts"
                  description="Receive alerts when entering configured risk zones."
                  checked={form.geoAlertsEnabled}
                  onChange={(value) => setField('geoAlertsEnabled', value)}
                />
              </div>

              <div className="pt-6 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full sm:w-auto rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white px-7 py-3 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save safety profile
                </button>
              </div>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}

function SectionHeader({ icon: Icon, title, description }) {
  return (
    <div className="px-6 sm:px-8 py-5 border-b border-slate-100 bg-slate-50/60 flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center">
        <Icon className="w-4 h-4 text-rose-600" />
      </div>
      <div>
        <h3 className="text-sm font-black text-slate-900">{title}</h3>
        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
      </div>
    </div>
  );
}

function SectionTitle({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
      <Icon className="w-4 h-4 text-slate-400" />
      <h3 className="text-sm font-black text-slate-900">{title}</h3>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', required = false }) {
  return (
    <div>
      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-semibold rounded-lg px-4 py-3 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
      />
    </div>
  );
}

function ToggleCard({ title, description, checked, onChange }) {
  return (
    <label className="flex items-center justify-between gap-4 p-4 border border-slate-200 rounded-xl bg-slate-50/60 cursor-pointer">
      <div>
        <p className="text-sm font-bold text-slate-900">{title}</p>
        <p className="text-xs text-slate-500 mt-1">{description}</p>
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="w-5 h-5 accent-rose-600"
      />
    </label>
  );
}

function ProfileFact({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-slate-500" />
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">{label}</p>
        <p className="text-sm font-bold text-slate-800 mt-0.5">{value}</p>
      </div>
    </div>
  );
}
