/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.1: User Workspace & Reality Construction — Type Definitions
 *
 * Provides formal types for user-controlled reality construction,
 * workspace state management, observer manipulation, observation bridge,
 * undo/redo history, snapshots, and export/import.
 *
 * Scientific boundary: This is a computational research model only.
 * No metaphysical or physical reality claims.
 */

import { SimulationDimension } from '../../observation_reconstruction/p52/types';
export type WorkspaceDimension = SimulationDimension;

export type WorkspaceProjectionType = 'PERSPECTIVE_3D' | 'ORTHOGRAPHIC_3D' | 'DIMENSIONAL_Z2' | 'DIMENSIONAL_Z1';

export type WorkspaceSourceMode = 'USER_CONSTRUCTED' | 'P5_CANONICAL_COPY' | 'IMPORTED';

export interface WorkspaceObject {
  readonly id: string;
  readonly label: string;
  readonly position: readonly [number, number, number];
  readonly category: string;
  readonly color: string;
  readonly radius: number;
  readonly isCanonicalCopy: boolean;
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly internalPayload?: string; // Optional non-geometric payload
}

export interface WorkspaceReality {
  readonly realityId: string;
  readonly realityChecksum: string;
  readonly objects: readonly WorkspaceObject[];
  readonly sourceMode: WorkspaceSourceMode;
  readonly timestamp: number;
}

export interface WorkspaceObserver {
  readonly observerId: string;
  readonly label: string;
  readonly position: readonly [number, number, number];
  readonly target: readonly [number, number, number];
  readonly up: readonly [number, number, number];
  readonly yaw: number;
  readonly pitch: number;
  readonly distance: number;
  readonly fov: number;
  readonly dimension: WorkspaceDimension;
  readonly projectionType: WorkspaceProjectionType;
  readonly viewportWidth: number;
  readonly viewportHeight: number;
  readonly observerChecksum: string;
}

export interface WorkspaceSelection {
  readonly selectedObjectId: string | null;
  readonly multiSelectedIds: readonly string[];
  readonly selectionTimestamp: number;
}

export interface WorkspaceStatus {
  readonly totalObjects: number;
  readonly selectedCount: number;
  readonly activeDimension: WorkspaceDimension;
  readonly realityChecksum: string;
  readonly observerChecksum: string;
  readonly workspaceChecksum: string;
  readonly isDirty: boolean;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
}

export type WorkspaceOperationType =
  | 'ADD_OBJECT'
  | 'REMOVE_OBJECT'
  | 'MOVE_OBJECT'
  | 'UPDATE_OBJECT'
  | 'DUPLICATE_OBJECT'
  | 'LOAD_CANONICAL'
  | 'SELECT_OBJECT'
  | 'DESELECT_ALL'
  | 'CHANGE_OBSERVER'
  | 'CHANGE_DIMENSION'
  | 'RESET_REALITY'
  | 'RESET_OBSERVER'
  | 'RESTORE_SNAPSHOT'
  | 'IMPORT_WORKSPACE';

export interface WorkspaceHistoryEntry {
  readonly step: number;
  readonly operation: WorkspaceOperationType;
  readonly description: string;
  readonly realitySnapshot: WorkspaceReality;
  readonly observerSnapshot: WorkspaceObserver;
  readonly selectionSnapshot: WorkspaceSelection;
  readonly timestamp: number;
}

export interface WorkspaceSnapshot {
  readonly snapshotId: string;
  readonly label: string;
  readonly reality: WorkspaceReality;
  readonly observer: WorkspaceObserver;
  readonly selection: WorkspaceSelection;
  readonly snapshotChecksum: string;
  readonly createdAt: number;
}

export interface WorkspaceExport {
  readonly schemaVersion: '6.1.0';
  readonly exportedAt: string;
  readonly workspaceChecksum: string;
  readonly reality: WorkspaceReality;
  readonly observer: WorkspaceObserver;
  readonly metadata: {
    readonly objectCount: number;
    readonly sourceMode: WorkspaceSourceMode;
    readonly dimension: WorkspaceDimension;
  };
}

export interface WorkspaceValidationReport {
  readonly isValid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
}
