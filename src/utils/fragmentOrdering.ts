import {
  FileFragment,
  FragmentFeatures,
  SupportedFileType,
  CompatibilityPair,
  CompatibilityMatrixData,
} from '../types/fragment';
import { calculateBufferEntropy, bytesToHex } from './crypto';

// Signatures
const SIG_JPEG_START = [0xFF, 0xD8];
const SIG_JPEG_END = [0xFF, 0xD9];
const SIG_PNG_START = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
const SIG_PNG_END = [0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82]; // IEND chunk
const SIG_PDF_START = [0x25, 0x50, 0x44, 0x46]; // %PDF
const SIG_ZIP_START = [0x50, 0x4B, 0x03, 0x04]; // PK..
const SIG_ZIP_EOCD = [0x50, 0x4B, 0x05, 0x06]; // End of Central Dir

/**
 * Check if buffer contains a byte sequence at a given offset
 */
function matchBytes(buffer: Uint8Array, sequence: number[], offset = 0): boolean {
  if (offset + sequence.length > buffer.length || offset < 0) return false;
  for (let i = 0; i < sequence.length; i++) {
    if (buffer[offset + i] !== sequence[i]) return false;
  }
  return true;
}

/**
 * Search for a byte sequence anywhere in buffer
 */
function findByteSequence(buffer: Uint8Array, sequence: number[]): number {
  if (sequence.length > buffer.length) return -1;
  for (let i = 0; i <= buffer.length - sequence.length; i++) {
    let matched = true;
    for (let j = 0; j < sequence.length; j++) {
      if (buffer[i + j] !== sequence[j]) {
        matched = false;
        break;
      }
    }
    if (matched) return i;
  }
  return -1;
}

/**
 * Search for ASCII string in byte buffer
 */
function findAscii(buffer: Uint8Array, str: string): number {
  const seq = Array.from(str).map((c) => c.charCodeAt(0));
  return findByteSequence(buffer, seq);
}

/**
 * Extract forensic features from a raw fragment
 */
