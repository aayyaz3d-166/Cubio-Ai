/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.7: Parametric Geometry & Feature Construction — Research Dashboard
 */

import React, { useState, useMemo, useReducer } from 'react';
import { ParametricFeatureGraph, ParametricFeature, Sketch2D } from '../types';
import { SketchBuilder } from '../sketchBuilder';
import { FeatureBuilder } from '../featureBuilder';
import { FeatureGraphController } from '../featureGraph';
import { FeatureEvaluator } from '../featureEvaluator';
import { FeatureValidator } from '../featureValidator';
import { FeatureHistoryManager } from '../featureHistory';
import { FeatureExportEngine } from '../featureExport';
import { P66BridgeAdapter } from '../p66Bridge';
import { createDefaultExperimentalReality } from '../../p61/realityBuilder';
import { ModelRepresentationEngine } from '../../p65/modelRepresentation';
import { P65BridgeAdapter } from '../../p66/p65Bridge';
import { P67FeatureViewport } from './P67FeatureViewport';
import { P67FeatureTree } from './P67FeatureTree';
import { P67FeatureInspector } from './P67FeatureInspector';
import { P67ValidationPanel } from './P67ValidationPanel';
import { Network, Undo, Redo, RefreshCw, Box } from 'lucide-react';

export const P67ResearchHarness: React.FC<{ onExit?: () => void }> = ({ onExit }) => {
  const [graph, setGraph] = useState<ParametricFeatureGraph>(() => {
    const reality = createDefaultExperimentalReality();
    const model = ModelRepresentationEngine.buildSceneFromReality(reality);
    const p66Scene = P65BridgeAdapter.adaptScene(model);
    return P66BridgeAdapter.adaptP66Scene(p66Scene);
  });

  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(
    () => graph.features[0]?.id || null
  );

  const history = useMemo(() => new FeatureHistoryManager(graph), []);
  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  const evaluatedScene = useMemo(() => FeatureEvaluator.evaluateEvaluatedScene(graph), [graph]);
  const validationReport = useMemo(() => FeatureValidator.validateGraph(graph), [graph]);

  const selectedFeature = useMemo(
    () => graph.features.find((f) => f.id === selectedFeatureId) || null,
    [graph, selectedFeatureId]
  );

  const handleUpdateParam = (paramId: string, val: number) => {
    const nextGraph = FeatureEvaluator.updateParameterAndEvaluate(graph, paramId, val);
    history.recordGraph(nextGraph, `Update param ${paramId} to ${val}`);
    setGraph(nextGraph);
  };

  const handleToggleSuppress = (featureId: string) => {
    const target = graph.features.find((f) => f.id === featureId);
    if (!target) return;
    const nextState = target.state === 'SUPPRESSED' ? 'ACTIVE' : 'SUPPRESSED';
    const nextGraph = FeatureGraphController.setFeatureState(graph, featureId, nextState);
    history.recordGraph(nextGraph, `Toggle suppress ${featureId}`);
    setGraph(nextGraph);
  };

  const handleDeleteFeature = (featureId: string) => {
    const nextGraph = FeatureGraphController.removeFeature(graph, featureId);
    history.recordGraph(nextGraph, `Delete feature ${featureId}`);
    setGraph(nextGraph);
    if (selectedFeatureId === featureId) {
      setSelectedFeatureId(nextGraph.features[0]?.id || null);
    }
  };

  const handleUndo = () => {
    const item = history.undo();
    if (item) {
      setGraph(item.graph);
      forceUpdate();
    }
  };

  const handleRedo = () => {
    const item = history.redo();
    if (item) {
      setGraph(item.graph);
      forceUpdate();
    }
  };

  const handleAddExtrusion = () => {
    const sketch = SketchBuilder.createRectangleSketch(15, 15, 'XY', [0, 0, 0], `SKETCH_${graph.features.length + 1}`);
    const ext = FeatureBuilder.createExtrusion(sketch, 20, false, `EXTRUDE_${graph.features.length + 1}`);
    const nextGraph = FeatureGraphController.addFeature(graph, ext);
    history.recordGraph(nextGraph, `Add Extrude feature`);
    setGraph(nextGraph);
    setSelectedFeatureId(ext.id);
  };

  const handleExport = (type: 'OBJ' | 'STL' | 'META') => {
    const bundle = FeatureExportEngine.exportFeatureScene(graph, evaluatedScene);
    console.log(`[Export ${type}]`, bundle);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#050507] text-[#E0E0E0] font-mono overflow-hidden select-none">
      {/* ── TOP HEADER ── */}
      <div className="flex items-center justify-between px-4 py-2 bg-black/80 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <Network className="w-5 h-5 text-purple-400" />
          <span className="text-sm font-bold text-purple-400">
            P6.7 — PARAMETRIC GEOMETRY & FEATURE CONSTRUCTION
          </span>
          <span className="text-xs text-zinc-500">Phase 6: User Workspace</span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <button
            onClick={handleAddExtrusion}
            className="px-2 py-1 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 rounded border border-purple-500/30 flex items-center gap-1 cursor-pointer"
          >
            <Box className="w-3.5 h-3.5" /> Add Parametric Extrude
          </button>
          <div className="flex gap-1">
            <button
              onClick={handleUndo}
              disabled={!history.canUndo()}
              className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 text-zinc-300 cursor-pointer"
            >
              <Undo className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleRedo}
              disabled={!history.canRedo()}
              className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 text-zinc-300 cursor-pointer"
            >
              <Redo className="w-3.5 h-3.5" />
            </button>
          </div>
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
        {/* LEFT: FEATURE TREE */}
        <div className="w-[320px] flex-shrink-0 border-r border-zinc-800 p-3 overflow-y-auto bg-[#070709]/90">
          <P67FeatureTree
            graph={graph}
            selectedFeatureId={selectedFeatureId}
            onSelectFeature={setSelectedFeatureId}
            onToggleSuppress={handleToggleSuppress}
            onDeleteFeature={handleDeleteFeature}
          />
        </div>

        {/* CENTER: 3D VIEWPORT */}
        <div className="flex-1 flex flex-col items-center justify-center p-3 gap-2 overflow-hidden bg-black/30">
          <P67FeatureViewport
            scene={evaluatedScene}
            selectedFeatureId={selectedFeatureId}
            width={560}
            height={360}
          />
        </div>

        {/* RIGHT: PARAMETER & CONSTRAINT INSPECTOR */}
        <div className="w-[300px] flex-shrink-0 border-l border-zinc-800 p-3 overflow-y-auto bg-[#070709]/90">
          <P67FeatureInspector
            feature={selectedFeature}
            graph={graph}
            onUpdateParam={handleUpdateParam}
          />
        </div>
      </div>

      {/* ── BOTTOM PANEL: VALIDATION & EXPORT ── */}
      <P67ValidationPanel
        graph={graph}
        scene={evaluatedScene}
        report={validationReport}
        onExport={handleExport}
      />
    </div>
  );
};
