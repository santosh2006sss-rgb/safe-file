import { FileFragment } from '../types/fragment';
import { calculateSha256, bytesToHex } from './crypto';
import { extractFragmentFeatures } from './fragmentOrdering';

/**
 * Creates a valid standalone JPEG image binary
 */
function createDemoJpeg(): Uint8Array {
  // 1x1 or small valid JPEG image with JFIF header, DQT, SOF0, DHT, SOS and EOI
  const jpegBytes = new Uint8Array([
    // SOI
    0xFF, 0xD8,
    // APP0 (JFIF)
    0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x60, 0x00, 0x60, 0x00, 0x00,
    // DQT (Quantization Table)
    0xFF, 0xDB, 0x00, 0x43, 0x00,
    0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0A, 0x0C, 0x14,
    0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12, 0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A,
    0x1C, 0x1C, 0x20, 0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29, 0x2C,
    0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32, 0x3C, 0x2E, 0x33, 0x34, 0x32,
    // SOF0 (Baseline DCT 16x16)
    0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x10, 0x00, 0x10, 0x01, 0x01, 0x11, 0x00,
    // DHT (Huffman Table)
    0xFF, 0xC4, 0x00, 0x1F, 0x00, 0x00, 0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B,
    // SOS (Start of Scan)
    0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3F, 0x00,
    // Entropy coded image scan bytes
    0x7F, 0x00, 0x94, 0xAD, 0x28, 0xA2, 0x8A, 0x00, 0x28, 0xA2, 0x8A, 0x00,
    0xF4, 0x51, 0x45, 0x14, 0x00, 0x51, 0x45, 0x14, 0x00,
    // EOI
    0xFF, 0xD9,
  ]);
  return jpegBytes;
}

/**
 * Creates a valid standalone PDF document binary
 */
function createDemoPdf(): Uint8Array {
  const pdfString = `%PDF-1.4
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
<< /Length 174 >>
stream
BT
/F1 18 Tf
50 720 Td
(CYBERSECURITY FORENSICS HACKATHON 2026) Tj
0 -30 Td
(Evidence Document: Reconstructed Stream #AF-9921) Tj
0 -25 Td
(Deterministic Carving & Verification Successful.) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000212 00000 n 
trailer
<< /Size 5 /Root 1 0 R >>
startxref
440
%%EOF`;
  return new TextEncoder().encode(pdfString);
}

/**
 * Creates a valid standalone PNG graphic binary
 */
function createDemoPng(): Uint8Array {
  return new Uint8Array([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG Magic Header
    // IHDR chunk (16x16 RGBA)
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x00, 0x10, 0x00, 0x00, 0x00, 0x10,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0xF3, 0xFF, 0x61,
    // IDAT chunk (compressed scan lines)
    0x00, 0x00, 0x00, 0x1B, 0x49, 0x44, 0x41, 0x54,
    0x78, 0x9C, 0x63, 0x60, 0x18, 0x05, 0xA3, 0x60,
    0x14, 0x8C, 0x82, 0x51, 0x30, 0x28, 0x18, 0x85,
    0x42, 0x60, 0x50, 0x30, 0x0A, 0x00, 0x00, 0x54,
    0x20, 0x01, 0x21, 0x00, 0x1D, 0xF4, 0x1C, 0x4D,
    // IEND chunk
    0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82,
  ]);
}

export type DemoPreset = 'jpeg' | 'pdf' | 'png';

/**
 * Generate a demo scenario with 3 fragments divided and shuffled randomly
 */
export async function generateDemoFragments(preset: DemoPreset = 'pdf'): Promise<{
  originalFile: {
    name: string;
    bytes: Uint8Array;
    sha256: string;
    type: string;
  };
  shuffledFragments: FileFragment[];
  expectedOrderNames: string[];
}> {
  let fileBytes: Uint8Array;
  let filename: string;
  let fileType: string;

  if (preset === 'jpeg') {
    fileBytes = createDemoJpeg();
    filename = 'evidence_photo.jpg';
    fileType = 'JPEG';
  } else if (preset === 'png') {
    fileBytes = createDemoPng();
    filename = 'forensic_badge.png';
    fileType = 'PNG';
  } else {
    fileBytes = createDemoPdf();
    filename = 'confidential_report.pdf';
    fileType = 'PDF';
  }

  const originalSha256 = await calculateSha256(fileBytes);
  const totalLength = fileBytes.length;

  // Split into 3 logical fragments
  // Fragment 1: 0 -> split1 (contains Header)
  // Fragment 2: split1 -> split2 (middle body)
  // Fragment 3: split2 -> end (contains Footer)
  const split1 = Math.floor(totalLength * 0.35);
  const split2 = Math.floor(totalLength * 0.72);

  const rawFrag1 = fileBytes.slice(0, split1);
  const rawFrag2 = fileBytes.slice(split1, split2);
  const rawFrag3 = fileBytes.slice(split2);

  // Build the 3 original fragments
  const fragA: FileFragment = {
    id: 'frag_A_' + Date.now(),
    name: 'fragment_A.bin',
    size: rawFrag1.length,
    data: rawFrag1,
    sha256: await calculateSha256(rawFrag1),
    uploadTimestamp: Date.now() - 3000,
    hexSample: {
      start: bytesToHex(rawFrag1.slice(0, 16)),
      end: bytesToHex(rawFrag1.slice(Math.max(0, rawFrag1.length - 16))),
    },
    features: extractFragmentFeatures(rawFrag1),
  };

  const fragB: FileFragment = {
    id: 'frag_B_' + Date.now(),
    name: 'fragment_B.bin',
    size: rawFrag2.length,
    data: rawFrag2,
    sha256: await calculateSha256(rawFrag2),
    uploadTimestamp: Date.now() - 2000,
    hexSample: {
      start: bytesToHex(rawFrag2.slice(0, 16)),
      end: bytesToHex(rawFrag2.slice(Math.max(0, rawFrag2.length - 16))),
    },
    features: extractFragmentFeatures(rawFrag2),
  };

  const fragC: FileFragment = {
    id: 'frag_C_' + Date.now(),
    name: 'fragment_C.bin',
    size: rawFrag3.length,
    data: rawFrag3,
    sha256: await calculateSha256(rawFrag3),
    uploadTimestamp: Date.now() - 1000,
    hexSample: {
      start: bytesToHex(rawFrag3.slice(0, 16)),
      end: bytesToHex(rawFrag3.slice(Math.max(0, rawFrag3.length - 16))),
    },
    features: extractFragmentFeatures(rawFrag3),
  };

  // Expected true ordering is A -> B -> C
  const expectedOrderNames = [fragA.name, fragB.name, fragC.name];

  // Deliberately shuffle them out of order: C, A, B or B, C, A
  const shuffledOptions = [
    [fragC, fragA, fragB],
    [fragB, fragC, fragA],
    [fragC, fragB, fragA],
    [fragB, fragA, fragC],
  ];
  const chosenShuffle = shuffledOptions[Math.floor(Math.random() * shuffledOptions.length)];

  return {
    originalFile: {
      name: filename,
      bytes: fileBytes,
      sha256: originalSha256,
      type: fileType,
    },
    shuffledFragments: chosenShuffle,
    expectedOrderNames,
  };
}
