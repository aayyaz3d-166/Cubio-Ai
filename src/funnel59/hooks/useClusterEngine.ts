/**
 * 3D Memory Studio — Funnel 59
 * Hook: useClusterEngine
 *
 * Connects ClusterEngine, GraphEngine, SceneEngine, and Simulation World.
 */

import { useState, useEffect, useRef } from 'react';
import { ClusterEngine } from '../cluster/clusterEngine';
import { GraphEngine } from '../../funnel58/graph/graphEngine';
import { SceneEngine } from '../../funnel56/scene/sceneEngine';
import { MemoryRendererHost } from '../../funnel55/renderer/rendererHost';
import { RealTimeSimulationEngine } from '../../funnel52/simulation/simulationEngine';
import { ClusterEngineStats, ClusterLayoutMode } from '../types';

export function useClusterEngine() {
  const [clusterEngine] = useState(() => new ClusterEngine());
  const [graphEngine] = useState(() => new GraphEngine());
  const [sceneEngine] = useState(() => new SceneEngine());
  const [renderer] = useState(() => new MemoryRendererHost());
  const simRef = useRef<RealTimeSimulationEngine | null>(null);

  const [stats, setStats] = useState<ClusterEngineStats>(() => clusterEngine.getStats(3));

  useEffect(() => {
    clusterEngine.initialize();
    graphEngine.initialize();
    sceneEngine.initialize();
    renderer.initialize();

    simRef.current = new RealTimeSimulationEngine();
    const initWorld = simRef.current.getState();

    sceneEngine.synchronizeWithSimulation(initWorld);
    graphEngine.synchronizeSimulation(initWorld);
    clusterEngine.synchronizeSimulation(initWorld, graphEngine.registry);

    const interval = setInterval(() => {
      if (simRef.current) {
        const world = simRef.current.getState();
        sceneEngine.synchronizeWithSimulation(world);
        graphEngine.syncFromScene(sceneEngine);
        clusterEngine.syncFromScene(sceneEngine);
        setStats(clusterEngine.getStats(world.activeDimension));
      }
    }, 250);

    return () => {
      clearInterval(interval);
      if (simRef.current) simRef.current.destroy();
      clusterEngine.dispose();
      graphEngine.dispose();
      sceneEngine.dispose();
      renderer.dispose();
    };
  }, [clusterEngine, graphEngine, sceneEngine, renderer]);

  const changeLayoutMode = (mode: ClusterLayoutMode) => {
    clusterEngine.setLayoutMode(mode);
    setStats(clusterEngine.getStats(stats.activeDimension));
  };

  return {
    clusterEngine,
    graphEngine,
    sceneEngine,
    renderer,
    stats,
    changeLayoutMode,
  };
}
