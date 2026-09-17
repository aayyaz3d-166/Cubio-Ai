/**
 * 3D Memory Studio — Funnel 53
 * Immersive Visualization & Interaction Engine Types
 *
 * Strongly typed definitions for the Studio View Model, visual state nodes,
 * memory core, interaction controllers, dimensional projection indicators,
 * camera systems, and research tests.
 */

import {
  SimulationWorldState,
  SimulatedStateNode,
  SimulatedEdge,
  SimulatedCluster,
  SimulatedParticle,
  SimulationDimension,
  SimulationSpeed,
  SimulationProjectionTelemetry,
  SimulationTelemetry,
  SimulationCamera,
} from '../funnel52/types';
import { DimensionalInformationState } from '../funnel49/types';

export interface StudioNodeViewModel {
  readonly stateId: string;
  readonly recordId: string;
  readonly entityName: string;
  readonly category: string;
  readonly sourceDomain: string;
  readonly classification: 'GREEN' | 'RED';
  readonly processingAllowed: boolean;
  readonly lifecycleStage: string;
  readonly sequence369: string | null;
  readonly sequence369Formatted: string;
  readonly numericStateBigIntString: string | null;
  readonly formattedCoordinate: string;
  readonly coordinateValues: readonly number[];
  readonly checksum: string;
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly screenX: number;
  readonly screenY: number;
  readonly scale: number;
  readonly zDepth: number;
  readonly radius: number;
  readonly colorHex: string;
  readonly clusterId: string;
  readonly isSelected: boolean;
  readonly isHighlighted: boolean;
  readonly isHovered: boolean;
  readonly sourceState: DimensionalInformationState;
}

export interface StudioEdgeViewModel {
  readonly id: string;
  readonly sourceNodeId: string;
  readonly targetNodeId: string;
  readonly relationshipType: string;
  readonly opacity: number;
  readonly colorHex: string;
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
  readonly strokeWidth: number;
}

export interface StudioClusterViewModel {
  readonly clusterId: string;
  readonly label: string;
  readonly colorHex: string;
  readonly centerX: number;
  readonly centerY: number;
  readonly centerZ: number;
  readonly screenX: number;
  readonly screenY: number;
  readonly screenRadius: number;
  readonly scale: number;
  readonly memberCount: number;
}

export interface StudioCoreViewModel {
  readonly screenX: number;
  readonly screenY: number;
  readonly scale: number;
  readonly radius: number;
  readonly activeDimension: SimulationDimension;
  readonly pulseScale: number;
  readonly label: string;
}

export interface StudioViewModel {
  readonly core: StudioCoreViewModel;
  readonly nodes: readonly StudioNodeViewModel[];
  readonly edges: readonly StudioEdgeViewModel[];
  readonly clusters: readonly StudioClusterViewModel[];
  readonly particles: readonly SimulatedParticle[];
  readonly telemetry: SimulationTelemetry;
  readonly projection: SimulationProjectionTelemetry;
  readonly camera: SimulationCamera;
  readonly selectedNode: StudioNodeViewModel | null;
  readonly hoveredNode: StudioNodeViewModel | null;
  readonly highlightedNodeIds: readonly string[];
  readonly activeDimension: SimulationDimension;
  readonly speed: SimulationSpeed;
  readonly isPaused: boolean;
  readonly searchQuery: string;
  readonly activeFilter: 'ALL' | 'GREEN' | 'RED' | 'AI_MODEL';
  readonly sourceWorldState: SimulationWorldState;
}

export interface F53TestResult {
  readonly testId: string;
  readonly name: string;
  readonly passed: boolean;
  readonly details: string;
  readonly durationMs: number;
  readonly totalEvaluations?: number;
  readonly variance?: number;
}

export interface F53SuiteReport {
  readonly suiteName: string;
  readonly totalTests: number;
  readonly passedTests: number;
  readonly failedTests: number;
  readonly allPassed: boolean;
  readonly totalDurationMs: number;
  readonly results: readonly F53TestResult[];
}
