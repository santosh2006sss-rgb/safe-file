import React from 'react';
import { Layers, ArrowRight, ShieldCheck, Play, Cpu, AlertTriangle } from 'lucide-react';
import { FileFragment } from '../types/fragment';

interface ReconstructionViewProps {
  orderedFragments: FileFragment[];
  overallConfidence: number;
  isUncertain: boolean;
  uncertaintyReason?: string;
  onReconstruct: () => void;
  isReconstructing: boolean;
  hasReconstructed: boolean;
}

export const ReconstructionView: React.FC<ReconstructionViewProps> = ({
  orderedFragments,
  overallConfidence,
  isUncertain,
  uncertaintyReason,
  onReconstruct,
  isReconstructing,
  hasReconstructed,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <Layers className="h-4 w-4 text-cyan-400" />
            <span>4. Proposed Sequence & Binary Reconstruction</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Algorithmic sequencing based on global permutation score maximization. Concatenation preserves byte fidelity without modification.
          </p>
        </div>

        <button
          onClick={onReconstruct}
          disabled={isReconstructing || orderedFragments.length < 3}
          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2.5 text-xs font-bold text-slate-950 hover:from-cyan-400 hover:to-blue-500 transition shadow-lg shadow-cyan-500/25 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
        >
          <Play className={`h-4 w-4 fill-current ${isReconstructing ? 'animate-spin' : ''}`} />
          <span>{isReconstructing ? 'Reconstructing Byte Stream...' : 'Reconstruct File'}</span>
        </button>
      </div>

      {/* Uncertainty Alert if flagged */}
      {isUncertain && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300 font-mono flex items-start gap-2.5">
          <AlertTriangle className="h-4 w-4 text-rose-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <strong className="text-rose-200">Reconstruction uncertain:</strong>
            <p className="text-[11px] leading-relaxed">
              {uncertaintyReason || 'Sequence generated with low margin over alternative arrangements. Proceed with caution during forensic audit.'}
            </p>
          </div>
        </div>
      )}

      {/* Proposed Reconstruction Box as required by prompt */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
            Proposed Reconstruction
          </h3>

          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-slate-400">Overall Confidence:</span>
            <span
              className={`text-sm font-bold tabular-nums ${
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

        {/* Numbered Sequence List */}
        <div className="space-y-2 font-mono text-xs">
          {orderedFragments.map((frag, idx) => (
            <div
              key={frag.id}
              className="flex items-center justify-between rounded-lg bg-slate-950/80 border border-slate-800/80 p-3 hover:border-slate-700 transition"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-cyan-500/10 text-cyan-400 font-bold text-xs border border-cyan-500/30">
                  {idx + 1}
                </span>
                <span className="font-semibold text-slate-200">{frag.name}</span>
                <span className="text-slate-500 text-[11px] hidden sm:inline">
                  ({frag.size.toLocaleString()} bytes)
                </span>
              </div>

              <div className="flex items-center gap-2">
                {idx === 0 && frag.features.isLikelyStart && (
                  <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-400 font-semibold border border-emerald-500/30">
                    File Start Anchor
                  </span>
                )}
                {idx === orderedFragments.length - 1 && frag.features.isLikelyEnd && (
                  <span className="rounded bg-purple-500/20 px-2 py-0.5 text-[10px] text-purple-400 font-semibold border border-purple-500/30">
                    File End Anchor
                  </span>
                )}
                <span className="text-[10px] text-slate-500 select-all truncate max-w-[120px] sm:max-w-none">
                  {frag.sha256.slice(0, 12)}...
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Visual Assembly Flow */}
        <div className="mt-4 pt-3 border-t border-slate-800/80">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block mb-2">
            Reconstruction Chain Assembly Pipeline:
          </span>
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            {orderedFragments.map((frag, idx) => (
              <React.Fragment key={frag.id}>
                <div className="rounded-lg bg-slate-800/80 border border-slate-700 px-3 py-1.5 text-cyan-300 font-semibold shadow-sm">
                  {frag.name}
                </div>
                {idx < orderedFragments.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-cyan-500 flex-shrink-0" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
