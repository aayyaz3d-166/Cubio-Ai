/**
 * 3D Memory Studio — Funnel 76
 * React Hook: useStudioBoot
 *
 * StrictMode-safe and remount-resilient hook orchestrating Studio Workspace boot.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { StudioBootManager } from '../boot/studioBootManager';
import { StudioBootSnapshot } from '../types';

export function useStudioBoot(customManager?: StudioBootManager) {
  const managerRef = useRef<StudioBootManager>(customManager ?? new StudioBootManager());
  const manager = managerRef.current;

  const [snapshot, setSnapshot] = useState<StudioBootSnapshot>(() => manager.getSnapshot());

  useEffect(() => {
    let mounted = true;

    const unsubscribe = manager.subscribe((snap) => {
      if (mounted) {
        setSnapshot(snap);
      }
    });

    // Start boot sequence
    manager.startBoot().catch(() => {
      // Errors captured in snapshot
    });

    return () => {
      mounted = false;
      unsubscribe();
      manager.dispose();
    };
  }, [manager]);

  const handleRetry = useCallback(() => {
    manager.retry().catch(() => {});
  }, [manager]);

  return {
    manager,
    snapshot,
    isReady: snapshot.isReady,
    isActive: snapshot.isActive,
    progress: snapshot.progressPercentage,
    failedDependency: snapshot.failedDependency,
    error: snapshot.error,
    retry: handleRetry,
  };
}