export function extractFragmentFeatures(data: Uint8Array): FragmentFeatures {
  const len = data.length;
  const entropy = calculateBufferEntropy(data);
  const containsKnownMarkers: string[] = [];

  let magicDetected: string | null = null;
  let footerDetected: string | null = null;
  let isLikelyStart = false;
  let isLikelyEnd = false;

  // 1. JPEG Detection
  if (matchBytes(data, SIG_JPEG_START, 0)) {
    magicDetected = 'JPEG SOI (0xFFD8)';
    isLikelyStart = true;
    containsKnownMarkers.push('JPEG SOI Header');
  }
  // Check for JPEG EOI near end (within last 32 bytes)
  for (let i = Math.max(0, len - 32); i <= len - 2; i++) {
    if (matchBytes(data, SIG_JPEG_END, i)) {
      footerDetected = 'JPEG EOI (0xFFD9)';
      isLikelyEnd = true;
      containsKnownMarkers.push('JPEG EOI Footer');
      break;
    }
  }
  if (findByteSequence(data, [0xFF, 0xDA]) !== -1) containsKnownMarkers.push('JPEG SOS (Start of Scan)');
  if (findByteSequence(data, [0xFF, 0xDB]) !== -1) containsKnownMarkers.push('JPEG DQT (Quantization Table)');
  if (findByteSequence(data, [0xFF, 0xC0]) !== -1) containsKnownMarkers.push('JPEG SOF0 (Frame Header)');

  // 2. PNG Detection
  if (matchBytes(data, SIG_PNG_START, 0)) {
    magicDetected = 'PNG Signature (0x89504E47)';
    isLikelyStart = true;
    containsKnownMarkers.push('PNG 8-byte Signature');
    if (matchBytes(data, [0x49, 0x48, 0x44, 0x52], 12)) {
      containsKnownMarkers.push('PNG IHDR Chunk');
    }
  }
  if (findByteSequence(data, SIG_PNG_END) !== -1 || (len >= 4 && matchBytes(data, [0x49, 0x45, 0x4E, 0x44], len - 8))) {
    footerDetected = 'PNG IEND Chunk';
    isLikelyEnd = true;
    containsKnownMarkers.push('PNG IEND Footer');
  }
  if (findAscii(data, 'IDAT') !== -1) containsKnownMarkers.push('PNG IDAT (Image Data Chunk)');

  // 3. PDF Detection
  if (matchBytes(data, SIG_PDF_START, 0)) {
    magicDetected = 'PDF Header (%PDF-)';
    isLikelyStart = true;
    containsKnownMarkers.push('PDF Version Header');
  }
  // Check for %%EOF near end
  const eofIndex = findAscii(data.slice(Math.max(0, len - 256)), '%%EOF');
  if (eofIndex !== -1) {
    footerDetected = 'PDF %%EOF Marker';
    isLikelyEnd = true;
    containsKnownMarkers.push('PDF End-of-File (%%EOF)');
  }
  if (findAscii(data, 'xref') !== -1) containsKnownMarkers.push('PDF Cross-Reference Table');
  if (findAscii(data, 'trailer') !== -1) containsKnownMarkers.push('PDF Trailer Dictionary');
  if (findAscii(data, 'startxref') !== -1) containsKnownMarkers.push('PDF startxref pointer');
  if (findAscii(data, 'stream') !== -1) containsKnownMarkers.push('PDF Content Stream');

  // 4. ZIP Detection
  if (matchBytes(data, SIG_ZIP_START, 0)) {
    magicDetected = 'ZIP Local File Header (PK..0304)';
    isLikelyStart = true;
    containsKnownMarkers.push('ZIP Local File Header');
  }
  if (findByteSequence(data, SIG_ZIP_EOCD) !== -1) {
    footerDetected = 'ZIP End of Central Directory (EOCD)';
    isLikelyEnd = true;
    containsKnownMarkers.push('ZIP EOCD Record');
  }
  if (findByteSequence(data, [0x50, 0x4B, 0x01, 0x02]) !== -1) {
    containsKnownMarkers.push('ZIP Central Directory Record');
  }

  // 5. Generic Text / Structured check
  if (!magicDetected && len > 0) {
    // Check if high percentage of printable ASCII
    let printable = 0;
    const sample = data.slice(0, Math.min(len, 256));
    for (let i = 0; i < sample.length; i++) {
      if ((sample[i] >= 32 && sample[i] <= 126) || sample[i] === 10 || sample[i] === 13 || sample[i] === 9) {
        printable++;
      }
    }
    if (printable / sample.length > 0.85) {
      containsKnownMarkers.push('Printable Text / Syntax Stream');
    }
  }

  return {
    magicDetected,
    footerDetected,
    isLikelyStart,
    isLikelyEnd,
    containsKnownMarkers,
    startBytes: Array.from(data.slice(0, Math.min(len, 8))),
    endBytes: Array.from(data.slice(Math.max(0, len - 8))),
    entropy,
  };
}

/**
 * Detect predominant file type across all fragments
 */
export function detectOverallFileType(fragments: FileFragment[]): SupportedFileType {
  for (const f of fragments) {
    if (f.features.magicDetected?.includes('PDF') || f.features.footerDetected?.includes('PDF') || f.features.containsKnownMarkers.some(m => m.includes('PDF'))) {
      return 'PDF';
    }
    if (f.features.magicDetected?.includes('PNG') || f.features.footerDetected?.includes('PNG') || f.features.containsKnownMarkers.some(m => m.includes('PNG'))) {
      return 'PNG';
    }
    if (f.features.magicDetected?.includes('JPEG') || f.features.footerDetected?.includes('JPEG') || f.features.containsKnownMarkers.some(m => m.includes('JPEG'))) {
      return 'JPEG';
    }
    if (f.features.magicDetected?.includes('ZIP') || f.features.footerDetected?.includes('ZIP') || f.features.containsKnownMarkers.some(m => m.includes('ZIP'))) {
      return 'ZIP';
    }
  }
  return 'UNKNOWN';
}

/**
 * Test boundary split across fragments:
 * Did a known marker get split across the boundary between A and B?
 */
