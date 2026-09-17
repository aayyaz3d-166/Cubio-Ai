/**
 * 3D Memory Studio — Funnel 61
 * Component: CameraViewport
 *
 * Primary testing viewport for the 3D Camera & Navigation Engine.
 */

import React, { useRef, useEffect, useState } from 'react';
import { useCameraEngine } from '../hooks/useCameraEngine';
import { CameraDiagnostics } from './CameraDiagnostics';
import { CameraPresetControls } from './CameraPresetControls';
import { NavigationControls } from './NavigationControls';

interface CameraViewportProps {
  onExit?: () => void;
}

export const CameraViewport: React.FC<CameraViewportProps> = ({ onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { camEngine, renderer, stats, applyPreset, resetCamera } = useCameraEngine();
  const [, setTick] = useState(0);

  // Attach canvas to renderer host
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      renderer.attach(canvas);
      renderer.start();
    }
    return () => {
      renderer.dispose();
    };
  }, [renderer]);

  const forceUpdate = () => setTick((t) => t + 1);

  return (
    <div className="relative w-screen h-screen bg-[#070709] overflow-hidden select-none font-mono">
      {/* Top Diagnostics HUD */}
      <CameraDiagnostics stats={stats} />

      {/* Exit Button */}
      {onExit && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30">
          <button
            onClick={onExit}
            className="px-3 py-1.5 bg-[#18181c] hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white rounded-lg text-xs font-bold transition shadow-xl cursor-pointer"
          >
            EXIT CAMERA ENGINE
          </button>
        </div>
      )}

      {/* Preset Controls Toolbar */}
      <CameraPresetControls
        currentPreset={stats.currentPreset}
        onApplyPreset={applyPreset}
        onReset={resetCamera}
      />

      {/* Navigation Controls Dock */}
      <NavigationControls
        camEngine={camEngine}
        onUpdate={forceUpdate}
      />

      {/* Main Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block bg-[#070709]"
      />
    </div>
  );
};
