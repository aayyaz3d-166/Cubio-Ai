/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R7: Reality Inspector Engine
 *
 * Provides structured read-only inspection for selected visual objects.
 * Invariant: Inspector operations NEVER mutate Reality (Delta Reality = 0).
 */

import { R7VisualObject, R7LiveSyncStatus, R7RealityInspectorState } from './types';

export interface R7InspectionSummary {
  readonly realityObjectId: string;
  readonly realityStateId: string;
  readonly workspaceObjectId: string;
  readonly visualObjectId: string;
  readonly name: string;
  readonly coordinates: readonly [number, number, number];
  readonly dimensions?: readonly [number, number, number];
  readonly certainty: string;
  readonly origin: string;
  readonly evidence: string;
  readonly checksum: string;
  readonly syncStatus: R7LiveSyncStatus;
}

export class RealityInspectorEngine {
  public static createInspectorState(
    selectedVisualObject: R7VisualObject | null = null,
    syncStatus: R7LiveSyncStatus = 'SYNCED',
    isOpen = true
  ): R7RealityInspectorState {
    return Object.freeze({
      isOpen,
      selectedVisualObject,
      syncStatus,
    });
  }

  public static formatSummary(
    visualObj: R7VisualObject,
    syncStatus: R7LiveSyncStatus = 'SYNCED'
  ): R7InspectionSummary {
    return Object.freeze({
      realityObjectId: visualObj.identity.realityObjectId,
      realityStateId: visualObj.identity.realityStateId,
      workspaceObjectId: visualObj.identity.workspaceObjectId,
      visualObjectId: visualObj.identity.visualObjectId,
      name: visualObj.name,
      coordinates: visualObj.transform.coordinates,
      dimensions: visualObj.transform.dimensions,
      certainty: visualObj.certainty,
      origin: visualObj.origin,
      evidence: visualObj.evidence,
      checksum: visualObj.visualChecksum,
      syncStatus,
    });
  }
}
