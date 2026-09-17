/**
 * 3D Memory Studio — Funnel 63
 * Actual 3D Landing Cube & Studio Entry Engine Types
 */

export type LandingMode =
  | 'LANDING'
  | 'START_REQUESTED'
  | 'ENTERING_STUDIO'
  | 'STUDIO_ACTIVE'
  | 'CANCELLED';

export type CubeFaceId =
  | 'DATA'
  | 'GRAPH'
  | 'CLUSTER'
  | 'DIMENSION'
  | 'AI'
  | 'STUDIO';

export type FaceInteractionState = 'IDLE' | 'HOVERED' | 'SELECTED';

export interface CubeFaceInfo {
  readonly id: CubeFaceId;
  readonly label: string;
  readonly normal: readonly [number, number, number];
  readonly colorHex: number;
  state: FaceInteractionState;
}

export interface CubeState {
  rotationX: number; // degrees [-85, 85]
  rotationY: number; // degrees [0, 360)
  rotationZ: number; // degrees
  scale: number;     // [0.5, 2.0]
  autoRotate: boolean;
  isDragging: boolean;
  activeFace: CubeFaceId | null;
  hoveredFace: CubeFaceId | null;
}

export interface LandingTransitionState {
  progress: number; // 0.0 to 1.0
  durationMs: number;
  elapsedMs: number;
  scaleMultiplier: number;
  opacityMultiplier: number;
  isCompleted: boolean;
}

export interface LandingEngineStats {
  mode: LandingMode;
  cubeRotation: readonly [number, number, number];
  cubeScale: number;
  activeFace: CubeFaceId | null;
  hoveredFace: CubeFaceId | null;
  startEnabled: boolean;
  transitionProgress: number;
}

export interface F63TestResult {
  readonly testId: string;
  readonly name: string;
  readonly passed: boolean;
  readonly details: string;
  readonly durationMs: number;
  readonly totalEvaluations?: number;
  readonly variance?: number;
}

export interface F63SuiteReport {
  readonly suiteName: string;
  readonly totalTests: number;
  readonly passedTests: number;
  readonly failedTests: number;
  readonly allPassed: boolean;
  readonly totalDurationMs: number;
  readonly results: readonly F63TestResult[];
}
