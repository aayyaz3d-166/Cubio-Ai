/**
 * 3D Memory Studio — Funnel 73
 * Browser Runtime Mount & Startup Diagnostics Types
 */

export type BootPhase =
  | 'UNMOUNTED'
  | 'MOUNTING'
  | 'ROOT_READY'
  | 'BOOTSTRAPPING'
  | 'CHECKING_RENDERER'
  | 'CHECKING_SCENE'
  | 'CHECKING_STUDIO'
  | 'CHECKING_RUNTIME'
  | 'ACTIVATING_F72'
  | 'READY'
  | 'ERROR';

export type PhaseStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'SKIPPED';

export interface BootPhaseRecord {
  readonly phase: BootPhase;
  readonly name: string;
  readonly isRequired: boolean;
  timeoutMs: number;
  status: PhaseStatus;
  startedAt?: number;
  completedAt?: number;
  durationMs?: number;
  error?: string;
}

export interface BootEvent {
  readonly timestamp: number;
  readonly phase: BootPhase;
  readonly message: string;
  readonly level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';
}

export interface BootPerformanceMetrics {
  readonly totalBootDurationMs: number;
  readonly rootMountDurationMs: number;
  readonly rendererCheckDurationMs: number;
  readonly sceneCheckDurationMs: number;
  readonly studioCheckDurationMs: number;
  readonly f72ActivationDurationMs: number;
}

export interface BootDiagnosticsData {
  readonly rootMounted: boolean;
  readonly rendererAvailable: boolean;
  readonly sceneAvailable: boolean;
  readonly cameraAvailable: boolean;
  readonly studioAvailable: boolean;
  readonly f72Ready: boolean;
  readonly databaseAvailable: boolean;
  readonly persistenceAvailable: boolean;
  readonly finalState: BootPhase;
  readonly failedPhase?: BootPhase;
  readonly errorMessage?: string;
  readonly events: readonly BootEvent[];
  readonly metrics: BootPerformanceMetrics;
}

export interface F73TestResult {
  readonly testId: string;
  readonly name: string;
  readonly passed: boolean;
  readonly details: string;
  readonly durationMs: number;
  readonly totalEvaluations?: number;
  readonly variance?: number;
}

export interface F73SuiteReport {
  readonly suiteName: string;
  readonly totalTests: number;
  readonly passedTests: number;
  readonly failedTests: number;
  readonly allPassed: boolean;
  readonly totalDurationMs: number;
  readonly results: readonly F73TestResult[];
}
