/**
 * CubiO — Step 86 Recovery Integrity Verifier
 */

import { NodeFailureRecoveryResult } from '../types';

export class RecoveryIntegrityVerifier {
  public static verifyRecoveryIntegrity(result: NodeFailureRecoveryResult): boolean {
    return result.stateLosslessProof && result.reassignedShardsCount >= 0 && result.resumedGlobalStep >= 0;
  }
}
