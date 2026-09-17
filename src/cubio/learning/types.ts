/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 8: Universal Intelligence Experience & Synthetic Trajectory Types
 *
 * Defines the 15 Universal Task Families (A-O), 8 Difficulty Levels,
 * Independent Outcome Categories, Controlled Ablation Configurations (A-F),
 * Generation Statistics, and Measurable Evaluation Metrics.
 */

import { CubiODimension } from '../types';
import { CreateStatePayload, CreateRelationPayload } from '../emulator/types';
import { CubiOEpisode, CubiOStep } from '../data_architecture/dataset/types';

export type UniversalTaskCategory =
  | 'ENTITY_UNDERSTANDING'         // Family A
  | 'STATE_UNDERSTANDING'          // Family B
  | 'SPATIAL_REASONING'            // Family C
  | 'RELATIONSHIP_GRAPH_REASONING' // Family D
  | 'TEMPORAL_STATE_CHANGE'        // Family E
  | 'MEMORY_RETRIEVAL'             // Family F
  | 'MEMORY_UPDATE'                // Family G
  | 'MULTI_STEP_PLANNING'          // Family H
  | 'TOOL_ACTION_SELECTION'        // Family I
  | 'OBSERVATION_INTERPRETATION'   // Family J
  | 'ERROR_DETECTION'              // Family K
  | 'ERROR_RECOVERY'               // Family L
  | 'LONG_HORIZON_REASONING'       // Family M
  | 'ABSTRACT_REASONING'           // Family N
  | 'GENERALIZATION_OOD';          // Family O

export type DifficultyLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type OutcomeCategory =
  | 'SUCCESS'
  | 'FAILURE'
  | 'RECOVERY'
  | 'OOD_CHALLENGE';

export type AblationConfiguration =
  | 'CONFIG_A_TEXT_BASELINE'
  | 'CONFIG_B_SPATIAL_ONLY'
  | 'CONFIG_C_SPATIAL_369'
  | 'CONFIG_D_SPATIAL_TRAJECTORY'
  | 'CONFIG_E_SPATIAL_369_TRAJECTORY'
  | 'CONFIG_F_FULL_CUBIO';

export interface UniversalTaskDefinition {
  readonly taskId: string;
  readonly category: UniversalTaskCategory;
  readonly difficultyLevel: DifficultyLevel; // 1 to 8 (Independent from outcome)
  readonly intendedOutcome: OutcomeCategory; // Independent from difficulty
  readonly objective: string;
  readonly reasoningGoals: readonly string[];
  readonly initialUniverseConfig: {
    readonly initialStatesCount: number;
    readonly initialStates: readonly CreateStatePayload[];
    readonly initialRelations: readonly CreateRelationPayload[];
  };
  readonly stepsPlan: readonly {
    readonly toolInvoked: string;
    readonly commandType: string;
    readonly parameters: Record<string, any>;
    readonly shouldFail?: boolean;
    readonly expectedErrorCode?: string;
  }[];
  readonly expectedTrajectoryLength: number;
  readonly isOOD: boolean;
}

export interface SyntheticGenerationConfig {
  readonly totalEpisodesTarget?: number;
  readonly categoryDistribution?: Partial<Record<UniversalTaskCategory, number>>;
  readonly difficultyDistribution?: Partial<Record<DifficultyLevel, number>>;
  readonly outcomeDistribution?: Partial<Record<OutcomeCategory, number>>;
  readonly enableQualityGates?: boolean;
  readonly enableDeterministicReplayGate?: boolean;
  readonly seed?: number;
}

export interface MeasurableEvaluationMetrics {
  readonly observationAccuracy: number; // % of claims strictly matching emulator payload
  readonly stateAccuracy: number;       // % of final state checksums matching target
  readonly toolSelectionAccuracy: number; // % of tools correctly chosen
  readonly parameterAccuracy: number;   // % of parameter types/ranges strictly valid
  readonly unsupportedClaimRate: number; // % of statements not backed by observation (target: 0.0)
}

export interface QualityValidationReport {
  readonly isValid: boolean;
  readonly passedGatesCount: number;
  readonly totalGatesCount: number;
  readonly gateResults: readonly {
    readonly gateName: string;
    readonly passed: boolean;
    readonly details?: string;
  }[];
  readonly evaluationMetrics: MeasurableEvaluationMetrics;
  readonly failureReason?: string;
}

export interface GenerationStatistics {
  readonly totalGenerated: number;
  readonly totalValid: number;
  readonly totalRejected: number;
  readonly rejectionRate: number;
  readonly familyDistribution: Readonly<Record<UniversalTaskCategory, number>>;
  readonly difficultyDistribution: Readonly<Record<DifficultyLevel, number>>;
  readonly outcomeDistribution: Readonly<Record<OutcomeCategory, number>>;
  readonly meanTrajectoryLength: number;
  readonly meanStateCount: number;
  readonly meanRelationsCount: number;
  readonly meanMemoryOpsCount: number;
  readonly harmonic369ValidRate: number;
  readonly replaySuccessRate: number;
  readonly duplicateRate: number;
}

export interface DatasetSplitPartition {
  readonly trainEpisodes: readonly CubiOEpisode[];
  readonly validationEpisodes: readonly CubiOEpisode[];
  readonly oodTestEpisodes: readonly CubiOEpisode[];
  readonly totalCount: number;
}
