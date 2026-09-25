import React, { useState, useMemo } from 'react';
import { Binary, Search, Activity, Eye, Zap, Layers, Sparkles } from 'lucide-react';
import { FileMetadata } from '../../types/integrity';

interface HexAndEntropyInspectorProps {
  file: FileMetadata;
  title?: string;
}

export const HexAndEntropyInspector: React.FC<HexAndEntropyInspectorProps> = ({
  file,
  title = 'Raw Hex & Entropy Forensic Inspector',
}) => {
  const [currentOffset, setCurrentOffset] = useState(0);
  const [searchHex, setSearchHex] = useState('');
  const [selectedByteIndex, setSelectedByteIndex] = useState<number | null>(null);
  const [hoveredBlockIndex, setHoveredBlockIndex] = useState<number | null>(null);

  const bytesPerPage = 256; // 16 rows of 16 bytes
  const totalPages = Math.max(1, Math.ceil(file.data.length / bytesPerPage));
  const currentPage = Math.floor(currentOffset / bytesPerPage);

  const pageBytes = useMemo(() => {
    const start = currentPage * bytesPerPage;
    return file.data.subarray(start, start + bytesPerPage);
  }, [file.data, currentPage, bytesPerPage]);

  const rows = useMemo(() => {
    const startOffset = currentPage * bytesPerPage;
    const result: { offset: number; hexList: string[]; ascii: string; rawBytes: number[] }[] = [];

    for (let r = 0; r < 16; r++) {
      const rowOffset = startOffset + r * 16;
      if (rowOffset >= file.data.length) break;

      const rowSlice = file.data.subarray(rowOffset, Math.min(rowOffset + 16, file.data.length));
      const hexList: string[] = [];
      let ascii = '';
      const rawBytes: number[] = [];

      for (let i = 0; i < 16; i++) {
        if (i < rowSlice.length) {
          const b = rowSlice[i];
          hexList.push(b.toString(16).padStart(2, '0').toUpperCase());
          rawBytes.push(b);
          // Printable ASCII
          ascii += b >= 32 && b <= 126 ? String.fromCharCode(b) : '·';
        } else {
          hexList.push('  ');
          ascii += ' ';
        }
      }

      result.push({
        offset: rowOffset,
        hexList,
        ascii,
        rawBytes,
      });
    }

    return result;
  }, [file.data, currentPage, bytesPerPage]);

  // Jump to offset
  const handleJumpToOffset = (offsetHexOrDec: string) => {
    let target = 0;
    if (offsetHexOrDec.startsWith('0x') || offsetHexOrDec.startsWith('0X')) {
      target = parseInt(offsetHexOrDec, 16);
    } else {
      target = parseInt(offsetHexOrDec, 10);
    }

    if (!isNaN(target) && target >= 0 && target < file.data.length) {
      setCurrentOffset(target);
      setSelectedByteIndex(target);
    }
  };

  const selectedByteValue = selectedByteIndex !== null && selectedByteIndex < file.data.length
    ? file.data[selectedByteIndex]
    : null;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-800">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Binary className="w-5 h-5 text-cyan-400" /> {title}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Byte-level inspection, ASCII interpretation, structural marker highlighting, and block entropy.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick jump input */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
            <input
              type="text"
              placeholder="Jump Offset (0x00 or dec)"
              value={searchHex}
              onChange={(e) => setSearchHex(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleJumpToOffset(searchHex);
              }}
              className="bg-transparent border-none text-slate-200 focus:outline-none w-36 font-mono text-[11px]"
            />
          </div>
        </div>
      </div>

      {/* Block Entropy Visualizer Bar */}
      <div className="mb-5 p-3.5 bg-slate-950/80 rounded-xl border border-slate-800">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-cyan-400" /> Shannon Entropy Map Across Stream
            <span className="text-[10px] text-slate-400 font-normal">
              (0.0 = Zero-Fill Slack / Uniform; 8.0 = Encrypted / High Compressed)
            </span>
          </span>
          <span className="font-mono text-xs text-cyan-400 font-semibold">
            Overall: {file.entropy.toFixed(3)} bits/B
          </span>
        </div>

        {/* Visual Bar of Blocks */}
        <div className="grid grid-cols-20 sm:grid-cols-40 gap-1 h-8 items-end bg-slate-900/60 p-1.5 rounded-lg border border-slate-800/80">
          {file.entropyBlocks.map((val, idx) => {
            const heightPercent = Math.max(12, Math.round((val / 8.0) * 100));
            const isZeroSlack = val < 0.5;
            const isCompressed = val >= 7.2;

            let barColor = 'bg-cyan-500 hover:bg-cyan-400';
            if (isZeroSlack) barColor = 'bg-slate-600 hover:bg-slate-500';
            else if (isCompressed) barColor = 'bg-emerald-500 hover:bg-emerald-400';
            else if (val > 5.0) barColor = 'bg-teal-500 hover:bg-teal-400';

            return (
              <div
                key={idx}
                className="relative group h-full flex items-end"
                onMouseEnter={() => setHoveredBlockIndex(idx)}
                onMouseLeave={() => setHoveredBlockIndex(null)}
                onClick={() => {
                  const targetOff = Math.floor((idx / file.entropyBlocks.length) * file.data.length);
                  setCurrentOffset(targetOff);
                  setSelectedByteIndex(targetOff);
                }}
              >
                <div
                  style={{ height: `${heightPercent}%` }}
                  className={`w-full rounded-sm transition-all cursor-pointer ${barColor}`}
                />
              </div>
            );
          })}
        </div>

        {/* Hovered Block Telemetry */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 font-mono">
          <div>
            {hoveredBlockIndex !== null ? (
              <span>
                Block #{hoveredBlockIndex + 1}: Entropy{' '}
                <strong className="text-cyan-300">
                  {file.entropyBlocks[hoveredBlockIndex].toFixed(3)}
                </strong>{' '}
                bits/B (Est. Offset ~0x
                {Math.floor(
                  (hoveredBlockIndex / file.entropyBlocks.length) * file.data.length
                ).toString(16)}
                )
              </span>
            ) : (
              <span>Hover or click block to inspect sector cluster entropy and navigate offsets.</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded bg-slate-600" /> Slack/Zero-Fill (&lt;0.5)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded bg-cyan-500" /> Structured (2.0 - 7.0)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded bg-emerald-500" /> Compressed/Enc (&gt;7.2)
            </span>
          </div>
        </div>
      </div>

      {/* Hex Viewer Grid */}
      <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs overflow-x-auto select-text">
        {/* Column Headers */}
        <div className="flex items-center text-slate-400 pb-2 mb-2 border-b border-slate-800 text-[11px]">
          <div className="w-24 shrink-0 font-semibold text-cyan-400">Offset (hex)</div>
          <div className="grid grid-cols-16 gap-1 w-96 shrink-0 text-center font-semibold text-slate-400">
            {Array.from({ length: 16 }).map((_, i) => (
              <span key={i}>{i.toString(16).toUpperCase()}</span>
            ))}
          </div>
          <div className="ml-4 font-semibold text-slate-400">ASCII Dump</div>
        </div>

        {/* Rows */}
        <div className="space-y-1">
          {rows.map((row) => (
            <div key={row.offset} className="flex items-center hover:bg-slate-900/60 py-0.5 rounded px-1">
              {/* Offset Column */}
              <div className="w-24 shrink-0 text-slate-400 font-mono text-[11px]">
                0x{row.offset.toString(16).padStart(8, '0').toUpperCase()}
              </div>

              {/* 16 Hex Bytes */}
              <div className="grid grid-cols-16 gap-1 w-96 shrink-0 text-center text-[11px]">
                {row.hexList.map((hx, idx) => {
                  const globalIdx = row.offset + idx;
                  const isSelected = selectedByteIndex === globalIdx;

                  // Highlighting rules:
                  // Header bytes (first 8)
                  const isHeader = globalIdx < 8;
                  // Footer bytes (last 4)
                  const isFooter = globalIdx >= file.data.length - 4 && globalIdx < file.data.length;

                  let color = 'text-slate-300';
                  if (isHeader) color = 'text-cyan-400 font-bold bg-cyan-950/40 rounded';
                  else if (isFooter) color = 'text-amber-400 font-bold bg-amber-950/40 rounded';
                  else if (hx === '00') color = 'text-slate-400';

                  if (isSelected) color = 'bg-cyan-500 text-slate-950 font-bold rounded';

                  return (
                    <span
                      key={idx}
                      onClick={() => setSelectedByteIndex(globalIdx)}
                      className={`cursor-pointer px-0.5 py-0.5 transition-colors ${color}`}
                      title={`Offset: 0x${globalIdx.toString(16)} (${globalIdx})`}
                    >
                      {hx}
                    </span>
                  );
                })}
              </div>

              {/* ASCII Pane */}
              <div className="ml-4 tracking-widest text-[11px] text-emerald-400/90 whitespace-pre">
                {row.ascii}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination & Selected Byte Details */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-800 text-xs">
        <div className="flex items-center gap-3">
          <button
            disabled={currentPage === 0}
            onClick={() => setCurrentOffset(Math.max(0, currentOffset - bytesPerPage))}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-200"
          >
            ← Previous Page
          </button>
          <span className="font-mono text-slate-400">
            Page {currentPage + 1} of {totalPages} ({file.data.length.toLocaleString()} bytes total)
          </span>
          <button
            disabled={currentPage >= totalPages - 1}
            onClick={() =>
              setCurrentOffset(
                Math.min(file.data.length - bytesPerPage, currentOffset + bytesPerPage)
              )
            }
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-200"
          >
            Next Page →
          </button>
        </div>

        {selectedByteValue !== null && selectedByteIndex !== null && (
          <div className="flex items-center gap-3 font-mono text-[11px] bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-slate-300">
            <span>
              Offset: <strong className="text-cyan-400">0x{selectedByteIndex.toString(16)}</strong>
            </span>
            <span>
              Hex: <strong className="text-emerald-400">0x{selectedByteValue.toString(16).padStart(2, '0').toUpperCase()}</strong>
            </span>
            <span>
              Dec: <strong className="text-slate-100">{selectedByteValue}</strong>
            </span>
            <span>
              Bin:{' '}
              <strong className="text-slate-400">
                {selectedByteValue.toString(2).padStart(8, '0')}
              </strong>
            </span>
            <span>
              ASCII:{' '}
              <strong className="text-amber-300">
                {selectedByteValue >= 32 && selectedByteValue <= 126
                  ? String.fromCharCode(selectedByteValue)
                  : 'N/A'}
              </strong>
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
