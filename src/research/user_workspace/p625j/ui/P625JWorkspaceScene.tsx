/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.25-J: Integrated Active 3D Workspace Scene Component
 */

import React, { useState, useMemo, useCallback } from 'react';
import { WorkspaceSceneStore } from '../workspaceSceneStore';
import { GeometryBindingLayer } from '../geometryBinding';
import { P625JGeometryViewport } from './P625JGeometryViewport';
import { P625JScenePanel } from './P625JScenePanel';
import { P625JGeometryInspector } from './P625JGeometryInspector';
import { P625JSceneStatus } from './P625JSceneStatus';
import {
  WorkspaceUserContext,
  LiveSpaceState,
} from '../../p625i/types';
import {
  Boxes,
  Save,
  RotateCcw,
  Plus,
  Layers,
  ChevronLeft,
} from 'lucide-react';

export interface P625JWorkspaceSceneProps {
  userContext?: WorkspaceUserContext;
  onExit?: () => void;
}

export const P625JWorkspaceScene: React.FC<P625JWorkspaceSceneProps> = ({
  userContext,
  onExit,
}) => {
  const ctx: WorkspaceUserContext = useMemo(
    () =>
      userContext ??
      Object.freeze({
        userId: 'USR_OWNER_01',
        userRole: 'OWNER',
        workspaceId: 'WS_PRODUCTION_3D',
        isAuthenticated: true,
      }),
    [userContext]
  );

  const store = useMemo(() => new WorkspaceSceneStore(ctx), [ctx]);
  const [, setTick] = useState(0);
  const forceRefresh = useCallback(() => setTick((t) => t + 1), []);

  // Initial space setup
  const [activeSpace, setActiveSpace] = useState<LiveSpaceState>(() => {
    const sp: LiveSpaceState = {
      spaceId: 'SPC_CANONICAL_01',
      name: 'Primary Canonical Space',
      ownerId: ctx.userId,
      lineageId: 'LIN_SPC_CANONICAL_01',
      checksum: 'CS_INIT',
      realityChecksum: 'CS_REALITY_CANONICAL_01',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isDeleted: false,
      isArchived: false,
      initialCoordinates: [5, 3, 6],
      currentCoordinates: [5, 3, 6],
      initialDimensions: [2, 2, 2],
      currentDimensions: [2, 2, 2],
      initialObserver: 'OBS_DEFAULT',
      currentObserver: 'OBS_DEFAULT',
      objectIds: Object.freeze([]),
    };
    store.bindSpace(sp);
    return sp;
  });

  const scene = store.getActiveScene();
  const selectedObject = scene?.objects.find((o) => o.objectId === scene.selectedObjectId) ?? null;

  const handleSelectObject = useCallback(
    (objectId: string | null) => {
      store.selectObject(objectId);
      forceRefresh();
    },
    [store, forceRefresh]
  );

  const handleNudge = useCallback(
    (axis: 'X' | 'Y' | 'Z', delta: number) => {
      store.nudgeSelectedObject(axis, delta);
      forceRefresh();
    },
    [store, forceRefresh]
  );

  const handleAddSolidBox = useCallback(
    (name: string, origin: [number, number, number]) => {
      if (!scene) return;
      const newBox = GeometryBindingLayer.bindSolidBox(
        scene.spaceId,
        ctx.userId,
        origin,
        [2, 2, 2],
        name,
        scene.objects.length
      );
      (scene.objects as any).push(newBox);
      store.selectObject(newBox.objectId);
      forceRefresh();
    },
    [scene, ctx.userId, store, forceRefresh]
  );

  const handleAddPoint = useCallback(
    (name: string, coord: [number, number, number]) => {
      if (!scene) return;
      const newPt = GeometryBindingLayer.bindPoint(
        scene.spaceId,
        ctx.userId,
        coord,
        name,
        scene.objects.length
      );
      (scene.objects as any).push(newPt);
      store.selectObject(newPt.objectId);
      forceRefresh();
    },
    [scene, ctx.userId, store, forceRefresh]
  );

  const handleReset = useCallback(() => {
    store.resetSpaceScene(activeSpace);
    forceRefresh();
  }, [store, activeSpace, forceRefresh]);

  const handleSave = useCallback(() => {
    store.saveSceneSnapshot('Active Scene State');
    forceRefresh();
  }, [store, forceRefresh]);

  return (
    <div className="w-screen h-screen bg-[#07070a] flex flex-col font-mono select-none overflow-hidden text-zinc-300">
      {/* Top Application Header */}
      <header className="h-12 bg-[#0c0d12] border-b border-zinc-800 px-4 flex items-center justify-between z-30">
        <div className="flex items-center gap-3">
          {onExit && (
            <button
              onClick={onExit}
              className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition cursor-pointer"
              title="Exit to Main Studio"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center text-cyan-400 font-bold text-xs">
              P6
            </div>
            <span className="font-extrabold text-white text-xs tracking-wider">
              ACTIVE 3D USER WORKSPACE SCENE (P6.25-J)
            </span>
          </div>

          <div className="px-2.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-400">
            SPACE: <span className="text-cyan-400 font-bold">{activeSpace.name}</span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            className="flex items-center gap-1 px-2.5 py-1 bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/60 text-blue-300 hover:text-white rounded text-xs transition cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save State</span>
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-1 px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-amber-400 hover:text-amber-300 rounded text-xs transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left: Scene Objects Panel */}
        <P625JScenePanel
          scene={scene}
          onSelectObject={handleSelectObject}
          onAddSolidBox={handleAddSolidBox}
          onAddPoint={handleAddPoint}
        />

        {/* Center: Interactive 3D Viewport */}
        <main className="flex-1 h-full relative overflow-hidden bg-[#07070a]">
          <P625JGeometryViewport
            scene={scene}
            viewportManager={store.getViewportManager()}
            onSelectObject={handleSelectObject}
          />
        </main>

        {/* Right: Geometry Inspector */}
        <P625JGeometryInspector
          selectedObject={selectedObject}
          onNudge={handleNudge}
        />
      </div>

      {/* Bottom Telemetry Status */}
      <P625JSceneStatus
        scene={scene}
        workspaceId={ctx.workspaceId}
      />
    </div>
  );
};
