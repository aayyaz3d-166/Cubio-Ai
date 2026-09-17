/**
 * 3D Memory Studio — Funnel 64
 * Hook: useStudioWorkspace
 */

import { useState, useEffect } from 'react';
import { StudioWorkspaceManager } from '../workspace/workspaceManager';

export function useStudioWorkspace() {
  const [workspace] = useState(() => new StudioWorkspaceManager());
  const [isReady, setIsReady] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    let mounted = true;
    workspace.initialize().then(() => {
      if (mounted) setIsReady(true);
    });

    const interval = setInterval(() => {
      if (mounted) {
        workspace.viewportAdapter.update(0.033);
        setTick((t) => t + 1);
      }
    }, 33);

    return () => {
      mounted = false;
      clearInterval(interval);
      workspace.dispose();
    };
  }, [workspace]);

  return {
    workspace,
    isReady,
    snapshot: workspace.getContextSnapshot(),
  };
}
