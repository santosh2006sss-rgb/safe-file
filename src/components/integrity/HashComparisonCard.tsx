import React from 'react';
import { CheckCircle2, XCircle, AlertCircle, ArrowRightLeft, ShieldAlert, FileDiff } from 'lucide-react';
import { HashComparisonResult } from '../../types/integrity';

interface HashComparisonCardProps {
  comparison: HashComparisonResult;
}

export const HashComparisonCard: React.FC<HashComparisonCardProps> = ({ comparison }) => {
  const isMatch = comparison.byteIdentical;

  return (
    <div
      className={`rounded-xl border p-5 shadow-2xl transition-all ${
        isMatch
          ? 'bg-emerald-950/20 border-emerald-500/40'
          : 'bg-rose-950/20 border-rose-500/40'
      }`}
    >
      {/* Top Banner Status */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-xl border ${
              isMatch
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
            }`}
          >
            {isMatch ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-100">
                Cryptographic Reference Comparison
              </h3>
              <span
                className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                  isMatch
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                }`}
              >
                {isMatch ? 'MATCH (100% BYTE IDENTICAL)' : 'MISMATCH (DIFFERENT BYTES)'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Dual-algorithm verification (SHA-256 and SHA-512) against verified reference baseline.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-slate-400">Byte Difference:</span>
          <span
            className={`px-2 py-0.5 rounded font-bold border ${
              isMatch
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
            }`}
          >
            {comparison.differingByteCount === 0
              ? '0 Bytes Diff'
              : `${comparison.differingByteCount.toLocaleString()} Bytes Divergent`}
          </span>
        </div>
      </div>

      {/* Primary Statement as required */}
      <div
        className={`p-3.5 rounded-lg border mb-5 font-medium text-sm flex items-center gap-3 ${
          isMatch
            ? 'bg-emerald-500/10 text-emerald-200 border-emerald-500/30'
            : 'bg-rose-500/10 text-rose-200 border-rose-500/30'
        }`}
      >
        {isMatch ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
        ) : (
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
        )}
        <span>{comparison.message}</span>
      </div>

      {/* Side-by-Side SHA-256 Comparison */}
      <div className="space-y-3 mb-5">
        <div className="bg-slate-950/80 p-3.5 rounded-lg border border-slate-800">
          <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <ArrowRightLeft className="w-3.5 h-3.5 text-cyan-400" /> SHA-256 Checksum Alignment
            </span>
            <span
              className={`text-[11px] font-mono px-2 py-0.5 rounded ${
                comparison.sha256Match
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-rose-500/20 text-rose-300'
              }`}
            >
              {comparison.sha256Match ? 'MATCH' : 'MISMATCH'}
            </span>
          </div>

          <div className="space-y-1.5 font-mono text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="text-slate-400 w-24 shrink-0 text-[11px] uppercase">Reference:</span>
              <span className="text-purple-300 break-all bg-purple-950/20 p-1.5 rounded border border-purple-900/40 w-full">
                {comparison.referenceSha256 || 'N/A'}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="text-slate-400 w-24 shrink-0 text-[11px] uppercase">Recovered:</span>
              <span
                className={`break-all p-1.5 rounded border w-full ${
                  comparison.sha256Match
                    ? 'text-emerald-300 bg-emerald-950/20 border-emerald-900/40'
                    : 'text-rose-300 bg-rose-950/20 border-rose-900/40'
                }`}
              >
                {comparison.recoveredSha256}
              </span>
            </div>
          </div>
        </div>

        {/* SHA-512 Comparison */}
        <div className="bg-slate-950/80 p-3.5 rounded-lg border border-slate-800">
          <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <ArrowRightLeft className="w-3.5 h-3.5 text-cyan-400" /> SHA-512 Checksum Alignment
            </span>
            <span
              className={`text-[11px] font-mono px-2 py-0.5 rounded ${
                comparison.sha512Match
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-rose-500/20 text-rose-300'
              }`}
            >
              {comparison.sha512Match ? 'MATCH' : 'MISMATCH'}
            </span>
          </div>

          <div className="space-y-1.5 font-mono text-[11px]">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="text-slate-400 w-24 shrink-0 uppercase">Reference:</span>
              <span className="text-purple-300 break-all bg-purple-950/20 p-1.5 rounded border border-purple-900/40 w-full">
                {comparison.referenceSha512 || 'N/A'}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="text-slate-400 w-24 shrink-0 uppercase">Recovered:</span>
              <span
                className={`break-all p-1.5 rounded border w-full ${
                  comparison.sha512Match
                    ? 'text-emerald-300 bg-emerald-950/20 border-emerald-900/40'
                    : 'text-rose-300 bg-rose-950/20 border-rose-900/40'
                }`}
              >
                {comparison.recoveredSha512}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Discrepancy details if mismatch */}
      {!isMatch && (
        <div className="mb-4 p-3.5 bg-slate-950/60 rounded-lg border border-slate-800 text-xs text-slate-300">
          <div className="flex items-center gap-2 text-rose-400 font-semibold mb-1.5">
            <FileDiff className="w-4 h-4" /> Technical Divergence Breakdown
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-400 font-mono text-[11px]">
            <div>
              • Size Difference: <span className="text-slate-200">{comparison.sizeDiffBytes > 0 ? `+${comparison.sizeDiffBytes}` : comparison.sizeDiffBytes} bytes</span>
            </div>
            <div>
              • First Discrepancy Offset:{' '}
              <span className="text-amber-300">
                {comparison.firstDiffOffset !== null
                  ? `0x${comparison.firstDiffOffset.toString(16)} (${comparison.firstDiffOffset} dec)`
                  : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Non-Malicious Forensic Caveat Notice */}
      <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 leading-relaxed">
        <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-amber-300">Forensic Integrity Note:</span>{' '}
          {comparison.nonMaliciousNote}
        </div>
      </div>
    </div>
  );
};
