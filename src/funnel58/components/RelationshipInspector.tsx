/**
 * 3D Memory Studio — Funnel 58
 * Component: RelationshipInspector
 *
 * Side drawer inspecting details of selected relationship.
 */

import React from 'react';
import { GraphRelationship } from '../types';
import { Network, ArrowRight, ShieldCheck } from 'lucide-react';

interface RelationshipInspectorProps {
  relationship: GraphRelationship | null;
  onClose: () => void;
}

export const RelationshipInspector: React.FC<RelationshipInspectorProps> = ({
  relationship,
  onClose,
}) => {
  if (!relationship) return null;

  return (
    <div className="absolute top-4 right-4 z-30 w-72 bg-[#111114]/95 backdrop-blur-md border border-teal-900/60 rounded-xl p-3 text-xs font-mono text-zinc-300 shadow-2xl space-y-2 select-none">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5">
        <span className="font-bold text-white flex items-center gap-1.5">
          <Network className="w-3.5 h-3.5 text-teal-400" />
          <span>RELATIONSHIP INSPECTOR</span>
        </span>
        <button
          onClick={onClose}
          className="text-zinc-500 hover:text-white text-xs cursor-pointer font-bold"
        >
          ✕
        </button>
      </div>

      <div className="space-y-1.5 text-[11px]">
        <div>
          <div className="text-[10px] text-zinc-500">RELATIONSHIP ID</div>
          <div className="text-teal-300 font-bold truncate">{relationship.relationshipId}</div>
        </div>

        <div className="bg-[#18181c] p-2 rounded border border-zinc-800 space-y-1">
          <div className="text-[10px] text-zinc-500">CONNECTION</div>
          <div className="flex items-center gap-1.5 text-xs text-white">
            <span className="truncate max-w-[90px]">{relationship.sourceStateId}</span>
            <ArrowRight className="w-3 h-3 text-teal-400 shrink-0" />
            <span className="truncate max-w-[90px]">{relationship.targetStateId}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div>
            <span className="text-zinc-500">TYPE:</span>{' '}
            <span className="text-white font-bold">{relationship.relationshipType}</span>
          </div>
          <div>
            <span className="text-zinc-500">STRENGTH:</span>{' '}
            <span className="text-emerald-400 font-bold">{relationship.strength}</span>
          </div>
          <div>
            <span className="text-zinc-500">DIRECTION:</span>{' '}
            <span className="text-zinc-300">{relationship.direction}</span>
          </div>
          <div>
            <span className="text-zinc-500">STATUS:</span>{' '}
            <span className="text-emerald-400 font-bold">
              {relationship.classification}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
