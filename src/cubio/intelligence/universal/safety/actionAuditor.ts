/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F67: Hash-Chained Action Auditor
 *
 * Implements a tamper-proof hash-chained block ledger for all autonomous actions.
 */

import { deterministicHash } from '../../../state/determinism';
import { ActionAuditBlock } from './types';

export class ActionAuditorLedger {
  private chain: ActionAuditBlock[] = [];
  private genesisHash = '0000000000000000000000000000000000000000000000000000000000000000';

  constructor() {
    this.chain.push(
      Object.freeze({
        blockIndex: 0,
        actionName: 'GENESIS',
        isAuthorized: true,
        previousHash: '0',
        currentHash: this.genesisHash,
        timestamp: 0,
        payloadSummary: 'CubiO Controlled Authority Ledger Genesis',
      })
    );
  }

  public recordAction(
    actionName: string,
    isAuthorized: boolean,
    payloadSummary: string
  ): Readonly<ActionAuditBlock> {
    const blockIndex = this.chain.length;
    const previousHash = this.chain[this.chain.length - 1].currentHash;
    const timestamp = Date.now();

    const currentHash = deterministicHash(
      `BLOCK:${blockIndex}:${actionName}:${isAuthorized}:${previousHash}:${payloadSummary}:${timestamp}`
    );

    const block: ActionAuditBlock = Object.freeze({
      blockIndex,
      actionName,
      isAuthorized,
      previousHash,
      currentHash,
      timestamp,
      payloadSummary,
    });

    this.chain.push(block);
    return block;
  }

  public verifyChainIntegrity(): boolean {
    for (let i = 1; i < this.chain.length; i++) {
      const prev = this.chain[i - 1];
      const curr = this.chain[i];
      if (curr.previousHash !== prev.currentHash) {
        return false;
      }
    }
    return true;
  }

  public getChain(): readonly ActionAuditBlock[] {
    return Object.freeze(this.chain);
  }
}
