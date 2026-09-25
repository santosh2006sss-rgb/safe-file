import React from 'react';
import {
  Shield,
  Sparkles,
  RotateCcw,
  FileCheck2,
  AlertTriangle,
  Cpu,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { DemoPreset } from '../utils/demoGenerator';

interface HeaderProps {
  status: 'IDLE' | 'ANALYZING' | 'RECONSTRUCTING' | 'UNCERTAIN' | 'VALIDATED' | 'UNVERIFIED';
  onTryDemo: (preset: DemoPreset) => void;
  onReset: () => void;
  fragmentCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  status,
  onTryDemo,
  onReset,
  fragmentCount,
}) => {
  const [showDemoMenu, setShowDemoMenu] = React.useState(false);

  const getStatusBadge = () => {
    switch (status) {
      case 'ANALYZING':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 animate-pulse">
            <Cpu className="h-3.5 w-3.5 animate-spin" />
            <span>ANALYZING FRAGMENTS</span>
          </span>
        );
      case 'RECONSTRUCTING':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse">
            <Layers className="h-3.5 w-3.5 animate-bounce" />
            <span>RECONSTRUCTING BYTES</span>
          </span>
        );
      case 'VALIDATED':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <FileCheck2 className="h-3.5 w-3.5" />
            <span>RECONSTRUCTION VALIDATED</span>
          </span>
        );
      case 'UNVERIFIED':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>PARTIALLY RECOVERED / UNVERIFIED</span>
          </span>
        );
      case 'UNCERTAIN':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>RECONSTRUCTION UNCERTAIN</span>
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-slate-800 text-slate-300 border border-slate-700">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping"></span>
            <span>SYSTEM READY</span>
          </span>
        );
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/90 bg-slate-950/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-lg shadow-cyan-950/40">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-white sm:text-lg">
                AI File Fragment Reconstruction System
              </h1>
              <span className="hidden sm:inline-block rounded bg-cyan-500/20 px-1.5 py-0.5 text-[10px] font-mono font-bold text-cyan-300 border border-cyan-500/30">
                FORENSICS V2
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Deterministic Byte Carving & Combinatorial Sequence Engine
            </p>
          </div>
        </div>

        {/* Status & Actions */}
        <div className="flex items-center gap-3">
          {getStatusBadge()}

          {/* Try Demo Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDemoMenu(!showDemoMenu)}
              className="flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 hover:border-cyan-400 transition shadow-sm shadow-cyan-950/50"
              title="Generate a pre-divided sample, shuffle fragments, and reconstruct"
            >
              <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
              <span>Try Demo</span>
              <ChevronDown className="h-3 w-3 opacity-70" />
            </button>

            {showDemoMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-800 bg-slate-900 p-1.5 shadow-2xl z-50 animate-in fade-in zoom-in-95">
                <div className="px-2 py-1 text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                  Select Demo Scenario:
                </div>
                <button
                  onClick={() => {
                    setShowDemoMenu(false);
                    onTryDemo('pdf');
                  }}
                  className="w-full text-left rounded-lg px-2.5 py-1.5 text-xs text-slate-200 hover:bg-slate-800 hover:text-cyan-300 transition flex items-center justify-between"
                >
                  <span>PDF Document (3 Frags)</span>
                  <span className="text-[10px] font-mono text-cyan-400">%PDF-</span>
                </button>
                <button
                  onClick={() => {
                    setShowDemoMenu(false);
                    onTryDemo('jpeg');
                  }}
                  className="w-full text-left rounded-lg px-2.5 py-1.5 text-xs text-slate-200 hover:bg-slate-800 hover:text-cyan-300 transition flex items-center justify-between"
                >
                  <span>JPEG Photo (3 Frags)</span>
                  <span className="text-[10px] font-mono text-amber-400">0xFFD8</span>
                </button>
                <button
                  onClick={() => {
                    setShowDemoMenu(false);
                    onTryDemo('png');
                  }}
                  className="w-full text-left rounded-lg px-2.5 py-1.5 text-xs text-slate-200 hover:bg-slate-800 hover:text-cyan-300 transition flex items-center justify-between"
                >
                  <span>PNG Graphic (3 Frags)</span>
                  <span className="text-[10px] font-mono text-emerald-400">IHDR</span>
                </button>
              </div>
            )}
          </div>

          {/* Reset Button */}
          {fragmentCount > 0 && (
            <button
              onClick={onReset}
              className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition"
              title="Clear all fragments and results"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
