import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Compass, 
  Calendar, 
  CheckCircle2, 
  Download, 
  ArrowRight,
  Clock,
  Users,
  MapPin,
  XCircle,
  Activity,
  History
} from 'lucide-react';
import { useTripHistory } from '../api/tripQueries';

export function TripHistoryPage() {
  const { data: tripHistoryData, isLoading, error } = useTripHistory();
  
  // Depending on how the API wraps the data, handle both array directly or .items
  const trips = Array.isArray(tripHistoryData) ? tripHistoryData : tripHistoryData?.items || [];

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-[#e11d48] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#fef2f2] border border-[#fecaca] p-4 rounded-md shadow-sm max-w-4xl mx-auto flex items-start gap-3">
        <XCircle className="w-5 h-5 text-[#ef4444] shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-bold text-[#b91c1c] uppercase tracking-wider">Data Retrieval Error</p>
          <p className="text-[12px] text-[#991b1b] font-medium mt-0.5">Failed to load trip history.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 max-w-[1000px] mx-auto pb-10 font-sans transition-all duration-700 transform ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[22px] font-black text-slate-900 tracking-tight flex items-center gap-2">
            Travel History & Certificates
          </h1>
          <p className="text-[13px] text-slate-500 font-medium mt-1">
            Archived missions and safety records
          </p>
        </div>

        <Link to="/tourist/trips/create">
          <button className="bg-[#e11d48] hover:bg-[#be123c] text-white px-6 py-3 text-[12px] font-bold uppercase tracking-widest rounded-md shadow-[0_4px_14px_0_rgba(225,29,72,0.39)] transition-all active:scale-95 flex items-center gap-2 cursor-pointer">
            Plan New Trip <ArrowRight className="w-4 h-4" />
          </button>
        </Link>
      </div>

      {trips.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-lg p-12 text-center shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
           <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-6">
             <History className="w-10 h-10 text-slate-300" />
           </div>
           <h3 className="text-[18px] font-black text-slate-900 tracking-wide mb-2">No Archives Found</h3>
           <p className="text-[13px] text-slate-500 font-medium">You have no completed or cancelled trips in your archive.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {trips.map((trip, index) => {
            const isCompleted = trip.status === 'COMPLETED';
            const isCancelled = trip.status === 'CANCELLED';
            const isPlanned = trip.status === 'PLANNED';
            
            return (
              <div 
                key={trip.id} 
                className={`bg-white border border-slate-100 rounded-lg p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:border-red-200 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 transform ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
                style={{ transitionDelay: `${150 + (index * 75)}ms` }}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  
                  {/* Info Column */}
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      {isCompleted && (
                        <span className="bg-[#f0fdf4] text-[#16a34a] border border-[#dcfce7] text-[10px] font-bold px-2.5 py-1 uppercase tracking-widest rounded-lg flex items-center gap-1.5 shadow-sm">
                          <CheckCircle2 className="w-3.5 h-3.5" /> SUCCESSFUL
                        </span>
                      )}
                      {isCancelled && (
                        <span className="bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold px-2.5 py-1 uppercase tracking-widest rounded-lg flex items-center gap-1.5 shadow-sm">
                          <XCircle className="w-3.5 h-3.5" /> CANCELLED
                        </span>
                      )}
                      {isPlanned && (
                        <span className="bg-orange-100 text-orange-800 border border-orange-200 text-[10px] font-bold px-2.5 py-1 uppercase tracking-widest rounded-lg flex items-center gap-1.5 shadow-sm">
                          <Activity className="w-3.5 h-3.5" /> PLANNED
                        </span>
                      )}
                      <span className="font-mono text-[11px] text-slate-400 font-bold uppercase bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">ID: {trip.id?.substring(0,8)}</span>
                    </div>
                    
                    <h3 className="text-[18px] font-black text-slate-900 tracking-tight">
                      {trip.destination || 'Custom Circuit'}
                    </h3>
                    
                    <div className="flex flex-wrap items-center gap-4 text-[12px] font-bold text-slate-500 uppercase tracking-widest">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {trip.startDate ? new Date(trip.startDate).toLocaleDateString() : 'N/A'}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-slate-400" />
                        {trip.duration || 'N/A'}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-slate-400" />
                        {trip.type}
                      </span>
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-slate-100 pt-5 md:pt-0 md:pl-8 shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Safety Index</p>
                      <p className={`text-2xl font-black ${isCompleted ? 'text-[#16a34a]' : 'text-slate-300'}`}>
                        {isCompleted ? '100 / 100' : 'N/A'}
                      </p>
                    </div>
                    
                    {isCompleted && (
                      <button
                        type="button"
                        onClick={() => alert(`Downloading certificate for ${trip.id}`)}
                        className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-5 py-2.5 text-[11px] font-bold uppercase tracking-widest rounded-md flex items-center gap-2 cursor-pointer transition-colors shadow-sm"
                      >
                        <Download className="w-4 h-4" /> Certificate
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
