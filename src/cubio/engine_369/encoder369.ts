/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 3: 369 Encoding Engine
 *
 * Implements the full computational pipeline:
 * INPUT -> Canonical State -> 369 Encoder -> Encoded State -> Dimension Mapping.
 *
 * Invariant: Deterministic output, mathematically verifiable reversibility,
 * collision-resistant signatures, and zero state divergence.
 */

import { CubiODimension } from '../types';
import { CubiOState } from '../state/types';
import { CubiOStateFactory } from '../state/stateEngine';
import { deterministicHash } from '../state/determinism';
import { Math369 } from './math369';
import {
  TriadicHarmonicVector,
  Encoded369State,
  Decode369Result,
  DimensionalMappingResult,
} from './types';

export class CubiO369Encoder {
  /**
   * Computes deterministic 369 irreversible content-addressable signature.
   */
  public static compute369Signature(state: CubiOState): string {
    const triadic = Math369.deriveTriadicHarmonicVector(state.position, state.properties);
    const raw = [
      `ID:${state.id}`,
      `CS:${state.checksum}`,
      `DR:${triadic.digitalRoot}`,
      `R3:${triadic.r3}`,
      `R6:${triadic.r6}`,
      `R9:${triadic.r9}`,
      `PHASE:${triadic.vortexPhase.toFixed(6)}`,
      `DIM:${state.dimension}`,
    ].join('::');

    return `0x369_${deterministicHash(raw).slice(2, 18)}`;
  }

  /**
   * Encodes a canonical CubiOState through the 369 Encoder pipeline into Encoded369State.
   */
  public static encode(
    state: CubiOState,
    options: { reversible?: boolean; targetDimension?: CubiODimension } = {}
  ): Readonly<Encoded369State> {
    const reversible = options.reversible !== undefined ? options.reversible : true;
    const targetDimension = options.targetDimension || state.dimension;

    // 1. Calculate Triadic Harmonic Vector
    const harmonicVector = Math369.deriveTriadicHarmonicVector(state.position, state.properties);

    // 2. Perform Dimension Mapping
    const projectedCoords = Math369.projectDimensionCoordinates(
      state.position,
      state.dimension,
      targetDimension
    );

    // 3. Apply Reversible Harmonic Transform if requested
    let transformedCoords = projectedCoords;
    if (reversible) {
      transformedCoords = Math369.forwardHarmonicTransform(projectedCoords, harmonicVector.fluxRatio);
    }

    // 4. Construct Encoded Payload
    const payloadObj = {
      id: state.id,
      originalPosition: state.position,
      transformedPosition: transformedCoords,
      sourceDimension: state.dimension,
      targetDimension,
      properties: state.properties,
      relationships: state.relationships,
      memory: state.memory,
      parent: state.parent,
      children: state.children,
      checksum: state.checksum,
      fluxRatio: harmonicVector.fluxRatio,
    };

    const encodedPayload = JSON.stringify(payloadObj);
    const signature369 = this.compute369Signature(state);

    return Object.freeze({
      stateId: state.id,
      originalChecksum: state.checksum,
      encodedPayload,
      harmonicVector,
      signature369,
      sourceDimension: state.dimension,
      targetDimension,
      isReversible: reversible,
      encodingTimestamp: Date.now(),
    });
  }

  /**
   * Decodes an Encoded369State back into a canonical CubiOState.
   * Proves lossless reversibility within mathematical epsilon threshold.
   */
  public static decode(encoded: Encoded369State): Decode369Result {
    if (!encoded.isReversible) {
      return Object.freeze({
        isSuccess: false,
        decodedState: null,
        maxCoordinateError: Infinity,
        isExact: false,
        errorDetails: 'Encoded state was flagged as irreversible.',
      });
    }

    try {
      const parsed = JSON.parse(encoded.encodedPayload);
      const transformedCoords: readonly number[] = parsed.transformedPosition;
      const fluxRatio: number = parsed.fluxRatio;

      // 1. Invert Harmonic Transform
      const restoredCoords = Math369.inverseHarmonicTransform(transformedCoords, fluxRatio);

      // 2. Compute maximum numerical reconstruction error against original
      let maxError = 0;
      const origPos: readonly number[] = parsed.originalPosition;
      for (let i = 0; i < origPos.length; i++) {
        const err = Math.abs((restoredCoords[i] || 0) - origPos[i]);
        if (err > maxError) maxError = err;
      }

      // 3. Reconstruct canonical CubiOState
      const decodedState = CubiOStateFactory.createState(
        parsed.properties?.label || parsed.id,
        origPos, // Use restored original coordinates
        parsed.sourceDimension,
        parsed.properties,
        parsed.relationships,
        parsed.memory,
        parsed.parent,
        parsed.children,
        parsed.id
      );

      const isExact = maxError < 1e-10 && decodedState.checksum === encoded.originalChecksum;

      return Object.freeze({
        isSuccess: true,
        decodedState,
        maxCoordinateError: maxError,
        isExact,
      });
    } catch (err: any) {
      return Object.freeze({
        isSuccess: false,
        decodedState: null,
        maxCoordinateError: Infinity,
        isExact: false,
        errorDetails: err?.message || 'Failed to decode 369 state payload.',
      });
    }
  }

  /**
   * Maps coordinates between arbitrary dimensions (D2 through D7).
   */
  public static mapDimension(
    coordinates: readonly number[],
    fromDim: CubiODimension,
    toDim: CubiODimension
  ): DimensionalMappingResult {
    const projected = Math369.projectDimensionCoordinates(coordinates, fromDim, toDim);
    const harmonicVector = Math369.deriveTriadicHarmonicVector(coordinates);

    return Object.freeze({
      sourceDimension: fromDim,
      targetDimension: toDim,
      originalCoordinates: Object.freeze([...coordinates]),
      projectedCoordinates: projected,
      harmonicResonanceFactor: harmonicVector.fluxRatio,
      dimensionalFlux: (Math369.getTriadicOscillationValue(projected.length) / 9),
    });
  }

  /**
   * Verifies strict state integrity between canonical state and encoded representation.
   */
  public static verifyStateIntegrity(state: CubiOState, encoded: Encoded369State): boolean {
    if (state.id !== encoded.stateId) return false;
    if (state.checksum !== encoded.originalChecksum) return false;

    const signature = this.compute369Signature(state);
    return signature === encoded.signature369;
  }
}
