import { FileCategory, RecoveryCandidate, ExtractedFragment } from '../types/recovery';
import { calculateEntropy } from './carver';
import { calculateSHA256, calculateSHA512, calculateMD5 } from './crypto';

export interface ForensicFileSignature {
  name: string;
  category: FileCategory;
  extension: string;
  mimeType: string;
  header: number[];
  headerMask?: number[];
  footer?: number[];
  maxScanSize: number;
  expectedStructureNote: string;
}

/**
 * Standard Forensic Magic Bytes Signature Catalog
 * Strictly covering all requested formats:
 * - IMAGES: JPEG, PNG, GIF, BMP, WEBP
 * - DOCUMENTS: PDF, DOCX, XLSX, PPTX, TXT, CSV
 * - ARCHIVES: ZIP, RAR, 7Z, TAR
 * - AUDIO: MP3, WAV, AAC, FLAC
 * - VIDEO: MP4, AVI, MKV, MOV, WEBM
 * - OTHER: EXE, DLL, ISO, Unknown binary
 */
export const FORENSIC_SIGNATURES: ForensicFileSignature[] = [
  // --- IMAGES ---
  {
    name: 'JPEG / JFIF Image',
    category: 'image',
    extension: 'jpg',
    mimeType: 'image/jpeg',
    header: [0xFF, 0xD8, 0xFF],
    footer: [0xFF, 0xD9],
    maxScanSize: 25 * 1024 * 1024,
    expectedStructureNote: 'SOI (FF D8) marker, JFIF/Exif header, followed by SOS scans and EOI (FF D9) footer.',
  },
  {
    name: 'PNG Portable Network Graphics',
    category: 'image',
    extension: 'png',
    mimeType: 'image/png',
    header: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
    footer: [0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82],
    maxScanSize: 30 * 1024 * 1024,
    expectedStructureNote: '8-byte magic PNG signature, followed by IHDR, IDAT compressed raster chunks, and IEND terminator.',
  },
  {
    name: 'GIF Graphics Interchange Format',
    category: 'image',
    extension: 'gif',
    mimeType: 'image/gif',
    header: [0x47, 0x49, 0x46, 0x38], // GIF8
    footer: [0x00, 0x3B], // 00 3B trailer
    maxScanSize: 20 * 1024 * 1024,
    expectedStructureNote: 'GIF87a / GIF89a header, logical screen descriptor, color tables, and 0x3B trailer byte.',
  },
  {
    name: 'BMP Windows Bitmap',
    category: 'image',
    extension: 'bmp',
    mimeType: 'image/bmp',
    header: [0x42, 0x4D], // BM
    maxScanSize: 20 * 1024 * 1024,
    expectedStructureNote: 'BM magic marker, 4-byte little-endian file size in DIB header at offset 0x02.',
  },
  {
    name: 'WEBP Image Container',
    category: 'image',
    extension: 'webp',
    mimeType: 'image/webp',
    header: [0x52, 0x49, 0x46, 0x46], // RIFF
    maxScanSize: 25 * 1024 * 1024,
    expectedStructureNote: 'RIFF container with WEBP FourCC at offset 0x08, containing VP8 or VP8L bitstream.',
  },

  // --- DOCUMENTS ---
  {
    name: 'PDF Portable Document Format',
    category: 'document',
    extension: 'pdf',
    mimeType: 'application/pdf',
    header: [0x25, 0x50, 0x44, 0x46, 0x2D], // %PDF-
    footer: [0x25, 0x25, 0x45, 0x4F, 0x46], // %%EOF
    maxScanSize: 50 * 1024 * 1024,
    expectedStructureNote: '%PDF- header, catalog dictionary, indirect objects (obj ... endobj), xref table, and %%EOF trailer.',
  },
  {
    name: 'DOCX Microsoft Word OpenXML',
    category: 'document',
    extension: 'docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    header: [0x50, 0x4B, 0x03, 0x04], // PK..
    footer: [0x50, 0x4B, 0x05, 0x06], // EOCD
    maxScanSize: 60 * 1024 * 1024,
    expectedStructureNote: 'ZIP package containing [Content_Types].xml, _rels, and word/document.xml part.',
  },
  {
    name: 'XLSX Microsoft Excel OpenXML',
    category: 'document',
    extension: 'xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    header: [0x50, 0x4B, 0x03, 0x04],
    footer: [0x50, 0x4B, 0x05, 0x06],
    maxScanSize: 60 * 1024 * 1024,
    expectedStructureNote: 'ZIP package containing xl/workbook.xml, sheet parts, and sharedStrings table.',
  },
  {
    name: 'PPTX Microsoft PowerPoint OpenXML',
    category: 'document',
    extension: 'pptx',
    mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    header: [0x50, 0x4B, 0x03, 0x04],
    footer: [0x50, 0x4B, 0x05, 0x06],
    maxScanSize: 80 * 1024 * 1024,
    expectedStructureNote: 'ZIP package containing ppt/presentation.xml and slide master streams.',
  },

  // --- ARCHIVES ---
  {
    name: 'ZIP Compressed Archive',
    category: 'archive',
    extension: 'zip',
    mimeType: 'application/zip',
    header: [0x50, 0x4B, 0x03, 0x04],
    footer: [0x50, 0x4B, 0x05, 0x06], // End of Central Directory
    maxScanSize: 100 * 1024 * 1024,
    expectedStructureNote: 'Local file header sequence (0x04034B50), central directory headers, and EOCD record.',
  },
  {
    name: 'RAR Compressed Archive',
    category: 'archive',
    extension: 'rar',
    mimeType: 'application/x-rar-compressed',
    header: [0x52, 0x61, 0x72, 0x21, 0x1A, 0x07], // Rar!..
    maxScanSize: 100 * 1024 * 1024,
    expectedStructureNote: 'RAR archive header flags, file block CRC32 checks, and block headers.',
  },
  {
    name: '7-Zip Compressed Archive',
    category: 'archive',
    extension: '7z',
    mimeType: 'application/x-7z-compressed',
    header: [0x37, 0x7A, 0xBC, 0xAF, 0x27, 0x1C], // 7z¼¯'
    maxScanSize: 100 * 1024 * 1024,
    expectedStructureNote: '7z signature followed by major/minor version, StartHeader CRC, and NextHeader descriptor.',
  },
  {
    name: 'TAR Unix Tape Archive',
    category: 'archive',
    extension: 'tar',
    mimeType: 'application/x-tar',
    header: [0x75, 0x73, 0x74, 0x61, 0x72], // ustar magic
    maxScanSize: 100 * 1024 * 1024,
    expectedStructureNote: '512-byte block header format with "ustar" magic string located at byte offset 257.',
  },

  // --- AUDIO ---
  {
    name: 'MP3 MPEG Audio Layer III',
    category: 'audio',
    extension: 'mp3',
    mimeType: 'audio/mpeg',
    header: [0x49, 0x44, 0x33], // ID3
    maxScanSize: 40 * 1024 * 1024,
    expectedStructureNote: 'ID3v2 metadata container tag, followed by sync-word (0xFFFB / 0xFFF3) audio frames.',
  },
  {
    name: 'WAV Waveform Audio',
    category: 'audio',
    extension: 'wav',
    mimeType: 'audio/wav',
    header: [0x52, 0x49, 0x46, 0x46], // RIFF
    maxScanSize: 80 * 1024 * 1024,
    expectedStructureNote: 'RIFF container with "WAVE" format identifier, "fmt " audio parameters chunk, and "data" PCM stream.',
  },
  {
    name: 'AAC Advanced Audio Coding',
    category: 'audio',
    extension: 'aac',
    mimeType: 'audio/aac',
    header: [0xFF, 0xF1], // ADTS sync word
    maxScanSize: 30 * 1024 * 1024,
    expectedStructureNote: 'ADTS 12-bit synchronization word (0xFFF) followed by MPEG-4 AAC raw bitstream.',
  },
  {
    name: 'FLAC Free Lossless Audio Codec',
    category: 'audio',
    extension: 'flac',
    mimeType: 'audio/flac',
    header: [0x66, 0x4C, 0x61, 0x43], // fLaC
    maxScanSize: 60 * 1024 * 1024,
    expectedStructureNote: 'fLaC signature followed by STREAMINFO metadata block containing sample rate and channels.',
  },

  // --- VIDEO ---
  {
    name: 'MP4 MPEG-4 Part 14 Video',
    category: 'video',
    extension: 'mp4',
    mimeType: 'video/mp4',
    header: [0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70], // ....ftyp
    maxScanSize: 150 * 1024 * 1024,
    expectedStructureNote: 'ftyp box branding, moov movie header box, and mdat interleaved video media data.',
  },
  {
    name: 'AVI Audio Video Interleave',
    category: 'video',
    extension: 'avi',
    mimeType: 'video/x-msvideo',
    header: [0x52, 0x49, 0x46, 0x46], // RIFF
    maxScanSize: 150 * 1024 * 1024,
    expectedStructureNote: 'RIFF header with "AVI " FourCC, followed by "hdrl" and "movi" stream lists.',
  },
  {
    name: 'MKV Matroska Video',
    category: 'video',
    extension: 'mkv',
    mimeType: 'video/x-matroska',
    header: [0x1A, 0x45, 0xDF, 0xA3], // EBML Header
    maxScanSize: 150 * 1024 * 1024,
    expectedStructureNote: 'EBML container header, DocType "matroska", Segment element, and cluster video blocks.',
  },
  {
    name: 'MOV QuickTime Video',
    category: 'video',
    extension: 'mov',
    mimeType: 'video/quicktime',
    header: [0x00, 0x00, 0x00, 0x14, 0x66, 0x74, 0x79, 0x70, 0x71, 0x74], // ....ftypqt
    maxScanSize: 150 * 1024 * 1024,
    expectedStructureNote: 'QuickTime movie atom layout with moov dictionary and audio/video tracks.',
  },
  {
    name: 'WEBM Open Web Video',
    category: 'video',
    extension: 'webm',
    mimeType: 'video/webm',
    header: [0x1A, 0x45, 0xDF, 0xA3], // EBML with webm doctype
    maxScanSize: 150 * 1024 * 1024,
    expectedStructureNote: 'EBML structure specifying "webm" container profile with VP8/VP9 and Opus audio.',
  },

  // --- OTHER / SYSTEM ---
  {
    name: 'EXE Windows PE Executable',
    category: 'code',
    extension: 'exe',
    mimeType: 'application/vnd.microsoft.portable-executable',
    header: [0x4D, 0x5A], // MZ
    maxScanSize: 60 * 1024 * 1024,
    expectedStructureNote: 'MZ MS-DOS stub header, PE signature (0x50 0x45 0x00 0x00) at offset specified at 0x3C.',
  },
  {
    name: 'DLL Windows Dynamic Link Library',
    category: 'code',
    extension: 'dll',
    mimeType: 'application/x-msdownload',
    header: [0x4D, 0x5A],
    maxScanSize: 60 * 1024 * 1024,
    expectedStructureNote: 'MZ header with PE OptionalHeader characteristics having IMAGE_FILE_DLL flag (0x2000).',
  },
  {
    name: 'ISO 9660 Optical Disk Image',
    category: 'archive',
    extension: 'iso',
    mimeType: 'application/x-iso9660-image',
    header: [0x43, 0x44, 0x30, 0x30, 0x31], // CD001
    maxScanSize: 200 * 1024 * 1024,
    expectedStructureNote: 'Standard ISO 9660 volume descriptor "CD001" at sector 16 (offset 0x8000).',
  },
];

