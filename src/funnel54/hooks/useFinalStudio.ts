/**
 * 3D Memory Studio — Funnel 54
 * Hook: useFinalStudio
 *
 * Connects F52 simulation engine, F53 view model adapter, and F54 advanced scene model.
 */

import { useState, useEffect, useMemo } from 'react';
import { DimensionalInformationState } from '../../funnel49/types';
import { RealTimeSimulationEngine } from '../../funnel52/simulation/simulationEngine';
import { deriveStudioViewModel } from '../../funnel53/adapters/studioViewModel';
import { deriveAdvancedSceneModel } from '../adapters/advancedSceneModel';
import { AdvancedSceneModel, StudioPresentationMode } from '../types';
import { SimulationCamera } from '../../funnel52/types';

export function useFinalStudio(
  sourceStates?: readonly DimensionalInformationState[],
  overrideCamera?: SimulationCamera,
  initialPresentationMode: StudioPresentationMode = 'SPACE',
  initialReducedMotion = false
) {
  const [engine] = useState(() => new RealTimeSimulationEngine(sourceStates));
  const [worldState, setWorldState] = useState(() => engine.getState());
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [presentationMode, setPresentationMode] = useState<StudioPresentationMode>(initialPresentationMode);
  const [focusedClusterId, setFocusedClusterId] = useState<string | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(initialReducedMotion);

  useEffect(() => {
    const unsubscribe = engine.subscribe(setWorldState);
    return () => {
      unsubscribe();
      engine.destroy();
    };
  }, [engine]);

  // Sync camera into engine if override provided
  useEffect(() => {
    if (overrideCamera) {
      engine.dispatch({ type: 'SET_CAMERA', camera: overrideCamera });
    }
  }, [overrideCamera, engine]);

  const sceneModel: AdvancedSceneModel = useMemo(() => {
    const studioVm = deriveStudioViewModel(worldState, hoveredNodeId);
    return deriveAdvancedSceneModel(
      studioVm,
      presentationMode,
      focusedClusterId,
      prefersReducedMotion
    );
  }, [worldState, hoveredNodeId, presentationMode, focusedClusterId, prefersReducedMotion]);

  return {
    sceneModel,
    engine,
    hoveredNodeId,
    setHoveredNodeId,
    presentationMode,
    setPresentationMode,
    focusedClusterId,
    setFocusedClusterId,
    prefersReducedMotion,
    setPrefersReducedMotion,
  };
}
