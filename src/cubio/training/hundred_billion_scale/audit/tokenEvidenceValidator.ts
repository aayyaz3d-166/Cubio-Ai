/**
 * CubiO — Step 86 Token Evidence Validator
 * Validates that claimedTokens == sum(actual processed batch tokens).
 */

import { GlobalTokenLedger } from '../data/globalTokenLedger';

export class TokenEvidenceValidator {
  public static validateTokenSum(claimedTokens: number, ledger: GlobalTokenLedger): boolean {
    const entries = ledger.getLedger();
    const computedSum = entries.reduce((acc, entry) => acc + entry.batchTokens, 0);
    return computedSum === claimedTokens && computedSum >= 100_000_000_000;
  }
}
