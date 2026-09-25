import React, { useState, useMemo } from 'react';
import {
  FileText,
  Image as ImageIcon,
  Archive,
  Code2,
  Database,
  Music,
  Download,
  Eye,
  Search,
  CheckSquare,
  Square,
  ArrowUpDown,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { RecoverableFile, FileCategory } from '../types/recovery';
import { formatBytes, downloadFile } from '../utils/carver';

interface FileListProps {
  files: RecoverableFile[];
  selectedFileIds: Set<string>;
  onToggleSelect: (fileId: string) => void;
  onSelectAll: (fileIds: string[]) => void;
  onClearSelect: () => void;
  onOpenFilePreview: (file: RecoverableFile) => void;
  onRecoverSingle: (file: RecoverableFile) => void;
}

export const FileList: React.FC<FileListProps> = ({
  files,
  selectedFileIds,
  onToggleSelect,
  onSelectAll,
  onClearSelect,
  onOpenFilePreview,
  onRecoverSingle,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<FileCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'size' | 'integrity' | 'date'>('integrity');
  const [sortAsc, setSortAsc] = useState(false);

  // Filtered & Sorted files
  const filteredFiles = useMemo(() => {
    return files
      .filter((file) => {
        const matchesCategory =
          selectedCategory === 'all' || file.category === selectedCategory;
        const matchesSearch =
          file.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
          file.originalPath.toLowerCase().includes(searchQuery.toLowerCase()) ||
          file.extension.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortBy === 'name') {
          diff = a.filename.localeCompare(b.filename);
        } else if (sortBy === 'size') {
          diff = a.sizeBytes - b.sizeBytes;
        } else if (sortBy === 'integrity') {
          diff = a.integrityScore - b.integrityScore;
        } else if (sortBy === 'date') {
          diff = a.deletedAt.localeCompare(b.deletedAt);
        }
        return sortAsc ? diff : -diff;
      });
  }, [files, selectedCategory, searchQuery, sortBy, sortAsc]);

  const allFilteredSelected =
    filteredFiles.length > 0 &&
    filteredFiles.every((f) => selectedFileIds.has(f.id));

  const handleSelectAllToggle = () => {
    if (allFilteredSelected) {
      onClearSelect();
    } else {
      onSelectAll(filteredFiles.map((f) => f.id));
    }
  };

  const getCategoryIcon = (category: FileCategory) => {
    switch (category) {
      case 'image':
        return <ImageIcon className="h-4 w-4 text-cyan-400" />;
      case 'document':
        return <FileText className="h-4 w-4 text-blue-400" />;
      case 'code':
        return <Code2 className="h-4 w-4 text-amber-400" />;
      case 'database':
        return <Database className="h-4 w-4 text-purple-400" />;
      case 'archive':
        return <Archive className="h-4 w-4 text-emerald-400" />;
      case 'audio':
      case 'video':
        return <Music className="h-4 w-4 text-rose-400" />;
      default:
        return <FileText className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Category Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Category Tabs (Segmented Controls) */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg overflow-x-auto max-w-full">
          {(
            [
              { id: 'all', label: 'All Files', count: files.length },
              { id: 'image', label: 'Images', count: files.filter((f) => f.category === 'image').length },
              { id: 'document', label: 'Documents', count: files.filter((f) => f.category === 'document').length },
              { id: 'code', label: 'Code & Scripts', count: files.filter((f) => f.category === 'code').length },
              { id: 'database', label: 'Databases', count: files.filter((f) => f.category === 'database').length },
              { id: 'archive', label: 'Archives', count: files.filter((f) => f.category === 'archive').length },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id as FileCategory)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                selectedCategory === tab.id
                  ? 'bg-slate-800 text-cyan-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              <span className="font-mono text-[10px] text-slate-400 tabular-nums">
                ({tab.count})
              </span>
            </button>
          ))}
        </div>

        {/* Live Search */}
        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Filter by name, path or extension..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-900/90 pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-400 focus:border-cyan-500/60 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 font-mono"
          />
        </div>
      </div>

      {/* Main Files Table */}
      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-400 font-mono text-[11px]">
                <th className="w-10 px-3 py-2.5 text-center">
                  <button
                    onClick={handleSelectAllToggle}
                    className="text-slate-400 hover:text-cyan-400 transition"
                    title={allFilteredSelected ? 'Deselect all' : 'Select all'}
                  >
                    {allFilteredSelected ? (
                      <CheckSquare className="h-4 w-4 text-cyan-400" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </button>
                </th>

                <th
                  onClick={() => {
                    if (sortBy === 'name') setSortAsc(!sortAsc);
                    else {
                      setSortBy('name');
                      setSortAsc(true);
                    }
                  }}
                  className="px-4 py-2.5 font-medium cursor-pointer hover:text-slate-200 transition"
                >
                  <div className="flex items-center gap-1.5">
                    <span>File Name & Path</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>

                <th
                  onClick={() => {
                    if (sortBy === 'size') setSortAsc(!sortAsc);
                    else {
                      setSortBy('size');
                      setSortAsc(false);
                    }
                  }}
                  className="px-4 py-2.5 font-medium cursor-pointer hover:text-slate-200 transition text-right"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Size</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>

                <th
                  onClick={() => {
                    if (sortBy === 'date') setSortAsc(!sortAsc);
                    else {
                      setSortBy('date');
                      setSortAsc(false);
                    }
                  }}
                  className="px-4 py-2.5 font-medium cursor-pointer hover:text-slate-200 transition hidden md:table-cell"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Deleted Date</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>

                <th
                  onClick={() => {
                    if (sortBy === 'integrity') setSortAsc(!sortAsc);
                    else {
                      setSortBy('integrity');
                      setSortAsc(false);
                    }
                  }}
                  className="px-4 py-2.5 font-medium cursor-pointer hover:text-slate-200 transition"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Recovery Health</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>

                <th className="px-4 py-2.5 font-medium text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredFiles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <p className="text-sm">No deleted files match the current criteria.</p>
                    <p className="text-xs text-slate-400 mt-1 font-mono">
                      Try running a Deep Scan or clearing the search query.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredFiles.map((file) => {
                  const isSelected = selectedFileIds.has(file.id);

                  return (
                    <tr
                      key={file.id}
                      className={`group transition-colors ${
                        isSelected
                          ? 'bg-cyan-950/20 hover:bg-cyan-950/30'
                          : 'hover:bg-slate-800/50'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="px-3 py-2.5 text-center">
                        <button
                          onClick={() => onToggleSelect(file.id)}
                          className="text-slate-400 hover:text-cyan-400 transition"
                        >
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4 text-cyan-400" />
                          ) : (
                            <Square className="h-4 w-4 text-slate-600 group-hover:text-slate-400" />
                          )}
                        </button>
                      </td>

                      {/* File Name & Path */}
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="flex-shrink-0">
                            {getCategoryIcon(file.category)}
                          </div>
                          <div className="min-w-0">
                            <button
                              onClick={() => onOpenFilePreview(file)}
                              className="text-slate-200 font-medium hover:text-cyan-300 transition text-left truncate block max-w-xs sm:max-w-md"
                            >
                              {file.filename}
                            </button>
                            <span className="text-[11px] text-slate-400 font-mono truncate block max-w-xs sm:max-w-sm">
                              {file.originalPath}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* File Size */}
                      <td className="px-4 py-2.5 text-right font-mono text-slate-300 tabular-nums">
                        {formatBytes(file.sizeBytes)}
                      </td>

                      {/* Deleted Date */}
                      <td className="px-4 py-2.5 text-slate-400 font-mono text-[11px] hidden md:table-cell tabular-nums">
                        {file.deletedAt}
                      </td>

                      {/* Integrity Score */}
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`flex items-center gap-1 font-mono text-xs font-semibold tabular-nums ${
                              file.integrityScore >= 95
                                ? 'text-emerald-400'
                                : file.integrityScore >= 80
                                ? 'text-cyan-400'
                                : 'text-amber-400'
                            }`}
                          >
                            {file.integrityScore >= 90 ? (
                              <CheckCircle className="h-3.5 w-3.5" />
                            ) : (
                              <AlertTriangle className="h-3.5 w-3.5" />
                            )}
                            <span>{file.integrityScore}%</span>
                          </span>

                          <span className="text-[11px] text-slate-400 font-sans capitalize hidden sm:inline">
                            · {file.integrity}
                          </span>
                        </div>
                      </td>

                      {/* Action buttons */}
                      <td className="px-4 py-2.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onOpenFilePreview(file)}
                            className="flex items-center gap-1 rounded border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-slate-300 hover:border-slate-600 hover:text-white transition text-xs"
                            title="Inspect preview, hex dump, and cluster metadata"
                          >
                            <Eye className="h-3 w-3" />
                            <span className="hidden sm:inline">Inspect</span>
                          </button>

                          <button
                            onClick={() => {
                              onRecoverSingle(file);
                              downloadFile(file);
                            }}
                            className="flex items-center gap-1 rounded bg-cyan-600/90 px-2.5 py-1 text-white hover:bg-cyan-500 transition text-xs font-medium"
                            title="Save and download recovered file"
                          >
                            <Download className="h-3 w-3" />
                            <span>Save</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
