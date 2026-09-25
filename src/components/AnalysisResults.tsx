import React from 'react';
import {
  FileText,
  Binary,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import {
  FileFragment,
  SupportedFileType,
  CompatibilityPair,
  ReconstructionResult,
} from '../types/fragment';

interface AnalysisResultsProps {
  fragments: FileFragment[];
  detectedFileType: SupportedFileType;
  predictedOrder: string[];
  pairwiseTransitions: {
    fromName: string;
    toName: string;
    score: number;
    reason: string;
  }[];
  overallConfidence: number;
  isUncertain: boolean;
  uncertaintyReason?: string;
}

export const AnalysisResults: React.FC<AnalysisResultsProps> = ({
  fragments,
  detectedFileType,
  predictedOrder,
  pairwiseTransitions,
  overallConfidence,
  isUncertain,
  uncertaintyReason,
}) => {
  return (
    <div className="space-y-4">
      <div className="border-b border-slate-800 pb-3">
        <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
          <Binary className="h-4 w-4 text-cyan-400" />
          <span>2. Fragment Forensic Analysis & Connection Modeling</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Deterministic evaluation of file format headers, magic bytes, boundary markers, and pairwise structural transitions.
        </p>
      </div>

      {/* Primary Evidence Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 space-y-1">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
            Detected File Type
          </span>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-bold text-xs">
              {detectedFileType.slice(0, 3)}
            </div>
            <span className="text-base font-bold text-white font-mono">{detectedFileType}</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 space-y-1">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
            Analyzed Fragments
          </span>
          <p className="text-base font-bold text-cyan-400 font-mono tabular-nums">
            {fragments.length} chunks
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 space-y-1">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
            Algorithmic Confidence
          </span>
          <div className="flex items-center gap-1.5">
            <TrendingUp
              className={`h-4 w-4 ${
                overallConfidence >= 80
                  ? 'text-emerald-400'
                  : overallConfidence >= 55
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
            />
            <span
              className={`text-base font-bold font-mono tabular-nums ${
                overallConfidence >= 80
                  ? 'text-emerald-400'
                  : overallConfidence >= 55
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
            >
              {overallConfidence}%
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 space-y-1">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
            Reconstruction Certainty
          </span>
          <div className="flex items-center gap-1.5">
            {isUncertain ? (
              <span className="flex items-center gap-1 text-xs font-mono font-semibold text-rose-400">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>UNCERTAIN</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs font-mono font-semibold text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>CONFIRMED OPTIMAL</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Uncertainty Notice if flagged */}
      {isUncertain && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs space-y-1 text-rose-300">
          <div className="flex items-center gap-2 font-bold font-mono text-rose-200">
            <AlertTriangle className="h-4 w-4 text-rose-400" />
            <span>Reconstruction uncertain</span>
          </div>
          <p className="leading-relaxed">
            {uncertaintyReason ||
              'Technical evidence across fragment boundaries is ambiguous. The system cannot guarantee authoritative ordering without additional sector context.'}
          </p>
        </div>
      )}

      {/* Possible Fragment Connections & Pairwise Transitions */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
            Fragment Analysis & Pairwise Transitions
          </h3>
          <span className="text-[11px] text-slate-500 font-mono">
            Evaluated using structural continuity & signature alignment
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {pairwiseTransitions.map((trans, idx) => (
            <div
              key={idx}
              className="rounded-lg border border-slate-800/80 bg-slate-950/70 p-3 space-y-2 font-mono"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <span className="text-cyan-400">{trans.fromName}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-500" />
                  <span className="text-cyan-300">{trans.toName}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-400">Compatibility:</span>
                  <span
                    className={`text-xs font-bold tabular-nums ${
                      trans.score >= 80
                        ? 'text-emerald-400'
                        : trans.score >= 50
                        ? 'text-amber-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {trans.score}%
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                {trans.reason}
              </p>
            </div>
          ))}
        </div>

        {/* Predicted Order Summary Banner */}
        <div className="mt-3 rounded-lg border border-cyan-500/30 bg-cyan-950/20 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Predicted Order:</span>
            <span className="font-bold text-cyan-300 text-sm tracking-wide">
              {predictedOrder.join(' → ')}
            </span>
          </div>

          <span className="text-slate-400 text-[11px]">
            Ranked via exhaustive combinatorial graph evaluation
          </span>
        </div>
      </div>
    </div>
  );
};
