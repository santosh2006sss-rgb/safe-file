import React from 'react';
import { Sparkles, BrainCircuit, ShieldCheck, CheckCircle2, AlertTriangle, FileCode } from 'lucide-react';
import { AIExplanationData } from '../types/fragment';

interface AIExplanationPanelProps {
  aiExplanation?: AIExplanationData;
  isLoading: boolean;
  onRefreshExplanation: () => void;
}

export const AIExplanationPanel: React.FC<AIExplanationPanelProps> = ({
  aiExplanation,
  isLoading,
  onRefreshExplanation,
}) => {
  if (!aiExplanation && !isLoading) return null;

  return (
    <div className="rounded-xl border border-cyan-500/30 bg-slate-900/80 p-5 space-y-4 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <BrainCircuit className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white font-mono">
                AI Forensics Specialist Assessment
              </h3>
              <span className="rounded bg-cyan-500/20 px-2 py-0.5 text-[10px] font-mono text-cyan-300 border border-cyan-500/30">
                {aiExplanation?.source || 'Gemini 3.8 Flash'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Heuristic explanation & technical transition rationale (Deterministic byte reconstruction verified)
            </p>
          </div>
        </div>

        <button
          onClick={onRefreshExplanation}
          disabled={isLoading}
          className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-mono text-slate-300 hover:text-white hover:bg-slate-700 transition disabled:opacity-50"
        >
          <Sparkles className={`h-3 w-3 text-cyan-400 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{isLoading ? 'Generating Assessment...' : 'Re-Analyze with AI'}</span>
        </button>
      </div>

      {isLoading ? (
        <div className="py-8 flex flex-col items-center justify-center text-center space-y-2">
          <BrainCircuit className="h-8 w-8 text-cyan-400 animate-pulse" />
          <p className="text-xs font-mono text-slate-300">
            Synthesizing byte continuity and structural evidence with Gemini...
          </p>
        </div>
      ) : aiExplanation ? (
        <div className="space-y-4 text-xs font-sans">
          {/* Executive Summary */}
          <div className="rounded-lg bg-slate-950/80 border border-slate-800/80 p-3.5 space-y-1">
            <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block font-semibold">
              Executive Reconstruction Summary
            </span>
            <p className="text-slate-200 leading-relaxed font-mono text-[11px]">
              {aiExplanation.summary}
            </p>
          </div>

          {/* Forensic Transition Explanations */}
          {aiExplanation.connectionsExplanation?.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block font-semibold">
                Boundary Transition Rationale:
              </span>
              <div className="grid grid-cols-1 gap-2">
                {aiExplanation.connectionsExplanation.map((item, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg bg-slate-950/60 border border-slate-800/70 p-3 space-y-1 font-mono text-[11px]"
                  >
                    <div className="flex items-center justify-between text-cyan-300 font-bold">
                      <span>{item.transition}</span>
                      <span className="text-emerald-400 tabular-nums">{item.score}</span>
                    </div>
                    <p className="text-slate-300 font-sans text-xs leading-relaxed">
                      {item.analysis}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Verdict & Recommendations */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="rounded-lg bg-slate-950/60 border border-slate-800/80 p-3 space-y-1">
              <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block font-semibold flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                <span>Forensic Verdict</span>
              </span>
              <p className="text-slate-300 text-xs leading-relaxed font-sans">
                {aiExplanation.forensicVerdict}
              </p>
            </div>

            <div className="rounded-lg bg-slate-950/60 border border-slate-800/80 p-3 space-y-1">
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block font-semibold flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" />
                <span>Audit Recommendation</span>
              </span>
              <p className="text-slate-300 text-xs leading-relaxed font-sans">
                {aiExplanation.recommendation}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
