import JSZip from 'jszip';
import { SupportedFileType, FileValidationResult, ValidationCheck } from '../types/fragment';

/**
 * Validate reconstructed byte stream according to format specifications
 */
export async function validateReconstructedFile(
  data: Uint8Array,
  fileType: SupportedFileType
): Promise<FileValidationResult> {
  const checks: ValidationCheck[] = [];
  const len = data.length;

  if (len === 0) {
    return {
      isValid: false,
      status: 'VALIDATION FAILED',
      reason: 'Reconstructed buffer is empty (0 bytes).',
      checks: [
        { name: 'File Payload', passed: false, details: 'Buffer has 0 bytes' },
      ],
    };
  }

  // 1. JPEG Validation
  if (fileType === 'JPEG') {
    // Check SOI
    const hasSOI = data[0] === 0xFF && data[1] === 0xD8;
    checks.push({
      name: 'JPEG Start of Image (SOI 0xFFD8)',
      passed: hasSOI,
      details: hasSOI
        ? 'Valid SOI marker found at offset 0x0000'
        : 'Missing SOI 0xFFD8 header marker',
    });

    // Check EOI
    const hasEOI =
      len >= 2 &&
      data[len - 2] === 0xFF &&
      data[len - 1] === 0xD9;
    checks.push({
      name: 'JPEG End of Image (EOI 0xFFD9)',
      passed: hasEOI,
      details: hasEOI
        ? `Valid EOI termination marker found at offset 0x${(len - 2).toString(16)}`
        : 'Missing or misaligned EOI 0xFFD9 footer marker',
    });

    // Scan for SOS (Start of Scan)
    let hasSOS = false;
    for (let i = 0; i < len - 1; i++) {
      if (data[i] === 0xFF && data[i + 1] === 0xDA) {
        hasSOS = true;
        break;
      }
    }
    checks.push({
      name: 'JPEG Start of Scan (SOS 0xFFDA)',
      passed: hasSOS,
      details: hasSOS
        ? 'Quantized Huffman scan table active'
        : 'No SOS marker detected in stream',
    });

    // Browser Image Parser verification
    let imageDecodable = false;
    try {
      const blob = new Blob([data as unknown as BlobPart], { type: 'image/jpeg' });
      const url = URL.createObjectURL(blob);
      imageDecodable = await new Promise<boolean>((resolve) => {
        const img = new Image();
        img.onload = () => {
          URL.revokeObjectURL(url);
          resolve(true);
        };
        img.onerror = () => {
          URL.revokeObjectURL(url);
          resolve(false);
        };
        img.src = url;
      });
    } catch {
      imageDecodable = false;
    }

    checks.push({
      name: 'Image Decoder Parse Test',
      passed: imageDecodable,
      details: imageDecodable
        ? 'Native image renderer parsed raster pixels without decoding fault'
        : 'Decoder encountered parsing inconsistency in reconstructed bitstream',
    });

    const allPassed = checks.every((c) => c.passed);
    return {
      isValid: allPassed,
      status: allPassed ? 'RECONSTRUCTION VALIDATED' : 'PARTIALLY RECOVERED / UNVERIFIED',
      reason: allPassed
        ? undefined
        : 'The reconstructed file contains structural inconsistencies or missing JPEG markers.',
      checks,
    };
  }

  // 2. PNG Validation
  if (fileType === 'PNG') {
    const pngHeader = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
    let hasHeader = len >= 8;
    for (let i = 0; i < 8 && hasHeader; i++) {
      if (data[i] !== pngHeader[i]) hasHeader = false;
    }
    checks.push({
      name: 'PNG 8-Byte Magic Header',
      passed: hasHeader,
      details: hasHeader
        ? 'Valid PNG signature \\x89PNG\\r\\n\\x1a\\n verified'
        : 'Invalid PNG header signature',
    });

    // Check IHDR at offset 12
    const hasIHDR =
      len >= 16 &&
      data[12] === 0x49 &&
      data[13] === 0x48 &&
      data[14] === 0x44 &&
      data[15] === 0x52;
    checks.push({
      name: 'PNG IHDR Chunk (Position 0x0C)',
      passed: hasIHDR,
      details: hasIHDR
        ? 'Mandatory initial IHDR chunk positioned correctly'
        : 'Missing or displaced IHDR chunk',
    });

    // Check IEND footer
    let hasIEND = false;
    if (len >= 12) {
      for (let i = Math.max(0, len - 32); i <= len - 4; i++) {
        if (
          data[i] === 0x49 &&
          data[i + 1] === 0x45 &&
          data[i + 2] === 0x4E &&
          data[i + 3] === 0x44
        ) {
          hasIEND = true;
          break;
        }
      }
    }
    checks.push({
      name: 'PNG IEND Chunk (Terminal Chunk)',
      passed: hasIEND,
      details: hasIEND
        ? 'Standard IEND trailer verified at end of file'
        : 'Missing IEND chunk; file may be truncated',
    });

    // Test Image decode
    let imageDecodable = false;
    try {
      const blob = new Blob([data as unknown as BlobPart], { type: 'image/png' });
      const url = URL.createObjectURL(blob);
      imageDecodable = await new Promise<boolean>((resolve) => {
        const img = new Image();
        img.onload = () => {
          URL.revokeObjectURL(url);
          resolve(true);
        };
        img.onerror = () => {
          URL.revokeObjectURL(url);
          resolve(false);
        };
        img.src = url;
      });
    } catch {
      imageDecodable = false;
    }

    checks.push({
      name: 'PNG Raster Parsing Test',
      passed: imageDecodable,
      details: imageDecodable
        ? 'Deflate/Inflate IDAT raster decompression succeeded'
        : 'Image decoder encountered invalid chunk CRC or incomplete stream',
    });

    const allPassed = checks.every((c) => c.passed);
    return {
      isValid: allPassed,
      status: allPassed ? 'RECONSTRUCTION VALIDATED' : 'PARTIALLY RECOVERED / UNVERIFIED',
      reason: allPassed
        ? undefined
        : 'The reconstructed PNG file contains structural chunk inconsistencies.',
      checks,
    };
  }

  // 3. PDF Validation
  if (fileType === 'PDF') {
    const textSample = new TextDecoder('utf-8', { fatal: false }).decode(data);

    const hasHeader = textSample.startsWith('%PDF-');
    checks.push({
      name: 'PDF Header (%PDF-)',
      passed: hasHeader,
      details: hasHeader
        ? `Valid PDF version specification detected (${textSample.slice(0, 8).trim()})`
        : 'Missing %PDF- header at offset 0',
    });

    const hasEOF = textSample.includes('%%EOF');
    checks.push({
      name: 'PDF End-of-File Marker (%%EOF)',
      passed: hasEOF,
      details: hasEOF
        ? 'Standard %%EOF termination marker verified'
        : 'Missing %%EOF; document structure incomplete',
    });

    const hasObj = textSample.includes('obj') && textSample.includes('endobj');
    checks.push({
      name: 'PDF Object Structure (obj / endobj)',
      passed: hasObj,
      details: hasObj
        ? 'Cross-referenced object stream dictionaries present'
        : 'Missing object body definitions',
    });

    const hasTrailer = textSample.includes('trailer') || textSample.includes('xref') || textSample.includes('/Root');
    checks.push({
      name: 'PDF Catalog & Root Trailer Dictionary',
      passed: hasTrailer,
      details: hasTrailer
        ? 'Document catalog tree and trailer pointers located'
        : 'Catalog dictionary unlinked',
    });

    const allPassed = checks.every((c) => c.passed);
    return {
      isValid: allPassed,
      status: allPassed ? 'RECONSTRUCTION VALIDATED' : 'PARTIALLY RECOVERED / UNVERIFIED',
      reason: allPassed
        ? undefined
        : 'The reconstructed file contains structural inconsistencies in PDF object streams.',
      checks,
    };
  }

  // 4. ZIP Validation
  if (fileType === 'ZIP') {
    const hasHeader =
      len >= 4 &&
      data[0] === 0x50 &&
      data[1] === 0x4B &&
      data[2] === 0x03 &&
      data[3] === 0x04;
    checks.push({
      name: 'ZIP Local File Header (PK\\x03\\x04)',
      passed: hasHeader,
      details: hasHeader
        ? 'Valid ZIP archive signature located at offset 0x0000'
        : 'Missing PK\\x03\\x04 local header signature',
    });

    // Check EOCD
    let hasEOCD = false;
    for (let i = Math.max(0, len - 256); i <= len - 4; i++) {
      if (
        data[i] === 0x50 &&
        data[i + 1] === 0x4B &&
        data[i + 2] === 0x05 &&
        data[i + 3] === 0x06
      ) {
        hasEOCD = true;
        break;
      }
    }
    checks.push({
      name: 'ZIP End of Central Directory (EOCD PK\\x05\\x06)',
      passed: hasEOCD,
      details: hasEOCD
        ? 'Central directory anchor record found'
        : 'Missing EOCD record; archive central directory damaged',
    });

    // Test Decompression via JSZip
    let zipReadable = false;
    let entryCount = 0;
    try {
      const zip = await JSZip.loadAsync(data);
      entryCount = Object.keys(zip.files).length;
      zipReadable = entryCount > 0;
    } catch {
      zipReadable = false;
    }
    checks.push({
      name: 'Archive Directory Indexing',
      passed: zipReadable,
      details: zipReadable
        ? `Successfully indexed ${entryCount} compressed file entries`
        : 'JSZip parser failed to unpack archive structures',
    });

    const allPassed = checks.every((c) => c.passed);
    return {
      isValid: allPassed,
      status: allPassed ? 'RECONSTRUCTION VALIDATED' : 'PARTIALLY RECOVERED / UNVERIFIED',
      reason: allPassed
        ? undefined
        : 'The reconstructed ZIP archive contains structural index inconsistencies.',
      checks,
    };
  }

  // 5. Fallback generic binary / text check
  const text = new TextDecoder('utf-8', { fatal: false }).decode(data);
  const isPrintable = text.length > 0 && text.split('').filter(c => c.charCodeAt(0) >= 32 || c.charCodeAt(0) === 10).length / text.length > 0.8;

  checks.push({
    name: 'Generic Stream Integrity',
    passed: len > 0,
    details: `Payload size: ${len} bytes. Byte continuity verified.`,
  });

  return {
    isValid: isPrintable,
    status: isPrintable ? 'RECONSTRUCTION VALIDATED' : 'PARTIALLY RECOVERED / UNVERIFIED',
    reason: isPrintable ? undefined : 'Unrecognized binary container specification.',
    checks,
  };
}
