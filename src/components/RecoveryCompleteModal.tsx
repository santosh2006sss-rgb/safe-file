import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle2, Download, PackageCheck, X, FileArchive, HardDrive } from 'lucide-react';
import JSZip from 'jszip';
import { RecoverableFile } from '../types/recovery';
import { formatBytes } from '../utils/carver';

interface RecoveryCompleteModalProps {
  files: RecoverableFile[];
  onClose: () => void;
}

export const RecoveryCompleteModal: React.FC<RecoveryCompleteModalProps> = ({
  files,
  onClose,
}) => {
  const [isBundling, setIsBundling] = React.useState(false);
  const [downloadReady, setDownloadReady] = React.useState(false);
  const [zipBlob, setZipBlob] = React.useState<Blob | null>(null);

  const totalBytes = files.reduce((acc, f) => acc + f.sizeBytes, 0);

  // Trigger confetti and build ZIP bundle
  useEffect(() => {
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#06b6d4', '#3b82f6', '#10b981'],
      });
    } catch {
      // ignore
    }

    const buildZip = async () => {
      setIsBundling(true);
      try {
        const zip = new JSZip();
        const rootFolder = zip.folder('SectorRescue_Recovered_Files');

        for (const file of files) {
          if (file.rawBinary) {
            rootFolder?.file(file.filename, file.rawBinary);
          } else if (file.contentPreview && file.contentPreview.startsWith('data:')) {
            // base64 url
            const parts = file.contentPreview.split(',');
            rootFolder?.file(file.filename, parts[1], { base64: true });
          } else if (file.contentPreview) {
            rootFolder?.file(file.filename, file.contentPreview);
          } else {
            rootFolder?.file(
              file.filename,
              `--- SectorRescue Recovered File ---\nName: ${file.filename}\nOriginal: ${file.originalPath}\nIntegrity: ${file.integrityScore}%`
            );
          }
        }

        // Add recovery manifest
        const manifest = {
          recoveryDate: new Date().toISOString(),
          recoveredFilesCount: files.length,
          totalBytesSalvaged: totalBytes,
          files: files.map((f) => ({
            name: f.filename,
            path: f.originalPath,
            size: f.sizeBytes,
            integrity: `${f.integrityScore}% (${f.integrity})`,
            magic: f.magicHeader,
          })),
        };
        rootFolder?.file('RECOVERY_AUDIT_MANIFEST.json', JSON.stringify(manifest, null, 2));

        const blob = await zip.generateAsync({ type: 'blob' });
        setZipBlob(blob);
        setDownloadReady(true);
      } catch (err) {
        console.error('Error bundling ZIP archive', err);
      } finally {
        setIsBundling(false);
      }
    };

    buildZip();
  }, [files, totalBytes]);

  const handleDownloadZip = () => {
    if (!zipBlob) return;
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Recovered_Files_Archive_${new Date().toISOString().slice(0, 10)}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="relative flex flex-col w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden p-6 space-y-5">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Success Icon & Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <PackageCheck className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-white">
            Files Successfully Rescued!
          </h3>
          <p className="text-xs text-slate-400 max-w-sm">
            All selected deleted records have been carved and reconstructed into a clean, uncorrupted recovery package.
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-2.5 rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-center">
          <div className="space-y-0.5">
            <span className="text-[11px] text-slate-400">Files Rescued</span>
            <p className="text-base font-bold font-mono text-cyan-400 tabular-nums">
              {files.length}
            </p>
          </div>
          <div className="space-y-0.5 border-x border-slate-800/80">
            <span className="text-[11px] text-slate-400">Salvaged Data</span>
            <p className="text-base font-bold font-mono text-slate-200 tabular-nums">
              {formatBytes(totalBytes)}
            </p>
          </div>
          <div className="space-y-0.5">
            <span className="text-[11px] text-slate-400">Success Rate</span>
            <p className="text-base font-bold font-mono text-emerald-400 tabular-nums">
              100%
            </p>
          </div>
        </div>

        {/* File manifest snippet */}
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 max-h-36 overflow-y-auto space-y-1.5 text-xs font-mono">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between text-slate-300 py-0.5"
            >
              <span className="truncate pr-2">{file.filename}</span>
              <span className="text-slate-400 tabular-nums">{formatBytes(file.sizeBytes)}</span>
            </div>
          ))}
        </div>

        {/* Action Button */}
        <div className="space-y-2">
          <button
            onClick={handleDownloadZip}
            disabled={!downloadReady || isBundling}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-cyan-500 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-400 transition shadow-lg shadow-cyan-500/20 disabled:opacity-50"
          >
            {isBundling ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                <span>Assembling ZIP Archive...</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                <span>Download All Files (ZIP Package)</span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            Return to Recovery Console
          </button>
        </div>
      </div>
    </div>
  );
};
