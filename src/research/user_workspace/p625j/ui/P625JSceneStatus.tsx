/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.25-J: Scene Status Bar & Telemetry
 */

import React from 'react';
import {
  WorkspaceBoundGeometryScene,
} from '../types';
import {
  CheckCircle2,
  Box,
  ShieldCheck,
} from 'lucide-react';

export interface P625JSceneStatusProps {
  scene: WorkspaceBoundGeometryScene | null;
  workspaceId: string;
}

export const P625JSceneStatus: React.FC<P625JSceneStatusProps> = ({
  scene,
  workspaceId,
}) => {
  return (
    <footer className="h-7 bg-[#090a0f] border-t border-zinc-800 px-4 flex items-center justify-between font-mono text-[10px] text-zinc-400 select-none z-30">
      <div className="flex items-center gap-4">
        <span>WS: <strong className="text-zinc-200">{workspaceId}</strong></span>
        <span>SPACE: <strong className="text-cyan-400">{scene?.spaceId ?? 'NONE'}</strong></span>
        <span>SCENE: <strong className="text-zinc-300">{scene?.sceneId ?? 'NONE'}</strong></span>
      </div>

      <div className="flex items-center gap-4">
        <span>OBJECTS: <strong className="text-amber-400">{scene?.objects.length ?? 0}</strong></span>
        <span>SELECTED: <strong className="text-cyan-300">{scene?.selectedObjectId ?? 'NONE'}</strong></span>
        <div className="flex items-center gap-1 text-emerald-400 font-bold">
          <CheckCircle2 className="w-3 h-3" />
          <span>REALITY INVARIANT</span>
        </div>
      </div>
    </footer>
  );
};
