/**
 * 3D Memory Studio — Funnel 58
 * Hook: useGraphEngine
 *
 * Connects GraphEngine, SceneEngine, and Simulation World.
 */

import { useState, useEffect, useRef } from 'react';
import { GraphEngine } from '../graph/graphEngine';
import { SceneEngine } from '../../funnel56/scene/sceneEngine';
import { MemoryRendererHost } from '../../funnel55/renderer/rendererHost';
import { RealTimeSimulationEngine } from '../../funnel52/simulation/simulationEngine';
import { GraphEngineStats, GraphFilterCriteria } from '../types';
import { createDefaultFilterCriteria } from '../graph/graphFilters';

export function useGraphEngine() {
  const [graphEngine] = useState(() => new GraphEngine());
  const [sceneEngine] = useState(() => new SceneEngine());
  const [renderer] = useState(() => new MemoryRendererHost());
  const simRef = useRef<RealTimeSimulationEngine | null>(null);

  const [filters, setFilters] = useState<GraphFilterCriteria>(() => createDefaultFilterCriteria());
  const [stats, setStats] = useState<GraphEngineStats>(() => graphEngine.getStats(3));

  useEffect(() => {
    graphEngine.initialize();
    sceneEngine.initialize();
    renderer.initialize();

    simRef.current = new RealTimeSimulationEngine();
    const initWorld = simRef.current.getState();

    sceneEngine.synchronizeWithSimulation(initWorld);
    graphEngine.synchronizeSimulation(initWorld);

    const interval = setInterval(() => {
      if (simRef.current) {
        const world = simRef.current.getState();
        sceneEngine.synchronizeWithSimulation(world);
        graphEngine.syncFromScene(sceneEngine);
        setStats(graphEngine.getStats(world.activeDimension));
      }
    }, 250);

    return () => {
      clearInterval(interval);
      if (simRef.current) simRef.current.destroy();
      graphEngine.dispose();
      sceneEngine.dispose();
      renderer.dispose();
    };
  }, [graphEngine, sceneEngine, renderer]);

  return {
    graphEngine,
    sceneEngine,
    renderer,
    filters,
    setFilters,
    stats,
  };
}
