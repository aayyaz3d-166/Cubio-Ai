/**
 * 3D Memory Studio — Funnel 65
 * Actual Studio Runtime Activation & UI Integration Types
 */

export type RuntimeStateMode =
  | 'BOOTING'
  | 'LANDING'
  | 'STARTING_STUDIO'
  | 'STUDIO_ACTIVE'
  | 'ERROR'
  | 'DISPOSED';

export type RuntimeScreen = 'LANDING' | 'STUDIO';

export interface RuntimeDiagnosticReport {
  readonly state: RuntimeStateMode;
  readonly screen: RuntimeScreen;
  readonly rootMounted: boolean;
  readonly landingMounted: boolean;
  readonly studioMounted: boolean;
  readonly rendererCreated: boolean;
  readonly canvasAttached: boolean;
  readonly canvasWidth: number;
  readonly canvasHeight: number;
  readonly rafOwner: string;
  readonly cameraConnected: boolean;
  readonly sceneConnected: boolean;
  readonly workspaceVisible: boolean;
  readonly activePanel: string | null;
  readonly activeDimension: number;
  readonly timestamp: number;
}

export interface F65TestResult {
  readonly testId: string;
  readonly name: string;
  readonly passed: boolean;
  readonly details: string;
  readonly durationMs: number;
  readonly totalEvaluations?: number;
  readonly variance?: number;
}

export interface F65SuiteReport {
  readonly suiteName: string;
  readonly totalTests: number;
  readonly passedTests: number;
  readonly failedTests: number;
  readonly allPassed: boolean;
  readonly totalDurationMs: number;
  readonly results: readonly F65TestResult[];
}
