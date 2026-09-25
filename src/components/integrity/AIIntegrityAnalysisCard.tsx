import React from 'react';
import { Sparkles, Brain, ShieldAlert, CheckCircle2, RefreshCw, Cpu, BookOpen } from 'lucide-react';
import { AIIntegrityAnalysisResult } from '../../types/integrity';

interface AIIntegrityAnalysisCardProps {
  analysis: AIIntegrityAnalysisResult | null;
  isLoading: boolean;
  onRefresh: () => void;
}

export const AIIntegrityAnalysisCard: React.FC<AIIntegrityAnalysisCardProps> = ({
  analysis,
  isLoading,
  onRefresh,
}) => {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl backdrop-blur-sm relative overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-100">
                AI Forensic Integrity Interpretation
              </h3>
              {analysis && (
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                  <Cpu className="w-3 h-3" />
                  {analysis.source === 'gemini-3.8-flash' ? 'Gemini 3.8 Flash' : 'Forensic Rule Engine'}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Automated expert evaluation of file integrity, structural findings, and chain-of-custody implications.
            </p>
          </div>
        </div>

        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-semibold transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Consulting AI...' : 'Re-Analyze with AI'}
        </button>
      </div>

      {isLoading && (
        <div className="py-8 flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs text-slate-300 font-medium">
            Evaluating binary signatures, checksum hashes, and structural markers...
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Synthesizing digital forensics evaluation via Google Gen AI.
          </p>
        </div>
      )}

      {!isLoading && !analysis && (
        <div className="py-6 text-center text-xs text-slate-400">
          Click &ldquo;Re-Analyze with AI&rdquo; to generate automated forensic commentary on this recovered stream.
        </div>
      )}

      {!isLoading && analysis && (
        <div className="space-y-4">
          {/* Executive Summary */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 leading-relaxed">
            <div className="font-semibold text-cyan-400 mb-1 flex items-center gap-1.5">
              <Brain className="w-4 h-4" /> Forensic Executive Summary
            </div>
            <p>{analysis.summary}</p>
          </div>

          {/* Critical Integrity vs Authenticity Distinction */}
          <div className="p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-500/30 text-xs text-indigo-200 leading-relaxed">
            <div className="font-semibold text-indigo-300 mb-1 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              Core Principle: Integrity Verification vs. Authenticity Verification
            </div>
            <p className="text-slate-300">{analysis.integrityVsAuthenticityExplanation}</p>
          </div>

          {/* Technical Findings */}
          {analysis.technicalFindings?.length > 0 && (
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="text-xs font-semibold text-slate-300 mb-2">
                Technical Evidence Findings
              </div>
              <div className="space-y-1.5 text-xs text-slate-400 font-mono">
                {analysis.technicalFindings.map((finding, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-cyan-400 font-bold">•</span>
                    <span className="text-slate-300">{finding}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Corruption / Anomaly Explanation if any */}
          {analysis.corruptionExplanation && (
            <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-800/40 text-xs text-rose-200">
              <div className="font-semibold text-rose-400 mb-1 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4" /> Damage / Discrepancy Forensic Note
              </div>
              <p>{analysis.corruptionExplanation}</p>
            </div>
          )}

          {/* Recommendations */}
          {analysis.recommendations?.length > 0 && (
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="text-xs font-semibold text-slate-300 mb-2">
                Forensic Action Protocol
              </div>
              <div className="space-y-1.5 text-xs text-slate-400">
                {analysis.recommendations.map((rec, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
