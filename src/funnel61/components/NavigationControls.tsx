/**
 * 3D Memory Studio — Funnel 61
 * Component: NavigationControls
 *
 * Direct interactive controls for Orbit, Pan, Zoom, and Framing.
 */

import React from 'react';
import { CameraEngine } from '../camera/cameraEngine';
import { Move, ZoomIn, ZoomOut, RotateCw, RotateCcw } from 'lucide-react';

interface NavigationControlsProps {
  camEngine: CameraEngine;
  onUpdate: () => void;
}

export const NavigationControls: React.FC<NavigationControlsProps> = ({
  camEngine,
  onUpdate,
}) => {
  const handleOrbit = (dYaw: number, dPitch: number) => {
    camEngine.navigation.orbit(camEngine.state, dYaw, dPitch);
    onUpdate();
  };

  const handleZoom = (dDist: number) => {
    camEngine.navigation.zoom(camEngine.state, dDist);
    onUpdate();
  };

  const handlePan = (dx: number, dy: number) => {
    camEngine.navigation.pan(camEngine.state, dx, dy);
    onUpdate();
  };

  return (
    <div className="absolute bottom-4 left-4 z-30 bg-[#111114]/95 backdrop-blur-md border border-zinc-800 rounded-xl p-3 text-xs font-mono text-zinc-300 shadow-2xl space-y-2 select-none">
      <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
        <Move className="w-3.5 h-3.5 text-cyan-400" />
        <span>Navigation Controls</span>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          <button
            onClick={() => handleOrbit(-15, 0)}
            className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300 cursor-pointer"
            title="Orbit Left"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
          <button
            onClick={() => handleOrbit(15, 0)}
            className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300 cursor-pointer"
            title="Orbit Right"
          >
            <RotateCw className="w-3 h-3" />
          </button>
        </div>

        <div className="flex gap-1">
          <button
            onClick={() => handleZoom(-30)}
            className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300 cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-3 h-3" />
          </button>
          <button
            onClick={() => handleZoom(30)}
            className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300 cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
