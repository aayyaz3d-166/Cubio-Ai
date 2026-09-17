/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.25-I: Live Integration & UI Activation — Types
 *
 * Formal contracts for:
 * 1. Live Studio User Workspace State
 * 2. Space, Experiment, Saved State & Recent View Entities
 * 3. Deterministic Workspace Events & Actions
 * 4. Multi-Tenant User Isolation & Causality Guarantees
 */

export type WorkspaceAccessRole = 'OWNER' | 'EDITOR' | 'OBSERVER' | 'NO_ACCESS';

export interface WorkspaceUserContext {
  readonly userId: string;
  readonly userRole: WorkspaceAccessRole;
  readonly workspaceId: string;
  readonly isAuthenticated: boolean;
}

export interface LiveSpaceState {
  readonly spaceId: string;
  readonly name: string;
  readonly ownerId: string;
  readonly lineageId: string;
  readonly checksum: string;
  readonly realityChecksum: string;
  readonly createdAt: number;
  readonly updatedAt: number;
  readonly isDeleted?: boolean;
  readonly isArchived?: boolean;
  readonly initialCoordinates: readonly [number, number, number];
  readonly currentCoordinates: readonly [number, number, number];
  readonly initialDimensions: readonly [number, number, number];
  readonly currentDimensions: readonly [number, number, number];
  readonly initialObserver: string;
  readonly currentObserver: string;
  readonly objectIds: readonly string[];
  readonly cameraPosition?: readonly [number, number, number];
  readonly cameraTarget?: readonly [number, number, number];
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface LiveExperimentState {
  readonly experimentId: string;
  readonly spaceId: string;
  readonly name: string;
  readonly ownerId: string;
  readonly lineageId: string;
  readonly checksum: string;
  readonly createdAt: number;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface LiveSavedState {
  readonly stateId: string;
  readonly spaceId: string;
  readonly name: string;
  readonly ownerId: string;
  readonly stateChecksum: string;
  readonly spaceChecksum: string;
  readonly realityChecksum: string;
  readonly snapshotData: Readonly<{
    coordinates: readonly [number, number, number];
    dimensions: readonly [number, number, number];
    observer: string;
    objectIds: readonly string[];
    cameraPosition?: readonly [number, number, number];
    cameraTarget?: readonly [number, number, number];
  }>;
  readonly savedAt: number;
}

export interface LiveRecentView {
  readonly viewId: string;
  readonly spaceId: string;
  readonly spaceName: string;
  readonly ownerId: string;
  readonly viewedAt: number;
  readonly cameraPosition?: readonly [number, number, number];
  readonly cameraTarget?: readonly [number, number, number];
}

export interface LiveWorkspaceState {
  readonly workspaceId: string;
  readonly activeSpaceId: string | null;
  readonly spaces: readonly LiveSpaceState[];
  readonly experiments: readonly LiveExperimentState[];
  readonly savedStates: readonly LiveSavedState[];
  readonly recentViews: readonly LiveRecentView[];
  readonly selectedObjectId: string | null;
  readonly isDirty: boolean;
  readonly currentChecksum: string;
}

export type WorkspaceIntegrationEventType =
  | 'SPACE_CREATED'
  | 'SPACE_OPENED'
  | 'SPACE_SWITCHED'
  | 'SPACE_RENAMED'
  | 'SPACE_DELETED'
  | 'STATE_CHANGED'
  | 'STATE_SAVED'
  | 'STATE_RESET'
  | 'EXPERIMENT_OPENED'
  | 'SAVED_STATE_OPENED'
  | 'RECENT_VIEW_RECORDED'
  | 'WORKSPACE_CLOSED';

export interface WorkspaceIntegrationEvent {
  readonly eventId: string;
  readonly eventType: WorkspaceIntegrationEventType;
  readonly spaceId?: string;
  readonly actorId: string;
  readonly sequence: number;
  readonly timestamp: number;
  readonly details: string;
  readonly checksum: string;
}

export interface WorkspaceIntegrationValidationReport {
  readonly isValid: boolean;
  readonly issues: readonly string[];
  readonly reportChecksum: string;
}

export interface WorkspaceActivationReport {
  readonly activationId: string;
  readonly workspaceId: string;
  readonly userRole: WorkspaceAccessRole;
  readonly totalSpaces: number;
  readonly totalExperiments: number;
  readonly totalSavedStates: number;
  readonly totalRecentViews: number;
  readonly activeSpaceId: string | null;
  readonly isLiveActivated: boolean;
  readonly realityInvariant: boolean;
  readonly activationChecksum: string;
}

export interface WorkspaceCausalityEvent {
  readonly eventId: string;
  readonly eventType:
    | 'SPACE_NAVIGATED'
    | 'CAMERA_MOVED'
    | 'OBJECT_SELECTED'
    | 'STATE_SAVED'
    | 'STATE_RESET'
    | 'SPACE_SWITCHED';
  readonly realityChecksumBefore: string;
  readonly realityChecksumAfter: string;
  readonly modelChecksumBefore: string;
  readonly modelChecksumAfter: string;
  readonly geometryChecksumBefore: string;
  readonly geometryChecksumAfter: string;
  readonly isRealityInvariant: boolean;
  readonly isModelInvariant: boolean;
  readonly isGeometryInvariant: boolean;
}
