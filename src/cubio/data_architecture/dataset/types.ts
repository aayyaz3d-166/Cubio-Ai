/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 8: CubiO Experience Dataset & Learning Substrate Types
 *
 * Formal contracts for structured learning episodes, steps, state transitions,
 * replay verification, and multi-format research exports.
 */

import { CubiODimension } from '../../types';
import { CubiOMemoryTier } from '../../memory/types';
import { EmulatorCommandType, EmulatorHarmonic369Metrics } from '../../emulator/types';

export type CubiOSchemaVersion = '1.0.0';

export type EpisodeCategory =
  | 'SUCCESSFUL'            // Flawless execution, 369 harmonic resonance, CII = 1.0
  | 'FAILED_INVALID'        // Boundary failure, syntax error, illegal transition (for DPO negative sampling)
  | 'MULTI_STEP_REASONING'; // Multi-turn chained simulation tool operations

export interface CubiOStateRef {
  readonly universeChecksum: string;
  readonly targetStateId?: string;
  readonly targetStateChecksum?: string;
  readonly targetStatePosition?: readonly number[];
  readonly targetStateDimension?: CubiODimension;
  readonly totalStateCount: number;
}

export interface StateDelta {
  readonly modifiedFields: readonly string[];
  readonly positionDelta?: readonly number[];
  readonly previousChecksum: string;
  readonly nextChecksum: string;
  readonly description: string;
}

export interface MemoryOperationRef {
  readonly operation: 'READ' | 'WRITE' | 'SEARCH' | 'REMOVE';
  readonly tier: CubiOMemoryTier;
  readonly key: string;
  readonly cid?: string;
  readonly resonanceIndex?: number;
}

export interface CubiOStep {
  readonly stepIndex: number;
  readonly aiIntent: string;
  readonly toolInvoked: string;
  readonly commandType: EmulatorCommandType;
  readonly commandParameters: Readonly<Record<string, unknown>>;
  readonly stateBefore: CubiOStateRef;
  readonly stateAfter: CubiOStateRef;
  readonly stateDelta?: StateDelta;
  readonly harmonic369: EmulatorHarmonic369Metrics;
  readonly memoryOperations: readonly MemoryOperationRef[];
  readonly observation: string;
  readonly rawObservationData?: Readonly<Record<string, unknown>>;
  readonly aiReasoningStep?: string;
  readonly stepLatencyMs: number;
  readonly isStepSuccess: boolean;
  readonly stepError?: string;
}

export interface CubiOEpisode {
  readonly episodeId: string;
  readonly schemaVersion: CubiOSchemaVersion;
  readonly category: EpisodeCategory;
  readonly taskFingerprint: string;
  readonly taskDefinition?: any;
  readonly timestamp: number;
  readonly conversationId: string;
  readonly userPrompt: string;
  readonly sanitizedPrompt: string;
  readonly initialUniverseSnapshot: {
    readonly universeChecksum: string;
    readonly totalStateCount: number;
    readonly rootStateIds: readonly string[];
  };
  readonly finalUniverseSnapshot: {
    readonly universeChecksum: string;
    readonly totalStateCount: number;
    readonly rootStateIds: readonly string[];
  };
  readonly steps: readonly CubiOStep[];
  readonly finalOutcome: {
    readonly isSuccess: boolean;
    readonly totalLatencyMs: number;
    readonly totalSteps: number;
    readonly ciiScoreAchieved: number;
    readonly rewardScore: number;
    readonly finalAssistantResponse: string;
    readonly error?: string;
    readonly failureCategory?: 'VALIDATION_ERROR' | 'EMULATOR_ERROR' | 'STATE_NOT_FOUND' | 'PERMISSION_DENIED';
  };
  readonly trajectoryProvenance: {
    readonly trajectoryId: string;
    readonly trajectoryHash: string;
    readonly recordId: string;
    readonly provenanceTier: string;
    readonly verificationState: string;
  };
  readonly privacyMetadata: {
    readonly isSanitized: boolean;
    readonly containsPII: boolean;
    readonly sanitizedFields: readonly string[];
  };
}

export interface ReplayVerificationReport {
  readonly episodeId: string;
  readonly replayedSuccessfully: boolean;
  readonly checksumsMatch: boolean;
  readonly totalStepsReplayed: number;
  readonly stepVerifications: readonly {
    readonly stepIndex: number;
    readonly commandType: string;
    readonly successMatched: boolean;
    readonly checksumMatched: boolean;
    readonly expectedChecksum?: string;
    readonly actualChecksum?: string;
  }[];
  readonly replayLatencyMs: number;
  readonly error?: string;
}

export interface SFTToolCallingMessage {
  readonly role: 'system' | 'user' | 'assistant' | 'tool';
  readonly content?: string;
  readonly name?: string;
  readonly tool_calls?: readonly {
    readonly id: string;
    readonly type: 'function';
    readonly function: {
      readonly name: string;
      readonly arguments: string;
    };
  }[];
  readonly tool_call_id?: string;
}

export interface SFTConversationExport {
  readonly conversationId: string;
  readonly episodeId: string;
  readonly messages: readonly SFTToolCallingMessage[];
}

export interface DPOPreferencePairExport {
  readonly pairId: string;
  readonly prompt: string;
  readonly chosen: {
    readonly trajectory: readonly Record<string, unknown>[];
    readonly finalResponse: string;
    readonly rewardScore: number;
  };
  readonly rejected: {
    readonly trajectory: readonly Record<string, unknown>[];
    readonly finalResponse: string;
    readonly rewardScore: number;
    readonly error?: string;
  };
}

export interface RLTransitionStepExport {
  readonly episodeId: string;
  readonly stepIndex: number;
  readonly stateTensorVector: readonly number[];
  readonly actionType: string;
  readonly actionParametersDigest: string;
  readonly reward: number;
  readonly nextStateTensorVector: readonly number[];
  readonly isTerminal: boolean;
}
