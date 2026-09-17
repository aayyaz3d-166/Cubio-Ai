/**
 * 3D Memory Studio — Funnel 74
 * React Hook: useLandingLifecycle
 *
 * Provides StrictMode-safe LandingEngine lifecycle and animation updates.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { LandingLifecycleManager } from '../lifecycle/landingLifecycleManager';
import { LandingEngine } from '../../funnel63/landing/landingEngine';
import { LifecycleSnapshot } from '../types';

export function useLandingLifecycle(customManager?: LandingLifecycleManager) {
  const managerRef = useRef<LandingLifecycleManager>(customManager ?? new LandingLifecycleManager());
  const manager = managerRef.current;

  const [engine, setEngine] = useState<LandingEngine | null>(() => manager.getEngine());
  const [snapshot, setSnapshot] = useState<LifecycleSnapshot>(() => manager.getSnapshot());
  const [, setTick] = useState(0);

  useEffect(() => {
    let mounted = true;

    // Create and initialize a fresh engine on mount
    const freshEngine = manager.createEngine();
    setEngine(freshEngine);
    manager.initializeEngine();

    const unsubscribe = manager.subscribe((snap) => {
      if (mounted) {
        setSnapshot(snap);
      }
    });

    const interval = setInterval(() => {
      if (mounted && manager.stateMachine.isActive()) {
        const eng = manager.getEngine();
        if (eng && !manager.guard.isDisposed(eng)) {
          eng.update(0.033);
          setTick((t) => t + 1);
        }
      }
    }, 33);

    return () => {
      mounted = false;
      clearInterval(interval);
      unsubscribe();
      manager.disposeEngine();
      setEngine(null);
    };
  }, [manager]);

  const handleStartStudio = useCallback(() => {
    return manager.startStudio();
  }, [manager]);

  const handleRetry = useCallback(() => {
    const fresh = manager.replaceEngine();
    setEngine(fresh);
  }, [manager]);

  return {
    manager,
    engine,
    isReady: snapshot.hasActiveEngine,
    snapshot,
    stats: engine && !manager.guard.isDisposed(engine) ? engine.getStats() : {
      hoveredFace: null,
      zoomLevel: 1,
      rotationSpeed: 0,
      autoRotate: true,
      cubeTransform: { x: 0, y: 0, z: 0 },
      isDragging: false,
      buttonState: 'IDLE' as any,
    },
    startStudio: handleStartStudio,
    retry: handleRetry,
  };
}
