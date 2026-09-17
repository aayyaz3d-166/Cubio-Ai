/**
 * 3D Memory Studio — Funnel 65
 * Component: StudioRuntimeViewport
 *
 * Viewport container ensuring non-zero canvas dimensions and auto-resizing.
 */

import React, { useRef, useEffect } from 'react';
import { StudioWorkspaceManager } from '../../funnel64/workspace/workspaceManager';

interface StudioRuntimeViewportProps {
  workspace: StudioWorkspaceManager;
}

export const StudioRuntimeViewport: React.FC<StudioRuntimeViewportProps> = ({ workspace }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    workspace.viewportAdapter.attachViewport(canvas);

    const handleResize = () => {
      const rect = container.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        workspace.viewportAdapter.setViewportBounds({
          x: 0,
          y: 0,
          width: rect.width,
          height: rect.height,
        });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      workspace.viewportAdapter.detachViewport();
    };
  }, [workspace]);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#070709] overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};
