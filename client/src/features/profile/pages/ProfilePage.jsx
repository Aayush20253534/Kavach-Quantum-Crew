import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  Camera,
  Check,
  Heart,
  Loader2,
  MapPin,
  Save,
  ShieldCheck,
  LogOut,
  User,
} from 'lucide-react';

import { logout, updateUser } from '../../auth/store/authSlice';
import { authService } from '../../auth/api/authService';
import { markExplicitSignOut } from '../../../services/apiClient';
import { SignOutConfirmModal } from '../../../app/components/SignOutConfirmModal';
import { ScrollableSelect } from '../../onboarding/components/ScrollableSelect';
import {
  BLOOD_GROUPS,
  GOVERNMENT_ID_TYPES,
  LANGUAGES,
  NATIONALITIES,
  RELATIONSHIPS,
  getNationalityFlag,
} from '../../onboarding/constants/onboardingOptions';
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
  governmentIdType: 'AADHAAR',
  governmentIdNumber: '',
  liveTrackingEnabled: true,
  geoAlertsEnabled: true,
};

const apiMessage = (error, fallback) =>
  error?.response?.data?.error?.message || error?.message || fallback;

export function ProfilePage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState(null);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [logoutBusy, setLogoutBusy] = useState(false);
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
      governmentIdType: data?.governmentIdType || 'AADHAAR',
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
        governmentIdType: form.governmentIdType,
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

  const handleSignOut = async () => {
    setLogoutBusy(true);
    markExplicitSignOut();
    try {
      await authService.logout();
    } catch {
      // Explicit local sign-out still wins if the backend cannot be reached.
    } finally {
      dispatch(logout());
      setLogoutBusy(false);
      setLogoutOpen(false);
      navigate('/', { replace: true });
    }
  };

  const requestSignOut = () => setLogoutOpen(true);

  if (loading) {
    return (
      <div className="min-h-[55vh] flex items-center justify-center">
      <SignOutConfirmModal
        open={logoutOpen}
        busy={logoutBusy}
        onCancel={() => !logoutBusy && setLogoutOpen(false)}
        onConfirm={handleSignOut}
      />
        <div className="flex items-center gap-3 text-slate-600 text-sm font-semibold">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading safety profile
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1120px] mx-auto space-y-4 sm:space-y-6 pb-8 sm:pb-10">
      <SignOutConfirmModal
        open={logoutOpen}
        busy={logoutBusy}
        onCancel={() => !logoutBusy && setLogoutOpen(false)}
        onConfirm={handleSignOut}
      />
      <div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-rose-600" />
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Safety Profile
          </h1>
        </div>
      </div>

      {(error || success) && (
        <div
          className={`rounded-xl border px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold flex items-start gap-2 ${
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        <aside className="lg:col-span-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 sm:p-7 flex flex-col items-center bg-slate-50/70 border-b border-slate-100">
              <div className="relative">
                <div className="w-24 h-24 sm:w-28 sm:h-28 aspect-square shrink-0 rounded-full overflow-hidden bg-slate-200 border-[3px] border-white shadow-md flex items-center justify-center">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={`${form.name || 'Tourist'} profile`}
                      className="block w-full h-full object-cover object-center"
                    />
                  ) : (
                    <span className="text-2xl sm:text-3xl font-black text-slate-500">
                      {initials}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -right-1 bottom-0 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-900 text-white flex items-center justify-center border-[3px] border-white shadow-md hover:bg-slate-800"
                  aria-label="Choose profile photo"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImagePick}
                className="hidden"
              />

              <h2 className="mt-4 text-base sm:text-lg font-black text-slate-900 text-center">
                {form.name || profile?.username}
              </h2>
              <p className="text-[11px] sm:text-xs font-semibold text-slate-500">
                @{profile?.username}
              </p>

              {selectedImage && (
                <button
                  type="button"
                  onClick={uploadImage}
                  disabled={uploadingImage}
                  className="mt-3 sm:mt-4 w-full rounded-lg bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white text-[10px] sm:text-xs font-black uppercase tracking-wider px-4 py-2.5 sm:py-3 flex items-center justify-center gap-2"
                >
                  {uploadingImage ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Camera className="w-3.5 h-3.5" />
                  )}
                  Upload photo
                </button>
              )}
            </div>

            <div className="p-5 sm:p-6 space-y-4 sm:space-y-5">
              <ProfileFact icon={Heart} label="Blood group" value={form.bloodGroup || 'Not set'} />
              <ProfileFact icon={MapPin} label="Nationality" value={form.nationality || 'Not set'} />
              <ProfileFact
                icon={ShieldCheck}
                label="Safety status"
                value={profile?.onboardingCompleted ? 'Profile active' : 'Onboarding incomplete'}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={requestSignOut}
            className="mt-3 sm:mt-4 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs sm:text-sm font-bold text-slate-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
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
            <div className="p-5 sm:p-7 space-y-6 sm:space-y-8">
              <div className="grid sm:grid-cols-2 gap-5">
                <Field label="Full name" value={form.name} onChange={(value) => setField('name', value)} required />
                <Field label="Phone" value={form.phone} onChange={(value) => setField('phone', value)} required />
                <Field label="Email" type="email" value={form.email} onChange={(value) => setField('email', value)} required />
                <ProfileSelect
                  label="Preferred language"
                  value={form.preferredLanguage}
                  options={LANGUAGES}
                  placeholder="Select language"
                  onChange={(value) => setField('preferredLanguage', value)}
                />
                <ProfileSelect
                  label="Nationality"
                  value={form.nationality}
                  options={NATIONALITIES}
                  placeholder="Select nationality"
                  onChange={(value) => setField('nationality', value)}
                  searchable
                  searchPlaceholder="Search nationality"
                  optionPrefix={(option) => getNationalityFlag(option)}
                />
                <ProfileSelect
                  label="ID type"
                  value={form.governmentIdType}
                  options={GOVERNMENT_ID_TYPES}
                  placeholder="Select ID type"
                  onChange={(value) => setField('governmentIdType', value)}
                />
                <Field
                  label={form.governmentIdType === 'AADHAAR' ? 'Aadhaar number' : 'Passport number'}
                  value={form.governmentIdNumber}
                  onChange={(value) => setField('governmentIdNumber', value)}
                  required
                />
              </div>

              <SectionTitle icon={ShieldCheck} title="Emergency contact" />
              <div className="grid sm:grid-cols-3 gap-5">
                <Field label="Contact name" value={form.emergencyContactName} onChange={(value) => setField('emergencyContactName', value)} required />
                <ProfileSelect
                  label="Relation"
                  value={form.emergencyContactRelation}
                  options={RELATIONSHIPS}
                  placeholder="Select relation"
                  onChange={(value) => setField('emergencyContactRelation', value)}
                />
                <Field label="Emergency phone" value={form.emergencyPhone} onChange={(value) => setField('emergencyPhone', value)} required />
              </div>

              <SectionTitle icon={Heart} title="Medical information" />
              <div className="grid sm:grid-cols-3 gap-5">
                <ProfileSelect
                  label="Blood group"
                  value={form.bloodGroup}
                  options={BLOOD_GROUPS}
                  placeholder="Select blood group"
                  onChange={(value) => setField('bloodGroup', value)}
                />

                <div className="sm:col-span-2">
                  <label className="block text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Medical notes / allergies
                  </label>
                  <textarea
                    rows={4}
                    value={form.medicalHistory}
                    onChange={(event) => setField('medicalHistory', event.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs sm:text-sm font-semibold rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 resize-y"
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
    <div className="px-5 sm:px-8 py-4 sm:py-5 border-b border-slate-100 bg-slate-50/60 flex items-center gap-3">
      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center">
        <Icon className="w-4 h-4 text-rose-600" />
      </div>
      <div>
        <h3 className="text-xs sm:text-sm font-black text-slate-900">{title}</h3>
        <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">{description}</p>
      </div>
    </div>
  );
}

function SectionTitle({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
      <Icon className="w-4 h-4 text-slate-400" />
      <h3 className="text-xs sm:text-sm font-black text-slate-900">{title}</h3>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', required = false }) {
  return (
    <div>
      <label className="block text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs sm:text-sm font-semibold rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
      />
    </div>
  );
}

function ProfileSelect({
  label,
  value,
  options,
  placeholder,
  onChange,
  searchable = false,
  searchPlaceholder = 'Search...',
  optionPrefix,
}) {
  return (
    <div>
      <label className="block text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <ScrollableSelect
        value={value}
        options={options}
        placeholder={placeholder}
        onChange={onChange}
        searchable={searchable}
        searchPlaceholder={searchPlaceholder}
        optionPrefix={optionPrefix}
      />
    </div>
  );
}

function ToggleCard({ title, description, checked, onChange }) {
  return (
    <label className="flex items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 border border-slate-200 rounded-xl bg-slate-50/60 cursor-pointer">
      <div>
        <p className="text-xs sm:text-sm font-bold text-slate-900">{title}</p>
        <p className="text-[10px] sm:text-xs text-slate-500 mt-1">{description}</p>
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
        <p className="text-xs sm:text-sm font-bold text-slate-800 mt-0.5">{value}</p>
      </div>
    </div>
  );
}
