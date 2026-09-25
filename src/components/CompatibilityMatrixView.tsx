import React, { useState } from 'react';
import { Grid, Info, ArrowRight, ShieldCheck } from 'lucide-react';
import { CompatibilityMatrixData, CompatibilityPair } from '../types/fragment';

interface CompatibilityMatrixViewProps {
  matrixData: CompatibilityMatrixData;
}

export const CompatibilityMatrixView: React.FC<CompatibilityMatrixViewProps> = ({
  matrixData,
}) => {
  const [selectedPair, setSelectedPair] = useState<CompatibilityPair | null>(null);

  const { fragmentIds, fragmentNames, scores } = matrixData;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30';
    if (score >= 55) return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/30';
    if (score >= 35) return 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30';
    return 'bg-slate-900/60 text-slate-500 border-slate-800 hover:text-slate-400';
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <Grid className="h-4 w-4 text-cyan-400" />
            <span>3. Pairwise Fragment Compatibility Matrix</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Directional transition score table [Row A → Column B]. Click any cell to inspect the structural evidence.
          </p>
        </div>

        <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm bg-emerald-400"></span>
            <span>≥80% High Match</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm bg-cyan-400"></span>
            <span>55-79% Plausible</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm bg-slate-700"></span>
            <span>&lt;35% Incompatible</span>
          </div>
        </div>
      </div>

      {/* Matrix Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/40 p-4">
        <table className="w-full text-center border-collapse font-mono text-xs">
          <thead>
            <tr>
              <th className="p-2.5 text-left text-slate-500 font-normal border-b border-r border-slate-800 w-36">
                FROM \ TO
              </th>
              {fragmentIds.map((colId) => (
                <th
                  key={colId}
                  className="p-2.5 text-slate-300 font-semibold border-b border-slate-800 min-w-[80px]"
                >
                  {fragmentNames[colId] || colId}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fragmentIds.map((rowId) => (
              <tr key={rowId} className="border-b border-slate-800/60 last:border-none">
                <td className="p-2.5 text-left font-semibold text-slate-300 border-r border-slate-800 whitespace-nowrap">
                  {fragmentNames[rowId] || rowId}
                </td>
                {fragmentIds.map((colId) => {
                  if (rowId === colId) {
                    return (
                      <td
                        key={colId}
                        className="p-2.5 text-slate-600 bg-slate-950/40 select-none font-bold"
                      >
                        —
                      </td>
                    );
                  }

                  const pair = scores[rowId]?.[colId];
                  const score = pair ? pair.score : 0;
                  const isSelected =
                    selectedPair?.fromId === rowId && selectedPair?.toId === colId;

                  return (
                    <td key={colId} className="p-1.5">
                      <button
                        onClick={() => pair && setSelectedPair(pair)}
                        className={`w-full py-2 px-2.5 rounded-lg border font-bold text-xs transition tabular-nums ${getScoreColor(
                          score
                        )} ${isSelected ? 'ring-2 ring-cyan-400' : ''}`}
                        title={`Click to view transition rationale for ${fragmentNames[rowId]} → ${fragmentNames[colId]}`}
                      >
                        {score}%
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Selected Pair Forensic Breakdown */}
      {selectedPair ? (
        <div className="rounded-xl border border-cyan-500/40 bg-slate-900/80 p-4 space-y-2 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-white">
              <span className="text-cyan-400">{selectedPair.fromName}</span>
              <ArrowRight className="h-3.5 w-3.5 text-slate-500" />
              <span className="text-cyan-300">{selectedPair.toName}</span>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-slate-400">Directional Compatibility:</span>
              <span className="text-sm font-bold text-cyan-400 tabular-nums">
                {selectedPair.score}%
              </span>
            </div>
          </div>

          <div className="space-y-1.5 pt-1 text-xs">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
              Forensic Evidence Points:
            </span>
            <ul className="space-y-1 text-slate-300 list-disc list-inside">
              {selectedPair.reasons.map((r, i) => (
                <li key={i} className="text-xs">
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="text-xs text-slate-500 font-mono italic px-1">
          Click any cell in the compatibility matrix to inspect the granular byte continuity evidence.
        </div>
      )}
    </div>
  );
};
