import React, { useState } from 'react';
import { X, Download, Copy, Check, FileText, Code2, ShieldCheck, Printer } from 'lucide-react';
import { IntegrityVerificationReport } from '../../types/integrity';
import { generateIntegrityReportText, downloadFile } from '../../utils/integrityReportGenerator';

interface IntegrityReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: IntegrityVerificationReport;
}

export const IntegrityReportModal: React.FC<IntegrityReportModalProps> = ({
  isOpen,
  onClose,
  report,
}) => {
  const [activeTab, setActiveTab] = useState<'formatted' | 'json'>('formatted');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const formattedText = generateIntegrityReportText(report);
  const jsonString = JSON.stringify(report, null, 2);

  const handleCopy = () => {
    const textToCopy = activeTab === 'formatted' ? formattedText : jsonString;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    downloadFile(formattedText, `${report.reportId}_forensic_report.txt`, 'text/plain');
  };

  const handleDownloadJson = () => {
    downloadFile(jsonString, `${report.reportId}_audit_data.json`, 'application/json');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                Forensic Integrity Verification Report
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                <span>ID: {report.reportId}</span>
                <span>•</span>
                <span>Status: <strong className="text-emerald-400">{report.statusTitle}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
              title="Print Report"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-2.5 border-b border-slate-800 bg-slate-900/60 text-xs">
          <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveTab('formatted')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all font-medium ${
                activeTab === 'formatted'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" /> Formatted Text
            </button>
            <button
              onClick={() => setActiveTab('json')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all font-medium ${
                activeTab === 'json'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" /> JSON Data
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Copy Text
                </>
              )}
            </button>
            <button
              onClick={handleDownloadTxt}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Download TXT
            </button>
            <button
              onClick={handleDownloadJson}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Download JSON
            </button>
          </div>
        </div>

        {/* Content Viewer */}
        <div className="flex-1 p-6 overflow-y-auto bg-slate-950 font-mono text-xs text-slate-300 leading-relaxed select-text">
          <pre className="whitespace-pre-wrap">
            {activeTab === 'formatted' ? formattedText : jsonString}
          </pre>
        </div>

        {/* Bottom Footer Notice */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Digital forensics chain of custody audit document.</span>
          <span className="text-cyan-400 font-mono">Engine: AI-Assisted Integrity Verifier v2.4</span>
        </div>
      </div>
    </div>
  );
};
