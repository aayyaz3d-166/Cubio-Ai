/**
 * 3D Memory Studio — Funnel 77
 * Component: StudioViewport
 *
 * Central 3D Viewport component integrating ViewportCanvas, ViewportStatus,
 * ViewportOverlay, ViewportSelectionMarker, and ViewportEmptyState.
 */

import React, { useEffect } from 'react';
import { useStudioViewport } from '../hooks/useStudioViewport';
import { ViewportCanvas } from './ViewportCanvas';
import { ViewportStatus } from './ViewportStatus';
import { ViewportOverlay } from './ViewportOverlay';
import { ViewportSelectionMarker } from './ViewportSelectionMarker';
import { ViewportEmptyState } from './ViewportEmptyState';

import { MemoryRendererHost } from '../../funnel55/renderer/rendererHost';
import { SceneEngine } from '../../funnel56/scene/sceneEngine';
import { CameraEngine } from '../../funnel61/camera/cameraEngine';
import { StudioWorkspaceManager } from '../../funnel64/workspace/workspaceManager';

interface StudioViewportProps {
  workspace?: StudioWorkspaceManager;
  host?: MemoryRendererHost;
  scene?: SceneEngine;
  camera?: CameraEngine;
  activeDimension?: number;
  selectedStateId?: string | null;
}

export const StudioViewport: React.FC<StudioViewportProps> = ({
  workspace,
  host: propHost,
  scene: propScene,
  camera: propCamera,
  activeDimension = 3,
  selectedStateId,
}) => {
  const host = propHost ?? workspace?.rendererHost;
  const camera = propCamera ?? workspace?.cameraAdapter?.cameraEngine;
  const scene = propScene ?? workspace?.sceneEngine ?? new SceneEngine();

  const {
    canvasRef,
    snapshot,
    selectObject,
    applyPreset,
    toggleAxes,
    toggleGrid,
    setDimension,
    render,
  } = useStudioViewport(host, scene, camera);

  useEffect(() => {
    setDimension(activeDimension);
  }, [activeDimension, setDimension]);

  useEffect(() => {
    render();
  }, [workspace, scene, camera, render]);

  useEffect(() => {
    if (!workspace) return;
    const selId = selectedStateId !== undefined ? selectedStateId : workspace.selectionManager.currentStateId;
    if (selId) {
      const coord = workspace.dimensionAdapter.getCoordinate(selId);
      const pos: [number, number, number] | null = coord
        ? [coord.projectedPosition[0], coord.projectedPosition[1], coord.projectedPosition[2]]
        : null;
      selectObject(selId, pos, 'GREEN', selId, activeDimension as any);
    } else {
      selectObject(null, null, 'GREEN', undefined, activeDimension as any);
    }
  }, [workspace, selectedStateId, workspace?.selectionManager?.currentStateId, activeDimension, selectObject]);

  return (
    <div className="relative w-full h-full bg-[#070709] overflow-hidden select-none">
      {/* 3D Canvas */}
      <ViewportCanvas canvasRef={canvasRef} camera={camera} onInteract={render} />

      {/* Top Left Status */}
      <ViewportStatus snapshot={snapshot} />

      {/* Top Right Controls (Presets, Axes, Grid) */}
      <ViewportOverlay
        controls={snapshot.controls}
        onPreset={applyPreset}
        onToggleAxes={toggleAxes}
        onToggleGrid={toggleGrid}
      />

      {/* Bottom Left Selection Marker */}
      <ViewportSelectionMarker selection={snapshot.selectedObject} />

      {/* Empty State Overlay */}
      {snapshot.objectCount === 0 && snapshot.state === 'ACTIVE' && (
        <ViewportEmptyState />
      )}
    </div>
  );
};
