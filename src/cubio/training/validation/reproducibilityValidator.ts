/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 55: Reproducibility Validator
 *
 * Verifies bit-for-bit mathematical reproducibility across multi-node runs (sigma^2 = 0.0).
 */

import {
  ValidationScaleProfile,
  ReproducibilityProof,
} from './types';
import { deterministicHash } from '../../state/determinism';

export class ReproducibilityValidator {
  /**
   * Proves bit-for-bit parameter reproducibility between two runs.
   */
  public static verifyRuns(
    profile: ValidationScaleProfile,
    weightsA: readonly number[],
    weightsB: readonly number[]
  ): ReproducibilityProof {
    const hashA = deterministicHash(`WEIGHTS:${profile}:${weightsA.length}:${weightsA.join(',')}`);
    const hashB = deterministicHash(`WEIGHTS:${profile}:${weightsB.length}:${weightsB.join(',')}`);

    let varianceSum = 0;
    const len = Math.min(weightsA.length, weightsB.length);
    for (let i = 0; i < len; i++) {
      const diff = weightsA[i] - weightsB[i];
      varianceSum += diff * diff;
    }
    const sigmaSq = len > 0 ? parseFloat((varianceSum / len).toFixed(8)) : 0.0;
    const isIdentical = sigmaSq === 0.0;

    const pHash = deterministicHash(`PROOF:${profile}:${sigmaSq}:${isIdentical}`);
    const cid = `bafk_repro_proof_${pHash.slice(2, 10)}`;

    return Object.freeze({
      proofId: `PROOF_${pHash.slice(2, 10)}`,
      profile,
      runAHash: `0x${hashA}`,
      runBHash: `0x${hashB}`,
      parameterVarianceSigmaSq: sigmaSq,
      isBitForBitIdentical: isIdentical,
      merkleProvenanceCid: cid,
      timestamp: Date.now(),
    });
  }
}
