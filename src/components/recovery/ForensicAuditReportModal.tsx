import React, { useState } from 'react';
import { FileText, Download, X, Copy, Check, ShieldCheck, HardDrive, Lock } from 'lucide-react';
import { AuthorizedRecoverySource, RecoveryCandidate, ForensicAuditLogEntry } from '../../types/recovery';

interface ForensicAuditReportModalProps {
  source: AuthorizedRecoverySource;
  candidates: RecoveryCandidate[];
  auditLogs: ForensicAuditLogEntry[];
  isOpen: boolean;
  onClose: () => void;
}

export const ForensicAuditReportModal: React.FC<ForensicAuditReportModalProps> = ({
  source,
  candidates,
  auditLogs,
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [reportFormat, setReportFormat] = useState<'txt' | 'json'>('txt');

  if (!isOpen) return null;

  const fullyRecovered = candidates.filter((c) => c.validationStatus === 'Fully Recovered').length;
  const partiallyRecovered = candidates.filter((c) => c.validationStatus === 'Partially Recovered').length;
  const fragmented = candidates.filter((c) => c.validationStatus === 'Fragmented').length;
  const corrupted = candidates.filter((c) => c.validationStatus === 'Corrupted').length;
  const unsupported = candidates.filter((c) => c.validationStatus === 'Unsupported').length;

  const timestamp = new Date().toISOString();
  const caseId = `DFIR-REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  // Generate Formal Text Report
  const generateTextReport = () => {
    return `================================================================================
DIGITAL FORENSICS & INCIDENT RESPONSE: DELETED FILE RECOVERY REPORT
SYSTEM: AI-Assisted Intelligent Deleted File Recovery System (SectorRescue v2.4.1)
================================================================================

CASE IDENTIFIER: ${caseId}
ACQUISITION & ANALYSIS TIMESTAMP: ${timestamp}
FORENSIC OPERATOR: Investigator / Digital Forensics Examiner
SECURITY ENFORCEMENT: Canonical Path Sandbox Enforced · System32/Program Files Protected
MEDIA STATUS: Hardware / Software Read-Only Write-Blocker ACTIVE

--------------------------------------------------------------------------------
1. AUTHORIZED RECOVERY SOURCE IDENTIFICATION
--------------------------------------------------------------------------------
Source Name:        ${source.name}
Source Classification: ${source.type}
File System:        ${source.fileSystem}
Container Format:   ${source.imageFormat || 'Direct RAW / DD'}
Source Size:        ${(source.sizeBytes / (1024 * 1024)).toFixed(2)} MB
Source Path:        ${source.pathOrIdentifier}
Safe Output Folder: ${source.outputDirectory}
Custody Baseline:   Source media preserved byte-for-byte; zero write operations performed.

--------------------------------------------------------------------------------
2. RECOVERY & CARVING SUMMARY STATISTICS
--------------------------------------------------------------------------------
Total Carved Candidates Discovered: ${candidates.length}
- Fully Recovered (Valid Header & Footer):  ${fullyRecovered}
- Partially Recovered (Valid Header / Truncated): ${partiallyRecovered}
- Fragmented (Non-Contiguous Sectors):       ${fragmented}
- Corrupted (CRC/Deflate Structural Fail):    ${corrupted}
- Unsupported / Unclassified Binary:          ${unsupported}

Average Recovery Confidence: ${
      candidates.length > 0
        ? Math.round(candidates.reduce((acc, c) => acc + c.recoveryConfidence, 0) / candidates.length)
        : 0
    }%

--------------------------------------------------------------------------------
3. DISCOVERED RECOVERY CANDIDATES INVENTORY
--------------------------------------------------------------------------------
${candidates
  .map(
    (c, i) =>
      `[${i + 1}] CANDIDATE ID: ${c.id}
    File Type:           ${c.fileType} (.${c.extension})
    Category:            ${c.category.toUpperCase()}
    Magic Signature:     ${c.fileSignatureHex}
    Source Offset:       ${c.sourceOffsetHex} (${c.sourceOffsetBytes} bytes, Cluster #${c.clusterNumber})
    Estimated Size:      ${c.estimatedSizeBytes} bytes
    Header Status:       ${c.headerFound ? 'FOUND' : 'MISSING'} (${c.headerSignature})
    Footer Status:       ${c.footerFound ? 'FOUND' : 'MISSING / TRUNCATED'} (${c.footerSignature || 'N/A'})
    Confidence Score:    ${c.recoveryConfidence}% (${c.confidenceReasoning})
    Validation Status:   ${c.validationStatus}
    Entropy:             ${c.entropy} bits/byte
    Cryptographic SHA-256: ${c.sha256 || 'N/A'}
    Recovery Note:       ${c.recoveryNote}
`
  )
  .join('\n')}

--------------------------------------------------------------------------------
4. CHAIN OF CUSTODY & AUDIT LOG EXCERPTS
--------------------------------------------------------------------------------
${auditLogs
  .slice(-10)
  .map((log) => `[${log.timestamp}] [${log.status}] ${log.action}: ${log.details}`)
  .join('\n')}

--------------------------------------------------------------------------------
5. FORENSIC INTEGRITY & AUTHENTICITY NOTICE
--------------------------------------------------------------------------------
IMPORTANT FORENSIC PRINCIPLE:
This recovery system strictly isolates recovered byte streams without mutating original
evidence. Structural validation and signature detection verify that extracted data
conforms to known container specifications. However, cryptographic and structural integrity
does NOT by itself establish legal authenticity, provenance, or lack of prior tampering
without corroborating audit logs, signed digital timestamps, and chain-of-custody documentation.

================================================================================
END OF REPORT — SECTORRESCUE DIGITAL FORENSICS INVESTIGATION ENGINE
================================================================================`;
  };

  // Generate Structured JSON Report
  const generateJSONReport = () => {
    return JSON.stringify(
      {
        reportMeta: {
          system: 'AI-Assisted Intelligent Deleted File Recovery System',
          version: '2.4.1',
          caseId,
          timestamp,
          writeBlockEnforced: true,
          canonicalPathEnforced: true,
        },
        source: {
          id: source.id,
          name: source.name,
          type: source.type,
          fileSystem: source.fileSystem,
          imageFormat: source.imageFormat,
          sizeBytes: source.sizeBytes,
          path: source.pathOrIdentifier,
          outputDirectory: source.outputDirectory,
        },
        statistics: {
          totalCandidates: candidates.length,
          fullyRecovered,
          partiallyRecovered,
          fragmented,
          corrupted,
          unsupported,
        },
        candidates: candidates.map((c) => ({
          id: c.id,
          fileType: c.fileType,
          extension: c.extension,
          category: c.category,
          signatureHex: c.fileSignatureHex,
          offsetHex: c.sourceOffsetHex,
          offsetBytes: c.sourceOffsetBytes,
          clusterNumber: c.clusterNumber,
          estimatedSizeBytes: c.estimatedSizeBytes,
          headerFound: c.headerFound,
          footerFound: c.footerFound,
          confidence: c.recoveryConfidence,
          validationStatus: c.validationStatus,
          entropy: c.entropy,
          sha256: c.sha256,
          recoveryNote: c.recoveryNote,
        })),
        auditTrail: auditLogs.slice(-15),
      },
      null,
      2
    );
  };

  const reportText = reportFormat === 'txt' ? generateTextReport() : generateJSONReport();

  const handleDownload = () => {
    const blob = new Blob([reportText], {
      type: reportFormat === 'txt' ? 'text/plain;charset=utf-8' : 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Forensic_Recovery_Report_${caseId}.${reportFormat}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl p-6 sm:p-7 text-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Forensic Recovery Audit Report
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Case ID: <span className="text-cyan-400 font-semibold">{caseId}</span> · Generated {new Date().toLocaleTimeString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-lg bg-slate-950 border border-slate-800 p-0.5 text-xs font-mono">
              <button
                onClick={() => setReportFormat('txt')}
                className={`px-3 py-1 rounded-md transition ${
                  reportFormat === 'txt' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                TXT FORMAT
              </button>
              <button
                onClick={() => setReportFormat('json')}
                className={`px-3 py-1 rounded-md transition ${
                  reportFormat === 'json' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                JSON FORMAT
              </button>
            </div>

            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition ml-2"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Report Preview Body */}
        <div className="mt-4 flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-[11px] text-slate-300 whitespace-pre leading-relaxed select-text shadow-inner">
            {reportText}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800 pt-4">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Evidentiary Chain-of-Custody Protected</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 transition"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              <span>{copied ? 'Copied' : 'Copy Report'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400 transition shadow-lg shadow-cyan-950/50"
            >
              <Download className="h-4 w-4" />
              <span>Download Official Report (.{reportFormat})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
