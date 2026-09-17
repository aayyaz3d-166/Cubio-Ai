/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel F10: Reality AI — Natural Language Spatial Intelligence Layer
 *
 * Types & Interfaces
 *
 * Invariants:
 * 1. Reality coordinates remain authoritative ([5,3,6]).
 * 2. ΔReality = 0 for every AI operation.
 * 3. AI operates in WORKSPACE / AI_COMMAND domain, NEVER in OBSERVED_REALITY domain.
 * 4. User constructed / AI generated geometry is USER_CONSTRUCTED or DERIVED, NEVER OBSERVED.
 */

import {
  WorkspaceGeometry,
  GeometryPrimitiveType,
  BooleanOperationType,
  MeasurementType,
  GeometryTransform,
  GeometryOrigin,
  GeometryCertainty,
} from '../r9/types';

// ─── Epistemic Domains ───
export type EpistemicDomain =
  | 'OBSERVED_REALITY'
  | 'WORKSPACE'
  | 'DERIVED_GEOMETRY'
  | 'AI_COMMAND'
  | 'CONVERSATION';

// ─── Intent Categories ───
export type AIIntentType =
  | 'CREATE'
  | 'SELECT'
  | 'DESELECT'
  | 'MOVE'
  | 'ROTATE'
  | 'SCALE'
  | 'DELETE'
  | 'DUPLICATE'
  | 'HIDE'
  | 'SHOW'
  | 'RESET'
  | 'UNDO'
  | 'REDO'
  | 'MEASURE'
  | 'BOOLEAN'
  | 'EXTRUDE'
  | 'INSET'
  | 'BEVEL'
  | 'CHAMFER'
  | 'FILLET'
  | 'SUBDIVIDE'
  | 'MIRROR'
  | 'ARRAY'
  | 'INSPECT'
  | 'QUERY'
  | 'HELP'
  | 'UNKNOWN';

// ─── Spatial Relations ───
export type SpatialRelationType =
  | 'ABOVE'
  | 'BELOW'
  | 'LEFT_OF'
  | 'RIGHT_OF'
  | 'IN_FRONT_OF'
  | 'BEHIND'
  | 'BESIDE'
  | 'NEAR'
  | 'INSIDE'
  | 'CENTERED_ON'
  | 'ALIGNED_WITH';

export type SpatialAxis = 'X' | 'Y' | 'Z' | 'XY' | 'XZ' | 'YZ' | 'ALL';

// ─── Context Resolution Status ───
export type ContextResolutionStatus =
  | 'RESOLVED_EXACT'
  | 'RESOLVED_CONTEXTUAL'
  | 'RESOLVED_PRONOUN'
  | 'RESOLVED_SPATIAL'
  | 'RESOLVED_ACTIVE_SELECTION'
  | 'AMBIGUOUS'
  | 'NOT_FOUND'
  | 'UNRESOLVED';

// ─── Resolved Context Reference ───
export interface ResolvedContextReference {
  readonly referenceText: string;
  readonly targetGeometryId: string | null;
  readonly workspaceObjectId: string | null;
  readonly resolvedName: string | null;
  readonly resolutionMethod: ContextResolutionStatus;
  readonly confidence: number; // 0.0 to 1.0
  readonly resolutionDetails: string;
  readonly contextChecksum: string;
}

// ─── Spatial Parameter Schema ───
export interface SpatialPlanParameters {
  readonly primitiveType?: GeometryPrimitiveType;
  readonly dimensions?: {
    readonly width?: number;
    readonly height?: number;
    readonly depth?: number;
    readonly radius?: number;
    readonly innerRadius?: number;
    readonly count?: number;
  };
  readonly deltaTranslation?: readonly [number, number, number];
  readonly targetPosition?: readonly [number, number, number];
  readonly deltaRotation?: readonly [number, number, number];
  readonly factorScale?: readonly [number, number, number];
  readonly spatialRelation?: SpatialRelationType;
  readonly referenceTargetId?: string;
  readonly distance?: number;
  readonly booleanOp?: BooleanOperationType;
  readonly secondaryTargetId?: string;
  readonly measurementType?: MeasurementType;
  readonly axis?: SpatialAxis;
  readonly editAmount?: number;
  readonly queryTarget?: string;
}

// ─── Command Plan Operation ───
export interface SpatialPlanOperation {
  readonly stepIndex: number;
  readonly operationType: string;
  readonly targetGeometryId: string | null;
  readonly targetName: string;
  readonly description: string;
  readonly parameters: SpatialPlanParameters;
  readonly domain: EpistemicDomain;
  readonly createsNewGeometry: boolean;
  readonly resultingOrigin: GeometryOrigin;
}

