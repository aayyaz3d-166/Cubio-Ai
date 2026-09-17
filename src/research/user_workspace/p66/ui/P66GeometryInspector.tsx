/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.6: Advanced Geometry Inspector Panel
 */

import React from 'react';
import { AdvancedGeometryScene, AdvancedGeometryObject } from '../types';
import { Layers, Box, FileCode, CheckCircle, ShieldAlert } from 'lucide-react';

interface P66GeometryInspectorProps {
  scene: AdvancedGeometryScene;
  selectedObject: AdvancedGeometryObject | null;
}

export const P66GeometryInspector: React.FC<P66GeometryInspectorProps> = ({ scene, selectedObject }) => {
  return (
    <div className="flex flex-col gap-3 font-mono text-[11px]">
      {/* ── SCENE METRICS ── */}
      <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800 space-y-1 text-[9px]">
        <div className="font-bold text-purple-400 text-[10.5px] flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5" /> GEOMETRY SCENE MANIFOLD
        </div>
        <div>Scene ID: <strong className="text-zinc-200">{scene.sceneId}</strong></div>
        <div>Entities: <strong className="text-zinc-200">{scene.objects.length}</strong></div>
        <div>Scene Checksum: <strong className="text-cyan-400">{scene.sceneChecksum}</strong></div>
        <div>Source Reality CS: <strong className="text-zinc-400">{scene.sourceRealityChecksum}</strong></div>
      </div>

      {/* ── SELECTED OBJECT METRICS ── */}
      {selectedObject ? (
        <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800 space-y-1 text-[9px]">
          <div className="font-bold text-cyan-400 text-[10.5px] flex items-center gap-1.5">
            <Box className="w-3.5 h-3.5" /> ENTITY INSPECTOR
          </div>
          <div>Name: <strong className="text-zinc-200">{selectedObject.name}</strong></div>
          <div>ID: <strong className="text-purple-400">{selectedObject.id}</strong></div>
          <div>Vertices: <strong className="text-zinc-300">{selectedObject.mesh.vertices.length}</strong> | Faces: <strong className="text-zinc-300">{selectedObject.mesh.faces.length}</strong></div>
          <div>Bounds: <span className="text-zinc-400">[{selectedObject.mesh.bounds.dimensions.join(', ')}]</span></div>
          <div>Certainty: <strong className="text-emerald-400">{selectedObject.certainty}</strong></div>
          <div>Checksum: <strong className="text-cyan-400">{selectedObject.geometryChecksum}</strong></div>
        </div>
      ) : (
        <div className="p-3 bg-zinc-900/40 rounded-xl border border-zinc-800 text-center text-zinc-500 italic text-[10px]">
          Select an entity in viewport to inspect details.
        </div>
      )}
    </div>
  );
};
