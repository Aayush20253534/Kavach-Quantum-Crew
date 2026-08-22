import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Compass, 
  Users, 
  User, 
  ArrowRight, 
  CheckCircle2, 
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';

export function CreateTripPage() {
  const navigate = useNavigate();
  const [tripType, setTripType] = useState('GROUP'); // 'SOLO' | 'GROUP'
  const [selectedDestination, setSelectedDestination] = useState('Triveni Sangam & Ghats');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [duration, setDuration] = useState('Full Day Pilgrimage');
  const [checkInInterval, setCheckInInterval] = useState('Every 2 Hours');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const prayagrajDestinations = [
    { name: 'Triveni Sangam & Ghats', category: 'Holy Confluence', riskLevel: 'Safe' },
    { name: 'Allahabad Fort & Akshayavat Tree', category: 'Historic Monument', riskLevel: 'Safe' },
    { name: 'Anand Bhavan & Planetarium', category: 'Heritage Site', riskLevel: 'Safe' },
    { name: 'Alopi Devi Mandir', category: 'Temple Circuit', riskLevel: 'Safe' },
    { name: 'Kumbh Mela Sector 1-8 Camp', category: 'Pilgrim Grounds', riskLevel: 'Safe' },
    { name: 'Khusro Bagh Mughal Gardens', category: 'Heritage Park', riskLevel: 'Safe' },
  ];

  const handleCreateTrip = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      navigate('/tourist/trips/current');
    }, 600);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-left">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-sky-400" />
            <h1 className="text-2xl font-black text-white tracking-tight">Plan a Safe Journey</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Configure safety check-ins, destination tracking, and companion sync across Prayagraj.
          </p>
        </div>
        <Link to="/tourist/trips/history">
          <Button variant="ghost" size="sm" className="text-slate-300">
            View Trip History →
          </Button>
        </Link>
      </div>

      <form onSubmit={handleCreateTrip} className="space-y-6">
        {/* Solo vs Group Toggle */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setTripType('GROUP')}
            className={`p-5 rounded-2xl border text-left transition cursor-pointer ${
              tripType === 'GROUP'
                ? 'bg-sky-500/15 border-sky-500/60 shadow-lg shadow-sky-500/10'
                : 'bg-[#0d1526] border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400">
                <Users className="w-6 h-6" />
              </div>
              {tripType === 'GROUP' && <CheckCircle2 className="w-5 h-5 text-sky-400" />}
            </div>
            <h3 className="text-sm font-bold text-white">Group / Family Trip</h3>
            <p className="text-xs text-slate-400 mt-1">
              Synchronize location with family members, share QR invite codes, and monitor companion distances.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setTripType('SOLO')}
            className={`p-5 rounded-2xl border text-left transition cursor-pointer ${
              tripType === 'SOLO'
                ? 'bg-sky-500/15 border-sky-500/60 shadow-lg shadow-sky-500/10'
                : 'bg-[#0d1526] border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2.5 rounded-xl bg-sky-500/20 text-sky-400">
                <User className="w-6 h-6" />
              </div>
              {tripType === 'SOLO' && <CheckCircle2 className="w-5 h-5 text-sky-400" />}
            </div>
            <h3 className="text-sm font-bold text-white">Solo Traveler Trip</h3>
            <p className="text-xs text-slate-400 mt-1">
              Automated periodic check-in reminders and direct link to Tourist Police first responders.
            </p>
          </button>
        </div>

        {/* Destination Selection */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="text-base">1. Select Prayagraj Destination</CardTitle>
            <CardDescription>Choose from verified tourist & pilgrimage circuits in Prayagraj.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {prayagrajDestinations.map((dest, i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => setSelectedDestination(dest.name)}
                  className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
                    selectedDestination === dest.name
                      ? 'bg-sky-500/20 border-sky-500/80'
                      : 'bg-[#080d18] border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-sky-400 uppercase">{dest.category}</span>
                    <Badge variant="safe" className="text-[9px] py-0">{dest.riskLevel}</Badge>
                  </div>
                  <h4 className="text-xs font-bold text-white truncate">{dest.name}</h4>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Safety Parameters & Schedule */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="text-base">2. Safety Parameters & Timing</CardTitle>
            <CardDescription>Define automated safety check-in intervals and travel schedule.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Travel Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />

            <Select
              label="Estimated Duration"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            >
              <option value="Half Day (4 Hours)">Half Day (4 Hours)</option>
              <option value="Full Day Pilgrimage">Full Day Pilgrimage</option>
              <option value="2 Days Tour">2 Days Tour</option>
              <option value="Multi-day Kumbh Camp">Multi-day Kumbh Camp</option>
            </Select>

            <Select
              label="Safety Check-In Ping"
              value={checkInInterval}
              onChange={(e) => setCheckInInterval(e.target.value)}
            >
              <option value="Every 1 Hour">Every 1 Hour (High Caution)</option>
              <option value="Every 2 Hours">Every 2 Hours (Recommended)</option>
              <option value="Every 4 Hours">Every 4 Hours</option>
              <option value="Manual Only">Manual Only</option>
            </Select>
          </CardContent>
        </Card>

        {/* Submit Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Link to="/tourist/dashboard">
            <Button variant="ghost" size="lg" className="text-slate-300">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            rightIcon={ArrowRight}
          >
            Start Trip & Activate Safe Radar
          </Button>
        </div>
      </form>
    </div>
  );
}
