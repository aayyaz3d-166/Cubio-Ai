/**
 * 3D Memory Studio — Phase 5: Observation & Reconstruction
 * Funnel P5.2: Observer Projection Canvas
 */

import React, { useRef, useEffect } from 'react';
import { ObservableFrame, ObserverFrame } from '../types';

interface P52ObserverCanvasProps {
  frame: ObservableFrame;
  observer: ObserverFrame;
  selectedObjectId: string | null;
  onSelectObject?: (id: string | null) => void;
  width?: number;
  height?: number;
}

export const P52ObserverCanvas: React.FC<P52ObserverCanvasProps> = ({
  frame,
  observer,
  selectedObjectId,
  onSelectObject,
  width = 460,
  height = 320,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;

    // Canvas background
    ctx.fillStyle = '#0a0a0e';
    ctx.fillRect(0, 0, width, height);

    // Reference grid
    ctx.strokeStyle = '#181828';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < width; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Center Crosshair
    ctx.strokeStyle = '#2b2b40';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // Render projected nodes
    for (const obj of frame.objects) {
      if (!obj.visible) continue;

      const [sx, sy] = obj.screenCoordinate;
      const radius = Math.max(4, Math.min(14, 7 * obj.apparentScale));
      const isSelected = obj.sourceStateId === selectedObjectId;

      // Selection ring
      if (isSelected) {
        ctx.beginPath();
        ctx.arc(sx, sy, radius + 5, 0, Math.PI * 2);
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Disc
      ctx.beginPath();
      ctx.arc(sx, sy, radius, 0, Math.PI * 2);
      ctx.fillStyle = isSelected ? '#a855f7' : '#06b6d4';
      ctx.fill();

      // Label
      ctx.fillStyle = '#d4d4d8';
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      const label = obj.entityName.length > 15 ? obj.entityName.slice(0, 13) + '…' : obj.entityName;
      ctx.fillText(label, sx, sy + radius + 12);
    }

    // Header info overlay
    ctx.fillStyle = '#06b6d4';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`${observer.label} [Z${observer.dimension}]`, 8, 14);

    ctx.fillStyle = '#71717a';
    ctx.font = '8.5px monospace';
    ctx.fillText(`Pos: [${observer.position.map((v) => v.toFixed(0)).join(',')}] | Frame: ${frame.frameChecksum}`, 8, 26);
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
      className="rounded-lg border border-zinc-800 cursor-crosshair shadow-inner"
    />
  );
};
