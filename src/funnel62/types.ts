/**
 * 3D Memory Studio — Funnel 62
 * Actual 3D Memory Studio Experience & Frontend Integration Types
 *
 * Strongly typed definitions for the Studio landing experience, modular panels,
 * AI LLM provider hub, data provider abstraction, unified selection, and test suite reports.
 */

import { SimulationDimension } from '../funnel52/types';
import { DataClassification } from '../funnel47/types';
import { DimensionalInformationState } from '../funnel49/types';
import { GraphRelationship } from '../funnel58/types';
import { Cluster } from '../funnel59/types';
import { DimensionCoordinate, ProjectionType } from '../funnel60/types';
import { CameraState, CameraPresetType } from '../funnel61/types';

export type StudioScreen = 'LANDING' | 'STUDIO';

export type StudioActivePanel =
  | 'DATABASE'
  | 'COORDINATE'
  | 'INFORMATION'
  | 'GRAPH'
  | 'CLUSTER'
  | 'CHAT'
  | 'DIAGNOSTICS'
  | 'NONE';

export interface LandingCubeState {
  rotationX: number; // degrees
  rotationY: number; // degrees
  rotationZ: number; // degrees
  scale: number;
  isDragging: boolean;
  autoRotate: boolean;
}

export interface StudioSessionState {
  currentScreen: StudioScreen;
  activePanel: StudioActivePanel;
  moreOptionsOpen: boolean;
  diagnosticsOpen: boolean;
  selectedStateId: string | null;
  selectedClusterId: string | null;
  selectedRelationshipId: string | null;
  activeDimension: SimulationDimension;
  projectionMode: ProjectionType;
  cameraPreset: CameraPresetType | 'CUSTOM';
  selectedModelId: string;
  searchQuery: string;
  isTransitioning: boolean;
}

export interface DataProvider {
  readonly providerType: 'SIMULATION' | 'LOCAL' | 'REMOTE';
  getStates(): Promise<readonly DimensionalInformationState[]>;
  getStateById(stateId: string): Promise<DimensionalInformationState | undefined>;
  searchStates(query: string): Promise<readonly DimensionalInformationState[]>;
}

export interface F62TestResult {
  readonly testId: string;
  readonly name: string;
  readonly passed: boolean;
  readonly details: string;
  readonly durationMs: number;
  readonly totalEvaluations?: number;
  readonly variance?: number;
}

export interface F62SuiteReport {
  readonly suiteName: string;
  readonly totalTests: number;
  readonly passedTests: number;
  readonly failedTests: number;
  readonly allPassed: boolean;
  readonly totalDurationMs: number;
  readonly results: readonly F62TestResult[];
}
