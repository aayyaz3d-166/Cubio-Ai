/**
 * 3D Memory Studio — Funnel 76
 * Component: StudioWorkspaceWrapper
 *
 * Replaces old hanging unverified workspace initialization with F76
 * deterministic startup dependency coordination.
 */

import React, { useState, useEffect } from 'react';
import { StudioWorkspaceManager } from '../../funnel64/workspace/workspaceManager';
import { LiveStudioWorkspaceHost } from '../../research/user_workspace/p625j/ui/LiveStudioWorkspaceHost';
import { StudioBootScreen } from './StudioBootScreen';
import { StudioBootBoundary } from './StudioBootBoundary';

export const StudioWorkspaceWrapper: React.FC = () => {
  const [workspace, setWorkspace] = useState<StudioWorkspaceManager | null>(null);

  useEffect(() => {
    let mounted = true;
    const ws = new StudioWorkspaceManager();

    ws.initialize()
      .then(() => {
        if (mounted) {
          setWorkspace(ws);
        }
      })
      .catch((err) => {
        console.error('Failed to initialize StudioWorkspaceManager:', err);
        ws.dispose();
      });

    return () => {
      mounted = false;
      ws.dispose();
      setWorkspace(null);
    };
  }, []);

  return (
    <StudioBootBoundary>
      <StudioBootScreen>
        {workspace && <LiveStudioWorkspaceHost workspace={workspace} />}
      </StudioBootScreen>
    </StudioBootBoundary>
  );
};
