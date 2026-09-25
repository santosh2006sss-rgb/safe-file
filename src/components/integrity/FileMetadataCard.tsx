import React, { useState } from 'react';
import { Copy, Check, Shield, FileCode, Clock, Hash, Cpu, AlertTriangle } from 'lucide-react';
import { FileMetadata } from '../../types/integrity';
import { formatBytes } from '../../utils/crypto';

interface FileMetadataCardProps {
  title: string;
  badgeText: string;
  badgeVariant?: 'primary' | 'reference';
  file: FileMetadata;
  onClear?: () => void;
}

export const FileMetadataCard: React.FC<FileMetadataCardProps> = ({
  title,
  badgeText,
  badgeVariant = 'primary',
  file,
  onClear,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const getEntropyColor = (val: number) => {
    if (val > 7.2) return 'text-amber-400 bg-amber-950/40 border-amber-800/40';
    if (val > 4.5) return 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40';
    return 'text-cyan-400 bg-cyan-950/40 border-cyan-800/40';
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl backdrop-blur-sm transition-all hover:border-slate-700">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div
            className={`p-2 rounded-lg ${
              badgeVariant === 'reference'
                ? 'bg-purple-950/60 text-purple-400 border border-purple-800/50'
                : 'bg-cyan-950/60 text-cyan-400 border border-cyan-800/50'
            }`}
          >
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-wide text-slate-100">{title}</h3>
            <span
              className={`inline-block text-[11px] font-mono px-2 py-0.5 rounded-full border ${
                badgeVariant === 'reference'
                  ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                  : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
              }`}
            >
              {badgeText}
            </span>
          </div>
        </div>

        {onClear && (
          <button
            onClick={onClear}
            className="text-xs text-slate-400 hover:text-rose-400 transition-colors px-2 py-1 rounded bg-slate-800/60 hover:bg-rose-950/30"
          >
            Clear File
          </button>
        )}
      </div>

      {/* Primary specs grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/60">
          <div className="text-[11px] uppercase tracking-wider text-slate-400 mb-0.5">File Name</div>
          <div className="text-xs font-mono font-medium text-slate-200 truncate" title={file.name}>
            {file.name}
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/60">
          <div className="text-[11px] uppercase tracking-wider text-slate-400 mb-0.5">Size</div>
          <div className="text-xs font-mono font-medium text-slate-200">
            {formatBytes(file.size)}{' '}
            <span className="text-[10px] text-slate-400">({file.size.toLocaleString()} B)</span>
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/60">
          <div className="text-[11px] uppercase tracking-wider text-slate-400 mb-0.5">Format / MIME</div>
          <div className="text-xs font-mono font-medium text-slate-200 truncate" title={file.mimeType}>
            .{file.extension || 'bin'} · {file.mimeType}
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/60">
          <div className="text-[11px] uppercase tracking-wider text-slate-400 mb-0.5">Entropy</div>
          <div className="flex items-center gap-1.5">
            <span
              className={`text-xs font-mono font-semibold px-1.5 py-0.5 rounded border ${getEntropyColor(
                file.entropy
              )}`}
            >
              {file.entropy.toFixed(3)}
            </span>
            <span className="text-[10px] text-slate-400">bits/B</span>
          </div>
        </div>
      </div>

      {/* Metadata stamp */}
      {file.lastModifiedDate && (
        <div className="flex items-center gap-2 mb-4 text-xs text-slate-400 font-mono bg-slate-950/40 px-3 py-1.5 rounded-lg border border-slate-800/40">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>Last Modified Timestamp: {file.lastModifiedDate}</span>
        </div>
      )}

      {/* Cryptographic Hash Breakdown */}
      <div className="space-y-2.5">
        {/* SHA-256 */}
        <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5" /> SHA-256
              <span className="text-[10px] text-slate-400 font-normal">(Forensic Standard)</span>
            </span>
            <button
              onClick={() => copyToClipboard(file.sha256, 'sha256')}
              className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-cyan-300 transition-colors"
            >
              {copiedKey === 'sha256' ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" /> Copied
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" /> Copy
                </>
              )}
            </button>
          </div>
          <div className="font-mono text-xs text-slate-300 break-all select-all tracking-wide bg-slate-900/60 p-1.5 rounded border border-slate-800/50">
            {file.sha256}
          </div>
        </div>

        {/* SHA-512 */}
        <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-cyan-400 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5" /> SHA-512
              <span className="text-[10px] text-slate-400 font-normal">(High Security Verification)</span>
            </span>
            <button
              onClick={() => copyToClipboard(file.sha512, 'sha512')}
              className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-cyan-300 transition-colors"
            >
              {copiedKey === 'sha512' ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" /> Copied
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" /> Copy
                </>
              )}
            </button>
          </div>
          <div className="font-mono text-[11px] text-slate-300 break-all select-all tracking-wider bg-slate-900/60 p-1.5 rounded border border-slate-800/50">
            {file.sha512}
          </div>
        </div>

        {/* MD5 (Legacy) */}
        <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-amber-400/90 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5" /> MD5
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                Legacy Identifier · Collision Vulnerable
              </span>
            </span>
            <button
              onClick={() => copyToClipboard(file.md5, 'md5')}
              className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-cyan-300 transition-colors"
            >
              {copiedKey === 'md5' ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" /> Copied
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" /> Copy
                </>
              )}
            </button>
          </div>
          <div className="font-mono text-xs text-slate-400 break-all select-all tracking-wide bg-slate-900/60 p-1.5 rounded border border-slate-800/50">
            {file.md5}
          </div>
        </div>
      </div>
    </div>
  );
};
