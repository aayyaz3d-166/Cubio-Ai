/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 4: Dimension Engine Types
 *
 * Formal specification of the 8 Logical State Spaces (D0 through D7).
 *
 * NOTE: These are strictly computational dimensions (logical state spaces,
 * tensor coordinate ranks, and abstraction layers) — NOT physical dimensions.
 */

import { CubiODimension } from '../types';
export type { CubiODimension };
export type CubiOLogicalDimension = CubiODimension;

export type DimensionTransitionType = 'ELEVATION' | 'PROJECTION' | 'IDENTITY' | 'CROSS_MANIFOLD';

export interface CubiODimensionDescriptor {
  readonly dimension: CubiODimension;
  readonly name: string;
  readonly category: string;
  readonly tensorRank: number; // Tensor dimensionality (D0=1, D1=1, D2=2, D3=3, D4=4, D5=5, D6=6, D7=7)
  readonly description: string;
  readonly stateSpaceType: string;
  readonly primaryAbstraction: string;
  readonly invariantProperties: readonly string[];
}

export interface DimensionTensorState {
  readonly stateId: string;
  readonly dimension: CubiODimension;
  readonly coordinateVector: readonly number[];
  readonly rank: number;
  readonly payload: Readonly<Record<string, any>>;
  readonly checksum: string;
}

export interface DimensionTransitionResult {
  readonly transitionId: string;
  readonly fromDimension: CubiODimension;
  readonly toDimension: CubiODimension;
  readonly inputTensor: DimensionTensorState;
  readonly outputTensor: DimensionTensorState;
  readonly isLossless: boolean;
  readonly transitionType: DimensionTransitionType;
  readonly transitionChecksum: string;
}

export interface DimensionManifoldUniverse {
  readonly descriptors: Readonly<Record<CubiODimension, CubiODimensionDescriptor>>;
  readonly activeDimension: CubiODimension;
}
