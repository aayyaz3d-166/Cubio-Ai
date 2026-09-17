/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.25-J: Research Harness Component
 */

import React from 'react';
import { P625JWorkspaceScene } from './P625JWorkspaceScene';

export interface P625JResearchHarnessProps {
  onExit?: () => void;
}

export const P625JResearchHarness: React.FC<P625JResearchHarnessProps> = ({ onExit }) => {
  return <P625JWorkspaceScene onExit={onExit} />;
};
