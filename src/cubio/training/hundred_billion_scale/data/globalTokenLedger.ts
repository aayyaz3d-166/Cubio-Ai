/**
 * CubiO — Step 86 Global Cryptographic Token Ledger
 * Records every single token processed across all nodes in an immutable hash chain (L_0 -> L_10B -> ... -> L_100B).
 */

import { GlobalTokenLedgerEntry, HundredBillionModalityStreamType } from '../types';
import { deterministicHash } from '../../../state/determinism';

export class GlobalTokenLedger {
  private readonly ledger: GlobalTokenLedgerEntry[] = [];
  private cumulativeTokens = 0;
  private currentHash: string;

  constructor(startingLedgerHash = 'GENESIS_100B_TOKEN_LEDGER_0x85A440D5501CE18', initialTokens = 0) {
    this.currentHash = startingLedgerHash;
    this.cumulativeTokens = initialTokens;
  }

  public recordBatch(
    globalStep: number,
    nodeRank: number,
    shardId: string,
    stream: HundredBillionModalityStreamType,
    batchTokens: number,
    batchBytes: number,
    shardChecksum: string,
    runId = 'CUBIO_100B_SCALE_RUN',
    checkpointId = 'C86_ACTIVE'
  ): GlobalTokenLedgerEntry {
    const entryIdx = this.ledger.length;
    this.cumulativeTokens += batchTokens;

    const prevHash = this.currentHash;
    const entryPayload = `${entryIdx}_${globalStep}_${nodeRank}_${shardId}_${stream}_${batchTokens}_${this.cumulativeTokens}_${shardChecksum}_${checkpointId}_${prevHash}`;
    this.currentHash = deterministicHash(entryPayload);

    const entry: GlobalTokenLedgerEntry = Object.freeze({
      ledgerEntryIndex: entryIdx,
      globalStep,
      nodeRank,
      shardId,
      stream,
      batchTokens,
      batchBytes,
      cumulativeGlobalTokens: this.cumulativeTokens,
      previousLedgerHash: prevHash,
      currentLedgerHash: this.currentHash,
      shardChecksum,
      timestamp: Date.now(),
      runId,
      checkpointId,
    });

    this.ledger.push(entry);
    return entry;
  }

  public getLedger(): readonly GlobalTokenLedgerEntry[] {
    return Object.freeze([...this.ledger]);
  }

  public getCumulativeTokens(): number {
    return this.cumulativeTokens;
  }

  public getCurrentHash(): string {
    return this.currentHash;
  }

  public verifyChainIntegrity(): boolean {
    if (this.ledger.length === 0) return true;
    for (let i = 0; i < this.ledger.length; i++) {
      const entry = this.ledger[i];
      const prevHash = i === 0 ? entry.previousLedgerHash : this.ledger[i - 1].currentLedgerHash;
      if (entry.previousLedgerHash !== prevHash) return false;

      const expectedPayload = `${entry.ledgerEntryIndex}_${entry.globalStep}_${entry.nodeRank}_${entry.shardId}_${entry.stream}_${entry.batchTokens}_${entry.cumulativeGlobalTokens}_${entry.shardChecksum}_${entry.checkpointId}_${prevHash}`;
      const expectedHash = deterministicHash(expectedPayload);
      if (entry.currentLedgerHash !== expectedHash) return false;
    }
    return true;
  }
}
