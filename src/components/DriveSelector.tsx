import React from 'react';
import { HardDrive, Usb, Cpu, RefreshCw, Zap, Search, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { DrivePartition, ScanMode } from '../types/recovery';
import { formatBytes } from '../utils/carver';

interface DriveSelectorProps {
  drives: DrivePartition[];
  selectedDriveId: string;
  onSelectDrive: (driveId: string) => void;
  onStartScan: (driveId: string, mode: ScanMode) => void;
  isScanning: boolean;
}

export const DriveSelector: React.FC<DriveSelectorProps> = ({
  drives,
  selectedDriveId,
  onSelectDrive,
  onStartScan,
  isScanning,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-100 uppercase tracking-wider text-[11px] text-slate-400">
            Detected Storage Devices & Partitions
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Select a target partition to parse deleted MFT records or execute deep sector carving.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
            <span>Write-Safe Protection Active</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {drives.map((drive) => {
          const isSelected = drive.id === selectedDriveId;
          const usedPct = Math.round((drive.usedBytes / drive.totalBytes) * 100);
          const delPct = Math.round((drive.deletedEstimatedBytes / drive.totalBytes) * 100);

          return (
            <div
              key={drive.id}
              onClick={() => !isScanning && onSelectDrive(drive.id)}
              className={`group relative flex flex-col justify-between rounded-xl border p-4 transition cursor-pointer ${
                isSelected
                  ? 'border-cyan-500/60 bg-slate-900/90 shadow-lg shadow-cyan-950/30 ring-1 ring-cyan-500/30'
                  : 'border-slate-800/80 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/60'
              } ${isScanning ? 'pointer-events-none opacity-80' : ''}`}
            >
              {/* Top Drive Meta */}
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-lg border transition ${
                        isSelected
                          ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-400'
                          : 'border-slate-800 bg-slate-800/80 text-slate-400 group-hover:text-slate-200'
                      }`}
                    >
                      {drive.iconType === 'external' ? (
                        <Usb className="h-4 w-4" />
                      ) : drive.iconType === 'sd' ? (
                        <Cpu className="h-4 w-4" />
                      ) : (
                        <HardDrive className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-100 group-hover:text-cyan-300 transition-colors">
                        {drive.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                        <span>{drive.fileSystem}</span>
                        <span>·</span>
                        <span>{drive.driveType}</span>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-medium ${
                      drive.health === 'Healthy'
                        ? 'text-emerald-400'
                        : drive.health === 'Good'
                        ? 'text-cyan-400'
                        : 'text-amber-400'
                    }`}
                  >
                    {drive.health === 'Warning' ? (
                      <AlertTriangle className="h-3 w-3" />
                    ) : (
                      <CheckCircle2 className="h-3 w-3" />
                    )}
                    <span>{drive.health}</span>
                  </span>
                </div>

                {/* Storage Capacity Bar */}
                <div className="mt-4 space-y-1.5">
                  <div className="flex justify-between text-[11px] font-mono text-slate-400">
                    <span>{formatBytes(drive.usedBytes)} used</span>
                    <span>{formatBytes(drive.totalBytes)}</span>
                  </div>

                  <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-800">
                    {/* Used partition */}
                    <div
                      className="absolute left-0 top-0 h-full bg-slate-600 rounded-l-full transition-all duration-500"
                      style={{ width: `${usedPct}%` }}
                    />
                    {/* Recoverable deleted space indicator */}
                    <div
                      className="absolute top-0 h-full bg-cyan-500/70 animate-pulse"
                      style={{ left: `${usedPct}%`, width: `${Math.min(delPct, 100 - usedPct)}%` }}
                      title={`~${formatBytes(drive.deletedEstimatedBytes)} potential recoverable deleted sectors`}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="text-cyan-400 font-medium">
                      ~{formatBytes(drive.deletedEstimatedBytes)} lost data
                    </span>
                    <span>{drive.files.length} deleted items detected</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartScan(drive.id, 'quick');
                  }}
                  disabled={isScanning}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/90 py-1.5 px-2 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition disabled:opacity-50"
                  title="Scans Master File Table (MFT) / FAT records in ~5 seconds"
                >
                  <Zap className="h-3 w-3 text-amber-400" />
                  <span>Quick Scan</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartScan(drive.id, 'deep');
                  }}
                  disabled={isScanning}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-cyan-600/90 py-1.5 px-2 text-xs font-semibold text-white hover:bg-cyan-500 transition shadow-sm shadow-cyan-900/30 disabled:opacity-50"
                  title="Deep raw sector carving for formatted or missing partitions"
                >
                  <Search className="h-3 w-3 text-cyan-200" />
                  <span>Deep Scan</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
