/**
 * 3D Memory Studio — Funnel 62
 * Hook: useStudioExperience
 */

import { useState, useEffect } from 'react';
import { StudioCoordinator } from '../integration/studioCoordinator';
import { DataProvider } from '../types';

export function useStudioExperience(dataProvider?: DataProvider) {
  const [coordinator] = useState(() => new StudioCoordinator(dataProvider));
  const [isReady, setIsReady] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    let mounted = true;
    coordinator.initialize().then(() => {
      if (mounted) setIsReady(true);
    });

    const interval = setInterval(() => {
      if (mounted) {
        coordinator.update(0.033);
        setTick((t) => t + 1);
      }
    }, 33);

    return () => {
      mounted = false;
      clearInterval(interval);
      coordinator.dispose();
    };
  }, [coordinator]);

  return {
    coordinator,
    isReady,
    sessionState: coordinator.sessionState,
  };
}
