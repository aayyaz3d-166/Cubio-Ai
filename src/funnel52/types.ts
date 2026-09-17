/**
 * 3D Memory Studio — Funnel 52
 * Real-Time Information Universe Simulation Engine Types
 *
 * Strongly typed interfaces for the real-time simulation world state,
 * progressive state lifecycle, deterministic coordinate projections,
 * cluster structures, telemetry, and focused research tests.
 */

import { DimensionalInformationState } from '../funnel49/types';
import { DataClassification } from '../funnel47/types';

export type SimulationLifecycleStage =
  | 'DISCOVERED'
  | 'ENCODED'
  | 'ANCHORED'
  | 'CONNECTED'
  | 'CLUSTERED'
  | 'PROJECTED'
  | 'ACTIVE';

export type SimulationSpeed = 0.25 | 0.5 | 1 | 2 | 4;

export type SimulationDimension = 1 | 2 | 3 | 4 | 5 | 6 | 8 | 12 | 16;

export type SimulationClusterType =
  | 'STANDARDS'
  | 'PROTOCOLS'
  | 'ONTOLOGY'
  | 'AI_LLM'
  | 'TAXONOMY'
  | 'INFORMATION_THEORY'
  | 'SECURITY';

export interface SimulatedStateNode {
  readonly stateId: string;
  readonly recordId: string;
  readonly entityName: string;
  readonly category: string;
  readonly sourceDomain: string;
  readonly classification: DataClassification;
  readonly processingAllowed: boolean;
  readonly lifecycleStage: SimulationLifecycleStage;
  readonly sequence369: string | null;
  readonly numericStateBigIntString: string | null;
  readonly checksum: string;
  readonly formattedCoordinate: string;
  readonly coordinateValues: readonly number[];
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly radius: number;
  readonly colorHex: string;
  readonly clusterId: SimulationClusterType;
  readonly isSelected: boolean;
  readonly isHighlighted: boolean;
  readonly sourceState: DimensionalInformationState;
}

export interface SimulatedEdge {
  readonly id: string;
  readonly sourceNodeId: string;
  readonly targetNodeId: string;
  readonly relationshipType: string;
  readonly opacity: number;
  readonly colorHex: string;
}

export interface SimulatedCluster {
  readonly clusterId: SimulationClusterType;
  readonly label: string;
  readonly colorHex: string;
  readonly centerX: number;
  readonly centerY: number;
  readonly centerZ: number;
  readonly radius: number;
  readonly memberStateIds: readonly string[];
}

export interface SimulatedParticle {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly radius: number;
  readonly alpha: number;
  readonly colorHex: string;
  readonly angle: number;
  readonly speed: number;
}

export interface SimulationProjectionTelemetry {
  readonly sourceDimension: number;
  readonly targetDimension: number;
  readonly mode: 'DIRECT' | 'LOWER_PROJECTION' | 'HIGHER_PROJECTION';
  readonly preservedAxes: readonly string[];
  readonly discardedAxes: readonly string[];
  readonly derivedAxes: readonly string[];
  readonly informationLossDetected: boolean;
  readonly preservedChecksum: string;
}

export interface SimulationTelemetry {
  readonly memoryStatesCount: number;
  readonly activeNodesCount: number;
  readonly relationshipsCount: number;
  readonly dimension: SimulationDimension;
  readonly sequence369Count: number;
  readonly greenCount: number;
  readonly redCount: number;
  readonly fps: number;
  readonly simulationTimeMs: number;
  readonly simulationTimeFormatted: string;
  readonly frameCount: number;
}

export interface SimulationCamera {
  readonly rotX: number; // pitch (-90 to +90 deg)
  readonly rotY: number; // yaw (0 to 360 deg)
  readonly zoom: number; // 0.3 to 3.0
  readonly panX: number;
  readonly panY: number;
}

export interface SimulationWorldState {
  readonly simulationTimeMs: number;
  readonly frameCount: number;
  readonly isRunning: boolean;
  readonly isPaused: boolean;
  readonly speed: SimulationSpeed;
  readonly activeDimension: SimulationDimension;
  readonly allSourceStates: readonly DimensionalInformationState[];
  readonly activeNodes: readonly SimulatedStateNode[];
  readonly activeEdges: readonly SimulatedEdge[];
  readonly clusters: readonly SimulatedCluster[];
  readonly particles: readonly SimulatedParticle[];
  readonly projection: SimulationProjectionTelemetry;
  readonly telemetry: SimulationTelemetry;
  readonly camera: SimulationCamera;
  readonly selectedStateId: string | null;
  readonly highlightedStateIds: readonly string[];
  readonly searchQuery: string;
  readonly activeFilter: 'ALL' | 'GREEN' | 'RED' | 'AI_MODEL';
  readonly seed: number;
}

export interface F52TestResult {
  readonly testId: string;
  readonly name: string;
  readonly passed: boolean;
  readonly details: string;
  readonly durationMs: number;
  readonly totalEvaluations?: number;
  readonly variance?: number;
}

export interface F52SuiteReport {
  readonly suiteName: string;
  readonly totalTests: number;
  readonly passedTests: number;
  readonly failedTests: number;
  readonly allPassed: boolean;
  readonly totalDurationMs: number;
  readonly results: readonly F52TestResult[];
}
