/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R8: Observable Reality 3D Interaction & Controlled Workspace Manipulation — Types
 *
 * Core Principles:
 * Reality -> State -> Observation -> Objects -> Spatial -> Workspace -> Visual -> Interaction -> UI/Selection/Transform/Undo/Redo
 *
 * Invariants:
 * 1. Reality coordinates remain authoritative ([5, 3, 6]).
 * 2. Workspace transformations are NOT Reality transformations.
 * 3. Delta Reality = 0 for all downstream interactions (Select, Move, Rotate, Scale, Undo, Redo, Camera).
 * 4. Transformations preserve explicit provenance and lineage.
 */

import {
  RealityObjectCertainty,
  RealityObjectOrigin,
} from '../r4/types';

export type InteractionState =
  | 'IDLE'
  | 'SELECTING'
  | 'TRANSFORMING_PREVIEW'
  | 'COMMITTED'
  | 'LOCKED'
  | 'CANCELLED';

export type SelectionMode = 'SINGLE' | 'MULTI' | 'ADDITIVE' | 'REPLACE';

export type InteractionOperationType =
  | 'SELECT'
  | 'DESELECT'
  | 'TRANSLATE_PREVIEW'
  | 'ROTATE_PREVIEW'
  | 'SCALE_PREVIEW'
  | 'COMMIT_TRANSFORM'
  | 'CANCEL_PREVIEW'
  | 'RESET_TRANSFORM'
  | 'UNDO'
  | 'REDO';

export type InteractionStaleState = 'SYNCED' | 'STALE' | 'RESYNCED' | 'INVALID';

export type WorkspaceTranslation = readonly [number, number, number];
export type WorkspaceRotation = readonly [number, number, number]; // in degrees [rx, ry, rz]
export type WorkspaceScale = readonly [number, number, number];       // [sx, sy, sz]

export interface WorkspaceTransform {
  readonly translation: WorkspaceTranslation;
  readonly rotation: WorkspaceRotation;
  readonly scale: WorkspaceScale;
  readonly transformChecksum: string;
}

export interface InteractionTarget {
  readonly visualObjectId: string;
  readonly workspaceObjectId: string;
  readonly realityObjectId: string;
  readonly realityStateId: string;
  readonly realityCoordinates: readonly [number, number, number]; // Authoritative [5, 3, 6]
  readonly workspaceTransform: WorkspaceTransform;
  readonly visualPosition: readonly [number, number, number];    // realityCoords + translation
  readonly certainty: RealityObjectCertainty;
  readonly origin: RealityObjectOrigin;
}

export interface InteractionSelection {
  readonly selectionId: string;
  readonly selectedObjectIds: readonly string[];
  readonly primarySelectedObjectId: string | null;
  readonly selectionMode: SelectionMode;
  readonly selectionChecksum: string;
}

export interface TransformPreview {
  readonly previewId: string;
  readonly targetObjectId: string;
  readonly initialTransform: WorkspaceTransform;
  readonly previewTransform: WorkspaceTransform;
  readonly previewVisualPosition: readonly [number, number, number];
  readonly isActive: boolean;
  readonly previewChecksum: string;
}

export interface InteractionProvenance {
  readonly actorId: string;
  readonly reason: string;
  readonly sourceDomain: 'WORKSPACE' | 'UI' | 'INTERACTION';
  readonly timestamp: number;
}

export interface TransformCommit {
  readonly commitId: string;
  readonly targetObjectId: string;
  readonly realityObjectId: string;
  readonly realityStateId: string;
  readonly originalRealityCoordinates: readonly [number, number, number];
  readonly previousTransform: WorkspaceTransform;
  readonly newTransform: WorkspaceTransform;
  readonly transformDelta: WorkspaceTransform;
  readonly visualPosition: readonly [number, number, number];
  readonly provenance: InteractionProvenance;
  readonly sequenceIndex: number;
  readonly commitChecksum: string;
}

export interface InteractionOperation {
  readonly operationId: string;
  readonly operationType: InteractionOperationType;
  readonly targetObjectIds: readonly string[];
  readonly delta?: WorkspaceTransform;
  readonly timestamp: number;
  readonly operationChecksum: string;
}

export interface InteractionHistoryEntry {
  readonly entryId: string;
  readonly operation: InteractionOperation;
  readonly parentEntryId: string | null;
  readonly stateBefore: Readonly<Record<string, WorkspaceTransform>>;
  readonly stateAfter: Readonly<Record<string, WorkspaceTransform>>;
  readonly selectionBefore: readonly string[];
  readonly selectionAfter: readonly string[];
  readonly provenance: InteractionProvenance;
  readonly entryChecksum: string;
}

export interface InteractionLineage {
  readonly lineageId: string;
  readonly realityStateId: string;
  readonly workspaceId: string;
  readonly visualObjectId: string;
  readonly sessionId: string;
  readonly operationId: string;
  readonly commitId?: string;
  readonly version: number;
}

export interface RealityInteractionSession {
  readonly sessionId: string;
  readonly realityStateId: string;
  readonly workspaceId: string;
  readonly sceneId: string;
  readonly state: InteractionState;
  readonly targets: Readonly<Record<string, InteractionTarget>>;
  readonly selection: InteractionSelection;
  readonly activePreview: TransformPreview | null;
  readonly history: readonly InteractionHistoryEntry[];
  readonly undoStack: readonly InteractionHistoryEntry[];
  readonly redoStack: readonly InteractionHistoryEntry[];
  readonly sessionChecksum: string;
}

export interface InteractionSnapshot {
  readonly snapshotId: string;
  readonly session: RealityInteractionSession;
  readonly realityChecksum: string;
  readonly workspaceChecksum: string;
  readonly interactionChecksum: string;
  readonly schemaVersion: string;
  readonly timestamp: number;
}

export interface InteractionDiff {
  readonly beforeSessionId: string;
  readonly afterSessionId: string;
  readonly selectionChange: 'CHANGED' | 'UNCHANGED';
  readonly transformChanges: Readonly<Record<string, 'CHANGED' | 'UNCHANGED'>>;
  readonly historyLengthChange: number;
  readonly isIdentical: boolean;
}

export type InteractionValidationStatus =
  | 'INTERACTION_VALID'
  | 'NON_FINITE_TRANSFORM'
  | 'INVALID_SCALE'
  | 'MALFORMED_ROTATION'
  | 'MISSING_REALITY_REFERENCE'
  | 'BROKEN_WORKSPACE_REFERENCE'
  | 'DUPLICATE_INTERACTION_ID'
  | 'DUPLICATE_OPERATION_ID'
  | 'BROKEN_LINEAGE'
  | 'INVALID_HISTORY_CHAIN'
  | 'ORPHAN_SELECTION'
  | 'UNAUTHORIZED_REALITY_MUTATION'
  | 'CHECKSUM_MISMATCH';

export interface InteractionValidationReport {
  readonly status: InteractionValidationStatus;
  readonly isValid: boolean;
  readonly issues: readonly string[];
  readonly reportChecksum: string;
}

export interface InteractionExecutionSignature {
  readonly realityChecksum: string;
  readonly workspaceChecksum: string;
  readonly interactionChecksum: string;
  readonly selectedCount: number;
  readonly historyCount: number;
  readonly syncStatus: InteractionStaleState;
  readonly executionHash: string;
}

export interface InteractionBindingState {
  readonly isBound: boolean;
  readonly realityStateChecksum: string;
  readonly lastSyncedRealityChecksum: string;
  readonly staleState: InteractionStaleState;
}
