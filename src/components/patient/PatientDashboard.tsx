import React, { useState } from 'react';
import { UserProfile, ScreeningRequest } from '../../types/database';
import { StatusBadge } from '../common/StatusBadge';
import { HashBadge } from '../common/HashBadge';
import { Web3PermissionManagerModal } from './Web3PermissionManagerModal';
import { 
  Eye, 
  PlusCircle, 
  Calendar, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  ChevronRight, 
  Sparkles,
  User,
  HeartPulse,
  Key,
  Lock
} from 'lucide-react';

interface PatientDashboardProps {
  user: UserProfile;
  screenings: ScreeningRequest[];
  onNewScreening: () => void;
  onViewScreeningDetail: (screening: ScreeningRequest) => void;
  onOpenBlockchainModal: () => void;
}

export const PatientDashboard: React.FC<PatientDashboardProps> = ({
  user,
  screenings,
  onNewScreening,
  onViewScreeningDetail,
  onOpenBlockchainModal
}) => {
  const [permissionModalScreening, setPermissionModalScreening] = useState<ScreeningRequest | null>(null);

  const completedScreenings = screenings.filter(s => s.status === 'diagnosed' || s.status === 'completed' || s.status === 'urgent_referral');
  const pendingScreenings = screenings.filter(s => s.status === 'submitted' || s.status === 'in_review');
  const urgentAlerts = screenings.filter(s => s.priority === 'urgent' || s.status === 'urgent_referral');

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Patient Profile & Overview Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-teal-950/40 border border-slate-800 p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              <span>Glaucoma Screening Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome back, {user.full_name}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-md">
                <User className="w-3.5 h-3.5 text-slate-300" />
                MRN: <strong className="text-slate-200">{user.medical_record_number || 'MRN-2026-9821'}</strong>
              </span>
              <span className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-md">
                <Calendar className="w-3.5 h-3.5 text-slate-300" />
                DOB: <strong className="text-slate-200">{user.date_of_birth || '1974-05-12'}</strong>
              </span>
              <span className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-md">
                <HeartPulse className="w-3.5 h-3.5 text-teal-400" />
                Gender: <strong className="text-slate-200">{user.gender || 'Female'}</strong>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onNewScreening}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold text-sm shadow-lg shadow-teal-500/25 transition-all hover:scale-105 active:scale-95"
            >
              <PlusCircle className="w-5 h-5" />
              <span>Request Glaucoma Screening</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/60">
            <p className="text-xs text-slate-400 font-medium">Total Screenings</p>
            <p className="text-2xl font-black text-white mt-1">{screenings.length}</p>
          </div>
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/60">
            <p className="text-xs text-slate-400 font-medium">Pending Doctor Review</p>
            <p className="text-2xl font-black text-amber-400 mt-1">{pendingScreenings.length}</p>
          </div>
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/60">
            <p className="text-xs text-slate-400 font-medium">Completed Diagnoses</p>
            <p className="text-2xl font-black text-emerald-400 mt-1">{completedScreenings.length}</p>
          </div>
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/60">
            <p className="text-xs text-slate-400 font-medium">Urgent Advisories</p>
            <p className={`text-2xl font-black mt-1 ${urgentAlerts.length > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
              {urgentAlerts.length}
            </p>
          </div>
        </div>
      </div>

      {/* Screenings List Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Eye className="w-5 h-5 text-teal-400" />
              Your Eye Screening History
            </h2>
            <p className="text-xs text-slate-400">
              Each record is cryptographically fingerprinted with SHA-256 for clinical authenticity.
            </p>
          </div>

          <button
            onClick={onOpenBlockchainModal}
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 bg-cyan-950/40 px-3 py-1.5 rounded-xl border border-cyan-800/40"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Verify Data Integrity</span>
          </button>
        </div>

        {screenings.length === 0 ? (
          <div className="rounded-3xl bg-slate-900/60 border border-dashed border-slate-800 p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center mx-auto mb-4">
              <Eye className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-white">No Glaucoma Screenings Yet</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-6">
              Early detection prevents irreversible optic nerve damage. Upload your left and right eye fundus photos for doctor review.
            </p>
            <button
              onClick={onNewScreening}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Submit First Screening</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {screenings.map((screening) => (
              <div
                key={screening.id}
                onClick={() => onViewScreeningDetail(screening)}
                className="group relative overflow-hidden rounded-2xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-teal-500/40 p-5 transition-all shadow-md cursor-pointer"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                  
                  {/* Left Column: Reference, Timestamps, Status */}
                  <div className="flex items-start gap-4">
                    {/* Fundus Preview Thumbnail */}
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-700 shrink-0 bg-slate-950">
                      <img 
                        src={screening.left_eye_image_url} 
                        alt="Left Fundus Scan"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <span className="absolute bottom-0.5 right-0.5 text-[8px] bg-slate-950/80 px-1 rounded text-teal-300 font-mono">
                        OS/OD
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm font-bold text-teal-300">
                          {screening.reference_id}
                        </span>
                        <StatusBadge status={screening.status} size="sm" />
                        {screening.priority === 'urgent' && (
                          <StatusBadge priority="urgent" size="sm" />
                        )}
                      </div>

                      <p className="text-xs text-slate-300 line-clamp-1">
                        <strong className="text-slate-400 font-normal">Symptoms: </strong>
                        {screening.symptoms.length > 0 ? screening.symptoms.join(', ') : 'Routine checkup'}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          {new Date(screening.created_at).toLocaleDateString(undefined, { 
                            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                          })}
                        </span>
                        {screening.doctor && (
                          <span className="text-indigo-400 font-medium">
                            Reviewed by: {screening.doctor.full_name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Middle Column: Diagnosis summary if completed */}
                  <div className="flex flex-col justify-center space-y-1.5 md:border-l md:border-slate-800 md:pl-5">
                    {screening.report ? (
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] uppercase font-bold text-slate-400">Diagnosis:</span>
                          <StatusBadge diagnosis={screening.report.diagnosis} size="sm" />
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-300 font-mono">
                          <span>Left CDR: <strong className="text-teal-300">{screening.report.left_cup_to_disc_ratio}</strong></span>
                          <span>Right CDR: <strong className="text-teal-300">{screening.report.right_cup_to_disc_ratio}</strong></span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 italic flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                        <span>Awaiting ophthalmologist evaluation...</span>
                      </div>
                    )}

                    <div className="pt-1">
                      <HashBadge 
                        hash={screening.record_payload_hash} 
                        label="Record SHA-256" 
                        isAnchored={screening.blockchain_anchor_status === 'anchored'} 
                      />
                    </div>
                  </div>

                  {/* Right Column: View Report & Web3 Permissions Buttons */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPermissionModalScreening(screening);
                      }}
                      className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-teal-300 bg-slate-950/80 hover:bg-teal-950/40 px-3.5 py-2 rounded-xl border border-slate-700/80 hover:border-teal-500/50 transition-all"
                    >
                      <Key className="w-3.5 h-3.5 text-teal-400" />
                      <span>Web3 Permissions</span>
                    </button>

                    <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-teal-400 group-hover:text-teal-300 bg-slate-800/80 group-hover:bg-teal-950/40 px-3.5 py-2 rounded-xl border border-slate-700/60 group-hover:border-teal-500/40 transition-all">
                      <span>{screening.report ? 'View Glaucoma Report' : 'View Submission Details'}</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>

                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Glaucoma Awareness & Early Screening Advice Card */}
      <div className="rounded-3xl bg-gradient-to-r from-teal-950/40 via-slate-900 to-indigo-950/30 border border-teal-500/20 p-6 flex flex-col sm:flex-row items-start gap-5">
        <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center shrink-0">
          <Eye className="w-6 h-6" />
        </div>
        <div className="space-y-1.5 text-xs">
          <h4 className="text-sm font-bold text-white">Understanding Glaucoma & Optic Disc Cupping</h4>
          <p className="text-slate-300 leading-relaxed">
            Glaucoma is often called the <em>"silent thief of sight"</em> because optic nerve fibers are slowly damaged without early pain. A <strong>Cup-to-Disc Ratio (CDR)</strong> higher than 0.6 or asymmetry between eyes is a key clinical biomarker. Regular fundus screening and IOP monitoring help catch abnormalities years before irreversible vision loss occurs.
          </p>
        </div>
      </div>

      {/* Web3 On-Chain Permission Manager Modal */}
      {permissionModalScreening && (
        <Web3PermissionManagerModal
          screening={permissionModalScreening}
          onClose={() => setPermissionModalScreening(null)}
        />
      )}

    </div>
  );
};
