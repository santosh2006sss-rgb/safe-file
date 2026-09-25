import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileCheck2,
  FileText,
  AlertCircle,
  Sparkles,
  Layers,
  ArrowRight,
  Shield,
  HelpCircle,
} from 'lucide-react';
import { FileMetadata } from '../../types/integrity';
import {
  calculateSha256,
  calculateSha512,
  calculateMd5,
  calculateBufferEntropy,
  calculateBlockEntropy,
} from '../../utils/crypto';
import { IntegrityPresetCase, generateIntegrityPresets } from '../../utils/integrityPresets';

interface FileUploaderDualProps {
  recoveredFile: FileMetadata | null;
  referenceFile: FileMetadata | null;
  onSetRecoveredFile: (file: FileMetadata) => void;
  onSetReferenceFile: (file: FileMetadata | null) => void;
  onLoadPreset: (preset: IntegrityPresetCase) => void;
  isLoadingPresets: boolean;
  presets: IntegrityPresetCase[];
}

export const FileUploaderDual: React.FC<FileUploaderDualProps> = ({
  recoveredFile,
  referenceFile,
  onSetRecoveredFile,
  onSetReferenceFile,
  onLoadPreset,
  isLoadingPresets,
  presets,
}) => {
  const [isDraggingRecovered, setIsDraggingRecovered] = useState(false);
  const [isDraggingReference, setIsDraggingReference] = useState(false);
  const [processingMsg, setProcessingMsg] = useState<string | null>(null);

  const recoveredInputRef = useRef<HTMLInputElement>(null);
  const referenceInputRef = useRef<HTMLInputElement>(null);

  const processUploadedFile = async (
    file: File,
    type: 'recovered' | 'reference'
  ): Promise<void> => {
    setProcessingMsg(`Hashing & calculating Shannon entropy for ${file.name}...`);
    try {
      const buffer = await file.arrayBuffer();
      const uint8 = new Uint8Array(buffer);

      const sha256 = await calculateSha256(uint8);
      const sha512 = await calculateSha512(uint8);
      const md5 = calculateMd5(uint8);
      const entropy = calculateBufferEntropy(uint8);
      const entropyBlocks = calculateBlockEntropy(uint8, 40);
      const ext = file.name.split('.').pop()?.toLowerCase() || '';

      const metadata: FileMetadata = {
        name: file.name,
        size: file.size,
        type: ext.toUpperCase() || 'BINARY',
        mimeType: file.type || 'application/octet-stream',
        extension: ext,
        lastModified: file.lastModified,
        lastModifiedDate: file.lastModified
          ? new Date(file.lastModified).toISOString()
          : undefined,
        sha256,
        sha512,
        md5,
        entropy,
        entropyBlocks,
        data: uint8,
      };

      if (type === 'recovered') {
        onSetRecoveredFile(metadata);
      } else {
        onSetReferenceFile(metadata);
      }
    } catch (err) {
      console.error('Error processing uploaded file:', err);
    } finally {
      setProcessingMsg(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Preset Quick Loader Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              Forensic Test Presets (1-Click Demonstration)
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            Select a real-world scenario to load immediate byte streams
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
          {presets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => onLoadPreset(preset)}
              disabled={isLoadingPresets}
              className="text-left p-2.5 rounded-lg border border-slate-800 bg-slate-950/60 hover:bg-slate-800/80 hover:border-cyan-500/50 transition-all group disabled:opacity-50"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300 truncate">
                  {preset.title.split('(')[0]}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono truncate">{preset.badge}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Dual Upload Zone */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Upload Recovered File (Required) */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDraggingRecovered(true);
          }}
          onDragLeave={() => setIsDraggingRecovered(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDraggingRecovered(false);
            if (e.dataTransfer.files?.[0]) {
              processUploadedFile(e.dataTransfer.files[0], 'recovered');
            }
          }}
          onClick={() => recoveredInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
            isDraggingRecovered
              ? 'border-cyan-400 bg-cyan-950/20'
              : recoveredFile
              ? 'border-cyan-500/50 bg-slate-900/60'
              : 'border-slate-700 bg-slate-900/40 hover:border-cyan-500/40 hover:bg-slate-900/60'
          }`}
        >
          <input
            ref={recoveredInputRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                processUploadedFile(e.target.files[0], 'recovered');
              }
            }}
          />

          <div className="flex flex-col items-center">
            <div className="p-3 rounded-full bg-cyan-500/10 text-cyan-400 mb-3 border border-cyan-500/30">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-bold text-slate-100">Upload Recovered File</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                REQUIRED
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-sm mb-2">
              Select or drop the file recovered from your test/carving environment (JPG, PNG, PDF, ZIP, TXT, etc.).
            </p>
            {recoveredFile ? (
              <div className="text-xs font-mono text-cyan-300 font-medium">
                Loaded: {recoveredFile.name} ({(recoveredFile.size / 1024).toFixed(1)} KB)
              </div>
            ) : (
              <span className="text-[11px] text-cyan-400 font-mono">
                Click or drag file to start integrity analysis
              </span>
            )}
          </div>
        </div>

        {/* Upload Original / Reference File (Optional) */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDraggingReference(true);
          }}
          onDragLeave={() => setIsDraggingReference(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDraggingReference(false);
            if (e.dataTransfer.files?.[0]) {
              processUploadedFile(e.dataTransfer.files[0], 'reference');
            }
          }}
          onClick={() => referenceInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
            isDraggingReference
              ? 'border-purple-400 bg-purple-950/20'
              : referenceFile
              ? 'border-purple-500/50 bg-slate-900/60'
              : 'border-slate-800 bg-slate-900/30 hover:border-purple-500/40 hover:bg-slate-900/50'
          }`}
        >
          <input
            ref={referenceInputRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                processUploadedFile(e.target.files[0], 'reference');
              }
            }}
          />

          <div className="flex flex-col items-center">
            <div className="p-3 rounded-full bg-purple-500/10 text-purple-400 mb-3 border border-purple-500/30">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-bold text-slate-100">Upload Original / Reference File</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                OPTIONAL
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-sm mb-2">
              If available, upload known original baseline copy for dual SHA-256/SHA-512 byte-for-byte comparison.
            </p>
            {referenceFile ? (
              <div className="text-xs font-mono text-purple-300 font-medium">
                Loaded Reference: {referenceFile.name} ({(referenceFile.size / 1024).toFixed(1)} KB)
              </div>
            ) : (
              <span className="text-[11px] text-purple-400 font-mono">
                Click or drag original file (leave empty for standalone structural validation)
              </span>
            )}
          </div>
        </div>
      </div>

      {processingMsg && (
        <div className="p-2.5 rounded-lg bg-cyan-950/40 border border-cyan-800/40 text-xs text-cyan-300 flex items-center justify-center gap-2">
          <div className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <span>{processingMsg}</span>
        </div>
      )}
    </div>
  );
};
