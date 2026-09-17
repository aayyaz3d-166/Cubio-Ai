/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.5: 3D Model Viewport Canvas
 */

import React, { useRef, useEffect } from 'react';
import { ModelScene3D } from '../types';

interface P65ModelViewportProps {
  scene: ModelScene3D;
  selectedModelObjectId: string | null;
  onSelectObject?: (id: string | null) => void;
  width?: number;
  height?: number;
}

export const P65ModelViewport: React.FC<P65ModelViewportProps> = ({
  scene,
  selectedModelObjectId,
  onSelectObject,
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

    // Background
    ctx.fillStyle = '#06060a';
    ctx.fillRect(0, 0, width, height);

    // 3D Perspective Grid
    ctx.strokeStyle = '#12121f';
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

    // Origin
    const cx = width / 2;
    const cy = height / 2;
    ctx.strokeStyle = '#252538';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, cy);
    ctx.lineTo(width, cy);
    ctx.stroke();

    // Render 3D Model Objects
    for (const obj of scene.objects) {
      if (!obj.visible) continue;
      const [wx, wy, wz] = obj.transform.position;
      const [sxFactor, syFactor, szFactor] = obj.transform.scale;

      // Simple 3D projection onto canvas
      const scale = 220 / (220 + wz * 1.5);
      const sx = cx + (wx - 10) * 8 * scale;
      const sy = cy - (wy - 8) * 8 * scale;

      const isSelected = obj.modelObjectId === selectedModelObjectId;
      const radius = Math.max(6, 12 * scale * sxFactor);

      // Bounding Box projection
      if (isSelected) {
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.strokeRect(sx - radius - 6, sy - radius - 6, (radius + 6) * 2, (radius + 6) * 2);
        ctx.setLineDash([]);
      }

      // Geometry Fill
      ctx.beginPath();
      if (obj.geometry.type === 'CUBE') {
        ctx.rect(sx - radius, sy - radius, radius * 2, radius * 2);
      } else {
        ctx.arc(sx, sy, radius, 0, Math.PI * 2);
      }
      ctx.fillStyle = obj.color || '#06b6d4';
      ctx.fill();

      // Outline
      ctx.strokeStyle = isSelected ? '#ffffff' : '#38bdf8';
      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.stroke();

      // Center pip
      ctx.beginPath();
      ctx.arc(sx, sy, 2, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      // Label & coordinates
      ctx.fillStyle = '#f4f4f5';
      ctx.font = 'bold 9.5px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(obj.name, sx, sy + radius + 12);

      ctx.fillStyle = '#71717a';
      ctx.font = '8px monospace';
      ctx.fillText(`[${wx.toFixed(1)}, ${wy.toFixed(1)}, ${wz.toFixed(1)}]`, sx, sy + radius + 22);
    }

    // Overlay Info
    ctx.fillStyle = '#06b6d4';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`3D Scene: ${scene.sceneId}`, 10, 16);

    ctx.fillStyle = '#71717a';
    ctx.font = '8.5px monospace';
    ctx.fillText(
      `Objects: ${scene.objects.length} | Vertices: ${scene.totalVertices} | Faces: ${scene.totalFaces} | Checksum: ${scene.modelChecksum}`,
      10,
      28
    );
  }, [scene, selectedModelObjectId, width, height]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onSelectObject) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const cx = width / 2;
    const cy = height / 2;

    let closest: string | null = null;
    let closestDist = 30;

    for (const obj of scene.objects) {
      if (!obj.visible) continue;
      const [wx, wy, wz] = obj.transform.position;
      const scale = 220 / (220 + wz * 1.5);
      const sx = cx + (wx - 10) * 8 * scale;
      const sy = cy - (wy - 8) * 8 * scale;

      const dx = sx - mx;
      const dy = sy - my;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < closestDist) {
        closest = obj.modelObjectId;
        closestDist = d;
      }
    }
    onSelectObject(closest);
  };

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      onClick={handleClick}
      className="rounded-xl border border-zinc-800 cursor-crosshair shadow-2xl bg-[#06060a]"
    />
  );
};
