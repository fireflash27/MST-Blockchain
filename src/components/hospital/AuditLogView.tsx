import React from 'react';
import { AuditLog } from '../../types/database';
import { HashBadge } from '../common/HashBadge';
import { 
  History, 
  ShieldCheck, 
  Clock, 
  User, 
  FileText, 
  Activity, 
  Cpu 
} from 'lucide-react';

interface AuditLogViewProps {
  logs: AuditLog[];
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ logs }) => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-300">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">System & Provenance Audit Logs</h2>
            <p className="text-xs text-slate-400">
              Immutable chronological record of patient submissions, clinician evaluations, and cryptographic hash events
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-teal-300 bg-teal-950/60 px-3 py-1.5 rounded-xl border border-teal-500/30">
          <ShieldCheck className="w-4 h-4 text-teal-400" />
          <span>{logs.length} Events Tracked</span>
        </div>
      </div>

      <div className="space-y-3">
        {logs.map((log) => (
          <div
            key={log.id}
            className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2 hover:border-slate-700 transition-colors"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-teal-400" />
                <span className="text-xs font-bold text-white">{log.action}</span>
                <span className="text-[10px] font-mono uppercase bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
                  {log.entity_type}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>{new Date(log.created_at).toLocaleString()}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 pt-1">
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-400" />
                <span>Actor: <strong className="text-slate-300">{log.actor_name || log.actor_id || 'System'}</strong></span>
              </div>

              {log.metadata && (
                <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
                  {Object.entries(log.metadata).map(([key, value]) => (
                    <span key={key} className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-slate-300">
                      {key}: <strong className="text-teal-300">{String(value)}</strong>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
