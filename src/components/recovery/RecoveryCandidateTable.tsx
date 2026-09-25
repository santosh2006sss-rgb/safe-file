import React, { useState, useMemo } from 'react';
import {
  FileText,
  Image as ImageIcon,
  Archive,
  Music,
  Video,
  Code2,
  Download,
  Eye,
  CheckCircle,
  AlertTriangle,
  Layers,
  Sparkles,
  ArrowRight,
  Search,
  Filter,
  ShieldCheck,
  Ban,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { RecoveryCandidate, CandidateValidationStatus, FileCategory } from '../../types/recovery';
import { formatBytes, downloadFile } from '../../utils/carver';

interface RecoveryCandidateTableProps {
  candidates: RecoveryCandidate[];
  onSelectCandidateForAI: (candidate: RecoveryCandidate) => void;
  onSendToIntegrity: (candidate: RecoveryCandidate) => void;
  onSendToReconstruction: (candidate: RecoveryCandidate) => void;
  onPreviewCandidate: (candidate: RecoveryCandidate) => void;
}

export const RecoveryCandidateTable: React.FC<RecoveryCandidateTableProps> = ({
  candidates,
  onSelectCandidateForAI,
  onSendToIntegrity,
  onSendToReconstruction,
  onPreviewCandidate,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      const matchesSearch =
        c.id.toLowerCase().includes(search.toLowerCase()) ||
        c.fileType.toLowerCase().includes(search.toLowerCase()) ||
        c.fileSignatureHex.toLowerCase().includes(search.toLowerCase()) ||
        c.sourceOffsetHex.toLowerCase().includes(search.toLowerCase()) ||
        c.extension.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === 'all' || c.validationStatus === statusFilter;
      const matchesCategory = categoryFilter === 'all' || c.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [candidates, search, statusFilter, categoryFilter]);

  const getStatusBadge = (status: CandidateValidationStatus) => {
    switch (status) {
      case 'Fully Recovered':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle className="h-3 w-3" />
            Fully Recovered
          </span>
        );
      case 'Partially Recovered':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <AlertTriangle className="h-3 w-3" />
            Partially Recovered
          </span>
        );
      case 'Fragmented':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <Layers className="h-3 w-3" />
            Fragmented
          </span>
        );
      case 'Corrupted':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <AlertTriangle className="h-3 w-3" />
            Corrupted
          </span>
        );
      case 'Unsupported':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/30">
            <Ban className="h-3 w-3" />
            Unsupported
          </span>
        );
    }
  };

  const getCategoryIcon = (category: FileCategory) => {
    switch (category) {
      case 'image':
        return <ImageIcon className="h-4 w-4 text-cyan-400" />;
      case 'document':
        return <FileText className="h-4 w-4 text-blue-400" />;
      case 'archive':
        return <Archive className="h-4 w-4 text-emerald-400" />;
      case 'audio':
        return <Music className="h-4 w-4 text-purple-400" />;
      case 'video':
        return <Video className="h-4 w-4 text-rose-400" />;
      case 'code':
        return <Code2 className="h-4 w-4 text-amber-400" />;
      default:
        return <FileText className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
        <div className="relative flex-1">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search candidate ID, signature, offset, or file format..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-800 bg-slate-950 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs font-mono text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Statuses ({candidates.length})</option>
            <option value="Fully Recovered">Fully Recovered</option>
            <option value="Partially Recovered">Partially Recovered</option>
            <option value="Fragmented">Fragmented</option>
            <option value="Corrupted">Corrupted</option>
            <option value="Unsupported">Unsupported</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs font-mono text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Formats</option>
            <option value="image">Images</option>
            <option value="document">Documents</option>
            <option value="archive">Archives</option>
            <option value="audio">Audio</option>
            <option value="video">Video</option>
            <option value="code">Executables / Code</option>
          </select>
        </div>
      </div>

      {/* Discovered Candidates Count and Notice */}
      <div className="flex items-center justify-between text-xs font-mono px-1">
        <span className="text-slate-400">
          Discovered Candidates: <span className="text-cyan-400 font-bold">{filteredCandidates.length}</span> of {candidates.length}
        </span>
        <span className="text-slate-500 hidden sm:inline">
          Deterministic principle: Magic byte match is never claimed as proof of complete file without boundary validation.
        </span>
      </div>

      {/* Candidate Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/70 shadow-lg">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-400 font-mono text-[11px] uppercase tracking-wider">
              <th className="py-3 px-3.5">Candidate ID</th>
              <th className="py-3 px-3.5">File Type</th>
              <th className="py-3 px-3.5">File Signature</th>
              <th className="py-3 px-3.5">Source Offset</th>
              <th className="py-3 px-3.5">Est. Size</th>
              <th className="py-3 px-3.5">Header Found</th>
              <th className="py-3 px-3.5">Footer Found</th>
              <th className="py-3 px-3.5">Confidence</th>
              <th className="py-3 px-3.5">Validation Status</th>
              <th className="py-3 px-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 font-mono text-[11px]">
            {filteredCandidates.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-8 text-center text-slate-500 font-mono">
                  No recovery candidates match the selected filters or search query.
                </td>
              </tr>
            ) : (
              filteredCandidates.map((c) => (
                <tr
                  key={c.id}
                  className="hover:bg-slate-900/60 transition group"
                >
                  {/* Candidate ID */}
                  <td className="py-3 px-3.5 font-bold text-cyan-400 whitespace-nowrap">
                    {c.id}
                  </td>

                  {/* File Type */}
                  <td className="py-3 px-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(c.category)}
                      <span className="text-slate-200 font-medium">{c.fileType}</span>
                      <span className="text-[10px] text-slate-500 uppercase">.{c.extension}</span>
                    </div>
                  </td>

                  {/* File Signature */}
                  <td className="py-3 px-3.5 whitespace-nowrap">
                    <span className="text-purple-300 font-mono bg-purple-950/30 px-1.5 py-0.5 rounded border border-purple-500/20 text-[10px]">
                      {c.fileSignatureHex}
                    </span>
                  </td>

                  {/* Source Offset */}
                  <td className="py-3 px-3.5 whitespace-nowrap">
                    <div>
                      <span className="text-slate-200 font-semibold">{c.sourceOffsetHex}</span>
                      <span className="block text-[10px] text-slate-500">
                        {c.sourceOffsetBytes.toLocaleString()} B · Cl #{c.clusterNumber}
                      </span>
                    </div>
                  </td>

                  {/* Estimated Size */}
                  <td className="py-3 px-3.5 whitespace-nowrap text-slate-300">
                    {formatBytes(c.estimatedSizeBytes)}
                  </td>

                  {/* Header Found */}
                  <td className="py-3 px-3.5 whitespace-nowrap">
                    {c.headerFound ? (
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold" title={c.headerSignature}>
                        <CheckCircle className="h-3 w-3" />
                        <span>Yes</span>
                      </span>
                    ) : (
                      <span className="text-slate-500">None</span>
                    )}
                  </td>

                  {/* Footer Found */}
                  <td className="py-3 px-3.5 whitespace-nowrap">
                    {c.footerFound ? (
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold" title={c.footerSignature}>
                        <CheckCircle className="h-3 w-3" />
                        <span>Yes</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-amber-400 font-semibold" title={c.footerSignature || 'Missing terminator'}>
                        <AlertTriangle className="h-3 w-3" />
                        <span>Missing</span>
                      </span>
                    )}
                  </td>

                  {/* Confidence */}
                  <td className="py-3 px-3.5 whitespace-nowrap">
                    <div className="w-24">
                      <div className="flex items-center justify-between text-[10px] mb-0.5">
                        <span className="font-bold text-slate-200">{c.recoveryConfidence}%</span>
                        <span className="text-slate-500">
                          {c.recoveryConfidence >= 90 ? 'High' : c.recoveryConfidence >= 60 ? 'Med' : 'Low'}
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            c.recoveryConfidence >= 90
                              ? 'bg-emerald-400'
                              : c.recoveryConfidence >= 60
                              ? 'bg-cyan-400'
                              : 'bg-amber-400'
                          }`}
                          style={{ width: `${c.recoveryConfidence}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>

                  {/* Validation Status */}
                  <td className="py-3 px-3.5 whitespace-nowrap">
                    {getStatusBadge(c.validationStatus)}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-3.5 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* AI Explain Button */}
                      <button
                        onClick={() => onSelectCandidateForAI(c)}
                        title="AI Forensic Classification & Reasoning"
                        className="p-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 transition"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                      </button>

                      {/* Send to Fragment Reassembly if fragmented */}
                      {c.isFragmented && (
                        <button
                          onClick={() => onSendToReconstruction(c)}
                          title="Send to Fragment Reassembly (Step 2)"
                          className="p-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 transition"
                        >
                          <Layers className="h-3.5 w-3.5" />
                        </button>
                      )}

                      {/* Verify Integrity Button (Step 3) */}
                      <button
                        onClick={() => onSendToIntegrity(c)}
                        title="Verify Recovered File Integrity (Step 3)"
                        className="p-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 transition"
                      >
                        <ShieldCheck className="h-3.5 w-3.5" />
                      </button>

                      {/* Export Carved File */}
                      <button
                        onClick={() => {
                          const syntheticFile = {
                            id: c.id,
                            filename: `carved_${c.id.toLowerCase()}.${c.extension}`,
                            originalPath: `Source: ${c.sourceName} @ ${c.sourceOffsetHex}`,
                            extension: c.extension,
                            category: c.category,
                            sizeBytes: c.estimatedSizeBytes,
                            deletedAt: new Date().toISOString(),
                            integrity: c.validationStatus === 'Fully Recovered' ? 'good' : 'fragmented',
                            integrityScore: c.recoveryConfidence,
                            clusterStart: c.clusterNumber,
                            clusterCount: Math.ceil(c.estimatedSizeBytes / 4096),
                            isFragmented: c.isFragmented,
                            magicHeader: c.fileSignatureHex,
                            mimeType: 'application/octet-stream',
                            entropy: c.entropy,
                            rawBinary: c.rawBinary,
                            recoveryNote: c.recoveryNote,
                          } as any;
                          downloadFile(syntheticFile);
                        }}
                        title="Export Write-Safe Carved File"
                        className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