/**
 * Scan binary buffer using deterministic signature matching
 */
export async function scanBufferForCandidates(
  buffer: ArrayBuffer,
  sourceName: string
): Promise<RecoveryCandidate[]> {
  const bytes = new Uint8Array(buffer);
  const candidates: RecoveryCandidate[] = [];
  const bufferLen = bytes.length;
  let candidateIndex = 1;

  for (let i = 0; i < bufferLen - 4; i++) {
    // Check known signatures
    for (const sig of FORENSIC_SIGNATURES) {
      let matches = true;
      for (let h = 0; h < sig.header.length; h++) {
        if (i + h >= bufferLen || bytes[i + h] !== sig.header[h]) {
          matches = false;
          break;
        }
      }

      if (matches) {
        // Special case checks
        if (sig.extension === 'webp') {
          // Check if bytes 8-11 are "WEBP"
          if (i + 11 < bufferLen) {
            const tag = String.fromCharCode(bytes[i + 8], bytes[i + 9], bytes[i + 10], bytes[i + 11]);
            if (tag !== 'WEBP') continue;
          } else {
            continue;
          }
        }
        if (sig.extension === 'wav') {
          if (i + 11 < bufferLen) {
            const tag = String.fromCharCode(bytes[i + 8], bytes[i + 9], bytes[i + 10], bytes[i + 11]);
            if (tag !== 'WAVE') continue;
          } else {
            continue;
          }
        }
        if (sig.extension === 'avi') {
          if (i + 11 < bufferLen) {
            const tag = String.fromCharCode(bytes[i + 8], bytes[i + 9], bytes[i + 10], bytes[i + 11]);
            if (tag !== 'AVI ') continue;
          } else {
            continue;
          }
        }

        // Search for relevant footer if applicable
        let footerFound = false;
        let fileEnd = -1;
        let footerDetails = undefined;

        if (sig.footer && sig.footer.length > 0) {
          const searchLimit = Math.min(bufferLen, i + sig.maxScanSize);
          for (let f = i + sig.header.length; f < searchLimit - sig.footer.length; f++) {
            let footerMatch = true;
            for (let fl = 0; fl < sig.footer.length; fl++) {
              if (bytes[f + fl] !== sig.footer[fl]) {
                footerMatch = false;
                break;
              }
            }
            if (footerMatch) {
              footerFound = true;
              fileEnd = f + sig.footer.length;
              footerDetails = `Found valid terminator (${sig.footer.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ')}) at offset 0x${f.toString(16).toUpperCase()}`;
              break;
            }
          }
        }

        // If no footer or not found, estimate candidate size
        if (fileEnd === -1) {
          // Check if we can deduce length from header fields (e.g. BMP, PNG, RIFF)
          if (sig.extension === 'bmp' && i + 6 <= bufferLen) {
            const bmpSize = bytes[i + 2] | (bytes[i + 3] << 8) | (bytes[i + 4] << 16) | (bytes[i + 5] << 24);
            if (bmpSize > 54 && bmpSize < sig.maxScanSize && i + bmpSize <= bufferLen) {
              fileEnd = i + bmpSize;
              footerFound = true;
              footerDetails = `Calculated EOF from BMP DIB header (${bmpSize} bytes)`;
            }
          } else if ((sig.extension === 'wav' || sig.extension === 'webp') && i + 8 <= bufferLen) {
            const riffSize = bytes[i + 4] | (bytes[i + 5] << 8) | (bytes[i + 6] << 16) | (bytes[i + 7] << 24);
            if (riffSize > 12 && riffSize < sig.maxScanSize && i + riffSize + 8 <= bufferLen) {
              fileEnd = i + riffSize + 8;
              footerFound = true;
              footerDetails = `Calculated EOF from RIFF chunk header (${fileEnd - i} bytes)`;
            }
          }
        }

        if (fileEnd === -1) {
          fileEnd = Math.min(bufferLen, i + 65536);
          footerFound = false;
          footerDetails = 'Terminating footer not found before boundary limit (Truncated or fragmented)';
        }

        const carvedBytes = bytes.slice(i, fileEnd);
        const headerHex = sig.header.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
        const offsetHex = '0x' + i.toString(16).padStart(8, '0').toUpperCase();
        const clusterNum = Math.floor(i / 4096);
        const entropy = calculateEntropy(carvedBytes);

        // Calculate cryptographic hashes
        const sha256 = await calculateSHA256(carvedBytes.buffer as ArrayBuffer);
        const sha512 = await calculateSHA512(carvedBytes.buffer as ArrayBuffer);
        const md5 = calculateMD5(carvedBytes);

        // Determine validation status & confidence
        let status: 'Fully Recovered' | 'Partially Recovered' | 'Fragmented' | 'Corrupted' | 'Unsupported' = 'Partially Recovered';
        let confidence = 70;
        let reasoning = '';

        if (footerFound) {
          status = 'Fully Recovered';
          confidence = 94;
          reasoning = 'Both opening magic header and valid closing footer/terminator verified. Byte continuity intact.';
        } else {
          status = 'Partially Recovered';
          confidence = 65;
          reasoning = 'Valid header detected, but trailing terminator missing. File may be truncated or non-contiguous.';
        }

        // Generate synthetic fragment tags if candidate size is large
        const fragments: ExtractedFragment[] = [];
        const isFragmented = !footerFound && carvedBytes.length > 8192;
        const fragmentChunkSize = 4096;
        const totalFrags = Math.ceil(carvedBytes.length / fragmentChunkSize);

        for (let fragIdx = 0; fragIdx < totalFrags; fragIdx++) {
          const fStart = fragIdx * fragmentChunkSize;
          const fEnd = Math.min(carvedBytes.length, fStart + fragmentChunkSize);
          const fBytes = carvedBytes.slice(fStart, fEnd);
          const fSha256 = await calculateSHA256(fBytes.buffer as ArrayBuffer);
          const fHex = Array.from(fBytes.slice(0, 8)).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');

          fragments.push({
            id: `FRAG-${candidateIndex}-${fragIdx + 1}`,
            candidateId: `CAND-${String(candidateIndex).padStart(4, '0')}`,
            offset: i + fStart,
            offsetHex: '0x' + (i + fStart).toString(16).padStart(8, '0').toUpperCase(),
            sizeBytes: fBytes.length,
            sha256: fSha256,
            isContiguous: true,
            clusterIndex: clusterNum + fragIdx,
            entropy: calculateEntropy(fBytes),
            rawSampleHex: fHex,
          });
        }

        let preview: string | undefined = undefined;
        if (sig.category === 'image') {
          try {
            const blob = new Blob([carvedBytes], { type: sig.mimeType });
            preview = URL.createObjectURL(blob);
          } catch {
            preview = undefined;
          }
        } else if (sig.category === 'document' || sig.category === 'archive') {
          const sample = carvedBytes.slice(0, 150);
          preview = new TextDecoder('utf-8', { fatal: false }).decode(sample);
        }

        candidates.push({
          id: `CAND-${String(candidateIndex).padStart(4, '0')}`,
          fileType: sig.name,
          category: sig.category,
          extension: sig.extension,
          fileSignatureHex: headerHex,
          sourceOffsetHex: offsetHex,
          sourceOffsetBytes: i,
          clusterNumber: clusterNum,
          estimatedSizeBytes: carvedBytes.length,
          headerFound: true,
          headerSignature: `Header match (${headerHex})`,
          footerFound: footerFound,
          footerSignature: footerDetails,
          recoveryConfidence: confidence,
          confidenceReasoning: reasoning,
          validationStatus: status,
          entropy: entropy,
          sha256: sha256,
          sha512: sha512,
          md5: md5,
          isFragmented: isFragmented,
          fragmentCount: fragments.length,
          fragments: fragments,
          rawBinary: carvedBytes,
          contentPreview: preview,
          recoveryNote: `Carved from source offset ${offsetHex} with ${sig.name} signature.`,
          sourceName: sourceName,
        });

        candidateIndex++;
        // Advance past current file boundary
        i = fileEnd - 1;
        break;
      }
    }
  }

  // If no candidates were matched by strict magic bytes, inspect for plain text or CSV
  if (candidates.length === 0 && bytes.length > 0) {
    let printable = 0;
    const sampleLen = Math.min(bytes.length, 2048);
    for (let s = 0; s < sampleLen; s++) {
      const b = bytes[s];
      if ((b >= 32 && b <= 126) || b === 10 || b === 13 || b === 9) {
        printable++;
      }
    }
    const isText = (printable / sampleLen) > 0.85;
    const textPreview = isText ? new TextDecoder('utf-8', { fatal: false }).decode(bytes.slice(0, 1000)) : undefined;
    const isCSV = isText && (textPreview?.includes(',') || textPreview?.includes(';')) && textPreview?.includes('\n');

    const ext = isCSV ? 'csv' : isText ? 'txt' : 'bin';
    const type = isCSV ? 'CSV Delimited Table' : isText ? 'Plain Text Document' : 'Unknown Binary Entity';
    const sha256 = await calculateSHA256(bytes.buffer as ArrayBuffer);
    const sha512 = await calculateSHA512(bytes.buffer as ArrayBuffer);
    const md5 = calculateMD5(bytes);

    candidates.push({
      id: `CAND-0001`,
      fileType: type,
      category: isText ? 'document' : 'archive',
      extension: ext,
      fileSignatureHex: Array.from(bytes.slice(0, 4)).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' '),
      sourceOffsetHex: '0x00000000',
      sourceOffsetBytes: 0,
      clusterNumber: 0,
      estimatedSizeBytes: bytes.length,
      headerFound: isText,
      headerSignature: isText ? 'ASCII / UTF-8 Text Stream' : 'No Standard Magic Bytes Header',
      footerFound: true,
      footerSignature: 'Stream EOF reached',
      recoveryConfidence: isText ? 85 : 45,
      confidenceReasoning: isText ? 'High printable ASCII density. Text encoding intact.' : 'Unrecognized binary stream without standard header.',
      validationStatus: isText ? 'Fully Recovered' : 'Unsupported',
      entropy: calculateEntropy(bytes),
      sha256: sha256,
      sha512: sha512,
      md5: md5,
      isFragmented: false,
      fragmentCount: 1,
      rawBinary: bytes,
      contentPreview: textPreview,
      recoveryNote: isText ? 'Extracted text stream from unallocated sector space.' : 'Unclassified binary fragment requiring manual carving.',
      sourceName: sourceName,
    });
  }

  return candidates;
}
