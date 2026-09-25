import JSZip from 'jszip';
import { calculateSha256, calculateSha512, calculateMd5, calculateBufferEntropy, calculateBlockEntropy } from './crypto';
import { FileMetadata } from '../types/integrity';

export interface IntegrityPresetCase {
  id: string;
  title: string;
  badge: string;
  description: string;
  recoveredFile: FileMetadata;
  referenceFile?: FileMetadata;
}

export async function generateIntegrityPresets(): Promise<IntegrityPresetCase[]> {
  // 1. Complete Valid File: 1x1 Transparent or Colorful PNG
  // Genuine PNG binary bytes
  const validPngBytes = new Uint8Array([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // Signature
    0x00, 0x00, 0x00, 0x0d, // IHDR length (13)
    0x49, 0x48, 0x44, 0x52, // IHDR
    0x00, 0x00, 0x00, 0x10, // width 16
    0x00, 0x00, 0x00, 0x10, // height 16
    0x08, 0x06, 0x00, 0x00, 0x00, // 8-bit RGBA
    0x1f, 0x3d, 0x9f, 0x8a, // CRC
    0x00, 0x00, 0x00, 0x1f, // IDAT length (31)
    0x49, 0x44, 0x41, 0x54, // IDAT
    0x78, 0x9c, 0x63, 0x60, 0x60, 0xf8, 0x0f, 0x00, 0x01, 0x01, 0x01, 0x00, 0x18, 0xdd, 0x8d, 0xb5,
    0x30, 0x40, 0x00, 0x00, 0x00, 0xff, 0xff, 0x03, 0x00, 0x0c, 0x22, 0x02, 0x85, 0x11, 0xd9,
    0x00, 0x00, 0x00, 0x00, // IEND length (0)
    0x49, 0x45, 0x4e, 0x44, // IEND
    0xae, 0x42, 0x60, 0x82, // CRC
  ]);

  const case1Recovered = await buildFileMetadata('confidential_evidence.png', validPngBytes.slice(), 'image/png');
  const case1Reference = await buildFileMetadata('confidential_evidence.png', validPngBytes.slice(), 'image/png');

  // 2. Structurally Valid File (No Reference Available): Valid JPEG with complete headers & EOI
  const validJpegBytes = new Uint8Array([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
    0x00, 0x01, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43, 0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08,
    0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0a, 0x0c, 0x14, 0x0d, 0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12,
    0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1d, 0x1a, 0x1c, 0x1c, 0x20, 0x24, 0x2e, 0x27, 0x20,
    0x22, 0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29, 0x2c, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1f, 0x27,
    0x39, 0x3d, 0x38, 0x32, 0x3c, 0x2e, 0x33, 0x34, 0x32, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x20,
    0x00, 0x20, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4, 0x00, 0x1f, 0x00, 0x00, 0x01, 0x05, 0x01, 0x01,
    0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04,
    0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f,
    0x00, 0xbf, 0x93, 0x2c, 0x48, 0x21, 0x8a, 0x4f, 0x21, 0x9b, 0xa4, 0x10, 0x9f, 0x23, 0x4a, 0x82,
    0x19, 0x8a, 0x41, 0x09, 0xfa, 0x31, 0x09, 0xf2, 0x34, 0x8a, 0x21, 0x09, 0xfa, 0x31, 0x09, 0xf2,
    0xff, 0xd9, // EOI
  ]);
  const case2Recovered = await buildFileMetadata('recovered_incident_photo.jpg', validJpegBytes, 'image/jpeg');

  // 3. Partially Recovered File: PDF Truncated midway (missing %%EOF and xref trailer)
  const truncatedPdfText = `%PDF-1.5
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>
endobj
4 0 obj
<< /Length 120 >>
stream
BT
/F1 24 Tf
100 700 Td
(SECURE AUDIT DISCOVERY LOG - PARTIAL RECOVERY) Tj
ET
endstream
endobj
% ERROR: Carving cut off before cross-reference table and %%EOF trailer marker!
`;
  const truncatedPdfBytes = new TextEncoder().encode(truncatedPdfText);
  const case3Recovered = await buildFileMetadata('subpoena_financials_truncated.pdf', truncatedPdfBytes, 'application/pdf');

  // 4. Corrupted File: Broken ZIP archive (local header corrupted / destroyed EOCD)
  const zip = new JSZip();
  zip.file('invoice_2026.csv', 'Date,Vendor,Amount,Status\n2026-09-01,CloudServices,4200.00,Approved\n2026-09-12,DatacenterCo,18500.00,Pending');
  zip.file('audit_notes.txt', 'Integrity check verification required.');
  const fullZipBuffer = await zip.generateAsync({ type: 'uint8array' });
  // Corrupt the ZIP signature and truncate central directory
  const corruptedZipBytes = new Uint8Array(fullZipBuffer.length - 24);
  corruptedZipBytes.set(fullZipBuffer.subarray(0, corruptedZipBytes.length));
  // Overwrite initial magic bytes 0x50 0x4B with 0x00 0x00 0xDE 0xAD
  corruptedZipBytes[0] = 0x00;
  corruptedZipBytes[1] = 0x00;
  corruptedZipBytes[2] = 0xde;
  corruptedZipBytes[3] = 0xad;
  const case4Recovered = await buildFileMetadata('carved_archive_corrupted.zip', corruptedZipBytes, 'application/zip');

  // 5. Modified / Hash Mismatch: Reference file vs Recovered file with 4 modified bytes inside payload
  const pristineDocText = `=== DIGITAL EVIDENCE EXHIBIT #9042 ===
INVESTIGATION: PROJECT ARCHON
STATUS: VERIFIED
HASH CLASSIFICATION: CONFIDENTIAL
AUTHENTICATION HASH: 77a84e9014b2d398f41160a2839210
SECTOR OFFSET: 0x004F1000
TIMESTAMP: 2026-09-25T07:49:00Z
CONTENT:
Subject confirmed transfer of encrypted partition image to secondary offline vault.
Chain of custody maintained by forensic unit.
=== END OF REPORT ===
`;
  const modifiedDocText = pristineDocText.replace('STATUS: VERIFIED', 'STATUS: TAMPERED');
  const pristineBytes = new TextEncoder().encode(pristineDocText);
  const modifiedBytes = new TextEncoder().encode(modifiedDocText);

  const case5Reference = await buildFileMetadata('exhibit_9042_baseline.txt', pristineBytes, 'text/plain');
  const case5Recovered = await buildFileMetadata('exhibit_9042_recovered.txt', modifiedBytes, 'text/plain');

  return [
    {
      id: 'preset_valid_match',
      title: 'Complete Valid File (Byte Match)',
      badge: '100% Identical',
      description: 'Reference copy provided. Hashes match 100% byte-for-byte on SHA-256 and SHA-512.',
      recoveredFile: case1Recovered,
      referenceFile: case1Reference,
    },
    {
      id: 'preset_struct_valid',
      title: 'Structurally Valid (No Reference)',
      badge: 'Structurally Validated',
      description: 'No reference available. Passes signature, frame hierarchy, markers, and EOI footer checks.',
      recoveredFile: case2Recovered,
    },
    {
      id: 'preset_partial',
      title: 'Partially Recovered File',
      badge: 'Truncated Stream',
      description: 'PDF recovered with missing %%EOF footer and truncated xref table.',
      recoveredFile: case3Recovered,
    },
    {
      id: 'preset_corrupted',
      title: 'Corrupted File',
      badge: 'Broken Header',
      description: 'ZIP archive with corrupted magic bytes and destroyed End of Central Directory.',
      recoveredFile: case4Recovered,
    },
    {
      id: 'preset_mismatch',
      title: 'Modified / Hash Mismatch',
      badge: 'Byte Discrepancy',
      description: 'Recovered file differs by altered payload bytes against the reference baseline.',
      recoveredFile: case5Recovered,
      referenceFile: case5Reference,
    },
  ];
}

async function buildFileMetadata(name: string, data: Uint8Array, mimeType: string): Promise<FileMetadata> {
  const sha256 = await calculateSha256(data);
  const sha512 = await calculateSha512(data);
  const md5 = calculateMd5(data);
  const entropy = calculateBufferEntropy(data);
  const entropyBlocks = calculateBlockEntropy(data, 40);
  const ext = name.split('.').pop()?.toLowerCase() || '';

  return {
    name,
    size: data.length,
    type: ext.toUpperCase(),
    mimeType,
    extension: ext,
    lastModified: Date.now() - 3600000 * 2,
    lastModifiedDate: new Date(Date.now() - 3600000 * 2).toISOString(),
    sha256,
    sha512,
    md5,
    entropy,
    entropyBlocks,
    data,
  };
}
