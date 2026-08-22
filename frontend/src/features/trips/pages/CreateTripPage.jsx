import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCreateTrip } from '../api/tripQueries';
import { 
  Compass, 
  Users, 
  User, 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck,
  Calendar,
  Clock,
  MapPin
} from 'lucide-react';

const PRAYAGRAJ_DESTINATIONS = [
  { id: 'sangam', name: 'Triveni Sangam & Ghats', category: 'Holy Confluence', riskLevel: 'Safe' },
  { id: 'fort', name: 'Allahabad Fort', category: 'Historic Monument', riskLevel: 'Safe' },
  { id: 'bhavan', name: 'Anand Bhavan', category: 'Heritage Site', riskLevel: 'Safe' },
  { id: 'temple', name: 'Alopi Devi Mandir', category: 'Temple Circuit', riskLevel: 'Safe' },
  { id: 'kumbh', name: 'Kumbh Mela Camp', category: 'Pilgrim Grounds', riskLevel: 'Safe' },
  { id: 'bagh', name: 'Khusro Bagh', category: 'Heritage Park', riskLevel: 'Safe' },
];

export function CreateTripPage() {
  const navigate = useNavigate();
  const [tripType, setTripType] = useState('GROUP'); // 'SOLO' | 'GROUP'
  const [selectedDestination, setSelectedDestination] = useState(PRAYAGRAJ_DESTINATIONS[0].id);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [duration, setDuration] = useState('Full Day Pilgrimage');
  const [checkInInterval, setCheckInInterval] = useState('Every 2 Hours');
  const [errorMsg, setErrorMsg] = useState('');

  const { mutateAsync: createTrip, isPending } = useCreateTrip();

  const handleCreateTrip = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    
    try {
      const dest = PRAYAGRAJ_DESTINATIONS.find(d => d.id === selectedDestination);
      await createTrip({
        type: tripType,
        destination: dest.name,
        startDate,
        duration,
        checkInInterval
      });
      navigate('/tourist/trips/current');
    } catch (error) {
      setErrorMsg(error.response?.data?.message || 'Failed to create trip. Please try again.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto font-sans pb-10">
      
      <div className="mb-8">
        <h1 className="text-[22px] font-black text-slate-900 tracking-tight flex items-center gap-2">
          Plan New Trip
        </h1>
        <p className="text-[13px] text-slate-500 font-medium mt-1">
          Establish safety parameters and routing before your journey.
        </p>
      </div>

      {errorMsg && (
        <div className="bg-[#fef2f2] border border-[#fecaca] p-4 rounded-xl mb-6 shadow-sm flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-[#ef4444] shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-[#b91c1c] uppercase tracking-wider">Initialization Error</p>
            <p className="text-[12px] text-[#991b1b] font-medium mt-0.5">{errorMsg}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleCreateTrip} className="space-y-8">
        
        {/* Solo vs Group Toggle */}
        <section className="space-y-4">
          <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">1. Trip Classification</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <button
              type="button"
              onClick={() => setTripType('GROUP')}
              className={`group relative p-5 text-left transition-all duration-300 rounded-2xl border cursor-pointer ${
                tripType === 'GROUP'
                  ? 'bg-red-50 border-red-200 shadow-[0_4px_20px_rgba(225,29,72,0.08)] ring-1 ring-red-500/20'
                  : 'bg-white border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:border-red-200 hover:shadow-md'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${tripType === 'GROUP' ? 'bg-[#e11d48] text-white shadow-md' : 'bg-slate-50 text-slate-500 group-hover:text-red-500 group-hover:bg-red-50'}`}>
                  <Users className="w-6 h-6" />
                </div>
                {tripType === 'GROUP' && <CheckCircle2 className="w-6 h-6 text-[#e11d48]" />}
              </div>
              <h3 className={`text-[15px] font-black tracking-wide transition-colors ${tripType === 'GROUP' ? 'text-[#e11d48]' : 'text-slate-900'}`}>Group Trip</h3>
              <p className={`text-[12px] mt-1.5 leading-relaxed font-medium ${tripType === 'GROUP' ? 'text-red-900/70' : 'text-slate-500'}`}>
                Synchronize location with family members and monitor companion distances.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setTripType('SOLO')}
              className={`group relative p-5 text-left transition-all duration-300 rounded-2xl border cursor-pointer ${
                tripType === 'SOLO'
                  ? 'bg-red-50 border-red-200 shadow-[0_4px_20px_rgba(225,29,72,0.08)] ring-1 ring-red-500/20'
                  : 'bg-white border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:border-red-200 hover:shadow-md'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${tripType === 'SOLO' ? 'bg-[#e11d48] text-white shadow-md' : 'bg-slate-50 text-slate-500 group-hover:text-red-500 group-hover:bg-red-50'}`}>
                  <User className="w-6 h-6" />
                </div>
                {tripType === 'SOLO' && <CheckCircle2 className="w-6 h-6 text-[#e11d48]" />}
              </div>
              <h3 className={`text-[15px] font-black tracking-wide transition-colors ${tripType === 'SOLO' ? 'text-[#e11d48]' : 'text-slate-900'}`}>Solo Traveler</h3>
              <p className={`text-[12px] mt-1.5 leading-relaxed font-medium ${tripType === 'SOLO' ? 'text-red-900/70' : 'text-slate-500'}`}>
                Automated periodic check-in reminders and direct uplink to Police.
              </p>
            </button>
          </div>
        </section>

        {/* Destination Selection */}
        <section className="space-y-4">
          <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">2. Primary Destination</h2>
          <div className="bg-white border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-5 rounded-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {PRAYAGRAJ_DESTINATIONS.map((dest) => (
                <label 
                  key={dest.id}
                  className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-all duration-200 ${
                    selectedDestination === dest.id 
                      ? 'bg-red-50 border-red-200 shadow-sm' 
                      : 'bg-white border-slate-100 hover:border-red-200 hover:shadow-sm'
                  }`}
                >
                  <input 
                    type="radio" 
                    name="destination" 
                    value={dest.id}
                    checked={selectedDestination === dest.id}
                    onChange={() => setSelectedDestination(dest.id)}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${selectedDestination === dest.id ? 'border-[#e11d48] bg-[#e11d48]' : 'border-slate-300 bg-white'}`}>
                    {selectedDestination === dest.id && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                  <div>
                    <h4 className={`text-[13px] font-bold uppercase tracking-wide ${selectedDestination === dest.id ? 'text-red-700' : 'text-slate-900'}`}>
                      {dest.name}
                    </h4>
                    <p className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 ${selectedDestination === dest.id ? 'text-red-500' : 'text-slate-400'}`}>
                      {dest.category} • {dest.riskLevel}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </section>

        {/* Safety Parameters & Schedule */}
        <section className="space-y-4">
          <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">3. Scheduling & Telemetry</h2>
          <div className="bg-white border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-6 rounded-2xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="flex flex-col">
                <label className="text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-slate-400" /> Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-[13px] font-semibold rounded-xl px-4 py-3 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all uppercase"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-slate-400" /> Est. Duration
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-[13px] font-semibold rounded-xl px-4 py-3 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all uppercase appearance-none cursor-pointer"
                >
                  <option value="Half Day (4 Hours)">Half Day (4 Hours)</option>
                  <option value="Full Day Pilgrimage">Full Day Pilgrimage</option>
                  <option value="2 Days Tour">2 Days Tour</option>
                  <option value="Multi-day Camp">Multi-day Camp</option>
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-slate-400" /> Check-in Interval
                </label>
                <select
                  value={checkInInterval}
                  onChange={(e) => setCheckInInterval(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-[13px] font-semibold rounded-xl px-4 py-3 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all uppercase appearance-none cursor-pointer"
                >
                  <option value="Every 1 Hour">Every 1 Hr (High Caution)</option>
                  <option value="Every 2 Hours">Every 2 Hrs (Recommended)</option>
                  <option value="Every 4 Hours">Every 4 Hrs</option>
                  <option value="Manual Only">Manual Only</option>
                </select>
              </div>

            </div>
          </div>
        </section>

        {/* Submit Actions */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
          <Link to="/tourist/dashboard" className="w-full sm:w-auto">
            <button type="button" className="w-full sm:w-auto px-8 py-3.5 border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 hover:text-slate-900 text-[12px] font-bold uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-sm">
              Cancel
            </button>
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="w-full sm:w-auto group flex items-center justify-center gap-2 px-10 py-3.5 bg-[#e11d48] hover:bg-[#be123c] text-white text-[12px] font-bold uppercase tracking-widest rounded-xl disabled:opacity-50 cursor-pointer shadow-[0_4px_14px_0_rgba(225,29,72,0.39)] transition-all active:scale-95"
          >
            {isPending ? 'Initializing...' : 'Confirm & Initialize'}
            {!isPending && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
          </button>
        </div>
      </form>
    </div>
  );
}
