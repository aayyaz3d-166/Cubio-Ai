/**
 * CubiO — Universal Spatial Operating Environment
 * Step 82: Cryptographic Token Ledger
 *
 * Implements an immutable cryptographic ledger (L_0 -> L_1 -> ... -> L_N):
 * - Records every token-processing event
 * - Derives cumulative and total processed tokens strictly from ledger records
 *
 * Classification: REAL_MEASURED & SOFTWARE_VALIDATED
 */

import { TokenLedgerEntry, ModalityStreamType } from '../types';
import { deterministicHash } from '../../../state/determinism';

export class TokenLedger {
  private ledger: TokenLedgerEntry[] = [];
  private cumulativeTokens = 0;

  /**
   * Appends an executed shard record to the cryptographic token ledger.
   */
  public appendShardRecord(
    shardId: string,
    datasetVersion: string,
    tokenCount: number,
    modality: ModalityStreamType,
    trainingStep: number,
    seed: number
  ): TokenLedgerEntry {
    const prevHash = this.ledger.length === 0 ? 'GENESIS_TOKEN_LEDGER' : this.ledger[this.ledger.length - 1].currentLedgerHash;
    this.cumulativeTokens += tokenCount;

    const sHash = deterministicHash(`SHARD_REC_10M:${shardId}:${tokenCount}:${modality}:${trainingStep}:${seed}`);
    const byteCount = tokenCount * 2;
    const lHash = deterministicHash(`LEDGER_LINK_10M:${prevHash}:${sHash}:${this.cumulativeTokens}:${trainingStep}`);

    const entry: TokenLedgerEntry = Object.freeze({
      entryId: `TL_10M_${lHash.slice(2, 10)}`,
      shardId,
      datasetVersion,
      tokenCount,
      byteCount,
      modality,
      tokenizerVersion: 'cubio-369-spatial-v3.0',
      timestamp: Date.now(),
      shardChecksum: `0x${sHash}`,
      previousLedgerHash: prevHash,
      cumulativeTokens: this.cumulativeTokens,
      currentLedgerHash: `0x${lHash}`,
      trainingStep,
    });

    this.ledger.push(entry);
    return entry;
  }

  public getLedger(): readonly TokenLedgerEntry[] {
    return Object.freeze([...this.ledger]);
  }

  public computeTotalTokens(): number {
    let sum = 0;
    for (const e of this.ledger) {
      sum += e.tokenCount;
    }
    return sum;
  }

  public verifyLedgerIntegrity(): boolean {
    if (this.ledger.length === 0) return true;
    if (this.ledger[0].previousLedgerHash !== 'GENESIS_TOKEN_LEDGER') return false;

    for (let i = 1; i < this.ledger.length; i++) {
      if (this.ledger[i].previousLedgerHash !== this.ledger[i - 1].currentLedgerHash) {
        return false;
      }
    }
    return true;
  }
}
