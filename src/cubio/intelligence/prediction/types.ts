/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F11: CubiO Intelligence Prediction Engine (Types & Contracts)
 *
 * Master specification for multi-horizon future state forecasting,
 * counterfactual branch simulation, probability normalization, and confidence evaluation.
 */

import { CubiODimension } from '../../types';
import { CubiOState } from '../../state/types';
import { DetectedPatternEntry } from '../pattern/types';
import { AssociativeMemoryNode } from '../memory/types';

export interface PredictedCandidateState {
  readonly candidateId: string;
  readonly predictedState: CubiOState;
  readonly stepHorizon: number; // t+1, t+2, etc.
  readonly probability: number; // 0.0 .. 1.0 (normalized per step horizon sum = 1.0)
  readonly confidence: number; // 0.0 .. 1.0
  readonly displacementVector: readonly number[];
  readonly harmonicContinuity: number; // 0 .. 100
  readonly rationale: string;
  readonly derivedFromPatternIds: readonly string[];
  readonly candidateChecksum: string;
}

export interface CounterfactualBranch {
  readonly branchId: string;
  readonly intervention: string; // e.g. 'ELEVATE_D5', 'INVERT_POLARITY', 'ROTATE_4D'
  readonly alternativeState: CubiOState;
  readonly divergenceScore: number; // Spatial drift from baseline
  readonly probability: number;
  readonly confidence: number;
  readonly branchChecksum: string;
}

export interface PredictionRequest {
  readonly currentState: CubiOState;
  readonly horizonSteps?: number; // default 3
  readonly candidateCountPerStep?: number; // default 3
  readonly patterns?: readonly DetectedPatternEntry[];
  readonly memories?: readonly AssociativeMemoryNode[];
  readonly interventions?: readonly string[];
  readonly targetDimension?: CubiODimension;
}

export interface StatePredictionReport {
  readonly predictionId: string;
  readonly currentStateId: string;
  readonly horizonSteps: number;
  readonly totalCandidatesGenerated: number;
  readonly candidateStates: readonly PredictedCandidateState[];
  readonly counterfactualBranches: readonly CounterfactualBranch[];
  readonly dominantTrajectory: readonly CubiOState[];
  readonly meanConfidence: number;
  readonly meanResonanceScore: number;
  readonly predictionDurationMs: number;
  readonly predictionChecksum: string;
  readonly timestamp: number;
}
