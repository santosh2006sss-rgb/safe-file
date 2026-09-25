import { RecoveryCandidate, FileCategory, CandidateValidationStatus } from '../types/recovery';
import { FORENSIC_SIGNATURES } from './signatures';
import { calculateEntropy } from './carver';
import { calculateSHA256, calculateSHA512, calculateMD5 } from './crypto';

/**
 * Identify file format and signature from first bytes
 */
export function identifySignatureFromBytes(bytes: Uint8Array, filename: string): {
  matchedSig: typeof FORENSIC_SIGNATURES[0] | null;
  signatureHex: string;
  detectedType: string;
  category: FileCategory;
  extension: string;
  headerValid: boolean;
} {
  const hexPreview = Array.from(bytes.slice(0, Math.min(bytes.length, 8)))
    .map((b) => b.toString(16).padStart(2, '0').toUpperCase())
    .join(' ');

  for (const sig of FORENSIC_SIGNATURES) {
    let matches = true;
    if (bytes.length < sig.header.length) continue;
    for (let h = 0; h < sig.header.length; h++) {
      if (bytes[h] !== sig.header[h]) {
        matches = false;
        break;
      }
    }
    if (matches) {
      return {
        matchedSig: sig,
        signatureHex: hexPreview,
        detectedType: sig.name,
        category: sig.category,
        extension: sig.extension,
        headerValid: true,
      };
    }
  }

  // Check text/ASCII heuristics
  let printable = 0;
  const sampleLen = Math.min(bytes.length, 512);
  for (let i = 0; i < sampleLen; i++) {
    const b = bytes[i];
    if ((b >= 32 && b <= 126) || b === 10 || b === 13 || b === 9) {
      printable++;
    }
  }
  const isText = sampleLen > 0 && printable / sampleLen > 0.85;

  const extFromFilename = filename.split('.').pop()?.toLowerCase() || 'bin';
  return {
    matchedSig: null,
    signatureHex: hexPreview || '00 00 00 00',
    detectedType: isText ? 'Plain Text / Script' : 'Unclassified Binary Data',
    category: isText ? 'document' : 'archive',
    extension: extFromFilename,
    headerValid: isText,
  };
}

/**
 * Process a browser File object into a RecoveryCandidate
 */
