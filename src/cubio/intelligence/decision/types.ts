/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F12: CubiO Intelligence Decision Engine (Types & Contracts)
 *
 * Master specification for multi-criteria utility optimization,
 * candidate path ranking, sovereign policy authorization, and action determination.
 */

import { CubiODimension } from '../../types';
import { CubiOState } from '../../state/types';
import { StatePredictionReport } from '../prediction/types';
import { ReasoningProofReport } from '../reasoning/types';

export type DecisionActionType =
  | 'EXECUTE_TRANSITION'
  | 'ELEVATE_DIMENSION'
  | 'ATTUNE_HARMONIC_369'
  | 'CONSOLIDATE_MEMORY'
  | 'RESOLVE_SUPERPOSITION'
  | 'HALT_AND_AUDIT'
  | 'CUSTOM_ACTION';

export interface DecisionCandidateOption {
  readonly optionId: string;
  readonly actionType: DecisionActionType;
  readonly actionTitle: string;
  readonly targetDimension?: CubiODimension;
  readonly targetStateId?: string;
  readonly expectedUtility: number; // 0.0 .. 1.0
  readonly confidenceScore: number; // 0.0 .. 1.0
  readonly riskScore: number; // 0.0 .. 1.0
  readonly harmonicResonance: number; // 0 .. 100
  readonly estimatedEnergyCost: number; // 0 .. 100
  readonly rationale: string;
  readonly isPolicyCompliant: boolean;
  readonly optionChecksum: string;
}

export interface UtilityWeights {
  readonly resonanceWeight?: number; // default 0.30
  readonly confidenceWeight?: number; // default 0.35
  readonly efficiencyWeight?: number; // default 0.20
  readonly riskPenaltyWeight?: number; // default 0.15
}

export interface DecisionRequest {
  readonly contextPrompt: string;
  readonly currentState?: CubiOState;
  readonly predictions?: StatePredictionReport;
  readonly reasoningProof?: ReasoningProofReport;
  readonly candidateOptions?: readonly DecisionCandidateOption[];
  readonly sovereignCubId?: string;
  readonly activeDimension?: CubiODimension;
  readonly utilityWeights?: UtilityWeights;
}

export interface DecisionReport {
  readonly decisionId: string;
  readonly contextPrompt: string;
  readonly selectedAction: DecisionCandidateOption;
  readonly rankedAlternatives: readonly DecisionCandidateOption[];
  readonly evaluatedOptionsCount: number;
  readonly chosenRationale: string;
  readonly sovereignAuthorizationGranted: boolean;
  readonly decisionDurationMs: number;
  readonly decisionChecksum: string;
  readonly timestamp: number;
}
