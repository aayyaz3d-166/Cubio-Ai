/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.8: Space Active Canvas Editor
 */

import React, { useRef, useEffect } from 'react';
import { PersonalSpace } from '../types';

interface P68SpaceEditorProps {
  space: PersonalSpace | undefined;
  width?: number;
  height?: number;
}

export const P68SpaceEditor: React.FC<P68SpaceEditorProps> = ({
  space,
  width = 560,
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

    if (!space) {
      ctx.fillStyle = '#71717a';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('No active Space selected.', cx, cy);
      return;
    }

    // Render Reality Objects in active Space
    for (const obj of space.reality.objects) {
      const [ox, oy, oz] = obj.position;
      const sx = cx + (ox - 10) * 8;
      const sy = cy - (oy - 8) * 8;

      ctx.fillStyle = (obj as any).color || '#38bdf8';
      ctx.beginPath();
      ctx.arc(sx, sy, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#e4e4e7';
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText((obj as any).name || obj.id, sx, sy - 9);
    }

    // Render Observers in active Space
    for (const obs of space.observers) {
      const [ox, oy, oz] = obs.position;
      const sx = cx + (ox - 10) * 8;
      const sy = cy - (oy - 8) * 8;

      ctx.fillStyle = '#a855f7';
      ctx.beginPath();
      ctx.arc(sx, sy, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#d8b4fe';
      ctx.font = '8px monospace';
      ctx.fillText(obs.observerId, sx, sy + 12);
    }

    // Space Info Overlay
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`${space.name} (${space.spaceId})`, 10, 16);

    ctx.fillStyle = '#71717a';
    ctx.font = '8.5px monospace';
    ctx.fillText(
      `Reality CS: ${space.reality.realityChecksum} | Model CS: ${space.modelScene.modelChecksum} | Dim: ${space.dimension.dimensionType}`,
      10,
      28
    );
  }, [space, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="rounded-xl border border-zinc-800 shadow-2xl bg-[#06060c]"
    />
  );
};
