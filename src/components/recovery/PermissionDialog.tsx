import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, Lock, FolderCheck, X, Check, FileCheck, Ban } from 'lucide-react';
import { AuthorizedRecoverySource, ForensicAuditLogEntry } from '../../types/recovery';

interface PermissionDialogProps {
  source: AuthorizedRecoverySource;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (outputDir: string) => void;
  onRevoke: () => void;
  isAuthorized: boolean;
}

export const PermissionDialog: React.FC<PermissionDialogProps> = ({
  source,
  isOpen,
  onClose,
  onApprove,
  onRevoke,
  isAuthorized,
}) => {
  const [outputDir, setOutputDir] = useState(source.outputDirectory || '/mnt/forensics_output/case_recovery');
  const [attestationChecked, setAttestationChecked] = useState(isAuthorized);
  const [pathValid, setPathValid] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleOutputDirChange = (val: string) => {
    setOutputDir(val);
    // Security check: block path traversal and system folders
    if (val.includes('..') || /System32|Program Files|\/etc|\/sys|\/proc/i.test(val)) {
      setPathValid(false);
      setValidationError('Security Alert: Path traversal or critical OS system directory target detected.');
    } else {
      setPathValid(true);
      setValidationError(null);
    }
  };

  const handleStartRecovery = () => {
    if (!attestationChecked) {
      setValidationError('Mandatory: You must certify authorized access before beginning analysis.');
      return;
    }
    if (!pathValid) return;
    onApprove(outputDir);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl p-6 sm:p-7 text-slate-100">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                User Authorization & Forensic Permission Workflow
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Mandatory Legal & Evidentiary Custody Verification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Source Identification & Read-Only Notice */}
        <div className="mt-5 space-y-4">
          <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-4">
            <div className="flex items-center justify-between text-xs font-mono mb-2">
              <span className="text-cyan-400 font-bold uppercase tracking-wider">Target Recovery Source</span>
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                <Lock className="h-3 w-3" />
                READ-ONLY WRITE-BLOCKER ENFORCED
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-200">{source.name}</p>
            <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono text-slate-400">
              <div>
                <span className="text-slate-500">Source Type:</span>{' '}
                <span className="text-slate-300 font-medium">{source.type}</span>
              </div>
              <div>
                <span className="text-slate-500">File System:</span>{' '}
                <span className="text-slate-300 font-medium">{source.fileSystem}</span>
              </div>
              <div>
                <span className="text-slate-500">Format:</span>{' '}
                <span className="text-slate-300 font-medium">{source.imageFormat || 'Direct RAW'}</span>
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-400 font-mono break-all">
              <span className="text-slate-500">Identifier:</span> {source.pathOrIdentifier}
            </p>
          </div>

          {/* Security Guarantees */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-1">
                <Check className="h-4 w-4" />
                <span>Zero System Scanning</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                The agent will NOT silently scan your computer, C:\Windows, System32, or Program Files. Only this approved source will be examined.
              </p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-1">
                <Check className="h-4 w-4" />
                <span>Evidence Non-Destructive</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Byte-level read-only access prevents any writing, sector wiping, or metadata tampering on the source evidence.
              </p>
            </div>
          </div>

          {/* Output Directory Selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300 font-mono">
              Designated Safe Output Directory (Read/Write Allowed for Salvaged Data)
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={outputDir}
                  onChange={(e) => handleOutputDirChange(e.target.value)}
                  className={`w-full rounded-lg border bg-slate-950 px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none transition ${
                    pathValid ? 'border-slate-700 focus:border-cyan-500' : 'border-rose-500 text-rose-200'
                  }`}
                  placeholder="/mnt/forensics_output/case_recovery"
                />
              </div>
              <span className="px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-[11px] text-slate-300 font-mono whitespace-nowrap">
                Sandbox Output
              </span>
            </div>
            {validationError && (
              <p className="text-xs text-rose-400 flex items-center gap-1.5 mt-1 font-mono">
                <AlertTriangle className="h-3.5 w-3.5" />
                {validationError}
              </p>
            )}
          </div>

          {/* Legal / Forensic Attestation Checkbox */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/90 p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={attestationChecked}
                onChange={(e) => {
                  setAttestationChecked(e.target.checked);
                  if (e.target.checked) setValidationError(null);
                }}
                className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500/20"
              />
              <div className="text-xs text-slate-300 leading-relaxed">
                <span className="font-semibold text-white">Authorization Certification & Chain of Custody Attestation:</span>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  I certify that I am legally authorized to analyze, recover, and extract deleted files from this storage image or dataset in accordance with applicable cybersecurity, digital forensics, and organizational incident response policies.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800 pt-4">
          <div>
            {isAuthorized && (
              <button
                type="button"
                onClick={onRevoke}
                className="flex items-center gap-1.5 rounded-lg border border-rose-500/40 bg-rose-950/20 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-900/30 transition"
              >
                <Ban className="h-3.5 w-3.5" />
                <span>Revoke Permission</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!attestationChecked || !pathValid}
              onClick={handleStartRecovery}
              className={`flex items-center gap-2 rounded-lg px-5 py-2 text-xs font-bold transition shadow-lg ${
                attestationChecked && pathValid
                  ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-cyan-950/50'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <FileCheck className="h-4 w-4" />
              <span>Approve & Start Recovery</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
