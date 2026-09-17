/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.7: Interactive Parametric 3D Viewport
 */

import React, { useRef, useEffect } from 'react';
import { AdvancedGeometryScene, AdvancedGeometryObject } from '../types';

interface P67FeatureViewportProps {
  scene: AdvancedGeometryScene | null;
  selectedFeatureId: string | null;
  width?: number;
  height?: number;
}

export const P67FeatureViewport: React.FC<P67FeatureViewportProps> = ({
  scene,
  selectedFeatureId,
  width = 540,
  height = 360,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;

    // Clear background
    ctx.fillStyle = '#06060c';
    ctx.fillRect(0, 0, width, height);

    // 3D Grid
    ctx.strokeStyle = '#141424';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < width; x += 25) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 25) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    const cx = width / 2;
    const cy = height / 2;

    // Coordinate Axes
    ctx.strokeStyle = '#2d2d48';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, cy);
    ctx.lineTo(width, cy);
    ctx.stroke();

    if (!scene) {
      ctx.fillStyle = '#71717a';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('No evaluated feature scene.', cx, cy);
      return;
    }

    // Render Evaluated Objects
    for (const obj of scene.objects) {
      const isSelected = selectedFeatureId !== null && obj.id.includes(selectedFeatureId);
      const bounds = obj.mesh?.bounds || { min: [0, 0, 0], max: [1, 1, 1], dimensions: [1, 1, 1] };
      const sx = cx + (bounds.min[0] + bounds.max[0]) * 4;
      const sy = cy - (bounds.min[1] + bounds.max[1]) * 4;
      const sw = Math.max(16, (bounds.max[0] - bounds.min[0]) * 8);
      const sh = Math.max(16, (bounds.max[1] - bounds.min[1]) * 8);

      ctx.fillStyle = isSelected ? 'rgba(56, 189, 248, 0.25)' : 'rgba(168, 85, 247, 0.15)';
      ctx.strokeStyle = isSelected ? '#38bdf8' : '#a855f7';
      ctx.lineWidth = isSelected ? 2 : 1;

      ctx.fillRect(sx - sw / 2, sy - sh / 2, sw, sh);
      ctx.strokeRect(sx - sw / 2, sy - sh / 2, sw, sh);

      ctx.fillStyle = '#e4e4e7';
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(obj.name, sx, sy - sh / 2 - 4);
    }

    // Header overlay
    ctx.fillStyle = '#a855f7';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Parametric Scene: ${scene.sceneId}`, 10, 16);

    ctx.fillStyle = '#71717a';
    ctx.font = '8.5px monospace';
    ctx.fillText(`Objects: ${scene.objects.length} | Checksum: ${scene.sceneChecksum}`, 10, 28);
  }, [scene, selectedFeatureId, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="rounded-xl border border-zinc-800 shadow-2xl bg-[#06060c]"
    />
  );
};
