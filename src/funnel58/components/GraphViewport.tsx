/**
 * 3D Memory Studio — Funnel 58
 * Component: GraphViewport
 *
 * Primary testing viewport for the 3D Relationship & Graph Rendering Engine.
 */

import React, { useRef, useEffect, useState } from 'react';
import { useGraphEngine } from '../hooks/useGraphEngine';
import { GraphDiagnostics } from './GraphDiagnostics';
import { RelationshipInspector } from './RelationshipInspector';
import { GraphFilterControls } from './GraphFilterControls';
import { GraphRelationship } from '../types';

interface GraphViewportProps {
  onExit?: () => void;
}

export const GraphViewport: React.FC<GraphViewportProps> = ({ onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { graphEngine, renderer, filters, setFilters, stats } = useGraphEngine();
  const [selectedRel, setSelectedRel] = useState<GraphRelationship | null>(null);

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

  const handleFilterUpdate = (nextFilters: typeof filters) => {
    setFilters(nextFilters);
    graphEngine.applyFilters(nextFilters);
  };

  return (
    <div className="relative w-screen h-screen bg-[#070709] overflow-hidden select-none font-mono">
      {/* Top Diagnostics HUD */}
      <GraphDiagnostics stats={stats} />

      {/* Exit Button */}
      {onExit && (
        <div className="absolute top-4 right-4 z-30">
          <button
            onClick={onExit}
            className="px-3 py-1.5 bg-[#18181c] hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white rounded-lg text-xs font-bold transition shadow-xl cursor-pointer"
          >
            EXIT GRAPH ENGINE
          </button>
        </div>
      )}

      {/* Relationship Inspector Drawer */}
      <RelationshipInspector
        relationship={selectedRel}
        onClose={() => {
          setSelectedRel(null);
          graphEngine.selectRelationship(null);
        }}
      />

      {/* Filter Controls Toolbar */}
      <GraphFilterControls
        filters={filters}
        onUpdateFilters={handleFilterUpdate}
      />

      {/* Main Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block bg-[#070709]"
      />
    </div>
  );
};
