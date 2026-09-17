/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.2: Interactive Workspace Canvas
 */

import React, { useRef, useEffect } from 'react';
import { WorkspaceReality, WorkspaceObserver } from '../../p61/types';
import { ObservableFrame } from '../../../observation_reconstruction/p52/types';

interface P62WorkspaceCanvasProps {
  reality: WorkspaceReality;
  observer: WorkspaceObserver;
  observableFrame: ObservableFrame;
  selectedObjectId: string | null;
  onSelectObject?: (id: string | null) => void;
  width?: number;
  height?: number;
}

export const P62WorkspaceCanvas: React.FC<P62WorkspaceCanvasProps> = ({
  reality,
  observer,
  observableFrame,
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
    ctx.fillStyle = '#08080c';
    ctx.fillRect(0, 0, width, height);

    // Reference Grid
    ctx.strokeStyle = '#12121e';
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

    // Origin crosshair
    ctx.strokeStyle = '#22223a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // Render spatial connectivity lines between nodes
    if (observableFrame.objects.length > 1) {
      const originNode = observableFrame.objects[0];
      if (originNode.visible) {
        const [ox, oy] = originNode.screenCoordinate;
        for (let i = 1; i < observableFrame.objects.length; i++) {
          const target = observableFrame.objects[i];
          if (!target.visible) continue;
          const [tx, ty] = target.screenCoordinate;
          ctx.beginPath();
          ctx.moveTo(ox, oy);
          ctx.lineTo(tx, ty);
          ctx.strokeStyle = 'rgba(6, 182, 212, 0.2)';
          ctx.setLineDash([2, 3]);
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
    }

    // Render projected nodes
    for (const obj of observableFrame.objects) {
      if (!obj.visible) continue;
      const [sx, sy] = obj.screenCoordinate;
      const radius = Math.max(5, Math.min(16, 7 * obj.apparentScale));
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

      // Center pip
      ctx.beginPath();
      ctx.arc(sx, sy, 2, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      // Label & coordinate pill
      ctx.fillStyle = '#f4f4f5';
      ctx.font = 'bold 9.5px monospace';
      ctx.textAlign = 'center';
      const label = obj.entityName.length > 18 ? obj.entityName.slice(0, 16) + '…' : obj.entityName;
      ctx.fillText(label, sx, sy + radius + 12);

      ctx.fillStyle = '#71717a';
      ctx.font = '8px monospace';
      const posStr = `[${obj.authoritativeCoordinate.join(',')}]`;
      ctx.fillText(posStr, sx, sy + radius + 22);
    }

    // Header info overlay
    ctx.fillStyle = '#06b6d4';
    ctx.font = 'bold 10.5px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`${observer.label} [Z${observer.dimension}]`, 10, 16);

    ctx.fillStyle = '#71717a';
    ctx.font = '8.5px monospace';
    ctx.fillText(
      `Reality X: ${reality.realityChecksum} | Observable F: ${observableFrame.frameChecksum} | Vis: ${observableFrame.visibleCount}/${reality.objects.length}`,
      10,
      28
    );
  }, [reality, observer, observableFrame, selectedObjectId, width, height]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onSelectObject) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;

    let closest: string | null = null;
    let closestDist = 24;

    for (const obj of observableFrame.objects) {
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
      className="rounded-xl border border-zinc-800 cursor-crosshair shadow-2xl bg-[#08080c]"
    />
  );
};
