/**
 * CubiO — Universal Spatial Operating Environment
 * Layer 7: Embodied / Environment Intelligence Types
 *
 * Core contracts for the 7-stage Embodied Interaction Cycle:
 * Perceive -> Plan -> Act -> Observe -> Verify -> Learn -> Improve
 * across real files, codebases, 3D CAD environments, APIs, and long-running projects.
 */

export type EmbodiedStage =
  | 'PERCEIVE'
  | 'PLAN'
  | 'ACT'
  | 'OBSERVE'
  | 'VERIFY'
  | 'LEARN'
  | 'IMPROVE';

export type EnvironmentType =
  | 'WORKSPACE_FILESYSTEM'
  | 'TYPESCRIPT_CODEBASE'
  | 'SPATIAL_3D_CAD'
  | 'GOVERNED_API_TOOLS'
  | 'LONG_HORIZON_PROJECT';

export interface EnvironmentPerception {
  readonly environmentType: EnvironmentType;
  readonly targetUri: string;
  readonly rawState: Readonly<Record<string, unknown>>;
  readonly detectedEntitiesCount: number;
  readonly stateChecksum: string;
  readonly perceivedAt: number;
}

export interface EmbodiedPlan {
  readonly planId: string;
  readonly goal: string;
  readonly actionSteps: readonly string[];
  readonly estimatedRiskScore: number; // 0.0 .. 1.0
  readonly requiresHumanAuthorization: boolean;
  readonly planChecksum: string;
}

export interface EmbodiedAction {
  readonly actionId: string;
  readonly environmentType: EnvironmentType;
  readonly operationType: 'READ' | 'WRITE' | 'EXECUTE' | 'TRANSFORM_3D' | 'INVOKE_API';
  readonly targetResource: string;
  readonly payload: Readonly<Record<string, unknown>>;
  readonly authToken?: string;
}

export interface EnvironmentObservation {
  readonly observationId: string;
  readonly actionId: string;
  readonly success: boolean;
  readonly durationMs: number;
  readonly resultingState: Readonly<Record<string, unknown>>;
  readonly errorDetails?: string;
  readonly observedAt: number;
}

export interface InvariantVerification {
  readonly verificationId: string;
  readonly passed: boolean;
  readonly physicalOrMathematicalInvariantSatisfied: boolean;
  readonly securityPolicySatisfied: boolean;
  readonly zeroVarianceVerified: boolean;
  readonly qualityScore: number; // 0.0 .. 100.0
  readonly verificationFeedback: string;
}

export interface LearningArtifact {
  readonly memoryId: string;
  readonly distilledRuleOrPattern: string;
  readonly resonanceScore: number;
  readonly savedToMerkleStore: boolean;
}

export interface ContinuousCiiSnapshot {
  readonly snapshotId: string;
  readonly environmentType: EnvironmentType;
  readonly qualityScore: number; // 0.0 .. 100.0
  readonly efficiencyScore: number; // 0.0 .. 100.0
  readonly currentCiiScore: number; // 0.0 .. 100.0
  readonly improvementDelta: number; // e.g. +2.5%
  readonly timestamp: number;
}

export interface EmbodiedCycleExecutionReport {
  readonly cycleId: string;
  readonly environmentType: EnvironmentType;
  readonly taskGoal: string;
  readonly perception: EnvironmentPerception;
  readonly plan: EmbodiedPlan;
  readonly action: EmbodiedAction;
  readonly observation: EnvironmentObservation;
  readonly verification: InvariantVerification;
  readonly learning: LearningArtifact;
  readonly ciiSnapshot: ContinuousCiiSnapshot;
  readonly cycleCompletedSuccessfully: boolean;
  readonly cycleSealHash: string;
  readonly totalTurnaroundLatencyMs: number;
  readonly timestamp: number;
}

export interface IEmbodiedCycleEngine {
  executeEmbodiedCycle(
    environmentType: EnvironmentType,
    goal: string,
    actionPayload: Record<string, unknown>
  ): Promise<EmbodiedCycleExecutionReport>;
}
