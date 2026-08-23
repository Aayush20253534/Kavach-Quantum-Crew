import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  User, ShieldCheck, QrCode, PhoneCall, Save, Check, MapPin, Edit3,
  Star, Clock, Shield, Lock, Heart, List, MinusCircle, Trash2, Image as ImageIcon
} from 'lucide-react';
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

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

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
    <div className={`max-w-[1100px] mx-auto space-y-6 pb-10 font-sans transition-all duration-700 transform ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[22px] font-black text-slate-900 tracking-tight">Tourist Safety ID & Profile</h1>
          </div>
          <p className="text-[13px] text-slate-500 font-medium mt-1">
            Blockchain-backed digital identity and emergency first responder records.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* ========================================================
            LEFT COLUMN (4 Cols): Professional ID Card
        ======================================================== */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-slate-200 shadow-sm rounded-lg overflow-hidden flex flex-col">
            
            {/* Header: Avatar & Name */}
            <div className="flex flex-col items-center pt-8 pb-6 border-b border-slate-100 px-6 relative bg-slate-50/50">
              
              <div className="w-28 h-28 rounded-full overflow-hidden mb-5 bg-slate-100 flex items-center justify-center border-4 border-white shadow-md">
                 <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop" alt="Profile Avatar" className="w-full h-full object-cover" />
              </div>
              <h2 className="text-[18px] font-black text-slate-900 mb-0.5 tracking-tight">{name}</h2>
              <p className="text-slate-500 text-[12px] font-semibold">{phone}</p>
            </div>

            {/* About / Medical Notes */}
            <div className="px-6 py-5 border-b border-slate-100">
              <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2">Medical Notes</h3>
              <p className="text-slate-700 text-[13px] font-medium leading-relaxed">{allergies || 'No known allergies.'}</p>
            </div>

            {/* Media/Docs Section */}
            <div className="border-b border-slate-100">
              <div className="px-6 py-4 flex items-center justify-between">
                 <div className="flex items-center gap-2">
                   <ImageIcon className="w-4 h-4 text-slate-400" />
                   <span className="text-slate-700 text-[12px] font-bold">Safety Documents</span>
                 </div>
                 <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">4</span>
              </div>
              <div className="flex gap-2 overflow-x-auto px-6 pb-5 scrollbar-hide">
                 <div className="w-16 h-16 flex-shrink-0 rounded-md overflow-hidden border border-slate-200 bg-slate-50">
                   <img src="https://images.unsplash.com/photo-1517842645767-c639042777db?q=80&w=100&auto=format&fit=crop" alt="Doc" className="w-full h-full object-cover grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all cursor-pointer" />
                 </div>
                 <div className="w-16 h-16 flex-shrink-0 rounded-md overflow-hidden border border-slate-200 bg-slate-50">
                   <img src="https://images.unsplash.com/photo-1517842645767-c639042777db?q=80&w=100&auto=format&fit=crop" alt="Doc" className="w-full h-full object-cover grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all cursor-pointer" />
                 </div>
              </div>
            </div>

            {/* Micro QR */}
            <div className="p-6 flex items-center justify-between bg-slate-50/50">
              <div className="flex flex-col gap-1">
                <span className="text-slate-900 text-[12px] font-bold tracking-wide">Responder Access</span>
                <span className="font-mono text-[10px] text-slate-500">DID: PRY.TOURIST#8924</span>
              </div>
              <div className="p-1.5 bg-white border border-slate-200 rounded-md shadow-sm">
                <QrCode className="w-8 h-8 text-slate-900" />
              </div>
            </div>

          </div>
        </div>

        {/* ========================================================
            RIGHT COLUMN (8 Cols): Professional Form
        ======================================================== */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white border border-slate-200 shadow-sm rounded-lg overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
              <div className="w-10 h-10 rounded-md bg-[#fef2f2] border border-[#fecaca] flex items-center justify-center">
                <Edit3 className="w-4 h-4 text-[#e11d48]" />
              </div>
              <div>
                <h3 className="text-[14px] font-black text-slate-900 tracking-wide">Edit Safety Information</h3>
                <p className="text-[12px] text-slate-500 font-medium mt-0.5">Updates synchronize instantly with responder control rooms.</p>
              </div>
            </div>

            <div className="p-6 sm:p-8">
              <form onSubmit={handleSave} className="space-y-8">
                
                {/* Form Group: Personal */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-slate-900 mb-4 pb-2 border-b border-slate-100">
                    <User className="w-4 h-4 text-slate-400" />
                    <span className="text-[13px] font-bold tracking-wide">Personal Details</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <StyledInput label="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
                    <StyledInput label="Mobile Number" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                  <StyledInput label="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
                </div>

                {/* Form Group: Emergency Contact */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-slate-900 mb-4 pb-2 border-b border-slate-100 mt-4">
                    <Star className="w-4 h-4 text-slate-400" />
                    <span className="text-[13px] font-bold tracking-wide">Starred Contacts (Emergency)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <StyledInput label="Contact Name" value={emergencyName} onChange={(e) => setEmergencyName(e.target.value)} />
                    <StyledInput label="Relation" value={emergencyRelation} onChange={(e) => setEmergencyRelation(e.target.value)} />
                    <StyledInput label="Emergency Phone" value={emergencyPhone} onChange={(e) => setEmergencyPhone(e.target.value)} />
                  </div>
                </div>

                {/* Form Group: Medical */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-slate-900 mb-4 pb-2 border-b border-slate-100 mt-4">
                    <Heart className="w-4 h-4 text-slate-400" />
                    <span className="text-[13px] font-bold tracking-wide">Medical & Health</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <div className="sm:col-span-1">
                      <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-widest pl-1">Blood Group</label>
                      <select
                        value={bloodGroup}
                        onChange={(e) => setBloodGroup(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-[14px] font-semibold rounded-md px-4 py-3 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all appearance-none cursor-pointer"
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

                {/* Additional Settings Blocks */}
                <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <div className="flex items-center gap-4 p-4 rounded-md border border-slate-200 bg-slate-50/50">
                     <Clock className="w-5 h-5 text-slate-400" />
                     <div>
                       <p className="text-[12px] text-slate-900 font-bold">Tour Duration</p>
                       <p className="text-[10px] text-slate-500 font-mono mt-0.5">STATUS: OFF</p>
                     </div>
                   </div>
                   <div className="flex items-center gap-4 p-4 rounded-md border border-slate-200 bg-slate-50/50">
                     <List className="w-5 h-5 text-slate-400" />
                     <div>
                       <p className="text-[12px] text-slate-900 font-bold">Emergency Protocols</p>
                       <p className="text-[10px] text-slate-500 font-mono mt-0.5">ACTIVE: 3</p>
                     </div>
                   </div>
                   <div className="flex items-center justify-center gap-2 p-4 rounded-md border border-red-200 bg-white hover:bg-red-50 cursor-pointer transition-colors text-[#e11d48]">
                     <MinusCircle className="w-4 h-4" />
                     <p className="text-[12px] font-bold">Clear System Logs</p>
                   </div>
                   <div className="flex items-center justify-center gap-2 p-4 rounded-md border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition-colors text-slate-700">
                     <Trash2 className="w-4 h-4" />
                     <p className="text-[12px] font-bold">Deactivate ID</p>
                   </div>
                </div>

                {/* Save Section */}
                <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
                  {savedSuccess ? (
                    <div className="w-full sm:w-auto px-4 py-3 rounded-md bg-[#f0fdf4] border border-[#dcfce7] text-[12px] text-[#16a34a] font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                      <Check className="w-4 h-4" />
                      Sync Complete
                    </div>
                  ) : (
                    <div className="w-full sm:w-auto" />
                  )}
                  <button
                    type="submit"
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-10 py-3.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-[12px] font-bold uppercase tracking-widest transition-all shadow-md active:scale-95 cursor-pointer"
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
  );
}

function StyledInput({ label, value, onChange, type = "text" }) {
  return (
    <div className="flex flex-col space-y-1.5">
      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-[14px] font-semibold rounded-md px-4 py-3 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all"
      />
    </div>
  );
}
