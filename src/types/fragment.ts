export type SupportedFileType = 'JPEG' | 'PNG' | 'PDF' | 'ZIP' | 'TEXT' | 'UNKNOWN';

export interface FragmentFeatures {
  magicDetected: string | null;
  footerDetected: string | null;
  isLikelyStart: boolean;
  isLikelyEnd: boolean;
  containsKnownMarkers: string[];
  startBytes: number[];
  endBytes: number[];
  entropy: number;
}

export interface FileFragment {
  id: string;
  name: string;
  size: number;
  data: Uint8Array;
  sha256: string;
  uploadTimestamp: number;
  hexSample: {
    start: string;
    end: string;
  };
  features: FragmentFeatures;
}

export interface CompatibilityPair {
  fromId: string;
  toId: string;
  fromName: string;
  toName: string;
  score: number; // 0 - 100
  reasons: string[];
  isStrongMatch: boolean;
}

export interface CompatibilityMatrixData {
  fragmentIds: string[];
  fragmentNames: Record<string, string>;
  scores: Record<string, Record<string, CompatibilityPair>>;
}

export interface ValidationCheck {
  name: string;
  passed: boolean;
  details: string;
}

export interface FileValidationResult {
  isValid: boolean;
  status: 'RECONSTRUCTION VALIDATED' | 'PARTIALLY RECOVERED / UNVERIFIED' | 'VALIDATION FAILED';
  reason?: string;
  checks: ValidationCheck[];
}

export interface AIExplanationData {
  source: string;
  summary: string;
  connectionsExplanation: {
    transition: string;
    score: string;
    analysis: string;
  }[];
  forensicVerdict: string;
  recommendation: string;
}

export interface ReconstructionResult {
  orderedFragmentIds: string[];
  orderedFragmentNames: string[];
  overallConfidence: number;
  isUncertain: boolean;
  uncertaintyReason?: string;
  reconstructedBytes: Uint8Array;
  reconstructedSha256: string;
  reconstructedSize: number;
  detectedFileType: SupportedFileType;
  mimeType: string;
  validation: FileValidationResult;
  pairwiseTransitions: {
    fromName: string;
    toName: string;
    score: number;
    reason: string;
  }[];
  previewUrl?: string;
  previewType: 'image' | 'pdf' | 'text' | 'binary';
  previewText?: string;
  aiExplanation?: AIExplanationData;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: 'UPLOAD' | 'ANALYZE' | 'SCORE' | 'ORDER' | 'RECONSTRUCT' | 'VALIDATE' | 'HASH' | 'REPORT';
  details: string;
  level: 'info' | 'success' | 'warning' | 'error';
}
