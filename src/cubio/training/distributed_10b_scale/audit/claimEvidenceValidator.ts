/**
 * CubiO — Step 85 Claim Evidence Validator
 * Validates that every metric claim is supported by cryptographic proof in the ledger and checkpoint chain.
 */

import { GlobalTokenLedger } from '../data/tokenLedger';
import { GlobalCheckpointChain } from '../checkpoint/globalCheckpointChain';

export class ClaimEvidenceValidator {
  public static validateTokenClaim(claimedTokens: number, ledger: GlobalTokenLedger): boolean {
    const actual = ledger.getCumulativeTokens();
    const isChainValid = ledger.verifyChainIntegrity();
    return actual >= claimedTokens && isChainValid;
  }

  public static validateCheckpointClaim(chain: GlobalCheckpointChain): boolean {
    return chain.verifyChainIntegrity() && chain.getCheckpoints().length > 0;
  }
}
