/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F59: 369 Transformation Pipeline
 *
 * Mathematical transformation engine applying vortex math, triadic harmonic vectors,
 * and reversible coordinate transforms to canonical states.
 */

import { deterministicHash } from '../../../state/determinism';
import { Math369 } from '../../../engine_369/math369';
import { TriadicHarmonicVector } from '../../encoder_369/types';
import { Derived369State } from './types';
import { DimensionalStateNode } from '../dimension/types';

export class TransformationPipeline369 {
  /**
   * Applies the full 369 mathematical transformation to the bridged state.
   */
  public transformState(
    canonicalState: Readonly<Record<string, unknown>>,
    dimensionalNode: DimensionalStateNode
  ): Derived369State {
    const coords = (canonicalState.spatialCoordinates as readonly number[]) || [3, 6, 9, 432];

    // Compute digital root of coordinates
    const sum = coords.reduce((acc, v) => acc + Math.abs(Math.round(v)), 0);
    const digitalRoot = Math369.computeDigitalRoot(sum);
    const isHarmonicNode = digitalRoot === 3 || digitalRoot === 6 || digitalRoot === 9;

    // Compute Triadic Harmonic Vector
    const r3 = Math.cos((digitalRoot * Math.PI) / 3);
    const r6 = Math.cos((digitalRoot * 2 * Math.PI) / 3);
    const r9 = Math.cos(digitalRoot * Math.PI);
    const vortexPhase = (digitalRoot % 6) / 6;
    const fluxRatio = Math.sqrt(3 * 3 + 6 * 6 + 9 * 9) / 10; // Harmonic invariant

    const triadicVector: TriadicHarmonicVector = Object.freeze({
      r3: Number(r3.toFixed(6)),
      r6: Number(r6.toFixed(6)),
      r9: Number(r9.toFixed(6)),
      digitalRoot,
      vortexPhase: Number(vortexPhase.toFixed(6)),
      fluxRatio: Number(fluxRatio.toFixed(6)),
    });

    const vortexDoublingCircuit = Object.freeze([1, 2, 4, 8, 7, 5]);

    // Forward transformation
    const transformedCoordinates = Object.freeze(
      coords.map((c, i) => Number((c * (1.0 + (vortexDoublingCircuit[i % 6] / 100))).toFixed(6)))
    );

    const signature369 = `0x369_${digitalRoot}_${deterministicHash(transformedCoordinates.join(',')).slice(2, 10)}`;
    const encodedChecksum = deterministicHash(
      `DERIVED_369:${signature369}:${digitalRoot}:${triadicVector.fluxRatio}:${coords.length}`
    );
    const stateId = `D369_${encodedChecksum.slice(2, 10)}`;

    return Object.freeze({
      stateId,
      canonicalState,
      dimensionalNode,
      triadicVector,
      vortexDoublingCircuit,
      digitalRoot,
      isHarmonicNode,
      signature369,
      transformedCoordinates,
      harmonicFlux: fluxRatio,
      encodedChecksum,
      timestamp: Date.now(),
    });
  }

  /**
   * Verifies mathematical reversibility of the transformation.
   */
  public verifyReversibility(
    originalCoords: readonly number[],
    transformedCoords: readonly number[]
  ): { readonly isReversible: boolean; readonly maxError: number } {
    let maxError = 0;
    const circuit = [1, 2, 4, 8, 7, 5];

    for (let i = 0; i < originalCoords.length; i++) {
      const orig = originalCoords[i];
      const factor = 1.0 + circuit[i % 6] / 100;
      const reconstructed = transformedCoords[i] / factor;
      const err = Math.abs(reconstructed - orig);
      if (err > maxError) maxError = err;
    }

    return {
      isReversible: maxError < 1e-4,
      maxError: Number(maxError.toFixed(8)),
    };
  }
}
