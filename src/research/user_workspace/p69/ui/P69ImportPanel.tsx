/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.9: Space Import Panel
 */

import React, { useState } from 'react';
import { Upload, FileCheck, AlertCircle } from 'lucide-react';
import { ImportResult } from '../types';

interface P69ImportPanelProps {
  lastImportResult: ImportResult | null;
  onImportPackage: (jsonString: string) => void;
}

export const P69ImportPanel: React.FC<P69ImportPanelProps> = ({
  lastImportResult,
  onImportPackage,
}) => {
  const [jsonInput, setJsonInput] = useState('');

  const handleImport = () => {
    if (!jsonInput.trim()) return;
    onImportPackage(jsonInput.trim());
  };

  return (
    <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800 font-mono text-[10px] space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="font-bold text-amber-400 flex items-center gap-1.5">
          <Upload className="w-3.5 h-3.5" /> IMPORT AS NEW SPACE
        </span>
      </div>

      <div className="space-y-1.5">
        <textarea
          rows={3}
          placeholder="Paste Research Export Package JSON..."
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
          className="w-full p-1.5 bg-black/50 border border-zinc-800 rounded text-zinc-200 text-[8px] focus:outline-none focus:border-amber-500 font-mono resize-none"
        />

        <button
          onClick={handleImport}
          className="w-full py-1 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 rounded border border-amber-500/30 flex items-center justify-center gap-1 text-[8.5px] cursor-pointer"
        >
          <Upload className="w-2.5 h-2.5" /> Validate & Import Space
        </button>
      </div>

      {lastImportResult && (
        <div
          className={`p-2 rounded border space-y-1 text-[8px] ${
            lastImportResult.success
              ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
              : 'bg-red-950/20 border-red-500/30 text-red-300'
          }`}
        >
          <div className="flex items-center gap-1 font-bold">
            {lastImportResult.success ? (
              <FileCheck className="w-3 h-3 text-emerald-400" />
            ) : (
              <AlertCircle className="w-3 h-3 text-red-400" />
            )}
            Status: {lastImportResult.validationReport.status}
          </div>
          {lastImportResult.importedSpace && (
            <div className="text-zinc-400">
              New Space ID: <span className="text-amber-400">{lastImportResult.importedSpace.spaceId}</span>
            </div>
          )}
          {lastImportResult.validationReport.issues.length > 0 && (
            <div className="text-[7.5px] text-red-400">
              {lastImportResult.validationReport.issues.join(', ')}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
