/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.2: Reality Interaction Panel
 */

import React, { useState, useEffect } from 'react';
import { InteractiveRealityEngine } from '../interactionEngine';
import {
  Plus,
  Copy,
  Trash2,
  RotateCcw,
  Undo2,
  Redo2,
  Sparkles,
  Sliders,
  MoveRight,
  MoveUp,
  Database,
} from 'lucide-react';

interface P62InteractionPanelProps {
  engine: InteractiveRealityEngine;
  onRefresh: () => void;
}

export const P62InteractionPanel: React.FC<P62InteractionPanelProps> = ({
  engine,
  onRefresh,
}) => {
  const selectedObj = engine.getSelectedObject();
  const [posX, setPosX] = useState<number>(selectedObj ? selectedObj.position[0] : 0);
  const [posY, setPosY] = useState<number>(selectedObj ? selectedObj.position[1] : 0);
  const [posZ, setPosZ] = useState<number>(selectedObj ? selectedObj.position[2] : 0);

  useEffect(() => {
    if (selectedObj) {
      setPosX(selectedObj.position[0]);
      setPosY(selectedObj.position[1]);
      setPosZ(selectedObj.position[2]);
    }
  }, [selectedObj?.id, selectedObj?.position[0], selectedObj?.position[1], selectedObj?.position[2]]);

  const handleApplyPosition = () => {
    if (!selectedObj) return;
    engine.moveSelectedObject([Number(posX), Number(posY), Number(posZ)]);
    onRefresh();
  };

  const handleTranslate = (dx: number, dy: number, dz: number) => {
    engine.translateSelectedObject([dx, dy, dz]);
    onRefresh();
  };

  return (
    <div className="flex flex-col gap-3 font-mono text-[11px]">
      {/* ── REALITY CONTROLS ── */}
      <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800">
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold text-cyan-400 flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5" /> REALITY X MUTATIONS
          </span>
          <span className="text-[9px] text-zinc-500">{engine.reality.objects.length} Nodes</span>
        </div>

        <div className="grid grid-cols-2 gap-1.5 mb-2">
          <button
            onClick={() => {
              engine.createObject();
              onRefresh();
            }}
            className="px-2 py-1.5 bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 border border-cyan-500/30 rounded-lg flex items-center justify-center gap-1 cursor-pointer font-bold"
          >
            <Plus className="w-3 h-3" /> Create Node
          </button>
          <button
            onClick={() => {
              engine.duplicateSelectedObject();
              onRefresh();
            }}
            disabled={!selectedObj}
            className="px-2 py-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-zinc-300 rounded-lg flex items-center justify-center gap-1 cursor-pointer"
          >
            <Copy className="w-3 h-3" /> Duplicate
          </button>
          <button
            onClick={() => {
              engine.deleteSelectedObject();
              onRefresh();
            }}
            disabled={!selectedObj}
            className="px-2 py-1.5 bg-red-500/10 hover:bg-red-500/20 disabled:opacity-40 text-red-400 border border-red-500/20 rounded-lg flex items-center justify-center gap-1 cursor-pointer"
          >
            <Trash2 className="w-3 h-3" /> Delete
          </button>
          <button
            onClick={() => {
              engine.resetReality();
              onRefresh();
            }}
            className="px-2 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-lg flex items-center justify-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        </div>

        <button
          onClick={() => {
            engine.loadCanonicalP5Reality();
            onRefresh();
          }}
          className="w-full py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer font-bold text-[10px]"
        >
          <Sparkles className="w-3 h-3 text-purple-400" /> Load Canonical P5 Copy
        </button>
      </div>

      {/* ── SELECTED OBJECT POSITION CONTROLS ── */}
      {selectedObj && (
        <div className="p-3 bg-zinc-900/60 rounded-xl border border-purple-500/40 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-purple-400 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" /> TRANSFORM SELECTION
            </span>
            <span className="text-[9px] text-zinc-500 truncate max-w-[120px]">{selectedObj.id}</span>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-2.5">
            <div>
              <label className="text-[8.5px] text-zinc-500 block">X Pos</label>
              <input
                type="number"
                value={posX}
                onChange={(e) => setPosX(Number(e.target.value))}
                className="w-full bg-black/60 border border-zinc-700 rounded px-1.5 py-1 text-zinc-200 text-center font-bold"
              />
            </div>
            <div>
              <label className="text-[8.5px] text-zinc-500 block">Y Pos</label>
              <input
                type="number"
                value={posY}
                onChange={(e) => setPosY(Number(e.target.value))}
                className="w-full bg-black/60 border border-zinc-700 rounded px-1.5 py-1 text-zinc-200 text-center font-bold"
              />
            </div>
            <div>
              <label className="text-[8.5px] text-zinc-500 block">Z Pos</label>
              <input
                type="number"
                value={posZ}
                onChange={(e) => setPosZ(Number(e.target.value))}
                className="w-full bg-black/60 border border-zinc-700 rounded px-1.5 py-1 text-zinc-200 text-center font-bold"
              />
            </div>
          </div>

          <button
            onClick={handleApplyPosition}
            className="w-full py-1 mb-2 bg-purple-600 hover:bg-purple-500 text-white rounded font-bold cursor-pointer"
          >
            Apply Position
          </button>

          {/* Quick nudge buttons */}
          <div className="grid grid-cols-3 gap-1">
            <button onClick={() => handleTranslate(5, 0, 0)} className="py-0.5 bg-zinc-800 hover:bg-zinc-700 rounded text-[9px] text-zinc-300 cursor-pointer">+5 X</button>
            <button onClick={() => handleTranslate(0, 5, 0)} className="py-0.5 bg-zinc-800 hover:bg-zinc-700 rounded text-[9px] text-zinc-300 cursor-pointer">+5 Y</button>
            <button onClick={() => handleTranslate(0, 0, 5)} className="py-0.5 bg-zinc-800 hover:bg-zinc-700 rounded text-[9px] text-zinc-300 cursor-pointer">+5 Z</button>
          </div>
        </div>
      )}

      {/* ── UNDO / REDO ── */}
      <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800">
        <div className="text-[10px] font-bold text-zinc-400 mb-2">REALITY HISTORY</div>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => {
              engine.undo();
              onRefresh();
            }}
            disabled={!engine.history.canUndo()}
            className="py-1 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 text-zinc-300 rounded flex items-center justify-center gap-1 cursor-pointer font-bold"
          >
            <Undo2 className="w-3 h-3" /> Undo
          </button>
          <button
            onClick={() => {
              engine.redo();
              onRefresh();
            }}
            disabled={!engine.history.canRedo()}
            className="py-1 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 text-zinc-300 rounded flex items-center justify-center gap-1 cursor-pointer font-bold"
          >
            <Redo2 className="w-3 h-3" /> Redo
          </button>
        </div>
      </div>
    </div>
  );
};
