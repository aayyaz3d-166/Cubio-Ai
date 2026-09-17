/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.6: Advanced Construction Controls Panel
 */

import React from 'react';
import { AdvancedGeometryScene, AdvancedGeometryObject } from '../types';
import { CurveBuilder } from '../curveBuilder';
import { SurfaceBuilder } from '../surfaceBuilder';
import { GeometryKernel } from '../geometryKernel';
import { BooleanOperationsEngine } from '../booleanOperations';
import {
  Boxes,
  Plus,
  Undo2,
  Redo2,
  Spline,
  Layers,
  Box,
  Combine,
  Scissors,
} from 'lucide-react';

interface P66ConstructionPanelProps {
  scene: AdvancedGeometryScene;
  selectedObject: AdvancedGeometryObject | null;
  onUpdateScene: (scene: AdvancedGeometryScene, desc: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export const P66ConstructionPanel: React.FC<P66ConstructionPanelProps> = ({
  scene,
  selectedObject,
  onUpdateScene,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}) => {
  const handleAddPoint = () => {
    const pt = GeometryKernel.createPointObject([10, 10, 10], 'Point A');
    const updated = GeometryKernel.buildScene(scene.sourceRealityChecksum, scene.sourceModelChecksum, [
      ...scene.objects,
      pt,
    ]);
    onUpdateScene(updated, 'Created Point');
  };

  const handleAddBezier = () => {
    const crv = CurveBuilder.createBezier([
      [0, 0, 0],
      [5, 10, 0],
      [15, 10, 5],
      [20, 0, 5],
    ]);
    const obj = GeometryKernel.createCurveObject(crv, 'Bezier Curve');
    const updated = GeometryKernel.buildScene(scene.sourceRealityChecksum, scene.sourceModelChecksum, [
      ...scene.objects,
      obj,
    ]);
    onUpdateScene(updated, 'Created Bezier Curve');
  };

  const handleAddExtrusion = () => {
    const circle = CurveBuilder.createCircle([5, 3, 6], 3);
    const obj = GeometryKernel.createExtrudedSolidObject(circle, 10, 'Extruded Cylinder');
    const updated = GeometryKernel.buildScene(scene.sourceRealityChecksum, scene.sourceModelChecksum, [
      ...scene.objects,
      obj,
    ]);
    onUpdateScene(updated, 'Created Extruded Solid');
  };

  const handleBooleanUnion = () => {
    if (scene.objects.length < 2) return;
    const objA = scene.objects[0];
    const objB = scene.objects[1];
    const res = BooleanOperationsEngine.executeBoolean('UNION', objA.mesh, objB.mesh);
    if (res.outputMesh) {
      const boolObj: AdvancedGeometryObject = {
        id: `BOOL_UNION_${res.outputChecksum.slice(0, 6)}`,
        name: 'Boolean Union Result',
        mesh: res.outputMesh,
        certainty: 'EXACT',
        color: '#f59e0b',
        visible: true,
        geometryChecksum: res.outputChecksum,
      };
      const updated = GeometryKernel.buildScene(scene.sourceRealityChecksum, scene.sourceModelChecksum, [
        ...scene.objects,
        boolObj,
      ]);
      onUpdateScene(updated, 'Executed Boolean Union');
    }
  };

  return (
    <div className="flex flex-col gap-3 font-mono text-[11px]">
      {/* ── CONSTRUCTION CONTROLS ── */}
      <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-bold text-purple-400 flex items-center gap-1.5">
            <Boxes className="w-3.5 h-3.5" /> GEOMETRY GENERATOR
          </span>
          <span className="text-[9px] text-zinc-500">{scene.objects.length} Entities</span>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="py-1 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 text-zinc-300 rounded flex items-center justify-center gap-1 cursor-pointer font-bold"
          >
            <Undo2 className="w-3 h-3" /> Undo
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="py-1 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 text-zinc-300 rounded flex items-center justify-center gap-1 cursor-pointer font-bold"
          >
            <Redo2 className="w-3 h-3" /> Redo
          </button>
        </div>

        <div className="space-y-1 pt-1">
          <button
            onClick={handleAddPoint}
            className="w-full py-1 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 rounded border border-cyan-500/30 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3 h-3" /> Create 3D Point
          </button>
          <button
            onClick={handleAddBezier}
            className="w-full py-1 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 rounded border border-purple-500/30 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Spline className="w-3 h-3" /> Create Bezier Curve
          </button>
          <button
            onClick={handleAddExtrusion}
            className="w-full py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 rounded border border-emerald-500/30 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Box className="w-3 h-3" /> Extrude Closed Solid
          </button>
          <button
            onClick={handleBooleanUnion}
            disabled={scene.objects.length < 2}
            className="w-full py-1 bg-amber-600/20 hover:bg-amber-600/30 disabled:opacity-30 text-amber-300 rounded border border-amber-500/30 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Combine className="w-3 h-3" /> CSG Boolean Union (A+B)
          </button>
        </div>
      </div>
    </div>
  );
};
