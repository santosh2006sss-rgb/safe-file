import React, { useState } from 'react';
import {
  FileCheck2,
  AlertTriangle,
  Download,
  Eye,
  Check,
  X,
  Binary,
  FileText,
  Image as ImageIcon,
  ShieldCheck,
  FileArchive,
} from 'lucide-react';
import { ReconstructionResult } from '../types/fragment';
import { bytesToHex } from '../utils/crypto';

interface ValidationViewProps {
  result: ReconstructionResult;
  onDownloadReconstructed: () => void;
}

export const ValidationView: React.FC<ValidationViewProps> = ({
  result,
  onDownloadReconstructed,
}) => {
  const [activePreviewTab, setActivePreviewTab] = useState<'visual' | 'hex' | 'structure'>('visual');

  const {
    detectedFileType,
    orderedFragmentNames,
    overallConfidence,
    validation,
    reconstructedBytes,
    reconstructedSize,
    reconstructedSha256,
    previewUrl,
    previewType,
    previewText,
  } = result;

  const hexPreview = React.useMemo(() => {
    const lines: string[] = [];
    const maxBytes = Math.min(reconstructedBytes.length, 256);
    for (let i = 0; i < maxBytes; i += 16) {
      const chunk = reconstructedBytes.slice(i, Math.min(i + 16, maxBytes));
      const offset = i.toString(16).padStart(8, '0').toUpperCase();
      const hex = Array.from(chunk)
        .map((b) => b.toString(16).padStart(2, '0').toUpperCase())
        .join(' ')
        .padEnd(48, ' ');
      let ascii = '';
      for (let j = 0; j < chunk.length; j++) {
        const c = chunk[j];
        ascii += c >= 32 && c <= 126 ? String.fromCharCode(c) : '.';
      }
      lines.push(`${offset}  ${hex}  |${ascii}|`);
    }
    return lines.join('\n');
  }, [reconstructedBytes]);

  const isValidated = validation.status === 'RECONSTRUCTION VALIDATED';

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <FileCheck2 className="h-4 w-4 text-cyan-400" />
            <span>5. Reconstruction Result & Integrity Validation</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Format container parser verification, marker sanity, and stream continuity validation.
          </p>
        </div>

        <button
          onClick={onDownloadReconstructed}
          className="flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-xs font-bold text-white hover:bg-cyan-500 transition shadow-lg shadow-cyan-900/30 cursor-pointer"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Save Reconstructed File</span>
        </button>
      </div>

      {/* Main Validation Card matching requested prompt format */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
              Forensic Verdict
            </span>
            <h3 className="text-base font-bold text-white">Reconstruction Result</h3>
          </div>

          <div
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-mono font-bold border ${
              isValidated
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            }`}
          >
            {isValidated ? (
              <Check className="h-3.5 w-3.5 stroke-[3]" />
            ) : (
              <AlertTriangle className="h-3.5 w-3.5" />
            )}
            <span>Status: {validation.status}</span>
          </div>
        </div>

        {/* Telemetry Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800/80 space-y-0.5">
            <span className="text-slate-400 text-[11px]">File Type:</span>
            <p className="font-bold text-slate-200">{detectedFileType}</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800/80 space-y-0.5">
            <span className="text-slate-400 text-[11px]">Fragments Used:</span>
            <p className="font-bold text-cyan-400 tabular-nums">{orderedFragmentNames.length}</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800/80 space-y-0.5">
            <span className="text-slate-400 text-[11px]">Predicted Order:</span>
            <p className="font-bold text-slate-200 truncate">{orderedFragmentNames.join(' → ')}</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800/80 space-y-0.5">
            <span className="text-slate-400 text-[11px]">Confidence:</span>
            <p className="font-bold text-emerald-400 tabular-nums">{overallConfidence}%</p>
          </div>
        </div>

        {/* Validation Checks Checklist */}
        <div className="space-y-2 pt-2 border-t border-slate-800/80">
          <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider block">
            Validation Checklist:
          </span>

          <div className="space-y-1.5 font-mono text-xs">
            {validation.checks.map((check, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-lg bg-slate-950/50 border border-slate-800/60 px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  {check.passed ? (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                      <Check className="h-3 w-3 stroke-[3]" />
                    </span>
                  ) : (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-rose-500/20 text-rose-400">
                      <X className="h-3 w-3 stroke-[3]" />
                    </span>
                  )}
                  <span className={check.passed ? 'text-slate-200 font-semibold' : 'text-rose-300 font-semibold'}>
                    {check.name}
                  </span>
                </div>

                <span className="text-slate-400 text-[11px] font-sans truncate max-w-xs sm:max-w-md">
                  {check.details}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* If validation failed, display Reason block as requested */}
        {!isValidated && validation.reason && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300 space-y-1">
            <div className="font-bold font-mono text-amber-200">Reason:</div>
            <p className="font-mono text-[11px] leading-relaxed">{validation.reason}</p>
          </div>
        )}

        {/* Standard Disclaimer from Prompt: "Do not claim that a file is authentic merely because it passes validation." */}
        <div className="rounded-lg bg-slate-950/90 border border-slate-800/80 p-2.5 text-[11px] text-slate-500 font-mono">
          <strong>Digital Forensics Notice:</strong> Syntactic parser validation confirms structural container integrity and standard header/trailer alignment. It does not certify legal authenticity without cryptographic baseline matching.
        </div>
      </div>

      {/* Visual / Hex / Structure Preview Tabs */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActivePreviewTab('visual')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono transition ${
                activePreviewTab === 'visual'
                  ? 'bg-slate-800 text-cyan-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Interactive Preview</span>
            </button>
            <button
              onClick={() => setActivePreviewTab('hex')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono transition ${
                activePreviewTab === 'hex'
                  ? 'bg-slate-800 text-cyan-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Binary className="h-3.5 w-3.5" />
              <span>Reconstructed Hex Dump</span>
            </button>
          </div>

          <span className="text-[11px] font-mono text-slate-400">
            Payload Size: {reconstructedSize.toLocaleString()} bytes
          </span>
        </div>

        {/* Tab View */}
        {activePreviewTab === 'visual' && (
          <div>
            {previewType === 'image' && previewUrl ? (
              <div className="flex flex-col items-center justify-center rounded-xl bg-slate-950 p-4 border border-slate-800">
                <img
                  src={previewUrl}
                  alt="Reconstructed preview"
                  className="max-h-72 max-w-full rounded-lg object-contain shadow-2xl border border-slate-800"
                />
                <span className="text-[11px] font-mono text-emerald-400 mt-2">
                  Image successfully decoded and rendered from reconstructed binary stream
                </span>
              </div>
            ) : previewText ? (
              <div className="rounded-xl bg-slate-950 p-4 border border-slate-800 font-mono text-xs text-slate-300 max-h-72 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                {previewText}
              </div>
            ) : (
              <div className="rounded-xl bg-slate-950 p-8 border border-slate-800 text-center font-mono text-xs text-slate-400 space-y-2">
                <FileArchive className="h-8 w-8 text-cyan-400 mx-auto" />
                <p className="text-slate-200 font-semibold">Binary Archive / Payload Verified</p>
                <p className="text-slate-500 text-[11px]">
                  Direct browser rendering is not supported for this container type. Click "Save Reconstructed File" to download and open natively.
                </p>
              </div>
            )}
          </div>
        )}

        {activePreviewTab === 'hex' && (
          <div className="rounded-xl bg-slate-950 p-3 border border-slate-800 font-mono text-[11px] text-slate-300 max-h-72 overflow-x-auto whitespace-pre leading-relaxed select-all">
            {hexPreview}
          </div>
        )}
      </div>
    </div>
  );
};