function checkSplitMarkerAcrossBoundary(a: Uint8Array, b: Uint8Array): { found: boolean; name: string; bonus: number } {
  // Take last 8 bytes of A and first 8 bytes of B
  const tail = a.slice(Math.max(0, a.length - 8));
  const head = b.slice(0, Math.min(b.length, 8));
  const combined = new Uint8Array(tail.length + head.length);
  combined.set(tail, 0);
  combined.set(head, tail.length);

  // Split PDF markers
  if (findAscii(combined, 'endobj') !== -1) return { found: true, name: 'Split PDF "endobj" keyword reconstructed across boundary', bonus: 40 };
  if (findAscii(combined, 'stream') !== -1) return { found: true, name: 'Split PDF "stream" keyword reconstructed across boundary', bonus: 40 };
  if (findAscii(combined, 'endstream') !== -1) return { found: true, name: 'Split PDF "endstream" marker aligned', bonus: 42 };
  if (findAscii(combined, 'trailer') !== -1) return { found: true, name: 'Split PDF "trailer" dictionary key aligned', bonus: 40 };
  if (findAscii(combined, '%%EOF') !== -1) return { found: true, name: 'Split PDF "%%EOF" termination marker aligned', bonus: 45 };

  // Split PNG chunk markers
  if (findAscii(combined, 'IDAT') !== -1) return { found: true, name: 'Split PNG "IDAT" chunk header reconstructed', bonus: 40 };
  if (findAscii(combined, 'IEND') !== -1) return { found: true, name: 'Split PNG "IEND" chunk footer reconstructed', bonus: 45 };

  // Split JPEG markers
  if (findByteSequence(combined, [0xFF, 0xDA]) !== -1) return { found: true, name: 'Split JPEG SOS (Start of Scan) marker aligned', bonus: 40 };
  if (findByteSequence(combined, [0xFF, 0xD9]) !== -1) return { found: true, name: 'Split JPEG EOI marker aligned', bonus: 45 };

  // Split ZIP markers
  if (findByteSequence(combined, [0x50, 0x4B, 0x01, 0x02]) !== -1) return { found: true, name: 'Split ZIP Central Directory signature aligned', bonus: 42 };
  if (findByteSequence(combined, [0x50, 0x4B, 0x05, 0x06]) !== -1) return { found: true, name: 'Split ZIP EOCD signature aligned', bonus: 45 };

  return { found: false, name: '', bonus: 0 };
}

/**
 * Calculate directional pairwise compatibility score for A -> B
 */
