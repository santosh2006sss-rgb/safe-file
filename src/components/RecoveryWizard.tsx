import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle2, ArrowRight, HardDrive, RefreshCw } from 'lucide-react';

interface TriageScenario {
  id: string;
  title: string;
  subtitle: string;
  viability: 'High (95-100%)' | 'Moderate (70-90%)' | 'Variable (SSD TRIM dependent)' | 'Expert Carving Needed';
  viabilityColor: string;
  dos: string[];
  donts: string[];
  steps: string[];
}

const SCENARIOS: TriageScenario[] = [
  {
    id: 'recycle_bin',
    title: 'Accidental Shift+Delete / Emptied Recycle Bin',
    subtitle: 'Files deleted directly without passing through Trash or Trash was purged.',
    viability: 'High (95-100%)',
    viabilityColor: 'text-emerald-400',
    dos: [
      'Stop saving large downloads, streaming, or installing new software.',
      'Run SectorRescue Quick Scan or Deep Scan immediately.',
      'Check Volume Shadow Copies / Time Machine snapshots if on Windows or Mac.',
    ],
    donts: [
      'Do not defragment the hard drive or run disk cleaners.',
      'Do not save restored files back onto the same disk partition.',
    ],
    steps: [
      '1. Target the original volume (e.g. C: or D:).',
      '2. Run Quick MFT Scan to locate intact directory entries.',
      '3. If MFT entry is wiped, initiate Deep Scan sector carving.',
      '4. Select files and export to external USB drive.',
    ],
  },
  {
    id: 'formatted',
    title: 'Accidentally Formatted USB / SD Card / Partition',
    subtitle: 'Drive was quick-formatted with exFAT, FAT32, or NTFS.',
    viability: 'High (95-100%)',
    viabilityColor: 'text-emerald-400',
    dos: [
      'Safely unmount or write-protect the card if physical lock switch exists.',
      'Use Deep Sector Carving to reconstruct headers independently of file table.',
    ],
    donts: [
      'Do NOT copy any new files or test writes to the formatted drive!',
      'Do NOT perform a second format or partition recreation.',
    ],
    steps: [
      '1. Connect external drive or card reader.',
      '2. Select drive in SectorRescue or upload raw disk image.',
      '3. Execute Deep Scan (raw carver scans every sector for magic bytes).',
      '4. Reconstruct photos (JPEG/RAW) and documents (PDF/Office).',
    ],
  },
  {
    id: 'ssd_trim',
    title: 'Deleted from Internal NVMe / SATA SSD (TRIM Risk)',
    subtitle: 'Modern SSDs execute background TRIM garbage collection on deleted sectors.',
    viability: 'Variable (SSD TRIM dependent)',
    viabilityColor: 'text-amber-400',
    dos: [
      'Act immediately! Power down or sleep machine if not scanning right away.',
      'Check system restore points and VSS shadow copies.',
    ],
    donts: [
      'Avoid leaving computer idle for hours (idle garbage collection triggers TRIM).',
      'Do not run SSD optimization utilities.',
    ],
    steps: [
      '1. Start SectorRescue scan without delay.',
      '2. If sector data returns 0x00 bytes due to TRIM, check Volume Shadow copies in OS Tools.',
      '3. Recover all available intact clusters immediately.',
    ],
  },
  {
    id: 'raw_drive',
    title: 'Drive Turned "RAW" or File System Corrupted',
    subtitle: 'Windows prompts: "You need to format the disk before you can use it".',
    viability: 'Moderate (70-90%)',
    viabilityColor: 'text-cyan-400',
    dos: [
      'Click "Cancel" when Windows prompts you to format the disk!',
      'Make a raw sector dump image (.dd / .img) of the drive if possible.',
    ],
    donts: [
      'NEVER click "Format Disk" on a RAW drive before carving data!',
      'Do not run chkdsk /f immediately, as it may strip damaged indexes.',
    ],
    steps: [
      '1. Load the drive into SectorRescue.',
      '2. Raw carver bypasses the broken partition table entirely.',
      '3. Reconstruct recoverable files by file signature.',
      '4. Once data is safe, reformat the drive to restore normal operation.',
    ],
  },
];

export const RecoveryWizard: React.FC = () => {
  const [selectedScenarioId, setSelectedScenarioId] = useState('recycle_bin');

  const currentScenario =
    SCENARIOS.find((s) => s.id === selectedScenarioId) || SCENARIOS[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-3">
        <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-cyan-400" />
          <span>Emergency Data Loss Triage Advisor</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Select your data loss scenario to calculate recovery viability and follow the safe rescue protocol.
        </p>
      </div>

      {/* Scenario Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {SCENARIOS.map((scenario) => {
          const isSelected = scenario.id === selectedScenarioId;
          return (
            <div
              key={scenario.id}
              onClick={() => setSelectedScenarioId(scenario.id)}
              className={`rounded-xl border p-4 cursor-pointer transition ${
                isSelected
                  ? 'border-cyan-500/60 bg-slate-900/90 shadow-md ring-1 ring-cyan-500/30'
                  : 'border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/60'
              }`}
            >
              <h3 className="text-sm font-semibold text-slate-200">
                {scenario.title}
              </h3>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                {scenario.subtitle}
              </p>
              <div className="mt-3 text-[11px] font-mono">
                <span className="text-slate-400">Recovery Viability: </span>
                <span className={`font-semibold ${scenario.viabilityColor}`}>
                  {scenario.viability}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Protocol Plan */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
          <div>
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider">
              Recommended Protocol
            </span>
            <h3 className="text-base font-semibold text-white mt-0.5">
              {currentScenario.title}
            </h3>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-slate-400">Estimated Success Rate:</span>
            <span className={`font-bold ${currentScenario.viabilityColor}`}>
              {currentScenario.viability}
            </span>
          </div>
        </div>

        {/* Dos & Don'ts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/10 p-4 space-y-2.5">
            <h4 className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
              <CheckCircle2 className="h-4 w-4" />
              <span>Critical Actions To Take (DO)</span>
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {currentScenario.dos.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-rose-500/20 bg-rose-950/10 p-4 space-y-2.5">
            <h4 className="text-xs font-semibold text-rose-400 flex items-center gap-1.5 uppercase tracking-wider">
              <AlertTriangle className="h-4 w-4" />
              <span>Actions To Avoid (DON'T)</span>
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {currentScenario.donts.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-rose-400">✕</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Step-by-Step Recovery Workflow */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Step-by-Step Rescue Procedure
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {currentScenario.steps.map((step, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5 space-y-1.5"
              >
                <div className="text-[11px] font-mono font-semibold text-cyan-400">
                  PHASE 0{idx + 1}
                </div>
                <p className="text-xs text-slate-300 font-medium">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
