/**
 * 3D Memory Studio — Funnel 65
 * Hook: useStudioRuntime
 */

import { useState, useEffect, useCallback } from 'react';
import { RuntimeBootstrap } from '../runtime/runtimeBootstrap';
import { RuntimeScreen } from '../types';

export function useStudioRuntime() {
  const [bootstrap] = useState(() => new RuntimeBootstrap());
  const [isReady, setIsReady] = useState(false);
  const [screen, setScreen] = useState<RuntimeScreen>('LANDING');
  const [, setTick] = useState(0);

  useEffect(() => {
    let mounted = true;
    bootstrap.initializeRuntime().then((ok) => {
      if (mounted && ok) {
        setIsReady(true);
      }
    });

    const interval = setInterval(() => {
      if (mounted) {
        setTick((t) => t + 1);
      }
    }, 100);

    return () => {
      mounted = false;
      clearInterval(interval);
      bootstrap.dispose();
    };
  }, [bootstrap]);

  const handleStartStudio = useCallback(() => {
    bootstrap.enterStudio();
    setScreen('STUDIO');
  }, [bootstrap]);

  const handleReturnLanding = useCallback(() => {
    bootstrap.returnToLanding();
    setScreen('LANDING');
  }, [bootstrap]);

  return {
    bootstrap,
    isReady,
    screen,
    startStudio: handleStartStudio,
    returnToLanding: handleReturnLanding,
    diagnosticReport: bootstrap.getDiagnosticReport(),
  };
}
