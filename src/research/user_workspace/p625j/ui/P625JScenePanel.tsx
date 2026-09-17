/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.25-J: Scene Management Panel
 */

import React, { useState } from 'react';
import {
  WorkspaceBoundGeometryScene,
  WorkspaceBoundGeometryObject,
} from '../types';
import {
  Box,
  Layers,
  Plus,
  Eye,
  EyeOff,
  CheckCircle,
  FolderKanban,
} from 'lucide-react';

export interface P625JScenePanelProps {
  scene: WorkspaceBoundGeometryScene | null;
  onSelectObject: (objectId: string) => void;
  onAddSolidBox: (name: string, origin: [number, number, number]) => void;
  onAddPoint: (name: string, coord: [number, number, number]) => void;
}

export const P625JScenePanel: React.FC<P625JScenePanelProps> = ({
  scene,
  onSelectObject,
  onAddSolidBox,
  onAddPoint,
}) => {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [nameInput, setNameInput] = useState('');

  if (!scene) {
    return (
      <div className="w-72 h-full bg-[#0d0e14] border-r border-zinc-800 p-4 font-mono text-zinc-500 text-xs">
        No active space scene resolved.
      </div>
    );
  }

  return (
    <aside className="w-72 h-full bg-[#0d0e14] border-r border-zinc-800 flex flex-col font-mono text-zinc-300 select-none z-20 shadow-xl">
      {/* Panel Header */}
      <div className="p-3 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
          <Layers className="w-4 h-4" />
          <span>Scene Objects ({scene.objects.length})</span>
        </div>
        <button
          onClick={() => setShowAddMenu(!showAddMenu)}
          className="flex items-center gap-1 px-2 py-0.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 text-cyan-300 rounded text-[10px] font-bold cursor-pointer transition"
        >
          <Plus className="w-3 h-3" />
          <span>Add</span>
        </button>
      </div>

      {/* Add Primitive Quick Menu */}
      {showAddMenu && (
        <div className="p-2.5 bg-zinc-900 border-b border-zinc-800 space-y-2 text-xs">
          <div className="text-[10px] text-zinc-500 font-bold uppercase">Add Geometric Primitive:</div>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => {
                onAddSolidBox('Solid Box', [5, 3, 6]);
                setShowAddMenu(false);
              }}
              className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-amber-300 rounded text-[10px] font-bold cursor-pointer"
            >
              + Solid Box
            </button>
            <button
              onClick={() => {
                onAddPoint('Point Anchor', [5, 3, 6]);
                setShowAddMenu(false);
              }}
              className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-cyan-300 rounded text-[10px] font-bold cursor-pointer"
            >
              + Point Node
            </button>
          </div>
        </div>
      )}

      {/* Object Hierarchy List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
        {scene.objects.map((obj) => {
          const isSelected = obj.objectId === scene.selectedObjectId;
          return (
            <div
              key={obj.objectId}
              onClick={() => onSelectObject(obj.objectId)}
              className={`p-2 rounded-lg border transition cursor-pointer flex items-center justify-between ${
                isSelected
                  ? 'bg-cyan-950/40 border-cyan-500 text-cyan-300 shadow-md shadow-cyan-500/10'
                  : 'bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-850 text-zinc-300'
              }`}
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <Box className="w-3.5 h-3.5 flex-shrink-0 text-cyan-400" />
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold truncate">{obj.name}</span>
                  <span className="text-[9px] text-zinc-500 truncate">
                    [{obj.coordinates.join(', ')}] • {obj.geometryType}
                  </span>
                </div>
              </div>

              {isSelected && (
                <span className="px-1.5 py-0.5 bg-cyan-500 text-black text-[9px] font-extrabold rounded">
                  ACTIVE
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Scene Footer Info */}
      <div className="p-2.5 border-t border-zinc-800 bg-[#090a0f] text-[10px] text-zinc-500 space-y-1">
        <div>Scene ID: {scene.sceneId}</div>
        <div>Space ID: {scene.spaceId}</div>
        <div>Checksum: {scene.sceneChecksum.slice(0, 12)}...</div>
      </div>
    </aside>
  );
};
