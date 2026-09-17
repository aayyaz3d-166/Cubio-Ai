/**
 * 3D Memory Studio — Funnel 56
 * Hook: useSceneEngine
 *
 * Connects SceneEngine with MemoryRendererHost and F52 simulation world.
 */

import { useState, useEffect, useRef } from 'react';
import { SceneEngine } from '../scene/sceneEngine';
import { MemoryRendererHost } from '../../funnel55/renderer/rendererHost';
import { RealTimeSimulationEngine } from '../../funnel52/simulation/simulationEngine';
import { SceneEngineStats, ISceneObject } from '../types';

export function useSceneEngine() {
  const [engine] = useState(() => new SceneEngine());
  const [renderer] = useState(() => new MemoryRendererHost());
  const simRef = useRef<RealTimeSimulationEngine | null>(null);
  const [stats, setStats] = useState<SceneEngineStats>(() => engine.getStats());
  const [selectedObject, setSelectedObject] = useState<ISceneObject | null>(null);

  useEffect(() => {
    engine.initialize();
    renderer.initialize();
    engine.attachRenderer(renderer);

    // Initialize simulation engine
    simRef.current = new RealTimeSimulationEngine();

    // Initial sync
    engine.synchronizeWithSimulation(simRef.current.getState());

    // Subscription loop for simulation sync & stats
    const interval = setInterval(() => {
      if (simRef.current) {
        engine.synchronizeWithSimulation(simRef.current.getState());
        setStats(engine.getStats());
      }
    }, 250);

    return () => {
      clearInterval(interval);
      if (simRef.current) simRef.current.destroy();
      engine.dispose();
      renderer.dispose();
    };
  }, [engine, renderer]);

  const selectState = (id: string | null) => {
    const obj = engine.selectObject(id);
    setSelectedObject(obj);
    setStats(engine.getStats());
  };

  const highlightQuery = (q: string) => {
    engine.highlightSearch(q);
    setStats(engine.getStats());
  };

  return {
    engine,
    renderer,
    stats,
    selectedObject,
    selectState,
    highlightQuery,
  };
}
