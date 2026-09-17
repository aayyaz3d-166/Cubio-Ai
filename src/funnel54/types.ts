/**
 * 3D Memory Studio — Funnel 54
 * Final Advanced Visualization & Studio Polish Engine Types
 *
 * Comprehensive TypeScript interfaces for advanced scene models, depth fields,
 * focus modes, dimensional morphing, camera easing, and research suites.
 */

import {
  StudioViewModel,
  StudioNodeViewModel,
  StudioEdgeViewModel,
  StudioClusterViewModel,
  StudioCoreViewModel,
} from '../funnel53/types';
import {
  SimulationDimension,
  SimulationSpeed,
  SimulationCamera,
  SimulationTelemetry,
  SimulationProjectionTelemetry,
} from '../funnel52/types';
import { DimensionalInformationState } from '../funnel49/types';

export type StudioPresentationMode = 'SPACE' | 'FOCUS' | 'DIMENSION';

export interface AdvancedParticle {
  readonly id: number;
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly screenX: number;
  readonly screenY: number;
  readonly radius: number;
  readonly colorHex: string;
  readonly alpha: number;
}

export interface AdvancedSceneNode extends StudioNodeViewModel {
  readonly depthOpacity: number;
  readonly depthScale: number;
  readonly isDimmed: boolean;
  readonly isFocused: boolean;
  readonly ringRadius: number;
}

export interface AdvancedSceneEdge extends StudioEdgeViewModel {
  readonly depthOpacity: number;
  readonly isDimmed: boolean;
  readonly isFocused: boolean;
}

export interface AdvancedSceneCluster extends StudioClusterViewModel {
  readonly isDimmed: boolean;
  readonly isFocused: boolean;
}

export interface AdvancedSceneModel {
  readonly core: StudioCoreViewModel;
  readonly nodes: readonly AdvancedSceneNode[];
  readonly edges: readonly AdvancedSceneEdge[];
  readonly clusters: readonly AdvancedSceneCluster[];
  readonly particles: readonly AdvancedParticle[];
  readonly telemetry: SimulationTelemetry;
  readonly projection: SimulationProjectionTelemetry;
  readonly camera: SimulationCamera;
  readonly presentationMode: StudioPresentationMode;
  readonly selectedNode: AdvancedSceneNode | null;
  readonly focusedClusterId: string | null;
  readonly hoveredNode: AdvancedSceneNode | null;
  readonly highlightedNodeIds: readonly string[];
  readonly activeDimension: SimulationDimension;
  readonly speed: SimulationSpeed;
  readonly isPaused: boolean;
  readonly searchQuery: string;
  readonly activeFilter: 'ALL' | 'GREEN' | 'RED' | 'AI_MODEL';
  readonly prefersReducedMotion: boolean;
  readonly sourceStudioViewModel: StudioViewModel;
}

export interface F54TestResult {
  readonly testId: string;
  readonly name: string;
  readonly passed: boolean;
  readonly details: string;
  readonly durationMs: number;
  readonly totalEvaluations?: number;
  readonly variance?: number;
}

export interface F54SuiteReport {
  readonly suiteName: string;
  readonly totalTests: number;
  readonly passedTests: number;
  readonly failedTests: number;
  readonly allPassed: boolean;
  readonly totalDurationMs: number;
  readonly results: readonly F54TestResult[];
}
