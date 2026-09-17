/**
 * 3D Memory Studio — Funnel 63
 * Hook: useLandingCube
 */

import { useState, useEffect } from 'react';
import { LandingEngine } from '../landing/landingEngine';

export function useLandingCube() {
  const [engine] = useState(() => new LandingEngine());
  const [isReady, setIsReady] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    let mounted = true;
    engine.initialize();
    setIsReady(true);

    const interval = setInterval(() => {
      if (mounted) {
        engine.update(0.033);
        setTick((t) => t + 1);
      }
    }, 33);

    return () => {
      mounted = false;
      clearInterval(interval);
      engine.dispose();
    };
  }, [engine]);

  return {
    engine,
    isReady,
    stats: engine.getStats(),
  };
}
