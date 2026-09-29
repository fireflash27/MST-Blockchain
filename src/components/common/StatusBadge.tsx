import React from 'react';
import { ScreeningStatus, PriorityLevel, GlaucomaDiagnosis, RiskLevel } from '../../types/database';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  AlertOctagon, 
  Eye, 
  ShieldCheck, 
  Activity 
} from 'lucide-react';

interface StatusBadgeProps {
  status?: ScreeningStatus;
  priority?: PriorityLevel;
  diagnosis?: GlaucomaDiagnosis;
  risk?: RiskLevel;
  blockchainStatus?: 'pending_anchor' | 'anchored' | 'verified';
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  priority,
  diagnosis,
  risk,
  blockchainStatus,
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs font-medium',
    lg: 'px-3 py-1.5 text-sm font-semibold'
  }[size];

  // 1. Screening Status
  if (status) {
    const config: Record<ScreeningStatus, { label: string; bg: string; text: string; icon: any }> = {
      submitted: {
        label: 'Submitted / Pending',
        bg: 'bg-amber-500/10 border-amber-500/30',
        text: 'text-amber-400',
        icon: Clock
      },
      in_review: {
        label: 'Under Evaluation',
        bg: 'bg-blue-500/10 border-blue-500/30',
        text: 'text-blue-400',
        icon: Activity
      },
      diagnosed: {
        label: 'Screening Completed',
        bg: 'bg-emerald-500/10 border-emerald-500/30',
        text: 'text-emerald-400',
        icon: CheckCircle2
      },
      completed: {
        label: 'Closed / Archived',
        bg: 'bg-slate-500/10 border-slate-500/30',
        text: 'text-slate-400',
        icon: CheckCircle2
      },
      urgent_referral: {
        label: 'Urgent Referral Required',
        bg: 'bg-rose-500/15 border-rose-500/40 animate-pulse',
        text: 'text-rose-400 font-semibold',
        icon: AlertOctagon
      }
    };

    const c = config[status] || config.submitted;
    const Icon = c.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full border ${c.bg} ${c.text} ${sizeClasses}`}>
        <Icon className="w-3.5 h-3.5" />
        {c.label}
      </span>
    );
  }

  // 2. Priority
  if (priority) {
    const config: Record<PriorityLevel, { label: string; bg: string; text: string }> = {
      routine: { label: 'Routine Priority', bg: 'bg-slate-800 border-slate-700', text: 'text-slate-300' },
      elevated: { label: 'Elevated Priority', bg: 'bg-amber-950/60 border-amber-500/30', text: 'text-amber-300' },
      urgent: { label: 'Urgent / High Risk', bg: 'bg-red-950/80 border-red-500/40', text: 'text-red-300 font-semibold' }
    };
    const c = config[priority] || config.routine;
    return (
      <span className={`inline-flex items-center rounded-md border ${c.bg} ${c.text} ${sizeClasses}`}>
        {c.label}
      </span>
    );
  }

  // 3. Glaucoma Diagnosis
  if (diagnosis) {
    const formatDiag: Record<GlaucomaDiagnosis, { label: string; color: string }> = {
      normal: { label: 'Normal / Healthy Disc', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
      glaucoma_suspect: { label: 'Glaucoma Suspect', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
      open_angle_glaucoma: { label: 'Primary Open-Angle Glaucoma (POAG)', color: 'bg-rose-500/10 text-rose-400 border-rose-500/30' },
      angle_closure_glaucoma: { label: 'Primary Angle-Closure (PACG)', color: 'bg-red-500/15 text-red-400 border-red-500/40' },
      normal_tension_glaucoma: { label: 'Normal-Tension Glaucoma', color: 'bg-orange-500/10 text-orange-400 border-orange-500/30' },
      ocular_hypertension: { label: 'Ocular Hypertension (High IOP)', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
      advanced_glaucoma: { label: 'Advanced Glaucomatous Neuropathy', color: 'bg-purple-500/15 text-purple-400 border-purple-500/40' }
    };
    const d = formatDiag[diagnosis] || { label: diagnosis, color: 'bg-slate-800 text-slate-300 border-slate-700' };
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full border ${d.color} ${sizeClasses}`}>
        <Eye className="w-3.5 h-3.5" />
        {d.label}
      </span>
    );
  }

  // 4. Risk Level
  if (risk) {
    const riskMap: Record<RiskLevel, { label: string; color: string }> = {
      low: { label: 'Low Risk', color: 'bg-emerald-950/60 border-emerald-500/30 text-emerald-300' },
      moderate: { label: 'Moderate Risk', color: 'bg-amber-950/60 border-amber-500/30 text-amber-300' },
      high: { label: 'High Risk', color: 'bg-orange-950/60 border-orange-500/30 text-orange-300' },
      critical: { label: 'Critical / Sight Threatening', color: 'bg-red-950/80 border-red-500/50 text-red-300' }
    };
    const r = riskMap[risk];
    return (
      <span className={`inline-flex items-center gap-1 rounded-md border ${r.color} ${sizeClasses}`}>
        <AlertTriangle className="w-3.5 h-3.5" />
        {r.label}
      </span>
    );
  }

  // 5. Blockchain Anchor Status
  if (blockchainStatus) {
    if (blockchainStatus === 'anchored' || blockchainStatus === 'verified') {
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full border bg-teal-500/10 border-teal-500/40 text-teal-300 ${sizeClasses}`}>
          <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
          MST Anchored & Verified
        </span>
      );
    }
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full border bg-slate-800/80 border-slate-700 text-slate-400 ${sizeClasses}`}>
        <span className="w-2 h-2 rounded-full bg-amber-400/80 animate-pulse" />
        Ready for MST Anchor
      </span>
    );
  }

  return null;
};
