import React, { useState } from 'react';
import { Cpu, Eye, Filter, CheckCircle2 } from 'lucide-react';
import { RecoverableFile } from '../types/recovery';

interface SectorMapProps {
  files: RecoverableFile[];
  onSelectFile: (file: RecoverableFile) => void;
  isScanning: boolean;
  currentLBA: number;
}

interface SectorBlockInfo {
  id: number;
  status: 'free' | 'allocated' | 'recoverable' | 'damaged';
  lba: number;
  file?: RecoverableFile;
}

export const SectorMap: React.FC<SectorMapProps> = ({
  files,
  onSelectFile,
  isScanning,
  currentLBA,
}) => {
  const [filterRecoverableOnly, setFilterRecoverableOnly] = useState(false);
  const [hoveredSector, setHoveredSector] = useState<SectorBlockInfo | null>(null);

  // Generate 256 realistic sector blocks
  const blocks: SectorBlockInfo[] = React.useMemo(() => {
    const list: SectorBlockInfo[] = [];
    const totalBlocks = 256;

    for (let i = 0; i < totalBlocks; i++) {
      const baseLba = 0x00400000 + i * 0x8000;
      // Map some files to specific blocks
      const matchedFile = files[i % files.length];
      const isFileBlock = i % 11 === 0 || i % 17 === 0 || i === 42 || i === 88;

      let status: 'free' | 'allocated' | 'recoverable' | 'damaged' = 'allocated';
      if (isFileBlock && matchedFile) {
        status = 'recoverable';
      } else if (i % 7 === 0) {
        status = 'free';
      } else if (i === 133 || i === 210) {
        status = 'damaged';
      }

      list.push({
        id: i,
        status,
        lba: baseLba,
        file: isFileBlock ? matchedFile : undefined,
      });
    }
    return list;
  }, [files]);

  const recoverableCount = blocks.filter((b) => b.status === 'recoverable').length;

  return (
    <div className="space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <Cpu className="h-4 w-4 text-cyan-400" />
            <span>Partition Cluster & Sector Allocation Heatmap</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Interactive representation of physical storage blocks. Click any highlighted sector to inspect recovered data.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setFilterRecoverableOnly(!filterRecoverableOnly)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
              filterRecoverableOnly
                ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300'
                : 'border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Filter className="h-3 w-3" />
            <span>{filterRecoverableOnly ? 'Showing Recoverable Only' : 'Show All Sectors'}</span>
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400 py-1">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-cyan-400 shadow-sm shadow-cyan-400/50"></span>
          <span>Deleted / Recoverable ({recoverableCount})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-slate-700"></span>
          <span>In-Use File System (Allocated)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-slate-900 border border-slate-700"></span>
          <span>Unallocated (Free Space)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-rose-500"></span>
          <span>Damaged / Bad Sector (2)</span>
        </div>
      </div>

      {/* Interactive Grid */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <div className="grid grid-cols-16 sm:grid-cols-32 gap-1.5 max-h-[360px] overflow-y-auto p-1">
          {blocks.map((block) => {
            const isHovered = hoveredSector?.id === block.id;
            const isScanningCurrent = isScanning && Math.abs(block.lba - currentLBA) < 0x20000;

            let bgColor = 'bg-slate-700/60 hover:bg-slate-600';
            if (block.status === 'recoverable') {
              bgColor = 'bg-cyan-400 hover:bg-cyan-300 ring-1 ring-cyan-300/40 cursor-pointer animate-pulse';
            } else if (block.status === 'free') {
              bgColor = 'bg-slate-950 border border-slate-800/80 hover:border-slate-600';
            } else if (block.status === 'damaged') {
              bgColor = 'bg-rose-500/80 hover:bg-rose-400';
            }

            if (filterRecoverableOnly && block.status !== 'recoverable') {
              bgColor = 'bg-slate-900/20 opacity-20';
            }

            return (
              <div
                key={block.id}
                onMouseEnter={() => setHoveredSector(block)}
                onMouseLeave={() => setHoveredSector(null)}
                onClick={() => {
                  if (block.file) {
                    onSelectFile(block.file);
                  }
                }}
                className={`relative h-3 w-full rounded-sm transition-all duration-150 ${bgColor} ${
                  isHovered ? 'scale-125 z-10 shadow-lg shadow-black ring-2 ring-white' : ''
                } ${isScanningCurrent ? 'ring-2 ring-amber-400' : ''}`}
                title={`Sector LBA: 0x${block.lba.toString(16).toUpperCase()} | Status: ${block.status}`}
              />
            );
          })}
        </div>

        {/* Hovered Sector Inspector Bar */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          {hoveredSector ? (
            <div className="flex items-center gap-3 font-mono">
              <span className="text-slate-400">
                LBA: <strong className="text-slate-200">0x{hoveredSector.lba.toString(16).toUpperCase()}</strong>
              </span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-400">
                Status: <strong className="text-cyan-400 uppercase">{hoveredSector.status}</strong>
              </span>
              {hoveredSector.file && (
                <>
                  <span className="text-slate-500">·</span>
                  <span className="text-emerald-400 flex items-center gap-1 font-semibold truncate max-w-xs">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>{hoveredSector.file.filename}</span>
                  </span>
                </>
              )}
            </div>
          ) : (
            <span className="text-slate-500 text-xs italic">
              Hover over any sector cell to inspect LBA offset, cluster status, or mapped deleted file header.
            </span>
          )}

          {hoveredSector?.file && (
            <button
              onClick={() => onSelectFile(hoveredSector.file!)}
              className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-medium"
            >
              <Eye className="h-3 w-3" />
              <span>Inspect & Recover File</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
