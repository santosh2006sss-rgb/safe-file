import React, { useState } from 'react';
import { MOCK_DRIVES } from '../data/mockDrives';
import { DrivePartition, RecoverableFile, ScanStatus, ScanMode } from '../types/recovery';
import { DriveSelector } from './DriveSelector';
import { FileList } from './FileList';
import { CarverDropzone } from './CarverDropzone';
import { FilePreviewModal } from './FilePreviewModal';
import { NativeOsCommands } from './NativeOsCommands';
import { RecoveryWizard } from './RecoveryWizard';
import { RecoveryCompleteModal } from './RecoveryCompleteModal';
import { SectorMap } from './SectorMap';
import { ScanProgress } from './ScanProgress';
import { TopNav, ActiveTab } from './TopNav';

export const DiskRecoveryView: React.FC = () => {
  const [drives, setDrives] = useState<DrivePartition[]>(MOCK_DRIVES);
  const [selectedDriveId, setSelectedDriveId] = useState<string>(MOCK_DRIVES[0].id);
  const [activeSubTab, setActiveSubTab] = useState<ActiveTab>('drives');

  const [scanState, setScanState] = useState<ScanStatus>({
    isActive: false,
    isPaused: false,
    mode: 'quick',
    progressPercent: 100,
    currentLBA: 1953525168,
    totalLBA: 1953525168,
    currentPath: 'Scanning sector allocations complete.',
    scanSpeedMBps: 485,
    elapsedSeconds: 14,
    filesFoundCount: MOCK_DRIVES[0].files.length,
    sectorsScanned: 1953525168,
    currentSectorType: 'allocated',
  });

  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());
  const [previewFile, setPreviewFile] = useState<RecoverableFile | null>(null);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [recoveredFilesList, setRecoveredFilesList] = useState<RecoverableFile[]>([]);

  const currentDrive = drives.find((d) => d.id === selectedDriveId) || drives[0];

  const handleStartScan = (driveId: string, mode: ScanMode) => {
    setSelectedDriveId(driveId);
    setScanState({
      isActive: true,
      isPaused: false,
      mode,
      progressPercent: 0,
      currentLBA: 0,
      totalLBA: 1953525168,
      scanSpeedMBps: mode === 'quick' ? 620 : 410,
      filesFoundCount: 0,
      elapsedSeconds: 0,
      sectorsScanned: 0,
      currentSectorType: 'allocated',
      currentPath: 'Parsing MFT Master File Table & Record Headers...',
    });

    const duration = mode === 'quick' ? 3000 : 6000;
    const interval = 100;
    let elapsed = 0;

    const timer = setInterval(() => {
      elapsed += interval;
      const progress = Math.min(100, Math.round((elapsed / duration) * 100));
      const targetDrive = drives.find((d) => d.id === driveId) || drives[0];
      const discovered = Math.round((progress / 100) * targetDrive.files.length);

      setScanState((prev) => ({
        ...prev,
        progressPercent: progress,
        currentLBA: Math.round((progress / 100) * 1953525168),
        filesFoundCount: discovered,
        elapsedSeconds: Math.floor(elapsed / 1000),
        currentPath: `Scanning cluster 0x${Math.round((progress / 100) * 65535).toString(16)}...`,
      }));

      if (elapsed >= duration) {
        clearInterval(timer);
        setScanState((prev) => ({
          ...prev,
          isActive: false,
          progressPercent: 100,
          currentPath: 'Scan complete. All recoverable sectors indexed.',
        }));
      }
    }, interval);
  };

  const handleToggleSelectFile = (fileId: string) => {
    setSelectedFileIds((prev) => {
      const next = new Set(prev);
      if (next.has(fileId)) next.delete(fileId);
      else next.add(fileId);
      return next;
    });
  };

  const handleSelectAllFiles = (fileIds: string[]) => {
    if (selectedFileIds.size === fileIds.length) {
      setSelectedFileIds(new Set());
    } else {
      setSelectedFileIds(new Set(fileIds));
    }
  };

  const handleRecoverFiles = (filesToRecover: RecoverableFile[]) => {
    if (filesToRecover.length === 0) return;
    setRecoveredFilesList(filesToRecover);
    setShowCompleteModal(true);
  };

  const handleFilesCarvedFromDropzone = (carved: RecoverableFile[], sourceName: string) => {
    const customDriveId = `custom_${Date.now()}`;
    const newDrive: DrivePartition = {
      id: customDriveId,
      name: sourceName,
      mountPoint: 'RAW:',
      fileSystem: 'exFAT',
      driveType: 'USB Flash',
      totalBytes: carved.reduce((acc, c) => acc + c.sizeBytes, 0) * 1.5,
      usedBytes: carved.reduce((acc, c) => acc + c.sizeBytes, 0),
      deletedEstimatedBytes: carved.reduce((acc, c) => acc + c.sizeBytes, 0),
      health: 'Good',
      sectorSize: 512,
      totalClusters: Math.ceil(carved.reduce((acc, c) => acc + c.sizeBytes, 0) / 4096),
      iconType: 'external',
      files: carved,
    };

    setDrives((prev) => [newDrive, ...prev]);
    setSelectedDriveId(customDriveId);
    setActiveSubTab('drives');
    setSelectedFileIds(new Set(carved.map((c) => c.id)));
  };

  return (
    <div className="space-y-6">
      {/* Sub navigation for Disk Carver module */}
      <TopNav
        activeTab={activeSubTab}
        onTabChange={setActiveSubTab}
        isScanning={scanState.isActive}
        selectedCount={selectedFileIds.size}
        onRecoverSelected={() => {
          const files = currentDrive.files.filter((f) => selectedFileIds.has(f.id));
          handleRecoverFiles(files);
        }}
      />

      {/* Main Content Area */}
      {activeSubTab === 'drives' && (
        <div className="space-y-6">
          <DriveSelector
            drives={drives}
            selectedDriveId={selectedDriveId}
            onSelectDrive={setSelectedDriveId}
            onStartScan={handleStartScan}
            isScanning={scanState.isActive}
          />

          {scanState.isActive && (
            <ScanProgress
              scanStatus={scanState}
              driveName={currentDrive.name}
              onPause={() => {}}
              onResume={() => {}}
              onStop={() => {}}
            />
          )}

          <FileList
            files={currentDrive.files}
            selectedFileIds={selectedFileIds}
            onToggleSelect={handleToggleSelectFile}
            onSelectAll={handleSelectAllFiles}
            onClearSelect={() => setSelectedFileIds(new Set())}
            onOpenFilePreview={setPreviewFile}
            onRecoverSingle={(f) => handleRecoverFiles([f])}
          />
        </div>
      )}

      {activeSubTab === 'carver' && (
        <CarverDropzone onFilesCarved={handleFilesCarvedFromDropzone} />
      )}

      {activeSubTab === 'sectors' && (
        <SectorMap
          files={currentDrive.files}
          onSelectFile={setPreviewFile}
          isScanning={scanState.isActive}
          currentLBA={scanState.currentLBA}
        />
      )}

      {activeSubTab === 'os_commands' && <NativeOsCommands />}

      {activeSubTab === 'triage' && <RecoveryWizard />}

      {/* File Preview Modal */}
      {previewFile && (
        <FilePreviewModal
          file={previewFile}
          onClose={() => setPreviewFile(null)}
          onRecover={(f) => handleRecoverFiles([f])}
        />
      )}

      {/* Recovery Complete Modal */}
      {showCompleteModal && (
        <RecoveryCompleteModal
          files={recoveredFilesList}
          onClose={() => setShowCompleteModal(false)}
        />
      )}
    </div>
  );
};
