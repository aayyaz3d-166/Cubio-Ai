/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.12: User Workspace Collaboration & Sharing — Type Definitions
 *
 * Formal contracts for Space sharing, workspace members, access levels,
 * permission sets, shared workspace state, collaboration events, and snapshots.
 */

export type AccessLevel = 'OWNER' | 'EDITOR' | 'OBSERVER' | 'NO_ACCESS';

export interface PermissionSet {
  readonly canReadState: boolean;
  readonly canMutateState: boolean;
  readonly canCreateSnapshot: boolean;
  readonly canManageMembers: boolean;
  readonly canChangePermissions: boolean;
  readonly canRevokeAccess: boolean;
  readonly canResetState: boolean;
}

export interface WorkspaceMember {
  readonly memberId: string;
  readonly userId: string;
  readonly userName: string;
  readonly accessLevel: AccessLevel;
  readonly joinedAt: number;
  readonly permissions: PermissionSet;
  readonly lineageId: string;
}

export type ShareStatus = 'ACTIVE' | 'REVOKED';

export interface SpaceShare {
  readonly shareId: string;
  readonly spaceId: string;
  readonly ownerUserId: string;
  readonly shareIdentity: string;
  readonly status: ShareStatus;
  readonly createdAt: number;
  readonly updatedAt: number;
  readonly members: readonly WorkspaceMember[];
  readonly shareChecksum: string;
  readonly schemaVersion: '6.12.0';
}

export type CollaborationEventType =
  | 'SHARE_CREATED'
  | 'MEMBER_INVITED'
  | 'MEMBER_JOINED'
  | 'PERMISSION_CHANGED'
  | 'MEMBER_REMOVED'
  | 'SHARE_REVOKED'
  | 'STATE_MUTATED'
  | 'SNAPSHOT_CREATED'
  | 'STATE_RESET';

export interface CollaborationEvent {
  readonly eventId: string;
  readonly shareId: string;
  readonly spaceId: string;
  readonly actorUserId: string;
  readonly eventType: CollaborationEventType;
  readonly details: string;
  readonly timestamp: number;
  readonly targetMemberId?: string;
}

export interface SharedWorkspaceState {
  readonly shareId: string;
  readonly spaceId: string;
  readonly realityChecksum: string;
  readonly observers: readonly unknown[];
  readonly objects: readonly unknown[];
  readonly dimension: {
    readonly dimensionType: string;
    readonly activeDimensions: readonly number[];
  };
  readonly view: {
    readonly cameraPosition: readonly [number, number, number];
    readonly targetPosition: readonly [number, number, number];
    readonly zoom: number;
    readonly viewportMode: string;
  };
  readonly sharedAt: number;
  readonly sharedStateChecksum: string;
}

export interface CollaborationSnapshot {
  readonly snapshotId: string;
  readonly shareId: string;
  readonly spaceId: string;
  readonly label: string;
  readonly shareState: SpaceShare;
  readonly sharedWorkspaceState: SharedWorkspaceState;
  readonly checksum: string;
  readonly createdAt: number;
}

export interface CollaborationValidationReport {
  readonly isValid: boolean;
  readonly status:
    | 'COLLABORATION_VALID'
    | 'INVALID_OWNER'
    | 'INVALID_PERMISSIONS'
    | 'DUPLICATE_MEMBER_ID'
    | 'REVOKED_ACCESS'
    | 'UNAUTHORIZED_MUTATION'
    | 'CROSS_SPACE_LEAKAGE'
    | 'INVALID_SCHEMA_VERSION'
    | 'NON_FINITE_COORDINATES'
    | 'CORRUPTED_COLLABORATION_STATE';
  readonly issues: readonly string[];
  readonly reportChecksum: string;
}
