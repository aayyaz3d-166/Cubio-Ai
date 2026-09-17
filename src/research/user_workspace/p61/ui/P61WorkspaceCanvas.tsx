/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.1: Workspace Canvas
 *
 * Interactive visual canvas rendering underlying workspace objects,
 * observer viewpoints, coordinate axes, selection halos, and spatial displacement vectors.
 */

import React, { useRef, useEffect } from 'react';
import { WorkspaceReality, WorkspaceObserver } from '../types';
import { generateWorkspaceObservation } from '../observationBridge';

interface P61WorkspaceCanvasProps {
  reality: WorkspaceReality;
  observer: WorkspaceObserver;
  selectedObjectId: string | null;
  onSelectObject?: (id: string | null) => void;
  width?: number;
  height?: number;
}

export const P61WorkspaceCanvas: React.FC<P61WorkspaceCanvasProps> = ({
  reality,
  observer,
  selectedObjectId,
  onSelectObject,
  width = 560,
  height = 400,
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
    ctx.fillStyle = '#09090d';
    ctx.fillRect(0, 0, width, height);

    // Grid pattern
    ctx.strokeStyle = '#141420';
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

    // Origin crosshair
    ctx.strokeStyle = '#222238';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // Compute projection using bridge
    const obsResult = generateWorkspaceObservation(reality, observer);
    const frame = obsResult.observableFrame;

    // Connect reference node (Object A / origin) to other nodes with displacement lines
    const nodeA = frame.objects.find((o) => o.sourceStateId === 'P61_OBJ_A' || o.sourceStateId.includes('OBJ_A'));
    if (nodeA && nodeA.visible) {
      const [ax, ay] = nodeA.screenCoordinate;
      for (const other of frame.objects) {
        if (other === nodeA || !other.visible) continue;
        const [bx, by] = other.screenCoordinate;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.25)';
        ctx.setLineDash([3, 3]);
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // Draw objects
    for (const obj of frame.objects) {
      if (!obj.visible) continue;
      const [sx, sy] = obj.screenCoordinate;
      const radius = Math.max(5, Math.min(16, 8 * obj.apparentScale));
      const isSelected = obj.sourceStateId === selectedObjectId;

      const realObj = reality.objects.find((r) => r.id === obj.sourceStateId);
      const color = realObj?.color || (isSelected ? '#a855f7' : '#06b6d4');

      // Selection Halo
      if (isSelected) {
        ctx.beginPath();
        ctx.arc(sx, sy, radius + 6, 0, Math.PI * 2);
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }

      // Disc
      ctx.beginPath();
      ctx.arc(sx, sy, radius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      // Inner center pip
      ctx.beginPath();
      ctx.arc(sx, sy, 2, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      // Label & coordinate pill
      ctx.fillStyle = '#f4f4f5';
      ctx.font = 'bold 9.5px monospace';
      ctx.textAlign = 'center';
      const label = obj.entityName.length > 20 ? obj.entityName.slice(0, 18) + '…' : obj.entityName;
      ctx.fillText(label, sx, sy + radius + 13);

      ctx.fillStyle = '#71717a';
      ctx.font = '8px monospace';
      const posStr = `[${obj.authoritativeCoordinate.join(',')}]`;
      ctx.fillText(posStr, sx, sy + radius + 23);
    }

    // Header info overlay
    ctx.fillStyle = '#06b6d4';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`${observer.label} — Z${observer.dimension}`, 10, 16);

    ctx.fillStyle = '#71717a';
    ctx.font = '9px monospace';
    ctx.fillText(
      `Reality: ${reality.realityChecksum} | Observable F: ${frame.frameChecksum} | Vis: ${frame.visibleCount}/${reality.objects.length}`,
      10,
      30
    );
  }, [reality, observer, selectedObjectId, width, height]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onSelectObject) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;

    const obsResult = generateWorkspaceObservation(reality, observer);
    let closest: string | null = null;
    let closestDist = 24;

    for (const obj of obsResult.observableFrame.objects) {
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
      className="rounded-xl border border-zinc-800 cursor-crosshair shadow-2xl bg-[#09090d]"
    />
  );
};
