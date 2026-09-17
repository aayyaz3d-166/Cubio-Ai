/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.5: Model Builder & Transform Controls Panel
 */

import React, { useState, useEffect } from 'react';
import { ModelScene3D, ModelObject3D } from '../types';
import { TransformController } from '../transformController';
import {
  Boxes,
  Plus,
  Copy,
  Trash2,
  RotateCcw,
  Sliders,
  Move,
  Rotate3d,
  Maximize2,
  Undo2,
  Redo2,
} from 'lucide-react';

interface P65ModelBuilderPanelProps {
  scene: ModelScene3D;
  selectedObject: ModelObject3D | null;
  onUpdateScene: (scene: ModelScene3D, desc: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export const P65ModelBuilderPanel: React.FC<P65ModelBuilderPanelProps> = ({
  scene,
  selectedObject,
  onUpdateScene,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}) => {
  const [posX, setPosX] = useState(selectedObject ? selectedObject.transform.position[0] : 0);
  const [posY, setPosY] = useState(selectedObject ? selectedObject.transform.position[1] : 0);
  const [posZ, setPosZ] = useState(selectedObject ? selectedObject.transform.position[2] : 0);

  const [rotX, setRotX] = useState(selectedObject ? selectedObject.transform.rotation[0] : 0);
  const [rotY, setRotY] = useState(selectedObject ? selectedObject.transform.rotation[1] : 0);
  const [rotZ, setRotZ] = useState(selectedObject ? selectedObject.transform.rotation[2] : 0);

  const [scale, setScale] = useState(selectedObject ? selectedObject.transform.scale[0] : 1.0);

  useEffect(() => {
    if (selectedObject) {
      setPosX(selectedObject.transform.position[0]);
      setPosY(selectedObject.transform.position[1]);
      setPosZ(selectedObject.transform.position[2]);
      setRotX(selectedObject.transform.rotation[0]);
      setRotY(selectedObject.transform.rotation[1]);
      setRotZ(selectedObject.transform.rotation[2]);
      setScale(selectedObject.transform.scale[0]);
    }
  }, [selectedObject]);

  const handleApplyTransform = () => {
    if (!selectedObject) return;
    let nextScene = TransformController.moveObject(scene, selectedObject.modelObjectId, [posX, posY, posZ]);
    nextScene = TransformController.rotateObject(nextScene, selectedObject.modelObjectId, [rotX, rotY, rotZ]);
    nextScene = TransformController.scaleObject(nextScene, selectedObject.modelObjectId, [scale, scale, scale]);
    onUpdateScene(nextScene, `Transformed ${selectedObject.name}`);
  };

  return (
    <div className="flex flex-col gap-3 font-mono text-[11px]">
      {/* ── 3D MODEL SCENE CONTROLS ── */}
      <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800">
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold text-cyan-400 flex items-center gap-1.5">
            <Boxes className="w-3.5 h-3.5" /> 3D MODEL BUILDER
          </span>
          <span className="text-[9px] text-zinc-500">{scene.objects.length} Objects</span>
        </div>

        <div className="space-y-1 text-[9px] text-zinc-400 mb-2">
          <div>Scene: <strong className="text-zinc-200">{scene.sceneId}</strong></div>
          <div>Model Checksum: <strong className="text-cyan-400">{scene.modelChecksum}</strong></div>
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
      </div>

      {/* ── TRANSFORM SELECTED OBJECT ── */}
      {selectedObject ? (
        <div className="p-3 bg-zinc-900/60 rounded-xl border border-purple-500/40 shadow-lg space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-purple-400 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" /> 3D TRANSFORMS
            </span>
            <span className="text-[8.5px] text-zinc-500 truncate max-w-[100px]">{selectedObject.name}</span>
          </div>

          {/* Position Inputs */}
          <div>
            <label className="text-[8.5px] text-zinc-400 block mb-0.5 flex items-center gap-1">
              <Move className="w-2.5 h-2.5" /> Position (X, Y, Z)
            </label>
            <div className="grid grid-cols-3 gap-1">
              <input type="number" value={posX} onChange={(e) => setPosX(Number(e.target.value))} className="bg-black/60 border border-zinc-700 rounded px-1 py-0.5 text-center text-zinc-200" />
              <input type="number" value={posY} onChange={(e) => setPosY(Number(e.target.value))} className="bg-black/60 border border-zinc-700 rounded px-1 py-0.5 text-center text-zinc-200" />
              <input type="number" value={posZ} onChange={(e) => setPosZ(Number(e.target.value))} className="bg-black/60 border border-zinc-700 rounded px-1 py-0.5 text-center text-zinc-200" />
            </div>
          </div>

          {/* Rotation Inputs */}
          <div>
            <label className="text-[8.5px] text-zinc-400 block mb-0.5 flex items-center gap-1">
              <Rotate3d className="w-2.5 h-2.5" /> Rotation (Deg X, Y, Z)
            </label>
            <div className="grid grid-cols-3 gap-1">
              <input type="number" value={rotX} onChange={(e) => setRotX(Number(e.target.value))} className="bg-black/60 border border-zinc-700 rounded px-1 py-0.5 text-center text-zinc-200" />
              <input type="number" value={rotY} onChange={(e) => setRotY(Number(e.target.value))} className="bg-black/60 border border-zinc-700 rounded px-1 py-0.5 text-center text-zinc-200" />
              <input type="number" value={rotZ} onChange={(e) => setRotZ(Number(e.target.value))} className="bg-black/60 border border-zinc-700 rounded px-1 py-0.5 text-center text-zinc-200" />
            </div>
          </div>

          {/* Scale Slider */}
          <div>
            <label className="text-[8.5px] text-zinc-400 block mb-0.5 flex items-center justify-between">
              <span className="flex items-center gap-1"><Maximize2 className="w-2.5 h-2.5" /> Scale Factor</span>
              <span className="text-zinc-200">{scale.toFixed(1)}x</span>
            </label>
            <input type="range" min={0.2} max={5} step={0.1} value={scale} onChange={(e) => setScale(Number(e.target.value))} className="w-full accent-purple-500 cursor-pointer" />
          </div>

          <button
            onClick={handleApplyTransform}
            className="w-full py-1 bg-purple-600 hover:bg-purple-500 text-white rounded font-bold cursor-pointer"
          >
            Apply 3D Transform
          </button>
        </div>
      ) : (
        <div className="p-3 bg-zinc-900/40 rounded-xl border border-zinc-800 text-center text-zinc-500 italic text-[10px]">
          Select an object in the viewport to inspect & transform.
        </div>
      )}
    </div>
  );
};
