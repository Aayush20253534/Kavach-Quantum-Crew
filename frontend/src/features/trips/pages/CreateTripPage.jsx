import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCreateTrip } from '../api/tripQueries';
import { 
  Compass, 
  Users, 
  User, 
  ArrowRight, 
  CheckCircle2, 
  Map,
  ShieldCheck,
  Calendar,
  Clock
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
      // Find destination name for the payload
      const dest = PRAYAGRAJ_DESTINATIONS.find(d => d.id === selectedDestination);
      
      await createTrip({
        type: tripType,
        destination: dest.name,
        startDate,
        duration,
        checkInInterval
      });
      
      // On success, redirect to the current trip view
      navigate('/tourist/trips/current');
    } catch (error) {
      setErrorMsg(error.response?.data?.message || 'Failed to create trip. Please try again.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans">
      
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase flex items-center gap-2">
          <Compass className="w-6 h-6 text-red-600" />
          Plan New Trip
        </h1>
        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">
          Establish safety parameters and routing
        </p>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border-l-4 border-red-600 p-4 shadow-sm">
          <p className="text-xs font-bold text-red-900 uppercase tracking-wider">Initialization Error</p>
          <p className="text-[11px] text-red-700 font-medium mt-0.5">{errorMsg}</p>
        </div>
      )}

      <form onSubmit={handleCreateTrip} className="space-y-8">
        
        {/* Solo vs Group Toggle */}
        <section className="space-y-3">
          <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">1. Trip Classification</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setTripType('GROUP')}
              className={`group relative p-4 text-left transition-all duration-200 rounded-none border cursor-pointer ${
                tripType === 'GROUP'
                  ? 'bg-red-50 border-red-600 ring-1 ring-red-600'
                  : 'bg-white border-slate-200 hover:border-red-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-none flex items-center justify-center border transition-all ${tripType === 'GROUP' ? 'bg-red-600 border-red-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-500 group-hover:text-red-600 group-hover:border-red-300'}`}>
                  <Users className="w-5 h-5" />
                </div>
                {tripType === 'GROUP' && <CheckCircle2 className="w-5 h-5 text-red-600" />}
              </div>
              <h3 className={`text-sm font-black uppercase tracking-wider transition-colors ${tripType === 'GROUP' ? 'text-red-700' : 'text-slate-900'}`}>Group Trip</h3>
              <p className={`text-[10px] mt-1 uppercase tracking-wider font-medium ${tripType === 'GROUP' ? 'text-red-600' : 'text-slate-500'}`}>
                Synchronize location with family members and monitor companion distances.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setTripType('SOLO')}
              className={`group relative p-4 text-left transition-all duration-200 rounded-none border cursor-pointer ${
                tripType === 'SOLO'
                  ? 'bg-red-50 border-red-600 ring-1 ring-red-600'
                  : 'bg-white border-slate-200 hover:border-red-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-none flex items-center justify-center border transition-all ${tripType === 'SOLO' ? 'bg-red-600 border-red-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-500 group-hover:text-red-600 group-hover:border-red-300'}`}>
                  <User className="w-5 h-5" />
                </div>
                {tripType === 'SOLO' && <CheckCircle2 className="w-5 h-5 text-red-600" />}
              </div>
              <h3 className={`text-sm font-black uppercase tracking-wider transition-colors ${tripType === 'SOLO' ? 'text-red-700' : 'text-slate-900'}`}>Solo Traveler</h3>
              <p className={`text-[10px] mt-1 uppercase tracking-wider font-medium ${tripType === 'SOLO' ? 'text-red-600' : 'text-slate-500'}`}>
                Automated periodic check-in reminders and direct uplink to Police.
              </p>
            </button>
          </div>
        </section>

        {/* Destination Selection - Flat Grid */}
        <section className="space-y-3">
          <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">2. Primary Destination</h2>
          <div className="bg-white border border-slate-200 p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PRAYAGRAJ_DESTINATIONS.map((dest) => (
                <label 
                  key={dest.id}
                  className={`flex items-start gap-3 p-3 border cursor-pointer transition-colors ${
                    selectedDestination === dest.id 
                      ? 'bg-red-50 border-red-600' 
                      : 'bg-white border-slate-200 hover:border-red-300 hover:bg-slate-50'
                  }`}
                >
                  <input 
                    type="radio" 
                    name="destination" 
                    value={dest.id}
                    checked={selectedDestination === dest.id}
                    onChange={() => setSelectedDestination(dest.id)}
                    className="mt-1 sr-only"
                  />
                  <div className={`w-4 h-4 mt-0.5 rounded-full border flex items-center justify-center shrink-0 ${selectedDestination === dest.id ? 'border-red-600 bg-red-600' : 'border-slate-300 bg-white'}`}>
                    {selectedDestination === dest.id && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                  </div>
                  <div>
                    <h4 className={`text-xs font-bold uppercase tracking-wider ${selectedDestination === dest.id ? 'text-red-700' : 'text-slate-900'}`}>
                      {dest.name}
                    </h4>
                    <p className={`text-[9px] font-bold uppercase tracking-wider mt-0.5 ${selectedDestination === dest.id ? 'text-red-600' : 'text-slate-500'}`}>
                      {dest.category} • {dest.riskLevel}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </section>

        {/* Safety Parameters & Schedule */}
        <section className="space-y-3">
          <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">3. Scheduling & Telemetry</h2>
          <div className="bg-white border border-slate-200 p-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold rounded-none px-3 py-2.5 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors uppercase"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Est. Duration
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold rounded-none px-3 py-2.5 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors uppercase"
                >
                  <option value="Half Day (4 Hours)">Half Day (4 Hours)</option>
                  <option value="Full Day Pilgrimage">Full Day Pilgrimage</option>
                  <option value="2 Days Tour">2 Days Tour</option>
                  <option value="Multi-day Camp">Multi-day Camp</option>
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> Check-in Interval
                </label>
                <select
                  value={checkInInterval}
                  onChange={(e) => setCheckInInterval(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold rounded-none px-3 py-2.5 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors uppercase"
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
        <div className="flex justify-end gap-3 pt-2">
          <Link to="/tourist/dashboard">
            <button type="button" className="px-6 py-2.5 border border-slate-300 text-slate-600 bg-white hover:bg-slate-50 hover:text-slate-900 text-[10px] font-bold uppercase tracking-widest rounded-none transition-colors cursor-pointer">
              Cancel
            </button>
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="group flex items-center justify-center gap-2 px-8 py-2.5 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold uppercase tracking-widest rounded-none disabled:opacity-50 cursor-pointer shadow-sm"
          >
            {isPending ? 'Initializing...' : 'Confirm & Initialize'}
            {!isPending && <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />}
          </button>
        </div>
      </form>
    </div>
  );
}
