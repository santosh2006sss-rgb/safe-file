import { DrivePartition, RecoverableFile } from '../types/recovery';

const SAMPLE_CODE_PREVIEW = `// authService.ts - Recovered TypeScript Source
import { jwtVerify, SignJWT } from 'jose';

export interface UserSession {
  userId: string;
  email: string;
  role: 'admin' | 'auditor' | 'user';
  expiresAt: number;
}

export async function verifySessionToken(token: string): Promise<UserSession | null> {
  try {
    const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as UserSession;
  } catch (err) {
    console.error("Token signature invalid or expired", err);
    return null;
  }
}
`;

const SAMPLE_CSV_PREVIEW = `Date,Transaction_ID,Category,Description,Amount_USD,Status
2026-03-01,TXN-90214,Infrastructure,AWS US-East Data Replication,4820.50,Settled
2026-03-04,TXN-90255,Legal,Trademark & Patent Filing Fee,2150.00,Settled
2026-03-10,TXN-90311,Payroll,Engineering Team Sprint 44,48200.00,Settled
2026-03-15,TXN-90390,Software,JetBrains Enterprise Licenses,1490.00,Settled
2026-03-18,TXN-90422,Hardware,Server Rack NVMe Replacement,3650.00,Settled
2026-03-22,TXN-90499,Consulting,Penetration Testing Audit,9800.00,Settled
`;

const SAMPLE_SVG_PREVIEW = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="100%" height="100%">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="%230f172a"/>
      <stop offset="100%" stop-color="%231e293b"/>
    </linearGradient>
    <linearGradient id="cyanGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="%2306b6d4"/>
      <stop offset="100%" stop-color="%233b82f6"/>
    </linearGradient>
  </defs>
  <rect width="600" height="400" fill="url(%23bg)"/>
  <circle cx="300" cy="180" r="80" fill="none" stroke="url(%23cyanGrad)" stroke-width="4" stroke-dasharray="8 6"/>
  <polygon points="300,120 350,220 250,220" fill="%2306b6d4" opacity="0.8"/>
  <text x="300" y="310" fill="%23f8fafc" font-family="system-ui, sans-serif" font-size="20" font-weight="600" text-anchor="middle">Project Architecture Blueprint</text>
  <text x="300" y="340" fill="%2394a3b8" font-family="system-ui, sans-serif" font-size="13" text-anchor="middle">Recovered Vector Graphic · Revision 4.2 · Intact</text>
</svg>`;

const SAMPLE_SVG_PHOTO = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="100%" height="100%">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="%230284c7"/>
      <stop offset="100%" stop-color="%23bae6fd"/>
    </linearGradient>
  </defs>
  <rect width="600" height="260" fill="url(%23sky)"/>
  <circle cx="480" cy="80" r="40" fill="%23fef08a" opacity="0.9"/>
  <!-- Mountain ranges -->
  <polygon points="40,260 180,90 320,260" fill="%23334155"/>
  <polygon points="140,140 180,90 220,140 195,145 180,135 165,145" fill="%23ffffff"/>
  <polygon points="220,260 380,60 540,260" fill="%23475569"/>
  <polygon points="330,120 380,60 430,120 405,125 380,115 355,125" fill="%23ffffff"/>
  <rect y="260" width="600" height="140" fill="%231e3a5f"/>
  <text x="30" y="380" fill="%23ffffff" font-family="sans-serif" font-size="14" font-weight="600">DSC_8942_Alps_Summit.RAW</text>
</svg>`;

const SAMPLE_PDF_TEXT = `%PDF-1.7
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
<< /Length 195 >>
stream
BT
/F1 18 Tf
50 720 Td
(CONFIDENTIAL: Q4 CORPORATE FINANCIAL & TAX FILINGS) Tj
/F1 12 Tf
0 -30 Td
(Fiscal Audit: Audited Balance Sheets and Depreciation Ledger for FY2025-2026) Tj
0 -25 Td
(Total Recoverable Assets: $4,921,800.00 USD. Certified by Senior Auditor.) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000010 00000 n 
0000000059 00000 n 
0000000116 00000 n 
0000000214 00000 n 
trailer
<< /Size 5 /Root 1 0 R >>
startxref
462
%%EOF`;

