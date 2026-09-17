/**
 * 3D Memory Studio — Funnel 66
 * Panel Types & Initial Descriptors
 */

import { PanelDescriptor, SectionId } from '../types';

export const MAX_OPEN_PANELS = 8;
export const MAX_OVERLAYS = 4;
export const MAX_DOM_INSTANCES = 12;

export const INITIAL_PANELS: readonly PanelDescriptor[] = [
  { id: 'DATABASE', title: 'Database Explorer', mode: 'CLOSED', width: 340, minWidth: 280, maxWidth: 520, isOverlay: false, zIndex: 10 },
  { id: 'COORDINATES', title: 'Spatial Coordinates', mode: 'CLOSED', width: 320, minWidth: 280, maxWidth: 480, isOverlay: false, zIndex: 10 },
  { id: 'INFORMATION', title: 'Information Inspector', mode: 'CLOSED', width: 340, minWidth: 280, maxWidth: 520, isOverlay: false, zIndex: 10 },
  { id: 'CHAT', title: 'AI Research Assistant', mode: 'CLOSED', width: 360, minWidth: 300, maxWidth: 540, isOverlay: false, zIndex: 10 },
  { id: 'GRAPH', title: '3D Relationship Graph', mode: 'CLOSED', width: 340, minWidth: 280, maxWidth: 520, isOverlay: false, zIndex: 10 },
  { id: 'CLUSTERS', title: 'Cluster & Spatial Organization', mode: 'CLOSED', width: 340, minWidth: 280, maxWidth: 520, isOverlay: false, zIndex: 10 },
  { id: 'DIMENSIONS', title: 'Computational Dimensions & Projections', mode: 'CLOSED', width: 340, minWidth: 280, maxWidth: 520, isOverlay: false, zIndex: 10 },
  { id: 'SEARCH', title: 'Search Information Universe', mode: 'CLOSED', width: 360, minWidth: 300, maxWidth: 540, isOverlay: false, zIndex: 10 },
  { id: 'SETTINGS', title: 'Studio Settings & Diagnostics', mode: 'CLOSED', width: 320, minWidth: 280, maxWidth: 480, isOverlay: false, zIndex: 10 },
];
