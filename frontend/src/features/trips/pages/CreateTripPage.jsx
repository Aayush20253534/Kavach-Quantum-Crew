import React, { useState, useEffect } from 'react';
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
  { 
    id: 'sangam', 
    name: 'Triveni Sangam & Ghats', 
    category: 'Holy Confluence', 
    riskLevel: 'Safe',
    image: 'https://images.unsplash.com/photo-1596727147705-61a532a659bd?auto=format&fit=crop&q=80&w=800',
    description: 'The sacred confluence of the Ganges, Yamuna, and mythical Saraswati rivers.'
  },
  { 
    id: 'fort', 
    name: 'Allahabad Fort', 
    category: 'Historic Monument', 
    riskLevel: 'Safe',
    image: 'https://images.unsplash.com/photo-1587595431973-160d0d94add1?auto=format&fit=crop&q=80&w=800',
    description: 'A massive fort built by Emperor Akbar in 1583 on the banks of the Yamuna.'
  },
  { 
    id: 'bhavan', 
    name: 'Anand Bhavan', 
    category: 'Heritage Site', 
    riskLevel: 'Safe',
    image: 'https://images.unsplash.com/photo-1582510003544-4d00b7f7415e?auto=format&fit=crop&q=80&w=800',
    description: 'The historic former residence of the Nehru family, now a museum.'
  },
  { 
    id: 'temple', 
    name: 'Alopi Devi Mandir', 
    category: 'Temple Circuit', 
    riskLevel: 'Safe',
    image: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&q=80&w=800',
    description: 'A unique temple where there is no deity, but a wooden carriage is worshipped.'
  },
  { 
    id: 'kumbh', 
    name: 'Kumbh Mela Camp', 
    category: 'Pilgrim Grounds', 
    riskLevel: 'Safe',
    image: 'https://images.unsplash.com/photo-1555580168-9c7ee7452d9a?auto=format&fit=crop&q=80&w=800',
    description: 'The vast grounds that host the largest peaceful gathering in the world.'
  },
  { 
    id: 'bagh', 
    name: 'Khusro Bagh', 
    category: 'Heritage Park', 
    riskLevel: 'Safe',
    image: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&q=80&w=800',
    description: 'A large walled garden housing the tombs of Prince Khusro and his family.'
  },
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

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

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
    <div className={`max-w-4xl mx-auto font-sans pb-10 transition-all duration-700 transform ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
      
      <div className="mb-8">
        <h1 className="text-[22px] font-black text-slate-900 tracking-tight flex items-center gap-2">
          Plan New Trip
        </h1>
        <p className="text-[13px] text-slate-500 font-medium mt-1">
          Establish safety parameters and routing before your journey.
        </p>
      </div>

      {errorMsg && (
        <div className="bg-[#fef2f2] border border-[#fecaca] p-4 rounded-md mb-6 shadow-sm flex items-start gap-3">
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
              className={`group relative p-5 text-left transition-all duration-300 rounded-lg border cursor-pointer ${
                tripType === 'GROUP'
                  ? 'bg-red-50 border-red-200 shadow-[0_4px_20px_rgba(225,29,72,0.08)] ring-1 ring-red-500/20'
                  : 'bg-white border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:border-red-200 hover:shadow-md'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-md flex items-center justify-center transition-all ${tripType === 'GROUP' ? 'bg-[#e11d48] text-white shadow-md' : 'bg-slate-50 text-slate-500 group-hover:text-red-500 group-hover:bg-red-50'}`}>
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
              className={`group relative p-5 text-left transition-all duration-300 rounded-lg border cursor-pointer ${
                tripType === 'SOLO'
                  ? 'bg-red-50 border-red-200 shadow-[0_4px_20px_rgba(225,29,72,0.08)] ring-1 ring-red-500/20'
                  : 'bg-white border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:border-red-200 hover:shadow-md'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-md flex items-center justify-center transition-all ${tripType === 'SOLO' ? 'bg-[#e11d48] text-white shadow-md' : 'bg-slate-50 text-slate-500 group-hover:text-red-500 group-hover:bg-red-50'}`}>
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
          <div className="flex items-center justify-between pl-1">
            <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">2. Primary Destination</h2>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              {selectedDestination ? PRAYAGRAJ_DESTINATIONS.findIndex(d => d.id === selectedDestination) + 1 : 0} / {PRAYAGRAJ_DESTINATIONS.length}
            </span>
          </div>
          
          <div className="relative w-full overflow-hidden rounded-2xl bg-black/5 p-4 py-8">
            <div className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {PRAYAGRAJ_DESTINATIONS.map((dest) => {
                const isSelected = selectedDestination === dest.id;
                return (
                  <label 
                    key={dest.id}
                    className={`relative flex-shrink-0 snap-center cursor-pointer transition-all duration-500 ease-out ${
                      isSelected ? 'w-72 sm:w-80 h-[400px] scale-100 z-10' : 'w-56 sm:w-64 h-[340px] scale-95 opacity-60 hover:opacity-100 z-0 mt-[30px]'
                    }`}
                  >
                    <input 
                      type="radio" 
                      name="destination" 
                      value={dest.id}
                      checked={isSelected}
                      onChange={() => setSelectedDestination(dest.id)}
                      className="sr-only"
                    />
                    
                    {/* Card Background & Image */}
                    <div className={`absolute inset-0 rounded-3xl overflow-hidden shadow-2xl transition-all duration-500 ${isSelected ? 'ring-2 ring-white/50 shadow-[0_0_30px_rgba(255,255,255,0.3)]' : 'ring-1 ring-white/10'}`}>
                      <img 
                        src={dest.image} 
                        alt={dest.name}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />
                      {isSelected && <div className="absolute inset-0 ring-1 ring-inset ring-white/20 rounded-3xl" />}
                    </div>

                    {/* Card Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white transform transition-all duration-500">
                      <div className={`flex items-center gap-2 mb-3 transition-all duration-500 ${isSelected ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                        <span className="px-2.5 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold tracking-wider uppercase border border-white/10">
                          {dest.category}
                        </span>
                        <span className="px-2.5 py-1 bg-green-500/20 backdrop-blur-md rounded-full text-[10px] font-bold tracking-wider text-green-300 border border-green-500/20">
                          {dest.riskLevel}
                        </span>
                      </div>
                      
                      <h3 className={`font-bold tracking-wide transition-all duration-500 ${isSelected ? 'text-2xl mb-2' : 'text-lg mb-0'}`}>
                        {dest.name}
                      </h3>
                      
                      <p className={`text-sm text-gray-300 leading-relaxed transition-all duration-500 overflow-hidden ${isSelected ? 'opacity-100 max-h-24 mt-2' : 'opacity-0 max-h-0'}`}>
                        {dest.description}
                      </p>
                      
                      {isSelected && (
                        <div className="mt-5 flex items-center gap-2 text-xs font-medium text-white/70">
                           <MapPin className="w-3.5 h-3.5" />
                           Prayagraj, Uttar Pradesh
                        </div>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        </section>

        {/* Safety Parameters & Schedule */}
        <section className="space-y-4">
          <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">3. Scheduling & Telemetry</h2>
          <div className="bg-white border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-6 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="flex flex-col">
                <label className="text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-slate-400" /> Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-[13px] font-semibold rounded-md px-4 py-3 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all uppercase"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-slate-400" /> Est. Duration
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-[13px] font-semibold rounded-md px-4 py-3 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all uppercase appearance-none cursor-pointer"
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
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-[13px] font-semibold rounded-md px-4 py-3 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all uppercase appearance-none cursor-pointer"
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
            <button type="button" className="w-full sm:w-auto px-8 py-3.5 border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 hover:text-slate-900 text-[12px] font-bold uppercase tracking-widest rounded-md transition-all cursor-pointer shadow-sm">
              Cancel
            </button>
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="w-full sm:w-auto group flex items-center justify-center gap-2 px-10 py-3.5 bg-[#e11d48] hover:bg-[#be123c] text-white text-[12px] font-bold uppercase tracking-widest rounded-md disabled:opacity-50 cursor-pointer shadow-[0_4px_14px_0_rgba(225,29,72,0.39)] transition-all active:scale-95"
          >
            {isPending ? 'Initializing...' : 'Confirm & Initialize'}
            {!isPending && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
          </button>
        </div>
      </form>
    </div>
  );
}
