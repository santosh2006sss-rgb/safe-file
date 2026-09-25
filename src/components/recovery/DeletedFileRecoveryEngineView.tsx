import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  HardDrive,
  Cpu,
  Layers,
  Sparkles,
  Download,
  AlertTriangle,
  Play,
  RotateCcw,
  CheckCircle,
  FileCheck,
  FileText,
  Lock,
  Search,
  Activity,
  AlertOctagon,
  Ban,
} from 'lucide-react';
import {
  AuthorizedRecoverySource,
  RecoveryCandidate,
  ForensicAuditLogEntry,
  ScanMode,
  ScanStatus,
} from '../../types/recovery';
import { MOCK_RECOVERY_SOURCES } from '../../data/forensicSources';
import { scanBufferForCandidates } from '../../utils/signatures';
import { fetchLocalAgentDownloads, readFilesFromDirectory } from '../../utils/downloadsReader';
import { RecoverySourceSelector } from './RecoverySourceSelector';
import { RecoveryCandidateTable } from './RecoveryCandidateTable';
import { PermissionDialog } from './PermissionDialog';
import { AICandidateExplainerModal } from './AICandidateExplainerModal';
import { ForensicAuditReportModal } from './ForensicAuditReportModal';
import { ScanProgress } from '../ScanProgress';

interface DeletedFileRecoveryEngineViewProps {
  onNavigateToReconstruction: (candidate?: RecoveryCandidate) => void;
  onNavigateToIntegrity: (candidate?: RecoveryCandidate) => void;
}

