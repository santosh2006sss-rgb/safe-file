import React, { useState, useEffect } from 'react';
import { Sparkles, X, ShieldAlert, CheckCircle, HelpCircle, Layers, ArrowRight, FileText, Lock } from 'lucide-react';
import { RecoveryCandidate } from '../../types/recovery';

interface AICandidateExplainerModalProps {
  candidate: RecoveryCandidate | null;
  onClose: () => void;
  onSendToReconstruction?: (candidate: RecoveryCandidate) => void;
  onSendToIntegrity?: (candidate: RecoveryCandidate) => void;
}

export const AICandidateExplainerModal: React.FC<AICandidateExplainerModalProps> = ({
  candidate,
  onClose,
  onSendToReconstruction,
  onSendToIntegrity,
}) => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!candidate) {
      setAnalysis(null);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    async function fetchAIAnalysis() {
      try {
        const res = await fetch('/api/ai-classify-candidate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ candidate }),
        });

        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        const data = await res.json();
        if (isMounted) {
          setAnalysis(data);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Failed to generate AI analysis');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchAIAnalysis();

    return () => {
      isMounted = false;
    };
  }, [candidate]);

  if (!candidate) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl p-6 sm:p-7 text-slate-100">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  AI Forensic Classification & Reasoning
                </h2>
                <span className="rounded bg-purple-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-purple-300 border border-purple-500/30">
                  GEMINI 3.8 FLASH
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Candidate: <span className="text-cyan-400 font-semibold">{candidate.id}</span> · Offset: {candidate.sourceOffsetHex}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-5 space-y-4">
          {/* Candidate Quick Overview */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div>
                <span className="text-slate-500 block">Identified Type</span>
                <span className="text-slate-200 font-semibold">{candidate.fileType}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Magic Signature</span>
                <span className="text-cyan-400 font-semibold">{candidate.fileSignatureHex}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Est. File Size</span>
                <span className="text-slate-200 font-semibold">{(candidate.estimatedSizeBytes / 1024).toFixed(1)} KB</span>
              </div>
              <div>
                <span className="text-slate-500 block">Validation Status</span>
                <span className={`font-semibold ${
                  candidate.validationStatus === 'Fully Recovered'
                    ? 'text-emerald-400'
                    : candidate.validationStatus === 'Partially Recovered'
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }`}>
                  {candidate.validationStatus}
                </span>
              </div>
            </div>
          </div>

          {/* AI Analysis State */}
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <div className="relative h-10 w-10">
                <div className="absolute inset-0 rounded-full border-2 border-purple-500/20 border-t-purple-400 animate-spin"></div>
                <Sparkles className="h-5 w-5 text-purple-400 absolute inset-0 m-auto" />
              </div>
              <p className="text-xs text-purple-300 font-mono">
                Gemini 3.8 Flash evaluating file signatures, header/footer bounds, and fragment continuity...
              </p>
            </div>
          ) : error ? (
            <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-4 text-xs text-rose-300">
              <p className="font-semibold">Analysis Failed: {error}</p>
            </div>
          ) : analysis ? (
            <div className="space-y-3 text-xs">
              {/* Structural Analysis */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4">
                <div className="flex items-center gap-2 text-slate-300 font-semibold mb-1.5 font-mono">
                  <CheckCircle className="h-4 w-4 text-cyan-400" />
                  <span>Structural & Signature Assessment</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  {analysis.structuralAnalysis}
                </p>
              </div>

              {/* Fragment Compatibility & Continuity */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4">
                <div className="flex items-center gap-2 text-slate-300 font-semibold mb-1.5 font-mono">
                  <Layers className="h-4 w-4 text-purple-400" />
                  <span>Fragment Compatibility & Sector Continuity</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  {analysis.fragmentCompatibilityNote}
                </p>
              </div>

              {/* Uncertainty Reporting */}
              {analysis.uncertaintyFlags && analysis.uncertaintyFlags.length > 0 && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4">
                  <div className="flex items-center gap-2 text-amber-300 font-semibold mb-2 font-mono">
                    <ShieldAlert className="h-4 w-4" />
                    <span>Uncertainty & Forensic Risk Flags</span>
                  </div>
                  <ul className="space-y-1 text-slate-300 pl-4 list-disc text-[11px]">
                    {analysis.uncertaintyFlags.map((flag: string, idx: number) => (
                      <li key={idx} className="text-amber-200/90">{flag}</li>
                    ))}
                  </ul>
                  <p className="mt-2 text-[10px] text-amber-300/80 font-mono">
                    Deterministic principle: AI never fabricates missing bytes or claims complete recovery without strict format markers.
                  </p>
                </div>
              )}

              {/* Forensic Recommendation */}
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/10 p-4">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-1 font-mono">
                  <Lock className="h-4 w-4" />
                  <span>Investigator Recommendation</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  {analysis.forensicRecommendation}
                </p>
              </div>
            </div>
          ) : null}
        </div>

        {/* Modal Actions */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 transition"
          >
            Close
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {candidate.isFragmented && onSendToReconstruction && (
              <button
                type="button"
                onClick={() => onSendToReconstruction(candidate)}
                className="flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-950/30 px-3.5 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-900/40 transition"
              >
                <Layers className="h-3.5 w-3.5" />
                <span>Send to Fragment Reassembly</span>
              </button>
            )}

            {onSendToIntegrity && (
              <button
                type="button"
                onClick={() => onSendToIntegrity(candidate)}
                className="flex items-center gap-1.5 rounded-lg bg-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400 transition shadow-lg shadow-cyan-950/50"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Verify File Integrity (Step 3)</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
