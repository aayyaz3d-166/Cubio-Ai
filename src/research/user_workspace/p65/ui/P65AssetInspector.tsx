/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.5: Asset Inspector Panel
 */

import React from 'react';
import { ModelObject3D, ModelScene3D } from '../types';
import { GeometryValidator } from '../geometryValidator';
import { FileCode, Layers, ShieldCheck, Box, Info } from 'lucide-react';

interface P65AssetInspectorProps {
  scene: ModelScene3D;
  selectedObject: ModelObject3D | null;
}

export const P65AssetInspector: React.FC<P65AssetInspectorProps> = ({ scene, selectedObject }) => {
  const report = GeometryValidator.validateScene(scene);

  return (
    <div className="flex flex-col gap-3 font-mono text-[11px]">
      {/* ── ASSET METRICS & EXPORT SUMMARY ── */}
      <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800 space-y-1.5 text-[9px]">
        <div className="font-bold text-cyan-400 text-[10.5px] flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5" /> SCENE ASSET MANIFOLD
        </div>
        <div>Scene ID: <strong className="text-zinc-200">{scene.sceneId}</strong></div>
        <div>Objects: <strong className="text-zinc-200">{scene.objects.length}</strong></div>
        <div>Total Vertices: <strong className="text-emerald-400">{scene.totalVertices}</strong></div>
        <div>Total Faces: <strong className="text-emerald-400">{scene.totalFaces}</strong></div>
        <div>Scene Checksum: <strong className="text-purple-400">{scene.sceneChecksum}</strong></div>
        <div>Validation: <strong className={report.isValid ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>{report.status}</strong></div>
      </div>

      {/* ── SELECTED OBJECT ASSET DETAILS ── */}
      {selectedObject ? (
        <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800 space-y-1.5 text-[9px]">
          <div className="font-bold text-purple-400 text-[10.5px] flex items-center gap-1.5">
            <Box className="w-3.5 h-3.5" /> OBJECT ASSET INSPECTOR
          </div>
          <div>Name: <strong className="text-zinc-200">{selectedObject.name}</strong></div>
          <div>Model ID: <strong className="text-cyan-400">{selectedObject.modelObjectId}</strong></div>
          <div>Geometry: <strong className="text-zinc-300">{selectedObject.geometry.type}</strong></div>
          <div>Vertices: <strong className="text-zinc-300">{selectedObject.geometry.vertices.length}</strong> | Faces: <strong className="text-zinc-300">{selectedObject.geometry.faces.length}</strong></div>
          <div>Bounds: <span className="text-zinc-400">[{selectedObject.geometry.boundingBox.dimensions.join(', ')}]</span></div>
          <div>Geo Checksum: <strong className="text-purple-400">{selectedObject.geometry.geometryChecksum}</strong></div>
          <div>Lineage: <span className="text-zinc-500">{selectedObject.creationLineage}</span></div>
          <div>Certainty: <strong className="text-emerald-400">{selectedObject.reconstructionCertainty}</strong></div>
        </div>
      ) : (
        <div className="p-3 bg-zinc-900/40 rounded-xl border border-zinc-800 text-center text-zinc-500 italic text-[10px]">
          Select an object to inspect asset metadata.
        </div>
      )}
    </div>
  );
};
