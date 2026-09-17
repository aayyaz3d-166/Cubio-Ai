/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.1: Workspace Snapshot Engine
 *
 * Captures, restores, and compares discrete workspace snapshots.
 */

import {
  WorkspaceReality,
  WorkspaceObserver,
  WorkspaceSelection,
  WorkspaceSnapshot,
} from './types';
import { simpleHash } from './realityBuilder';

export function computeSnapshotChecksum(
  reality: WorkspaceReality,
  observer: WorkspaceObserver,
  selection: WorkspaceSelection
): string {
  const payload = {
    realityChecksum: reality.realityChecksum,
    observerChecksum: observer.observerChecksum,
    selectedId: selection.selectedObjectId,
  };
  return simpleHash(JSON.stringify(payload));
}

export function createWorkspaceSnapshot(
  label: string,
  reality: WorkspaceReality,
  observer: WorkspaceObserver,
  selection: WorkspaceSelection
): WorkspaceSnapshot {
  const checksum = computeSnapshotChecksum(reality, observer, selection);
  return Object.freeze({
    snapshotId: `SNAP_${simpleHash(label + Date.now().toString())}`,
    label,
    reality,
    observer,
    selection,
    snapshotChecksum: checksum,
    createdAt: Date.now(),
  });
}

export function compareSnapshots(
  snapA: WorkspaceSnapshot,
  snapB: WorkspaceSnapshot
): { isIdentical: boolean; realityChanged: boolean; observerChanged: boolean } {
  const realityChanged = snapA.reality.realityChecksum !== snapB.reality.realityChecksum;
  const observerChanged = snapA.observer.observerChecksum !== snapB.observer.observerChecksum;
  const isIdentical = snapA.snapshotChecksum === snapB.snapshotChecksum;

  return {
    isIdentical,
    realityChanged,
    observerChanged,
  };
}
