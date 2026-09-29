import React from 'react';
import { 
  Eye, 
  ShieldCheck, 
  Stethoscope, 
  User, 
  Lock, 
  Activity, 
  CheckCircle2, 
  ArrowRight,
  Sparkles,
  KeyRound
} from 'lucide-react';
import { UserRole } from '../../types/database';

interface AuthLandingProps {
  onOpenAuth: (role: UserRole | null) => void;
}

export const AuthLanding: React.FC<AuthLandingProps> = ({ onOpenAuth }) => {
  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center py-10 px-4 sm:px-6 lg:px-8">
      
      {/* Platform Title & Badge */}
      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-teal-950/80 border border-teal-500/30 text-teal-300 text-xs font-semibold mb-6 animate-pulse">
        <Sparkles className="w-3.5 h-3.5 text-teal-400" />
        <span>OcuTrust • Next-Gen Glaucoma Screening & Cryptographic Provenance</span>
      </div>

      {/* Main Hero Header */}
      <div className="text-center max-w-3xl space-y-4">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
          Decentralized Trust in <br />
          <span className="bg-gradient-to-r from-teal-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent">
            Ophthalmic Glaucoma Care
          </span>
        </h1>
        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto">
          Securely authenticate with your email & OTP to access the Patient Screening portal or the Clinician Diagnostic Workstation on the MST Blockchain.
        </p>
      </div>

      {/* Portal Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl mt-10">
        
        {/* Card 1: Patient Portal */}
        <div className="relative group rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-teal-500/50 p-8 shadow-xl transition-all hover:scale-[1.02] flex flex-col justify-between overflow-hidden">
          <div className="absolute top-0 right-0 w-36 h-36 bg-teal-500/10 rounded-full blur-3xl group-hover:bg-teal-500/20 transition-all pointer-events-none" />
          
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <User className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-xl font-bold text-white">Patient Portal</h3>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-500/30">
                  Email OTP
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Upload Left & Right retinal fundus photographs, record IOP readings, and receive immutable diagnostic reports from accredited ophthalmologists.
              </p>
            </div>

            <ul className="space-y-2 text-xs text-slate-300 pt-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                <span>Secure passwordless Email OTP verification</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                <span>Single Central Master Glaucoma Hash seal</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                <span>Automated unique Medical Record Number (MRN)</span>
              </li>
            </ul>
          </div>

          <div className="pt-8">
            <button
              onClick={() => onOpenAuth('patient')}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-bold text-xs shadow-lg shadow-teal-500/25 transition-all flex items-center justify-center gap-2"
            >
              <KeyRound className="w-4 h-4" />
              <span>Authenticate as Patient</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Card 2: Hospital & Clinician Workstation */}
        <div className="relative group rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 p-8 shadow-xl transition-all hover:scale-[1.02] flex flex-col justify-between overflow-hidden">
          <div className="absolute top-0 right-0 w-36 h-36 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all pointer-events-none" />
          
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Stethoscope className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-xl font-bold text-white">Hospital & Doctor Portal</h3>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/30">
                  Verified Clinician
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Interactive fundus image grading workstation with red-free filter, contrast enhancement, optic disc CDR reticle measurement, and cryptographic report signing.
              </p>
            </div>

            <ul className="space-y-2 text-xs text-slate-300 pt-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Full optical disc & RNFL defect grading console</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Medical license validation & hospital verification</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Live on-chain anchoring via ASBridge Relayer</span>
              </li>
            </ul>
          </div>

          <div className="pt-8">
            <button
              onClick={() => onOpenAuth('doctor')}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2"
            >
              <KeyRound className="w-4 h-4" />
              <span>Authenticate as Doctor / Hospital</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* Trust & Architecture Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-4xl mt-10 pt-6 border-t border-slate-800 text-center">
        <div className="p-3 rounded-2xl bg-slate-900/50 border border-slate-800/80">
          <p className="text-xs font-bold text-white">MST Blockchain</p>
          <p className="text-[10px] text-slate-400">Chain ID: 91562037</p>
        </div>
        <div className="p-3 rounded-2xl bg-slate-900/50 border border-slate-800/80">
          <p className="text-xs font-bold text-white">ASBridge Relayer</p>
          <p className="text-[10px] text-slate-400">0x3C33...606F</p>
        </div>
        <div className="p-3 rounded-2xl bg-slate-900/50 border border-slate-800/80">
          <p className="text-xs font-bold text-white">SHA-256 Provenance</p>
          <p className="text-[10px] text-slate-400">Binary Image & Metadata Hash</p>
        </div>
        <div className="p-3 rounded-2xl bg-slate-900/50 border border-slate-800/80">
          <p className="text-xs font-bold text-white">Email OTP Auth</p>
          <p className="text-[10px] text-slate-400">Zero Password Vulnerability</p>
        </div>
      </div>

    </div>
  );
};
