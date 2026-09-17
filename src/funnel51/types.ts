/**
 * 3D Memory Studio — Funnel 51
 * 3D Memory Studio Experience Foundation Types
 *
 * Types for the simulation state machine, sequence phases, visual nodes/particles,
 * accessibility options, and research tests.
 */

export type SimulationPhase =
  | 'IDLE'
  | 'STARTING'
  | 'INITIALIZING'
  | 'STATE_FORMATION'
  | 'STRUCTURE_FORMATION'
  | 'DIMENSIONAL_FORMATION'
  | 'MEMORY_READY'
  | 'STUDIO_READY';

export interface SimulationPhaseConfig {
  readonly phase: SimulationPhase;
  readonly title: string;
  readonly subtitle: string;
  readonly durationMs: number;
  readonly progressStart: number;
  readonly progressEnd: number;
}

export interface VisualParticle {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly radius: number;
  readonly alpha: number;
  readonly colorHex: string;
  readonly vx: number;
  readonly vy: number;
}

export interface VisualStateNode {
  readonly nodeId: string;
  readonly label: string;
  readonly category: string;
  readonly classification: 'GREEN' | 'RED';
  readonly x: number;
  readonly y: number;
  readonly targetX: number;
  readonly targetY: number;
  readonly opacity: number;
  readonly scale: number;
  readonly colorHex: string;
  readonly sequence369Preview?: string;
  readonly coordinatePreview?: string;
}

export interface VisualRelationship {
  readonly id: string;
  readonly sourceNodeId: string;
  readonly targetNodeId: string;
  readonly opacity: number;
  readonly colorHex: string;
}

export interface SimulationExperienceState {
  readonly currentPhase: SimulationPhase;
  readonly progress: number; // 0.0 to 1.0
  readonly elapsedMs: number;
  readonly isRunning: boolean;
  readonly isPaused: boolean;
  readonly isCompleted: boolean;
  readonly prefersReducedMotion: boolean;
  readonly particles: readonly VisualParticle[];
  readonly nodes: readonly VisualStateNode[];
  readonly relationships: readonly VisualRelationship[];
  readonly activeDimension: number;
}

export interface SimulationExperienceActions {
  readonly start: () => void;
  readonly pause: () => void;
  readonly resume: () => void;
  readonly restart: () => void;
  readonly skip: () => void;
  readonly enterStudio: () => void;
  readonly setReducedMotion: (enabled: boolean) => void;
}

export interface F51TestResult {
  readonly testId: string;
  readonly name: string;
  readonly passed: boolean;
  readonly details: string;
  readonly durationMs: number;
  readonly totalEvaluations?: number;
  readonly variance?: number;
}

export interface F51SuiteReport {
  readonly suiteName: string;
  readonly totalTests: number;
  readonly passedTests: number;
  readonly failedTests: number;
  readonly allPassed: boolean;
  readonly totalDurationMs: number;
  readonly results: readonly F51TestResult[];
}
