/**
 * 3D Memory Studio — Funnel 64
 * Navigation Items & Action Manager
 */

import { PanelId } from '../types';

export interface NavigationItem {
  readonly id: PanelId;
  readonly label: string;
  readonly iconName: string;
  readonly category: string;
}

export const NAVIGATION_ITEMS: readonly NavigationItem[] = [
  { id: 'DATABASE', label: 'Database', iconName: 'Database', category: 'DATA' },
  { id: 'COORDINATES', label: 'Coordinates', iconName: 'Compass', category: 'SPATIAL' },
  { id: 'INFORMATION', label: 'Information', iconName: 'Info', category: 'DATA' },
  { id: 'CHAT', label: 'AI Chat', iconName: 'MessageSquare', category: 'AI' },
  { id: 'MODELS', label: 'Models', iconName: 'Bot', category: 'AI' },
  { id: 'SEARCH', label: 'Search', iconName: 'Search', category: 'DATA' },
  { id: 'GRAPH', label: 'Graph', iconName: 'Share2', category: 'GRAPH' },
  { id: 'CLUSTERS', label: 'Clusters', iconName: 'Layers', category: 'SPATIAL' },
  { id: 'DIMENSION', label: 'Dimension', iconName: 'Sparkles', category: 'SPATIAL' },
  { id: 'SETTINGS', label: 'Settings', iconName: 'Settings', category: 'SYSTEM' },
];
