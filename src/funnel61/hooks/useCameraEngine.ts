/**
 * 3D Memory Studio — Funnel 61
 * Hook: useCameraEngine
 */

import { useState, useEffect, useRef } from 'react';
import { CameraEngine } from '../camera/cameraEngine';
import { DimensionEngine } from '../../funnel60/dimension/dimensionEngine';
import { ClusterEngine } from '../../funnel59/cluster/clusterEngine';
import { GraphEngine } from '../../funnel58/graph/graphEngine';
import { SceneEngine } from '../../funnel56/scene/sceneEngine';
import { MemoryRendererHost } from '../../funnel55/renderer/rendererHost';
import { RealTimeSimulationEngine } from '../../funnel52/simulation/simulationEngine';
import { CameraEngineStats, CameraPresetType } from '../types';

export function useCameraEngine() {
  const [camEngine] = useState(() => new CameraEngine());
  const [dimEngine] = useState(() => new DimensionEngine());
  const [clusterEngine] = useState(() => new ClusterEngine());
  const [graphEngine] = useState(() => new GraphEngine());
  const [sceneEngine] = useState(() => new SceneEngine());
  const [renderer] = useState(() => new MemoryRendererHost());
  const simRef = useRef<RealTimeSimulationEngine | null>(null);

  const [stats, setStats] = useState<CameraEngineStats>(() => camEngine.getStats());

  useEffect(() => {
    camEngine.initialize();
    dimEngine.initialize();
    clusterEngine.initialize();
    graphEngine.initialize();
    sceneEngine.initialize();
    renderer.initialize();

    simRef.current = new RealTimeSimulationEngine();
    const initWorld = simRef.current.getState();

    sceneEngine.synchronizeWithSimulation(initWorld);
    graphEngine.synchronizeSimulation(initWorld);
    clusterEngine.synchronizeSimulation(initWorld, graphEngine.registry);

    dimEngine.projectStates(initWorld.allSourceStates || []);
    dimEngine.synchronizeAll(sceneEngine, graphEngine.registry, clusterEngine.registry);

    const interval = setInterval(() => {
      if (simRef.current) {
        const world = simRef.current.getState();
        sceneEngine.synchronizeWithSimulation(world);
        graphEngine.syncFromScene(sceneEngine);
        clusterEngine.syncFromScene(sceneEngine);
        camEngine.syncToRenderer(renderer);
        setStats(camEngine.getStats());
      }
    }, 100);

    return () => {
      clearInterval(interval);
      if (simRef.current) simRef.current.destroy();
      camEngine.dispose();
      dimEngine.dispose();
      clusterEngine.dispose();
      graphEngine.dispose();
      sceneEngine.dispose();
      renderer.dispose();
    };
  }, [camEngine, dimEngine, clusterEngine, graphEngine, sceneEngine, renderer]);

  const applyPreset = (preset: CameraPresetType) => {
    camEngine.navigation.setPreset(camEngine.state, preset);
    camEngine.syncToRenderer(renderer);
    setStats(camEngine.getStats());
  };

  const resetCamera = () => {
    camEngine.navigation.resetCamera(camEngine.state);
    camEngine.syncToRenderer(renderer);
    setStats(camEngine.getStats());
  };

  return {
    camEngine,
    dimEngine,
    clusterEngine,
    graphEngine,
    sceneEngine,
    renderer,
    stats,
    applyPreset,
    resetCamera,
  };
}