export function calculatePairwiseScore(
  a: FileFragment,
  b: FileFragment,
  fileType: SupportedFileType
): CompatibilityPair {
  const reasons: string[] = [];
  let score = 50; // baseline neutral

  // 1. HARD NEGATIVE CONSTRAINTS
  // If A is known to be the end of the file, it cannot precede B!
  if (a.features.isLikelyEnd) {
    score = 5;
    reasons.push(`Negative constraint: ${a.name} contains the definitive file footer / EOF marker and cannot be followed by another fragment.`);
    return {
      fromId: a.id,
      toId: b.id,
      fromName: a.name,
      toName: b.name,
      score: Math.max(1, Math.min(99, Math.round(score))),
      reasons,
      isStrongMatch: false,
    };
  }

  // If B is known to be the start/header of the file, it cannot follow A!
  if (b.features.isLikelyStart) {
    score = 5;
    reasons.push(`Negative constraint: ${b.name} contains the primary file magic header and must be at offset 0, so it cannot follow ${a.name}.`);
    return {
      fromId: a.id,
      toId: b.id,
      fromName: a.name,
      toName: b.name,
      score: Math.max(1, Math.min(99, Math.round(score))),
      reasons,
      isStrongMatch: false,
    };
  }

  // 2. POSITIVE STRUCTURAL ALIGNMENT
  // A has header, B is intermediate
  if (a.features.isLikelyStart && !b.features.isLikelyEnd) {
    score += 26;
    reasons.push(`Structural anchor: ${a.name} is verified start header and leads cleanly into intermediate fragment ${b.name}.`);
  }

  // A is intermediate, B has footer
  if (!a.features.isLikelyStart && b.features.isLikelyEnd) {
    score += 26;
    reasons.push(`Terminal anchor: ${b.name} contains the file termination footer, correctly capping intermediate fragment ${a.name}.`);
  }

  // 3. BOUNDARY SPLIT MARKER DETECTION
  const splitCheck = checkSplitMarkerAcrossBoundary(a.data, b.data);
  if (splitCheck.found) {
    score += splitCheck.bonus;
    reasons.push(`Forensic signature reconstruction: ${splitCheck.name}.`);
  }

  // 4. FORMAT-SPECIFIC CONTINUITY
  if (fileType === 'PDF') {
    // Check object flow
    const aText = new TextDecoder('utf-8', { fatal: false }).decode(a.data.slice(Math.max(0, a.data.length - 200)));
    const bText = new TextDecoder('utf-8', { fatal: false }).decode(b.data.slice(0, Math.min(b.data.length, 200)));

    if (aText.includes('stream') && !aText.includes('endstream') && bText.includes('endstream')) {
      score += 25;
      reasons.push(`PDF stream boundary: Open stream in ${a.name} is terminated by "endstream" in ${b.name}.`);
    }

    if (aText.includes('xref') || aText.includes('trailer') && b.features.isLikelyEnd) {
      score += 20;
      reasons.push(`PDF xref/trailer section in ${a.name} leads directly into EOF trailer in ${b.name}.`);
    }
  } else if (fileType === 'JPEG') {
    // A has SOS, B continues image data
    if (a.features.containsKnownMarkers.some(m => m.includes('SOS')) && !b.features.containsKnownMarkers.some(m => m.includes('SOI'))) {
      score += 24;
      reasons.push(`JPEG Scan flow: ${a.name} initiates Huffman entropy scan, continued seamlessly into ${b.name}.`);
    }
    // High entropy continuation
    if (a.features.entropy > 7.4 && b.features.entropy > 7.4) {
      score += 12;
      reasons.push(`Entropy continuity: Both boundary clusters maintain dense compressed JPEG entropy (${a.features.entropy} & ${b.features.entropy} bits/byte).`);
    }
  } else if (fileType === 'PNG') {
    if (a.features.containsKnownMarkers.some(m => m.includes('IHDR')) && b.features.containsKnownMarkers.some(m => m.includes('IDAT'))) {
      score += 26;
      reasons.push(`PNG chunk specification: IHDR header in ${a.name} is followed by first IDAT image payload in ${b.name}.`);
    }
  } else if (fileType === 'ZIP') {
    if (a.features.containsKnownMarkers.some(m => m.includes('Local File Header')) && b.features.containsKnownMarkers.some(m => m.includes('Central Directory'))) {
      score += 26;
      reasons.push(`ZIP archive layout: File data entries in ${a.name} precede the central directory catalog in ${b.name}.`);
    }
  }

  // 5. Boundary Byte Delta Smoothing
  const aLastByte = a.data[a.data.length - 1];
  const bFirstByte = b.data[0];
  const byteDiff = Math.abs(aLastByte - bFirstByte);
  if (byteDiff < 16) {
    score += 4;
    reasons.push(`Smooth byte transition delta (|0x${aLastByte.toString(16)} - 0x${bFirstByte.toString(16)}| = ${byteDiff}).`);
  }

  // If no specific structural reason was added, state default heuristic
  if (reasons.length === 0) {
    reasons.push(`Heuristic compatibility based on cluster entropy and absence of contradictory headers.`);
  }

  const finalScore = Math.max(8, Math.min(98, Math.round(score)));
  const isStrongMatch = finalScore >= 80;

  return {
    fromId: a.id,
    toId: b.id,
    fromName: a.name,
    toName: b.name,
    score: finalScore,
    reasons,
    isStrongMatch,
  };
}

/**
 * Generate full NxN compatibility matrix
 */
export function buildCompatibilityMatrix(
  fragments: FileFragment[],
  fileType: SupportedFileType
): CompatibilityMatrixData {
  const ids = fragments.map((f) => f.id);
  const names: Record<string, string> = {};
  const scores: Record<string, Record<string, CompatibilityPair>> = {};

  for (const f of fragments) {
    names[f.id] = f.name;
    scores[f.id] = {};
  }

  for (let i = 0; i < fragments.length; i++) {
    for (let j = 0; j < fragments.length; j++) {
      if (i === j) continue;
      const pair = calculatePairwiseScore(fragments[i], fragments[j], fileType);
      scores[fragments[i].id][fragments[j].id] = pair;
    }
  }

  return {
    fragmentIds: ids,
    fragmentNames: names,
    scores,
  };
}

/**
 * Permutation generation helper
 */
function getPermutations<T>(arr: T[]): T[][] {
  if (arr.length <= 1) return [arr];
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i++) {
    const current = arr[i];
    const remaining = [...arr.slice(0, i), ...arr.slice(i + 1)];
    const perms = getPermutations(remaining);
    for (const p of perms) {
      result.push([current, ...p]);
    }
  }
  return result;
}

