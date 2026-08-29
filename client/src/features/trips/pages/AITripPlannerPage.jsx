import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, MapPin, Calendar, Compass, 
  ChevronLeft, Map, BedDouble, ArrowRight,
  CheckCircle2, Loader2, MessageSquareText
} from 'lucide-react';
import { tripService } from '../api/tripService';
import { ItineraryTimeline } from '../components/ai-planner/ItineraryTimeline';
import { HotelRecommendations } from '../components/ai-planner/HotelRecommendations';

const LOADING_STEPS = [
  "Analyzing destination and travel dates...",
  "Searching for highly-rated accommodations...",
  "Optimizing daily routes and travel times...",
  "Finalizing your personalized itinerary..."
];

export function AITripPlannerPage() {
  const navigate = useNavigate();
  
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  
  const [formData, setFormData] = useState({
    city: '',
    check_in: '',
    check_out: '',
  });

  const [loadingStep, setLoadingStep] = useState(0);
  const [saveTripType, setSaveTripType] = useState('SOLO');

  useEffect(() => {
    let interval;
    if (status === 'loading') {
      interval = setInterval(() => {
        setLoadingStep((prev) => Math.min(prev + 1, LOADING_STEPS.length - 1));
      }, 800);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(interval);
  }, [status]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePlanTrip = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setError('');
    
    try {
      const checkInDate = new Date(formData.check_in);
      const checkOutDate = new Date(formData.check_out);
      const daysDiff = Math.max(1, Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)));
      
      const response = await tripService.planTripWithAI({
        city: formData.city,
        num_days: daysDiff,
        check_in: formData.check_in,
        check_out: formData.check_out,
      });
      
      setResult(response);
      setStatus('success');
    } catch (err) {
      console.error('Failed to plan trip with AI:', err);
      setError(err?.response?.data?.error?.message || err.message || 'Failed to generate trip plan.');
      setStatus('error');
    }
  };

  const handleSaveToTrips = async () => {
    try {
      await tripService.createTrip({
        locationName: formData.city,
        tripType: saveTripType,
        plannedStartAt: new Date(formData.check_in).toISOString(),
        plannedEndAt: new Date(formData.check_out).toISOString(),
      });
      navigate('/tourist/trips/current', { replace: true });
    } catch (err) {
      alert('Failed to save trip to backend: ' + err.message);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center max-w-lg mx-auto">
        <div className="w-16 h-16 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center mb-8 shadow-sm">
          <Loader2 className="w-8 h-8 text-slate-900 animate-spin" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-6">Crafting Your Journey</h2>
        <div className="w-full space-y-4">
          {LOADING_STEPS.map((step, index) => {
            const isActive = index === loadingStep;
            const isCompleted = index < loadingStep;
            return (
              <div key={index} className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-500 ${isActive ? 'bg-white border border-slate-200 shadow-sm' : 'opacity-50'}`}>
                {isCompleted ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                ) : isActive ? (
                  <Loader2 className="w-5 h-5 text-slate-900 animate-spin" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-slate-300" />
                )}
                <span className={`text-sm font-semibold ${isActive ? 'text-slate-900' : 'text-slate-500'}`}>
                  {step}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (status === 'success' && result) {
    const daysDiff = Math.max(1, Math.ceil((new Date(formData.check_out) - new Date(formData.check_in)) / (1000 * 60 * 60 * 24)));
    
    return (
      <div className="pb-24 animate-in fade-in duration-500">
        {/* Sticky Header */}
        <div className="sticky top-16 bg-white/80 backdrop-blur-xl z-40 border-b border-slate-200 px-4 py-4 mb-8">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <button 
              onClick={() => setStatus('idle')}
              className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Edit Preferences
            </button>
            <div className="flex items-center gap-3">
              <select
                value={saveTripType}
                onChange={(e) => setSaveTripType(e.target.value)}
                className="bg-slate-100 border-none text-sm font-bold text-slate-700 py-2.5 pl-4 pr-8 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none cursor-pointer appearance-none"
                style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23475569%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.7rem top 50%', backgroundSize: '0.65rem auto' }}
              >
                <option value="SOLO">Solo Trip</option>
                <option value="GROUP">Group Trip</option>
              </select>
              <button 
                onClick={handleSaveToTrips}
                className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-lg font-bold text-sm shadow-sm transition-colors"
              >
                Add to My Trips
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 space-y-12">
          {/* Trip Hero Summary */}
          <div className="bg-slate-900 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 p-32 bg-gradient-to-bl from-slate-700/50 to-transparent rounded-bl-full opacity-50 pointer-events-none"></div>
            <div className="relative z-10 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/20 rounded-full text-xs font-bold uppercase tracking-widest mb-6">
                <Sparkles className="w-3 h-3 text-emerald-400" /> AI Itinerary
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                {result.itinerary?.city}
              </h1>
              <p className="text-slate-300 font-medium text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5 opacity-70" />
                {new Date(formData.check_in).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - {new Date(formData.check_out).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                <span className="mx-2 opacity-30">•</span>
                {daysDiff} Days
              </p>
            </div>
          </div>

          {/* Main Layout Grid */}
          <div className="grid lg:grid-cols-12 gap-10">
            {/* Left Column: Hotels */}
            <div className="lg:col-span-4 space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <BedDouble className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900">Stays</h2>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Top Options</p>
                </div>
              </div>
              
              {result.hotels && result.hotels.hotels && result.hotels.hotels.length > 0 ? (
                <HotelRecommendations hotels={result.hotels.hotels} />
              ) : (
                <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center text-slate-500 text-sm font-medium">
                  No hotel recommendations available.
                </div>
              )}
            </div>

            {/* Right Column: Itinerary */}
            <div className="lg:col-span-8 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Map className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900">Itinerary</h2>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Route Plan</p>
                  </div>
                </div>
                <button className="text-sm font-bold text-slate-600 hover:text-slate-900 flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                  <MessageSquareText className="w-4 h-4" /> Ask AI to refine
                </button>
              </div>

              {result.itinerary && result.itinerary.days && result.itinerary.days.length > 0 ? (
                <ItineraryTimeline days={result.itinerary.days} />
              ) : (
                <div className="p-8 bg-slate-50 border border-slate-200 rounded-3xl text-center text-slate-500 font-medium">
                  Failed to generate a detailed itinerary.
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Floating AI Assistant Action */}
        <button className="fixed bottom-8 right-8 w-14 h-14 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-105 transition-transform group z-50">
          <Sparkles className="w-6 h-6 group-hover:hidden" />
          <MessageSquareText className="w-6 h-6 hidden group-hover:block" />
        </button>
      </div>
    );
  }

  // IDLE / FORM STATE
  return (
    <div className="max-w-5xl mx-auto pb-16 pt-4 px-4">
      <button 
        onClick={() => navigate('/tourist/trips/create')}
        className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors mb-10"
      >
        <ChevronLeft className="w-4 h-4" /> Back to Manual Planning
      </button>

      <div className="text-center max-w-2xl mx-auto mb-12">
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
          Intelligent Travel Planning
        </h1>
        <p className="text-lg text-slate-500 font-medium leading-relaxed">
          Specify your destination and dates. Our AI will curate a highly optimized itinerary and recommend accommodations tailored for you.
        </p>
      </div>

      <div className="max-w-3xl mx-auto">
        <form onSubmit={handlePlanTrip} className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-200 p-8 md:p-12">
          {error && (
            <div className="mb-8 p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 text-sm font-semibold flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-8">
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Destination
              </label>
              <input
                type="text"
                name="city"
                required
                value={formData.city}
                onChange={handleChange}
                placeholder="Where do you want to go?"
                className="w-full bg-transparent border-b-2 border-slate-200 px-2 py-3 text-2xl md:text-3xl font-black text-slate-900 placeholder:text-slate-300 focus:border-slate-900 outline-none transition-colors"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Check In
                </label>
                <input
                  type="date"
                  name="check_in"
                  required
                  value={formData.check_in}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-900 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition-all"
                />
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Check Out
                </label>
                <input
                  type="date"
                  name="check_out"
                  required
                  value={formData.check_out}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-900 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition-all"
                />
              </div>
            </div>

            <div className="pt-8 flex justify-center">
              <button
                type="submit"
                className="w-full md:w-auto bg-slate-900 hover:bg-slate-800 text-white px-10 py-4 rounded-xl font-black text-sm tracking-wide flex items-center justify-center gap-3 shadow-md hover:shadow-lg transition-all"
              >
                Start Planning <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
