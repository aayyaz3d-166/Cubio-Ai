/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F59: 369 Dimensional Intelligence Adapter Types
 *
 * Core contracts for bridging the sovereign 369 mathematical architecture
 * to the Universal AI Layer without modifying certified legacy engines.
 */

import { CubiODimension } from '../../../types';
import { DimensionalStateNode } from '../dimension/types';
import { TriadicHarmonicVector } from '../../encoder_369/types';

export interface Adapter369Request {
  readonly aiInput: string;
  readonly targetDimension?: CubiODimension;
  readonly problemContext?: string;
  readonly parameters?: Readonly<Record<string, unknown>>;
}

export interface Derived369State {
  readonly stateId: string;
  readonly canonicalState: Readonly<Record<string, unknown>>;
  readonly dimensionalNode: DimensionalStateNode;
  readonly triadicVector: TriadicHarmonicVector;
  readonly vortexDoublingCircuit: readonly number[];
  readonly digitalRoot: number;
  readonly isHarmonicNode: boolean;
  readonly signature369: string;
  readonly transformedCoordinates: readonly number[];
  readonly harmonicFlux: number;
  readonly encodedChecksum: string;
  readonly timestamp: number;
}

export interface Adapter369SolveResult {
  readonly requestId: string;
  readonly derivedState: Derived369State;
  readonly solverOutput: string;
  readonly reversibilityVerified: boolean;
  readonly maxCoordinateError: number;
  readonly executionTimeMs: number;
  readonly verifiedChecksum: string;
  readonly timestamp: number;
}

export interface IUniversal369Adapter {
  adaptAIInput(request: Adapter369Request): Derived369State;
  solveWith369(request: Adapter369Request): Promise<Adapter369SolveResult>;
}
