export type SupportedValidationFormat = 'JPEG' | 'PNG' | 'PDF' | 'ZIP' | 'TEXT' | 'UNKNOWN';

export type IntegrityStatus =
  | 'BYTE_IDENTICAL'
  | 'STRUCTURALLY_VALIDATED'
  | 'PARTIALLY_RECOVERED'
  | 'CORRUPTED'
  | 'MODIFIED_AFTER_RECOVERY'
  | 'UNABLE_TO_VERIFY';

export interface FileMetadata {
  name: string;
  size: number;
  type: string;
  mimeType: string;
  extension: string;
  lastModified?: number;
  lastModifiedDate?: string;
  sha256: string;
  sha512: string;
  md5: string;
  entropy: number;
  entropyBlocks: number[];
  data: Uint8Array;
}

export interface HashComparisonResult {
  hasReference: boolean;
  sha256Match: boolean;
  sha512Match: boolean;
  md5Match: boolean;
  byteIdentical: boolean;
  sizeDiffBytes: number;
  referenceSha256?: string;
  recoveredSha256: string;
  referenceSha512?: string;
  recoveredSha512: string;
  referenceMd5?: string;
  recoveredMd5: string;
  message: string;
  differingByteCount: number;
  firstDiffOffset: number | null;
  nonMaliciousNote: string;
}

export interface StructuralCheckItem {
  id: string;
  label: string;
  status: 'PASS' | 'WARN' | 'FAIL';
  details: string;
  technicalMetric?: string;
}

export interface StructuralValidationResult {
  format: SupportedValidationFormat;
  claimedExtension: string;
  fileSignatureValid: boolean;
  magicBytesHex: string;
  expectedMagicBytesHex: string;
  extensionConsistent: boolean;
  headerValid: boolean;
  footerValid: boolean;
  parserStatus: 'SUCCESS' | 'WARNING' | 'FAILED';
  parserMessage: string;
  corruptionDetected: boolean;
  corruptionSeverity: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  detectedIssues: string[];
  missingSections: string[];
  recommendations: string[];
  checks: StructuralCheckItem[];
  overallStatus: 'STRUCTURALLY VALIDATED' | 'PARTIALLY RECOVERED' | 'CORRUPTED' | 'UNABLE TO BE VERIFIED';
  statusNote: string;
}

export interface AIIntegrityAnalysisResult {
  source: string;
  summary: string;
  integrityVerdict: string;
  technicalFindings: string[];
  corruptionExplanation?: string;
  integrityVsAuthenticityExplanation: string;
  recommendations: string[];
}

export interface IntegrityVerificationReport {
  reportId: string;
  generatedAt: string;
  verificationSystem: string;
  overallStatus: IntegrityStatus;
  statusTitle: string;
  hasReference: boolean;
  recoveredFile: {
    name: string;
    size: number;
    mimeType: string;
    extension: string;
    sha256: string;
    sha512: string;
    md5: string;
    entropy: number;
  };
  referenceFile?: {
    name: string;
    size: number;
    mimeType: string;
    extension: string;
    sha256: string;
    sha512: string;
    md5: string;
  };
  hashComparison?: HashComparisonResult;
  structuralValidation: StructuralValidationResult;
  aiForensics?: AIIntegrityAnalysisResult;
  chainOfCustodyDisclaimer: string;
  authenticityNotice: string;
}
