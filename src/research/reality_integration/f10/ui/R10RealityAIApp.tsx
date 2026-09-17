/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel F10: Reality AI Application Master UI
 */

import React from 'react';
import { R10ResearchWorkspace } from './R10ResearchWorkspace';

export interface R10RealityAIAppProps {
  readonly onExit?: () => void;
}

export const R10RealityAIApp: React.FC<R10RealityAIAppProps> = ({ onExit }) => {
  return <R10ResearchWorkspace onExit={onExit} />;
};
