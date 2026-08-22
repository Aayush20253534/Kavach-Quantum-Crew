import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  AlertTriangle, 
  MapPin, 
  Camera, 
  ArrowRight, 
  CheckCircle2, 
  History
} from 'lucide-react';

export function ReportIncidentPage() {
  const navigate = useNavigate();
  const [category, setCategory] = useState('Crowd Overcrowding / Stampede Risk');
  const [severity, setSeverity] = useState('High');
  const [location, setLocation] = useState('Sangam Ghat Sector 4, Prayagraj (25.4358° N, 81.8463° E)');
  const [description, setDescription] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const categories = [
    'Crowd Overcrowding / Stampede Risk',
    'Medical Emergency / Heatstroke',
    'Harassment / Eve-Teasing',
    'Lost Person / Child / Elder',
    'Overcharging / Tourist Scam',
    'Theft / Pickpocketing',
    'Deep Water / Barricade Breach',
    'Other Safety Concern',
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 800);
  };

  return (
    <div className="max-w-[800px] mx-auto space-y-6 pb-10 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[22px] font-black text-slate-900 tracking-tight">Report a Safety Concern</h1>
          </div>
          <p className="text-[13px] text-slate-500 font-medium mt-1">
            Directly transmitted to the nearest Tourist Police Assistance Booth & Control Room.
          </p>
        </div>
        <Link to="/tourist/incidents/history">
          <button className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-6 py-3 rounded-md font-bold text-[12px] uppercase tracking-widest transition-colors flex items-center gap-2 cursor-pointer shadow-sm">
            <History className="w-4 h-4" /> Past Reports
          </button>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 overflow-hidden">
        {!submitted ? (
          <form onSubmit={handleSubmit}>
            <div className="p-6 sm:p-8 space-y-6">
              
              {/* Category */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">Incident Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-[14px] font-semibold rounded-md px-4 py-3.5 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all appearance-none cursor-pointer"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Severity Level */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">Severity Level</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { level: 'Low', desc: 'Informational', activeClass: 'bg-green-50 border-green-200 ring-2 ring-green-100 text-green-800' },
                    { level: 'Medium', desc: 'Requires Patrol', activeClass: 'bg-amber-50 border-amber-200 ring-2 ring-amber-100 text-amber-800' },
                    { level: 'High', desc: 'Urgent Action', activeClass: 'bg-red-50 border-red-200 ring-2 ring-red-100 text-red-800' },
                  ].map((s) => (
                    <button
                      type="button"
                      key={s.level}
                      onClick={() => setSeverity(s.level)}
                      className={`p-4 rounded-lg border text-left transition-all cursor-pointer ${
                        severity === s.level
                          ? s.activeClass
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:shadow-sm'
                      }`}
                    >
                      <p className="text-[14px] font-black tracking-wide">{s.level}</p>
                      <p className={`text-[11px] mt-0.5 font-medium ${severity === s.level ? 'opacity-80' : 'text-slate-400'}`}>{s.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Auto-detected GPS location */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">Location (Auto-detected via GPS)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <MapPin className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-[13px] font-semibold rounded-md pl-11 pr-4 py-3.5 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">Incident Description</label>
                <textarea
                  placeholder="Describe what happened, nearby landmarks (e.g. Near Boat Ghat #4 or Fort Gate), or persons involved..."
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-[14px] font-medium rounded-md px-4 py-3.5 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all resize-none"
                />
              </div>

              {/* Photo Upload Mockup */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">Attach Photo / Evidence (Optional)</label>
                <div className="p-8 rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-center space-y-2 cursor-pointer hover:border-red-300 hover:bg-red-50/30 transition-colors">
                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center border border-slate-200 shadow-sm mb-1">
                    <Camera className="w-5 h-5 text-slate-400" />
                  </div>
                  <span className="text-[13px] text-slate-700 font-semibold">Click to upload photo from camera</span>
                  <span className="text-[11px] text-slate-400 font-medium">PNG, JPG up to 10MB</span>
                </div>
              </div>

              {/* Anonymous Check */}
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="anon"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="h-5 w-5 rounded border-slate-300 text-red-600 focus:ring-red-500 cursor-pointer"
                />
                <label htmlFor="anon" className="text-[12px] text-slate-600 font-medium cursor-pointer select-none">
                  Submit anonymously (Do not disclose my Tourist Safety ID to public records)
                </label>
              </div>
            </div>

            <div className="p-6 sm:p-8 pt-0 flex flex-col-reverse sm:flex-row justify-end gap-3 border-t border-slate-50 mt-4 bg-slate-50/50">
              <Link to="/tourist/dashboard" className="w-full sm:w-auto mt-4 sm:mt-0">
                <button type="button" className="w-full sm:w-auto px-8 py-3.5 border border-slate-200 text-slate-600 bg-white hover:bg-slate-100 text-[12px] font-bold uppercase tracking-widest rounded-md transition-all cursor-pointer shadow-sm">
                  Cancel
                </button>
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto group flex items-center justify-center gap-2 px-8 py-3.5 bg-[#e11d48] hover:bg-[#be123c] text-white text-[12px] font-bold uppercase tracking-widest rounded-md disabled:opacity-50 cursor-pointer shadow-[0_4px_14px_0_rgba(225,29,72,0.39)] transition-all active:scale-95 mt-4 sm:mt-0"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Emergency Report'}
                {!isSubmitting && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-10 text-center space-y-6 animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 rounded-full bg-[#f0fdf4] text-[#16a34a] border border-[#dcfce7] flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h3 className="text-[22px] font-black text-slate-900 tracking-tight">Report Logged Successfully!</h3>
              <p className="text-[14px] text-slate-500 max-w-md mx-auto leading-relaxed font-medium">
                Ticket <strong className="text-slate-700">#INC-PRY-9421</strong> has been created. The Sangam Sector 4 police post has been alerted.
              </p>
            </div>
            
            <div className="max-w-md mx-auto p-5 rounded-lg bg-slate-50 border border-slate-100 text-left space-y-3 shadow-sm">
              <div className="flex justify-between items-center text-[12px]">
                <span className="text-slate-500 font-bold uppercase tracking-wider">Assigned Unit:</span>
                <span className="font-black text-slate-900">Patrol PCR Van #14</span>
              </div>
              <div className="flex justify-between items-center text-[12px] pt-3 border-t border-slate-200">
                <span className="text-slate-500 font-bold uppercase tracking-wider">Est. Response:</span>
                <span className="font-black text-[#16a34a]">4 Minutes</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <Link to="/tourist/incidents/history">
                <button className="w-full sm:w-auto px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-white text-[12px] font-bold uppercase tracking-widest rounded-md transition-all cursor-pointer shadow-md">
                  Track Status
                </button>
              </Link>
              <Link to="/tourist/dashboard">
                <button className="w-full sm:w-auto px-8 py-3.5 border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 text-[12px] font-bold uppercase tracking-widest rounded-md transition-all cursor-pointer shadow-sm">
                  Dashboard
                </button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
