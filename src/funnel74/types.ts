/**
 * 3D Memory Studio — Funnel 74
 * Landing Engine Lifecycle & Browser Mount Types
 */

import { LandingEngine } from '../funnel63/landing/landingEngine';

export type LandingLifecycleState =
  | 'UNMOUNTED'
  | 'CREATED'
  | 'INITIALIZING'
  | 'ACTIVE'
  | 'DISPOSING'
  | 'DISPOSED'
  | 'FAILED';

export interface LifecycleGenerationToken {
  readonly generation: number;
  readonly createdAt: number;
  isDisposed: boolean;
}

export interface LifecycleSnapshot {
  readonly state: LandingLifecycleState;
  readonly generation: number;
  readonly hasActiveEngine: boolean;
  readonly canStartStudio: boolean;
  readonly timestamp: number;
  readonly error?: string;
}

export interface LandingRuntimeRecoveryState {
  readonly isRecovering: boolean;
  readonly retryCount: number;
  readonly lastError?: string;
  readonly generation: number;
}

export interface F74TestResult {
  readonly testId: string;
  readonly name: string;
  readonly passed: boolean;
  readonly details: string;
  readonly durationMs: number;
  readonly totalEvaluations?: number;
  readonly variance?: number;
}

export interface F74SuiteReport {
  readonly suiteName: string;
  readonly totalTests: number;
  readonly passedTests: number;
  readonly failedTests: number;
  readonly allPassed: boolean;
  readonly totalDurationMs: number;
  readonly results: readonly F74TestResult[];
}
