import React, { useState } from 'react';
import { UserProfile, ScreeningRequest } from '../../types/database';
import { StatusBadge } from '../common/StatusBadge';
import { HashBadge } from '../common/HashBadge';
import { 
  Stethoscope, 
  Search, 
  Filter, 
  Activity, 
  AlertOctagon, 
  CheckCircle2, 
  Clock, 
  Eye, 
  ChevronRight, 
  ShieldCheck, 
  FileText,
  User,
  TrendingUp,
  Cpu
} from 'lucide-react';

interface HospitalDashboardProps {
  currentUser: UserProfile;
  screenings: ScreeningRequest[];
  onOpenWorkstation: (screening: ScreeningRequest) => void;
  onViewReport: (screening: ScreeningRequest) => void;
  onOpenBlockchainModal: () => void;
}

export const HospitalDashboard: React.FC<HospitalDashboardProps> = ({
  currentUser,
  screenings,
  onOpenWorkstation,
  onViewReport,
  onOpenBlockchainModal
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'urgent' | 'pending' | 'diagnosed'>('all');

  // Computed metrics
  const totalCases = screenings.length;
  const pendingCases = screenings.filter(s => s.status === 'submitted' || s.status === 'in_review');
  const urgentCases = screenings.filter(s => s.priority === 'urgent' || s.status === 'urgent_referral');
  const diagnosedCases = screenings.filter(s => s.status === 'diagnosed' || s.status === 'completed' || s.status === 'urgent_referral');

  // Filtered screenings
  const filteredScreenings = screenings.filter(scr => {
    // Search filter
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      scr.reference_id.toLowerCase().includes(q) ||
      (scr.patient?.full_name && scr.patient.full_name.toLowerCase().includes(q)) ||
      (scr.patient?.medical_record_number && scr.patient.medical_record_number.toLowerCase().includes(q)) ||
      scr.symptoms.some(s => s.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    // Tab filter
    if (selectedFilter === 'urgent') {
      return scr.priority === 'urgent' || scr.status === 'urgent_referral';
    }
    if (selectedFilter === 'pending') {
      return scr.status === 'submitted' || scr.status === 'in_review';
    }
    if (selectedFilter === 'diagnosed') {
      return scr.status === 'diagnosed' || scr.status === 'completed' || scr.status === 'urgent_referral';
    }
    return true;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Hospital / Clinic Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-indigo-950/40 border border-slate-800 p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
              <Stethoscope className="w-3.5 h-3.5 text-indigo-400" />
              <span>Ophthalmology Clinical Workstation</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Hospital Triage & Screening Queue
            </h1>
            <p className="text-xs text-slate-400 flex items-center gap-2">
              <span>{currentUser.hospital_name || 'Apex Vision Institute & Glaucoma Care Center'}</span>
              <span>•</span>
              <span className="text-indigo-300 font-medium">Logged in as {currentUser.full_name}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenBlockchainModal}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-950/60 border border-cyan-500/30 hover:bg-cyan-900/60 text-cyan-300 text-xs font-bold transition-all"
            >
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>MST Blockchain Anchor Spec</span>
            </button>
          </div>
        </div>

        {/* Hospital Metrics KPI Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/60">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Total Screenings</span>
              <Activity className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-2xl font-black text-white mt-1">{totalCases}</p>
          </div>

          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/60">
            <div className="flex items-center justify-between text-amber-400 text-xs font-medium">
              <span>Awaiting Doctor Review</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl font-black text-amber-400 mt-1">{pendingCases.length}</p>
          </div>

          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/60">
            <div className="flex items-center justify-between text-rose-400 text-xs font-medium">
              <span>Urgent / High Risk Cases</span>
              <AlertOctagon className="w-4 h-4 text-rose-400" />
            </div>
            <p className="text-2xl font-black text-rose-400 mt-1">{urgentCases.length}</p>
          </div>

          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/60">
            <div className="flex items-center justify-between text-emerald-400 text-xs font-medium">
              <span>Diagnosed & Stamped</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-black text-emerald-400 mt-1">{diagnosedCases.length}</p>
          </div>
        </div>
      </div>

      {/* Triage Search & Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 self-start">
          {[
            { id: 'all', label: 'All Cases', count: totalCases },
            { id: 'urgent', label: 'Urgent / Triage', count: urgentCases.length },
            { id: 'pending', label: 'Pending Review', count: pendingCases.length },
            { id: 'diagnosed', label: 'Diagnosed', count: diagnosedCases.length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                selectedFilter === tab.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                selectedFilter === tab.id ? 'bg-indigo-800 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search patient, MRN, reference..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

      </div>

      {/* Clinical Patient Queue Table / Cards */}
      <div className="space-y-3">
        {filteredScreenings.length === 0 ? (
          <div className="rounded-3xl bg-slate-900/60 border border-dashed border-slate-800 p-12 text-center">
            <Eye className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-300">No screenings match this filter</p>
            <p className="text-xs text-slate-500 mt-1">Try selecting "All Cases" or clearing search terms.</p>
          </div>
        ) : (
          filteredScreenings.map((screening) => (
            <div
              key={screening.id}
              className={`rounded-2xl bg-slate-900 border transition-all p-5 shadow-sm hover:shadow-md ${
                screening.priority === 'urgent' && screening.status !== 'diagnosed'
                  ? 'border-rose-500/40 bg-rose-950/10'
                  : 'border-slate-800 hover:border-indigo-500/40'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                
                {/* Patient Profile & Reference */}
                <div className="flex items-start gap-4">
                  {/* Fundus Retinal Preview */}
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-700 shrink-0 bg-slate-950">
                    <img 
                      src={screening.left_eye_image_url} 
                      alt="Fundus"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-0.5 right-0.5 text-[8px] bg-slate-950/80 px-1 rounded text-teal-300 font-mono">
                      OS
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-white">
                        {screening.patient?.full_name || 'Patient'}
                      </span>
                      <span className="text-xs font-mono text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-500/20">
                        {screening.reference_id}
                      </span>
                      <StatusBadge status={screening.status} size="sm" />
                      {screening.priority === 'urgent' && (
                        <StatusBadge priority="urgent" size="sm" />
                      )}
                    </div>

                    <p className="text-xs text-slate-400 flex flex-wrap items-center gap-3">
                      <span>MRN: <strong className="text-slate-300">{screening.patient?.medical_record_number || 'MRN-2026-XXXX'}</strong></span>
                      <span>•</span>
                      <span>DOB: {screening.patient?.date_of_birth || 'N/A'}</span>
                      <span>•</span>
                      <span>Gender: {screening.patient?.gender || 'N/A'}</span>
                    </p>

                    <p className="text-xs text-slate-300 line-clamp-1 pt-0.5">
                      <strong className="text-slate-400 font-normal">Symptoms: </strong>
                      {screening.symptoms.join(', ')}
                    </p>
                  </div>
                </div>

                {/* Middle: Clinical Metrics & Hashes */}
                <div className="flex flex-col justify-center space-y-1.5 lg:border-l lg:border-slate-800 lg:pl-5">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-slate-400">Reported IOP:</span>
                    <span className="font-mono text-slate-200">
                      OS: <strong className={screening.reported_iop_left && screening.reported_iop_left > 21 ? 'text-rose-400' : 'text-teal-400'}>
                        {screening.reported_iop_left ? `${screening.reported_iop_left} mmHg` : 'N/A'}
                      </strong>
                    </span>
                    <span>|</span>
                    <span className="font-mono text-slate-200">
                      OD: <strong className={screening.reported_iop_right && screening.reported_iop_right > 21 ? 'text-rose-400' : 'text-teal-400'}>
                        {screening.reported_iop_right ? `${screening.reported_iop_right} mmHg` : 'N/A'}
                      </strong>
                    </span>
                  </div>

                  {screening.report && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Diagnosis:</span>
                      <StatusBadge diagnosis={screening.report.diagnosis} size="sm" />
                      <span className="text-xs font-mono text-slate-300">
                        CDR: {screening.report.left_cup_to_disc_ratio} / {screening.report.right_cup_to_disc_ratio}
                      </span>
                    </div>
                  )}

                  <HashBadge 
                    hash={screening.record_payload_hash} 
                    label="Payload Digest" 
                    isAnchored={screening.blockchain_anchor_status === 'anchored'} 
                  />
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {screening.report ? (
                    <button
                      onClick={() => onViewReport(screening)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all"
                    >
                      <FileText className="w-3.5 h-3.5 text-teal-400" />
                      <span>View Diagnosis Report</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => onOpenWorkstation(screening)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all hover:scale-105"
                    >
                      <Stethoscope className="w-4 h-4" />
                      <span>Launch Diagnostic Station</span>
                    </button>
                  )}
                </div>

              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};
