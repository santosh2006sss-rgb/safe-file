import { IntegrityVerificationReport } from '../types/integrity';

export function generateIntegrityReportText(report: IntegrityVerificationReport): string {
  const divider = '='.repeat(76);
  const subDivider = '-'.repeat(76);

  let output = `${divider}\n`;
  output += `           FORENSIC INTEGRITY VERIFICATION REPORT\n`;
  output += `       AI-Assisted Recovered File Integrity Verification System\n`;
  output += `${divider}\n\n`;

  output += `REPORT IDENTIFIER  : ${report.reportId}\n`;
  output += `VERIFICATION TIME  : ${report.generatedAt}\n`;
  output += `SYSTEM ENGINE      : ${report.verificationSystem}\n`;
  output += `OVERALL STATUS     : [ ${report.statusTitle.toUpperCase()} ]\n\n`;

  output += `${subDivider}\n`;
  output += `1. RECOVERED FILE SPECIFICATION\n`;
  output += `${subDivider}\n`;
  output += `File Name         : ${report.recoveredFile.name}\n`;
  output += `Byte Size         : ${report.recoveredFile.size.toLocaleString()} bytes\n`;
  output += `MIME Type         : ${report.recoveredFile.mimeType}\n`;
  output += `Extension         : .${report.recoveredFile.extension}\n`;
  output += `Shannon Entropy   : ${report.recoveredFile.entropy.toFixed(3)} bits/byte\n`;
  output += `SHA-256 Hash      : ${report.recoveredFile.sha256}\n`;
  output += `SHA-512 Hash      : ${report.recoveredFile.sha512}\n`;
  output += `MD5 Hash (Legacy) : ${report.recoveredFile.md5}  [Note: Collision-vulnerable]\n\n`;

  output += `${subDivider}\n`;
  output += `2. REFERENCE FILE COMPARISON\n`;
  output += `${subDivider}\n`;
  if (report.hasReference && report.referenceFile && report.hashComparison) {
    output += `Reference File    : ${report.referenceFile.name} (${report.referenceFile.size.toLocaleString()} bytes)\n`;
    output += `Reference SHA-256 : ${report.referenceFile.sha256}\n`;
    output += `Recovered SHA-256 : ${report.recoveredFile.sha256}\n`;
    output += `Reference SHA-512 : ${report.referenceFile.sha512}\n`;
    output += `Recovered SHA-512 : ${report.recoveredFile.sha512}\n`;
    output += `HASH MATCH RESULT : ${report.hashComparison.byteIdentical ? 'EXACT MATCH' : 'MISMATCH'}\n`;
    output += `VERDICT STATEMENT : ${report.hashComparison.message}\n`;
    if (!report.hashComparison.byteIdentical) {
      output += `Byte Discrepancies: ${report.hashComparison.differingByteCount} byte(s) differ\n`;
      if (report.hashComparison.firstDiffOffset !== null) {
        output += `First Discrepancy : Offset 0x${report.hashComparison.firstDiffOffset.toString(16)} (${report.hashComparison.firstDiffOffset})\n`;
      }
    }
    output += `NON-MALICIOUS NOTE: ${report.hashComparison.nonMaliciousNote}\n\n`;
  } else {
    output += `Reference File    : Not available (Single recovered stream analysis)\n`;
    output += `Note              : Complete byte-for-byte integrity cannot be established without a trusted reference.\n\n`;
  }

  output += `${subDivider}\n`;
  output += `3. STRUCTURAL VALIDATION CHECKS\n`;
  output += `${subDivider}\n`;
  output += `Detected Format   : ${report.structuralValidation.format}\n`;
  output += `Magic Bytes (Hex) : ${report.structuralValidation.magicBytesHex}\n`;
  output += `Signature Status  : ${report.structuralValidation.fileSignatureValid ? 'VALID' : 'INVALID'}\n`;
  output += `Extension Match   : ${report.structuralValidation.extensionConsistent ? 'CONSISTENT' : 'INCONSISTENT'}\n`;
  output += `Header Status     : ${report.structuralValidation.headerValid ? 'VALID' : 'FAILED'}\n`;
  output += `Footer Status     : ${report.structuralValidation.footerValid ? 'VALID' : 'MISSING / CORRUPTED'}\n`;
  output += `Parser Evaluation : ${report.structuralValidation.parserStatus} - ${report.structuralValidation.parserMessage}\n`;
  output += `Structural Status : ${report.structuralValidation.overallStatus}\n\n`;

  output += `Individual Checks:\n`;
  report.structuralValidation.checks.forEach((chk) => {
    const symbol = chk.status === 'PASS' ? '[ PASS ]' : chk.status === 'WARN' ? '[ WARN ]' : '[ FAIL ]';
    output += `  ${symbol} ${chk.label.padEnd(36)} : ${chk.details}\n`;
  });
  output += `\n`;

  if (report.structuralValidation.detectedIssues.length > 0) {
    output += `Detected Anomalies / Issues:\n`;
    report.structuralValidation.detectedIssues.forEach((issue, idx) => {
      output += `  [!] Issue ${idx + 1}: ${issue}\n`;
    });
    output += `\n`;
  }

  if (report.structuralValidation.recommendations.length > 0) {
    output += `Forensic Recommendations:\n`;
    report.structuralValidation.recommendations.forEach((rec, idx) => {
      output += `  --> Rec ${idx + 1}: ${rec}\n`;
    });
    output += `\n`;
  }

  if (report.aiForensics) {
    output += `${subDivider}\n`;
    output += `4. AI FORENSIC ANALYSIS (GEMINI)\n`;
    output += `${subDivider}\n`;
    output += `Summary           : ${report.aiForensics.summary}\n`;
    output += `Forensic Verdict  : ${report.aiForensics.integrityVerdict}\n`;
    output += `Integrity vs Auth : ${report.aiForensics.integrityVsAuthenticityExplanation}\n\n`;
  }

  output += `${subDivider}\n`;
  output += `5. FORENSIC CUSTODY & AUTHENTICITY NOTICE\n`;
  output += `${subDivider}\n`;
  output += `${report.authenticityNotice}\n\n`;
  output += `${report.chainOfCustodyDisclaimer}\n`;
  output += `${divider}\n`;
  output += `                    [ END OF FORENSIC REPORT ]\n`;
  output += `${divider}\n`;

  return output;
}

export function downloadFile(content: string, filename: string, mimeType = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
