import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  User, ShieldCheck, QrCode, PhoneCall, Save, Check, MapPin, Edit3,
  Star, Clock, Shield, Lock, Heart, List, MinusCircle, Trash2, Image as ImageIcon
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
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
    <div className="-m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 bg-slate-50 min-h-[calc(100vh-64px)]">
      <div className="max-w-5xl mx-auto space-y-6 text-left pb-10">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Tourist Safety ID & Profile</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-semibold">
            Blockchain-backed digital identity and emergency first responder records.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* ========================================================
            LEFT COLUMN (5 Cols): Professional ID Card (Square Theme)
        ======================================================== */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-none bg-white border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            
            {/* Header: Avatar & Name */}
            <div className="flex flex-col items-center pt-10 pb-6 border-b border-slate-200 px-6 relative">
              
              {/* Square Avatar */}
              <div className="w-32 h-32 rounded-none overflow-hidden mb-5 bg-slate-100 flex items-center justify-center border border-slate-200 shadow-sm">
                 <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop" alt="Profile Avatar" className="w-full h-full object-cover" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-1 uppercase">@{name.replace(/\s+/g, '')}</h2>
              <p className="text-slate-500 text-xs font-mono tracking-wide">{phone}</p>
            </div>

            {/* About / Medical Notes */}
            <div className="px-6 py-5 border-b border-slate-200 bg-slate-50">
              <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Medical Profile</h3>
              <p className="text-slate-800 text-sm font-medium">{allergies || 'No known allergies.'}</p>
            </div>

            {/* Media/Docs Section */}
            <div className="border-b border-slate-200 bg-white">
              <div className="px-6 py-4 flex items-center gap-3">
                 <ImageIcon className="w-4 h-4 text-slate-400" />
                 <span className="text-slate-800 text-xs font-bold uppercase flex-1">Safety Documents & Records</span>
                 <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-none border border-slate-200">4</span>
              </div>
              <div className="flex gap-2 overflow-x-auto px-6 pb-5 scrollbar-hide">
                 <div className="w-16 h-16 flex-shrink-0 rounded-none overflow-hidden border border-slate-200">
                   <img src="https://images.unsplash.com/photo-1517842645767-c639042777db?q=80&w=100&auto=format&fit=crop" alt="Doc" className="w-full h-full object-cover grayscale opacity-90 hover:grayscale-0 transition" />
                 </div>
                 <div className="w-16 h-16 flex-shrink-0 rounded-none overflow-hidden border border-slate-200">
                   <img src="https://images.unsplash.com/photo-1517842645767-c639042777db?q=80&w=100&auto=format&fit=crop" alt="Doc" className="w-full h-full object-cover grayscale opacity-90 hover:grayscale-0 transition" />
                 </div>
                 <div className="w-16 h-16 flex-shrink-0 rounded-none overflow-hidden border border-slate-200">
                   <img src="https://images.unsplash.com/photo-1517842645767-c639042777db?q=80&w=100&auto=format&fit=crop" alt="Doc" className="w-full h-full object-cover grayscale opacity-90 hover:grayscale-0 transition" />
                 </div>
              </div>
            </div>

            {/* Micro QR */}
            <div className="p-6 flex items-center justify-between text-xs bg-slate-50">
              <div className="flex flex-col gap-1">
                <span className="text-slate-700 font-bold uppercase">Responder File Access</span>
                <span className="font-mono text-[10px] text-slate-500">DID: PRY.TOURIST#8924</span>
              </div>
              <div className="p-1.5 bg-white border border-slate-200 rounded-none">
                <QrCode className="w-10 h-10 text-slate-900" />
              </div>
            </div>

          </div>
        </div>

        {/* ========================================================
            RIGHT COLUMN (7 Cols): Professional Form
        ======================================================== */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-none bg-white border border-slate-200 shadow-sm p-1 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center gap-3 bg-slate-50">
              <div className="w-10 h-10 rounded-none bg-red-100 border border-red-200 flex items-center justify-center">
                <Edit3 className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Edit Safety Information</h3>
                <p className="text-xs text-slate-500 font-medium">Updates will synchronize with local first responder control rooms.</p>
              </div>
            </div>

            <div className="p-6 bg-white">
              <form onSubmit={handleSave} className="space-y-6">
                
                {/* Form Group: Personal */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-slate-500 mb-2 border-b border-slate-100 pb-2">
                    <User className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-bold uppercase tracking-wider">Personal Details</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <StyledInput label="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
                    <StyledInput label="Mobile Number" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                  <StyledInput label="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>

                {/* Form Group: Emergency Contact */}
                <div className="space-y-4 pt-4">
                  <div className="flex items-center gap-3 text-slate-500 mb-2 border-b border-slate-100 pb-2">
                    <Star className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-bold uppercase tracking-wider">Starred Contacts (Emergency)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <StyledInput label="Contact Name" value={emergencyName} onChange={(e) => setEmergencyName(e.target.value)} />
                    <StyledInput label="Relation" value={emergencyRelation} onChange={(e) => setEmergencyRelation(e.target.value)} />
                    <StyledInput label="Emergency Phone" value={emergencyPhone} onChange={(e) => setEmergencyPhone(e.target.value)} />
                  </div>
                </div>

                {/* Form Group: Medical */}
                <div className="space-y-4 pt-4">
                  <div className="flex items-center gap-3 text-slate-500 mb-2 border-b border-slate-100 pb-2">
                    <Heart className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-bold uppercase tracking-wider">Medical & Health</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-1">
                      <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Blood Group</label>
                      <select
                        value={bloodGroup}
                        onChange={(e) => setBloodGroup(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-none px-4 py-2 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors shadow-none font-medium"
                      >
                        <option value="O+">O+</option><option value="O-">O-</option>
                        <option value="A+">A+</option><option value="A-">A-</option>
                        <option value="B+">B+</option><option value="B-">B-</option>
                        <option value="AB+">AB+</option><option value="AB-">AB-</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <StyledInput label="Medical Notes / Allergies" value={allergies} onChange={(e) => setAllergies(e.target.value)} />
                    </div>
                  </div>
                </div>

                {/* Additional Requested Icons Layout */}
                <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <div className="flex items-center gap-3 p-3 rounded-none bg-slate-50 border border-slate-200">
                     <Clock className="w-4 h-4 text-slate-400" />
                     <div>
                       <p className="text-xs text-slate-800 font-bold uppercase tracking-wider">Tour Duration</p>
                       <p className="text-[10px] text-slate-500 font-mono">STATUS: OFF</p>
                     </div>
                   </div>
                   <div className="flex items-center gap-3 p-3 rounded-none bg-slate-50 border border-slate-200">
                     <List className="w-4 h-4 text-slate-400" />
                     <div>
                       <p className="text-xs text-slate-800 font-bold uppercase tracking-wider">Emergency Protocols</p>
                       <p className="text-[10px] text-slate-500 font-mono">ACTIVE: 3</p>
                     </div>
                   </div>
                   <div className="flex items-center justify-center gap-2 p-3 rounded-none bg-white border border-red-200 cursor-pointer hover:bg-red-50 transition-colors">
                     <MinusCircle className="w-4 h-4 text-red-600" />
                     <p className="text-xs text-red-600 font-bold uppercase tracking-wider">Clear Logs</p>
                   </div>
                   <div className="flex items-center justify-center gap-2 p-3 rounded-none bg-red-600 border border-red-600 cursor-pointer hover:bg-red-700 transition-colors">
                     <Trash2 className="w-4 h-4 text-white" />
                     <p className="text-xs text-white font-bold uppercase tracking-wider">Delete ID</p>
                   </div>
                </div>

                {/* Save Section */}
                <div className="pt-6 mt-4 flex items-center justify-between border-t border-slate-100">
                  {savedSuccess ? (
                    <div className="px-4 py-2 rounded-none bg-green-50 border border-green-200 text-xs text-green-700 font-bold uppercase tracking-wider flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      Sync Complete
                    </div>
                  ) : (
                    <div />
                  )}
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-8 py-3 rounded-none bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-none"
                  >
                    <Save className="w-4 h-4" />
                    Save & Sync
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

function StyledInput({ label, value, onChange, type = "text" }) {
  return (
    <div className="flex flex-col">
      <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-medium rounded-none px-4 py-2 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors shadow-none"
      />
    </div>
  );
}
