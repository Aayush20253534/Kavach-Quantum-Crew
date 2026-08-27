import React, { useMemo, useState } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import {
  Ambulance,
  CheckCircle2,
  Crosshair,
  Eye,
  EyeOff,
  Flame,
  Loader2,
  MapPin,
  ShieldAlert,
  UserPlus,
} from 'lucide-react';
import { authorityService } from '../api/authorityService';

const GOOGLE_MAP_LIBRARIES = ['places'];
const EMPTY_FORM = Object.freeze({
  serviceType: 'POLICE',
  fleetName: '',
  address: '',
  jurisdiction: '',
  latitude: '',
  longitude: '',
  username: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
});

const SERVICES = Object.freeze([
  { value: 'POLICE', label: 'Police', icon: ShieldAlert },
  { value: 'AMBULANCE', label: 'Hospital / Ambulance', icon: Ambulance },
  { value: 'FIRE', label: 'Fire', icon: Flame },
]);

const getErrorMessage = (error) =>
  error?.response?.data?.error?.message ||
  error?.response?.data?.message ||
  error?.message ||
  'Unable to create the account.';

export function AuthorityAccountCreationPage() {
  const { isLoaded: mapsLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries: GOOGLE_MAP_LIBRARIES,
  });
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState(null);

  const selected = useMemo(
    () => SERVICES.find((service) => service.value === form.serviceType) || SERVICES[0],
    [form.serviceType],
  );

  const update = (field) => (event) => {
    const value = field === 'phone' ? event.target.value.replace(/\D/g, '').slice(0, 10) : event.target.value;
    setForm((current) => ({
      ...current,
      [field]: value,
      ...(field === 'address' ? { latitude: '', longitude: '' } : {}),
    }));
    setError('');
    setCreated(null);
  };

  const resolveAddress = async () => {
    if (!form.address.trim()) {
      setError('Enter the fleet base address before geocoding it.');
      return;
    }
    if (!mapsLoaded || !window.google?.maps?.Geocoder) {
      setError('Google Maps is not ready. Check VITE_GOOGLE_MAPS_API_KEY and the Maps JavaScript API.');
      return;
    }

    setGeocoding(true);
    setError('');
    try {
      const geocoder = new window.google.maps.Geocoder();
      const { results } = await geocoder.geocode({ address: form.address.trim() });
      const result = results?.[0];
      const point = result?.geometry?.location;
      if (!result || !point) throw new Error('Address could not be located.');
      const jurisdiction = result.address_components?.find((component) =>
        component.types?.includes('administrative_area_level_2') || component.types?.includes('locality'),
      )?.long_name;
      setForm((current) => ({
        ...current,
        address: result.formatted_address || current.address,
        jurisdiction: current.jurisdiction || jurisdiction || '',
        latitude: point.lat(),
        longitude: point.lng(),
      }));
    } catch (geocodeError) {
      setError(geocodeError?.message || 'Unable to geocode this address.');
    } finally {
      setGeocoding(false);
    }
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Browser geolocation is not supported.');
      return;
    }
    setGeocoding(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const point = { lat: coords.latitude, lng: coords.longitude };
          let address = form.address;
          if (mapsLoaded && window.google?.maps?.Geocoder) {
            const geocoder = new window.google.maps.Geocoder();
            const { results } = await geocoder.geocode({ location: point });
            address = results?.[0]?.formatted_address || address || 'Current fleet location';
          }
          setForm((current) => ({ ...current, address, latitude: point.lat, longitude: point.lng }));
          setError('');
        } catch {
          setForm((current) => ({ ...current, latitude: point.lat, longitude: point.lng }));
        } finally {
          setGeocoding(false);
        }
      },
      () => {
        setGeocoding(false);
        setError('Location permission was denied. Type the fleet address and geocode it instead.');
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setCreated(null);

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (form.latitude === '' || form.longitude === '') {
      setError('Geocode the fleet address before creating the account.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
      };
      const result = await authorityService.createEmergencyServiceAccount(payload);
      setCreated(result);
      setForm({ ...EMPTY_FORM, serviceType: form.serviceType });
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <section className="bg-white border border-slate-200 rounded-lg  overflow-hidden">
        <div className="px-5 sm:px-7 py-6 border-b border-slate-200 bg-slate-50/70">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center shrink-0"><UserPlus className="w-5 h-5" /></div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-rose-700">Disaster Management</p>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 mt-1">Emergency Fleet Fleet Account Provisioning</h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-2xl leading-6">Create one Police, Hospital/Ambulance, or Fire fleet login with a fixed base address. The base is stored once; live GPS is transmitted only while that fleet has an active dispatch.</p>
            </div>
          </div>
        </div>

        <form onSubmit={submit} className="p-5 sm:p-7 space-y-6">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Fleet Type</label>
            <div className="grid sm:grid-cols-3 gap-3">
              {SERVICES.map((service) => {
                const Icon = service.icon;
                const active = form.serviceType === service.value;
                return (
                  <button key={service.value} type="button" onClick={() => setForm((current) => ({ ...current, serviceType: service.value }))} className={`rounded-lg border p-4 flex items-center gap-3 text-left transition ${active ? 'border-rose-300 bg-rose-50 ring-2 ring-rose-100' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'}`}>
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${active ? 'bg-white text-rose-700' : 'bg-slate-100 text-slate-500'}`}><Icon className="w-4 h-4" /></div>
                    <div><p className="text-xs font-black text-slate-900">{service.label}</p><p className="text-[10px] text-slate-500 mt-0.5">{service.value}</p></div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <Field label="Fleet Name"><input required minLength={2} maxLength={120} value={form.fleetName} onChange={update('fleetName')} className="field-input" placeholder="City Central Police Fleet" /></Field>
            <Field label="Jurisdiction" hint="Optional operational area"><input maxLength={160} value={form.jurisdiction} onChange={update('jurisdiction')} className="field-input" placeholder="Prayagraj" /></Field>
            <div className="sm:col-span-2">
              <Field label="Fixed Fleet Base Address" hint="Type the address, then resolve it to coordinates. This is not continuously refreshed.">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input required maxLength={240} value={form.address} onChange={update('address')} className="field-input flex-1" placeholder="Civil Lines, Prayagraj, Uttar Pradesh" />
                  <button type="button" onClick={resolveAddress} disabled={geocoding} className="px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-700 hover:bg-slate-100 disabled:opacity-50 flex items-center justify-center gap-2">
                    {geocoding ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />} Geocode
                  </button>
                  <button type="button" onClick={useCurrentLocation} disabled={geocoding} className="px-4 py-3 rounded-lg border border-slate-200 bg-white text-[10px] font-black uppercase tracking-wider text-slate-700 hover:bg-slate-50 disabled:opacity-50 flex items-center justify-center gap-2"><Crosshair className="w-4 h-4" /> Use GPS</button>
                </div>
              </Field>
              {form.latitude !== '' && form.longitude !== '' && <p className="mt-2 text-[10px] font-bold text-slate-950">Location fixed at {Number(form.latitude).toFixed(6)}, {Number(form.longitude).toFixed(6)}</p>}
            </div>
            <Field label="Username" hint="6-40 characters"><input required minLength={6} maxLength={40} value={form.username} onChange={update('username')} autoComplete="off" className="field-input" placeholder="police.central01" /></Field>
            <Field label="Email"><input required type="email" value={form.email} onChange={update('email')} autoComplete="off" className="field-input" placeholder="dispatch@example.com" /></Field>
            <Field label="Phone" hint="10 digits"><input required inputMode="numeric" pattern="\d{10}" value={form.phone} onChange={update('phone')} autoComplete="off" className="field-input" placeholder="9876543210" /></Field>
            <div className="hidden sm:block" />
            <Field label="Password" hint="Uppercase + lowercase + number, minimum 8 characters">
              <div className="relative"><input required minLength={8} maxLength={128} type={showPassword ? 'text' : 'password'} value={form.password} onChange={update('password')} autoComplete="new-password" className="field-input pr-11" placeholder="Create a strong password" /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div>
            </Field>
            <Field label="Confirm Password"><input required minLength={8} maxLength={128} type={showPassword ? 'text' : 'password'} value={form.confirmPassword} onChange={update('confirmPassword')} autoComplete="new-password" className="field-input" placeholder="Repeat password" /></Field>
          </div>

          {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700">{error}</div>}
          {created && <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-slate-950 shrink-0 mt-0.5" /><div><p className="text-xs font-black text-emerald-900">{selected.label} fleet created successfully.</p><p className="text-[11px] text-slate-950 mt-1 leading-5">Fleet: <strong>{created.account?.organization || created.account?.name}</strong>. Login: <strong>{created.account?.username}</strong>. Its fixed base location is immediately available for dispatch selection.</p></div></div>}

          <div className="flex justify-end pt-1"><button type="submit" disabled={submitting || geocoding} className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-rose-600 text-white text-xs font-black uppercase tracking-wider hover:bg-rose-700 disabled:opacity-60 disabled:cursor-not-allowed ">{submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}{submitting ? 'Creating Fleet' : `Create ${selected.label} Fleet`}</button></div>
        </form>
      </section>
      <style>{`.field-input{width:100%;border:1px solid rgb(226 232 240);border-radius:.75rem;padding:.75rem .875rem;font-size:.75rem;outline:none;background:white}.field-input:focus{border-color:rgb(251 113 133);box-shadow:0 0 0 3px rgb(255 228 230)}`}</style>
    </div>
  );
}

function Field({ label, hint, children }) {
  return <label className="block"><span className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">{label}</span>{children}{hint && <span className="block text-[10px] text-slate-400 mt-1.5">{hint}</span>}</label>;
}
