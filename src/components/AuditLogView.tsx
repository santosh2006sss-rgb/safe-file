import React from 'react';
import { Terminal, ScrollText, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { AuditLogEntry } from '../types/fragment';

interface AuditLogViewProps {
  logs: AuditLogEntry[];
  onClearLogs?: () => void;
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ logs }) => {
  const getActionBadgeColor = (action: AuditLogEntry['action']) => {
    switch (action) {
      case 'UPLOAD':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'ANALYZE':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
      case 'SCORE':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
      case 'ORDER':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'RECONSTRUCT':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'VALIDATE':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'HASH':
        return 'bg-teal-500/20 text-teal-300 border-teal-500/30';
      case 'REPORT':
        return 'bg-slate-700 text-slate-200 border-slate-600';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <Terminal className="h-4 w-4 text-cyan-400" />
            <span>Forensic Operations Audit Log</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Immutable chain-of-custody operation events recorded with high-resolution timestamps.
          </p>
        </div>

        <span className="text-[11px] font-mono text-slate-500">
          {logs.length} events logged
        </span>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 max-h-64 overflow-y-auto font-mono text-[11px] space-y-1.5 divide-y divide-slate-800/40">
        {logs.length === 0 ? (
          <div className="py-6 text-center text-slate-500 italic">
            No operations logged yet. Upload fragments or run demo to populate audit stream.
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="pt-1.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-900/60 p-1 rounded transition"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-slate-500 text-[10px] flex-shrink-0">
                  [{log.timestamp}]
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold border flex-shrink-0 ${getActionBadgeColor(
                    log.action
                  )}`}
                >
                  {log.action}
                </span>
                <span className="text-slate-300 truncate font-sans text-xs">
                  {log.details}
                </span>
              </div>

              <span
                className={`text-[10px] uppercase font-bold flex-shrink-0 ${
                  log.level === 'success'
                    ? 'text-emerald-400'
                    : log.level === 'warning'
                    ? 'text-amber-400'
                    : log.level === 'error'
                    ? 'text-rose-400'
                    : 'text-slate-400'
                }`}
              >
                {log.level}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
