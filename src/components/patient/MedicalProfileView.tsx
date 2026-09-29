import React, { useState } from 'react';
import { UserProfile } from '../../types/database';
import { updateProfile } from '../../lib/api';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  HeartPulse, 
  ShieldCheck, 
  Check, 
  Save, 
  FileText,
  AlertCircle
} from 'lucide-react';

interface MedicalProfileViewProps {
  user: UserProfile;
  onProfileUpdated: (updated: UserProfile) => void;
}

export const MedicalProfileView: React.FC<MedicalProfileViewProps> = ({
  user,
  onProfileUpdated
}) => {
  const [fullName, setFullName] = useState(user.full_name);
  const [phone, setPhone] = useState(user.phone || '+1 (555) 234-5678');
  const [dob, setDob] = useState(user.date_of_birth || '1974-05-12');
  const [gender, setGender] = useState(user.gender || 'Female');
  const [mrn, setMrn] = useState(user.medical_record_number || 'MRN-2026-9821');
  const [emergencyContact, setEmergencyContact] = useState(user.emergency_contact || 'David Jenkins (+1 555-234-5679)');
  
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await updateProfile({
        full_name: fullName,
        phone,
        date_of_birth: dob,
        gender: gender as any,
        medical_record_number: mrn,
        emergency_contact: emergencyContact
      });
      onProfileUpdated(updated);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
      
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8">
        <div className="flex items-center justify-between border-b border-slate-800 pb-6 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Patient Medical Profile</h2>
              <p className="text-xs text-slate-400">
                Personal demographics, medical record identifier, and emergency contact details
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-teal-300 bg-teal-500/10 px-2.5 py-1 rounded-full border border-teal-500/30">
              Verified Patient ID
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 text-xs text-white focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full rounded-xl bg-slate-950/60 border border-slate-800 px-3.5 py-2.5 text-xs text-slate-400 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Date of Birth</label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 text-xs text-white focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 text-xs text-white focus:border-teal-500"
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Medical Record Number (MRN)</label>
              <input
                type="text"
                value={mrn}
                onChange={(e) => setMrn(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 text-xs text-teal-300 font-mono focus:border-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Contact Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 text-xs text-white focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Emergency Contact & Phone</label>
              <input
                type="text"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                placeholder="Name & Relationship (+1 555-0000)"
                className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 text-xs text-white focus:border-teal-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            {savedSuccess ? (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                <Check className="w-4 h-4" />
                Profile updated successfully!
              </span>
            ) : <span />}

            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-md transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </div>

        </form>
      </div>

    </div>
  );
};
