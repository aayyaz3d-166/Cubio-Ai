/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R2: Reality State Builder & Immutable Entity Factory
 *
 * Anchored to the canonical coordinate contract [5, 3, 6].
 */

import {
  RealityState,
  RealityStateLineage,
  RealityStateCertainty,
  RealityStateOrigin,
  RealityTransitionType,
} from './types';
import {
  generateDeterministicStateId,
  generateDeterministicLineageId,
  computeRealityStateChecksum,
} from './determinism';

export class RealityStateFactory {
  public static readonly CANONICAL_COORDINATES: readonly [number, number, number] = Object.freeze([5, 3, 6] as const);
  public static readonly CANONICAL_DIMENSIONS: readonly [number, number, number] = Object.freeze([2, 2, 2] as const);
  public static readonly SCHEMA_VERSION = 'R2_SCHEMA_V1';

  public static createInitialState(
    tag = 'CANONICAL_ROOT',
    coordinates: readonly [number, number, number] = RealityStateFactory.CANONICAL_COORDINATES,
    dimensions: readonly [number, number, number] = RealityStateFactory.CANONICAL_DIMENSIONS,
    certainty: RealityStateCertainty = 'EXACT',
    origin: RealityStateOrigin = 'OBSERVED',
    metadata?: Readonly<Record<string, unknown>>
  ): RealityState {
    const version = 1;
    const stateId = generateDeterministicStateId(tag, version, 0);
    const lineageId = generateDeterministicLineageId(stateId, null, version);

    const lineage: RealityStateLineage = Object.freeze({
      lineageId,
      rootStateId: stateId,
      parentStateId: null,
      transitionId: 'TRN_INITIALIZE',
      transitionType: 'INITIALIZE',
      depth: 0,
    });

    const checksum = computeRealityStateChecksum(
      stateId,
      version,
      coordinates,
      dimensions,
      certainty,
      origin,
      lineageId
    );

    return Object.freeze({
      stateId,
      version,
      coordinates: Object.freeze([...coordinates] as [number, number, number]),
      dimensions: Object.freeze([...dimensions] as [number, number, number]),
      certainty,
      origin,
      lineage,
      checksum,
      schemaVersion: RealityStateFactory.SCHEMA_VERSION,
      timestamp: 0,
      metadata: metadata ? Object.freeze({ ...metadata }) : undefined,
    });
  }

  public static createDerivedState(
    parent: RealityState,
    coordinates: readonly [number, number, number],
    dimensions: readonly [number, number, number],
    transitionId: string,
    transitionType: RealityTransitionType,
    certainty: RealityStateCertainty = parent.certainty,
    origin: RealityStateOrigin = parent.origin,
    branchName?: string,
    metadata?: Readonly<Record<string, unknown>>
  ): RealityState {
    const version = parent.version + 1;
    const tag = branchName ? `BRANCH_${branchName}` : `v${version}`;
    const stateId = generateDeterministicStateId(tag, version, parent.lineage.depth + 1);
    const lineageId = generateDeterministicLineageId(parent.lineage.rootStateId, parent.stateId, version);

    const lineage: RealityStateLineage = Object.freeze({
      lineageId,
      rootStateId: parent.lineage.rootStateId,
      parentStateId: parent.stateId,
      transitionId,
      transitionType,
      branchName,
      depth: parent.lineage.depth + 1,
    });

    const checksum = computeRealityStateChecksum(
      stateId,
      version,
      coordinates,
      dimensions,
      certainty,
      origin,
      lineageId
    );

    return Object.freeze({
      stateId,
      version,
      coordinates: Object.freeze([...coordinates] as [number, number, number]),
      dimensions: Object.freeze([...dimensions] as [number, number, number]),
      certainty,
      origin,
      lineage,
      checksum,
      schemaVersion: RealityStateFactory.SCHEMA_VERSION,
      timestamp: 0,
      metadata: metadata ? Object.freeze({ ...metadata }) : undefined,
    });
  }
}
