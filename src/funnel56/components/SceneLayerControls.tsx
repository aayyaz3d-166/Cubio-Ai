/**
 * 3D Memory Studio — Funnel 56
 * Component: SceneLayerControls
 *
 * Layer visibility checkboxes for the 7 standard scene layers.
 */

import React, { useState } from 'react';
import { SceneLayerId } from '../types';
import { SceneVisibilityManager } from '../visibility/visibilityManager';
import { ORDERED_LAYERS } from '../layers/layerManager';
import { Eye, EyeOff } from 'lucide-react';

interface SceneLayerControlsProps {
  visibilityManager: SceneVisibilityManager;
  onLayerToggled?: () => void;
}

export const SceneLayerControls: React.FC<SceneLayerControlsProps> = ({
  visibilityManager,
  onLayerToggled,
}) => {
  const [, setTick] = useState(0);

  const toggle = (layerId: SceneLayerId) => {
    visibilityManager.toggleLayer(layerId);
    setTick((t) => t + 1);
    if (onLayerToggled) onLayerToggled();
  };

  return (
    <div className="absolute bottom-4 left-4 z-30 bg-[#111114]/95 backdrop-blur-md border border-zinc-800 rounded-xl p-3 text-xs font-mono text-zinc-300 shadow-2xl space-y-1.5 select-none">
      <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1">
        Scene Layers Visibility
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-1">
        {ORDERED_LAYERS.map((layerId) => {
          const visible = visibilityManager.isLayerVisible(layerId);
          return (
            <button
              key={layerId}
              onClick={() => toggle(layerId)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] transition cursor-pointer text-left ${
                visible
                  ? 'bg-zinc-800/80 text-cyan-300 border border-cyan-800/50'
                  : 'bg-zinc-900/50 text-zinc-600 border border-zinc-800'
              }`}
            >
              {visible ? <Eye className="w-3 h-3 text-cyan-400" /> : <EyeOff className="w-3 h-3 text-zinc-600" />}
              <span>{layerId.replace('_LAYER', '')}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
