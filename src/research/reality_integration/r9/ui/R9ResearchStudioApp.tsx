/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R9: Research Studio Application UI
 *
 * Production-Grade 3D Workspace Master Entry Point.
 */

import React from 'react';
import { R9ProductionWorkspace } from './R9ProductionWorkspace';

export interface R9ResearchStudioAppProps {
  readonly onExit?: () => void;
}

export const R9ResearchStudioApp: React.FC<R9ResearchStudioAppProps> = ({ onExit }) => {
  return <R9ProductionWorkspace onExit={onExit} />;
};
