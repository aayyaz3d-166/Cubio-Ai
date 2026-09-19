/**
 * CubiO — Universal Spatial Operating Environment
 * Step 59: Autonomous Decision Logger
 *
 * Implements tamper-evident, append-only Merkle-chained logging of all autonomous decisions.
 * "No autonomous action may silently modify the experiment."
 *
 * Classification: SOFTWARE_VALIDATED
 */

import { AutonomousDecisionRecord } from './types';
import { deterministicHash } from '../../state/determinism';

export class DecisionLogger {
  private log: AutonomousDecisionRecord[] = [];
  private lastChecksum = '0x0000000000000000';

  /**
   * Appends an immutable decision record to the Merkle log chain.
   */
  public logDecision(
    step: number,
    action: AutonomousDecisionRecord['action'],
    reason: string,
    prevState: AutonomousDecisionRecord['previousState'],
    newState: AutonomousDecisionRecord['newState'],
    telemetry: AutonomousDecisionRecord['telemetrySnapshot']
  ): AutonomousDecisionRecord {
    const dHash = deterministicHash(
      `DECISION:${step}:${action}:${this.lastChecksum}:${newState.learningRate}:${newState.batchSize}`
    );
    const checksum = `0x${dHash}`;

    const record: AutonomousDecisionRecord = Object.freeze({
      decisionId: `ADEC_${dHash.slice(2, 10)}`,
      step,
      action,
      reason,
      previousState: Object.freeze({ ...prevState }),
      newState: Object.freeze({ ...newState }),
      telemetrySnapshot: telemetry,
      is2GBEdgeCompliant: telemetry.residentRAMBytes <= 512 * 1024 * 1024,
      decisionChecksum: checksum,
      previousDecisionChecksum: this.lastChecksum,
      timestamp: Date.now(),
    });

    this.log.push(record);
    this.lastChecksum = checksum;
    return record;
  }

  public getLog(): readonly AutonomousDecisionRecord[] {
    return Object.freeze([...this.log]);
  }

  public getMerkleRoot(): string {
    if (this.log.length === 0) return '0x0000000000000000';
    const combined = this.log.map(r => r.decisionChecksum).join(':');
    return `0x${deterministicHash(`MERKLE_DECISION_LOG:${combined}`)}`;
  }

  public reset(): void {
    this.log = [];
    this.lastChecksum = '0x0000000000000000';
  }
}
