import React from 'react';
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
  Activity
} from 'lucide-react';
import { useTripHistory } from '../api/tripQueries';

export function TripHistoryPage() {
  const { data: tripHistoryData, isLoading, error } = useTripHistory();
  
  // Depending on how the API wraps the data, handle both array directly or .items
  const trips = Array.isArray(tripHistoryData) ? tripHistoryData : tripHistoryData?.items || [];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-red-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-600 p-4 shadow-sm max-w-4xl mx-auto">
        <p className="text-xs font-bold text-red-900 uppercase tracking-wider">Data Retrieval Error</p>
        <p className="text-[11px] text-red-700 font-medium mt-0.5">Failed to load trip history.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <Compass className="w-6 h-6 text-red-600" />
            Travel History & Certificates
          </h1>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">
            Archived missions and safety records
          </p>
        </div>

        <Link to="/tourist/trips/create">
          <button className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 cursor-pointer transition-colors border border-transparent">
            Plan New Trip <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </Link>
      </div>

      {trips.length === 0 ? (
        <div className="bg-white border border-slate-200 p-12 text-center shadow-sm">
           <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-3" />
           <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">No completed trips found in your archive.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {trips.map((trip) => {
            const isCompleted = trip.status === 'COMPLETED';
            const isCancelled = trip.status === 'CANCELLED';
            const isPlanned = trip.status === 'PLANNED';
            
            return (
              <div key={trip.id} className="bg-white border border-slate-200 p-5 shadow-sm hover:border-red-300 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  
                  {/* Info Column */}
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {isCompleted && (
                        <span className="bg-green-100 text-green-800 border border-green-200 text-[9px] font-bold px-2 py-0.5 uppercase tracking-wider flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> SUCCESSFUL
                        </span>
                      )}
                      {isCancelled && (
                        <span className="bg-slate-100 text-slate-600 border border-slate-300 text-[9px] font-bold px-2 py-0.5 uppercase tracking-wider flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> CANCELLED
                        </span>
                      )}
                      {isPlanned && (
                        <span className="bg-orange-100 text-orange-800 border border-orange-200 text-[9px] font-bold px-2 py-0.5 uppercase tracking-wider flex items-center gap-1">
                          <Activity className="w-3 h-3" /> PLANNED
                        </span>
                      )}
                      <span className="font-mono text-[10px] text-slate-400 font-bold uppercase">ID: {trip.id?.substring(0,8)}</span>
                    </div>
                    
                    <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
                      {trip.destination || 'Custom Circuit'}
                    </h3>
                    
                    <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {trip.startDate ? new Date(trip.startDate).toLocaleDateString() : 'N/A'}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {trip.duration || 'N/A'}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        {trip.type}
                      </span>
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-6 shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Safety Index</p>
                      <p className={`text-lg font-black ${isCompleted ? 'text-green-600' : 'text-slate-400'}`}>
                        {isCompleted ? '100 / 100' : 'N/A'}
                      </p>
                    </div>
                    
                    {isCompleted && (
                      <button
                        type="button"
                        onClick={() => alert(`Downloading certificate for ${trip.id}`)}
                        className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-4 py-2 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" /> Certificate
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
