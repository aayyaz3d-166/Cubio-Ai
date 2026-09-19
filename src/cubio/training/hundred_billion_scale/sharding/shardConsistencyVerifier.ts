/**
 * CubiO — Step 86 Shard Consistency Verifier
 */

export class ShardConsistencyVerifier {
  public static verifyParameterConservation(
    originalWeights: readonly number[],
    gatheredWeights: readonly number[]
  ): boolean {
    if (originalWeights.length !== gatheredWeights.length) return false;
    for (let i = 0; i < originalWeights.length; i++) {
      if (Math.abs(originalWeights[i] - gatheredWeights[i]) > 1e-12) {
        return false;
      }
    }
    return true;
  }
}
