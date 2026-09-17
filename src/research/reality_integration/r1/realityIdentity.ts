/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R1: Reality Identity & Authoritative State Creator
 *
 * Establishes immutable ObservableRealityState anchored at canonical coordinates [5, 3, 6].
 */

import {
  RealityIdentity,
  ObservableRealityState,
  RealityCertaintyLevel,
} from './types';
import {
  generateDeterministicRealityId,
  generateDeterministicRealityStateId,
  computeRealityChecksum,
} from './determinism';

export class RealityIdentityEngine {
  public static readonly CANONICAL_COORDINATES: readonly [number, number, number] = Object.freeze([5, 3, 6] as const);
  public static readonly CANONICAL_DIMENSIONS: readonly [number, number, number] = Object.freeze([2, 2, 2] as const);
  public static readonly SCHEMA_VERSION = 'R1_SCHEMA_V1';

  public static createAuthoritativeRealityState(
    tag = 'CANONICAL',
    coordinates: readonly [number, number, number] = RealityIdentityEngine.CANONICAL_COORDINATES,
    dimensions: readonly [number, number, number] = RealityIdentityEngine.CANONICAL_DIMENSIONS,
    certainty: RealityCertaintyLevel = 'EXACT',
    predecessorStateId: string | null = null,
    sequence = 0
  ): ObservableRealityState {
    const realityId = generateDeterministicRealityId(tag, 0);
    const stateId = generateDeterministicRealityStateId(realityId, sequence);
    const lineageId = predecessorStateId ? `LIN_${predecessorStateId}_TO_${stateId}` : `LIN_ROOT_${realityId}`;

    const checksum = computeRealityChecksum(
      realityId,
      coordinates,
      dimensions,
      certainty,
      lineageId
    );

    const realityIdentity: RealityIdentity = Object.freeze({
      realityId,
      realityStateId: stateId,
      canonicalCoordinateReference: Object.freeze([...coordinates] as [number, number, number]),
      dimension: Object.freeze([...dimensions] as [number, number, number]),
      observableState: `OBS_REALITY_${tag}`,
      sourceLineage: lineageId,
      certainty,
      checksum,
      schemaVersion: RealityIdentityEngine.SCHEMA_VERSION,
    });

    return Object.freeze({
      stateId,
      realityIdentity,
      coordinates: Object.freeze([...coordinates] as [number, number, number]),
      dimensions: Object.freeze([...dimensions] as [number, number, number]),
      certainty,
      lineageId,
      checksum,
      timestamp: 0,
    });
  }
}
