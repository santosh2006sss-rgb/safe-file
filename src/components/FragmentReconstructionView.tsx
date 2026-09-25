import React, { useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  FileText,
  Layers,
  Sparkles,
  Download,
  AlertTriangle,
} from 'lucide-react';
import {
  FileFragment,
  CompatibilityMatrixData,
  ReconstructionResult,
  AuditLogEntry,
  SupportedFileType,
} from '../types/fragment';
import { calculateSha256 } from '../utils/crypto';
import {
  detectOverallFileType,
  buildCompatibilityMatrix,
  predictFragmentOrder,
} from '../utils/fragmentOrdering';
import { validateReconstructedFile } from '../utils/fileValidator';
import { generateDemoFragments, DemoPreset } from '../utils/demoGenerator';
import {
  buildRecoveryReportJson,
  buildRecoveryReportText,
  RecoveryReportJson,
} from '../utils/reportGenerator';

import { Header } from './Header';
import { UploadSection } from './UploadSection';
import { AnalysisResults } from './AnalysisResults';
import { CompatibilityMatrixView } from './CompatibilityMatrixView';
import { ReconstructionView } from './ReconstructionView';
import { ValidationView } from './ValidationView';
import { IntegritySection } from './IntegritySection';
import { AIExplanationPanel } from './AIExplanationPanel';
import { AuditLogView } from './AuditLogView';
import { RecoveryReportModal } from './RecoveryReportModal';

