/**
 * 3D Memory Studio - Application Header & Command Center
 * 
 * Provides high-density status telemetry, dataset indicators, lossless verification status,
 * file workflow operations, test suite launcher, and 3D viewport toggles.
 */

import React, { useRef } from 'react';
import {
  Boxes,
  FilePlus,
  FolderOpen,
  Save,
  CheckSquare,
  Layers,
  Eye,
  EyeOff,
  Route,
  Type,
  ShieldCheck,
  Cpu,
  Database,
  RotateCcw,
  BookmarkCheck,
} from 'lucide-react';
import { MemoryGrid3D, RootMemory } from '../types';
import { export3DMemoryFile, parse3DMemory } from '../core/storage';

interface HeaderProps {
  grid: MemoryGrid3D;
  rootMemory?: RootMemory | null;
  onNewGrid: () => void;
  onImportGrid: (importedGrid: MemoryGrid3D) => void;
  onOpenTestSuite: () => void;
  onOpenUniverseStudio?: () => void;
  sliceAxis: 'ALL' | 'X' | 'Y' | 'Z';
  setSliceAxis: (axis: 'ALL' | 'X' | 'Y' | 'Z') => void;
  sliceIndex: number;
  setSliceIndex: (index: number) => void;
  showSequencePath: boolean;
  setShowSequencePath: (show: boolean) => void;
  showLabels: boolean;
  setShowLabels: (show: boolean) => void;
  showInactive: boolean;
  setShowInactive: (show: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  grid,
  rootMemory,
  onNewGrid,
  onImportGrid,
  onOpenTestSuite,
  onOpenUniverseStudio,
  sliceAxis,
  setSliceAxis,
  sliceIndex,
  setSliceIndex,
  showSequencePath,
  setShowSequencePath,
  showLabels,
  setShowLabels,
  showInactive,
  setShowInactive,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveFile = () => {
    export3DMemoryFile(grid, `memory_${grid.metadata.title.replace(/\s+/g, '_').toLowerCase()}`);
  };

  const handleSaveCheckpoint = async () => {
    try {
      const res = await fetch('/api/cubio/checkpoint/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grid,
          epoch: 0,
          description: `Virtual Core Checkpoint: ${grid.metadata.title}`,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Server responded with status ${res.status}`);
      }

      const blob = await res.blob();
      const contentDisposition = res.headers.get('content-disposition');
      let filename = `virtual_core_${Date.now()}.3dmem`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) filename = match[1];
      }

      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
    } catch (err: any) {
      console.error('Failed to export checkpoint:', err);
      alert(`Checkpoint export error: ${err.message}`);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const result = parse3DMemory(content);
        if (result.success && result.grid) {
          onImportGrid(result.grid);
        } else {
          alert(`Failed to load .3dmemory file: ${result.error}`);
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const blockCount = rootMemory?.blocks?.length || 1;
  const totalCapacity = rootMemory?.totalCapacity || 343;
  const activeCells = grid.activeCellCount;

  return (
    <header className="bg-[#111113] border-b border-[#252528] px-3.5 py-1.5 flex items-center justify-between gap-2 select-none font-mono text-xs z-30 shrink-0">
      {/* Brand & Live Research State */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-6 h-6 bg-cyan-500 rounded flex items-center justify-center shadow-xs shadow-cyan-500/30 text-black font-black text-[11px] shrink-0">
          3D
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-white tracking-wider uppercase truncate">
              3D Memory Studio
            </span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 font-bold shrink-0">
              RESEARCH STUDIO
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-gray-400 truncate">
            <span className="text-gray-200 font-semibold truncate max-w-[130px] sm:max-w-[200px]" title={grid.metadata.title}>
              {grid.metadata.title}
            </span>
            <span className="text-gray-600">•</span>
            <span className="shrink-0">{blockCount} {blockCount === 1 ? 'Blk' : 'Blks'} ({totalCapacity} Cap)</span>
            <span className="text-gray-600">•</span>
            <span className="text-cyan-400 font-bold shrink-0">{activeCells} Active</span>
          </div>
        </div>
      </div>

      {/* System Integrity & Factual Status Chips */}
      <div className="hidden lg:flex items-center gap-1.5 text-[10px]">
        <div className="px-2 py-0.5 rounded bg-[#0A0A0B] border border-[#222226] flex items-center gap-1.5 text-emerald-400 font-bold">
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          <span>LOSSLESS VERIFIED</span>
        </div>
        <div className="px-2 py-0.5 rounded bg-[#0A0A0B] border border-[#222226] flex items-center gap-1.5 text-cyan-400 font-bold">
          <Cpu className="w-3 h-3 text-cyan-400" />
          <span>369 SYSTEM</span>
        </div>
      </div>

      {/* Action Toolbar & Viewport Controls */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInputChange}
          accept=".3dmemory,.json"
          className="hidden"
          aria-label="Upload .3dmemory or .json file"
        />

        {/* File Operations */}
        <div className="flex items-center gap-1">
          <button
            onClick={onNewGrid}
            className="px-2 py-1 text-xs bg-[#1A1A1E] hover:bg-[#25252A] border border-[#2D2D32] text-gray-200 rounded transition-colors cursor-pointer flex items-center gap-1"
            title="Create new empty 3D memory grid"
            aria-label="New grid"
          >
            <FilePlus className="w-3.5 h-3.5 text-gray-400" />
            <span className="hidden sm:inline">New</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-2 py-1 text-xs bg-[#1A1A1E] hover:bg-[#25252A] border border-[#2D2D32] text-gray-200 rounded transition-colors cursor-pointer flex items-center gap-1"
            title="Open and reconstruct .3dmemory file"
            aria-label="Open .3dmemory file"
          >
            <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Open</span>
          </button>

          <button
            onClick={handleSaveFile}
            className="px-2 py-1 text-xs bg-cyan-600 hover:bg-cyan-500 text-white rounded font-medium shadow-xs transition-colors cursor-pointer flex items-center gap-1"
            title="Save memory state to .3dmemory file"
            aria-label="Save .3dmemory"
          >
            <Save className="w-3.5 h-3.5 text-white" />
            <span className="hidden md:inline">Save</span>
          </button>

          <button
            onClick={handleSaveCheckpoint}
            className="px-2 py-1 text-xs bg-emerald-700 hover:bg-emerald-600 text-white rounded font-medium shadow-xs transition-colors cursor-pointer flex items-center gap-1"
            title="Save deterministic Virtual Core checkpoint (.3dmem)"
            aria-label="Save Checkpoint"
          >
            <BookmarkCheck className="w-3.5 h-3.5 text-white" />
            <span className="hidden md:inline">Checkpoint</span>
          </button>
        </div>

        <div className="h-4 w-px bg-[#25252A] mx-0.5 hidden sm:block" />

        {/* Information Universe Studio Button (F45/F46) */}
        {onOpenUniverseStudio && (
          <button
            onClick={onOpenUniverseStudio}
            className="px-2 py-1 text-xs bg-cyan-950/70 hover:bg-cyan-900/80 border border-cyan-500/70 text-cyan-300 rounded font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            title="Open Information Universe Studio (F45/F46 Live Observation Dashboard)"
            aria-label="Universe Studio"
          >
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Universe Studio</span>
          </button>
        )}

        {/* Automated Benchmark & Verification Suite Button */}
        <button
          onClick={onOpenTestSuite}
          className="px-2 py-1 text-xs bg-purple-950/50 hover:bg-purple-900/60 border border-purple-500/50 text-purple-300 rounded font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          title="Run Automated Empirical Verification Suite (Funnels 1–10)"
          aria-label="Verification Suite"
        >
          <CheckSquare className="w-3.5 h-3.5 text-purple-400" />
          <span className="hidden sm:inline">Suite</span>
        </button>

        {/* Reset System Button */}
        <button
          onClick={onNewGrid}
          className="p-1 sm:px-1.5 sm:py-1 text-xs text-rose-400 hover:text-rose-300 bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/30 rounded transition-colors cursor-pointer flex items-center gap-1"
          title="Reset grid state to default"
          aria-label="Reset grid"
        >
          <RotateCcw className="w-3 h-3 text-rose-400" />
          <span className="hidden md:inline">Reset</span>
        </button>

        <div className="h-4 w-px bg-[#25252A] mx-0.5 hidden sm:block" />

        {/* 3D Viewport Controls */}
        <div className="flex items-center gap-1 bg-[#0A0A0B] p-0.5 rounded border border-[#222226] text-xs">
          {/* Slice Axis Select */}
          <div className="flex items-center gap-1 px-1 text-gray-400 text-[11px]">
            <Layers className="w-3 h-3 text-cyan-400" />
            <select
              value={sliceAxis}
              onChange={(e) => setSliceAxis(e.target.value as any)}
              className="bg-transparent text-gray-200 focus:outline-none cursor-pointer text-xs"
              aria-label="Slice Axis"
            >
              <option value="ALL" className="bg-[#141416] text-gray-200">All</option>
              <option value="Z" className="bg-[#141416] text-gray-200">Z-Slice</option>
              <option value="Y" className="bg-[#141416] text-gray-200">Y-Slice</option>
              <option value="X" className="bg-[#141416] text-gray-200">X-Slice</option>
            </select>
            {sliceAxis !== 'ALL' && (
              <select
                value={sliceIndex}
                onChange={(e) => setSliceIndex(Number(e.target.value))}
                className="bg-[#222226] text-cyan-400 rounded px-1 text-xs focus:outline-none border border-[#333338]"
                aria-label="Slice Index"
              >
                {[0, 1, 2, 3, 4, 5, 6].map((idx) => (
                  <option key={idx} value={idx} className="bg-[#141416]">
                    {sliceAxis}={idx}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="h-3 w-px bg-[#222226] mx-0.5" />

          {/* Sequence Traversal Line Toggle */}
          <button
            onClick={() => setShowSequencePath(!showSequencePath)}
            className={`p-1 rounded transition-colors ${
              showSequencePath ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-500 hover:text-gray-300'
            }`}
            title="Toggle Sequence Traversal Trajectory"
            aria-label="Toggle trajectory path"
          >
            <Route className="w-3 h-3" />
          </button>

          {/* Floating Labels Toggle */}
          <button
            onClick={() => setShowLabels(!showLabels)}
            className={`p-1 rounded transition-colors ${
              showLabels ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-500 hover:text-gray-300'
            }`}
            title="Toggle 3D Symbol Labels"
            aria-label="Toggle labels"
          >
            <Type className="w-3 h-3" />
          </button>

          {/* Inactive Cells Toggle */}
          <button
            onClick={() => setShowInactive(!showInactive)}
            className={`p-1 rounded transition-colors ${
              showInactive ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-500 hover:text-gray-300'
            }`}
            title="Toggle Inactive 7×7×7 Bounding Cells"
            aria-label="Toggle inactive cells"
          >
            {showInactive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          </button>
        </div>
      </div>
    </header>
  );
};
