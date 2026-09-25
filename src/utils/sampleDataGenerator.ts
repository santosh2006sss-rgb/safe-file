/**
 * Generates a realistic synthetic disk sector dump (ArrayBuffer)
 * containing embedded JPEG, PNG, text, and zip files flanked by zero-padded sectors
 * and random slack space. This lets the user test actual in-browser carving!
 */
export function generateSyntheticCorruptedDiskDump(): {
  buffer: ArrayBuffer;
  filename: string;
} {
  const chunks: Uint8Array[] = [];

  // 1. Boot sector / MBR simulation (512 bytes)
  const mbr = new Uint8Array(512);
  mbr[0] = 0xEB; // JMP instruction
  mbr[1] = 0x58;
  mbr[2] = 0x90;
  // Signature at end
  mbr[510] = 0x55;
  mbr[511] = 0xAA;
  chunks.push(mbr);

  // 2. Slack space / deleted file remnants (1024 bytes)
  const slack1 = new Uint8Array(1024);
  for (let i = 0; i < slack1.length; i++) slack1[i] = (i * 37) % 256;
  chunks.push(slack1);

  // 3. Embedded JPEG image signature
  // JPEG Header: FF D8 FF E0 00 10 4A 46 49 46
  // Small valid JFIF marker stream followed by FF D9
  const jpegBytes = new Uint8Array([
    0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x60,
    0x00, 0x60, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43, 0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08,
    0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
    0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20, 0x24, 0x2E, 0x27, 0x20,
    0xFF, 0xD9 // End of Image
  ]);
  chunks.push(jpegBytes);

  // 4. Zero filler (4096 bytes representing an unallocated cluster)
  chunks.push(new Uint8Array(4096));

  // 5. Embedded PNG image signature
  const pngBytes = new Uint8Array([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG Magic
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
    0x00, 0x00, 0x00, 0x10, 0x00, 0x00, 0x00, 0x10, // 16x16
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0xF3, 0xFF,
    0x61, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, // IEND chunk
    0x44, 0xAE, 0x42, 0x60, 0x82
  ]);
  chunks.push(pngBytes);

  // 6. Slack filler
  chunks.push(new Uint8Array(2048));

  // 7. Embedded PDF Document
  const pdfString = `%PDF-1.4
1 0 obj
<< /Title (Confidential Recovery Blueprint) /Author (SectorRescue) >>
endobj
2 0 obj
<< /Type /Catalog /Pages 3 0 R >>
endobj
3 0 obj
<< /Type /Pages /Kids [4 0 R] /Count 1 >>
endobj
4 0 obj
<< /Type /Page /Parent 3 0 R /MediaBox [0 0 612 792] >>
endobj
xref
0 5
trailer
<< /Size 5 /Root 2 0 R >>
startxref
240
%%EOF`;
  chunks.push(new TextEncoder().encode(pdfString));

  // 8. Trailing unallocated sectors
  chunks.push(new Uint8Array(1024));

  // Merge into single buffer
  const totalLength = chunks.reduce((acc, c) => acc + c.length, 0);
  const finalBuffer = new Uint8Array(totalLength);
  let offset = 0;
  for (const c of chunks) {
    finalBuffer.set(c, offset);
    offset += c.length;
  }

  return {
    buffer: finalBuffer.buffer,
    filename: 'disk_image_corrupted_dump.raw',
  };
}
