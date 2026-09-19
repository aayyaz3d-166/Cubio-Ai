/**
 * CubiO — Step 86 Incremental Checkpoint Manager
 */

export class IncrementalCheckpointManager {
  private lastSnapshotWeights: number[] = [];

  public computeWeightDelta(currentWeights: readonly number[]): readonly number[] {
    if (this.lastSnapshotWeights.length === 0) {
      this.lastSnapshotWeights = [...currentWeights];
      return currentWeights;
    }

    const deltas: number[] = [];
    for (let i = 0; i < currentWeights.length; i++) {
      deltas.push(currentWeights[i] - (this.lastSnapshotWeights[i] || 0));
    }
    this.lastSnapshotWeights = [...currentWeights];
    return Object.freeze(deltas);
  }
}
