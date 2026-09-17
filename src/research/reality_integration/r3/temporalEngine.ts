/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R3: Temporal Engine
 *
 * Implements deterministic temporal sequencing and relative relationship resolution.
 */

import {
  RealityTimeline,
  RealityTimelineEntry,
  TemporalRelationship,
} from './types';
import {
  generateDeterministicTimelineEntryId,
  computeTimelineChecksum,
  deterministicHash,
} from './determinism';

export class TemporalEngine {
  private entries: RealityTimelineEntry[] = [];
  private timelineId: string;

  constructor(timelineTag = 'CANONICAL_TIMELINE') {
    this.timelineId = `TL_${deterministicHash(timelineTag)}`;
  }

  public recordTimelinePoint(
    realityStateId: string,
    observationIds: readonly string[] = [],
    eventIds: readonly string[] = [],
    timestamp?: number
  ): RealityTimelineEntry {
    const seq = this.entries.length;
    const entryId = generateDeterministicTimelineEntryId(realityStateId, seq);

    const raw = JSON.stringify([
      entryId,
      seq,
      realityStateId,
      observationIds,
      eventIds,
      timestamp ?? null,
    ]);
    const entryChecksum = `CS_TLE_${deterministicHash(raw)}`;

    const entry: RealityTimelineEntry = Object.freeze({
      entryId,
      sequenceIndex: seq,
      realityStateId,
      observationIds: Object.freeze([...observationIds]),
      eventIds: Object.freeze([...eventIds]),
      timestamp,
      entryChecksum,
    });

    this.entries.push(entry);
    return entry;
  }

  public getTimeline(): RealityTimeline {
    const timelineChecksum = computeTimelineChecksum(this.entries);
    return Object.freeze({
      timelineId: this.timelineId,
      entries: Object.freeze([...this.entries]),
      totalEntries: this.entries.length,
      currentSequenceIndex: this.entries.length > 0 ? this.entries.length - 1 : 0,
      timelineChecksum,
    });
  }

  public static compareTemporalPositions(
    seqA: number | undefined,
    seqB: number | undefined
  ): TemporalRelationship {
    if (seqA === undefined || seqB === undefined) {
      return 'UNKNOWN';
    }
    if (seqA < seqB) return 'BEFORE';
    if (seqA === seqB) return 'AT';
    return 'AFTER';
  }
}
