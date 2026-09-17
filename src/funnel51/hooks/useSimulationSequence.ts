/**
 * 3D Memory Studio — Funnel 51
 * Hook: useSimulationSequence
 *
 * Connects SimulationSequenceController to React component state.
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import { SimulationExperienceState, SimulationExperienceActions } from '../types';
import { SimulationSequenceController } from '../simulation/simulationController';

export function useSimulationSequence(initialReducedMotion = false): {
  state: SimulationExperienceState;
  actions: SimulationExperienceActions;
} {
  const controllerRef = useRef<SimulationSequenceController | null>(null);

  if (!controllerRef.current) {
    controllerRef.current = new SimulationSequenceController(initialReducedMotion);
  }

  const [state, setState] = useState<SimulationExperienceState>(() => controllerRef.current!.getState());

  useEffect(() => {
    const controller = controllerRef.current!;
    const unsubscribe = controller.subscribe(setState);

    return () => {
      unsubscribe();
      controller.destroy();
    };
  }, []);

  const actions: SimulationExperienceActions = useMemo(() => {
    return {
      start: () => controllerRef.current?.start(),
      pause: () => controllerRef.current?.pause(),
      resume: () => controllerRef.current?.resume(),
      restart: () => controllerRef.current?.restart(),
      skip: () => controllerRef.current?.skip(),
      enterStudio: () => controllerRef.current?.enterStudio(),
      setReducedMotion: (enabled: boolean) => controllerRef.current?.setReducedMotion(enabled),
    };
  }, []);

  return { state, actions };
}
