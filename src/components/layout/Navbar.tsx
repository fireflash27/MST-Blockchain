import React, { useState } from 'react';
import { UserProfile, UserRole } from '../../types/database';
import { MOCK_USERS } from '../../lib/mockData';
import { isSupabaseConfigured } from '../../lib/supabase';
import { 
  Eye, 
  UserCheck, 
  Stethoscope, 
  Shield, 
  Layers, 
  Activity, 
  FileText, 
  History, 
  ChevronDown, 
  PlusCircle, 
  Check, 
  Database,
  Cpu,
  LogOut,
  LogIn,
  UserPlus,
  Hospital,
  Sparkles,
  Unlock
} from 'lucide-react';

interface NavbarProps {
  currentUser: UserProfile | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onSwitchUser: (role: UserRole, index: number) => void;
  onOpenNewScreening: () => void;
  onOpenBlockchainModal: () => void;
  onOpenAuth: (role?: UserRole | null) => void;
  onLogout: () => void;
  urgentCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  onSwitchUser,
  onOpenNewScreening,
  onOpenBlockchainModal,
  onOpenAuth,
  onLogout,
  urgentCount = 0
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);

  const isPatient = currentUser?.role === 'patient';
  const isDoctor = currentUser?.role === 'doctor' || currentUser?.role === 'hospital_admin';

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand & Platform Identity */}
          <div className="flex items-center gap-6">
            <div 
              onClick={() => {
                if (currentUser) {
                  setActiveTab(isPatient ? 'patient_dashboard' : 'hospital_dashboard');
                }
              }}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/20 group-hover:scale-105 transition-transform">
                <Eye className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold tracking-tight text-white group-hover:text-teal-400 transition-colors">
                    OcuTrust
                  </span>
                  <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-teal-500/10 border border-teal-500/30 text-teal-300">
                    Glaucoma AI/Doc
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">Secure Clinical Screening Platform</p>
              </div>
            </div>

            {/* Navigation Links (If logged in) */}
            {currentUser && (
              <nav className="hidden md:flex items-center gap-1.5 ml-4">
                {isPatient ? (
                  <>
                    <button
                      onClick={() => setActiveTab('patient_dashboard')}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        activeTab === 'patient_dashboard' 
                          ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30' 
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      }`}
                    >
                      My Screenings
                    </button>

                    <button
                      onClick={() => setActiveTab('medical_profile')}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        activeTab === 'medical_profile' 
                          ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30' 
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      }`}
                    >
                      Medical Profile
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setActiveTab('hospital_dashboard')}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        activeTab === 'hospital_dashboard' 
                          ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30' 
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      }`}
                    >
                      <Activity className="w-4 h-4" />
                      Clinical Triage Queue
                      {urgentCount > 0 && (
                        <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-rose-500 text-white animate-pulse">
                          {urgentCount}
                        </span>
                      )}
                    </button>

                    <button
                      onClick={() => setActiveTab('audit_trail')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        activeTab === 'audit_trail' 
                          ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30' 
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      }`}
                    >
                      <History className="w-4 h-4" />
                      Audit Logs
                    </button>
                  </>
                )}

                {/* Master Pipeline Cell */}
                <button
                  onClick={() => setActiveTab('master_pipeline')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    activeTab === 'master_pipeline' 
                      ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                  <span>Pipeline Cell</span>
                </button>

                {/* Data Retrieval / Decryptor Portal */}
                <button
                  onClick={() => setActiveTab('data_retrieval')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    activeTab === 'data_retrieval' 
                      ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Unlock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Decryptor Portal</span>
                </button>

                {/* MST Blockchain Architecture Explorer */}
                <button
                  onClick={onOpenBlockchainModal}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-cyan-300 bg-cyan-950/40 border border-cyan-500/30 hover:bg-cyan-900/40 transition-colors ml-2"
                  title="Inspect MST Blockchain Integration Architecture & Hashes"
                >
                  <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                  <span>MST Blockchain Layer</span>
                </button>
              </nav>
            )}
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-3">
            
            {currentUser ? (
              <>
                {/* Primary Action Button */}
                {isPatient ? (
                  <button
                    onClick={onOpenNewScreening}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-white font-medium text-sm shadow-md shadow-teal-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>New Eye Screening</span>
                  </button>
                ) : (
                  <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>Hospital Triage Active</span>
                  </div>
                )}

                {/* User Profile & Account Menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-colors text-left"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                      isPatient 
                        ? 'bg-teal-500/20 text-teal-400 border border-teal-500/40' 
                        : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40'
                    }`}>
                      {isPatient ? <UserCheck className="w-4 h-4" /> : <Stethoscope className="w-4 h-4" />}
                    </div>

                    <div className="hidden sm:block">
                      <p className="text-xs font-semibold text-slate-200 line-clamp-1">{currentUser.full_name}</p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        {currentUser.role}
                        {currentUser.role === 'doctor' && ' • Clinician'}
                      </p>
                    </div>

                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {/* User Switcher / Profile Dropdown */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
                      
                      {/* Active Account Details */}
                      <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 mb-2">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-white">{currentUser.full_name}</p>
                          <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded ${
                            isPatient ? 'bg-teal-950 text-teal-300 border border-teal-500/30' : 'bg-indigo-950 text-indigo-300 border border-indigo-500/30'
                          }`}>
                            {currentUser.role}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">{currentUser.email}</p>
                        {currentUser.medical_record_number && (
                          <p className="text-[10px] text-slate-500 mt-1">MRN: {currentUser.medical_record_number}</p>
                        )}
                        {currentUser.hospital_name && (
                          <p className="text-[10px] text-slate-500 mt-1">Hospital: {currentUser.hospital_name}</p>
                        )}
                      </div>

                      {/* Verified Clinical Status Info */}
                      <div className="px-3 py-2 bg-slate-950/40 rounded-xl border border-slate-800/60 text-xs space-y-1 mb-2">
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span>Identity Verification:</span>
                          <span className="text-emerald-400 font-semibold flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            Email OTP Verified
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span>Blockchain Custodian:</span>
                          <span className="text-cyan-400 font-mono text-[10px]">0x3C33...606F</span>
                        </div>
                      </div>

                      {/* Action Buttons: Sign In Different & Sign Out */}
                      <div className="pt-2 border-t border-slate-800/80 space-y-1">
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            onOpenAuth(currentUser.role);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                        >
                          <LogIn className="w-3.5 h-3.5 text-teal-400" />
                          <span>Switch / Sign In Other Account</span>
                        </button>

                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            onLogout();
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Sign Out</span>
                        </button>
                      </div>

                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Logged Out Actions */
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenAuth('patient')}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Patient Portal
                </button>
                <button
                  onClick={() => onOpenAuth('doctor')}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white text-xs font-bold shadow-md shadow-teal-500/20 transition-all"
                >
                  <Stethoscope className="w-3.5 h-3.5" />
                  <span>Hospital / Clinician</span>
                </button>
              </div>
            )}

          </div>

        </div>

        {/* Mobile / Tablet Horizontal Quick-Nav Sub-Bar */}
        {currentUser && (
          <div className="flex md:hidden items-center gap-1.5 py-2 border-t border-slate-800/60 overflow-x-auto text-xs no-scrollbar">
            <button
              onClick={() => setActiveTab(isPatient ? 'patient_dashboard' : 'hospital_dashboard')}
              className={`px-3 py-1 rounded-lg shrink-0 font-medium ${
                activeTab === (isPatient ? 'patient_dashboard' : 'hospital_dashboard')
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                  : 'text-slate-400'
              }`}
            >
              {isPatient ? 'Screenings' : 'Triage Queue'}
            </button>

            <button
              onClick={() => setActiveTab('master_pipeline')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg shrink-0 font-medium ${
                activeTab === 'master_pipeline'
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                  : 'text-slate-400'
              }`}
            >
              <Sparkles className="w-3 h-3 text-teal-400" />
              <span>Pipeline</span>
            </button>

            <button
              onClick={() => setActiveTab('data_retrieval')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg shrink-0 font-medium ${
                activeTab === 'data_retrieval'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400'
              }`}
            >
              <Unlock className="w-3 h-3 text-cyan-400" />
              <span>Decryptor</span>
            </button>

            <button
              onClick={onOpenBlockchainModal}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg shrink-0 text-cyan-300 bg-cyan-950/40 border border-cyan-500/30"
            >
              <Cpu className="w-3 h-3 text-cyan-400" />
              <span>MST Layer</span>
            </button>
          </div>
        )}

      </div>
    </header>
  );
};
