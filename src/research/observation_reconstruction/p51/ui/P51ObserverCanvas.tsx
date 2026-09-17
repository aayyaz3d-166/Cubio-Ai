/**
 * 3D Memory Studio — Phase 5: Observation & Reconstruction
 * P5.1: Observer Canvas — Renders projected objects for a given observer frame
 */

import React, { useRef, useEffect } from 'react';
import { P51ObservableFrame, P51ObserverFrame } from '../types';

interface P51ObserverCanvasProps {
  frame: P51ObservableFrame;
  observer: P51ObserverFrame;
  selectedObjectId: string | null;
  onSelectObject?: (id: string | null) => void;
  width?: number;
  height?: number;
}

export const P51ObserverCanvas: React.FC<P51ObserverCanvasProps> = ({
  frame,
  observer,
  selectedObjectId,
  onSelectObject,
  width = 640,
  height = 480,
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
    ctx.fillStyle = '#0a0a0e';
    ctx.fillRect(0, 0, width, height);

    // Grid
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Crosshair at center
    ctx.strokeStyle = '#333355';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // Draw objects
    for (const obj of frame.objects) {
      if (!obj.visible) continue;

      const [sx, sy] = obj.screenCoordinate;
      const radius = Math.max(4, Math.min(16, 8 * obj.apparentScale));
      const isSelected = obj.sourceStateId === selectedObjectId;

      // Selection halo
      if (isSelected) {
        ctx.beginPath();
        ctx.arc(sx, sy, radius + 6, 0, Math.PI * 2);
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Node disc
      ctx.beginPath();
      ctx.arc(sx, sy, radius, 0, Math.PI * 2);
      ctx.fillStyle = isSelected ? '#a855f7' : '#06b6d4';
      ctx.fill();

      // Label
      ctx.fillStyle = '#e0e0e0';
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      const shortName = obj.entityName.length > 18
        ? obj.entityName.substring(0, 16) + '…'
        : obj.entityName;
      ctx.fillText(shortName, sx, sy + radius + 14);

      // Depth indicator
      ctx.fillStyle = '#555';
      ctx.font = '8px monospace';
      ctx.fillText(`d=${obj.depth.toFixed(1)}`, sx, sy + radius + 24);
    }

    // Observer info overlay
    ctx.fillStyle = '#06b6d4';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`${observer.label}`, 8, 16);
    ctx.fillStyle = '#888';
    ctx.font = '9px monospace';
    ctx.fillText(`pos: [${observer.position.map(v => v.toFixed(0)).join(', ')}]`, 8, 30);
    ctx.fillText(`dim: Z${observer.dimension} | fov: ${observer.fov}° | dist: ${observer.distance}`, 8, 42);
    ctx.fillText(`visible: ${frame.visibleCount}/${frame.objects.length}`, 8, 54);
    ctx.fillText(`frame: ${frame.frameChecksum}`, 8, 66);

  }, [frame, observer, selectedObjectId, width, height]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onSelectObject) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;

    let closest: string | null = null;
    let closestDist = 20;
    for (const obj of frame.objects) {
      if (!obj.visible) continue;
      const dx = obj.screenCoordinate[0] - cx;
      const dy = obj.screenCoordinate[1] - cy;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < closestDist) {
        closest = obj.sourceStateId;
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
      className="rounded-lg border border-zinc-800 cursor-crosshair"
    />
  );
};
