import React, { useState } from 'react';
import {
  FileText,
  Download,
  Copy,
  Check,
  X,
  FileCode,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { RecoveryReportJson, downloadJsonReport, downloadTextReport } from '../utils/reportGenerator';

interface RecoveryReportModalProps {
  report: RecoveryReportJson | null;
  reportText: string;
  onClose: () => void;
}

export const RecoveryReportModal: React.FC<RecoveryReportModalProps> = ({
  report,
  reportText,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'text' | 'json'>('text');
  const [copied, setCopied] = useState(false);

  if (!report) return null;

  const handleCopy = () => {
    const content = activeTab === 'text' ? reportText : JSON.stringify(report, null, 2);
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="relative flex flex-col w-full max-w-4xl max-h-[90vh] rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden font-mono">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                AI File Fragment Recovery Report
              </h3>
              <p className="text-[11px] text-slate-400">
                Official Digital Forensics Reconstruction Audit Report
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => downloadJsonReport(report)}
              className="flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 transition cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download JSON</span>
            </button>

            <button
              onClick={() => downloadTextReport(reportText)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download TXT</span>
            </button>

            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tab switch & Copy */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/60 px-6 py-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('text')}
              className={`px-3 py-1 rounded text-xs transition ${
                activeTab === 'text'
                  ? 'bg-slate-800 text-cyan-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Formatted Plaintext Report
            </button>
            <button
              onClick={() => setActiveTab('json')}
              className={`px-3 py-1 rounded text-xs transition ${
                activeTab === 'json'
                  ? 'bg-slate-800 text-cyan-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Raw Forensic JSON
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-cyan-400 transition"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-950 text-slate-300 text-xs">
          {activeTab === 'text' ? (
            <pre className="whitespace-pre-wrap font-mono leading-relaxed select-all">
              {reportText}
            </pre>
          ) : (
            <pre className="whitespace-pre-wrap font-mono leading-relaxed text-cyan-300 select-all">
              {JSON.stringify(report, null, 2)}
            </pre>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 px-6 py-3 bg-slate-900/90 text-xs text-slate-400">
          <span>SHA-256 Hash of Reconstructed File: {report.reconstructedFileHash.slice(0, 16)}...</span>
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-1.5 text-xs text-slate-200 hover:bg-slate-700 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
