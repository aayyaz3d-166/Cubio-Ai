/**
 * CubiO — Universal Spatial Operating Environment
 * Step 66: Distributed Checkpoint Manager
 *
 * Coordinates Content-Addressed Storage (CAS) checkpoint persistence
 * and maintains the lineage history of validated checkpoint commits.
 *
 * Classification: SOFTWARE_VALIDATED
 */

import { HolisticCheckpointRecord } from '../types';
import { CubiOMemoryStore } from '../../../memory/memoryStorage';

export class DistributedCheckpointManager {
  private casStore: CubiOMemoryStore;
  private checkpointHistory: Map<string, HolisticCheckpointRecord> = new Map();
  private stepToCheckpointId: Map<number, string> = new Map();
  private latestCheckpointId?: string;

  constructor(casStore?: CubiOMemoryStore) {
    this.casStore = casStore ?? new CubiOMemoryStore();
  }

  /**
   * Commits a holistic checkpoint record into CAS.
   */
  public commitCheckpoint(record: HolisticCheckpointRecord): string {
    const putRes = this.casStore.put(record);
    this.checkpointHistory.set(record.checkpointId, record);
    this.stepToCheckpointId.set(record.stepIndex, record.checkpointId);
    this.latestCheckpointId = record.checkpointId;

    return putRes.cid;
  }

  /**
   * Retrieves a checkpoint record by its ID.
   */
  public getCheckpoint(checkpointId: string): HolisticCheckpointRecord | undefined {
    return this.checkpointHistory.get(checkpointId);
  }

  /**
   * Retrieves the latest committed valid checkpoint.
   */
  public getLatestCheckpoint(): HolisticCheckpointRecord | undefined {
    if (!this.latestCheckpointId) return undefined;
    return this.checkpointHistory.get(this.latestCheckpointId);
  }

  /**
   * Retrieves a checkpoint saved at an exact step index.
   */
  public getCheckpointAtStep(step: number): HolisticCheckpointRecord | undefined {
    const id = this.stepToCheckpointId.get(step);
    return id ? this.checkpointHistory.get(id) : undefined;
  }

  public getAllCheckpoints(): readonly HolisticCheckpointRecord[] {
    return Object.freeze(Array.from(this.checkpointHistory.values()));
  }

  public getTotalCheckpoints(): number {
    return this.checkpointHistory.size;
  }

  public clear(): void {
    this.checkpointHistory.clear();
    this.stepToCheckpointId.clear();
    this.latestCheckpointId = undefined;
  }
}
