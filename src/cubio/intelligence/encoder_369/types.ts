/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F3: CubiO Intelligence 369 Encoder (Types & Contracts)
 *
 * Master specification for deterministic 369 state representation encoding:
 * - Triadic Harmonic Vectors: (r3, r6, r9, digitalRoot, vortexPhase, fluxRatio)
 * - Vortex Doubling Circuits: (1, 2, 4, 8, 7, 5)
 * - Reversible forward/inverse harmonic transformations (< 10^-10 coordinate error)
 * - Collision-resistant 0x369_ signatures
 */

import { CubiODimension } from '../../types';
import { CubiOState } from '../../state/types';
import type { TriadicHarmonicVector, Encoded369State, Decode369Result } from '../../engine_369/types';
import { CubiOStandardInput } from '../input/types';

export interface Harmonic369StateEnvelope {
  readonly stateId: string;
  readonly standardInputId?: string;
  readonly triadicVector: TriadicHarmonicVector;
  readonly vortexDoublingCircuit: readonly number[];
  readonly harmonicFlux: number;
  readonly signature369: string;
  readonly transformedCoordinates: readonly number[];
  readonly dimension: CubiODimension;
  readonly isReversible: boolean;
  readonly encodedChecksum: string;
  readonly timestamp: number;
}

export interface EncodeInput369Result {
  readonly isSuccess: boolean;
  readonly encodedState: Readonly<Harmonic369StateEnvelope>;
  readonly validationErrors: readonly string[];
  readonly encodingDurationMs: number;
}

export interface DecodeInput369Result {
  readonly isSuccess: boolean;
  readonly reconstructedCoordinates: readonly number[];
  readonly maxCoordinateError: number;
  readonly isExact: boolean;
}

export type { TriadicHarmonicVector, Encoded369State, Decode369Result };
