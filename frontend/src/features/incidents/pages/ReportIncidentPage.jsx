import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  AlertTriangle, 
  MapPin, 
  Camera, 
  ArrowRight, 
  CheckCircle2, 
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Textarea } from '../../../components/ui/Textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../../components/ui/Card';

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
    <div className="max-w-2xl mx-auto space-y-6 text-left">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h1 className="text-2xl font-black text-white tracking-tight">Report a Safety Concern</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Directly transmitted to the nearest Tourist Police Assistance Booth & Control Room.
          </p>
        </div>
        <Link to="/tourist/incidents/history">
          <Button variant="ghost" size="sm" className="text-slate-300">
            View Past Reports →
          </Button>
        </Link>
      </div>

      <Card variant="elevated" className="border-slate-800">
        {!submitted ? (
          <form onSubmit={handleSubmit}>
            <CardContent className="p-6 sm:p-8 space-y-5">
              {/* Category */}
              <Select
                label="Incident Category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </Select>

              {/* Severity Level */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">Severity Level</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { level: 'Low', desc: 'Informational', color: 'border-emerald-500/50 text-emerald-400' },
                    { level: 'Medium', desc: 'Requires Patrol', color: 'border-amber-500/50 text-amber-400' },
                    { level: 'High', desc: 'Urgent Action', color: 'border-red-500/50 text-red-400' },
                  ].map((s) => (
                    <button
                      type="button"
                      key={s.level}
                      onClick={() => setSeverity(s.level)}
                      className={`p-3 rounded-xl border text-center transition cursor-pointer ${
                        severity === s.level
                          ? `bg-[#152238] ${s.color} ring-1 ring-current shadow-md`
                          : 'bg-[#080d18] border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <p className="text-xs font-bold">{s.level}</p>
                      <p className="text-[10px] text-slate-400">{s.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Auto-detected GPS location */}
              <Input
                label="Location (Auto-detected via GPS)"
                leftIcon={MapPin}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />

              {/* Description */}
              <Textarea
                label="Incident Description"
                placeholder="Describe what happened, nearby landmarks (e.g. Near Boat Ghat #4 or Fort Gate), or persons involved..."
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />

              {/* Photo Upload Mockup */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">Attach Photo / Evidence (Optional)</label>
                <div className="p-4 rounded-xl border border-dashed border-slate-800 bg-[#080d18] flex flex-col items-center justify-center text-center space-y-1 cursor-pointer hover:border-slate-700 transition">
                  <Camera className="w-6 h-6 text-slate-400" />
                  <span className="text-xs text-slate-300 font-medium">Click to upload photo from camera</span>
                  <span className="text-[10px] text-slate-500">PNG, JPG up to 10MB</span>
                </div>
              </div>

              {/* Anonymous Check */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="anon"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="h-4 w-4 rounded bg-[#060b16] border-slate-700 text-sky-500 focus:ring-sky-500"
                />
                <label htmlFor="anon" className="text-xs text-slate-300 cursor-pointer select-none">
                  Submit anonymously (Do not disclose my Tourist Safety ID to public records)
                </label>
              </div>
            </CardContent>

            <CardFooter className="p-6 sm:p-8 pt-0 flex justify-between border-t border-slate-800/80">
              <Link to="/tourist/dashboard">
                <Button variant="ghost" size="md" className="text-slate-300">
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                variant="danger"
                size="lg"
                isLoading={isSubmitting}
                rightIcon={ArrowRight}
              >
                Submit Emergency Report
              </Button>
            </CardFooter>
          </form>
        ) : (
          <CardContent className="p-8 text-center space-y-5 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white">Report Logged Successfully!</h3>
              <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                Ticket <strong>#INC-PRY-9421</strong> has been created. The Sangam Sector 4 police post has been alerted.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[#080d18] border border-slate-800 text-left text-xs space-y-2">
              <div className="flex justify-between text-slate-300">
                <span>Assigned Unit:</span>
                <span className="font-bold text-sky-400">Patrol PCR Van #14</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Estimated Response Time:</span>
                <span className="font-bold text-emerald-400">4 Minutes</span>
              </div>
            </div>
            <div className="flex gap-3 justify-center pt-2">
              <Link to="/tourist/incidents/history">
                <Button variant="primary" size="md">
                  Track Incident Status
                </Button>
              </Link>
              <Link to="/tourist/dashboard">
                <Button variant="secondary" size="md">
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
