import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Compass, 
  Users, 
  User, 
  ArrowRight, 
  CheckCircle2, 
  Map,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  RefreshCw
} from 'lucide-react';

export function CreateTripPage() {
  const navigate = useNavigate();
  const [tripType, setTripType] = useState('GROUP'); // 'SOLO' | 'GROUP'
  
  const prayagrajDestinations = [
    { name: 'Triveni Sangam & Ghats', category: 'Holy Confluence', riskLevel: 'Safe', image: '/destinations/sangam.jpg', gallery: ['/destinations/sangam.jpg', '/destinations/kumbh.jpg', '/destinations/temple.jpg'] },
    { name: 'Allahabad Fort', category: 'Historic Monument', riskLevel: 'Safe', image: '/destinations/fort.jpg', gallery: ['/destinations/fort.jpg', '/destinations/bagh.jpg', '/destinations/bhavan.jpg'] },
    { name: 'Anand Bhavan', category: 'Heritage Site', riskLevel: 'Safe', image: '/destinations/bhavan.jpg', gallery: ['/destinations/bhavan.jpg', '/destinations/bagh.jpg', '/destinations/fort.jpg'] },
    { name: 'Alopi Devi Mandir', category: 'Temple Circuit', riskLevel: 'Safe', image: '/destinations/temple.jpg', gallery: ['/destinations/temple.jpg', '/destinations/sangam.jpg', '/destinations/kumbh.jpg'] },
    { name: 'Kumbh Mela Camp', category: 'Pilgrim Grounds', riskLevel: 'Safe', image: '/destinations/kumbh.jpg', gallery: ['/destinations/kumbh.jpg', '/destinations/sangam.jpg', '/destinations/temple.jpg'] },
    { name: 'Khusro Bagh', category: 'Heritage Park', riskLevel: 'Safe', image: '/destinations/bagh.jpg', gallery: ['/destinations/bagh.jpg', '/destinations/bhavan.jpg', '/destinations/fort.jpg'] },
  ];

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedDestination, setSelectedDestination] = useState(prayagrajDestinations[0].name);

  useEffect(() => {
    setSelectedDestination(prayagrajDestinations[selectedIndex].name);
  }, [selectedIndex]);

  const nextSlide = () => setSelectedIndex((prev) => (prev + 1) % prayagrajDestinations.length);
  const prevSlide = () => setSelectedIndex((prev) => (prev - 1 + prayagrajDestinations.length) % prayagrajDestinations.length);

  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [duration, setDuration] = useState('Full Day Pilgrimage');
  const [checkInInterval, setCheckInInterval] = useState('Every 2 Hours');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateTrip = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      navigate('/tourist/trips/current');
    }, 600);
  };

  return (
    <div className="-m-4 sm:-m-6 lg:-m-8 bg-slate-50 min-h-[calc(100vh-64px)] pb-10 font-sans">
      
      {/* VIBRANT BACKGROUND HEADER */}
      <div className="relative overflow-hidden bg-gradient-to-r from-red-600 to-orange-500 shadow-lg px-4 sm:px-6 lg:px-8 py-12">
        <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-10 -translate-y-10">
          <Map className="w-64 h-64 text-white" />
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Compass className="w-8 h-8 text-white" />
              <h1 className="text-3xl font-black text-white tracking-tight uppercase shadow-black drop-shadow-md">Plan a Safe Journey</h1>
            </div>
            <p className="text-xs font-bold text-red-50 uppercase tracking-wider">
              Configure safety check-ins, destination tracking, and companion sync across Prayagraj.
            </p>
          </div>
          <Link to="/tourist/trips/history">
            <button className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white border border-white/40 px-6 py-3 text-xs font-bold uppercase tracking-wider rounded-none transition-colors cursor-pointer">
              View History →
            </button>
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 -mt-6 relative z-20">
        <form onSubmit={handleCreateTrip} className="space-y-8">
          
          {/* Solo vs Group Toggle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <button
              type="button"
              onClick={() => setTripType('GROUP')}
              className={`group relative p-6 border text-left transition-all duration-300 rounded-none overflow-hidden cursor-pointer ${
                tripType === 'GROUP'
                  ? 'bg-white border-red-600 shadow-[0_10px_20px_rgba(220,38,38,0.15)] ring-1 ring-red-600'
                  : 'bg-white border-slate-200 hover:border-red-300 hover:bg-slate-50'
              }`}
            >
              {tripType === 'GROUP' && <div className="absolute top-0 left-0 w-1 h-full bg-red-600"></div>}
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-none flex items-center justify-center border transition-colors ${tripType === 'GROUP' ? 'bg-red-600 border-red-600 text-white' : 'bg-slate-100 border-slate-200 text-slate-500 group-hover:text-red-600 group-hover:border-red-200 group-hover:bg-red-50'}`}>
                  <Users className="w-6 h-6" />
                </div>
                {tripType === 'GROUP' && <CheckCircle2 className="w-5 h-5 text-red-600" />}
              </div>
              <h3 className={`text-sm font-black uppercase tracking-wider transition-colors ${tripType === 'GROUP' ? 'text-red-700' : 'text-slate-900 group-hover:text-red-600'}`}>Group / Family Trip</h3>
              <p className="text-[10px] font-bold text-slate-500 mt-2 uppercase tracking-wider leading-relaxed">
                Synchronize location with family members, share QR invite codes, and monitor companion distances.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setTripType('SOLO')}
              className={`group relative p-6 border text-left transition-all duration-300 rounded-none overflow-hidden cursor-pointer ${
                tripType === 'SOLO'
                  ? 'bg-white border-red-600 shadow-[0_10px_20px_rgba(220,38,38,0.15)] ring-1 ring-red-600'
                  : 'bg-white border-slate-200 hover:border-red-300 hover:bg-slate-50'
              }`}
            >
              {tripType === 'SOLO' && <div className="absolute top-0 left-0 w-1 h-full bg-red-600"></div>}
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-none flex items-center justify-center border transition-colors ${tripType === 'SOLO' ? 'bg-red-600 border-red-600 text-white' : 'bg-slate-100 border-slate-200 text-slate-500 group-hover:text-red-600 group-hover:border-red-200 group-hover:bg-red-50'}`}>
                  <User className="w-6 h-6" />
                </div>
                {tripType === 'SOLO' && <CheckCircle2 className="w-5 h-5 text-red-600" />}
              </div>
              <h3 className={`text-sm font-black uppercase tracking-wider transition-colors ${tripType === 'SOLO' ? 'text-red-700' : 'text-slate-900 group-hover:text-red-600'}`}>Solo Traveler Trip</h3>
              <p className="text-[10px] font-bold text-slate-500 mt-2 uppercase tracking-wider leading-relaxed">
                Automated periodic check-in reminders and direct link to Tourist Police first responders.
              </p>
            </button>
          </div>

          {/* Destination Selection - Light Theme Coverflow Carousel */}
          <div className="bg-white border border-slate-200 shadow-xl rounded-none overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 p-5">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <Map className="w-4 h-4 text-red-600" />
                1. Select Prayagraj Destination
              </h2>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1 ml-6">
                Navigate the carousel to choose your primary destination
              </p>
            </div>
            
            {/* LIGHT AND VIBRANT background container */}
            <div className="p-6 md:p-12 bg-white relative overflow-hidden flex flex-col items-center">
              
              {/* Carousel Container mimicking the reference image pill shape */}
              <div className="relative z-10 w-full max-w-5xl mx-auto border-2 border-slate-200 rounded-[4rem] p-6 sm:p-8 md:p-10 flex items-center justify-between shadow-2xl bg-slate-50/80 backdrop-blur-md">
                
                <button type="button" onClick={prevSlide} className="z-40 p-3 md:p-4 rounded-full bg-white border border-slate-300 text-slate-700 hover:bg-red-50 hover:text-red-600 hover:border-red-300 shadow-lg transition cursor-pointer hover:scale-110 active:scale-95">
                  <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
                </button>
                
                <div className="flex-1 flex justify-center items-center h-64 sm:h-80 md:h-[450px] relative perspective-[1200px] overflow-hidden sm:overflow-visible">
                  {prayagrajDestinations.map((dest, i) => {
                    let diff = i - selectedIndex;
                    const len = prayagrajDestinations.length;
                    
                    // Normalize diff to be between -2 and +3 for a length of 6
                    if (diff > Math.floor(len / 2)) diff -= len;
                    if (diff < -Math.floor(len / 2)) diff += len;

                    // Only show items within distance 2
                    if (Math.abs(diff) > 2) return null;

                    let transformStyle = {};
                    let zIndex = 10;
                    let opacity = 1;

                    if (diff === 0) {
                      transformStyle = { transform: 'scale(1) translateX(0) translateZ(50px)' };
                      zIndex = 30;
                    } else if (diff === -1) {
                      transformStyle = { transform: 'scale(0.85) translateX(-75%) translateZ(0px)' };
                      zIndex = 20;
                      opacity = 0.8;
                    } else if (diff === 1) {
                      transformStyle = { transform: 'scale(0.85) translateX(75%) translateZ(0px)' };
                      zIndex = 20;
                      opacity = 0.8;
                    } else if (diff === -2) {
                      transformStyle = { transform: 'scale(0.7) translateX(-140%) translateZ(-50px)' };
                      zIndex = 10;
                      opacity = 0.6;
                    } else if (diff === 2) {
                      transformStyle = { transform: 'scale(0.7) translateX(140%) translateZ(-50px)' };
                      zIndex = 10;
                      opacity = 0.6;
                    }

                    return (
                      <div 
                        key={dest.name}
                        onClick={() => { if (diff !== 0) setSelectedIndex(i); }}
                        className="absolute transition-all duration-700 ease-[cubic-bezier(0.25,0.8,0.25,1)] cursor-pointer overflow-hidden rounded-[2rem] shadow-[0_15px_35px_rgba(0,0,0,0.15)] border border-slate-200 bg-white"
                        style={{
                          ...transformStyle,
                          zIndex,
                          opacity,
                          width: 'min(280px, 45%)',
                          aspectRatio: '3/4',
                        }}
                      >
                        <img src={dest.image} alt={dest.name} className="absolute inset-0 w-full h-full object-cover" />
                        
                        {/* Light gradient overlay for center item text */}
                        <div className={`absolute inset-0 transition-opacity duration-300 ${diff === 0 ? 'bg-black/20 opacity-100 hover:bg-black/30' : 'bg-slate-100/50 hover:bg-transparent'}`} />
                        
                        {diff === 0 && (
                          <div className="absolute inset-x-0 bottom-0 p-5 md:p-6 bg-gradient-to-t from-slate-900 via-slate-900/70 to-transparent">
                            <span className="text-[9px] md:text-[10px] font-black bg-red-600 text-white px-3 py-1 rounded-sm uppercase tracking-widest mb-2 inline-block shadow-sm">
                              {dest.category}
                            </span>
                            <h4 className="text-white text-sm md:text-lg font-black uppercase tracking-wider leading-tight drop-shadow-md">
                              {dest.name}
                            </h4>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <button type="button" onClick={nextSlide} className="z-40 p-3 md:p-4 rounded-full bg-white border border-slate-300 text-slate-700 hover:bg-red-50 hover:text-red-600 hover:border-red-300 shadow-lg transition cursor-pointer hover:scale-110 active:scale-95">
                  <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
                </button>
              </div>

            </div>
          </div>

          {/* Safety Parameters & Schedule */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-none overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 p-5">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-red-600" />
                2. Safety Parameters & Timing
              </h2>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1 ml-6">Define automated safety check-in intervals and travel schedule</p>
            </div>
            
            <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="flex flex-col">
                <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Travel Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold rounded-none px-4 py-3 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors shadow-none uppercase"
                />
              </div>

              <div className="flex flex-col">
                <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Estimated Duration</label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold rounded-none px-4 py-3 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors shadow-none uppercase"
                >
                  <option value="Half Day (4 Hours)">Half Day (4 Hours)</option>
                  <option value="Full Day Pilgrimage">Full Day Pilgrimage</option>
                  <option value="2 Days Tour">2 Days Tour</option>
                  <option value="Multi-day Kumbh Camp">Multi-day Kumbh Camp</option>
                </select>
              </div>

              <div className="flex flex-col">
                <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Safety Check-In Ping</label>
                <select
                  value={checkInInterval}
                  onChange={(e) => setCheckInInterval(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold rounded-none px-4 py-3 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors shadow-none uppercase"
                >
                  <option value="Every 1 Hour">Every 1 Hour (High Caution)</option>
                  <option value="Every 2 Hours">Every 2 Hours (Recommended)</option>
                  <option value="Every 4 Hours">Every 4 Hours</option>
                  <option value="Manual Only">Manual Only</option>
                </select>
              </div>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t border-slate-200">
            <Link to="/tourist/dashboard" className="w-full sm:w-auto">
              <button type="button" className="w-full sm:w-auto px-8 py-3.5 border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 text-xs font-bold uppercase tracking-widest rounded-none transition-colors cursor-pointer">
                Cancel
              </button>
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto group flex items-center justify-center gap-3 px-10 py-3.5 bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-widest rounded-none shadow-[0_0_15px_rgba(220,38,38,0.4)] hover:shadow-[0_0_25px_rgba(220,38,38,0.6)] transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Initializing...' : 'Start Trip & Activate Safe Radar'}
              {!isSubmitting && <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
