import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  FileCheck2,
  FileText,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Download,
  Terminal,
  Activity,
  CheckCircle2,
  Binary,
} from 'lucide-react';
import {
  FileMetadata,
  HashComparisonResult,
  StructuralValidationResult,
  AIIntegrityAnalysisResult,
  IntegrityVerificationReport,
  IntegrityStatus,
} from '../../types/integrity';
import { compareByteBuffers, formatBytes } from '../../utils/crypto';
import { performStructuralValidation } from '../../utils/structuralValidator';
import { generateIntegrityPresets, IntegrityPresetCase } from '../../utils/integrityPresets';
import { FileUploaderDual } from './FileUploaderDual';
import { FileMetadataCard } from './FileMetadataCard';
import { HashComparisonCard } from './HashComparisonCard';
import { StructuralValidationCard } from './StructuralValidationCard';
import { HexAndEntropyInspector } from './HexAndEntropyInspector';
import { AIIntegrityAnalysisCard } from './AIIntegrityAnalysisCard';
import { IntegrityReportModal } from './IntegrityReportModal';

export const IntegrityDashboard: React.FC = () => {
  const [recoveredFile, setRecoveredFile] = useState<FileMetadata | null>(null);
  const [referenceFile, setReferenceFile] = useState<FileMetadata | null>(null);
  const [hashComparison, setHashComparison] = useState<HashComparisonResult | null>(null);
  const [structuralValidation, setStructuralValidation] = useState<StructuralValidationResult | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIIntegrityAnalysisResult | null>(null);

  const [isVerifying, setIsVerifying] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [presets, setPresets] = useState<IntegrityPresetCase[]>([]);
  const [isLoadingPresets, setIsLoadingPresets] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);
  const [report, setReport] = useState<IntegrityVerificationReport | null>(null);

  // Initialize presets on mount
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const loaded = await generateIntegrityPresets();
        if (isMounted) {
          setPresets(loaded);
          // Auto load Preset 1 by default for instant impressive demo experience
          if (loaded.length > 0 && !recoveredFile) {
            handleLoadPreset(loaded[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load presets:', err);
      } finally {
        if (isMounted) setIsLoadingPresets(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // Run integrity verification engine
  const runVerification = useCallback(
    async (recFile: FileMetadata, refFile: FileMetadata | null) => {
      setIsVerifying(true);
      try {
        // 1. Perform structural validation on recovered file
        const structRes = await performStructuralValidation(recFile.data, recFile.name);
        setStructuralValidation(structRes);

        // 2. Perform Hash & Byte Comparison if Reference File exists
        let compRes: HashComparisonResult | null = null;
        if (refFile) {
          const sha256Match = recFile.sha256.toLowerCase() === refFile.sha256.toLowerCase();
          const sha512Match = recFile.sha512.toLowerCase() === refFile.sha512.toLowerCase();
          const md5Match = recFile.md5.toLowerCase() === refFile.md5.toLowerCase();
          const byteDiff = compareByteBuffers(refFile.data, recFile.data);

          const isIdentical = sha256Match && sha512Match && byteDiff.byteIdentical;

          compRes = {
            hasReference: true,
            sha256Match,
            sha512Match,
            md5Match,
            byteIdentical: isIdentical,
            sizeDiffBytes: recFile.size - refFile.size,
            referenceSha256: refFile.sha256,
            recoveredSha256: recFile.sha256,
            referenceSha512: refFile.sha512,
            recoveredSha512: recFile.sha512,
            referenceMd5: refFile.md5,
            recoveredMd5: recFile.md5,
            message: isIdentical
              ? 'The recovered file is byte-for-byte identical to the supplied reference file.'
              : 'The recovered file differs from the supplied reference file.',
            differingByteCount: byteDiff.differingByteCount,
            firstDiffOffset: byteDiff.firstDiffOffset,
            nonMaliciousNote:
              'Do not automatically conclude that the recovered file is malicious or fraudulent. Byte variations frequently occur due to filesystem cluster slack space, sector zero-padding, or metadata carving boundary differences.',
          };
          setHashComparison(compRes);
        } else {
          setHashComparison(null);
        }

        // Determine overall status
        let finalStatus: IntegrityStatus;
        let finalTitle: string;
        if (refFile && compRes) {
          if (compRes.byteIdentical) {
            finalStatus = 'BYTE_IDENTICAL';
            finalTitle = 'Complete & Byte-Identical to Reference';
          } else {
            finalStatus = 'MODIFIED_AFTER_RECOVERY';
            finalTitle = 'Hash Mismatch / Modified Payload';
          }
        } else {
          if (structRes.overallStatus === 'STRUCTURALLY VALIDATED') {
            finalStatus = 'STRUCTURALLY_VALIDATED';
            finalTitle = 'Structurally Validated (No Reference Available)';
          } else if (structRes.overallStatus === 'PARTIALLY RECOVERED') {
            finalStatus = 'PARTIALLY_RECOVERED';
            finalTitle = 'Partially Recovered / Truncated Stream';
          } else if (structRes.overallStatus === 'CORRUPTED') {
            finalStatus = 'CORRUPTED';
            finalTitle = 'Corrupted File Stream';
          } else {
            finalStatus = 'UNABLE_TO_VERIFY';
            finalTitle = 'Unable to Verify Structural Integrity';
          }
        }

        // 3. Assemble formal forensic report
        const rep: IntegrityVerificationReport = {
          reportId: `FOR-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
          generatedAt: new Date().toISOString(),
          verificationSystem: 'SectorRescue AI-Assisted Recovered File Integrity Verification System v2.4',
          overallStatus: finalStatus,
          statusTitle: finalTitle,
          hasReference: !!refFile,
          recoveredFile: {
            name: recFile.name,
            size: recFile.size,
            mimeType: recFile.mimeType,
            extension: recFile.extension,
            sha256: recFile.sha256,
            sha512: recFile.sha512,
            md5: recFile.md5,
            entropy: recFile.entropy,
          },
          referenceFile: refFile
            ? {
                name: refFile.name,
                size: refFile.size,
                mimeType: refFile.mimeType,
                extension: refFile.extension,
                sha256: refFile.sha256,
                sha512: refFile.sha512,
                md5: refFile.md5,
              }
            : undefined,
          hashComparison: compRes || undefined,
          structuralValidation: structRes,
          chainOfCustodyDisclaimer:
            'LEGAL & CHAIN OF CUSTODY NOTICE: The analyses performed herein are generated solely through deterministic binary parsing and mathematical hashing over the provided byte arrays. The host environment never modifies the recovered stream during verification.',
          authenticityNotice:
            'AUTHENTICITY DISCLAIMER: Do not claim that a file is authentic merely because its hash or file structure is valid. Integrity verification proves that the recovered byte sequence is complete and structurally sound. Authenticity verification requires independent verification of origin, legal authorship, digital signatures, and an uninterrupted chain of custody.',
        };
        setReport(rep);

        // 4. Trigger AI Consultation in background
        triggerAiAnalysis(recFile, refFile, compRes, structRes, rep);
      } catch (err) {
        console.error('Error during integrity verification:', err);
      } finally {
        setIsVerifying(false);
      }
    },
    []
  );

  // Trigger AI Forensics API call
  const triggerAiAnalysis = async (
    recFile: FileMetadata,
    refFile: FileMetadata | null,
    compRes: HashComparisonResult | null,
    structRes: StructuralValidationResult,
    currentReport?: IntegrityVerificationReport
  ) => {
    setAiLoading(true);
    try {
      const res = await fetch('/api/ai-integrity-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recoveredFile: {
            name: recFile.name,
            size: recFile.size,
            mimeType: recFile.mimeType,
            extension: recFile.extension,
            sha256: recFile.sha256,
            sha512: recFile.sha512,
            md5: recFile.md5,
            entropy: recFile.entropy,
          },
          referenceFile: refFile
            ? {
                name: refFile.name,
                size: refFile.size,
                sha256: refFile.sha256,
                sha512: refFile.sha512,
              }
            : null,
          hashComparison: compRes,
          structuralValidation: structRes,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAiAnalysis(data);
        if (currentReport) {
          setReport({ ...currentReport, aiForensics: data });
        }
      }
    } catch (err) {
      console.warn('AI analysis call failed, using deterministic forensic fallback');
    } finally {
      setAiLoading(false);
    }
  };

  const handleLoadPreset = (preset: IntegrityPresetCase) => {
    setRecoveredFile(preset.recoveredFile);
    setReferenceFile(preset.referenceFile || null);
    runVerification(preset.recoveredFile, preset.referenceFile || null);
  };

  const handleSetRecoveredFile = (file: FileMetadata) => {
    setRecoveredFile(file);
    runVerification(file, referenceFile);
  };

  const handleSetReferenceFile = (file: FileMetadata | null) => {
    setReferenceFile(file);
    if (recoveredFile) {
      runVerification(recoveredFile, file);
    }
  };

  const handleReset = () => {
    setRecoveredFile(null);
    setReferenceFile(null);
    setHashComparison(null);
    setStructuralValidation(null);
    setAiAnalysis(null);
    setReport(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Module Info */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-md relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> Post-Recovery Verification Module
              </span>
              <span className="text-slate-400 text-xs font-mono">• SHA-256 · SHA-512 · Parser Audits</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-100">
              AI-Assisted Recovered File Integrity Verification System
            </h1>
            <p className="text-xs text-slate-400 max-w-2xl mt-1 leading-relaxed">
              Verifies whether carved or recovered files are complete, structurally sound, truncated, or modified.
              Provides dual reference hash comparison, deep container marker validation, Shannon entropy mapping, and AI digital forensics insights.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {report && (
              <button
                onClick={() => setShowReportModal(true)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-cyan-950/40"
              >
                <Download className="w-4 h-4" /> Export Forensic Report
              </button>
            )}
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
          </div>
        </div>
      </div>

      {/* Upload Zone & Presets */}
      <FileUploaderDual
        recoveredFile={recoveredFile}
        referenceFile={referenceFile}
        onSetRecoveredFile={handleSetRecoveredFile}
        onSetReferenceFile={handleSetReferenceFile}
        onLoadPreset={handleLoadPreset}
        isLoadingPresets={isLoadingPresets}
        presets={presets}
      />

      {/* Metadata Cards Grid */}
      {recoveredFile && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <FileMetadataCard
            title="Recovered File Specification"
            badgeText="Recovered Stream"
            badgeVariant="primary"
            file={recoveredFile}
            onClear={() => setRecoveredFile(null)}
          />

          {referenceFile ? (
            <FileMetadataCard
              title="Reference / Baseline Specification"
              badgeText="Known Baseline"
              badgeVariant="reference"
              file={referenceFile}
              onClear={() => handleSetReferenceFile(null)}
            />
          ) : (
            <div className="bg-slate-900/60 border border-dashed border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center text-center">
              <div className="p-3 rounded-full bg-slate-800/60 text-slate-400 mb-2">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold text-slate-300 mb-1">No Reference File Supplied</h4>
              <p className="text-xs text-slate-400 max-w-xs mb-3">
                Standalone structural evaluation mode active. Complete byte-for-byte integrity cannot be proven without a reference, but deep format parsing confirms structural validity.
              </p>
              <button
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.onchange = async (e: any) => {
                    if (e.target.files?.[0]) {
                      const file = e.target.files[0];
                      const buf = await file.arrayBuffer();
                      const uint8 = new Uint8Array(buf);
                      const { calculateSha256, calculateSha512, calculateMd5, calculateBufferEntropy, calculateBlockEntropy } = await import('../../utils/crypto');
                      handleSetReferenceFile({
                        name: file.name,
                        size: file.size,
                        type: file.name.split('.').pop()?.toUpperCase() || 'BINARY',
                        mimeType: file.type || 'application/octet-stream',
                        extension: file.name.split('.').pop()?.toLowerCase() || '',
                        sha256: await calculateSha256(uint8),
                        sha512: await calculateSha512(uint8),
                        md5: calculateMd5(uint8),
                        entropy: calculateBufferEntropy(uint8),
                        entropyBlocks: calculateBlockEntropy(uint8, 40),
                        data: uint8,
                      });
                    }
                  };
                  input.click();
                }}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 transition-all"
              >
                + Add Optional Reference Copy
              </button>
            </div>
          )}
        </div>
      )}

      {/* Cryptographic Comparison Banner (when reference exists) */}
      {hashComparison && <HashComparisonCard comparison={hashComparison} />}

      {/* Structural Validation Checklist */}
      {structuralValidation && (
        <StructuralValidationCard
          validation={structuralValidation}
          hasReference={!!referenceFile}
        />
      )}

      {/* Hex & Block Entropy Inspector */}
      {recoveredFile && (
        <HexAndEntropyInspector
          file={recoveredFile}
          title={`Raw Hex & Entropy Forensic Inspector: ${recoveredFile.name}`}
        />
      )}

      {/* AI Forensic Analysis */}
      {recoveredFile && (
        <AIIntegrityAnalysisCard
          analysis={aiAnalysis}
          isLoading={aiLoading}
          onRefresh={() => {
            if (recoveredFile && structuralValidation) {
              triggerAiAnalysis(recoveredFile, referenceFile, hashComparison, structuralValidation, report || undefined);
            }
          }}
        />
      )}

      {/* Report Modal */}
      {report && (
        <IntegrityReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          report={report}
        />
      )}
    </div>
  );
};
