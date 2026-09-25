import React, { useState } from 'react';
import { Hash, Copy, Check, ShieldCheck, Database, CheckCircle2 } from 'lucide-react';
import { FileFragment } from '../types/fragment';

interface IntegritySectionProps {
  fragments: FileFragment[];
  reconstructedSha256: string | null;
  reconstructedSize: number | null;
}

export const IntegritySection: React.FC<IntegritySectionProps> = ({
  fragments,
  reconstructedSha256,
  reconstructedSize,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <Hash className="h-4 w-4 text-cyan-400" />
            <span>6. Cryptographic Integrity Audit (SHA-256)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Cryptographic message digests computed via browser Web Crypto API (SubtleCrypto.digest) for chain-of-custody verification.
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>FIPS 180-4 SHA-256 Standard</span>
        </div>
      </div>

      {/* Hashes List */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3 font-mono text-xs">
        <div className="space-y-2">
          {fragments.map((frag) => (
            <div
              key={frag.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg bg-slate-950/80 border border-slate-800/80 p-3 hover:border-slate-700 transition"
            >
              <div className="flex items-center gap-2">
                <span className="text-cyan-400 font-bold">{frag.name}</span>
                <span className="text-slate-500 text-[11px]">
                  ({frag.size.toLocaleString()} bytes)
                </span>
              </div>

              <div className="flex items-center gap-2 min-w-0">
                <span className="text-slate-400 text-[11px] flex-shrink-0">SHA-256:</span>
                <span className="text-slate-300 text-[11px] truncate select-all">
                  {frag.sha256}
                </span>

                <button
                  onClick={() => handleCopy(frag.id, frag.sha256)}
                  className="p-1 rounded text-slate-400 hover:text-cyan-400 transition flex-shrink-0"
                  title="Copy SHA-256 hash"
                >
                  {copiedId === frag.id ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>
          ))}

          {/* Reconstructed File Hash Highlighted */}
          {reconstructedSha256 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg bg-cyan-950/30 border border-cyan-500/40 p-3.5 shadow-md">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-cyan-400" />
                <span className="text-white font-bold tracking-wide">
                  reconstructed_file
                </span>
                <span className="text-cyan-400 text-[11px]">
                  ({reconstructedSize?.toLocaleString()} bytes)
                </span>
              </div>

              <div className="flex items-center gap-2 min-w-0">
                <span className="text-cyan-400 font-semibold text-[11px] flex-shrink-0">
                  SHA-256:
                </span>
                <span className="text-cyan-200 text-[11px] font-bold truncate select-all">
                  {reconstructedSha256}
                </span>

                <button
                  onClick={() => handleCopy('reconstructed', reconstructedSha256)}
                  className="p-1 rounded text-cyan-300 hover:text-white transition flex-shrink-0"
                  title="Copy reconstructed SHA-256 hash"
                >
                  {copiedId === 'reconstructed' ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