export const FragmentReconstructionView: React.FC = () => {
  const [fragments, setFragments] = useState<FileFragment[]>([]);
  const [matrixData, setMatrixData] = useState<CompatibilityMatrixData | null>(null);
  const [reconstructionResult, setReconstructionResult] = useState<ReconstructionResult | null>(null);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);

  // Loading States
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isReconstructing, setIsReconstructing] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  // Modal State
  const [showReportModal, setShowReportModal] = useState(false);
  const [currentReportJson, setCurrentReportJson] = useState<RecoveryReportJson | null>(null);
  const [currentReportText, setCurrentReportText] = useState('');

  // Active Tab navigation inside dashboard
  const [activeTab, setActiveTab] = useState<'pipeline' | 'matrix' | 'integrity' | 'logs'>('pipeline');

  // Add audit log helper
  const addLog = useCallback(
    (action: AuditLogEntry['action'], details: string, level: AuditLogEntry['level'] = 'info') => {
      const now = new Date();
      const timeStr = `${now.toTimeString().split(' ')[0]}.${now.getMilliseconds().toString().padStart(3, '0')}`;
      const entry: AuditLogEntry = {
        id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
        timestamp: timeStr,
        action,
        details,
        level,
      };
      setAuditLog((prev) => [entry, ...prev]);
    },
    []
  );

  // System status computation
  const getOverallStatus = () => {
    if (isAnalyzing) return 'ANALYZING';
    if (isReconstructing) return 'RECONSTRUCTING';
    if (reconstructionResult) {
      if (reconstructionResult.isUncertain) return 'UNCERTAIN';
      return reconstructionResult.validation.status === 'RECONSTRUCTION VALIDATED'
        ? 'VALIDATED'
        : 'UNVERIFIED';
    }
    return 'IDLE';
  };

  // Add Fragments
  const handleAddFragments = (newFrags: FileFragment[]) => {
    setFragments((prev) => [...prev, ...newFrags]);
    setMatrixData(null);
    setReconstructionResult(null);

    newFrags.forEach((f) => {
      addLog(
        'UPLOAD',
        `Fragment queued: ${f.name} (${f.size.toLocaleString()} bytes, SHA-256: ${f.sha256.slice(0, 16)}...)`,
        'info'
      );
    });
  };

  // Remove Fragment
  const handleRemoveFragment = (id: string) => {
    const target = fragments.find((f) => f.id === id);
    setFragments((prev) => prev.filter((f) => f.id !== id));
    setMatrixData(null);
    setReconstructionResult(null);
    if (target) {
      addLog('UPLOAD', `Removed fragment: ${target.name}`, 'warning');
    }
  };

  // Reset Everything
  const handleReset = () => {
    setFragments([]);
    setMatrixData(null);
    setReconstructionResult(null);
    addLog('UPLOAD', 'Workspace reset. All fragments and cached session data cleared.', 'info');
  };

  // Call Server-Side AI Forensics Endpoint
  const fetchAiExplanation = async (
    fileType: SupportedFileType,
    frags: FileFragment[],
    predictedOrderNames: string[],
    pairwiseTransitions: any[],
    confidence: number,
    validationResult: any
  ) => {
    setAiLoading(true);
    try {
      const res = await fetch('/api/ai-explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileType,
          fragments: frags.map((f) => ({
            name: f.name,
            size: f.size,
            sha256: f.sha256,
            magic: f.features.magicDetected,
            footer: f.features.footerDetected,
            markers: f.features.containsKnownMarkers,
            entropy: f.features.entropy,
          })),
          predictedOrder: predictedOrderNames,
          compatibilityPairs: pairwiseTransitions,
          overallConfidence: confidence,
          validationResult,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setReconstructionResult((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            aiExplanation: data,
          };
        });
      }
    } catch (err) {
      console.warn('AI endpoint unavailable, using local forensic reasoning:', err);
    } finally {
      setAiLoading(false);
    }
  };

  // 1. Analyze Fragments
  const handleAnalyze = async (explicitFragments?: FileFragment[]) => {
    const activeFragments = explicitFragments || fragments;
    if (activeFragments.length < 2) return;

    setIsAnalyzing(true);
    addLog(
      'ANALYZE',
      `Starting technical compatibility analysis across ${activeFragments.length} fragments...`,
      'info'
    );

    await new Promise((r) => setTimeout(r, 450));

    try {
      const detectedType = detectOverallFileType(activeFragments);
      addLog('ANALYZE', `Format detected from binary evidence: ${detectedType}`, 'info');

      const matrix = buildCompatibilityMatrix(activeFragments, detectedType);
      setMatrixData(matrix);

      let maxPairScore = 0;
      Object.values(matrix.scores).forEach((row) => {
        Object.values(row).forEach((p) => {
          if (p.score > maxPairScore) maxPairScore = p.score;
        });
      });

      addLog(
        'ANALYZE',
        `Computed ${activeFragments.length}x${activeFragments.length} directional transition matrix. Highest pair: ${maxPairScore}%`,
        'info'
      );

      const prediction = predictFragmentOrder(activeFragments, matrix, detectedType);
      const orderedIds = prediction.orderedFragments.map((f) => f.id);
      const orderedNames = prediction.orderedFragments.map((f) => f.name);

      addLog(
        'ORDER',
        `Sequence predicted: ${orderedNames.join(' → ')} (${prediction.overallConfidence}% confidence)`,
        prediction.isUncertain ? 'warning' : 'success'
      );

      const placeholderValidation = await validateReconstructedFile(new Uint8Array(0), detectedType);

      const initialResult: ReconstructionResult = {
        orderedFragmentIds: orderedIds,
        orderedFragmentNames: orderedNames,
        overallConfidence: prediction.overallConfidence,
        isUncertain: prediction.isUncertain,
        uncertaintyReason: prediction.uncertaintyReason,
        pairwiseTransitions: prediction.transitions,
        reconstructedBytes: new Uint8Array(0),
        reconstructedSha256: '',
        reconstructedSize: 0,
        detectedFileType: detectedType,
        mimeType: detectedType === 'JPEG' ? 'image/jpeg' : detectedType === 'PNG' ? 'image/png' : detectedType === 'PDF' ? 'application/pdf' : 'application/octet-stream',
        previewType: detectedType === 'JPEG' || detectedType === 'PNG' ? 'image' : detectedType === 'PDF' ? 'pdf' : detectedType === 'TEXT' ? 'text' : 'binary',
        validation: placeholderValidation,
      };

      setReconstructionResult(initialResult);
      fetchAiExplanation(
        detectedType,
        activeFragments,
        orderedNames,
        prediction.transitions,
        prediction.overallConfidence,
        placeholderValidation
      );
    } catch (err: any) {
      addLog('ANALYZE', `Analysis failed: ${err?.message || err}`, 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 2. Reconstruct File
  const handleReconstruct = async () => {
    if (!reconstructionResult || fragments.length === 0) return;

    setIsReconstructing(true);
    addLog('RECONSTRUCT', 'Assembling predicted fragments in strict byte order...', 'info');

    await new Promise((r) => setTimeout(r, 400));

    try {
      const orderedFrags = reconstructionResult.orderedFragmentIds
        .map((id) => fragments.find((f) => f.id === id))
        .filter((f): f is FileFragment => !!f);

      const totalLen = orderedFrags.reduce((acc, f) => acc + f.data.length, 0);
      const combined = new Uint8Array(totalLen);
      let offset = 0;
      for (const frag of orderedFrags) {
        combined.set(frag.data, offset);
        offset += frag.data.length;
      }

      const recSha256 = await calculateSha256(combined);
      addLog('HASH', `Reconstructed payload SHA-256 computed: ${recSha256}`, 'info');

      const validation = await validateReconstructedFile(combined, reconstructionResult.detectedFileType);
      addLog(
        'VALIDATE',
        `Validation verdict: ${validation.status} (${validation.checks.filter((c) => c.passed).length}/${validation.checks.length} checks passed)`,
        validation.isValid ? 'success' : 'warning'
      );

      const finalResult: ReconstructionResult = {
        ...reconstructionResult,
        reconstructedBytes: combined,
        reconstructedSha256: recSha256,
        reconstructedSize: combined.length,
        validation,
      };

      setReconstructionResult(finalResult);

      if (validation.isValid) {
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.65 },
        });
      }
    } catch (err: any) {
      addLog('RECONSTRUCT', `Reconstruction error: ${err?.message || err}`, 'error');
    } finally {
      setIsReconstructing(false);
    }
  };

  // 3. Try Demo Preset
  const handleTryDemo = async (preset: DemoPreset = 'pdf') => {
    addLog('UPLOAD', `Loading hackathon demo scenario (${preset.toUpperCase()})...`, 'info');
    const demoRes = await generateDemoFragments(preset);
    setFragments(demoRes.shuffledFragments);
    demoRes.shuffledFragments.forEach((f) => {
      addLog('UPLOAD', `Demo fragment ingested: ${f.name} (${f.size} bytes)`, 'info');
    });
    handleAnalyze(demoRes.shuffledFragments);
  };

  // 4. Download Reconstructed File
  const handleDownloadReconstructed = () => {
    if (!reconstructionResult || reconstructionResult.reconstructedBytes.length === 0) return;
    const ext = reconstructionResult.detectedFileType.toLowerCase();
    const filename = `reconstructed_recovered.${ext}`;
    const blob = new Blob([reconstructionResult.reconstructedBytes as unknown as BlobPart], {
      type: 'application/octet-stream',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addLog('RECONSTRUCT', `Exported reconstructed artifact as ${filename}`, 'info');
  };

  // 5. Open Recovery Report Modal
  const handleOpenReportModal = () => {
    if (!reconstructionResult) return;
    const jsonReport = buildRecoveryReportJson(
      fragments,
      reconstructionResult,
      auditLog
    );
    const textReport = buildRecoveryReportText(jsonReport);
    setCurrentReportJson(jsonReport);
    setCurrentReportText(textReport);
    setShowReportModal(true);
    addLog('REPORT', `Generated comprehensive forensic recovery audit manifest.`, 'info');
  };

  return (
    <div className="space-y-6">
      <Header
        status={getOverallStatus()}
        onTryDemo={handleTryDemo}
        onReset={handleReset}
        fragmentCount={fragments.length}
      />

      {/* Internal Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'pipeline'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-950/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Reconstruction Pipeline
          </button>
          <button
            onClick={() => setActiveTab('matrix')}
            disabled={!matrixData}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-30 ${
              activeTab === 'matrix'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-950/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Compatibility Matrix {matrixData ? `(${fragments.length}×${fragments.length})` : ''}
          </button>
          <button
            onClick={() => setActiveTab('integrity')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'integrity'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-950/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Hashes & SHA-256
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'logs'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-950/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Audit Logs ({auditLog.length})
          </button>
        </div>

        {reconstructionResult && (
          <button
            onClick={handleOpenReportModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-semibold border border-cyan-500/30 transition-all"
          >
            <FileText className="w-3.5 h-3.5" /> Export Recovery Report
          </button>
        )}
      </div>

      {/* Tab 1: Full Reconstruction Pipeline */}
      {activeTab === 'pipeline' && (
        <div className="space-y-6">
          <UploadSection
            fragments={fragments}
            onAddFragments={handleAddFragments}
            onRemoveFragment={handleRemoveFragment}
            onAnalyze={() => handleAnalyze()}
            isAnalyzing={isAnalyzing}
          />

          {reconstructionResult && (
            <AnalysisResults
              fragments={fragments}
              detectedFileType={reconstructionResult.detectedFileType}
              predictedOrder={reconstructionResult.orderedFragmentNames}
              pairwiseTransitions={reconstructionResult.pairwiseTransitions}
              overallConfidence={reconstructionResult.overallConfidence}
              isUncertain={reconstructionResult.isUncertain}
              uncertaintyReason={reconstructionResult.uncertaintyReason}
            />
          )}

          {reconstructionResult && (
            <AIExplanationPanel
              aiExplanation={reconstructionResult.aiExplanation}
              isLoading={aiLoading}
              onRefreshExplanation={() =>
                fetchAiExplanation(
                  reconstructionResult.detectedFileType,
                  fragments,
                  reconstructionResult.orderedFragmentNames,
                  reconstructionResult.pairwiseTransitions,
                  reconstructionResult.overallConfidence,
                  reconstructionResult.validation
                )
              }
            />
          )}

          {reconstructionResult && (
            <ReconstructionView
              orderedFragments={reconstructionResult.orderedFragmentIds
                .map((id) => fragments.find((f) => f.id === id))
                .filter((f): f is FileFragment => !!f)}
              overallConfidence={reconstructionResult.overallConfidence}
              isUncertain={reconstructionResult.isUncertain}
              uncertaintyReason={reconstructionResult.uncertaintyReason}
              onReconstruct={handleReconstruct}
              isReconstructing={isReconstructing}
              hasReconstructed={reconstructionResult.reconstructedBytes.length > 0}
            />
          )}

          {reconstructionResult && reconstructionResult.reconstructedBytes.length > 0 && (
            <ValidationView
              result={reconstructionResult}
              onDownloadReconstructed={handleDownloadReconstructed}
            />
          )}

          {fragments.length > 0 && (
            <IntegritySection
              fragments={fragments}
              reconstructedSha256={reconstructionResult?.reconstructedSha256 || null}
              reconstructedSize={reconstructionResult?.reconstructedSize || null}
            />
          )}
        </div>
      )}

      {/* Tab 2: Compatibility Matrix Dedicated View */}
      {activeTab === 'matrix' && matrixData && (
        <CompatibilityMatrixView matrixData={matrixData} />
      )}

      {/* Tab 3: Dedicated Hashes & Cryptographic Audit */}
      {activeTab === 'integrity' && (
        <IntegritySection
          fragments={fragments}
          reconstructedSha256={reconstructionResult?.reconstructedSha256 || null}
          reconstructedSize={reconstructionResult?.reconstructedSize || null}
        />
      )}

      {/* Tab 4: Audit Operations Log */}
      {activeTab === 'logs' && <AuditLogView logs={auditLog} />}

      {/* Forensic Report Export Modal */}
      {showReportModal && (
        <RecoveryReportModal
          report={currentReportJson}
          reportText={currentReportText}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
};
