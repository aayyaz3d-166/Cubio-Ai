/**
 * 3D Memory Studio — Funnel 60
 * Hook: useDimensionEngine
 */

import { useState, useEffect, useRef } from 'react';
import { DimensionEngine } from '../dimension/dimensionEngine';
import { ClusterEngine } from '../../funnel59/cluster/clusterEngine';
import { GraphEngine } from '../../funnel58/graph/graphEngine';
import { SceneEngine } from '../../funnel56/scene/sceneEngine';
import { MemoryRendererHost } from '../../funnel55/renderer/rendererHost';
import { RealTimeSimulationEngine } from '../../funnel52/simulation/simulationEngine';
import { SimulationDimension } from '../../funnel52/types';
import { ProjectionType, DimensionEngineStats } from '../types';

export function useDimensionEngine() {
  const [dimEngine] = useState(() => new DimensionEngine());
  const [clusterEngine] = useState(() => new ClusterEngine());
  const [graphEngine] = useState(() => new GraphEngine());
  const [sceneEngine] = useState(() => new SceneEngine());
  const [renderer] = useState(() => new MemoryRendererHost());
  const simRef = useRef<RealTimeSimulationEngine | null>(null);

  const [stats, setStats] = useState<DimensionEngineStats>(() => dimEngine.getStats());

  useEffect(() => {
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
        setStats(dimEngine.getStats());
      }
    }, 250);

    return () => {
      clearInterval(interval);
      if (simRef.current) simRef.current.destroy();
      dimEngine.dispose();
      clusterEngine.dispose();
      graphEngine.dispose();
      sceneEngine.dispose();
      renderer.dispose();
    };
  }, [dimEngine, clusterEngine, graphEngine, sceneEngine, renderer]);

  const switchDimension = (dim: SimulationDimension, proj?: ProjectionType) => {
    dimEngine.setDimension(dim, proj);
    if (simRef.current) {
      const world = simRef.current.getState();
      dimEngine.projectStates(world.allSourceStates || []);
      dimEngine.synchronizeAll(sceneEngine, graphEngine.registry, clusterEngine.registry);
    }
    setStats(dimEngine.getStats());
  };

  return {
    dimEngine,
    clusterEngine,
    graphEngine,
    sceneEngine,
    renderer,
    stats,
    switchDimension,
  };
}
