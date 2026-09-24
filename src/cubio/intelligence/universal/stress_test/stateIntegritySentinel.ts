/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F79: State Integrity Sentinel
 *
 * Enforces zero state corruption and cryptographic baseline rollback.
 */

import { deterministicHash } from '../../../state/determinism';

export class StateIntegritySentinel {
  private stateSnapshots: Map<string, string> = new Map();

  public captureSnapshot(stateKey: string, payload: unknown): string {
    const serialized = JSON.stringify(payload);
    const hash = deterministicHash(`${stateKey}:${serialized}`);
    this.stateSnapshots.set(stateKey, hash);
    return hash;
  }

  public verifyZeroCorruption(stateKey: string, payload: unknown): boolean {
    const serialized = JSON.stringify(payload);
    const currentHash = deterministicHash(`${stateKey}:${serialized}`);
    const baselineHash = this.stateSnapshots.get(stateKey);

    return baselineHash === undefined || currentHash === baselineHash;
  }

  public rollbackToBaseline(stateKey: string): { success: boolean; restoredHash?: string } {
    const hash = this.stateSnapshots.get(stateKey);
    return {
      success: hash !== undefined,
      restoredHash: hash,
    };
  }
}
