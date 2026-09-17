/**
 * 3D Memory Studio — Funnel 56
 * Component: SceneViewport
 *
 * Master Scene Engine Viewport displaying diagnostics HUD, layer controls, and inspector.
 */

import React, { useRef, useEffect } from 'react';
import { useSceneEngine } from '../hooks/useSceneEngine';
import { SceneDiagnostics } from './SceneDiagnostics';
import { SceneLayerControls } from './SceneLayerControls';
import { SceneInspector } from './SceneInspector';

interface SceneViewportProps {
  onExit?: () => void;
}

export const SceneViewport: React.FC<SceneViewportProps> = ({ onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { engine, renderer, stats, selectedObject, selectState, highlightQuery } = useSceneEngine();

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

  return (
    <div className="relative w-screen h-screen bg-[#070709] overflow-hidden select-none font-mono">
      {/* Top Diagnostics HUD */}
      <SceneDiagnostics stats={stats} />

      {/* Exit Button & Search Bar */}
      <div className="absolute top-4 right-4 z-30 flex items-center gap-3">
        <input
          type="text"
          placeholder="Search scene (F50)..."
          onChange={(e) => highlightQuery(e.target.value)}
          className="px-3 py-1.5 bg-[#111114]/90 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-hidden focus:border-cyan-500 w-48 shadow-xl"
        />

        {onExit && (
          <button
            onClick={onExit}
            className="px-3 py-1.5 bg-[#18181c] hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white rounded-lg text-xs font-bold transition shadow-xl cursor-pointer"
          >
            EXIT SCENE
          </button>
        )}
      </div>

      {/* Layer Visibility Controls */}
      <SceneLayerControls visibilityManager={engine.visibility} />

      {/* Selected Object Inspector */}
      <SceneInspector
        selectedObject={selectedObject}
        onClose={() => selectState(null)}
      />

      {/* Main 3D Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block bg-[#070709]"
      />
    </div>
  );
};