export async function processFileToCandidate(
  file: File,
  index: number,
  sourceFolder = 'Downloads'
): Promise<RecoveryCandidate> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  const sigInfo = identifySignatureFromBytes(bytes, file.name);
  const entropy = calculateEntropy(bytes);
  const sha256 = await calculateSHA256(buffer);
  const sha512 = await calculateSHA512(buffer);
  const md5 = calculateMD5(bytes);

  // Check footer if matched signature has one
  let footerFound = false;
  let footerDetails: string | undefined = undefined;

  if (sigInfo.matchedSig?.footer && bytes.length >= sigInfo.matchedSig.footer.length) {
    const footerSig = sigInfo.matchedSig.footer;
    let match = true;
    const startIdx = bytes.length - footerSig.length;
    for (let f = 0; f < footerSig.length; f++) {
      if (bytes[startIdx + f] !== footerSig[f]) {
        match = false;
        break;
      }
    }
    if (match) {
      footerFound = true;
      footerDetails = `Valid terminator (${footerSig.map((b) => b.toString(16).padStart(2, '0').toUpperCase()).join(' ')}) at file end`;
    }
  }

  // Check if incomplete download (.crdownload, .part, .tmp)
  const isTempDownload = file.name.endsWith('.crdownload') || file.name.endsWith('.part') || file.name.endsWith('.tmp');

  let validationStatus: CandidateValidationStatus = 'Fully Recovered';
  let confidence = 95;
  let reasoning = 'Valid file structure and complete byte stream read from local Downloads.';

  if (isTempDownload) {
    validationStatus = 'Partially Recovered';
    confidence = 65;
    reasoning = 'File has temporary/interrupted download extension (.crdownload / .part). Incomplete cluster data.';
  } else if (sigInfo.matchedSig && !footerFound && sigInfo.matchedSig.footer) {
    validationStatus = 'Partially Recovered';
    confidence = 72;
    reasoning = 'Header matched container signature, but standard terminal footer was missing or truncated.';
  } else if (!sigInfo.headerValid && bytes.length > 0) {
    validationStatus = 'Unsupported';
    confidence = 50;
    reasoning = 'Binary file does not match standard magic byte signature catalog.';
  }

  let preview: string | undefined = undefined;
  if (sigInfo.category === 'image') {
    try {
      const blob = new Blob([bytes], { type: file.type || sigInfo.matchedSig?.mimeType || 'image/jpeg' });
      preview = URL.createObjectURL(blob);
    } catch {
      preview = undefined;
    }
  } else if (sigInfo.category === 'document' || sigInfo.extension === 'txt' || sigInfo.extension === 'csv') {
    const sample = bytes.slice(0, 150);
    preview = new TextDecoder('utf-8', { fatal: false }).decode(sample);
  }

  const offsetHex = '0x' + (index * 4096).toString(16).padStart(8, '0').toUpperCase();

  return {
    id: `DWN-${String(index + 1).padStart(4, '0')}`,
    fileType: sigInfo.detectedType,
    category: sigInfo.category,
    extension: sigInfo.extension,
    fileSignatureHex: sigInfo.signatureHex,
    sourceOffsetHex: offsetHex,
    sourceOffsetBytes: index * 4096,
    clusterNumber: index + 100,
    estimatedSizeBytes: file.size,
    headerFound: sigInfo.headerValid,
    headerSignature: sigInfo.matchedSig ? `Magic match: ${sigInfo.matchedSig.header.map((b) => b.toString(16).padStart(2, '0').toUpperCase()).join(' ')}` : 'ASCII / Stream',
    footerFound: footerFound,
    footerSignature: footerDetails || (isTempDownload ? 'Interrupted download stream' : 'EOF reached'),
    recoveryConfidence: confidence,
    confidenceReasoning: reasoning,
    validationStatus: validationStatus,
    entropy: entropy,
    sha256: sha256,
    sha512: sha512,
    md5: md5,
    isFragmented: isTempDownload,
    fragmentCount: isTempDownload ? 2 : 1,
    rawBinary: bytes,
    contentPreview: preview,
    recoveryNote: `Read directly from local system: ${file.name} (${sourceFolder})`,
    sourceName: file.name,
  };
}

/**
 * Read files from browser FileList (e.g. from folder picker or drop)
 */
export async function readFilesFromDirectory(
  files: FileList | File[],
  sourceFolder = 'Downloads'
): Promise<RecoveryCandidate[]> {
  const fileArray = Array.from(files);
  const candidates: RecoveryCandidate[] = [];

  for (let i = 0; i < fileArray.length; i++) {
    try {
      const candidate = await processFileToCandidate(fileArray[i], i, sourceFolder);
      candidates.push(candidate);
    } catch (err) {
      console.warn(`Could not process file ${fileArray[i].name}:`, err);
    }
  }

  return candidates;
}

/**
 * Fetch files from the Local Agent backend Downloads folder
 */
export async function fetchLocalAgentDownloads(customPath?: string): Promise<{
  success: boolean;
  downloadsPath: string;
  filesCount: number;
  candidates: RecoveryCandidate[];
  error?: string;
}> {
  try {
    const res = await fetch('/api/local-agent/read-downloads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customPath }),
    });

    if (!res.ok) {
      throw new Error(`Local Agent returned HTTP ${res.status}`);
    }

    const data = await res.json();
    return data;
  } catch (err: any) {
    return {
      success: false,
      downloadsPath: '',
      filesCount: 0,
      candidates: [],
      error: err.message || 'Failed to connect to Local Recovery Agent',
    };
  }
}
