/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.6: Advanced Geometry Viewport Canvas
 */

import React, { useRef, useEffect } from 'react';
import { AdvancedGeometryScene } from '../types';

interface P66GeometryViewportProps {
  scene: AdvancedGeometryScene;
  selectedObjectId: string | null;
  onSelectObject?: (id: string | null) => void;
  width?: number;
  height?: number;
}

export const P66GeometryViewport: React.FC<P66GeometryViewportProps> = ({
  scene,
  selectedObjectId,
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

    // Origin
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

    // Render Geometric Objects
    for (const obj of scene.objects) {
      if (!obj.visible) continue;
      const isSelected = obj.id === selectedObjectId;

      // Draw wireframe faces
      ctx.strokeStyle = isSelected ? '#ffffff' : obj.color || '#38bdf8';
      ctx.lineWidth = isSelected ? 1.5 : 0.8;

      for (const [f0, f1, f2] of obj.mesh.faces) {
        const v0 = obj.mesh.vertices[f0];
        const v1 = obj.mesh.vertices[f1];
        const v2 = obj.mesh.vertices[f2];
        if (!v0 || !v1 || !v2) continue;

        const s0 = [cx + (v0[0] - 10) * 8, cy - (v0[1] - 8) * 8];
        const s1 = [cx + (v1[0] - 10) * 8, cy - (v1[1] - 8) * 8];
        const s2 = [cx + (v2[0] - 10) * 8, cy - (v2[1] - 8) * 8];

        ctx.beginPath();
        ctx.moveTo(s0[0], s0[1]);
        ctx.lineTo(s1[0], s1[1]);
        ctx.lineTo(s2[0], s2[1]);
        ctx.closePath();
        ctx.stroke();
      }

      // Draw vertices
      for (const [vx, vy, vz] of obj.mesh.vertices) {
        const sx = cx + (vx - 10) * 8;
        const sy = cy - (vy - 8) * 8;
        ctx.beginPath();
        ctx.arc(sx, sy, 2, 0, Math.PI * 2);
        ctx.fillStyle = isSelected ? '#a855f7' : '#ffffff';
        ctx.fill();
      }
    }

    // Overlay Header
    ctx.fillStyle = '#a855f7';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`3D Geometry Scene: ${scene.sceneId}`, 10, 16);

    ctx.fillStyle = '#71717a';
    ctx.font = '8.5px monospace';
    ctx.fillText(
      `Objects: ${scene.objects.length} | Checksum: ${scene.sceneChecksum}`,
      10,
      28
    );
  }, [scene, selectedObjectId, width, height]);

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
      const bCenter = [
        (obj.mesh.bounds.min[0] + obj.mesh.bounds.max[0]) / 2,
        (obj.mesh.bounds.min[1] + obj.mesh.bounds.max[1]) / 2,
      ];
      const sx = cx + (bCenter[0] - 10) * 8;
      const sy = cy - (bCenter[1] - 8) * 8;

      const dx = sx - mx;
      const dy = sy - my;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < closestDist) {
        closest = obj.id;
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
      className="rounded-xl border border-zinc-800 cursor-crosshair shadow-2xl bg-[#06060c]"
    />
  );
};
