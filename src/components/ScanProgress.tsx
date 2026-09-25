import React from 'react';
import { Play, Pause, Square, CheckCircle, Search, Activity, Clock, Database } from 'lucide-react';
import { ScanStatus } from '../types/recovery';

interface ScanProgressProps {
  scanStatus: ScanStatus;
  driveName: string;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

export const ScanProgress: React.FC<ScanProgressProps> = ({
  scanStatus,
  driveName,
  onPause,
  onResume,
  onStop,
}) => {
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 sm:p-5 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Search className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white">
                {scanStatus.mode === 'deep' ? 'Deep Sector Carving' : 'Quick MFT Metadata Scan'}
              </h3>
              <span className="text-xs text-cyan-400 font-mono">[{driveName}]</span>
            </div>
            <p className="text-xs text-slate-400 font-mono truncate max-w-md">
              {scanStatus.currentPath || 'Analyzing filesystem cluster allocations...'}
            </p>
          </div>
        </div>

        {/* Scan Actions */}
        <div className="flex items-center gap-2">
          {scanStatus.isPaused ? (
            <button
              onClick={onResume}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-emerald-400 hover:bg-slate-700 transition"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>Resume</span>
            </button>
          ) : (
            <button
              onClick={onPause}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-amber-400 hover:bg-slate-700 transition"
            >
              <Pause className="h-3.5 w-3.5 fill-current" />
              <span>Pause</span>
            </button>
          )}

          <button
            onClick={onStop}
            className="flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-400 hover:bg-rose-500/20 transition"
          >
            <Square className="h-3 w-3 fill-current" />
            <span>Finish & View</span>
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-slate-400">Overall Sector Progress</span>
          <span className="text-cyan-400 font-bold tabular-nums">
            {scanStatus.progressPercent.toFixed(1)}%
          </span>
        </div>

        <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-200"
            style={{ width: `${scanStatus.progressPercent}%` }}
          />
        </div>
      </div>

      {/* Real-time Telemetry Stats (No slop, strictly domain metrics with tabular numerals) */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800/60 text-xs">
        <div className="space-y-0.5">
          <span className="text-slate-400 text-[11px] flex items-center gap-1">
            <Database className="h-3 w-3" />
            <span>Sector LBA Offset</span>
          </span>
          <p className="font-mono text-slate-200 font-medium tabular-nums">
            0x{scanStatus.currentLBA.toString(16).toUpperCase().padStart(8, '0')}
          </p>
        </div>

        <div className="space-y-0.5">
          <span className="text-slate-400 text-[11px] flex items-center gap-1">
            <Activity className="h-3 w-3" />
            <span>Read Throughput</span>
          </span>
          <p className="font-mono text-slate-200 font-medium tabular-nums">
            {scanStatus.scanSpeedMBps.toFixed(0)} MB/s
          </p>
        </div>

        <div className="space-y-0.5">
          <span className="text-slate-400 text-[11px] flex items-center gap-1">
            <CheckCircle className="h-3 w-3 text-cyan-400" />
            <span>Recoverable Files</span>
          </span>
          <p className="font-mono text-cyan-400 font-bold tabular-nums">
            {scanStatus.filesFoundCount} files
          </p>
        </div>

        <div className="space-y-0.5">
          <span className="text-slate-400 text-[11px] flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>Elapsed Time</span>
          </span>
          <p className="font-mono text-slate-200 font-medium tabular-nums">
            {formatTime(scanStatus.elapsedSeconds)}
          </p>
        </div>
      </div>
    </div>
  );
};