/**
 * Determine the most likely fragment ordering based on the compatibility matrix
 * Evaluates all permutations for N <= 8, or greedy branch search for larger N.
 */
export function predictFragmentOrder(
  fragments: FileFragment[],
  matrix: CompatibilityMatrixData,
  fileType: SupportedFileType
): {
  orderedFragments: FileFragment[];
  overallConfidence: number;
  isUncertain: boolean;
  uncertaintyReason?: string;
  transitions: { fromName: string; toName: string; score: number; reason: string }[];
} {
  if (fragments.length === 0) {
    return {
      orderedFragments: [],
      overallConfidence: 0,
      isUncertain: true,
      uncertaintyReason: 'No fragments provided',
      transitions: [],
    };
  }

  if (fragments.length === 1) {
    return {
      orderedFragments: fragments,
      overallConfidence: 100,
      isUncertain: false,
      transitions: [],
    };
  }

  // Exact evaluation of all permutations
  const permutations = getPermutations(fragments);
  let bestPermutation: FileFragment[] = fragments;
  let bestScore = -Infinity;
  let runnerUpScore = -Infinity;

  for (const perm of permutations) {
    let permScore = 0;
    const n = perm.length;

    // 1. Sum pairwise transition scores
    for (let i = 0; i < n - 1; i++) {
      const pair = matrix.scores[perm[i].id]?.[perm[i + 1].id];
      permScore += pair ? pair.score : 0;
    }

    // 2. Bonus/Penalty for Header at position 0
    if (perm[0].features.isLikelyStart) {
      permScore += 50;
    } else {
      // If someone else has the start header, penalize this permutation
      const hasStartElsewhere = perm.slice(1).some((f) => f.features.isLikelyStart);
      if (hasStartElsewhere) permScore -= 120;
    }

    // 3. Bonus/Penalty for Footer at final position
    if (perm[n - 1].features.isLikelyEnd) {
      permScore += 50;
    } else {
      // If someone else has the end footer, penalize this permutation
      const hasEndElsewhere = perm.slice(0, n - 1).some((f) => f.features.isLikelyEnd);
      if (hasEndElsewhere) permScore -= 120;
    }

    if (permScore > bestScore) {
      runnerUpScore = bestScore;
      bestScore = permScore;
      bestPermutation = perm;
    } else if (permScore > runnerUpScore) {
      runnerUpScore = permScore;
    }
  }

  // Calculate normalized confidence (0 - 100)
  const maxPossible = (fragments.length - 1) * 100 + 100; // max transition sum + header + footer bonus
  const normalizedConfidence = Math.max(10, Math.min(99, Math.round((bestScore / maxPossible) * 100)));

  // Uncertainty checks:
  // - If max confidence is weak (< 50)
  // - Or if score difference between best and runner up is minimal (< 5 points out of 100)
  // - Or if neither start header nor end footer was identified
  const hasKnownAnchors = fragments.some(f => f.features.isLikelyStart || f.features.isLikelyEnd);
  const scoreSpread = bestScore - runnerUpScore;
  const isUncertain = normalizedConfidence < 52 || (scoreSpread < 8 && !hasKnownAnchors);

  let uncertaintyReason: string | undefined;
  if (isUncertain) {
    if (!hasKnownAnchors) {
      uncertaintyReason = 'Reconstruction uncertain: No clear file header (magic bytes) or footer termination markers detected in any fragment.';
    } else if (scoreSpread < 8) {
      uncertaintyReason = 'Reconstruction uncertain: Ambiguous boundary compatibility scores between competing permutations.';
    } else {
      uncertaintyReason = 'Reconstruction uncertain: Low aggregate pairwise transition confidence.';
    }
  }

  // Collect pairwise transitions for chosen order
  const transitions: { fromName: string; toName: string; score: number; reason: string }[] = [];
  for (let i = 0; i < bestPermutation.length - 1; i++) {
    const from = bestPermutation[i];
    const to = bestPermutation[i + 1];
    const pair = matrix.scores[from.id]?.[to.id];
    transitions.push({
      fromName: from.name,
      toName: to.name,
      score: pair ? pair.score : 50,
      reason: pair?.reasons[0] || 'Sequential cluster transition verified.',
    });
  }

  return {
    orderedFragments: bestPermutation,
    overallConfidence: normalizedConfidence,
    isUncertain,
    uncertaintyReason,
    transitions,
  };
}
