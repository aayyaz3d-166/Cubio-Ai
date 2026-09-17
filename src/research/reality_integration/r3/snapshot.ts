/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R3: Temporal Snapshot Engine
 *
 * Captures deeply frozen immutable snapshots of Reality State, Observations, Events, and Timeline.
 */

import {
  RealityObservationRecord,
  RealityEvent,
  RealityTimeline,
  RealityTemporalSnapshot,
} from './types';
import {
  generateDeterministicTemporalSnapshotId,
  deterministicHash,
} from './determinism';

export class RealityTemporalSnapshotEngine {
  public static readonly SCHEMA_VERSION = 'R3_SNAPSHOT_V1';

  public static createSnapshot(
    realityStateId: string,
    realityStateChecksum: string,
    observations: readonly RealityObservationRecord[],
    events: readonly RealityEvent[],
    timeline: RealityTimeline,
    sequenceIndex = 0
  ): RealityTemporalSnapshot {
    const snapshotId = generateDeterministicTemporalSnapshotId(realityStateId, sequenceIndex);
    const raw = JSON.stringify([
      snapshotId,
      realityStateId,
      realityStateChecksum,
      observations.map((o) => o.observationChecksum),
      events.map((e) => e.eventChecksum),
      timeline.timelineChecksum,
      RealityTemporalSnapshotEngine.SCHEMA_VERSION,
    ]);
    const snapshotChecksum = `CS_SNAP_R3_${deterministicHash(raw)}`;

    return Object.freeze({
      snapshotId,
      realityStateId,
      realityStateChecksum,
      observations: Object.freeze([...observations.map((o) => Object.freeze({ ...o }))]),
      events: Object.freeze([...events.map((e) => Object.freeze({ ...e }))]),
      timeline: Object.freeze({
        ...timeline,
        entries: Object.freeze([...timeline.entries.map((ent) => Object.freeze({ ...ent }))]),
      }),
      snapshotChecksum,
      schemaVersion: RealityTemporalSnapshotEngine.SCHEMA_VERSION,
      sequenceIndex,
    });
  }
}
