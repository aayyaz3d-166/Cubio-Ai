/**
 * 3D Memory Studio — Funnel 77
 * React Hook: useStudioViewport
 *
 * StrictMode-safe and remount-resilient hook orchestrating 3D Viewport activation.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { ViewportEngine } from '../viewport/viewportEngine';
import { ViewportSnapshot, CameraPreset } from '../types';
import { MemoryRendererHost } from '../../funnel55/renderer/rendererHost';
import { SceneEngine } from '../../funnel56/scene/sceneEngine';
import { CameraEngine } from '../../funnel61/camera/cameraEngine';
import { DataClassification } from '../../funnel47/types';

export function useStudioViewport(
  host?: MemoryRendererHost,
  scene?: SceneEngine,
  camera?: CameraEngine
) {
  const engineRef = useRef<ViewportEngine>(new ViewportEngine());
  const engine = engineRef.current;

  const [snapshot, setSnapshot] = useState<ViewportSnapshot>(() => engine.getSnapshot());
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const unsubscribe = engine.statusManager.subscribe((snap) => {
      setSnapshot(snap);
    });

    let resizeObserver: ResizeObserver | null = null;
    const canvas = canvasRef.current;
    if (canvas && host && scene && camera) {
      engine.mount(canvas, host, scene, camera);

      if (typeof ResizeObserver !== 'undefined' && canvas.parentElement) {
        resizeObserver = new ResizeObserver((entries) => {
          for (const entry of entries) {
            const { width, height } = entry.contentRect;
            if (width > 0 && height > 0) {
              engine.resize(width, height);
            }
          }
        });
        resizeObserver.observe(canvas.parentElement);
      }
    }

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      unsubscribe();
      engine.unmount();
    };
  }, [engine, host, scene, camera]);

  const selectObject = useCallback(
    (
      id: string | null,
      position: [number, number, number] | null,
      classification: DataClassification = 'GREEN',
      label?: string,
      dimension = 3
    ) => {
      return engine.selectObject(id, position, classification, label, dimension);
    },
    [engine]
  );

  const applyPreset = useCallback(
    (preset: CameraPreset) => {
      engine.applyPreset(preset);
    },
    [engine]
  );

  const toggleAxes = useCallback(() => {
    engine.toggleAxes();
  }, [engine]);

  const toggleGrid = useCallback(() => {
    engine.toggleGrid();
  }, [engine]);

  const setDimension = useCallback(
    (dim: number) => {
      engine.setDimension(dim);
    },
    [engine]
  );

  const render = useCallback(() => {
    engine.render();
  }, [engine]);

  return {
    engine,
    canvasRef,
    snapshot,
    selectObject,
    applyPreset,
    toggleAxes,
    toggleGrid,
    setDimension,
    render,
  };
}
