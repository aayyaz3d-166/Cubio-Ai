/**
 * 3D Memory Studio — Funnel 72
 * Studio Boot & Runtime Activation Types
 */

export type BootStageId =
  | 'APPLICATION'
  | 'SECURITY'
  | 'RENDERER'
  | 'SCENE'
  | 'CAMERA'
  | 'DIMENSION'
  | 'STUDIO_SHELL'
  | 'WORKSPACE'
  | 'DATABASE'
  | 'AI'
  | 'ACTIONS'
  | 'PERSISTENCE'
  | 'READY';

export type BootStageStatus = 'PENDING' | 'RUNNING' | 'READY' | 'FAILED' | 'SKIPPED';

export type BootState = 'IDLE' | 'BOOTING' | 'READY' | 'DEGRADED' | 'FAILED' | 'DISPOSED';

export interface StageDescriptor {
  readonly id: BootStageId;
  readonly name: string;
  readonly isRequired: boolean;
  readonly timeoutMs: number;
  readonly description: string;
}

export interface StageState {
  readonly id: BootStageId;
  status: BootStageStatus;
  durationMs?: number;
  error?: string;
  timestamp: number;
}

export interface RuntimeReadyState {
  readonly isReady: boolean;
  readonly isDegraded: boolean;
  readonly isFailed: boolean;
  readonly bootState: BootState;
  readonly completedStages: readonly BootStageId[];
  readonly failedStages: readonly BootStageId[];
  readonly skippedStages: readonly BootStageId[];
  readonly optionalStages: readonly BootStageId[];
  readonly bootDurationMs: number;
  readonly safeMode: boolean;
}

export interface RuntimeHealthState {
  readonly status: 'READY' | 'DEGRADED' | 'FAILED' | 'BOOTING' | 'IDLE';
  readonly healthyStagesCount: number;
  readonly totalStagesCount: number;
  readonly safeMode: boolean;
  readonly timestamp: number;
}

export interface F72TestResult {
  readonly testId: string;
  readonly name: string;
  readonly passed: boolean;
  readonly details: string;
  readonly durationMs: number;
  readonly totalEvaluations?: number;
  readonly variance?: number;
}

export interface F72SuiteReport {
  readonly suiteName: string;
  readonly totalTests: number;
  readonly passedTests: number;
  readonly failedTests: number;
  readonly allPassed: boolean;
  readonly totalDurationMs: number;
  readonly results: readonly F72TestResult[];
}
