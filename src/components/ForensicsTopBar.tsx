import React from 'react';
import { ShieldCheck, Layers, HardDrive, Sparkles, Terminal } from 'lucide-react';

export type ForensicsModule = 'recovery' | 'fragment_reconstruction' | 'integrity';

interface ForensicsTopBarProps {
  currentModule: ForensicsModule;
  onSelectModule: (module: ForensicsModule) => void;
}

export const ForensicsTopBar: React.FC<ForensicsTopBarProps> = ({
  currentModule,
  onSelectModule,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/90 bg-slate-950/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand wordmark */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-lg shadow-cyan-950/40">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-white sm:text-lg">
                SectorRescue
              </span>
              <span className="hidden sm:inline-block rounded bg-cyan-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-cyan-300 border border-cyan-500/30">
                FORENSIC SUITE v2.4
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono hidden sm:block">
              AI-Assisted Intelligent Deleted File Recovery System
            </p>
          </div>
        </div>

        {/* Primary Suite Module Switcher - In exact 3-step pipeline sequence */}
        <nav className="flex items-center gap-1.5 p-1 bg-slate-900/90 border border-slate-800 rounded-xl">
          {/* Step 1: Deleted File Recovery */}
          <button
            onClick={() => onSelectModule('recovery')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentModule === 'recovery'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-950/50'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <HardDrive className="h-4 w-4" />
            <span>1. Deleted File Recovery</span>
            <span className={`hidden md:inline-block text-[9px] px-1.5 py-0.2 rounded uppercase font-mono ${
              currentModule === 'recovery' ? 'bg-slate-950/30 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
            }`}>
              STEP 1
            </span>
          </button>

          {/* Step 2: Fragment Reassembly */}
          <button
            onClick={() => onSelectModule('fragment_reconstruction')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentModule === 'fragment_reconstruction'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-950/50'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>2. Fragment Reassembly</span>
            <span className={`hidden md:inline-block text-[9px] px-1.5 py-0.2 rounded uppercase font-mono ${
              currentModule === 'fragment_reconstruction' ? 'bg-slate-950/30 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
            }`}>
              STEP 2
            </span>
          </button>

          {/* Step 3: File Integrity Verifier */}
          <button
            onClick={() => onSelectModule('integrity')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentModule === 'integrity'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-950/50'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>3. File Integrity Verifier</span>
            <span className={`hidden md:inline-block text-[9px] px-1.5 py-0.2 rounded uppercase font-mono ${
              currentModule === 'integrity' ? 'bg-slate-950/30 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
            }`}>
              STEP 3
            </span>
          </button>
        </nav>
      </div>
    </header>
  );
};