const SAMPLE_SQL_PREVIEW = `-- customer_orders_dump.sql - Database Schema & Data
CREATE TABLE IF NOT EXISTS public.customer_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(255) NOT NULL,
    tax_identifier VARCHAR(64) UNIQUE,
    contract_value NUMERIC(14,2) DEFAULT 0.00,
    renewal_date DATE NOT NULL,
    status VARCHAR(32) DEFAULT 'active'
);

INSERT INTO public.customer_records (company_name, tax_identifier, contract_value, renewal_date, status)
VALUES 
('Vanguard Aerospace Logistics', 'US-89214710', 142000.00, '2026-11-15', 'active'),
('Nordic BioTech Diagnostics', 'DK-98124401', 89500.00, '2027-01-31', 'active'),
('Apex Robotics Automation', 'DE-44109823', 215000.00, '2026-10-01', 'pending_renewal');
`;

const SAMPLE_ENV_PREVIEW = `# Production Environment Configuration (Backup)
PORT=8080
DATABASE_URL="postgresql://db_admin:K9xL2pQ8vM3a@db.production.internal:5432/core_prod"
REDIS_CLUSTER_URL="redis://cluster-node-01.internal:6379"
STORAGE_BUCKET_NAME="secure-enterprise-backup-vault-2026"
ENCRYPTION_MASTER_KEY="a4f89c02b184e93d987621a30f14582c"
JWT_EXPIRATION_HOURS=24
`;

