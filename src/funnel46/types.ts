/**
 * 3D Memory Studio — Funnel 46
 * Information Universe Studio Frontend Integration Types
 *
 * Strongly typed deterministic structures for the React frontend Studio,
 * navigation tabs, panel layouts, central state selection context,
 * breadcrumbs, render budgets, and test suites.
 */

import {
  StudioPanelId,
  StudioRenderBudget,
  StudioFilterCriteria,
  UniverseOverviewViewModel,
  DataExplorerViewModel,
  StateInspectorViewModel,
  Visualizer369ViewModel,
  DimensionalProjectionViewModel,
  MultiDimensionalSpaceViewModel,
  KnowledgeGraphViewModel,
  ProvenanceViewModel,
  SearchConsoleViewModel,
  StudioSessionSnapshot,
  StudioClosure,
} from '../funnel45/types';
import { NormalizedStudioDataset, NormalizedStudioRecord } from '../funnel45/adapters';

export type {
  StudioPanelId,
  StudioRenderBudget,
  StudioFilterCriteria,
  UniverseOverviewViewModel,
  DataExplorerViewModel,
  StateInspectorViewModel,
  Visualizer369ViewModel,
  DimensionalProjectionViewModel,
  MultiDimensionalSpaceViewModel,
  KnowledgeGraphViewModel,
  ProvenanceViewModel,
  SearchConsoleViewModel,
  StudioSessionSnapshot,
  StudioClosure,
  NormalizedStudioDataset,
  NormalizedStudioRecord,
};

export interface StudioNavTabItem {
  readonly id: StudioPanelId;
  readonly label: string;
  readonly shortLabel: string;
  readonly iconName: string;
  readonly badge?: string | number;
  readonly description: string;
}

export interface StudioBreadcrumb {
  readonly universeId: string;
  readonly dimension: number;
  readonly stateId?: string;
  readonly recordId?: string;
  readonly panelId: StudioPanelId;
}

export interface F46TestResult {
  readonly testId: string;
  readonly name: string;
  readonly passed: boolean;
  readonly details: string;
  readonly durationMs: number;
  readonly totalEvaluations?: number;
  readonly collisions?: number;
  readonly variance?: number;
  readonly fullBytes?: number;
  readonly sharedBytes?: number;
  readonly byteSavings?: number;
  readonly ratio?: number;
}

export interface F46SuiteReport {
  readonly suiteName: string;
  readonly totalTests: number;
  readonly passedTests: number;
  readonly failedTests: number;
  readonly allPassed: boolean;
  readonly totalDurationMs: number;
  readonly results: readonly F46TestResult[];
}
