/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.20: Immutable Recovery Checkpoint Manager
 *
 * Captures, seals, and indexes recovery checkpoints containing authoritative
 * Space, Reality, Model, Geometry, Observer, Dimension, View, and Version states.
 */

import {
  RecoveryCheckpoint,
  RecoveryState,
} from './types';
import {
  generateDeterministicCheckpointId,
  deterministicHash,
} from './determinism';

export class CheckpointManager {
  public static createCheckpoint(
    state: RecoveryState,
    observerState: Readonly<Record<string, unknown>> = {},
    dimensionState: Readonly<Record<string, unknown>> = {},
    viewState: Readonly<Record<string, unknown>> = {}
  ): RecoveryCheckpoint {
    const spaceId = state.space?.spaceId ?? 'SPACE_UNKNOWN';
    const workspaceId = state.space?.workspaceId ?? 'WS_UNKNOWN';
    const realityChecksum = state.realityState?.realityChecksum ?? 'CS_REALITY_MISSING';
    const versionRef = state.version?.versionId ?? 'VER_MISSING';

    const checkpointId = generateDeterministicCheckpointId(
      spaceId,
      realityChecksum,
      versionRef
    );

    const modelChecksums = (state.models ?? []).map((m) => m.modelChecksum).sort();
    const modelChecksum = deterministicHash(JSON.stringify(modelChecksums));

    const geoChecksums = (state.geometries ?? []).map((g) => g.geometryChecksum).sort();
    const geometryChecksum = deterministicHash(JSON.stringify(geoChecksums));

    const canonicalCoordinates = state.realityState?.canonicalCoordinates ?? [0, 0, 0];
    const certainty = state.realityState?.certainty ?? 'UNKNOWN';

    const raw = JSON.stringify([
      '6.20.0',
      checkpointId,
      spaceId,
      workspaceId,
      realityChecksum,
      modelChecksum,
      geometryChecksum,
      observerState,
      dimensionState,
      viewState,
      state.savedState?.stateId ?? 'ST_MISSING',
      versionRef,
      canonicalCoordinates,
      certainty,
      state.stateChecksum ?? 'CS_MISSING',
    ]);

    const checkpointChecksum = deterministicHash(raw);

    return Object.freeze({
      checkpointId,
      schemaVersion: '6.20.0',
      spaceId,
      workspaceId,
      realityChecksum,
      modelChecksum,
      geometryChecksum,
      observerState: Object.freeze({ ...observerState }),
      dimensionState: Object.freeze({ ...dimensionState }),
      viewState: Object.freeze({ ...viewState }),
      savedStateRef: state.savedState?.stateId ?? 'ST_MISSING',
      versionRef,
      timelineRef: state.timeline?.timelineId,
      collaborationRef: state.collaboration?.collaborationId,
      canonicalCoordinates: Object.freeze([...canonicalCoordinates]) as [number, number, number],
      certainty,
      capturedState: Object.freeze({ ...state }),
      isImmutable: true,
      checkpointChecksum,
    });
  }
}