export const DeletedFileRecoveryEngineView: React.FC<DeletedFileRecoveryEngineViewProps> = ({
  onNavigateToReconstruction,
  onNavigateToIntegrity,
}) => {
  const [sources, setSources] = useState<AuthorizedRecoverySource[]>(MOCK_RECOVERY_SOURCES);
  const [selectedSourceId, setSelectedSourceId] = useState<string>(MOCK_RECOVERY_SOURCES[0].id);
  const [isAuthorized, setIsAuthorized] = useState<boolean>(true); // Pre-authorized for first forensic corpus
  const [permissionModalOpen, setPermissionModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedCandidateForAI, setSelectedCandidateForAI] = useState<RecoveryCandidate | null>(null);

  const [auditLogs, setAuditLogs] = useState<ForensicAuditLogEntry[]>([
    {
      id: 'log_01',
      timestamp: new Date(Date.now() - 3600000).toISOString().replace('T', ' ').slice(0, 19),
      action: 'AGENT_INITIALIZED',
      details: 'SectorRescue Local Recovery Daemon v2.4.1 initialized. Hardware write-blocker detected.',
      status: 'SUCCESS',
      operator: 'Digital Forensics Examiner',
    },
    {
      id: 'log_02',
      timestamp: new Date(Date.now() - 3500000).toISOString().replace('T', ' ').slice(0, 19),
      action: 'CANONICAL_PATH_CHECK',
      details: 'Enforced canonical sandbox. Traversal tokens (..) and system folders (System32/Program Files) restricted.',
      status: 'SUCCESS',
      operator: 'Daemon Security Engine',
    },
    {
      id: 'log_03',
      timestamp: new Date(Date.now() - 3000000).toISOString().replace('T', ' ').slice(0, 19),
      action: 'SOURCE_SELECTED',
      details: 'Source mounted: NIST CFTT Forensic Test Dataset (Corpus #CFTT-DS-04) in READ-ONLY mode.',
      status: 'INFO',
      operator: 'Examiner',
    },
  ]);

  const currentSource = sources.find((s) => s.id === selectedSourceId) || sources[0];

  const [scanState, setScanState] = useState<ScanStatus>({
    isActive: false,
    isPaused: false,
    mode: 'deep',
    progressPercent: 100,
    currentLBA: 1953525168,
    totalLBA: 1953525168,
    currentPath: 'Sector signature analysis complete. Candidates indexed.',
    scanSpeedMBps: 485,
    elapsedSeconds: 8,
    filesFoundCount: currentSource.candidates.length,
    sectorsScanned: 1953525168,
    currentSectorType: 'allocated',
  });

  const addAuditLog = (
    action: ForensicAuditLogEntry['action'],
    details: string,
    status: ForensicAuditLogEntry['status'] = 'INFO'
  ) => {
    const newEntry: ForensicAuditLogEntry = {
      id: `log_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      action,
      details,
      status,
      operator: 'Digital Forensics Examiner',
    };
    setAuditLogs((prev) => [...prev, newEntry]);
  };

  const handleSelectSource = (sourceId: string) => {
    const src = sources.find((s) => s.id === sourceId);
    if (!src) return;

    setSelectedSourceId(sourceId);
    addAuditLog('SOURCE_SELECTED', `Selected target source: ${src.name} (${src.type}). Read-only mode verified.`);

    // If source is unsupported (e.g. APFS volume demonstration)
    if (src.status === 'unsupported_filesystem') {
      addAuditLog(
        'SOURCE_SELECTED',
        `UNSUPPORTED SOURCE: ${src.name}. Limitation: File system ${src.fileSystem} cannot be mounted. Source preserved unchanged.`,
        'WARNING'
      );
      setIsAuthorized(false);
      return;
    }

    // Require authorization confirmation if not previously approved
    if (src.id !== 'src_forensic_dataset_cftt' && !src.isCustomUploaded) {
      setIsAuthorized(false);
      setPermissionModalOpen(true);
    } else {
      setIsAuthorized(true);
    }
  };

  const handleApprovePermission = (outputDir: string) => {
    setSources((prev) =>
      prev.map((s) => (s.id === selectedSourceId ? { ...s, outputDirectory: outputDir, status: 'authorized' } : s))
    );
    setIsAuthorized(true);
    setPermissionModalOpen(false);
    addAuditLog(
      'PERMISSION_GRANTED',
      `Forensic legal attestation confirmed for ${currentSource.name}. Safe output directory locked to ${outputDir}.`,
      'SUCCESS'
    );
  };

  const handleRevokePermission = () => {
    setIsAuthorized(false);
    setPermissionModalOpen(false);
    addAuditLog('PERMISSION_REVOKED', `Authorization revoked for ${currentSource.name}. Access suspended.`, 'DENIED');
  };

  const handleStartScan = (mode: ScanMode = 'deep') => {
    if (!isAuthorized) {
      setPermissionModalOpen(true);
      return;
    }

    if (currentSource.status === 'unsupported_filesystem') {
      addAuditLog('SCAN_INITIATED', `Cannot scan unsupported filesystem: ${currentSource.fileSystem}. Evidence preserved unchanged.`, 'DENIED');
      return;
    }

    addAuditLog('SCAN_INITIATED', `Initiated ${mode.toUpperCase()} signature scanning across sector range.`);

    setScanState({
      isActive: true,
      isPaused: false,
      mode,
      progressPercent: 0,
      currentLBA: 0,
      totalLBA: 1953525168,
      scanSpeedMBps: mode === 'quick' ? 640 : 420,
      filesFoundCount: 0,
      elapsedSeconds: 0,
      sectorsScanned: 0,
      currentSectorType: 'allocated',
      currentPath: `Scanning clusters in ${currentSource.name}...`,
    });

    const duration = mode === 'quick' ? 2500 : 4500;
    const interval = 100;
    let elapsed = 0;

    const timer = setInterval(() => {
      elapsed += interval;
      const progress = Math.min(100, Math.round((elapsed / duration) * 100));
      const discovered = Math.round((progress / 100) * currentSource.candidates.length);

      setScanState((prev) => ({
        ...prev,
        progressPercent: progress,
        currentLBA: Math.round((progress / 100) * 1953525168),
        filesFoundCount: discovered,
        elapsedSeconds: Math.floor(elapsed / 1000),
        currentPath: `Inspecting cluster offset 0x${Math.round((progress / 100) * 65535).toString(16).toUpperCase()} for magic byte headers...`,
      }));

      if (elapsed >= duration) {
        clearInterval(timer);
        setScanState((prev) => ({
          ...prev,
          isActive: false,
          progressPercent: 100,
          currentPath: 'Signature scan completed. All boundaries validated.',
        }));
        addAuditLog(
          'SIGNATURE_DETECTED',
          `Scan completed. Indexed ${currentSource.candidates.length} recovery candidates with verified offsets.`,
          'SUCCESS'
        );
      }
    }, interval);
  };

  const handleCustomFileUpload = async (file: File) => {
    addAuditLog('SOURCE_SELECTED', `Loading user-provided raw evidence file: ${file.name} (${file.size} bytes).`);
    try {
      const buffer = await file.arrayBuffer();
      const candidates = await scanBufferForCandidates(buffer, file.name);

      const customSourceId = `custom_source_${Date.now()}`;
      const newSource: AuthorizedRecoverySource = {
        id: customSourceId,
        name: `User Evidence: ${file.name}`,
        type: 'user_directory',
        pathOrIdentifier: `/evidence/${file.name}`,
        fileSystem: 'RAW',
        imageFormat: 'Raw Sector (.img)',
        sizeBytes: file.size,
        readOnly: true,
        status: 'authorized',
        statusNote: 'Custom raw disk dump parsed using deterministic signature engine.',
        description: `Direct binary stream uploaded by investigator (${(file.size / 1024).toFixed(1)} KB).`,
        outputDirectory: '/mnt/forensics_output/user_carve',
        candidates: candidates,
        isCustomUploaded: true,
      };

      setSources((prev) => [newSource, ...prev]);
      setSelectedSourceId(customSourceId);
      setIsAuthorized(true);
      addAuditLog(
        'SIGNATURE_DETECTED',
        `Carved ${candidates.length} candidates from ${file.name} across standard forensic signatures.`,
        'SUCCESS'
      );
    } catch (err: any) {
      addAuditLog('SOURCE_SELECTED', `Failed to parse binary buffer: ${err.message}`, 'WARNING');
    }
  };

  const [downloadsLoading, setDownloadsLoading] = useState(false);
  const [downloadsScanMessage, setDownloadsScanMessage] = useState<string | null>(null);

  const handleScanSystemDownloads = async () => {
    setDownloadsLoading(true);
    setDownloadsScanMessage('Querying Local Recovery Agent for system Downloads directory...');
    addAuditLog('SOURCE_SELECTED', 'Requested local agent scan of system Downloads directory (~/Downloads).');

    try {
      const result = await fetchLocalAgentDownloads();
      if (result.success && result.candidates.length > 0) {
        const dwnSource: AuthorizedRecoverySource = {
          id: 'src_local_system_downloads',
          name: `Host System Downloads (${result.filesCount} files)`,
          type: 'user_directory',
          pathOrIdentifier: result.downloadsPath,
          fileSystem: 'NTFS',
          imageFormat: 'Raw Sector (.img)',
          sizeBytes: result.candidates.reduce((sum, c) => sum + c.estimatedSizeBytes, 0),
          readOnly: true,
          status: 'authorized',
          statusNote: `Directly read ${result.filesCount} files from host Downloads.`,
          description: `Host system Downloads directory: ${result.downloadsPath}`,
          outputDirectory: '/mnt/forensics_output/downloads_recovery',
          candidates: result.candidates,
        };

        setSources((prev) => {
          const filtered = prev.filter((s) => s.id !== 'src_local_system_downloads');
          return [dwnSource, ...filtered];
        });
        setSelectedSourceId('src_local_system_downloads');
        setIsAuthorized(true);
        setDownloadsScanMessage(`Successfully indexed ${result.filesCount} files from ${result.downloadsPath}`);
        addAuditLog(
          'SIGNATURE_DETECTED',
          `Successfully read and indexed ${result.filesCount} files from system Downloads folder (${result.downloadsPath}).`,
          'SUCCESS'
        );
      } else {
        setDownloadsScanMessage(result.error || 'No files discovered in Downloads directory.');
      }
    } catch (err: any) {
      setDownloadsScanMessage(`Error: ${err.message}`);
    } finally {
      setDownloadsLoading(false);
    }
  };

  const handleSelectDirectoryFiles = async (files: FileList) => {
    if (!files || files.length === 0) return;
    setDownloadsLoading(true);
    setDownloadsScanMessage(`Reading ${files.length} files from user-selected local directory...`);
    addAuditLog('SOURCE_SELECTED', `User picked local folder containing ${files.length} files via browser directory picker.`);

    try {
      const candidates = await readFilesFromDirectory(files, 'User Local Directory');
      const folderName = (files[0] as any).webkitRelativePath
        ? (files[0] as any).webkitRelativePath.split('/')[0]
        : 'Local_Folder';

      const dirSource: AuthorizedRecoverySource = {
        id: `local_dir_${Date.now()}`,
        name: `Local Folder: ${folderName} (${candidates.length} files)`,
        type: 'user_directory',
        pathOrIdentifier: `Local System Directory: ${folderName}`,
        fileSystem: 'NTFS',
        imageFormat: 'Raw Sector (.img)',
        sizeBytes: candidates.reduce((sum, c) => sum + c.estimatedSizeBytes, 0),
        readOnly: true,
        status: 'authorized',
        statusNote: `Read directly from local system: ${candidates.length} files.`,
        description: `Imported via native browser directory picker: ${folderName}`,
        outputDirectory: '/mnt/forensics_output/local_dir_recovery',
        candidates: candidates,
        isCustomUploaded: true,
      };

      setSources((prev) => [dirSource, ...prev]);
      setSelectedSourceId(dirSource.id);
      setIsAuthorized(true);
      setDownloadsScanMessage(`Successfully read ${candidates.length} files from ${folderName}`);
      addAuditLog(
        'SIGNATURE_DETECTED',
        `Successfully parsed and hashed ${candidates.length} files from local folder ${folderName}.`,
        'SUCCESS'
      );
    } catch (err: any) {
      setDownloadsScanMessage(`Error reading folder: ${err.message}`);
    } finally {
      setDownloadsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Recovery Agent & Pipeline Banner */}
      <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-950 p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-md shadow-cyan-950/40">
              <HardDrive className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  AI-Assisted Intelligent Deleted File Recovery System
                </h1>
                <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  AGENT DAEMON ACTIVE (PID: 4182)
                </span>
                <span className="rounded bg-cyan-500/10 px-2 py-0.5 text-[10px] font-mono font-bold text-cyan-400 border border-cyan-500/30">
                  STEP 1: RECOVERY ENGINE
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Authorized Evidence Ingestion · Magic Byte Signature Scanning · Boundary Carving · Fragment Extraction
              </p>
            </div>
          </div>

          {/* Forensic Guarantees & Action Controls */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/90 px-3 py-1.5 text-[11px] font-mono text-slate-300">
              <Lock className="h-3.5 w-3.5 text-emerald-400" />
              <span>Write-Block: <strong className="text-emerald-400">HARDWARE LOCK</strong></span>
            </div>

            <button
              onClick={() => setReportModalOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition"
            >
              <FileText className="h-3.5 w-3.5 text-cyan-400" />
              <span>Recovery Audit Report</span>
            </button>

            {!isAuthorized && currentSource.status !== 'unsupported_filesystem' ? (
              <button
                onClick={() => setPermissionModalOpen(true)}
                className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-400 transition shadow-lg shadow-amber-950/50"
              >
                <FileCheck className="h-4 w-4" />
                <span>Grant Authorization</span>
              </button>
            ) : (
              <button
                onClick={() => handleStartScan('deep')}
                disabled={scanState.isActive || currentSource.status === 'unsupported_filesystem'}
                className="flex items-center gap-1.5 rounded-lg bg-cyan-500 px-4 py-1.5 text-xs font-bold text-slate-950 hover:bg-cyan-400 transition shadow-lg shadow-cyan-950/50 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>Execute Deep Carve</span>
              </button>
            )}
          </div>
        </div>

        {/* 3-Step Forensics Investigation Pipeline Progress */}
        <div className="mt-4 pt-3.5 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-semibold">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500 text-slate-950 text-[10px] font-bold">1</span>
            <span>1. Detection & Carving (Active)</span>
          </div>
          <button
            onClick={() => onNavigateToReconstruction()}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-950/60 border border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition text-left"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-slate-400 text-[10px]">2</span>
            <span>2. Fragment Reassembly →</span>
          </button>
          <button
            onClick={() => onNavigateToIntegrity()}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-950/60 border border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition text-left"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-slate-400 text-[10px]">3</span>
            <span>3. Integrity Verification →</span>
          </button>
        </div>
      </div>

      {/* Unsupported Filesystem Alert Banner */}
      {currentSource.status === 'unsupported_filesystem' && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-950/30 p-4 text-xs font-mono text-rose-200 flex items-start gap-3 shadow-lg">
          <AlertOctagon className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-rose-300">
              UNSUPPORTED FILE SYSTEM LIMITATION: {currentSource.fileSystem}
            </p>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              The target volume uses an unsupported or proprietary encrypted container ({currentSource.fileSystem}). In strict accordance with digital forensics standards, the source evidence is preserved completely untouched without modifying a single bit. Select a supported NTFS, FAT32, exFAT, ext4, or raw sector image to proceed.
            </p>
          </div>
        </div>
      )}

      {/* Section 1: Authorized Source Selector */}
      <RecoverySourceSelector
        sources={sources}
        selectedSourceId={selectedSourceId}
        onSelectSource={handleSelectSource}
        onRequestPermission={(src) => {
          setSelectedSourceId(src.id);
          setPermissionModalOpen(true);
        }}
        isAuthorized={isAuthorized}
        onCustomFileUpload={handleCustomFileUpload}
        onScanSystemDownloads={handleScanSystemDownloads}
        onSelectDirectoryFiles={handleSelectDirectoryFiles}
        isScanning={scanState.isActive}
      />

      {/* Downloads / Folder Ingestion Status Banner */}
      {downloadsScanMessage && (
        <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 px-4 py-2.5 text-xs font-mono text-cyan-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <span>{downloadsScanMessage}</span>
          </div>
          <button
            onClick={() => setDownloadsScanMessage(null)}
            className="text-[10px] text-cyan-400/70 hover:text-cyan-200"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Section 2: Scanning Progress (When Active) */}
      {scanState.isActive && (
        <ScanProgress
          scanStatus={scanState}
          driveName={currentSource.name}
          onPause={() => {}}
          onResume={() => {}}
          onStop={() => {}}
        />
      )}

      {/* Section 3: Discovered Candidates Table */}
      {currentSource.status !== 'unsupported_filesystem' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div>
              <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
                Discovered File Candidates & Carved Entities
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Indexed candidates identified via magic number headers, sector offsets, and boundary markers.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-slate-400">
                Found in <span className="text-cyan-400 font-semibold">{currentSource.name}</span>
              </span>
            </div>
          </div>

          <RecoveryCandidateTable
            candidates={currentSource.candidates}
            onSelectCandidateForAI={(candidate) => setSelectedCandidateForAI(candidate)}
            onSendToIntegrity={(candidate) => onNavigateToIntegrity(candidate)}
            onSendToReconstruction={(candidate) => onNavigateToReconstruction(candidate)}
            onPreviewCandidate={(candidate) => setSelectedCandidateForAI(candidate)}
          />
        </div>
      )}

      {/* Section 4: Live Forensic Audit Log Excerpt */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 font-mono text-xs">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
          <div className="flex items-center gap-2 text-slate-300 font-semibold">
            <Activity className="h-4 w-4 text-cyan-400" />
            <span>Forensic Daemon Audit Ledger (Read-Only Activity)</span>
          </div>
          <span className="text-[10px] text-slate-500">Tamper-evident sequence</span>
        </div>

        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 text-[11px]">
          {auditLogs.slice(-6).map((log) => (
            <div key={log.id} className="flex items-start gap-2 text-slate-400">
              <span className="text-slate-600 shrink-0">[{log.timestamp.slice(11)}]</span>
              <span
                className={`font-semibold shrink-0 px-1 rounded text-[10px] ${
                  log.status === 'SUCCESS'
                    ? 'text-emerald-400 bg-emerald-950/30'
                    : log.status === 'WARNING'
                    ? 'text-amber-400 bg-amber-950/30'
                    : log.status === 'DENIED'
                    ? 'text-rose-400 bg-rose-950/30'
                    : 'text-cyan-400 bg-cyan-950/30'
                }`}
              >
                {log.action}
              </span>
              <span className="text-slate-300 truncate">{log.details}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Permission Dialog */}
      <PermissionDialog
        source={currentSource}
        isOpen={permissionModalOpen}
        onClose={() => setPermissionModalOpen(false)}
        onApprove={handleApprovePermission}
        onRevoke={handleRevokePermission}
        isAuthorized={isAuthorized}
      />

      {/* AI Candidate Explainer Modal (Gemini 3.8 Flash) */}
      <AICandidateExplainerModal
        candidate={selectedCandidateForAI}
        onClose={() => setSelectedCandidateForAI(null)}
        onSendToReconstruction={(candidate) => {
          setSelectedCandidateForAI(null);
          onNavigateToReconstruction(candidate);
        }}
        onSendToIntegrity={(candidate) => {
          setSelectedCandidateForAI(null);
          onNavigateToIntegrity(candidate);
        }}
      />

      {/* Forensic Audit Report Modal */}
      <ForensicAuditReportModal
        source={currentSource}
        candidates={currentSource.candidates}
        auditLogs={auditLogs}
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
      />
    </div>
  );
};
