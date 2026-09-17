/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F5: CubiO Intelligence Dimension Engine (Types & Contracts)
 *
 * Master specification for multi-dimensional state mapping and controlled experiments:
 * 8 Logical State Spaces: D0 through D7.
 * Transitions: ELEVATION, PROJECTION, IDENTITY, CROSS_MANIFOLD.
 */

import { CubiODimension } from '../../types';
import { CubiOState } from '../../state/types';
import type {
  CubiODimensionDescriptor,
  DimensionTensorState,
  DimensionTransitionResult,
  DimensionTransitionType,
} from '../../dimension/types';

export interface DimensionExperimentConfig {
  readonly state?: CubiOState;
  readonly tensor?: DimensionTensorState;
  readonly fromDimension: CubiODimension;
  readonly targetDimension: CubiODimension;
  readonly iterations?: number;
  readonly testReconstruction?: boolean;
}

export interface DimensionExperimentResult {
  readonly experimentId: string;
  readonly fromDimension: CubiODimension;
  readonly targetDimension: CubiODimension;
  readonly transitionType: DimensionTransitionType;
  readonly isLossless: boolean;
  readonly sourceEntropy: number;
  readonly targetEntropy: number;
  readonly entropyDelta: number;
  readonly reconstructionError: number;
  readonly coordinateDeltas: readonly number[];
  readonly invariantsPreserved: readonly string[];
  readonly experimentChecksum: string;
  readonly durationMs: number;
}

export interface DimensionMatrixReport {
  readonly reportId: string;
  readonly totalTransitionsTested: number; // 64 for full 8x8 matrix
  readonly losslessTransitionsCount: number;
  readonly projectionTransitionsCount: number;
  readonly meanReconstructionError: number;
  readonly maxReconstructionError: number;
  readonly transitions: readonly DimensionExperimentResult[];
  readonly matrixChecksum: string;
  readonly timestamp: number;
}

export type {
  CubiODimensionDescriptor,
  DimensionTensorState,
  DimensionTransitionResult,
  DimensionTransitionType,
};
