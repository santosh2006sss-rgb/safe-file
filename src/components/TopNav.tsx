import React from 'react';
import { HardDrive, Binary, Cpu, ShieldCheck, TerminalSquare } from 'lucide-react';

export type ActiveTab = 'drives' | 'carver' | 'sectors' | 'os_commands' | 'triage';

interface TopNavProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  isScanning: boolean;
  selectedCount: number;
  onRecoverSelected: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  onTabChange,
  isScanning,
  selectedCount,
  onRecoverSelected,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Zone 1: Brand title, single clean text element */}
        <div className="flex items-center gap-3">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onTabChange('drives');
            }}
            className="flex items-center gap-2.5 text-base font-bold tracking-tight text-white hover:text-cyan-400 transition-colors"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <HardDrive className="h-4 w-4" />
            </div>
            <span>SectorRescue</span>
          </a>
        </div>

        {/* Zone 2: Clean single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => onTabChange('drives')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'drives'
                ? 'bg-slate-800 text-cyan-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <HardDrive className="h-3.5 w-3.5" />
            <span>Drive Recovery</span>
          </button>

          <button
            onClick={() => onTabChange('carver')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'carver'
                ? 'bg-slate-800 text-cyan-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Binary className="h-3.5 w-3.5" />
            <span>Raw File Carver</span>
          </button>

          <button
            onClick={() => onTabChange('sectors')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'sectors'
                ? 'bg-slate-800 text-cyan-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Cpu className="h-3.5 w-3.5" />
            <span>Sector Heatmap</span>
          </button>

          <button
            onClick={() => onTabChange('os_commands')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'os_commands'
                ? 'bg-slate-800 text-cyan-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <TerminalSquare className="h-3.5 w-3.5" />
            <span>OS Recovery Tools</span>
          </button>

          <button
            onClick={() => onTabChange('triage')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'triage'
                ? 'bg-slate-800 text-cyan-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Emergency Triage</span>
          </button>
        </nav>

        {/* Zone 3: Primary action */}
        <div className="flex items-center gap-2.5">
          {selectedCount > 0 ? (
            <button
              onClick={onRecoverSelected}
              className="flex items-center gap-1.5 rounded-lg bg-cyan-500 px-3.5 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-cyan-400 whitespace-nowrap shadow-sm shadow-cyan-500/20"
            >
              <span>Recover Selected</span>
              <span className="rounded bg-slate-950/20 px-1.5 py-0.5 font-mono text-[11px] font-bold text-slate-950 tabular-nums">
                {selectedCount}
              </span>
            </button>
          ) : isScanning ? (
            <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-300">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500"></span>
              </span>
              <span className="font-mono text-xs">Scanning sectors...</span>
            </div>
          ) : (
            <button
              onClick={() => onTabChange('carver')}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-slate-600 hover:bg-slate-800 transition whitespace-nowrap"
            >
              <Binary className="h-3.5 w-3.5 text-cyan-400" />
              <span>Carve Raw Image</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