export const MOCK_DRIVES: DrivePartition[] = [
  {
    id: 'drive_c',
    name: 'Local Disk (C:)',
    mountPoint: 'C:\\',
    fileSystem: 'NTFS',
    driveType: 'NVMe SSD',
    totalBytes: 512 * 1024 * 1024 * 1024, // 512 GB
    usedBytes: 382 * 1024 * 1024 * 1024,
    deletedEstimatedBytes: 42.8 * 1024 * 1024 * 1024,
    health: 'Healthy',
    sectorSize: 512,
    totalClusters: 125000000,
    iconType: 'internal',
    files: [
      {
        id: 'file_c_01',
        filename: 'authService.ts',
        originalPath: 'C:\\Users\\Developer\\Projects\\EnterpriseApp\\src\\services\\authService.ts',
        extension: 'ts',
        category: 'code',
        sizeBytes: 1420,
        deletedAt: '2026-03-24 14:12',
        integrity: 'recoverable',
        integrityScore: 100,
        clusterStart: 4892100,
        clusterCount: 1,
        isFragmented: false,
        magicHeader: '2F 2F 20 61',
        mimeType: 'text/typescript',
        entropy: 4.82,
        contentPreview: SAMPLE_CODE_PREVIEW,
        recoveryNote: 'MFT Record #89211 intact. Zero cluster overwrites detected.',
      },
      {
        id: 'file_c_02',
        filename: 'Q4_Corporate_Tax_Filing.pdf',
        originalPath: 'C:\\Users\\Finance\\Documents\\Tax_2025_2026\\Q4_Corporate_Tax_Filing.pdf',
        extension: 'pdf',
        category: 'document',
        sizeBytes: 1845000,
        deletedAt: '2026-03-23 09:40',
        integrity: 'recoverable',
        integrityScore: 98,
        clusterStart: 5104200,
        clusterCount: 451,
        isFragmented: false,
        magicHeader: '25 50 44 46',
        mimeType: 'application/pdf',
        entropy: 7.91,
        contentPreview: SAMPLE_PDF_TEXT,
        recoveryNote: 'Header %PDF- and trailer %%EOF both verified at sector boundaries.',
      },
      {
        id: 'file_c_03',
        filename: 'architecture_blueprint.svg',
        originalPath: 'C:\\Users\\Developer\\Designs\\architecture_blueprint.svg',
        extension: 'svg',
        category: 'image',
        sizeBytes: 8640,
        deletedAt: '2026-03-24 11:05',
        integrity: 'recoverable',
        integrityScore: 100,
        clusterStart: 5219400,
        clusterCount: 3,
        isFragmented: false,
        magicHeader: '3C 73 76 67',
        mimeType: 'image/svg+xml',
        entropy: 4.95,
        contentPreview: SAMPLE_SVG_PREVIEW,
        recoveryNote: 'Clean XML structure verified. Viewable without loss.',
      },
      {
        id: 'file_c_04',
        filename: 'March_2026_Expenses.csv',
        originalPath: 'C:\\Users\\Finance\\Spreadsheets\\March_2026_Expenses.csv',
        extension: 'csv',
        category: 'document',
        sizeBytes: 4210,
        deletedAt: '2026-03-22 17:30',
        integrity: 'good',
        integrityScore: 94,
        clusterStart: 5310000,
        clusterCount: 2,
        isFragmented: false,
        magicHeader: '44 61 74 65',
        mimeType: 'text/csv',
        entropy: 4.61,
        contentPreview: SAMPLE_CSV_PREVIEW,
        recoveryNote: 'All CSV rows delimited cleanly; 100% of line items salvaged.',
      },
      {
        id: 'file_c_05',
        filename: 'production_cluster.env',
        originalPath: 'C:\\Users\\DevOps\\Configs\\production_cluster.env',
        extension: 'env',
        category: 'code',
        sizeBytes: 980,
        deletedAt: '2026-03-25 08:15',
        integrity: 'recoverable',
        integrityScore: 100,
        clusterStart: 5410900,
        clusterCount: 1,
        isFragmented: false,
        magicHeader: '23 20 50 72',
        mimeType: 'text/plain',
        entropy: 5.12,
        contentPreview: SAMPLE_ENV_PREVIEW,
        recoveryNote: 'Shift-Deleted file rescued from unallocated cluster range.',
      },
      {
        id: 'file_c_06',
        filename: 'customer_orders_dump.sql',
        originalPath: 'C:\\DatabaseBackups\\customer_orders_dump.sql',
        extension: 'sql',
        category: 'database',
        sizeBytes: 84000,
        deletedAt: '2026-03-21 16:50',
        integrity: 'good',
        integrityScore: 91,
        clusterStart: 5520100,
        clusterCount: 21,
        isFragmented: true,
        magicHeader: '2D 2D 20 63',
        mimeType: 'application/sql',
        entropy: 5.04,
        contentPreview: SAMPLE_SQL_PREVIEW,
        recoveryNote: 'Two fragmented cluster chains reassembled via MFT run-list pointers.',
      },
      {
        id: 'file_c_07',
        filename: 'Project_Archive_March.zip',
        originalPath: 'C:\\Users\\Developer\\Downloads\\Project_Archive_March.zip',
        extension: 'zip',
        category: 'archive',
        sizeBytes: 14200000,
        deletedAt: '2026-03-20 10:20',
        integrity: 'fragmented',
        integrityScore: 78,
        clusterStart: 6010000,
        clusterCount: 3466,
        isFragmented: true,
        magicHeader: '50 4B 03 04',
        mimeType: 'application/zip',
        entropy: 7.98,
        recoveryNote: 'Trailing 15% partially fragmented; central directory record intact.',
      },
    ],
  },
  {
    id: 'drive_d',
    name: 'Media Volume (D:)',
    mountPoint: 'D:\\',
    fileSystem: 'exFAT',
    driveType: 'HDD',
    totalBytes: 2000 * 1024 * 1024 * 1024, // 2 TB
    usedBytes: 1420 * 1024 * 1024 * 1024,
    deletedEstimatedBytes: 185 * 1024 * 1024 * 1024,
    health: 'Good',
    sectorSize: 4096,
    totalClusters: 488000000,
    iconType: 'internal',
    files: [
      {
        id: 'file_d_01',
        filename: 'DSC_8942_Alps_Summit.jpg',
        originalPath: 'D:\\Photography\\2026_Switzerland\\DSC_8942_Alps_Summit.jpg',
        extension: 'jpg',
        category: 'image',
        sizeBytes: 12450000,
        deletedAt: '2026-03-24 16:30',
        integrity: 'recoverable',
        integrityScore: 100,
        clusterStart: 18400000,
        clusterCount: 3040,
        isFragmented: false,
        magicHeader: 'FF D8 FF E1',
        mimeType: 'image/jpeg',
        entropy: 7.94,
        contentPreview: SAMPLE_SVG_PHOTO,
        recoveryNote: 'EXIF metadata and JPEG quantization tables intact.',
      },
      {
        id: 'file_d_02',
        filename: 'Keynote_Presentation_2026.pdf',
        originalPath: 'D:\\Clients\\AcmeCorp\\Keynote_Presentation_2026.pdf',
        extension: 'pdf',
        category: 'document',
        sizeBytes: 8900000,
        deletedAt: '2026-03-24 12:00',
        integrity: 'recoverable',
        integrityScore: 97,
        clusterStart: 19100000,
        clusterCount: 2172,
        isFragmented: false,
        magicHeader: '25 50 44 46',
        mimeType: 'application/pdf',
        entropy: 7.85,
        contentPreview: SAMPLE_PDF_TEXT,
        recoveryNote: 'Embedded font dictionaries and cross-reference stream verified.',
      },
      {
        id: 'file_d_03',
        filename: 'Interview_Audio_Track01.mp3',
        originalPath: 'D:\\Podcast\\Season4\\RawAudio\\Interview_Audio_Track01.mp3',
        extension: 'mp3',
        category: 'audio',
        sizeBytes: 34500000,
        deletedAt: '2026-03-22 18:40',
        integrity: 'good',
        integrityScore: 92,
        clusterStart: 21400000,
        clusterCount: 8422,
        isFragmented: false,
        magicHeader: '49 44 33 04',
        mimeType: 'audio/mpeg',
        entropy: 7.91,
        recoveryNote: 'MPEG Layer 3 frame sync words continuous across 34 MB.',
      },
      {
        id: 'file_d_04',
        filename: 'Client_Contract_Signed_2026.docx',
        originalPath: 'D:\\Legal\\Signed_Agreements\\Client_Contract_Signed_2026.docx',
        extension: 'docx',
        category: 'document',
        sizeBytes: 485000,
        deletedAt: '2026-03-23 15:10',
        integrity: 'recoverable',
        integrityScore: 99,
        clusterStart: 23100000,
        clusterCount: 119,
        isFragmented: false,
        magicHeader: '50 4B 03 04',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        entropy: 7.89,
        contentPreview: `--- RECOVERED LEGAL INSTRUMENT ---
Client Services Agreement
Parties: SectorRescue Corp & Enterprise Client
Executed Date: March 15, 2026
Term: 36 Months with automatic annual renewal
All signatures and notarization tokens confirmed valid.`,
        recoveryNote: 'OpenXML zip container and word/document.xml uncorrupted.',
      },
    ],
  },
  {
    id: 'drive_e',
    name: 'USB Flash Drive (E:)',
    mountPoint: 'E:\\',
    fileSystem: 'FAT32',
    driveType: 'USB Flash',
    totalBytes: 64 * 1024 * 1024 * 1024, // 64 GB
    usedBytes: 12 * 1024 * 1024 * 1024,
    deletedEstimatedBytes: 8.4 * 1024 * 1024 * 1024,
    health: 'Warning',
    sectorSize: 512,
    totalClusters: 15600000,
    iconType: 'external',
    files: [
      {
        id: 'file_e_01',
        filename: 'Quarterly_Audit_Summary.csv',
        originalPath: 'E:\\Audit\\Quarterly_Audit_Summary.csv',
        extension: 'csv',
        category: 'document',
        sizeBytes: 3100,
        deletedAt: '2026-03-25 06:10',
        integrity: 'recoverable',
        integrityScore: 100,
        clusterStart: 42100,
        clusterCount: 1,
        isFragmented: false,
        magicHeader: '44 61 74 65',
        mimeType: 'text/csv',
        entropy: 4.58,
        contentPreview: SAMPLE_CSV_PREVIEW,
        recoveryNote: 'FAT directory entry marked 0xE5. Clusters completely intact.',
      },
      {
        id: 'file_e_02',
        filename: 'Company_Logo_HighRes.png',
        originalPath: 'E:\\Brand\\Company_Logo_HighRes.png',
        extension: 'png',
        category: 'image',
        sizeBytes: 420000,
        deletedAt: '2026-03-24 08:30',
        integrity: 'good',
        integrityScore: 95,
        clusterStart: 43200,
        clusterCount: 103,
        isFragmented: false,
        magicHeader: '89 50 4E 47',
        mimeType: 'image/png',
        entropy: 7.92,
        contentPreview: SAMPLE_SVG_PREVIEW,
        recoveryNote: 'PNG signature and IHDR chunk intact.',
      },
      {
        id: 'file_e_03',
        filename: 'Encrypted_Vault_Key.txt',
        originalPath: 'E:\\Security\\Encrypted_Vault_Key.txt',
        extension: 'txt',
        category: 'document',
        sizeBytes: 512,
        deletedAt: '2026-03-25 07:05',
        integrity: 'recoverable',
        integrityScore: 100,
        clusterStart: 48900,
        clusterCount: 1,
        isFragmented: false,
        magicHeader: '2D 2D 2D 2D',
        mimeType: 'text/plain',
        entropy: 5.82,
        contentPreview: `-----BEGIN RECOVERED RECOVERY PASSPHRASE-----
Sector-Recovery-Token: 9A81-CB42-EF89-0012
Key Hash (SHA-256): 8f4e2b01c4a923847e09b3d02f8a129487c6b54a32e18d9f
Created: 2026-03-10
Status: ACTIVE
-----END RECOVERED RECOVERY PASSPHRASE-----`,
        recoveryNote: 'Found in unallocated FAT32 cluster. 100% matched.',
      },
    ],
  },
  {
    id: 'drive_sd',
    name: 'Camera SD Card (Lexar Pro)',
    mountPoint: '/Volumes/SD_CAM',
    fileSystem: 'exFAT',
    driveType: 'SD Card',
    totalBytes: 128 * 1024 * 1024 * 1024,
    usedBytes: 89 * 1024 * 1024 * 1024,
    deletedEstimatedBytes: 24.1 * 1024 * 1024 * 1024,
    health: 'Healthy',
    sectorSize: 512,
    totalClusters: 31200000,
    iconType: 'sd',
    files: [
      {
        id: 'file_sd_01',
        filename: 'DJI_0492_Aerial_Coast.jpg',
        originalPath: '/Volumes/SD_CAM/DCIM/100MEDIA/DJI_0492_Aerial_Coast.jpg',
        extension: 'jpg',
        category: 'image',
        sizeBytes: 9840000,
        deletedAt: '2026-03-24 18:22',
        integrity: 'recoverable',
        integrityScore: 100,
        clusterStart: 812000,
        clusterCount: 2402,
        isFragmented: false,
        magicHeader: 'FF D8 FF DB',
        mimeType: 'image/jpeg',
        entropy: 7.95,
        contentPreview: SAMPLE_SVG_PHOTO,
        recoveryNote: 'Camera EXIF timestamp and GPS coordinates preserved.',
      },
      {
        id: 'file_sd_02',
        filename: 'FlightTelemetry_Log.csv',
        originalPath: '/Volumes/SD_CAM/LOGS/FlightTelemetry_Log.csv',
        extension: 'csv',
        category: 'document',
        sizeBytes: 18200,
        deletedAt: '2026-03-24 18:35',
        integrity: 'recoverable',
        integrityScore: 100,
        clusterStart: 840000,
        clusterCount: 5,
        isFragmented: false,
        magicHeader: '54 69 6D 65',
        mimeType: 'text/csv',
        entropy: 4.88,
        contentPreview: `Timestamp_ms,Altitude_m,Pitch_deg,Roll_deg,Battery_pct,GPS_Sats,Status
0,12.4,0.2,-0.1,98,18,TAKEOFF
500,24.8,1.4,0.3,97,18,CLIMB
1000,48.2,3.1,-0.4,96,19,CRUISE_STABLE
1500,75.0,0.0,0.0,95,20,WAYPOINT_ACHIEVED`,
        recoveryNote: 'Raw flight data records completely restored.',
      },
    ],
  },
];
