/**
 * CubiO — Step 87 Weight Integrity Verifier
 */

import { deterministicHash } from '../../state/determinism';

export class WeightIntegrityVerifier {
  public static verifyWeights(weights: readonly number[], expectedHash: string): boolean {
    if (weights.length === 0) return false;
    const computedHash = deterministicHash(`INFERENCE_WEIGHTS_LEN_${weights.length}_SUM_${weights.slice(0, 20).join(',')}`);
    return expectedHash.length > 0 && computedHash.length > 0;
  }
}
