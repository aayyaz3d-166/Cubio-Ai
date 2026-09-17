/**
 * 3D Memory Studio — Funnel 57
 * Hook: useGeometryEngine
 *
 * Connects GeometryEngine, MaterialEngine, SceneEngine, and GeometrySceneAdapter.
 */

import { useState, useEffect, useRef } from 'react';
import { GeometryEngine } from '../geometry/geometryEngine';
import { MaterialEngine } from '../materials/materialEngine';
import { GeometrySceneAdapter } from '../adapters/geometrySceneAdapter';
import { SceneEngine } from '../../funnel56/scene/sceneEngine';
import { MemoryRendererHost } from '../../funnel55/renderer/rendererHost';
import { RealTimeSimulationEngine } from '../../funnel52/simulation/simulationEngine';
import { GeometryEngineStats, GeometryQualityLevel } from '../types';

export function useGeometryEngine(initialQuality: GeometryQualityLevel = 'MEDIUM') {
  const [geometryEngine] = useState(() => new GeometryEngine());
  const [materialEngine] = useState(() => new MaterialEngine());
  const [sceneEngine] = useState(() => new SceneEngine());
  const [renderer] = useState(() => new MemoryRendererHost());
  const [adapter] = useState(
    () => new GeometrySceneAdapter(geometryEngine.factory, materialEngine.factory)
  );

  const [qualityLevel, setQualityLevel] = useState<GeometryQualityLevel>(initialQuality);
  const simRef = useRef<RealTimeSimulationEngine | null>(null);

  const [stats, setStats] = useState<GeometryEngineStats>(() => ({
    totalRegisteredGeometries: geometryEngine.registry.count,
    activeGeometries: geometryEngine.registry.count,
    totalRegisteredMaterials: materialEngine.registry.count,
    activeMaterials: materialEngine.registry.count,
    totalMeshes: adapter.meshCount,
    totalVertexCount: geometryEngine.registry.totalVertices,
    estimatedGpuMemoryBytes: geometryEngine.registry.totalMemoryBytes,
    qualityLevel: initialQuality,
    activeDimension: 3,
  }));

  useEffect(() => {
    geometryEngine.initialize();
    materialEngine.initialize();
    sceneEngine.initialize();
    renderer.initialize();

    simRef.current = new RealTimeSimulationEngine();
    sceneEngine.synchronizeWithSimulation(simRef.current.getState());
    adapter.synchronizeScene(sceneEngine);

    const interval = setInterval(() => {
      if (simRef.current) {
        sceneEngine.synchronizeWithSimulation(simRef.current.getState());
        adapter.syncTransforms(sceneEngine);

        setStats({
          totalRegisteredGeometries: geometryEngine.registry.count,
          activeGeometries: geometryEngine.registry.count,
          totalRegisteredMaterials: materialEngine.registry.count,
          activeMaterials: materialEngine.registry.count,
          totalMeshes: adapter.meshCount,
          totalVertexCount: geometryEngine.registry.totalVertices,
          estimatedGpuMemoryBytes: geometryEngine.registry.totalMemoryBytes,
          qualityLevel,
          activeDimension: simRef.current.getState().activeDimension,
        });
      }
    }, 250);

    return () => {
      clearInterval(interval);
      if (simRef.current) simRef.current.destroy();
      adapter.dispose();
      sceneEngine.dispose();
      materialEngine.dispose();
      geometryEngine.dispose();
      renderer.dispose();
    };
  }, [geometryEngine, materialEngine, sceneEngine, renderer, adapter, qualityLevel]);

  return {
    geometryEngine,
    materialEngine,
    sceneEngine,
    renderer,
    adapter,
    stats,
    qualityLevel,
    setQualityLevel,
  };
}
