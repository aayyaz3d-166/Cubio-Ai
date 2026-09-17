/**
 * 3D Memory Studio — Funnel 56
 * Component: SceneInspector
 *
 * Inspector panel displaying selected scene object metadata, world transform, and 369 sequence.
 */

import React from 'react';
import { ISceneObject } from '../types';
import { StateSceneObject } from '../objects/stateSceneObject';
import { X, ShieldCheck, Cpu } from 'lucide-react';

interface SceneInspectorProps {
  selectedObject: ISceneObject | null;
  onClose: () => void;
}

export const SceneInspector: React.FC<SceneInspectorProps> = ({
  selectedObject,
  onClose,
}) => {
  if (!selectedObject) return null;

  const stateObj = selectedObject instanceof StateSceneObject ? selectedObject : null;
  const [wx, wy, wz] = selectedObject.worldTransform.position;

  return (
    <div className="absolute top-4 right-4 z-30 w-80 bg-[#111114]/95 backdrop-blur-md border border-purple-900/60 rounded-xl p-4 text-xs font-mono text-zinc-300 shadow-2xl space-y-2.5 select-none">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
        <span className="font-bold text-white flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5 text-purple-400" />
          <span>SCENE OBJECT INSPECTOR</span>
        </span>
        <button
          onClick={onClose}
          className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-1.5 text-[11px]">
        <div className="flex justify-between">
          <span className="text-zinc-500">Object ID:</span>
          <span className="text-purple-300 font-bold">{selectedObject.id}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-zinc-500">Type / Layer:</span>
          <span className="text-zinc-300">
            {selectedObject.type} ({selectedObject.layerId.replace('_LAYER', '')})
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-zinc-500">World Position:</span>
          <span className="text-cyan-400">
            [{wx.toFixed(1)}, {wy.toFixed(1)}, {wz.toFixed(1)}]
          </span>
        </div>

        {stateObj && (
          <>
            <div className="flex justify-between">
              <span className="text-zinc-500">Category:</span>
              <span className="text-sky-300 font-semibold">{stateObj.category}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-zinc-500">Classification:</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                {stateObj.classification} (AUTHORIZED)
              </span>
            </div>

            {stateObj.sequence369 && (
              <div className="flex justify-between">
                <span className="text-zinc-500">369 Sequence:</span>
                <span className="text-amber-400 font-bold">{stateObj.sequence369}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span className="text-zinc-500">Checksum:</span>
              <span className="text-zinc-400">{stateObj.checksum.substring(0, 10)}...</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
