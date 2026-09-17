/**
 * 3D Memory Studio — Funnel 66
 * Actual Studio Navigation & Panel Orchestration Engine Types
 */

import { DataClassification } from '../funnel47/types';

export type SectionId =
  | 'HOME'
  | 'DATABASE'
  | 'COORDINATES'
  | 'INFORMATION'
  | 'CHAT'
  | 'GRAPH'
  | 'CLUSTERS'
  | 'DIMENSIONS'
  | 'SEARCH'
  | 'SETTINGS';

export interface SectionDescriptor {
  readonly id: SectionId;
  readonly label: string;
  readonly iconName: string;
  readonly order: number;
  readonly enabled: boolean;
  readonly active: boolean;
}

export type PanelStateMode =
  | 'CLOSED'
  | 'OPEN'
  | 'MINIMIZED'
  | 'MAXIMIZED';

export type WorkspaceLayoutType =
  | 'DEFAULT'
  | 'LEFT_PANEL'
  | 'RIGHT_PANEL'
  | 'BOTTOM_PANEL'
  | 'FULLSCREEN'
  | 'SPLIT';

export interface PanelDescriptor {
  readonly id: SectionId;
  readonly title: string;
  readonly mode: PanelStateMode;
  readonly width: number;
  readonly minWidth: number;
  readonly maxWidth: number;
  readonly isOverlay: boolean;
  readonly zIndex: number;
}

export interface StudioWorkspaceSnapshot {
  readonly currentSection: SectionId;
  readonly activeLayout: WorkspaceLayoutType;
  readonly openPanels: readonly SectionId[];
  readonly activePanelId: SectionId | null;
  readonly navigationHistory: readonly SectionId[];
  readonly selectedEntityId: string | null;
  readonly selectedClassification: DataClassification | null;
  readonly activeDimension: number;
  readonly cameraPreset: string;
  readonly isMobile: boolean;
  readonly timestamp: number;
}

export interface F66TestResult {
  readonly testId: string;
  readonly name: string;
  readonly passed: boolean;
  readonly details: string;
  readonly durationMs: number;
  readonly totalEvaluations?: number;
  readonly variance?: number;
}

export interface F66SuiteReport {
  readonly suiteName: string;
  readonly totalTests: number;
  readonly passedTests: number;
  readonly failedTests: number;
  readonly allPassed: boolean;
  readonly totalDurationMs: number;
  readonly results: readonly F66TestResult[];
}
