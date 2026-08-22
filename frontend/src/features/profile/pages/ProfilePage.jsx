import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  User, 
  ShieldCheck, 
  QrCode, 
  HeartPulse, 
  PhoneCall, 
  Save, 
  Check, 
  Sparkles,
  MapPin,
  Lock,
  Edit3
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Textarea } from '../../../components/ui/Textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { updateUser } from '../../auth/store/authSlice';

export function ProfilePage() {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const [name, setName] = useState(user?.name || 'Prachi Maurya');
  const [email, setEmail] = useState(user?.email || 'prachi@touristsafety.in');
  const [phone, setPhone] = useState(user?.phone || '+91 98765 43210');
  const [emergencyName, setEmergencyName] = useState(user?.emergencyContact?.name || 'Ramesh Maurya');
  const [emergencyPhone, setEmergencyPhone] = useState(user?.emergencyContact?.phone || '+91 98765 00000');
  const [emergencyRelation, setEmergencyRelation] = useState(user?.emergencyContact?.relation || 'Father');
  const [bloodGroup, setBloodGroup] = useState(user?.medicalInfo?.bloodGroup || 'O+');
  const [allergies, setAllergies] = useState(user?.medicalInfo?.notes || 'No known drug allergies');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    dispatch(
      updateUser({
        name,
        email,
        phone,
        emergencyContact: {
          name: emergencyName,
          phone: emergencyPhone,
          relation: emergencyRelation,
        },
        medicalInfo: {
          bloodGroup,
          notes: allergies,
        },
      })
    );
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-sky-400" />
            <h1 className="text-2xl font-black text-white tracking-tight">Tourist Safety ID & Profile</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Blockchain-backed digital identity and emergency first responder records.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 5 Cols: Digital Safety ID Card Mockup */}
        <div className="lg:col-span-5 space-y-6">
          <div className="relative rounded-3xl p-6 bg-gradient-to-br from-[#101b30] via-[#0d1627] to-[#080d19] border border-sky-500/40 shadow-2xl shadow-sky-500/10 space-y-4 overflow-hidden">
            {/* Holographic Watermark */}
            <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-sky-500/10 blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center text-white font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <span className="text-xs font-black text-white tracking-wider">KAVACH ID</span>
              </div>
              <Badge variant="safe" className="text-[9px]">VERIFIED ON-CHAIN</Badge>
            </div>

            {/* Profile Avatar & Details in Card */}
            <div className="flex items-center gap-3 pt-2">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-xl font-bold text-white shadow-lg">
                {name.charAt(0)}
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">{name}</h3>
                <p className="text-[11px] text-slate-400 font-mono">DID: prayagraj.tourist#8924</p>
                <p className="text-[10px] text-emerald-400 font-semibold">Status: Active Pilgrim</p>
              </div>
            </div>

            {/* Emergency & Medical Snapshot */}
            <div className="p-3 rounded-2xl bg-[#060b16] border border-slate-800 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Blood Group:</span>
                <span className="font-bold text-red-400">{bloodGroup}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Emergency SOS:</span>
                <span className="font-bold text-slate-200">{emergencyPhone} ({emergencyRelation})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Active Circuit:</span>
                <span className="text-sky-400">Sangam & Ghats</span>
              </div>
            </div>

            {/* Micro QR */}
            <div className="pt-2 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-800/80">
              <span>Scan for First Responder Medical File</span>
              <QrCode className="w-6 h-6 text-slate-300" />
            </div>
          </div>
        </div>

        {/* Right 7 Cols: Editable Details Form */}
        <div className="lg:col-span-7 space-y-6">
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-sky-400" />
                Edit Safety Information
              </CardTitle>
              <CardDescription>
                Updates will synchronize with local first responder control rooms.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <Input
                    label="Mobile Number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                <Input
                  label="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Input
                    label="Contact Name"
                    value={emergencyName}
                    onChange={(e) => setEmergencyName(e.target.value)}
                  />
                  <Input
                    label="Relation"
                    value={emergencyRelation}
                    onChange={(e) => setEmergencyRelation(e.target.value)}
                  />
                  <Input
                    label="Emergency Phone"
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Select
                    label="Blood Group"
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                  >
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </Select>

                  <Input
                    label="Medical Notes / Allergies"
                    value={allergies}
                    onChange={(e) => setAllergies(e.target.value)}
                  />
                </div>

                {savedSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-300 font-semibold flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Safety Profile updated and synchronized!
                  </div>
                )}

                <div className="pt-2 flex justify-end">
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    leftIcon={Save}
                  >
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
