/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 11: Learning Environment Layer — Core Contracts & Types
 *
 * Defines formal Gym-compatible contracts for RL and policy learning:
 * - LearningEnvironment abstraction
 * - EnvAction, EnvObservation, EnvStepResult, EnvResetOptions, EnvInfo
 * - ILearningAgent policy interface
 * - ReplayBuffer transition contracts
 */

import { CubiODimension } from '../../types';
import { EmulatorHarmonic369Metrics } from '../../emulator/types';
import { UniversalTaskCategory, DifficultyLevel, OutcomeCategory } from '../types';

export interface EnvAction {
  readonly toolName: string;
  readonly commandType: string;
  readonly parameters: Readonly<Record<string, unknown>>;
  readonly aiIntent?: string;
}

export interface EnvObservation {
  readonly episodeId: string;
  readonly taskFingerprint: string;
  readonly objective: string;
  readonly currentStepIndex: number;
  readonly maxSteps: number;
  readonly difficultyLevel: DifficultyLevel;
  readonly lastObservationText: string;
  readonly universeStateChecksum: string;
  readonly totalStateCount: number;
  readonly activeDimension: CubiODimension;
  readonly rawObservationData?: Readonly<Record<string, unknown>>;
  readonly stateTensorVector: readonly number[];
  readonly harmonic369Metrics?: EmulatorHarmonic369Metrics;
}

export interface RewardComponents {
  readonly actionCorrectness: number;
  readonly stateValidity: number;
  readonly goalProgress: number;
  readonly harmonicResonance: number;
  readonly recovery: number;
  readonly terminalSuccess: number;
  readonly penalties: number;
}

export interface EnvStepResult<T = EnvObservation> {
  readonly observation: T;
  readonly reward: number;
  readonly rewardComponents: RewardComponents;
  readonly done: boolean;       // True if task succeeded or failed fatally
  readonly truncated: boolean;  // True if maximum step budget reached
  readonly info: EnvInfo;
}

export interface EnvResetOptions {
  readonly category?: UniversalTaskCategory;
  readonly difficulty?: DifficultyLevel;
  readonly outcome?: OutcomeCategory;
  readonly seed?: number;
  readonly customObjective?: string;
}

export interface EnvInfo {
  readonly episodeId: string;
  readonly taskCategory: UniversalTaskCategory;
  readonly difficultyLevel: DifficultyLevel;
  readonly isSuccess: boolean;
  readonly stepCount: number;
  readonly latencyMs: number;
  readonly error?: string;
  readonly provenanceHash?: string;
}

export interface ILearningAgent {
  readonly agentId: string;
  observe(observation: EnvObservation): void;
  decide(observation: EnvObservation): Promise<EnvAction>;
  act(action: EnvAction): Promise<void>;
}

export interface ReplayTransition {
  readonly transitionId: string;
  readonly episodeId: string;
  readonly stepIndex: number;
  readonly observation: EnvObservation;
  readonly action: EnvAction;
  readonly reward: number;
  readonly nextObservation: EnvObservation;
  readonly done: boolean;
  readonly truncated: boolean;
  readonly priority: number;
  readonly outcomeCategory: OutcomeCategory;
  readonly timestamp: number;
}
