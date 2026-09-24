/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F59: Master Universal 369 Adapter Engine
 *
 * Coordinates the full 7-stage 369 AI integration pipeline:
 * AI Input -> Canonical State -> Dimensional Node -> 369 Transform -> Derived State -> Solver -> Verified Output.
 */

import { deterministicHash } from '../../../state/determinism';
import {
  Adapter369Request,
  Adapter369SolveResult,
  Derived369State,
  IUniversal369Adapter,
} from './types';
import { CanonicalStateBridge } from './canonicalStateBridge';
import { TransformationPipeline369 } from './transformationPipeline';

export class CubiOUniversal369Adapter implements IUniversal369Adapter {
  private bridge = new CanonicalStateBridge();
  private pipeline = new TransformationPipeline369();

  /**
   * Adapts an AI input into a canonical dimensional state and applies the 369 transform.
   */
  public adaptAIInput(request: Adapter369Request): Readonly<Derived369State> {
    const { canonicalState, dimensionalNode } = this.bridge.bridgeAIInput(request);
    return this.pipeline.transformState(canonicalState, dimensionalNode);
  }

  /**
   * Solves a problem with full 369 harmonic state derivation and output verification.
   */
  public async solveWith369(request: Adapter369Request): Promise<Readonly<Adapter369SolveResult>> {
    const startTime = Date.now();
    const derivedState = this.adaptAIInput(request);

    const originalCoords = derivedState.canonicalState.spatialCoordinates as readonly number[];
    const { isReversible, maxError } = this.pipeline.verifyReversibility(
      originalCoords,
      derivedState.transformedCoordinates
    );

    const solverOutput = [
      `[CubiO 369 Harmonic Engine]: Adapted AI Input "${request.aiInput}"`,
      `Digital Root: ${derivedState.digitalRoot} (${derivedState.isHarmonicNode ? 'Tesla Harmonic Node' : 'Flux Node'})`,
      `Triadic Vector: (r3=${derivedState.triadicVector.r3}, r6=${derivedState.triadicVector.r6}, r9=${derivedState.triadicVector.r9})`,
      `Vortex Doubling Circuit: [${derivedState.vortexDoublingCircuit.join(', ')}]`,
      `0x369 Signature: ${derivedState.signature369}`,
      `Harmonic Coordinate Reversibility: ${isReversible ? 'VERIFIED (error < 1e-4)' : 'FAILED'}`,
    ].join('\n');

    const executionTimeMs = Math.max(1, Date.now() - startTime);
    const verifiedChecksum = deterministicHash(
      `VERIFIED_369_SOLVE:${derivedState.stateId}:${derivedState.signature369}:${isReversible}:${maxError}`
    );

    return Object.freeze({
      requestId: `REQ_369_${verifiedChecksum.slice(2, 10)}`,
      derivedState,
      solverOutput,
      reversibilityVerified: isReversible,
      maxCoordinateError: maxError,
      executionTimeMs,
      verifiedChecksum,
      timestamp: Date.now(),
    });
  }
}
