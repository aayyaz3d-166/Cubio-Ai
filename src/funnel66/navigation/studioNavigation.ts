/**
 * 3D Memory Studio — Funnel 66
 * Section Descriptors & Standard Navigation Definitions
 */

import { SectionDescriptor, SectionId } from '../types';

export const STANDARD_SECTIONS: readonly SectionDescriptor[] = [
  { id: 'HOME', label: 'Home', iconName: 'Home', order: 0, enabled: true, active: true },
  { id: 'DATABASE', label: 'Database', iconName: 'Database', order: 1, enabled: true, active: false },
  { id: 'COORDINATES', label: 'Coordinates', iconName: 'Compass', order: 2, enabled: true, active: false },
  { id: 'INFORMATION', label: 'Information', iconName: 'Info', order: 3, enabled: true, active: false },
  { id: 'CHAT', label: 'AI Chat', iconName: 'MessageSquare', order: 4, enabled: true, active: false },
  { id: 'GRAPH', label: 'Graph', iconName: 'Network', order: 5, enabled: true, active: false },
  { id: 'CLUSTERS', label: 'Clusters', iconName: 'Boxes', order: 6, enabled: true, active: false },
  { id: 'DIMENSIONS', label: 'Dimensions', iconName: 'Layers', order: 7, enabled: true, active: false },
  { id: 'SEARCH', label: 'Search', iconName: 'Search', order: 8, enabled: true, active: false },
  { id: 'SETTINGS', label: 'Settings', iconName: 'Settings', order: 9, enabled: true, active: false },
];
