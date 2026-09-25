import React, { useState } from 'react';
import { TerminalSquare, Copy, Check, ShieldAlert, Laptop, Info } from 'lucide-react';

export const NativeOsCommands: React.FC = () => {
  const [selectedOS, setSelectedOS] = useState<'windows' | 'macos' | 'linux'>('windows');
  const [sourceDrive, setSourceDrive] = useState('C:');
  const [destDrive, setDestDrive] = useState('D:\\RecoveredFiles');
  const [fileFilter, setFileFilter] = useState('*.docx');
  const [winfrMode, setWinfrMode] = useState<'regular' | 'extensive'>('regular');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const getWindowsCommands = () => [
    {
      title: '1. Official Microsoft Windows File Recovery (winfr)',
      description:
        'Microsoft command-line utility built into Windows 10/11. Scans MFT records and unallocated clusters.',
      command: `winfr ${sourceDrive} ${destDrive} /${winfrMode} /n ${fileFilter}`,
      notes:
        'Always set the destination to a DIFFERENT physical drive or partition to avoid overwriting lost sectors.',
    },
    {
      title: '2. Volume Shadow Copy (VSS) Instant Snapshot Restore',
      description:
        'Inspect and restore previous versions of files captured in Windows background system shadow copies.',
      command: `vssadmin list shadows /for=${sourceDrive}\n# Mount snapshot in read-only link:\nmklink /d C:\\ShadowMount \\\\?\\GLOBALROOT\\Device\\HarddiskVolumeShadowCopy1\\`,
      notes:
        'Run Command Prompt as Administrator. Allows instant recovery of files before they were deleted or overwritten.',
    },
    {
      title: '3. Unhide Hidden & Corrupted Drive Attributes (USB / External)',
      description:
        'Removes hidden, system, and read-only attributes if files were marked as deleted or hidden by system errors.',
      command: `attrib -h -r -s /s /d ${sourceDrive}\\*.*`,
      notes: 'Frequently restores lost files on USB thumb drives and SD cards.',
    },
  ];

  const getMacCommands = () => [
    {
      title: '1. APFS Local Snapshot Recovery (Time Machine without external drive)',
      description:
        'macOS APFS file system frequently retains local hourly snapshots before deletion occurred.',
      command: `tmutil listlocalsnapshots /\n# Mount the latest snapshot to examine:\nsudo mount_apfs -s com.apple.TimeMachine.2026-03-24-180000.local /Volumes/SnapshotMount`,
      notes: 'Navigate to /Volumes/SnapshotMount to copy deleted files out intact.',
    },
    {
      title: '2. Open-Source PhotoRec / TestDisk Carving CLI',
      description: 'Carves raw disk blocks for 480+ file signatures on macOS.',
      command: `brew install testdisk\nsudo photorec /cmd /dev/disk2 search`,
      notes:
        'Run in Terminal. Use diskutil list to verify your target disk identifier first.',
    },
  ];

  const getLinuxCommands = () => [
    {
      title: '1. ext4magic Inode Rescuer (ext3/ext4 filesystems)',
      description:
        'Recovers recently deleted files using ext4 journal transaction logs.',
      command: `sudo ext4magic /dev/sdb1 -m -d /mnt/recovery_target\n# Or recover specific file path:\nsudo ext4magic /dev/sdb1 -r -f "username/Documents" -d /mnt/recovery_target`,
      notes:
        'Works best when run immediately after deletion before journal blocks are recycled.',
    },
    {
      title: '2. PhotoRec Raw Block Carver (Linux CLI)',
      description: 'Sector-by-sector carving independent of filesystem corruptions.',
      command: `sudo apt-get install testdisk\nsudo photorec /cmd /dev/sdb1 search`,
      notes: 'Outputs all recovered documents and images to target destination.',
    },
  ];

  const currentCommands =
    selectedOS === 'windows'
      ? getWindowsCommands()
      : selectedOS === 'macos'
      ? getMacCommands()
      : getLinuxCommands();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-3">
        <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
          <TerminalSquare className="h-4 w-4 text-cyan-400" />
          <span>Native Operating System Recovery Commands</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Step-by-step commands to safely undelete and carve files directly on your Windows, macOS, or Linux machine.
        </p>
      </div>

      {/* Critical Safety Advisory */}
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs">
        <div className="flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-semibold text-amber-200">
              Golden Rule of File Recovery: Avoid Sector Overwrite
            </h4>
            <p className="text-amber-300/80 leading-relaxed">
              When a file is deleted, the operating system marks its clusters as "free space", but the raw bytes remain until overwritten.
              <strong> Never save recovered files to the same partition you are recovering from!</strong> Always connect a secondary USB drive or secondary partition.
            </p>
          </div>
        </div>
      </div>

      {/* OS Selector Tabs */}
      <div className="flex items-center gap-2 p-1 bg-slate-900 border border-slate-800 rounded-lg w-fit">
        {(
          [
            { id: 'windows', label: 'Windows 10 / 11' },
            { id: 'macos', label: 'macOS (APFS)' },
            { id: 'linux', label: 'Linux (ext4 / Btrfs)' },
          ] as const
        ).map((os) => (
          <button
            key={os.id}
            onClick={() => setSelectedOS(os.id)}
            className={`px-4 py-1.5 text-xs font-medium rounded-md transition-colors ${
              selectedOS === os.id
                ? 'bg-slate-800 text-cyan-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {os.label}
          </button>
        ))}
      </div>

      {/* Interactive Options if Windows */}
      {selectedOS === 'windows' && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Configure Command Parameters
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 text-[11px]">Source Drive</label>
              <input
                type="text"
                value={sourceDrive}
                onChange={(e) => setSourceDrive(e.target.value)}
                className="w-full rounded bg-slate-950 border border-slate-800 px-2.5 py-1.5 font-mono text-cyan-400 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 text-[11px]">Safe Target Destination</label>
              <input
                type="text"
                value={destDrive}
                onChange={(e) => setDestDrive(e.target.value)}
                className="w-full rounded bg-slate-950 border border-slate-800 px-2.5 py-1.5 font-mono text-cyan-400 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 text-[11px]">File Filter / Extension</label>
              <input
                type="text"
                value={fileFilter}
                onChange={(e) => setFileFilter(e.target.value)}
                className="w-full rounded bg-slate-950 border border-slate-800 px-2.5 py-1.5 font-mono text-cyan-400 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 text-[11px]">Scan Mode</label>
              <select
                value={winfrMode}
                onChange={(e) => setWinfrMode(e.target.value as 'regular' | 'extensive')}
                className="w-full rounded bg-slate-950 border border-slate-800 px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="regular">Regular (NTFS Fast)</option>
                <option value="extensive">Extensive (Formatted / RAW)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Generated Commands List */}
      <div className="space-y-4">
        {currentCommands.map((item, idx) => (
          <div
            key={idx}
            className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-2.5"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-200">{item.title}</h3>
                <p className="text-xs text-slate-400">{item.description}</p>
              </div>

              <button
                onClick={() => handleCopy(item.command, idx)}
                className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-700 transition"
              >
                {copiedIndex === idx ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy Command</span>
                  </>
                )}
              </button>
            </div>

            <div className="relative rounded-lg bg-slate-950 border border-slate-800/80 p-3 font-mono text-xs text-cyan-300 overflow-x-auto">
              <pre className="whitespace-pre-wrap">{item.command}</pre>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <Info className="h-3 w-3 text-cyan-400" />
              <span>{item.notes}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
