import React, { useState } from 'react';
import { ForensicsTopBar, ForensicsModule } from './components/ForensicsTopBar';
import { DeletedFileRecoveryEngineView } from './components/recovery/DeletedFileRecoveryEngineView';
import { FragmentReconstructionView } from './components/FragmentReconstructionView';
import { IntegrityDashboard } from './components/integrity/IntegrityDashboard';
import { RecoveryCandidate } from './types/recovery';

export default function App() {
  // Step 1: Deleted File Recovery Engine (Default initial step as requested)
  const [activeModule, setActiveModule] = useState<ForensicsModule>('recovery');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500/20 selection:text-cyan-200">
      {/* Unified Suite Top Navigation Bar */}
      <ForensicsTopBar
        currentModule={activeModule}
        onSelectModule={setActiveModule}
      />

      {/* Main Suite Module Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {activeModule === 'recovery' && (
          <DeletedFileRecoveryEngineView
            onNavigateToReconstruction={(candidate?: RecoveryCandidate) => {
              setActiveModule('fragment_reconstruction');
            }}
            onNavigateToIntegrity={(candidate?: RecoveryCandidate) => {
              setActiveModule('integrity');
            }}
          />
        )}

        {activeModule === 'fragment_reconstruction' && (
          <FragmentReconstructionView />
        )}

        {activeModule === 'integrity' && (
          <IntegrityDashboard />
        )}
      </main>

      {/* Unified Global Forensic Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 py-4 text-xs font-mono text-slate-400">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">
              SectorRescue · Digital Forensics Investigation Suite
            </span>
            <span>·</span>
            <span className="text-cyan-400">AI-Assisted Intelligent Deleted File Recovery</span>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <span className="text-emerald-400">Hardware / Software Write-Block Active</span>
            <span>·</span>
            <span>Deterministic Byte Recovery</span>
            <span>·</span>
            <span className="text-purple-300">Gemini 3.8 Flash AI Forensics</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
