/**
 * 3D Memory Studio — Funnel 64
 * Actual Studio Workspace & Panel Orchestration Engine Types
 */

import { SimulationDimension } from '../funnel52/types';
import { DataClassification } from '../funnel47/types';

export type WorkspaceStateMode =
  | 'INITIALIZING'
  | 'READY'
  | 'PANEL_OPENING'
  | 'PANEL_ACTIVE'
  | 'PANEL_CLOSING'
  | 'LAYOUT_TRANSITION'
  | 'DISPOSING'
  | 'DISPOSED';

export type PanelId =
  | 'DATABASE'
  | 'COORDINATES'
  | 'INFORMATION'
  | 'CHAT'
  | 'MODELS'
  | 'SEARCH'
  | 'GRAPH'
  | 'CLUSTERS'
  | 'DIMENSION'
  | 'SETTINGS';

export type PanelCategory = 'DATA' | 'SPATIAL' | 'GRAPH' | 'AI' | 'SYSTEM';

export type PanelDockPosition = 'LEFT' | 'RIGHT' | 'TOP' | 'BOTTOM' | 'FLOATING';

export type WorkspaceLayoutType =
  | 'FULL'
  | 'FOCUS'
  | 'SPLIT'
  | 'THREE_COLUMN'
  | 'SIDEBAR'
  | 'BOTTOM_PANEL'
  | 'OVERLAY';

export interface PanelDescriptor {
  readonly panelId: PanelId;
  readonly title: string;
  readonly iconName: string;
  readonly category: PanelCategory;
  readonly defaultDock: PanelDockPosition;
  readonly minWidth: number;
  readonly maxWidth: number;
  readonly defaultWidth: number;
  width: number;
  visible: boolean;
  active: boolean;
  order: number;
  status: 'IDLE' | 'LOADING' | 'READY' | 'ERROR';
}

export interface WorkspaceContextSnapshot {
  readonly activePanelId: PanelId | null;
  readonly visiblePanelIds: readonly PanelId[];
  readonly layout: WorkspaceLayoutType;
  readonly selectedStateId: string | null;
  readonly selectedRelationshipId: string | null;
  readonly selectedClusterId: string | null;
  readonly activeDimension: SimulationDimension;
  readonly cameraMode: string;
  readonly registeredPanelsCount: number;
}

export interface ViewportBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface F64TestResult {
  readonly testId: string;
  readonly name: string;
  readonly passed: boolean;
  readonly details: string;
  readonly durationMs: number;
  readonly totalEvaluations?: number;
  readonly variance?: number;
}

export interface F64SuiteReport {
  readonly suiteName: string;
  readonly totalTests: number;
  readonly passedTests: number;
  readonly failedTests: number;
  readonly allPassed: boolean;
  readonly totalDurationMs: number;
  readonly results: readonly F64TestResult[];
}
