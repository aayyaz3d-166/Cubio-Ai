/**
 * 3D Memory Studio — Funnel 63
 * Component: LandingCubeViewport
 *
 * Interactive Three.js canvas viewport for the 3D landing cube.
 */

import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { LandingEngine } from '../landing/landingEngine';

interface LandingCubeViewportProps {
  engine: LandingEngine;
}

export const LandingCubeViewport: React.FC<LandingCubeViewportProps> = ({ engine }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const raycaster = useRef(new THREE.Raycaster()).current;
  const mouseVec = useRef(new THREE.Vector2()).current;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    engine.renderer.attach(canvas);
    engine.renderer.start();

    return () => {
      engine.renderer.dispose();
    };
  }, [engine]);

  // Pointer & Touch Handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    engine.gestures.handlePointerDown(e.clientX, e.clientY, engine.cube);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      mouseVec.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseVec.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      // Raycast hover when not dragging
      if (!engine.cube.state.isDragging && engine.renderer.camera) {
        raycaster.setFromCamera(mouseVec as any, engine.renderer.camera as any);
        const hoveredFace = engine.cube.raycastFace(raycaster);
        engine.cube.onPointerHover(hoveredFace);
      }
    }

    engine.gestures.handlePointerMove(e.clientX, e.clientY, engine.cube);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignore if not captured
    }
    engine.gestures.handlePointerUp(engine.cube);
  };

  const handleWheel = (e: React.WheelEvent) => {
    engine.gestures.handleWheel(e.deltaY, engine.cube);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      const t = e.touches[0];
      engine.gestures.handleTouchStart(t.clientX, t.clientY, engine.cube);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      const t = e.touches[0];
      engine.gestures.handleTouchMove(t.clientX, t.clientY, engine.cube);
    }
  };

  const handleTouchEnd = () => {
    engine.gestures.handleTouchEnd(engine.cube);
  };

  return (
    <canvas
      ref={canvasRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="w-full h-full block cursor-grab active:cursor-grabbing touch-none select-none"
    />
  );
};
