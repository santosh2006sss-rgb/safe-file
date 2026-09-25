import React, { useState, useRef } from 'react';
import { UploadCloud, Binary, Sparkles, FileSearch, CheckCircle2, AlertCircle } from 'lucide-react';
import { RecoverableFile } from '../types/recovery';
import { carveBinaryBuffer, formatBytes } from '../utils/carver';
import { generateSyntheticCorruptedDiskDump } from '../utils/sampleDataGenerator';

interface CarverDropzoneProps {
  onFilesCarved: (files: RecoverableFile[], sourceName: string) => void;
}

export const CarverDropzone: React.FC<CarverDropzoneProps> = ({ onFilesCarved }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setStatusMessage(`Scanning binary sectors of "${file.name}" (${formatBytes(file.size)})...`);

    try {
      const buffer = await file.arrayBuffer();
      const carved = carveBinaryBuffer(buffer, file.name);

      if (carved.length > 0) {
        setStatusMessage(`Successfully carved ${carved.length} file signatures from binary payload.`);
        onFilesCarved(carved, file.name);
      } else {
        setStatusMessage(`No recognizable magic byte signatures found in ${file.name}.`);
      }
    } catch (err) {
      console.error(err);
      setStatusMessage('Error reading binary file.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleTestSample = () => {
    setIsProcessing(true);
    setStatusMessage('Generating synthetic raw disk sector dump with embedded signatures...');

    setTimeout(() => {
      const { buffer, filename } = generateSyntheticCorruptedDiskDump();
      const carved = carveBinaryBuffer(buffer, filename);
      setStatusMessage(`Carved ${carved.length} files from synthetic sector dump!`);
      onFilesCarved(carved, filename);
      setIsProcessing(false);
    }, 400);
  };

  return (
    <div className="space-y-4">
      <div className="border-b border-slate-800 pb-3">
        <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
          <Binary className="h-4 w-4 text-cyan-400" />
          <span>Raw Binary Disk & Signature Carver</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Scan raw disk images (.raw, .img, .dd, .bin) or corrupted files directly in the browser to extract lost headers (JPEG, PNG, PDF, ZIP, TXT).
        </p>
      </div>

      {/* Drop Zone Box */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 sm:p-12 text-center transition cursor-pointer ${
          isDragging
            ? 'border-cyan-400 bg-cyan-950/20'
            : 'border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/70'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              processFile(e.target.files[0]);
            }
          }}
        />

        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 group-hover:scale-105 transition-transform duration-200">
          <UploadCloud className="h-7 w-7" />
        </div>

        <h3 className="mt-4 text-sm font-semibold text-slate-200">
          Drop a raw disk image or corrupted file here to carve
        </h3>
        <p className="mt-1 text-xs text-slate-400 max-w-md">
          Supports <span className="font-mono text-cyan-400">.raw, .img, .dd, .bin, .dat, .dump</span>, or corrupted archive/media payloads up to 100MB.
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-cyan-500 transition"
          >
            <FileSearch className="h-3.5 w-3.5" />
            <span>Select Local File or Image</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleTestSample();
            }}
            disabled={isProcessing}
            className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>Load Sample Corrupted Sector Image</span>
          </button>
        </div>
      </div>

      {/* Processing / Status indicator */}
      {statusMessage && (
        <div className="flex items-center gap-2.5 rounded-xl border border-slate-800 bg-slate-900/90 px-4 py-3 text-xs">
          {isProcessing ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
          ) : statusMessage.includes('Successfully') || statusMessage.includes('Carved') ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-amber-400 flex-shrink-0" />
          )}
          <span className="font-mono text-slate-300">{statusMessage}</span>
        </div>
      )}

      {/* Carving Signature Reference Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4">
        <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
          Recognized Magic Byte Signatures
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
          <div className="p-2 rounded bg-slate-950/60 border border-slate-800/80">
            <span className="text-cyan-400 font-bold">JPEG / JFIF:</span>
            <div className="text-slate-400 mt-0.5">FF D8 FF E0 / E1</div>
          </div>
          <div className="p-2 rounded bg-slate-950/60 border border-slate-800/80">
            <span className="text-cyan-400 font-bold">PNG Image:</span>
            <div className="text-slate-400 mt-0.5">89 50 4E 47 0D 0A</div>
          </div>
          <div className="p-2 rounded bg-slate-950/60 border border-slate-800/80">
            <span className="text-cyan-400 font-bold">PDF Document:</span>
            <div className="text-slate-400 mt-0.5">25 50 44 46 (%PDF-)</div>
          </div>
          <div className="p-2 rounded bg-slate-950/60 border border-slate-800/80">
            <span className="text-cyan-400 font-bold">ZIP / Office XML:</span>
            <div className="text-slate-400 mt-0.5">50 4B 03 04 (PK..)</div>
          </div>
        </div>
      </div>
    </div>
  );
};
