/**
 * 3D Memory Studio — Funnel 70
 * Actual AI Studio Action & Command Engine Types
 */

import { SimulationDimension } from '../funnel52/types';
import { CameraPresetType } from '../funnel61/types';
import { SectionId } from '../funnel66/types';
import { ClusterLayoutMode } from '../funnel59/types';

export type StudioActionType =
  | 'NAVIGATE_SECTION'
  | 'OPEN_PANEL'
  | 'CLOSE_PANEL'
  | 'TOGGLE_PANEL'
  | 'SELECT_STATE'
  | 'SELECT_CLUSTER'
  | 'SELECT_RELATIONSHIP'
  | 'FOCUS_STATE'
  | 'FOCUS_CLUSTER'
  | 'FOCUS_RELATIONSHIP'
  | 'SHOW_GRAPH'
  | 'HIDE_GRAPH'
  | 'FILTER_GRAPH'
  | 'HIGHLIGHT_RELATIONSHIP'
  | 'HIGHLIGHT_NEIGHBORHOOD'
  | 'SHOW_CLUSTERS'
  | 'HIDE_CLUSTERS'
  | 'CHANGE_CLUSTER_LAYOUT'
  | 'SWITCH_DIMENSION'
  | 'SHOW_AXES'
  | 'HIDE_AXES'
  | 'SHOW_GRID'
  | 'HIDE_GRID'
  | 'SEARCH_INFORMATION'
  | 'SET_CAMERA_PRESET'
  | 'RESET_CAMERA'
  | 'FIT_SELECTED'
  | 'DATABASE_FILTER'
  | 'DATABASE_SORT';

export type StudioActionStatus =
  | 'PENDING'
  | 'VALIDATED'
  | 'EXECUTING'
  | 'COMPLETED'
  | 'REJECTED'
  | 'FAILED'
  | 'CANCELLED';

export type StudioActionSource = 'AI' | 'USER' | 'SYSTEM';

export interface StudioActionParameters {
  sectionId?: SectionId;
  panelId?: SectionId;
  stateId?: string;
  clusterId?: string;
  relationshipId?: string;
  dimension?: SimulationDimension;
  cameraPreset?: CameraPresetType;
  clusterLayout?: ClusterLayoutMode;
  searchQuery?: string;
  filterText?: string;
  sortField?: string;
  sortDirection?: 'ASC' | 'DESC';
  gridSize?: number;
  [key: string]: unknown;
}

export interface StudioAction {
  readonly id: string;
  readonly type: StudioActionType;
  readonly source: StudioActionSource;
  readonly timestamp: number;
  readonly target?: string;
  readonly parameters?: StudioActionParameters;
  readonly confidence: number;
  status: StudioActionStatus;
  rejectionReason?: string;
}

export interface StudioActionResult {
  readonly actionId: string;
  readonly status: StudioActionStatus;
  readonly message: string;
  readonly affectedObjectId?: string;
  readonly affectedPanel?: string;
  readonly affectedSection?: string;
  readonly errorCode?: string;
  readonly timestamp: number;
}

export interface ActionValidationResult {
  readonly isValid: boolean;
  readonly reason?: string;
}

export interface ActionHistoryEntry {
  readonly action: StudioAction;
  readonly result: StudioActionResult;
}

export interface ActionEngineSnapshot {
  readonly pendingActions: readonly StudioAction[];
  readonly currentAction: StudioAction | null;
  readonly lastResult: StudioActionResult | null;
  readonly history: readonly ActionHistoryEntry[];
  readonly isExecuting: boolean;
  readonly autoExecuteSafeActions: boolean;
}

export interface F70TestResult {
  readonly testId: string;
  readonly name: string;
  readonly passed: boolean;
  readonly details: string;
  readonly durationMs: number;
  readonly totalEvaluations?: number;
  readonly variance?: number;
}

export interface F70SuiteReport {
  readonly suiteName: string;
  readonly totalTests: number;
  readonly passedTests: number;
  readonly failedTests: number;
  readonly allPassed: boolean;
  readonly totalDurationMs: number;
  readonly results: readonly F70TestResult[];
}
