/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.1: Workspace Control Panel
 */

import React, { useState } from 'react';
import { WorkspaceManager } from '../workspaceState';
import { WorkspaceDimension } from '../types';
import {
  Plus,
  Copy,
  Trash2,
  RotateCcw,
  Undo2,
  Redo2,
  Camera,
  Download,
  Upload,
  Database,
  Layers,
  Sliders,
  Sparkles,
} from 'lucide-react';

interface P61WorkspacePanelProps {
  manager: WorkspaceManager;
  onRefresh: () => void;
}

export const P61WorkspacePanel: React.FC<P61WorkspacePanelProps> = ({
  manager,
  onRefresh,
}) => {
  const selectedObj = manager.getSelectedObject();
  const [editX, setEditX] = useState<number>(selectedObj ? selectedObj.position[0] : 0);
  const [editY, setEditY] = useState<number>(selectedObj ? selectedObj.position[1] : 0);
  const [editZ, setEditZ] = useState<number>(selectedObj ? selectedObj.position[2] : 0);

  // Sync edits on selected object change
  React.useEffect(() => {
    if (selectedObj) {
      setEditX(selectedObj.position[0]);
      setEditY(selectedObj.position[1]);
      setEditZ(selectedObj.position[2]);
    }
  }, [selectedObj?.id, selectedObj?.position[0], selectedObj?.position[1], selectedObj?.position[2]]);

  const handleApplyCoordinates = () => {
    if (!selectedObj) return;
    manager.moveObject(selectedObj.id, [Number(editX), Number(editY), Number(editZ)]);
    onRefresh();
  };

  const handleAddObject = () => {
    const nextIdx = manager.reality.objects.length + 1;
    manager.addObject({
      label: `Object ${String.fromCharCode(65 + (nextIdx % 26))}_${nextIdx}`,
      position: [5 + nextIdx * 2, 3 + (nextIdx % 5) * 2, 6 + (nextIdx % 3) * 3],
      category: 'USER_CREATED',
      color: '#06b6d4',
      radius: 8,
      isCanonicalCopy: false,
      metadata: { createdByUser: true },
    });
    onRefresh();
  };

  const handleExport = () => {
    const json = manager.exportJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `p61_workspace_${manager.reality.realityChecksum}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        manager.importJson(text);
        onRefresh();
      } catch (err: any) {
        alert(`Import Error: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col gap-4 font-mono text-[11px]">
      {/* ── REALITY CONTROLS ── */}
      <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800">
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold text-cyan-400 flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5" /> REALITY BUILDER
          </span>
          <span className="text-[9px] text-zinc-500">{manager.reality.objects.length} Objects</span>
        </div>

        <div className="grid grid-cols-2 gap-1.5 mb-3">
          <button
            onClick={handleAddObject}
            className="px-2 py-1.5 bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 border border-cyan-500/30 rounded-lg flex items-center justify-center gap-1 cursor-pointer font-bold"
          >
            <Plus className="w-3 h-3" /> Add Node
          </button>
          <button
            onClick={() => {
              if (selectedObj) manager.duplicateObject(selectedObj.id);
              onRefresh();
            }}
            disabled={!selectedObj}
            className="px-2 py-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-zinc-300 rounded-lg flex items-center justify-center gap-1 cursor-pointer"
          >
            <Copy className="w-3 h-3" /> Duplicate
          </button>
          <button
            onClick={() => {
              if (selectedObj) manager.removeObject(selectedObj.id);
              onRefresh();
            }}
            disabled={!selectedObj}
            className="px-2 py-1.5 bg-red-500/10 hover:bg-red-500/20 disabled:opacity-40 text-red-400 border border-red-500/20 rounded-lg flex items-center justify-center gap-1 cursor-pointer"
          >
            <Trash2 className="w-3 h-3" /> Delete
          </button>
          <button
            onClick={() => {
              manager.resetToDefaultReality();
              onRefresh();
            }}
            className="px-2 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-lg flex items-center justify-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        </div>

        {/* Load Canonical P5 Reality Copy */}
        <button
          onClick={() => {
            manager.loadCanonicalP5Reality();
            onRefresh();
          }}
          className="w-full py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer font-bold text-[10px]"
        >
          <Sparkles className="w-3 h-3 text-purple-400" /> Load Canonical P5 Copy
        </button>
      </div>

      {/* ── SELECTED OBJECT COORDINATE EDITOR ── */}
      {selectedObj && (
        <div className="p-3 bg-zinc-900/60 rounded-xl border border-purple-500/30 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-purple-400 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" /> OBJECT COORDS
            </span>
            <span className="text-[9px] text-zinc-500 truncate max-w-[120px]">{selectedObj.id}</span>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-3">
            <div>
              <label className="text-[9px] text-zinc-500 block">X Axis</label>
              <input
                type="number"
                value={editX}
                onChange={(e) => setEditX(Number(e.target.value))}
                className="w-full bg-black/60 border border-zinc-700 rounded px-1.5 py-1 text-zinc-200 text-center font-bold"
              />
            </div>
            <div>
              <label className="text-[9px] text-zinc-500 block">Y Axis</label>
              <input
                type="number"
                value={editY}
                onChange={(e) => setEditY(Number(e.target.value))}
                className="w-full bg-black/60 border border-zinc-700 rounded px-1.5 py-1 text-zinc-200 text-center font-bold"
              />
            </div>
            <div>
              <label className="text-[9px] text-zinc-500 block">Z Axis</label>
              <input
                type="number"
                value={editZ}
                onChange={(e) => setEditZ(Number(e.target.value))}
                className="w-full bg-black/60 border border-zinc-700 rounded px-1.5 py-1 text-zinc-200 text-center font-bold"
              />
            </div>
          </div>

          <button
            onClick={handleApplyCoordinates}
            className="w-full py-1 bg-purple-600 hover:bg-purple-500 text-white rounded font-bold cursor-pointer"
          >
            Apply Movement
          </button>
        </div>
      )}

      {/* ── OBSERVER CONTROLS ── */}
      <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800">
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold text-cyan-400 flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5" /> OBSERVER CONTROLS
          </span>
          <span className="text-[9px] text-emerald-400 font-bold">Z{manager.observer.dimension}</span>
        </div>

        {/* Dimension Selector */}
        <div className="flex gap-1 mb-3">
          {([3, 2, 1] as WorkspaceDimension[]).map((d) => (
            <button
              key={d}
              onClick={() => {
                manager.setDimension(d);
                onRefresh();
              }}
              className={`flex-1 py-1 text-center font-bold rounded cursor-pointer ${
                manager.observer.dimension === d
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-zinc-800 text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Z{d} Mode
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            manager.resetObserver();
            onRefresh();
          }}
          className="w-full py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded cursor-pointer"
        >
          Reset Observer Position
        </button>
      </div>

      {/* ── WORKSPACE HISTORY & STORAGE ── */}
      <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800">
        <div className="text-[10px] font-bold text-zinc-400 mb-2">WORKSPACE STATE & HISTORY</div>

        <div className="grid grid-cols-2 gap-1.5 mb-2">
          <button
            onClick={() => {
              manager.undo();
              onRefresh();
            }}
            disabled={!manager.history.canUndo()}
            className="py-1 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 text-zinc-300 rounded flex items-center justify-center gap-1 cursor-pointer font-bold"
          >
            <Undo2 className="w-3 h-3" /> Undo
          </button>
          <button
            onClick={() => {
              manager.redo();
              onRefresh();
            }}
            disabled={!manager.history.canRedo()}
            className="py-1 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 text-zinc-300 rounded flex items-center justify-center gap-1 cursor-pointer font-bold"
          >
            <Redo2 className="w-3 h-3" /> Redo
          </button>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={handleExport}
            className="py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded flex items-center justify-center gap-1 cursor-pointer"
          >
            <Download className="w-3 h-3" /> Export JSON
          </button>
          <label className="py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded flex items-center justify-center gap-1 cursor-pointer">
            <Upload className="w-3 h-3" /> Import
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
        </div>
      </div>
    </div>
  );
};
