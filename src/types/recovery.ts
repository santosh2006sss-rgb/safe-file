export type FileCategory = 'all' | 'image' | 'document' | 'video' | 'audio' | 'archive' | 'code' | 'database';

export type RecoveryIntegrity = 'recoverable' | 'good' | 'fragmented' | 'corrupted';

export interface RecoverableFile {
  id: string;
  filename: string;
  originalPath: string;
  extension: string;
  category: FileCategory;
  sizeBytes: number;
  deletedAt: string;
  integrity: RecoveryIntegrity;
  integrityScore: number; // 0 - 100
  clusterStart: number;
  clusterCount: number;
  isFragmented: boolean;
  magicHeader: string;
  mimeType: string;
  entropy: number;
  contentPreview?: string; // Text content, SVG, or data URI
  rawBinary?: Uint8Array;
  recoveryNote: string;
}

export interface DrivePartition {
  id: string;
  name: string;
  mountPoint: string;
  fileSystem: 'NTFS' | 'exFAT' | 'FAT32' | 'ext4' | 'APFS';
  driveType: 'NVMe SSD' | 'SATA SSD' | 'HDD' | 'USB Flash' | 'SD Card';
  totalBytes: number;
  usedBytes: number;
  deletedEstimatedBytes: number;
  health: 'Healthy' | 'Good' | 'Warning' | 'RAW';
  sectorSize: number;
  totalClusters: number;
  iconType: 'internal' | 'external' | 'sd';
  files: RecoverableFile[];
}

export type ScanMode = 'quick' | 'deep' | 'carve';

export interface ScanStatus {
  isActive: boolean;
  isPaused: boolean;
  mode: ScanMode;
  progressPercent: number;
  currentLBA: number;
  totalLBA: number;
  currentPath: string;
  scanSpeedMBps: number;
  elapsedSeconds: number;
  filesFoundCount: number;
  sectorsScanned: number;
  currentSectorType: 'free' | 'allocated' | 'deleted' | 'bad';
}

export interface SectorBlock {
  id: number;
  lba: number;
  status: 'free' | 'allocated' | 'recoverable' | 'damaged';
  fileRefId?: string;
  label?: string;
}

export type CandidateValidationStatus =
  | 'Fully Recovered'
  | 'Partially Recovered'
  | 'Fragmented'
  | 'Corrupted'
  | 'Unsupported';

export type RecoverySourceType =
  | 'user_directory'
  | 'forensic_dataset'
  | 'disk_image'
  | 'binary_fragments'
  | 'demo_data';

export interface ExtractedFragment {
  id: string;
  candidateId: string;
  offset: number;
  offsetHex: string;
  sizeBytes: number;
  sha256: string;
  isContiguous: boolean;
  clusterIndex: number;
  entropy: number;
  rawSampleHex: string;
}

export interface RecoveryCandidate {
  id: string; // e.g. CAND-0104
  fileType: string; // e.g. "JPEG Image"
  category: FileCategory;
  extension: string;
  fileSignatureHex: string; // e.g. "FF D8 FF E0"
  sourceOffsetHex: string; // e.g. "0x0014A800"
  sourceOffsetBytes: number;
  clusterNumber: number;
  estimatedSizeBytes: number;
  headerFound: boolean;
  headerSignature: string;
  footerFound: boolean;
  footerSignature?: string;
  recoveryConfidence: number; // 0 - 100
  confidenceReasoning: string;
  validationStatus: CandidateValidationStatus;
  entropy: number;
  sha256?: string;
  sha512?: string;
  md5?: string;
  isFragmented: boolean;
  fragmentCount: number;
  fragments?: ExtractedFragment[];
  rawBinary?: Uint8Array;
  contentPreview?: string;
  recoveryNote: string;
  sourceName: string;
  aiClassification?: {
    fileTypeIdentified: string;
    confidenceScore: number;
    validationStatus: CandidateValidationStatus;
    structuralAnalysis: string;
    fragmentCompatibilityNote: string;
    uncertaintyFlags: string[];
    forensicRecommendation: string;
  };
}

export interface AuthorizedRecoverySource {
  id: string;
  name: string;
  type: RecoverySourceType;
  pathOrIdentifier: string;
  fileSystem: 'NTFS' | 'FAT32' | 'exFAT' | 'ext4' | 'APFS' | 'RAW' | 'Unsupported';
  imageFormat?: 'RAW / DD (.dd, .raw)' | 'EnCase E01 (.E01)' | 'Raw Sector (.img)' | 'ISO 9660 (.iso)' | 'VHD (.vhd)' | 'Raw Memory Dump';
  sizeBytes: number;
  readOnly: boolean;
  status: 'ready' | 'authorized' | 'revoked' | 'unsupported_filesystem' | 'error';
  statusNote: string;
  description: string;
  outputDirectory: string;
  candidates: RecoveryCandidate[];
  isCustomUploaded?: boolean;
}

export interface ForensicAuditLogEntry {
  id: string;
  timestamp: string;
  action:
    | 'AGENT_INITIALIZED'
    | 'SOURCE_SELECTED'
    | 'PERMISSION_REQUESTED'
    | 'PERMISSION_GRANTED'
    | 'PERMISSION_REVOKED'
    | 'CANONICAL_PATH_CHECK'
    | 'SCAN_INITIATED'
    | 'SIGNATURE_DETECTED'
    | 'FRAGMENT_EXTRACTED'
    | 'CANDIDATE_DISPATCHED'
    | 'EXPORT_REPORT';
  details: string;
  status: 'SUCCESS' | 'WARNING' | 'DENIED' | 'INFO';
  operator: string;
}

export interface ForensicPermissionState {
  agentRunning: boolean;
  agentPid: number;
  agentVersion: string;
  source: AuthorizedRecoverySource | null;
  isAuthorized: boolean;
  userAttestation: boolean;
  outputDirectory: string;
  canonicalPathValid: boolean;
  readOnlyEnforced: boolean;
  auditLog: ForensicAuditLogEntry[];
}

