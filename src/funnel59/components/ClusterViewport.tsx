/**
 * 3D Memory Studio — Funnel 59
 * Component: ClusterViewport
 *
 * Primary testing viewport for the 3D Cluster & Spatial Organization Engine.
 */

import React, { useRef, useEffect, useState } from 'react';
import { useClusterEngine } from '../hooks/useClusterEngine';
import { ClusterDiagnostics } from './ClusterDiagnostics';
import { ClusterInspector } from './ClusterInspector';
import { ClusterLayoutControls } from './ClusterLayoutControls';
import { Cluster } from '../types';

interface ClusterViewportProps {
  onExit?: () => void;
}

export const ClusterViewport: React.FC<ClusterViewportProps> = ({ onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { clusterEngine, renderer, stats, changeLayoutMode } = useClusterEngine();
  const [selectedCluster, setSelectedCluster] = useState<Cluster | null>(null);

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
      <ClusterDiagnostics stats={stats} />

      {/* Exit Button */}
      {onExit && (
        <div className="absolute top-4 right-4 z-30">
          <button
            onClick={onExit}
            className="px-3 py-1.5 bg-[#18181c] hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white rounded-lg text-xs font-bold transition shadow-xl cursor-pointer"
          >
            EXIT CLUSTER ENGINE
          </button>
        </div>
      )}

      {/* Cluster Inspector Drawer */}
      <ClusterInspector
        cluster={selectedCluster}
        onClose={() => {
          setSelectedCluster(null);
          clusterEngine.selectCluster(null);
        }}
      />

      {/* Spatial Layout Controls */}
      <ClusterLayoutControls
        currentMode={stats.layoutMode}
        onChangeMode={changeLayoutMode}
      />

      {/* Main Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block bg-[#070709]"
      />
    </div>
  );
};
