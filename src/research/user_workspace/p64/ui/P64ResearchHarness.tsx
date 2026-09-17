/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.4: Observer Fusion, Constraint Manifold & Information Boundary — Research Dashboard
 */

import React, { useMemo, useState, useReducer, useCallback } from 'react';
import { WorkspaceReality, WorkspaceObserver } from '../../p61/types';
import { createDefaultExperimentalReality } from '../../p61/realityBuilder';
import { ExtendedObserverKey, ObserverFusionConfig } from '../types';
import { createStandardObserverMap } from '../observerFusion';
import { RecoveryAnalyzer } from '../recoveryAnalyzer';
import { P64ObserverFusionPanel } from './P64ObserverFusionPanel';
import { P64CandidateSpacePanel } from './P64CandidateSpacePanel';
import { P64InformationBoundaryPanel } from './P64InformationBoundaryPanel';
import { P63WorkspaceCanvas } from '../../p63/ui/P63WorkspaceCanvas';
import { P62InteractionPanel } from '../../p62/ui/P62InteractionPanel';
import { SelectionController } from '../../p62/selectionController';
import { FusionHistoryManager } from '../fusionHistory';
import { RealityMutationEngine } from '../../p62/realityMutation';
import { ObserverFusionEngine } from '../observerFusion';
import { Boxes, Eye, RotateCcw } from 'lucide-react';

