/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.8: Experiments Panel (My Experiments)
 */

import React, { useState } from 'react';
import { ExperimentRecord, PersonalSpace } from '../types';
import { FlaskConical, Plus, GitFork } from 'lucide-react';

interface P68ExperimentPanelProps {
  experiments: readonly ExperimentRecord[];
  activeSpace: PersonalSpace | undefined;
  onCreateExperiment: (name: string) => void;
}

export const P68ExperimentPanel: React.FC<P68ExperimentPanelProps> = ({
  experiments,
  activeSpace,
  onCreateExperiment,
}) => {
  const [expName, setExpName] = useState('');

  const handleCreate = () => {
    if (!expName.trim() || !activeSpace) return;
    onCreateExperiment(expName.trim());
    setExpName('');
  };

  return (
    <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800 font-mono text-[10px] space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="font-bold text-cyan-400 flex items-center gap-1.5">
          <FlaskConical className="w-3.5 h-3.5" /> MY EXPERIMENTS ({experiments.length})
        </span>
      </div>

      <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
        {experiments.length > 0 ? (
          experiments.map((exp) => (
            <div
              key={exp.experimentId}
              className="p-2 rounded bg-black/40 border border-zinc-800 text-[8.5px] space-y-0.5"
            >
              <div className="flex items-center justify-between font-bold text-zinc-200">
                <span>{exp.name}</span>
                <span className="text-[7.5px] text-cyan-400">{exp.experimentId}</span>
              </div>
              <div className="text-[7.5px] text-zinc-500 flex items-center justify-between">
                <span>Space: {exp.spaceId}</span>
                <span>CS: {exp.currentChecksum.slice(0, 8)}</span>
              </div>
              <div className="text-[7.5px] text-purple-400 flex items-center gap-1">
                <GitFork className="w-2.5 h-2.5" /> Lineage: {exp.lineageId}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-zinc-500 italic py-1 text-[8.5px]">No experiments recorded.</div>
        )}
      </div>

      {activeSpace && (
        <div className="flex gap-1 pt-1 border-t border-zinc-800">
          <input
            type="text"
            placeholder="New experiment name..."
            value={expName}
            onChange={(e) => setExpName(e.target.value)}
            className="flex-1 px-2 py-1 bg-black/50 border border-zinc-800 rounded text-zinc-200 text-[8.5px] focus:outline-none focus:border-cyan-500"
          />
          <button
            onClick={handleCreate}
            className="px-2 py-1 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 rounded border border-cyan-500/30 flex items-center gap-1 text-[8.5px] cursor-pointer"
          >
            <Plus className="w-2.5 h-2.5" /> Link
          </button>
        </div>
      )}
    </div>
  );
};
