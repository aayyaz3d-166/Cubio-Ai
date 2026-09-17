/**
 * 3D Memory Studio — Funnel 70
 * Action Categories, Constants & Hard Limits
 */

import { StudioActionType } from '../types';

export const MAX_PENDING_ACTIONS = 5;
export const MAX_ACTION_HISTORY = 20;
export const MAX_CONCURRENT_ACTIONS = 1;
export const MAX_ACTION_STATUS_OVERLAYS = 2;

export const SAFE_ACTIONS: ReadonlySet<StudioActionType> = new Set([
  'NAVIGATE_SECTION',
  'OPEN_PANEL',
  'CLOSE_PANEL',
  'TOGGLE_PANEL',
  'SHOW_GRAPH',
  'HIDE_GRAPH',
  'SHOW_CLUSTERS',
  'HIDE_CLUSTERS',
  'SWITCH_DIMENSION',
  'SHOW_AXES',
  'HIDE_AXES',
  'SHOW_GRID',
  'HIDE_GRID',
  'SEARCH_INFORMATION',
  'DATABASE_FILTER',
  'DATABASE_SORT',
  'CHANGE_CLUSTER_LAYOUT',
]);

export const VIEW_ACTIONS: ReadonlySet<StudioActionType> = new Set([
  'SELECT_STATE',
  'SELECT_CLUSTER',
  'SELECT_RELATIONSHIP',
  'FOCUS_STATE',
  'FOCUS_CLUSTER',
  'FOCUS_RELATIONSHIP',
  'HIGHLIGHT_RELATIONSHIP',
  'HIGHLIGHT_NEIGHBORHOOD',
  'SET_CAMERA_PRESET',
  'RESET_CAMERA',
  'FIT_SELECTED',
  'FILTER_GRAPH',
]);

export const VALID_ACTION_TYPES: ReadonlySet<StudioActionType> = new Set([
  ...SAFE_ACTIONS,
  ...VIEW_ACTIONS,
]);

export const VALID_SECTIONS = new Set([
  'DATABASE',
  'COORDINATES',
  'INFORMATION',
  'CHAT',
  'GRAPH',
  'CLUSTERS',
  'DIMENSIONS',
  'SEARCH',
  'SETTINGS',
]);

export const VALID_DIMENSIONS = new Set([1, 2, 3, 4, 8, 12, 16]);

export const VALID_CAMERA_PRESETS = new Set([
  'DEFAULT',
  'TOP',
  'FRONT',
  'SIDE',
  'CORE',
  'CLUSTER',
  'GRAPH',
  'DIMENSION',
]);

export const VALID_CLUSTER_LAYOUTS = new Set([
  'RADIAL',
  'GRID',
  'ORBITAL',
  'HIERARCHICAL',
  'DOMAIN_RADIAL',
]);
