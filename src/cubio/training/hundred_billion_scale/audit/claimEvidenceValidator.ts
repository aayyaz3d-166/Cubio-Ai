/**
 * CubiO — Step 86 Claim Evidence Validator
 */

import { GlobalTokenLedger } from '../data/globalTokenLedger';
import { GlobalCheckpointChain } from '../checkpoint/globalCheckpointChain';

export class ClaimEvidenceValidator {
  public static validateAllClaims(ledger: GlobalTokenLedger, chain: GlobalCheckpointChain): boolean {
    return ledger.verifyChainIntegrity() && chain.verifyChainIntegrity() && ledger.getCumulativeTokens() >= 100_000_000_000;
  }
}
