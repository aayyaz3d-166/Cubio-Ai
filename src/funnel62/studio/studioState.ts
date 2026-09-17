/**
 * 3D Memory Studio — Funnel 62
 * Studio State Factory & Defaults
 */

import { StudioSessionState } from '../types';

export function createDefaultStudioSessionState(): StudioSessionState {
  return {
    currentScreen: 'LANDING',
    activePanel: 'DATABASE',
    moreOptionsOpen: false,
    diagnosticsOpen: false,
    selectedStateId: null,
    selectedClusterId: null,
    selectedRelationshipId: null,
    activeDimension: 3,
    projectionMode: 'DIRECT',
    cameraPreset: 'DEFAULT',
    selectedModelId: 'gemini-2.5-pro',
    searchQuery: '',
    isTransitioning: false,
  };
}

export function cloneStudioSessionState(state: StudioSessionState): StudioSessionState {
  return {
    ...state,
  };
}
