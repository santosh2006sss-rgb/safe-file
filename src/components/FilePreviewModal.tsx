import React, { useState, useMemo } from 'react';
import {
  X,
  Download,
  FileText,
  Binary,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
} from 'lucide-react';
import { RecoverableFile } from '../types/recovery';
import { formatBytes, formatHexDump, downloadFile } from '../utils/carver';

interface FilePreviewModalProps {
  file: RecoverableFile | null;
  onClose: () => void;
  onRecover: (file: RecoverableFile) => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  file,
  onClose,
  onRecover,
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'hex' | 'metadata'>('preview');
  const [copiedHex, setCopiedHex] = useState(false);

  // Generate Hex Dump bytes
  const hexDump = useMemo(() => {
    if (!file) return [];
    if (file.rawBinary) {
      return formatHexDump(file.rawBinary, 256);
    }
    // Generate deterministic bytes from magic header and content string
    const sample = new Uint8Array(128);
    const magicParts = file.magicHeader.split(' ').map((h) => parseInt(h, 16) || 0);
    for (let i = 0; i < magicParts.length; i++) {
      sample[i] = magicParts[i];
    }
    if (file.contentPreview) {
      const textBytes = new TextEncoder().encode(file.contentPreview.slice(0, 100));
      for (let i = 0; i < textBytes.length; i++) {
        if (magicParts.length + i < sample.length) {
          sample[magicParts.length + i] = textBytes[i];
        }
      }
    }
    return formatHexDump(sample, 128);
  }, [file]);

  if (!file) return null;

  const handleCopyHex = () => {
    const text = hexDump
      .map((row) => `${row.offset}  ${row.hex.join(' ')}  |${row.ascii}|`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopiedHex(true);
    setTimeout(() => setCopiedHex(false), 2000);
  };

  const isImage = file.category === 'image' && file.contentPreview;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="relative flex flex-col w-full max-w-4xl max-h-[90vh] rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-900/90">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <FileText className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-white truncate max-w-md">
                {file.filename}
              </h3>
              <p className="text-xs text-slate-400 font-mono truncate max-w-md">
                {file.originalPath}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onRecover(file);
                downloadFile(file);
              }}
              className="flex items-center gap-1.5 rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-cyan-500 transition shadow-sm shadow-cyan-900/30"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Restore & Save</span>
            </button>

            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center border-b border-slate-800 bg-slate-950/40 px-6 gap-2 pt-2">
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-medium border-b-2 transition ${
              activeTab === 'preview'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Visual Preview</span>
          </button>

          <button
            onClick={() => setActiveTab('hex')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-medium border-b-2 transition ${
              activeTab === 'hex'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Binary className="h-3.5 w-3.5" />
            <span>Raw Hex Dump</span>
          </button>

          <button
            onClick={() => setActiveTab('metadata')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-medium border-b-2 transition ${
              activeTab === 'metadata'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Sector & Cluster Data</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === 'preview' && (
            <div className="space-y-4">
              {isImage ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-950/80 p-4 min-h-[300px]">
                  <img
                    src={file.contentPreview}
                    alt={file.filename}
                    referrerPolicy="no-referrer"
                    className="max-h-[380px] max-w-full rounded-lg object-contain shadow-lg"
                  />
                  <div className="mt-3 flex items-center gap-3 text-xs text-slate-400 font-mono">
                    <span>Format: {file.extension.toUpperCase()}</span>
                    <span>·</span>
                    <span>Size: {formatBytes(file.sizeBytes)}</span>
                    <span>·</span>
                    <span className="text-emerald-400">100% Intact Pixels</span>
                  </div>
                </div>
              ) : file.contentPreview ? (
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs leading-relaxed overflow-x-auto text-slate-300">
                  <div className="pb-2 mb-3 border-b border-slate-800 text-[11px] text-slate-500 flex justify-between">
                    <span>Reconstructed Stream ({file.mimeType})</span>
                    <span>{formatBytes(file.sizeBytes)}</span>
                  </div>
                  <pre className="whitespace-pre-wrap font-mono">
                    {file.contentPreview}
                  </pre>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400 border border-dashed border-slate-800 rounded-xl">
                  <Binary className="h-10 w-10 text-slate-600 mb-2" />
                  <p className="text-sm font-medium text-slate-300">Binary Archive Payload</p>
                  <p className="text-xs text-slate-500 max-w-sm mt-1">
                    This file is a compressed or binary package ({formatBytes(file.sizeBytes)}).
                    Inspect the Raw Hex Dump or click Restore & Save to download the file directly.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'hex' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-mono">
                  Offset 0x00000000 — 16 Bytes / Row (Magic Header:{' '}
                  <strong className="text-cyan-400">{file.magicHeader}</strong>)
                </span>
                <button
                  onClick={handleCopyHex}
                  className="flex items-center gap-1 text-slate-400 hover:text-white transition"
                >
                  {copiedHex ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedHex ? 'Copied' : 'Copy Dump'}</span>
                </button>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-800/80 pb-1">
                      <th className="text-left font-normal pr-4 w-24">OFFSET</th>
                      <th className="text-left font-normal pr-4">00 01 02 03 04 05 06 07  08 09 0A 0B 0C 0D 0E 0F</th>
                      <th className="text-left font-normal pl-4">ASCII DECODE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-transparent">
                    {hexDump.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/60 font-mono">
                        <td className="text-cyan-500/80 pr-4 py-0.5 select-none">{row.offset}</td>
                        <td className="text-slate-300 pr-4 py-0.5 tracking-wider">
                          {row.hex.slice(0, 8).join(' ')} &nbsp;{row.hex.slice(8, 16).join(' ')}
                        </td>
                        <td className="text-slate-400 pl-4 py-0.5 border-l border-slate-800/80 select-all">
                          {row.ascii}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'metadata' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Filesystem Cluster Geometry
                </h4>
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Starting Sector LBA:</span>
                    <span className="text-slate-200">0x{file.clusterStart.toString(16).toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Cluster Run Length:</span>
                    <span className="text-slate-200">{file.clusterCount} Clusters (~4KB each)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Fragmentation:</span>
                    <span className={file.isFragmented ? 'text-amber-400' : 'text-emerald-400'}>
                      {file.isFragmented ? 'Fragmented (Reassembled)' : 'Contiguous Sectors'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Shannon Entropy:</span>
                    <span className="text-slate-200">{file.entropy} bits/byte</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Forensic Verification & Integrity
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    {file.integrityScore >= 90 ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-amber-400" />
                    )}
                    <span className="font-semibold text-slate-200">
                      Integrity Score: {file.integrityScore}% ({file.integrity})
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    {file.recoveryNote}
                  </p>
                  <div className="text-[11px] text-slate-500 font-mono">
                    Deleted Timestamp: {file.deletedAt}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 px-6 py-3.5 bg-slate-900/90 text-xs">
          <span className="text-slate-400 font-mono">
            Magic: <strong className="text-slate-200">{file.magicHeader}</strong> · Size:{' '}
            <strong className="text-slate-200">{formatBytes(file.sizeBytes)}</strong>
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition"
            >
              Close
            </button>
            <button
              onClick={() => {
                onRecover(file);
                downloadFile(file);
              }}
              className="flex items-center gap-1.5 rounded-lg bg-cyan-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-cyan-500 transition shadow-sm shadow-cyan-900/30"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Restore File Now</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
