import {
  FileFragment,
  ReconstructionResult,
  AuditLogEntry,
  SupportedFileType,
} from '../types/fragment';

export interface RecoveryReportJson {
  title: string;
  generatedAt: string;
  detectedFileType: SupportedFileType;
  numberOfFragments: number;
  fragmentInformation: {
    name: string;
    size: number;
    sha256: string;
    signature: string;
    markers: string[];
    entropy: number;
  }[];
  predictedFragmentOrder: string[];
  compatibilityScores: {
    transition: string;
    score: number;
    reason: string;
  }[];
  reconstructionStatus: string;
  validationStatus: string;
  validationChecks: {
    check: string;
    passed: boolean;
    details: string;
  }[];
  missingOrCorruptedSections: string;
  overallConfidence: number;
  reconstructedFileHash: string;
  operationsPerformed: {
    timestamp: string;
    action: string;
    details: string;
  }[];
  aiForensicsAssessment?: {
    source: string;
    summary: string;
    forensicVerdict: string;
    recommendation: string;
  };
}

export function buildRecoveryReportJson(
  fragments: FileFragment[],
  result: ReconstructionResult,
  auditLog: AuditLogEntry[]
): RecoveryReportJson {
  return {
    title: 'AI FILE FRAGMENT RECONSTRUCTION REPORT',
    generatedAt: new Date().toISOString(),
    detectedFileType: result.detectedFileType,
    numberOfFragments: fragments.length,
    fragmentInformation: fragments.map((f) => ({
      name: f.name,
      size: f.size,
      sha256: f.sha256,
      signature: f.features.magicDetected || f.features.footerDetected || 'Unanchored intermediate fragment',
      markers: f.features.containsKnownMarkers,
      entropy: f.features.entropy,
    })),
    predictedFragmentOrder: result.orderedFragmentNames,
    compatibilityScores: result.pairwiseTransitions.map((t) => ({
      transition: `${t.fromName} → ${t.toName}`,
      score: t.score,
      reason: t.reason,
    })),
    reconstructionStatus: result.isUncertain
      ? 'RECONSTRUCTION UNCERTAIN'
      : result.validation.status,
    validationStatus: result.validation.status,
    validationChecks: result.validation.checks.map((c) => ({
      check: c.name,
      passed: c.passed,
      details: c.details,
    })),
    missingOrCorruptedSections: result.validation.isValid
      ? 'None detected. Continuous byte stream with intact container boundaries.'
      : result.validation.reason || 'Structural inconsistencies flagged during parser test.',
    overallConfidence: result.overallConfidence,
    reconstructedFileHash: result.reconstructedSha256,
    operationsPerformed: auditLog.map((log) => ({
      timestamp: log.timestamp,
      action: log.action,
      details: log.details,
    })),
    aiForensicsAssessment: result.aiExplanation
      ? {
          source: result.aiExplanation.source,
          summary: result.aiExplanation.summary,
          forensicVerdict: result.aiExplanation.forensicVerdict,
          recommendation: result.aiExplanation.recommendation,
        }
      : undefined,
  };
}

export function buildRecoveryReportText(report: RecoveryReportJson): string {
  let text = `================================================================================
           AI FILE FRAGMENT RECONSTRUCTION REPORT
================================================================================
Generated At: ${report.generatedAt}
Detected File Type: ${report.detectedFileType}
Number of Fragments: ${report.numberOfFragments}
Overall Algorithmic Confidence: ${report.overallConfidence}%
Reconstruction Status: ${report.reconstructionStatus}
Validation Status: ${report.validationStatus}

--------------------------------------------------------------------------------
1. FRAGMENT INFORMATION
--------------------------------------------------------------------------------
`;

  report.fragmentInformation.forEach((f, i) => {
    text += `Fragment #${i + 1}: ${f.name}\n`;
    text += `  - Size: ${f.size} bytes\n`;
    text += `  - SHA-256: ${f.sha256}\n`;
    text += `  - Signature / Anchors: ${f.signature}\n`;
    text += `  - Known Markers: ${f.markers.join(', ') || 'None'}\n`;
    text += `  - Entropy: ${f.entropy} bits/byte\n\n`;
  });

  text += `--------------------------------------------------------------------------------
2. PREDICTED FRAGMENT ORDER
--------------------------------------------------------------------------------
Sequence:
${report.predictedFragmentOrder.map((name, i) => `  ${i + 1}. ${name}`).join('\n')}

Pipeline:
  ${report.predictedFragmentOrder.join(' → ')}

--------------------------------------------------------------------------------
3. PAIRWISE COMPATIBILITY TRANSITIONS
--------------------------------------------------------------------------------
`;

  report.compatibilityScores.forEach((c) => {
    text += `* ${c.transition} (Compatibility: ${c.score}%)\n`;
    text += `  Evidence: ${c.reason}\n`;
  });

  text += `
--------------------------------------------------------------------------------
4. RECONSTRUCTION & INTEGRITY
--------------------------------------------------------------------------------
Reconstructed File SHA-256:
  ${report.reconstructedFileHash}

Missing / Corrupted Sections:
  ${report.missingOrCorruptedSections}

Validation Checks:
${report.validationChecks.map((v) => `  [${v.passed ? 'PASS' : 'FAIL'}] ${v.check}: ${v.details}`).join('\n')}
`;

  if (report.aiForensicsAssessment) {
    text += `
--------------------------------------------------------------------------------
5. AI FORENSIC INTELLIGENCE ASSESSMENT (${report.aiForensicsAssessment.source})
--------------------------------------------------------------------------------
Summary:
  ${report.aiForensicsAssessment.summary}

Forensic Verdict:
  ${report.aiForensicsAssessment.forensicVerdict}

Recommendation:
  ${report.aiForensicsAssessment.recommendation}
`;
  }

  text += `
--------------------------------------------------------------------------------
6. OPERATIONS AUDIT LOG
--------------------------------------------------------------------------------
${report.operationsPerformed.map((op) => `[${op.timestamp}] [${op.action}] ${op.details}`).join('\n')}
================================================================================
END OF REPORT
`;
  return text;
}

export function downloadJsonReport(report: RecoveryReportJson) {
  const jsonStr = JSON.stringify(report, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `FRAG_RECONSTRUCTION_REPORT_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadTextReport(reportText: string) {
  const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `FRAG_RECONSTRUCTION_REPORT_${new Date().toISOString().slice(0, 10)}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
