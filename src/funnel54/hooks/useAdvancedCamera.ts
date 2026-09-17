/**
 * 3D Memory Studio — Funnel 54
 * Hook: useAdvancedCamera
 *
 * Advanced Camera hook supporting smooth interactive orbit, pan, zoom,
 * state focus, cluster focus, auto-framing, and camera reset.
 */

import React, { useState, useCallback } from 'react';
import { SimulationCamera, SimulationDimension } from '../../funnel52/types';
import { StudioNodeViewModel, StudioClusterViewModel } from '../../funnel53/types';
import { createDefaultStudioCamera } from '../../funnel53/visual/cameraController';
import {
  calculateNodeFocusCamera,
  calculateClusterFocusCamera,
  calculateAutoFrameCamera,
} from '../camera/advancedCameraController';

export function useAdvancedCamera(initialCamera?: Partial<SimulationCamera>) {
  const [camera, setCamera] = useState<SimulationCamera>(() => ({
    ...createDefaultStudioCamera(),
    ...initialCamera,
  }));

  const [isDragging, setIsDragging] = useState(false);
  const [dragButton, setDragButton] = useState<number>(0);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setDragButton(e.button);
    setDragStart({ x: e.clientX, y: e.clientY });
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      setDragStart({ x: e.clientX, y: e.clientY });

      setCamera((prev) => {
        if (dragButton === 0) {
          const nextRotY = (prev.rotY + dx * 0.4) % 360;
          const nextRotX = Math.max(-85, Math.min(85, prev.rotX - dy * 0.4));
          return Object.freeze({ ...prev, rotX: nextRotX, rotY: nextRotY });
        }
        if (dragButton === 2) {
          return Object.freeze({ ...prev, panX: prev.panX + dx, panY: prev.panY + dy });
        }
        return prev;
      });
    },
    [isDragging, dragButton, dragStart]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const zoomDelta = e.deltaY * -0.0012;
    setCamera((prev) => {
      const nextZoom = Math.max(0.3, Math.min(3.0, prev.zoom + zoomDelta));
      return Object.freeze({ ...prev, zoom: nextZoom });
    });
  }, []);

  const resetCamera = useCallback(() => {
    setCamera(createDefaultStudioCamera());
  }, []);

  const focusOnNode = useCallback((node: StudioNodeViewModel) => {
    setCamera((prev) => calculateNodeFocusCamera(node, prev));
  }, []);

  const focusOnCluster = useCallback((cluster: StudioClusterViewModel) => {
    setCamera((prev) => calculateClusterFocusCamera(cluster, prev));
  }, []);

  const autoFrameDimension = useCallback((dimension: SimulationDimension) => {
    setCamera(calculateAutoFrameCamera(dimension));
  }, []);

  return {
    camera,
    setCamera,
    isDragging,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    resetCamera,
    focusOnNode,
    focusOnCluster,
    autoFrameDimension,
  };
}
