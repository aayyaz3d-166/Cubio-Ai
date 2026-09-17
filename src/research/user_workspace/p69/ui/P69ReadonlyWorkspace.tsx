/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.9: Read-Only Workspace Shell
 */

import React, { useRef, useEffect } from 'react';
import { PersonalSpace } from '../../p68/types';
import { Lock, Eye, ArrowLeft } from 'lucide-react';

interface P69ReadonlyWorkspaceProps {
  space: PersonalSpace;
  onExitReadonly: () => void;
}

export const P69ReadonlyWorkspace: React.FC<P69ReadonlyWorkspaceProps> = ({
  space,
  onExitReadonly,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 560;
    const height = 360;
    canvas.width = width;
    canvas.height = height;

    ctx.fillStyle = '#06060c';
    ctx.fillRect(0, 0, width, height);

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

    // Render Objects in read-only mode
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

    // Render Observers
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

    // Read-only Overlay
    ctx.fillStyle = '#eab308';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`[READ-ONLY MODE] ${space.name} (${space.spaceId})`, 10, 16);

    ctx.fillStyle = '#71717a';
    ctx.font = '8.5px monospace';
    ctx.fillText(
      `Reality CS: ${space.reality.realityChecksum} | Model CS: ${space.modelScene.modelChecksum} | Dim: ${space.dimension.dimensionType}`,
      10,
      28
    );
  }, [space]);

  return (
    <div className="flex flex-col h-full bg-[#050507] text-[#E0E0E0] font-mono p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={onExitReadonly}
            className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded flex items-center gap-1 text-[9px] cursor-pointer"
          >
            <ArrowLeft className="w-3 h-3" /> Exit Read-Only Mode
          </button>
          <span className="text-amber-400 font-bold flex items-center gap-1 text-xs">
            <Lock className="w-3.5 h-3.5" /> Read-Only Workspace Inspection
          </span>
        </div>
        <span className="text-xs text-zinc-500">Mutations are strictly disabled</span>
      </div>

      <div className="flex flex-1 gap-4 items-center justify-center">
        <canvas
          ref={canvasRef}
          width={560}
          height={360}
          className="rounded-xl border border-amber-500/40 shadow-2xl bg-[#06060c]"
        />
      </div>
    </div>
  );
};
