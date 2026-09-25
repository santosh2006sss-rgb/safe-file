import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  FileCode,
  Trash2,
  Cpu,
  Hash,
  Copy,
  Check,
  Eye,
  AlertCircle,
  Binary,
  Layers,
} from 'lucide-react';
import { FileFragment } from '../types/fragment';
import { calculateSha256, bytesToHex } from '../utils/crypto';
import { extractFragmentFeatures } from '../utils/fragmentOrdering';

interface UploadSectionProps {
  fragments: FileFragment[];
  onAddFragments: (newFragments: FileFragment[]) => void;
  onRemoveFragment: (id: string) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
}

export const UploadSection: React.FC<UploadSectionProps> = ({
  fragments,
  onAddFragments,
  onRemoveFragment,
  onAnalyze,
  isAnalyzing,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [copiedHashId, setCopiedHashId] = useState<string | null>(null);
  const [expandedHexId, setExpandedHexId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const newFrags: FileFragment[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const buffer = await file.arrayBuffer();
      const uint8 = new Uint8Array(buffer);
      const sha256 = await calculateSha256(uint8);
      const features = extractFragmentFeatures(uint8);

      newFrags.push({
        id: `frag_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 6)}`,
        name: file.name,
        size: file.size,
        data: uint8,
        sha256,
        uploadTimestamp: Date.now(),
        hexSample: {
          start: bytesToHex(uint8.slice(0, 16)),
          end: bytesToHex(uint8.slice(Math.max(0, uint8.length - 16))),
        },
        features,
      });
    }

    onAddFragments(newFrags);
  };

  const handleCopyHash = (id: string, hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHashId(id);
    setTimeout(() => setCopiedHashId(null), 2000);
  };

  const canAnalyze = fragments.length >= 3 && !isAnalyzing;

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <Layers className="h-4 w-4 text-cyan-400" />
            <span>1. Upload File Fragments</span>
            <span className="font-mono text-xs text-slate-400">
              ({fragments.length} loaded · minimum 3 required)
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Upload divided chunks of the target evidence file. Fragments will be cryptographically hashed and analyzed for structural continuity.
          </p>
        </div>

        <button
          onClick={onAnalyze}
          disabled={!canAnalyze}
          className="flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400 transition shadow-lg shadow-cyan-500/20 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
        >
          <Cpu className={`h-4 w-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
          <span>{isAnalyzing ? 'Analyzing Technical Evidence...' : 'Analyze Fragments'}</span>
        </button>
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 sm:p-8 text-center transition cursor-pointer ${
          isDragging
            ? 'border-cyan-400 bg-cyan-950/20'
            : 'border-slate-800 bg-slate-900/30 hover:border-slate-700 hover:bg-slate-900/60'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 group-hover:scale-105 transition-transform duration-200">
          <UploadCloud className="h-6 w-6" />
        </div>

        <h3 className="mt-3 text-sm font-semibold text-slate-200">
          Drop divided file fragments here, or browse files
        </h3>
        <p className="mt-1 text-xs text-slate-400 font-mono">
          Upload 3 or more binary fragments of the same file (.bin, .part, .chunk, .raw, or arbitrary extensions)
        </p>
      </div>

      {/* Alert if less than 3 fragments */}
      {fragments.length > 0 && fragments.length < 3 && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300 font-mono">
          <AlertCircle className="h-4 w-4 flex-shrink-0 text-amber-400" />
          <span>
            {3 - fragments.length} more fragment{3 - fragments.length === 1 ? '' : 's'} required to run the combinatorial permutation algorithm.
          </span>
        </div>
      )}

      {/* Uploaded Fragments List */}
      {fragments.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono px-1">
            <span>Uploaded Evidence Queue ({fragments.length})</span>
            <span>Total Payload: {fragments.reduce((acc, f) => acc + f.size, 0).toLocaleString()} bytes</span>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {fragments.map((frag, idx) => {
              const isHexExpanded = expandedHexId === frag.id;

              return (
                <div
                  key={frag.id}
                  className="rounded-xl border border-slate-800/90 bg-slate-900/60 p-3.5 space-y-2.5 transition hover:border-slate-700/80"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    {/* Fragment Meta */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 border border-slate-700/80 text-cyan-400 font-mono text-xs font-bold flex-shrink-0">
                        #{idx + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white truncate max-w-xs sm:max-w-md font-mono">
                            {frag.name}
                          </span>
                          <span className="text-xs text-slate-400 font-mono tabular-nums">
                            ({frag.size.toLocaleString()} bytes)
                          </span>
                        </div>

                        {/* Anchors / Magic detection badge */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          {frag.features.isLikelyStart && (
                            <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-emerald-400 border border-emerald-500/30">
                              HEADER ANCHOR ({frag.features.magicDetected})
                            </span>
                          )}
                          {frag.features.isLikelyEnd && (
                            <span className="rounded bg-purple-500/20 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-purple-400 border border-purple-500/30">
                              FOOTER ANCHOR ({frag.features.footerDetected})
                            </span>
                          )}
                          {!frag.features.isLikelyStart && !frag.features.isLikelyEnd && (
                            <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 border border-slate-700">
                              INTERMEDIATE CLUSTER
                            </span>
                          )}
                          <span className="text-[10px] font-mono text-slate-500">
                            Entropy: {frag.features.entropy}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() => setExpandedHexId(isHexExpanded ? null : frag.id)}
                        className={`flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-mono transition ${
                          isHexExpanded
                            ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300'
                            : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
                        }`}
                        title="Toggle boundary hex dump"
                      >
                        <Binary className="h-3.5 w-3.5" />
                        <span>{isHexExpanded ? 'Hide Hex' : 'Peek Hex'}</span>
                      </button>

                      <button
                        onClick={() => onRemoveFragment(frag.id)}
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-500/10 hover:text-rose-400 transition"
                        title="Remove fragment from queue"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* SHA-256 Hash Line */}
                  <div className="flex items-center justify-between rounded-lg bg-slate-950/80 border border-slate-800/80 px-2.5 py-1.5 text-[11px] font-mono">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-slate-500 flex items-center gap-1 flex-shrink-0">
                        <Hash className="h-3 w-3 text-cyan-500/70" />
                        <span>SHA-256:</span>
                      </span>
                      <span className="text-slate-300 truncate select-all">{frag.sha256}</span>
                    </div>

                    <button
                      onClick={() => handleCopyHash(frag.id, frag.sha256)}
                      className="ml-2 flex items-center gap-1 text-slate-400 hover:text-cyan-400 transition flex-shrink-0"
                    >
                      {copiedHashId === frag.id ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-400" />
                          <span className="text-emerald-400 text-[10px]">Copied</span>
                        </>
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                  </div>

                  {/* Expanded Hex Boundary Peek */}
                  {isHexExpanded && (
                    <div className="rounded-lg border border-slate-800 bg-slate-950 p-2.5 font-mono text-[11px] space-y-1.5 text-slate-300 animate-in fade-in">
                      <div className="flex justify-between border-b border-slate-800/80 pb-1 text-[10px] text-slate-500">
                        <span>BOUNDARY HEX SIGNATURE PEEK</span>
                        <span>Offset 0x0000 ↔ 0x{frag.size.toString(16).toUpperCase()}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-[10px] text-cyan-400 block mb-0.5">Start 16 Bytes:</span>
                          <span className="text-slate-300 tracking-wider bg-slate-900/80 p-1 rounded block">
                            {frag.hexSample.start || 'None'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-purple-400 block mb-0.5">Terminal 16 Bytes:</span>
                          <span className="text-slate-300 tracking-wider bg-slate-900/80 p-1 rounded block">
                            {frag.hexSample.end || 'None'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
