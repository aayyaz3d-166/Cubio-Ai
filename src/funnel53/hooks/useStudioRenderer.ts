/**
 * 3D Memory Studio — Funnel 53
 * Hook: useStudioRenderer
 *
 * Connects F52 RealTimeSimulationEngine with derived StudioViewModel.
 */

import { useState, useEffect, useMemo } from 'react';
import { DimensionalInformationState } from '../../funnel49/types';
import { RealTimeSimulationEngine } from '../../funnel52/simulation/simulationEngine';
import { deriveStudioViewModel } from '../adapters/studioViewModel';
import { StudioViewModel } from '../types';
import { SimulationCamera } from '../../funnel52/types';

export function useStudioRenderer(
  sourceStates?: readonly DimensionalInformationState[],
  overrideCamera?: SimulationCamera
) {
  const [engine] = useState(() => new RealTimeSimulationEngine(sourceStates));
  const [worldState, setWorldState] = useState(() => engine.getState());
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

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

  const viewModel: StudioViewModel = useMemo(() => {
    return deriveStudioViewModel(worldState, hoveredNodeId);
  }, [worldState, hoveredNodeId]);

  return {
    viewModel,
    engine,
    hoveredNodeId,
    setHoveredNodeId,
  };
}
