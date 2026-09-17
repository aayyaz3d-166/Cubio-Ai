/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F19: CubiO Intelligence User Context Engine (Types & Contracts)
 *
 * Master specification for sovereign persona isolation, session-scoped conversations,
 * user-partitioned spatial states/memories, and zero cross-user data leakage enforcement.
 */

import { CubiODimension, CubiOHarmonic369 } from '../../types';

export type UserAccessRole = 'OWNER' | 'COLLABORATOR' | 'READONLY' | 'ANONYMOUS';

export type ContextResourceType = 'CONVERSATION' | 'STATE' | 'MEMORY' | 'PROFILE';

export interface UserPersona {
  readonly userId: string;
  readonly sovereignCubId: string;
  readonly displayName: string;
  readonly preferredDimension: CubiODimension;
  readonly harmonicSignature: Partial<CubiOHarmonic369>;
  readonly accessRole: UserAccessRole;
  readonly customMetadata?: Readonly<Record<string, any>>;
  readonly createdAt: number;
}

export interface UserSessionContext {
  readonly sessionId: string;
  readonly userId: string;
  readonly sovereignCubId: string;
  readonly activeDimension: CubiODimension;
  readonly sessionToken: string;
  readonly activeConversationIds: readonly string[];
  readonly userStateIds: readonly string[];
  readonly userMemoryIds: readonly string[];
  readonly startedAt: number;
  readonly lastActiveAt: number;
  readonly sessionChecksum: string;
}

export interface UserContextQuery {
  readonly requestingUserId: string;
  readonly sovereignCubId?: string;
  readonly targetUserId?: string;
  readonly resourceType: ContextResourceType;
  readonly resourceId?: string;
}

export interface ContextAccessResult {
  readonly allowed: boolean;
  readonly requestingUserId: string;
  readonly resourceType: ContextResourceType;
  readonly resourceId?: string;
  readonly payload?: any;
  readonly violationDetected: boolean;
  readonly reason?: string;
  readonly accessChecksum: string;
}

export interface UserContextReport {
  readonly contextId: string;
  readonly userId: string;
  readonly sovereignCubId: string;
  readonly totalConversations: number;
  readonly totalStates: number;
  readonly totalMemories: number;
  readonly activeSessionsCount: number;
  readonly isolationIntegrityVerified: boolean;
  readonly contextChecksum: string;
}