export const P64ResearchHarness: React.FC<{ onExit?: () => void }> = ({ onExit }) => {
  const [reality, setReality] = useState<WorkspaceReality>(() => createDefaultExperimentalReality());
  const [observers] = useState<Record<ExtendedObserverKey, WorkspaceObserver>>(() => createStandardObserverMap(2));
  const [activeViewKey, setActiveViewKey] = useState<ExtendedObserverKey>('O0');
  const [fusionConfig, setFusionConfig] = useState<ObserverFusionConfig>({
    enabledKeys: ['O0', 'O1'],
    noiseMagnitude: 0,
  });

  const selection = useMemo(() => new SelectionController('P61_OBJ_A'), []);
  const history = useMemo(() => new FusionHistoryManager(reality, {
    selectedObjectId: 'P61_OBJ_A',
    multiSelectedIds: ['P61_OBJ_A'],
    selectionTimestamp: 0,
  }), []);

  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  const fusionResult = useMemo(
    () => RecoveryAnalyzer.analyzeFusion(reality, observers, fusionConfig),
    [reality, observers, fusionConfig]
  );

  const frames = useMemo(
    () => ObserverFusionEngine.projectAllActiveFrames(reality, observers, { enabledKeys: [activeViewKey], noiseMagnitude: fusionConfig.noiseMagnitude }),
    [reality, observers, activeViewKey, fusionConfig.noiseMagnitude]
  );

  const currentObserver = observers[activeViewKey];
  const currentFrame = frames[activeViewKey] || Object.values(frames)[0];

  const handleToggleKey = (k: ExtendedObserverKey) => {
    setFusionConfig((prev) => {
      const exists = prev.enabledKeys.includes(k);
      const nextKeys = exists ? prev.enabledKeys.filter((x) => x !== k) : [...prev.enabledKeys, k];
      return { ...prev, enabledKeys: nextKeys };
    });
  };

  const handleSetNoise = (noise: number) => {
    setFusionConfig((prev) => ({ ...prev, noiseMagnitude: noise }));
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#050507] text-[#E0E0E0] font-mono overflow-hidden select-none">
      {/* ── TOP HEADER ── */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-black/80 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <Boxes className="w-5 h-5 text-cyan-400" />
          <span className="text-sm font-bold text-cyan-400">
            P6.4 — OBSERVER FUSION, CONSTRAINT MANIFOLD & INFORMATION BOUNDARY
          </span>
          <span className="text-xs text-zinc-500">Phase 6: Information Boundary</span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
            Reality X: <strong className="text-cyan-400">{reality.realityChecksum}</strong>
          </span>
          <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
            Fused Observers: <strong className="text-purple-400">{fusionConfig.enabledKeys.length}</strong>
          </span>
          {onExit && (
            <button
              onClick={onExit}
              className="text-xs text-zinc-400 hover:text-white px-2 py-1 rounded border border-zinc-700 hover:border-zinc-500 cursor-pointer"
            >
              EXIT
            </button>
          )}
        </div>
      </div>

      {/* ── MAIN 3-PANEL BODY ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT: REALITY BUILDER */}
        <div className="w-[280px] flex-shrink-0 border-r border-zinc-800 p-3 overflow-y-auto bg-[#070709]/90">
          <P62InteractionPanel
            engine={{
              reality,
              getSelectedObject: () => {
                const id = selection.getState().selectedObjectId;
                return id ? reality.objects.find((o) => o.id === id) || null : null;
              },
              createObject: (p) => {
                const { updatedReality, createdObjectId } = RealityMutationEngine.createObject(reality, p);
                setReality(updatedReality);
                selection.select(createdObjectId, updatedReality);
                history.recordMutation(updatedReality, selection.getState() as any, `Created ${createdObjectId}`);
                return createdObjectId;
              },
              moveSelectedObject: (pos) => {
                const id = selection.getState().selectedObjectId;
                if (!id) return;
                const updated = RealityMutationEngine.moveObject(reality, id, pos);
                setReality(updated);
                history.recordMutation(updated, selection.getState() as any, `Moved ${id}`);
              },
              translateSelectedObject: (delta) => {
                const id = selection.getState().selectedObjectId;
                if (!id) return;
                const obj = reality.objects.find((o) => o.id === id);
                if (!obj) return;
                const nextPos: [number, number, number] = [
                  obj.position[0] + delta[0],
                  obj.position[1] + delta[1],
                  obj.position[2] + delta[2],
                ];
                const updated = RealityMutationEngine.moveObject(reality, id, nextPos);
                setReality(updated);
                history.recordMutation(updated, selection.getState() as any, `Translated ${id}`);
              },
              duplicateSelectedObject: () => {
                const id = selection.getState().selectedObjectId;
                if (!id) return null;
                const { updatedReality, duplicatedObjectId } = RealityMutationEngine.duplicateObject(reality, id);
                if (!duplicatedObjectId) return null;
                setReality(updatedReality);
                selection.select(duplicatedObjectId, updatedReality);
                history.recordMutation(updatedReality, selection.getState() as any, `Duplicated ${id}`);
                return duplicatedObjectId;
              },
              deleteSelectedObject: () => {
                const id = selection.getState().selectedObjectId;
                if (!id) return;
                const updated = RealityMutationEngine.deleteObject(reality, id);
                setReality(updated);
                selection.deselect();
                history.recordMutation(updated, selection.getState() as any, `Deleted ${id}`);
              },
              resetReality: () => {
                const updated = RealityMutationEngine.resetReality();
                setReality(updated);
                selection.select('P61_OBJ_A', updated);
                history.recordMutation(updated, selection.getState() as any, 'Reset Reality');
              },
              loadCanonicalP5Reality: () => {
                const updated = RealityMutationEngine.loadCanonicalCopy();
                setReality(updated);
                const first = updated.objects[0]?.id || null;
                if (first) selection.select(first, updated);
                history.recordMutation(updated, selection.getState() as any, 'Loaded Canonical Copy');
              },
              undo: () => {
                const res = history.undo();
                if (res) {
                  setReality(res.reality);
                  selection.select(res.selection.selectedObjectId || '', res.reality);
                  selection.pruneSelection(res.reality);
                  return true;
                }
                return false;
              },
              redo: () => {
                const res = history.redo();
                if (res) {
                  setReality(res.reality);
                  selection.select(res.selection.selectedObjectId || '', res.reality);
                  selection.pruneSelection(res.reality);
                  return true;
                }
                return false;
              },
              history,
            } as any}
            onRefresh={forceUpdate}
          />
        </div>

        {/* CENTER: VIEWPORT CANVAS & INFORMATION BOUNDARY */}
        <div className="flex-1 flex flex-col p-3 gap-2 overflow-hidden bg-black/30">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-cyan-400 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" /> {currentObserver?.label}
            </span>
            <span className="text-[10px] text-zinc-500">
              Pos: [{currentObserver?.position.map((v) => v.toFixed(0)).join(',')}]
            </span>
          </div>

          <div className="flex-1 flex items-center justify-center">
            {currentFrame && (
              <P63WorkspaceCanvas
                reality={reality}
                observer={currentObserver}
                observableFrame={currentFrame}
                selectedObjectId={selection.getState().selectedObjectId}
                onSelectObject={(id) => {
                  if (id) selection.select(id, reality);
                  else selection.deselect();
                  forceUpdate();
                }}
                width={520}
                height={300}
              />
            )}
          </div>

          <P64InformationBoundaryPanel fusionResult={fusionResult} />
        </div>

        {/* RIGHT: OBSERVER FUSION CONTROLS */}
        <div className="w-[300px] flex-shrink-0 border-l border-zinc-800 p-3 overflow-y-auto bg-[#070709]/90">
          <P64ObserverFusionPanel
            observers={observers}
            config={fusionConfig}
            activeViewKey={activeViewKey}
            onSelectActiveView={setActiveViewKey}
            onToggleKey={handleToggleKey}
            onSetNoiseMagnitude={handleSetNoise}
          />
        </div>
      </div>

      {/* ── BOTTOM PANEL: CANDIDATE SPACE & CONSTRAINT MANIFOLD ── */}
      <P64CandidateSpacePanel fusionResult={fusionResult} />
    </div>
  );
};
