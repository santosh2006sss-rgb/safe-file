import React, { useRef } from 'react';
import {
  HardDrive,
  Database,
  Layers,
  FolderOpen,
  Award,
  AlertOctagon,
  Lock,
  Upload,
  CheckCircle,
  FileCheck,
  ShieldAlert,
  DownloadCloud,
  FolderSearch,
} from 'lucide-react';
import { AuthorizedRecoverySource } from '../../types/recovery';

interface RecoverySourceSelectorProps {
  sources: AuthorizedRecoverySource[];
  selectedSourceId: string;
  onSelectSource: (sourceId: string) => void;
  onRequestPermission: (source: AuthorizedRecoverySource) => void;
  isAuthorized: boolean;
  onCustomFileUpload: (file: File) => void;
  onScanSystemDownloads: () => void;
  onSelectDirectoryFiles: (files: FileList) => void;
  isScanning: boolean;
}

export const RecoverySourceSelector: React.FC<RecoverySourceSelectorProps> = ({
  sources,
  selectedSourceId,
  onSelectSource,
  onRequestPermission,
  isAuthorized,
  onCustomFileUpload,
  onScanSystemDownloads,
  onSelectDirectoryFiles,
  isScanning,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dirInputRef = useRef<HTMLInputElement>(null);

  const getSourceIcon = (type: string, isUnsupported?: boolean, id?: string) => {
    if (isUnsupported) return <AlertOctagon className="h-5 w-5 text-rose-400" />;
    if (id === 'src_local_system_downloads') return <DownloadCloud className="h-5 w-5 text-cyan-400" />;
    switch (type) {
      case 'forensic_dataset':
        return <Award className="h-5 w-5 text-cyan-400" />;
      case 'disk_image':
        return <HardDrive className="h-5 w-5 text-blue-400" />;
      case 'binary_fragments':
        return <Layers className="h-5 w-5 text-purple-400" />;
      case 'demo_data':
        return <Database className="h-5 w-5 text-emerald-400" />;
      case 'user_directory':
      default:
        return <FolderOpen className="h-5 w-5 text-amber-400" />;
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      if (e.dataTransfer.files.length === 1 && !e.dataTransfer.files[0].name.includes('.')) {
        onSelectDirectoryFiles(e.dataTransfer.files);
      } else if (e.dataTransfer.files.length > 1) {
        onSelectDirectoryFiles(e.dataTransfer.files);
      } else {
        onCustomFileUpload(e.dataTransfer.files[0]);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-2">
            <span>Authorized Forensic Recovery Sources</span>
            <span className="rounded bg-cyan-500/20 px-1.5 py-0.5 text-[9px] text-cyan-300 font-bold">
              DOWNLOADS FOLDER READY
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Select the system Downloads directory, an evidence container, disk image, or browse local folders.
          </p>
        </div>

        {/* Action Buttons for Reading Downloads & Local Files */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Hidden inputs for single file and directory tree selection */}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".raw,.dd,.img,.bin,.iso,.vhd,.e01,.dat,.pdf,.zip,.png,.jpg,.crdownload,.part"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                onCustomFileUpload(e.target.files[0]);
              }
            }}
          />

          <input
            ref={dirInputRef}
            type="file"
            className="hidden"
            {...({ webkitdirectory: '', directory: '' } as any)}
            multiple
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                onSelectDirectoryFiles(e.target.files);
              }
            }}
          />

          {/* Button 1: Live Local Agent System Downloads Scan */}
          <button
            onClick={onScanSystemDownloads}
            disabled={isScanning}
            className="flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-950/40 px-3 py-1.5 text-xs font-mono font-semibold text-cyan-300 hover:bg-cyan-900/50 hover:border-cyan-400 transition shadow-sm shadow-cyan-950/40"
            title="Read all files from the host system's Downloads folder (~/Downloads)"
          >
            <DownloadCloud className="h-3.5 w-3.5 text-cyan-400" />
            <span>Read Host Downloads Folder</span>
          </button>

          {/* Button 2: Native Browser Directory Picker (Select Downloads or custom folder) */}
          <button
            onClick={() => dirInputRef.current?.click()}
            disabled={isScanning}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-mono text-slate-300 hover:border-slate-600 hover:bg-slate-800 transition"
            title="Pick your local Downloads folder using native operating system folder dialog"
          >
            <FolderSearch className="h-3.5 w-3.5 text-amber-400" />
            <span>Pick Local Folder</span>
          </button>

          {/* Button 3: Custom file or image upload */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isScanning}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-mono text-slate-300 hover:border-slate-600 hover:bg-slate-800 transition"
          >
            <Upload className="h-3.5 w-3.5 text-slate-400" />
            <span>Load Single Image / File</span>
          </button>
        </div>
      </div>

      {/* Grid of Sources */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {sources.map((src) => {
          const isSelected = src.id === selectedSourceId;
          const isUnsupported = src.status === 'unsupported_filesystem';
          const isDownloads = src.id === 'src_local_system_downloads';

          return (
            <div
              key={src.id}
              onClick={() => !isScanning && onSelectSource(src.id)}
              className={`group relative flex flex-col justify-between rounded-xl border p-4 transition cursor-pointer ${
                isSelected
                  ? 'border-cyan-500/60 bg-slate-900/90 shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-500/30'
                  : isDownloads
                  ? 'border-cyan-500/30 bg-slate-900/50 hover:border-cyan-500/60 hover:bg-slate-900/70'
                  : 'border-slate-800/80 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/60'
              } ${isScanning ? 'pointer-events-none opacity-80' : ''}`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-lg border transition ${
                        isSelected || isDownloads
                          ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-400'
                          : 'border-slate-800 bg-slate-800/80 text-slate-400 group-hover:text-slate-200'
                      }`}
                    >
                      {getSourceIcon(src.type, isUnsupported, src.id)}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-100 group-hover:text-cyan-300 transition-colors line-clamp-1">
                        {src.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                        <span className="font-semibold text-slate-300">{src.fileSystem}</span>
                        <span>·</span>
                        <span>{src.imageFormat || 'RAW'}</span>
                      </div>
                    </div>
                  </div>

                  {src.readOnly && (
                    <span className="flex items-center gap-1 rounded bg-slate-950 px-1.5 py-0.5 text-[9px] font-mono font-semibold text-emerald-400 border border-emerald-500/20" title="Source is mounted read-only">
                      <Lock className="h-2.5 w-2.5" />
                      READ-ONLY
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-400 leading-snug line-clamp-2 mt-1">
                  {src.description}
                </p>

                <div className="mt-2.5 text-[10px] font-mono text-slate-500 truncate">
                  <span className="text-slate-600">Path:</span> {src.pathOrIdentifier}
                </div>
              </div>

              {/* Status and Action */}
              <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                {isUnsupported ? (
                  <span className="flex items-center gap-1 text-[11px] text-rose-400 font-semibold">
                    <ShieldAlert className="h-3 w-3" />
                    <span>Unsupported FS</span>
                  </span>
                ) : isSelected && isAuthorized ? (
                  <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                    <CheckCircle className="h-3 w-3" />
                    <span>Authorized</span>
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400">
                    {src.candidates?.length || 0} files indexed
                  </span>
                )}

                {isSelected && !isAuthorized && !isUnsupported && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRequestPermission(src);
                    }}
                    className="flex items-center gap-1 rounded px-2 py-1 text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 transition"
                  >
                    <FileCheck className="h-3 w-3" />
                    <span>Authorize</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

