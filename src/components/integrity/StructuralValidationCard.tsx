import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  FileCheck,
  ShieldCheck,
  AlertOctagon,
  ArrowRight,
  Info,
} from 'lucide-react';
import { StructuralValidationResult } from '../../types/integrity';

interface StructuralValidationCardProps {
  validation: StructuralValidationResult;
  hasReference: boolean;
}

export const StructuralValidationCard: React.FC<StructuralValidationCardProps> = ({
  validation,
  hasReference,
}) => {
  const getStatusBadge = () => {
    switch (validation.overallStatus) {
      case 'STRUCTURALLY VALIDATED':
        return {
          bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
          title: 'STRUCTURALLY VALIDATED',
        };
      case 'PARTIALLY RECOVERED':
        return {
          bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          icon: <AlertTriangle className="w-5 h-5 text-amber-400" />,
          title: 'PARTIALLY RECOVERED',
        };
      case 'CORRUPTED':
        return {
          bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
          icon: <XCircle className="w-5 h-5 text-rose-400" />,
          title: 'CORRUPTED STREAM',
        };
      default:
        return {
          bg: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
          icon: <HelpCircle className="w-5 h-5 text-slate-400" />,
          title: 'UNABLE TO BE VERIFIED',
        };
    }
  };

  const badge = getStatusBadge();

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl backdrop-blur-sm">
      {/* Header and Reference notice */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-cyan-400" /> Deep Structural & Format Validation
            </h3>
            <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border ${badge.bg}`}>
              {badge.title}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Byte-level format specification parsing, container hierarchy traversal, and marker audits.
          </p>
        </div>

        {!hasReference && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-400">
            <Info className="w-3.5 h-3.5 text-cyan-400" />
            <span>Reference File: <strong className="text-slate-300">Not Available</strong></span>
          </div>
        )}
      </div>

      {/* When no reference file is available banner */}
      {!hasReference && (
        <div className="mb-4 p-3 bg-cyan-950/20 border border-cyan-800/30 rounded-lg flex items-start gap-2.5 text-xs text-cyan-200">
          <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold text-cyan-300">Standalone Structural Assessment:</span>{' '}
            {validation.statusNote}
          </div>
        </div>
      )}

      {/* Structural checklist grid */}
      <div className="space-y-2 mb-5">
        <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
          Format Verification Item Breakdown
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {validation.checks.map((chk) => {
            const isPass = chk.status === 'PASS';
            const isWarn = chk.status === 'WARN';
            return (
              <div
                key={chk.id}
                className={`p-3 rounded-lg border flex items-start gap-2.5 transition-colors ${
                  isPass
                    ? 'bg-slate-950/60 border-slate-800/80 hover:border-emerald-500/30'
                    : isWarn
                    ? 'bg-amber-950/10 border-amber-800/30'
                    : 'bg-rose-950/10 border-rose-800/30'
                }`}
              >
                <div className="mt-0.5">
                  {isPass ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : isWarn ? (
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between text-xs mb-0.5">
                    <span className="font-medium text-slate-200">{chk.label}</span>
                    <span
                      className={`font-mono text-[10px] px-1.5 py-0.2 rounded border ${
                        isPass
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : isWarn
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}
                    >
                      {chk.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{chk.details}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Corruption or Anomaly Callout */}
      {(validation.detectedIssues.length > 0 || validation.missingSections.length > 0) && (
        <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-800/40 mb-5">
          <div className="flex items-center gap-2 text-rose-400 font-semibold text-xs mb-2">
            <AlertOctagon className="w-4 h-4" /> Detected Structural Anomalies & Missing Sections
          </div>
          <div className="space-y-1.5 text-xs text-rose-200">
            {validation.detectedIssues.map((issue, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="text-rose-400 font-bold">•</span>
                <span>{issue}</span>
              </div>
            ))}
            {validation.missingSections.map((sec, idx) => (
              <div key={`m_${idx}`} className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">• Missing:</span>
                <span>{sec}</span>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t border-rose-900/40 text-xs text-slate-300">
            <span className="font-semibold text-rose-300">Recommendation:</span>{' '}
            The file requires further recovery or manual sector verification. Inspect raw sector boundaries on the original storage device.
          </div>
        </div>
      )}

      {/* Forensic recommendations */}
      {validation.recommendations.length > 0 && (
        <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800">
          <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Investigative Recommendations
          </div>
          <div className="space-y-1.5 text-xs text-slate-400">
            {validation.recommendations.map((rec, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <ArrowRight className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                <span>{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