// ─── Spatial Command Plan ───
export interface SpatialCommandPlan {
  readonly planId: string;
  readonly commandId: string;
  readonly sessionId: string;
  readonly intent: AIIntentType;
  readonly sourceText: string;
  readonly resolvedReferences: readonly ResolvedContextReference[];
  readonly operations: readonly SpatialPlanOperation[];
  readonly summary: string;
  readonly status: 'PREPARED' | 'VALIDATED' | 'PREVIEWED' | 'COMMITTED' | 'CANCELLED' | 'REJECTED';
  readonly validationIssues: readonly string[];
  readonly realityMutation: false; // Absolute invariant
  readonly realityChecksum: string;
  readonly timestamp: number;
  readonly planChecksum: string;
}

// ─── AI Conversation Message ───
export interface AIConversationMessage {
  readonly messageId: string;
  readonly sender: 'USER' | 'REALITY_AI' | 'SYSTEM';
  readonly text: string;
  readonly timestamp: number;
  readonly commandPlanId?: string | null;
  readonly explanation?: AIExplanation | null;
}

// ─── AI Explanation Layer ───
export interface AIExplanation {
  readonly intent: AIIntentType;
  readonly targetName: string;
  readonly referenceName?: string | null;
  readonly spatialRelation?: string | null;
  readonly operationSummary: string;
  readonly domain: EpistemicDomain;
  readonly epistemicClassification: GeometryOrigin;
  readonly realityCoordinates: readonly [number, number, number];
  readonly realityMutation: 0;
  readonly deterministicHash: string;
}

// ─── Validation Status ───
export type F10ValidationStatus =
  | 'VALID'
  | 'UNKNOWN_INTENT'
  | 'AMBIGUOUS_TARGET'
  | 'MISSING_CONTEXT'
  | 'INVALID_PARAMETER'
  | 'UNSUPPORTED_OPERATION'
  | 'REALITY_AUTHORITY_VIOLATION'
  | 'UNAUTHORIZED_ORIGIN_PROMOTION'
  | 'NON_FINITE_VALUE'
  | 'STALE_WORKSPACE'
  | 'PROVIDER_UNAVAILABLE';

export interface F10ValidationReport {
  readonly status: F10ValidationStatus;
  readonly isValid: boolean;
  readonly issues: readonly string[];
  readonly reportChecksum: string;
}

// ─── Causality Event ───
export interface F10CausalityEvent {
  readonly eventId: string;
  readonly commandId: string;
  readonly planId: string;
  readonly operation: string;
  readonly userUtterance: string;
  readonly realityChecksumBefore: string;
  readonly realityChecksumAfter: string;
  readonly isRealityInvariant: boolean;
  readonly sequence: number;
}

// ─── Multi-Hop Lineage ───
export interface F10LineageHop {
  readonly hopIndex: number;
  readonly stage: 'CONVERSATION' | 'USER_MESSAGE' | 'INTENT' | 'COMMAND_PLAN' | 'WORKSPACE_OP' | 'GEOMETRY' | 'DERIVED';
  readonly entityId: string;
  readonly description: string;
}

export interface F10LineageTrace {
  readonly commandId: string;
  readonly geometryId: string | null;
  readonly hops: readonly F10LineageHop[];
  readonly isRootedInReality: boolean;
  readonly lineageChecksum: string;
}

// ─── F10 Command History Entry ───
export interface F10HistoryEntry {
  readonly entryId: string;
  readonly commandId: string;
  readonly plan: SpatialCommandPlan;
  readonly stateBeforeChecksum: string;
  readonly stateAfterChecksum: string;
  readonly timestamp: number;
  readonly entryChecksum: string;
}

// ─── F10 Snapshot ───
export interface F10Snapshot {
  readonly snapshotId: string;
  readonly sessionId: string;
  readonly conversation: readonly AIConversationMessage[];
  readonly history: readonly F10HistoryEntry[];
  readonly lastActiveTargetId: string | null;
  readonly realityChecksum: string;
  readonly workspaceChecksum: string;
  readonly schemaVersion: string;
  readonly timestamp: number;
}

// ─── Execution Signature ───
export interface F10ExecutionSignature {
  readonly realityChecksum: string;
  readonly workspaceChecksum: string;
  readonly commandChecksum: string;
  readonly planChecksum: string;
  readonly conversationCount: number;
  readonly historyCount: number;
  readonly isCausalityValid: boolean;
  readonly syncStatus: 'SYNCED' | 'STALE';
  readonly executionHash: string;
}

// ─── Reality AI Session ───
export interface RealityAISession {
  readonly sessionId: string;
  readonly realityStateId: string;
  readonly workspaceId: string;
  readonly realityChecksum: string;
  readonly workspaceChecksum: string;
  readonly activeTargetGeometryId: string | null;
  readonly lastCreatedGeometryId: string | null;
  readonly conversation: readonly AIConversationMessage[];
  readonly history: readonly F10HistoryEntry[];
  readonly activePlan: SpatialCommandPlan | null;
  readonly activePreview: WorkspaceGeometry | null;
  readonly sessionChecksum: string;
}
