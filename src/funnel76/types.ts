/**
 * 3D Memory Studio — Funnel 76
 * Studio Workspace Boot & Ready State Types
 */

export type StudioBootState =
  | 'IDLE'
  | 'BOOT_REQUESTED'
  | 'BOOTSTRAPPING'
  | 'CHECKING_RENDERER'
  | 'CHECKING_CAMERA'
  | 'CHECKING_SCENE'
  | 'CHECKING_LANDING'
  | 'CHECKING_WORKSPACE'
  | 'CHECKING_RUNTIME'
  | 'CHECKING_DATA'
  | 'READY'
  | 'ACTIVE'
  | 'FAILED'
  | 'RETRYING'
  | 'DISPOSED';

export type BootDependencyId =
  | 'RENDERER'
  | 'CAMERA'
  | 'SCENE'
  | 'LANDING'
  | 'WORKSPACE'
  | 'RUNTIME'
  | 'DATA';

export type BootDependencyState =
  | 'PENDING'
  | 'CHECKING'
  | 'READY'
  | 'FAILED'
  | 'SKIPPED';

export interface BootDependency {
  readonly id: BootDependencyId;
  readonly label: string;
  readonly required: boolean;
  state: BootDependencyState;
  startedAt?: number;
  completedAt?: number;
  durationMs?: number;
  error?: string;
}

export interface BootGenerationToken {
  readonly generation: number;
  readonly createdAt: number;
  isDisposed: boolean;
}

export interface StudioBootSnapshot {
  readonly state: StudioBootState;
  readonly generation: number;
  readonly progressPercentage: number;
  readonly isReady: boolean;
  readonly isActive: boolean;
  readonly dependencies: readonly BootDependency[];
  readonly failedDependency?: BootDependencyId;
  readonly error?: string;
  readonly timestamp: number;
}

export interface F76TestResult {
  readonly testId: string;
  readonly name: string;
  readonly passed: boolean;
  readonly details: string;
  readonly durationMs: number;
  readonly totalEvaluations?: number;
  readonly variance?: number;
}

export interface F76SuiteReport {
  readonly suiteName: string;
  readonly totalTests: number;
  readonly passedTests: number;
  readonly failedTests: number;
  readonly allPassed: boolean;
  readonly totalDurationMs: number;
  readonly results: readonly F76TestResult[];
}
