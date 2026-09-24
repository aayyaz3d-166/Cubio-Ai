/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F68: Reliability & Recovery Types & Contracts
 *
 * Full contracts for the 7-Stage Reliability Pipeline:
 * Failure -> Detect -> Classify -> Retry/Fallback -> Recover -> Validate -> Continue
 */

export type FailureCategory =
  | 'TIMEOUT'
  | 'RATE_LIMITED'
  | 'PROVIDER_UNAVAILABLE'
  | 'NETWORK_DISCONNECT'
  | 'SYNTAX_ERROR'
  | 'FATAL_CRASH'
  | 'CIRCUIT_TRIPPED'
  | 'PARTIAL_FAILURE';

export interface FailureClassification {
  readonly category: FailureCategory;
  readonly isTransient: boolean;
  readonly retryRecommended: boolean;
  readonly fallbackRecommended: boolean;
  readonly reason: string;
  readonly errorCode?: number;
}

export type UniversalCircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface UniversalCircuitBreakerStatus {
  readonly name: string;
  readonly state: UniversalCircuitBreakerState;
  readonly failureCount: number;
  readonly successCount: number;
  readonly lastStateChange: number;
}

export interface RetryPolicyConfig {
  readonly maxAttempts: number;
  readonly initialDelayMs: number;
  readonly maxDelayMs: number;
  readonly backoffMultiplier: number;
  readonly retryableCategories: readonly FailureCategory[];
}

export interface ProviderFallbackChain {
  readonly primaryProvider: string;
  readonly fallbackProviders: readonly string[];
  readonly activeProvider: string;
  readonly failoverCount: number;
}

export interface WorkflowCheckpoint {
  readonly checkpointId: string;
  readonly workflowId: string;
  readonly lastCompletedStageIndex: number;
  readonly totalStages: number;
  readonly stageOutputs: Readonly<Record<string, unknown>>;
  readonly checkpointChecksum: string;
  readonly createdAt: number;
}

export interface PartialResultSalvageResult {
  readonly salvagedProperties: Readonly<Record<string, unknown>>;
  readonly isPartial: boolean;
  readonly fallbackDefaultsApplied: readonly string[];
}

export type DegradationLevel =
  | 'FULL_FIDELITY'
  | 'OPTIMIZED_FIDELITY'
  | 'LIGHTWEIGHT_CORE'
  | 'OFFLINE_SOVEREIGN';

export interface ReliabilityPipelineResult {
  readonly executionId: string;
  readonly success: boolean;
  readonly finalOutput: unknown;
  readonly attemptsCount: number;
  readonly recoveredFromFailure: boolean;
  readonly failureHistory: readonly FailureClassification[];
  readonly activeProvider: string;
  readonly degradationLevel: DegradationLevel;
  readonly executionChecksum: string;
  readonly timestamp: number;
}

export interface IReliabilityRecoveryCoordinator {
  executeWithRecovery<T>(
    actionName: string,
    primaryFn: () => Promise<T>,
    fallbackFn?: () => Promise<T>
  ): Promise<Readonly<ReliabilityPipelineResult>>;
  createCheckpoint(
    workflowId: string,
    stageIndex: number,
    totalStages: number,
    stageOutputs: Readonly<Record<string, unknown>>
  ): WorkflowCheckpoint;
  resumeWorkflow(checkpointId: string): { canResume: boolean; checkpoint: WorkflowCheckpoint };
}
