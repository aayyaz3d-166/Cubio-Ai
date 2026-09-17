/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R3: Determinism Engine (sigma^2 = 0)
 *
 * Deterministic cryptographic hashing and identifier generators.
 */

export function deterministicHash(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  const unsigned = hash >>> 0;
  return unsigned.toString(16).padStart(8, '0');
}

export function generateDeterministicObservationId(stateId: string, seq: number): string {
  const hash = deterministicHash(`OBS_${stateId}_seq_${seq}`);
  return `OBS_${hash}`;
}

export function generateDeterministicObservationLineageId(rootObsId: string, parentObsId: string | null, seq: number): string {
  const hash = deterministicHash(`OBSLIN_${rootObsId}_${parentObsId ?? 'ROOT'}_seq_${seq}`);
  return `OBSLIN_${hash}`;
}

export function generateDeterministicEventId(eventType: string, seq: number): string {
  const hash = deterministicHash(`EVT_R3_${eventType}_seq_${seq}`);
  return `EVT_R3_${hash}`;
}

export function generateDeterministicTimelineEntryId(stateId: string, seq: number): string {
  const hash = deterministicHash(`TL_ENTRY_${stateId}_seq_${seq}`);
  return `TLE_${hash}`;
}

export function generateDeterministicTemporalSnapshotId(stateId: string, seq: number): string {
  const hash = deterministicHash(`SNAP_R3_${stateId}_seq_${seq}`);
  return `SNAP_R3_${hash}`;
}

export function computeObservationChecksum(
  observationId: string,
  stateId: string,
  stateChecksum: string,
  coordinates: readonly [number, number, number] | undefined,
  dimensions: readonly [number, number, number] | undefined,
  certainty: string,
  origin: string,
  seq: number
): string {
  const raw = JSON.stringify([
    observationId,
    stateId,
    stateChecksum,
    coordinates ? [coordinates[0], coordinates[1], coordinates[2]] : null,
    dimensions ? [dimensions[0], dimensions[1], dimensions[2]] : null,
    certainty,
    origin,
    seq,
  ]);
  return `CS_OBS_${deterministicHash(raw)}`;
}

export function computeEventChecksum(
  eventId: string,
  eventType: string,
  sourceStateId: string,
  seq: number,
  rBefore: string,
  rAfter: string
): string {
  const raw = JSON.stringify([
    eventId,
    eventType,
    sourceStateId,
    seq,
    rBefore,
    rAfter,
  ]);
  return `CS_EVT_${deterministicHash(raw)}`;
}

export function computeTimelineChecksum(entries: readonly { entryId: string; entryChecksum: string }[]): string {
  const raw = JSON.stringify(entries.map((e) => [e.entryId, e.entryChecksum]));
  return `CS_TL_${deterministicHash(raw)}`;
}
