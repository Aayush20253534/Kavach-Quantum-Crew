import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Sparkles, Calendar,
  ChevronLeft, Map, BedDouble,
  CheckCircle2, Loader2, MessageSquareText
} from 'lucide-react';
import { tripService } from '../api/tripService';
import { groupService } from '../../groups/api/groupService';
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
  const location = useLocation();
  const tripDraft = location.state?.tripDraft || null;
  const existingTripId = location.state?.existingTripId || tripDraft?.existingTripId || null;
  const shouldAutoGenerate = Boolean(location.state?.autoGenerate && tripDraft);
  const autoGenerateStarted = useRef(false);
  
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  
  const [formData, setFormData] = useState({
    city: tripDraft?.city || '',
    check_in: tripDraft?.check_in || '',
    check_out: tripDraft?.check_out || '',
  });

  const [loadingStep, setLoadingStep] = useState(0);
  const saveTripType = tripDraft?.tripType || 'SOLO';
  const [saving, setSaving] = useState(false);

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

  const generatePlan = async (data) => {
    setStatus('loading');
    setError('');

    try {
      const checkInDate = new Date(data.check_in);
      const checkOutDate = new Date(data.check_out);
      const daysDiff = Math.max(1, Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)));

      const response = await tripService.planTripWithAI({
        city: data.city,
        num_days: daysDiff,
        check_in: data.check_in,
        check_out: data.check_out,
      });

      setResult(response);
      setStatus('success');
    } catch (err) {
      console.error('Failed to plan trip with AI:', err);
      const apiMessage = err?.response?.data?.error?.message || err?.response?.data?.message;
      const apiCode = err?.response?.data?.error?.code;
      const message = apiMessage || err.message || 'Failed to generate trip plan.';
      setError(apiCode ? `${message} (${apiCode})` : message);
      setStatus('error');
    }
  };

  useEffect(() => {
    if (tripDraft) return;
    navigate('/tourist/trips/create', { replace: true });
  }, [navigate, tripDraft]);

  useEffect(() => {
    if (!shouldAutoGenerate || autoGenerateStarted.current) return;
    autoGenerateStarted.current = true;
    void generatePlan({
      city: tripDraft.city,
      check_in: tripDraft.check_in,
      check_out: tripDraft.check_out,
    });
  }, [shouldAutoGenerate, tripDraft]);

  const startTripNow = async (tripId) => {
    await tripService.grantConsent(tripId, 'LOCATION_TRACKING');
    await tripService.grantConsent(tripId, 'EMERGENCY_SHARING');
    return tripService.startTrip(tripId);
  };

  const continueWithoutAI = async () => {
    setSaving(true);
    setError('');
    try {
      let tripId = existingTripId;
      if (!tripId) {
        const trip = await tripService.createTrip({
          locationName: tripDraft?.city || formData.city,
          tripType: saveTripType,
          plannedStartAt: tripDraft?.plannedStartAt || new Date(formData.check_in).toISOString(),
          plannedEndAt: tripDraft?.plannedEndAt || new Date(formData.check_out).toISOString(),
        });
        tripId = trip.id;
      }

      await startTripNow(tripId);
      navigate('/tourist/trips/current', {
        replace: true,
        state: { openGroupView: saveTripType === 'GROUP' },
      });
    } catch (err) {
      setError(err?.response?.data?.error?.message || err.message || 'Failed to start the trip without AI.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveToTrips = async () => {
    setSaving(true);
    setError('');
    try {
      let tripId = existingTripId;

      if (tripId) {
        await tripService.attachAiPlan(tripId, result);
      } else {
        const trip = await tripService.createTrip({
          locationName: formData.city,
          tripType: saveTripType,
          plannedStartAt: tripDraft?.plannedStartAt || new Date(formData.check_in).toISOString(),
          plannedEndAt: tripDraft?.plannedEndAt || new Date(formData.check_out).toISOString(),
          aiPlan: result,
        });
        tripId = trip.id;

        if (saveTripType === 'GROUP') {
          await groupService.createGroupForTrip(tripId);
        }
      }

      await startTripNow(tripId);
      navigate('/tourist/trips/current', { replace: true });
    } catch (err) {
      setError(err?.response?.data?.error?.message || err.message || 'Failed to save and start this trip.');
    } finally {
      setSaving(false);
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

  if (status === 'error' && shouldAutoGenerate && tripDraft) {
    return (
      <div className="max-w-3xl mx-auto pb-12 pt-6 px-4">
        <button
          type="button"
          onClick={() => navigate('/tourist/trips/create', {
            state: {
              destination: { name: tripDraft.city },
              tripType: tripDraft.tripType,
              plannedStartAt: tripDraft.plannedStartAt,
              plannedEndAt: tripDraft.plannedEndAt,
              existingTripId,
              groupLocked: location.state?.groupLocked,
              startAtMode: true,
            },
          })}
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 mb-5"
        >
          <ChevronLeft className="w-4 h-4" /> Back to planning choices
        </button>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
          <div className="flex items-start gap-3">
            <div className="mt-1 w-2 h-2 rounded-full bg-red-500 shrink-0" />
            <div className="min-w-0">
              <h1 className="text-lg font-black text-red-800">AI planner could not generate this trip</h1>
              <p className="mt-1 text-sm text-red-700 break-words">{error}</p>
              <p className="mt-3 text-xs text-red-700/80">
                Your destination and dates are still saved. Retry AI planning or go back and continue without AI.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Trip details</p>
          <h2 className="mt-2 text-2xl font-black text-slate-900">{tripDraft.city}</h2>
          <p className="mt-1 text-sm text-slate-500">{tripDraft.check_in} to {tripDraft.check_out}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => generatePlan({ city: tripDraft.city, check_in: tripDraft.check_in, check_out: tripDraft.check_out })}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800"
            >
              <Sparkles className="w-4 h-4" /> Retry AI planning
            </button>
            <button
              type="button"
              onClick={continueWithoutAI}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Start without AI
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'success' && result) {
    const daysDiff = Math.max(1, Math.ceil((new Date(formData.check_out) - new Date(formData.check_in)) / (1000 * 60 * 60 * 24)));
    
    return (
      <div className="pb-12 animate-in fade-in duration-500">
        {/* Sticky Header */}
        <div className="sticky top-16 bg-white/90 backdrop-blur-xl z-40 border-b border-slate-200 px-3 py-3 mb-5">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <button 
              onClick={() => shouldAutoGenerate ? navigate('/tourist/trips/create', {
                state: {
                  destination: { name: tripDraft.city },
                  tripType: tripDraft.tripType,
                  plannedStartAt: tripDraft.plannedStartAt,
                  plannedEndAt: tripDraft.plannedEndAt,
                  existingTripId,
                  groupLocked: location.state?.groupLocked,
                  startAtMode: true,
                },
              }) : setStatus('idle')}
              className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> {shouldAutoGenerate ? 'Change Trip Details' : 'Edit Preferences'}
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={handleSaveToTrips}
                disabled={saving}
                className="bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white px-6 py-2.5 rounded-lg font-bold text-sm shadow-sm transition-colors flex items-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Save Plan & Start Trip
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-3 space-y-6">
          {/* Trip Hero Summary */}
          <div className="bg-slate-900 rounded-2xl p-5 md:p-6 text-white relative overflow-hidden shadow-sm">
            <div className="absolute top-0 right-0 p-32 bg-gradient-to-bl from-slate-700/50 to-transparent rounded-bl-full opacity-50 pointer-events-none"></div>
            <div className="relative z-10 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/20 rounded-full text-xs font-bold uppercase tracking-widest mb-6">
                <Sparkles className="w-3 h-3 text-emerald-400" /> AI Itinerary
              </div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-2">
                {result.itinerary?.city}
              </h1>
              <p className="text-slate-300 font-medium text-sm flex flex-wrap items-center gap-2">
                <Calendar className="w-5 h-5 opacity-70" />
                {new Date(formData.check_in).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - {new Date(formData.check_out).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                <span className="mx-2 opacity-30">•</span>
                {daysDiff} Days
              </p>
            </div>
          </div>

          {/* Main Layout Grid */}
          <div className="grid lg:grid-cols-12 gap-6">
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

  // The AI planner is route-state driven only. Destination, dates and trip type
  // are always selected on the normal Trips page, never entered again here.
  return (
    <div className="min-h-[45vh] flex items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
    </div>
  );
}
