/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.25-J: Interactive 3D Geometry Viewport
 *
 * Renders active workspace P6.6 solids, surfaces, curves, points, meshes, wireframes,
 * selection highlights, coordinate axes, and camera controls.
 */

import React, { useRef, useState, useEffect } from 'react';
import {
  WorkspaceBoundGeometryScene,
  WorkspaceBoundGeometryObject,
  ViewportCameraState,
} from '../types';
import { ViewportStateManager } from '../viewportState';
import {
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Eye,
  Box,
} from 'lucide-react';

export interface P625JGeometryViewportProps {
  scene: WorkspaceBoundGeometryScene | null;
  viewportManager: ViewportStateManager;
  onSelectObject: (objectId: string | null) => void;
}

export const P625JGeometryViewport: React.FC<P625JGeometryViewportProps> = ({
  scene,
  viewportManager,
  onSelectObject,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cameraState, setCameraState] = useState<ViewportCameraState>(() => viewportManager.getCameraState());
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<'ORBIT' | 'PAN'>('ORBIT');
  const [lastMousePos, setLastMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Sync camera state on external changes
  const refreshCamera = () => {
    setCameraState(viewportManager.getCameraState());
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragMode(e.shiftKey || e.button === 1 ? 'PAN' : 'ORBIT');
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    const dx = e.clientX - lastMousePos.x;
    const dy = e.clientY - lastMousePos.y;
    setLastMousePos({ x: e.clientX, y: e.clientY });

    if (dragMode === 'ORBIT') {
      viewportManager.orbit(-dx * 0.01, -dy * 0.01);
    } else {
      viewportManager.pan(-dx * 0.05, dy * 0.05);
    }
    refreshCamera();
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    viewportManager.zoom(factor);
    refreshCamera();
  };

  // Render 2D isometric/perspective projection to canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = (canvas.width = canvas.parentElement?.clientWidth || 800);
    const height = (canvas.height = canvas.parentElement?.clientHeight || 600);

    ctx.fillStyle = '#07070a';
    ctx.fillRect(0, 0, width, height);

    // Draw coordinate grid
    ctx.strokeStyle = '#181924';
    ctx.lineWidth = 1;
    const cx = width / 2;
    const cy = height / 2;
    const scale = 25 * cameraState.zoom;

    for (let x = -200; x <= 200; x += 20) {
      ctx.beginPath();
      ctx.moveTo(cx + x * scale * 0.1, 0);
      ctx.lineTo(cx + x * scale * 0.1, height);
      ctx.stroke();
    }
    for (let y = -200; y <= 200; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, cy + y * scale * 0.1);
      ctx.lineTo(width, cy + y * scale * 0.1);
      ctx.stroke();
    }

    // World origin & axes
    const [tx, ty, tz] = cameraState.cameraTarget;
    const [px, py, pz] = cameraState.cameraPosition;

    const project = (x: number, y: number, z: number): [number, number] => {
      const relX = x - tx;
      const relY = y - ty;
      const relZ = z - tz;
      // Isometric-like view with camera angle
      const screenX = cx + (relX - relZ * 0.5) * scale;
      const screenY = cy - (relY - relZ * 0.3) * scale;
      return [screenX, screenY];
    };

    // Draw 3D Axes at [0,0,0]
    const [oX, oY] = project(0, 0, 0);
    const [xAxisX, xAxisY] = project(3, 0, 0);
    const [yAxisX, yAxisY] = project(0, 3, 0);
    const [zAxisX, zAxisY] = project(0, 0, 3);

    ctx.lineWidth = 2;
    // X - Red
    ctx.strokeStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(oX, oY);
    ctx.lineTo(xAxisX, xAxisY);
    ctx.stroke();

    // Y - Green
    ctx.strokeStyle = '#22c55e';
    ctx.beginPath();
    ctx.moveTo(oX, oY);
    ctx.lineTo(yAxisX, yAxisY);
    ctx.stroke();

    // Z - Blue
    ctx.strokeStyle = '#3b82f6';
    ctx.beginPath();
    ctx.moveTo(oX, oY);
    ctx.lineTo(zAxisX, zAxisY);
    ctx.stroke();

    // Render Scene Objects
    if (scene && scene.objects) {
      for (const obj of scene.objects) {
        if (!obj.visible) continue;
        const isSelected = obj.objectId === scene.selectedObjectId;
        const [ox, oy, oz] = obj.coordinates;
        const [w, h, d] = obj.dimensions;

        if (obj.geometryType === 'SOLID' || obj.geometryType === 'MESH') {
          // Render 3D Box wireframe & filled faces
          const min = obj.bounds.min;
          const max = obj.bounds.max;

          const p0 = project(min[0], min[1], min[2]);
          const p1 = project(max[0], min[1], min[2]);
          const p2 = project(max[0], min[1], max[2]);
          const p3 = project(min[0], min[1], max[2]);

          const p4 = project(min[0], max[1], min[2]);
          const p5 = project(max[0], max[1], min[2]);
          const p6 = project(max[0], max[1], max[2]);
          const p7 = project(min[0], max[1], max[2]);

          // Draw filled top face
          ctx.fillStyle = isSelected ? 'rgba(6, 182, 212, 0.35)' : 'rgba(245, 158, 11, 0.2)';
          ctx.beginPath();
          ctx.moveTo(p4[0], p4[1]);
          ctx.lineTo(p5[0], p5[1]);
          ctx.lineTo(p6[0], p6[1]);
          ctx.lineTo(p7[0], p7[1]);
          ctx.closePath();
          ctx.fill();

          // Draw edges
          ctx.strokeStyle = isSelected ? '#06b6d4' : obj.color || '#f59e0b';
          ctx.lineWidth = isSelected ? 2.5 : 1.5;

          const edges = [
            [p0, p1], [p1, p2], [p2, p3], [p3, p0],
            [p4, p5], [p5, p6], [p6, p7], [p7, p4],
            [p0, p4], [p1, p5], [p2, p6], [p3, p7],
          ];

          for (const [start, end] of edges) {
            ctx.beginPath();
            ctx.moveTo(start[0], start[1]);
            ctx.lineTo(end[0], end[1]);
            ctx.stroke();
          }

          // Label
          ctx.fillStyle = isSelected ? '#06b6d4' : '#d4d4d8';
          ctx.font = '10px monospace';
          ctx.fillText(`${obj.name} [${obj.coordinates.join(',')}]`, p4[0] + 5, p4[1] - 5);
        } else if (obj.geometryType === 'POINT') {
          const pt = project(ox, oy, oz);
          ctx.fillStyle = isSelected ? '#06b6d4' : '#38bdf8';
          ctx.beginPath();
          ctx.arc(pt[0], pt[1], isSelected ? 6 : 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.fillStyle = '#38bdf8';
          ctx.font = '10px monospace';
          ctx.fillText(`${obj.name}`, pt[0] + 8, pt[1] + 3);
        }
      }
    }
  }, [scene, cameraState]);

  return (
    <div className="relative w-full h-full bg-[#07070a] overflow-hidden select-none font-mono">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        className="w-full h-full cursor-grab active:cursor-grabbing block"
      />

      {/* Viewport HUD Controls */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-[#12131a]/90 backdrop-blur-md border border-zinc-800 p-1.5 rounded-lg shadow-xl text-zinc-300">
        <button
          onClick={() => {
            viewportManager.zoom(1.2);
            refreshCamera();
          }}
          className="p-1.5 hover:bg-zinc-800 rounded transition cursor-pointer text-zinc-400 hover:text-white"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            viewportManager.zoom(0.8);
            refreshCamera();
          }}
          className="p-1.5 hover:bg-zinc-800 rounded transition cursor-pointer text-zinc-400 hover:text-white"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            viewportManager.resetView(scene?.objects[0]?.coordinates);
            refreshCamera();
          }}
          className="p-1.5 hover:bg-zinc-800 rounded transition cursor-pointer text-zinc-400 hover:text-white"
          title="Reset View"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom Camera Info HUD */}
      <div className="absolute bottom-3 left-3 bg-[#12131a]/90 backdrop-blur-md border border-zinc-800 px-3 py-1.5 rounded-lg text-[10px] text-zinc-400 flex items-center gap-3">
        <span>CAM: [{cameraState.cameraPosition.join(', ')}]</span>
        <span>TARGET: [{cameraState.cameraTarget.join(', ')}]</span>
        <span>ZOOM: {cameraState.zoom.toFixed(2)}x</span>
      </div>
    </div>
  );
};
