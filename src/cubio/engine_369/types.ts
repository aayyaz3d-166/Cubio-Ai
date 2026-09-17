/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 3: 369 Encoding Engine Types
 *
 * Mathematically testable triadic, vortex, and harmonic transformation types.
 * Invariant: Non-magical, deterministic, verifiable reversibility, and collision-resistant signatures.
 */

import { CubiODimension } from '../types';
import { CubiOState } from '../state/types';

export interface TriadicHarmonicVector {
  readonly r3: number; // Modulo 3 resonance component [0..2]
  readonly r6: number; // Modulo 6 harmonic component [0..5]
  readonly r9: number; // Modulo 9 vortex digital root [1..9]
  readonly digitalRoot: number; // Pure digital root of state payload [1..9]
  readonly vortexPhase: number; // Phase angle in radians [0..2π]
  readonly fluxRatio: number; // Harmonic flux magnitude
}

export interface Encoded369State {
  readonly stateId: string;
  readonly originalChecksum: string;
  readonly encodedPayload: string;
  readonly harmonicVector: TriadicHarmonicVector;
  readonly signature369: string;
  readonly sourceDimension: CubiODimension;
  readonly targetDimension: CubiODimension;
  readonly isReversible: boolean;
  readonly encodingTimestamp: number;
}

export interface Decode369Result {
  readonly isSuccess: boolean;
  readonly decodedState: CubiOState | null;
  readonly maxCoordinateError: number;
  readonly isExact: boolean;
  readonly errorDetails?: string;
}

export interface DimensionalMappingResult {
  readonly sourceDimension: CubiODimension;
  readonly targetDimension: CubiODimension;
  readonly originalCoordinates: readonly number[];
  readonly projectedCoordinates: readonly number[];
  readonly harmonicResonanceFactor: number;
  readonly dimensionalFlux: number;
}

export interface Benchmark369Result {
  readonly iterationsCount: number;
  readonly totalDurationMs: number;
  readonly operationsPerSecond: number;
  readonly avgEncodingTimeMs: number;
  readonly avgDecodingTimeMs: number;
  readonly collisionCount: number;
  readonly uniqueSignatureCount: number;
  readonly maxReconstructionError: number;
}
