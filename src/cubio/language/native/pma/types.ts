/**
 * CUBiO AI — 3D Memory Studio
 * Task 27 — Native Project Manager Agent (PMA)
 * src/cubio/language/native/pma/types.ts
 *
 * Authoritative type definitions for sovereign project management,
 * pre-development gatekeeping, developer handoff contracts, and
 * post-development verification.
 */

export type PMATaskType =
  | 'SIMPLE'
  | 'FEATURE'
  | 'REFACTOR'
  | 'ARCHITECTURAL'
  | 'CROSS_SUBSYSTEM'
  | 'SECURITY'
  | 'MIGRATION'
  | 'INVESTIGATION'
  | 'UNKNOWN';

export type PMAReuseStrategy = 'REUSE' | 'EXTEND' | 'COMPOSE' | 'NEW';

export type PMADatabaseImpact = 'DATABASE_READ_ONLY' | 'DATABASE_MODIFICATION_REQUIRED';

export type PMASpatial369Impact = 'NO_IMPACT' | 'READ_CANONICAL_MATH' | 'BLOCKED_MODIFICATION';

export type PMAVerdictStatus = 'PASS' | 'PARTIAL_PASS' | 'BLOCKED';

export interface PMATaskRequest {
  readonly requestId: string;
  readonly userPrompt: string;
  readonly taskType?: PMATaskType;
  readonly targetSubsystems?: readonly string[];
  readonly explicitFullProjectScan?: boolean;
  readonly tenantId?: string;
  readonly allowedFileOverrides?: readonly string[];
}

export interface PMASubsystemScope {
  readonly primarySubsystem: string;
  readonly affectedSubsystems: readonly string[];
  readonly relevantFiles: readonly string[];
  readonly fullProjectExplorationTriggered: boolean;
  readonly triggerReason?: string;
}

export interface PMACandidateCapability {
  readonly capabilityName: string;
  readonly path: string;
  readonly implementation: string;
  readonly status: string;
  readonly tests: string;
  readonly dependencies: readonly string[];
  readonly reuseValue: 'MAXIMUM' | 'HIGH' | 'MEDIUM' | 'LOW';
  readonly reuseStrategy: PMAReuseStrategy;
  readonly notes?: string;
}

export interface PMASecurityImpact {
  readonly externalAiDetected: boolean;
  readonly isActuationBlocked: boolean;
  readonly isOfflineOnly: boolean;
  readonly detectedTerms?: readonly string[];
}

export interface PMAConflictRecord {
  readonly type:
    | 'DUPLICATE_IMPLEMENTATION'
    | 'FROZEN_COMPONENT_CONFLICT'
    | 'DATABASE_MUTATION_RISK'
    | 'SPATIAL_369_CONFLICT'
    | 'EXTERNAL_AI_DETECTED'
    | 'BOUNDARY_VIOLATION'
    | 'REGRESSION_RISK'
    | 'AMBIGUOUS_REQUIREMENT'
    | 'DEPENDENCY_CYCLE';
  readonly component: string;
  readonly reason: string;
  readonly impact: string;
  readonly safeAlternatives: readonly string[];
}

export interface PMAHandoffContract {
  readonly taskId: string;
  readonly objective: string;
  readonly scope: PMASubsystemScope;
  readonly relevantFiles: readonly string[];
  readonly existingCapabilities: readonly PMACandidateCapability[];
  readonly reuseStrategy: PMAReuseStrategy;
  readonly allowedFiles: readonly string[];
  readonly protectedFiles: readonly string[];
  readonly dependencies: readonly string[];
  readonly databaseImpact: PMADatabaseImpact;
  readonly spatial369Impact: PMASpatial369Impact;
  readonly securityImpact: PMASecurityImpact;
  readonly requiredTests: readonly string[];
  readonly regressionRequirements: readonly string[];
  readonly expectedInvariants: readonly string[];
  readonly rollbackConsiderations: string;
  readonly conflicts: readonly PMAConflictRecord[];
  readonly handoffHash: string;
  readonly isApprovedForDevelopment: boolean;
  readonly rejectionReason?: string;
  readonly timestamp: number;
}

export interface PMAGitChanges {
  readonly changedFiles: readonly string[];
  readonly newFiles: readonly string[];
  readonly deletedFiles: readonly string[];
  readonly renamedFiles: readonly string[];
  readonly modifiedFilesContent?: Readonly<Record<string, string>>;
}

export interface PMAPostDevInspection {
  readonly boundaryViolation: boolean;
  readonly violatingFiles: readonly string[];
  readonly frozenFilesTouched: readonly string[];
  readonly databaseTampered: boolean;
  readonly spatial369Tampered: boolean;
  readonly externalAiDetected: boolean;
  readonly actuationLockoutPreserved: boolean;
  readonly regressionSuitePassed: boolean;
  readonly unitTestsPassed: boolean;
}

export interface PMAReviewVerdict {
  readonly taskId: string;
  readonly didImplementationMatchRequest: boolean;
  readonly didReuseExistingCapabilities: boolean;
  readonly wereDuplicatesCreated: boolean;
  readonly wereProtectedFilesTouched: boolean;
  readonly wereUnrelatedFilesModified: boolean;
  readonly didTestsPass: boolean;
  readonly didBuildPass: boolean;
  readonly didRegressionPass: boolean;
  readonly didAnyInvariantDrift: boolean;
  readonly finalVerdict: PMAVerdictStatus;
  readonly detailedFindings: readonly string[];
  readonly timestamp: number;
}

export interface PMATaskMemoryRecord {
  readonly taskId: string;
  readonly date: string;
  readonly userObjective: string;
  readonly subsystem: string;
  readonly relevantFiles: readonly string[];
  readonly filesChanged: readonly string[];
  readonly capabilitiesReused: readonly string[];
  readonly newCapabilities: readonly string[];
  readonly dependencies: readonly string[];
  readonly tests: readonly string[];
  readonly build: string;
  readonly regression: string;
  readonly invariantStatus: string;
  readonly securityStatus: string;
  readonly databaseStatus: string;
  readonly spatial369Status: string;
  readonly finalStatus: PMAVerdictStatus;
  readonly provenance: string;
  readonly recordHash: string;
  // Task 30 — RX Evidence Lifecycle Integration
  readonly rxLifecycleId?: string;
  readonly rxStageReached?: number;
  readonly rxEvidenceSummaryHash?: string;
  readonly rxEvidenceCount?: number;
}

// ---------------------------------------------------------------------------
// Task 28 — Persistent Project Change Watcher Types
// ---------------------------------------------------------------------------

export type PMAChangeType =
  | 'NEW_FILE'
  | 'MODIFIED_FILE'
  | 'DELETED_FILE'
  | 'RENAMED_FILE'
  | 'MOVED_FILE'
  | 'CONTENT_CHANGED'
  | 'SIZE_CHANGED'
  | 'HASH_CHANGED'
  | 'METADATA_CHANGED';

export type PMAChangeClassification =
  | 'EXPECTED'
  | 'AUTHORIZED'
  | 'UNAUTHORIZED'
  | 'UNASSOCIATED'
  | 'PROTECTED'
  | 'ARCHIVED'
  | 'GENERATED'
  | 'TEST_ARTIFACT'
  | 'RESEARCH_ARTIFACT'
  | 'CONFIGURATION'
  | 'PRODUCTION'
  | 'UNKNOWN';

export type PMAWatcherStatusState =
  | 'WATCHER_ACTIVE'
  | 'WATCHER_STATE_UNCERTAIN'
  | 'BASELINE_RECONCILIATION_REQUIRED'
  | 'SOURCE_STATE_UNCERTAIN';

export interface PMAFileBaselineEntry {
  readonly path: string;
  readonly size: number;
  readonly mtimeMs: number;
  readonly sha256?: string;
  readonly classification: PMAChangeClassification;
  readonly isProtected: boolean;
  readonly subsystem: string;
  readonly associatedTaskId?: string;
}

export interface PMAObservationBaseline {
  readonly baselineId: string;
  readonly timestamp: number;
  readonly files: ReadonlyMap<string, PMAFileBaselineEntry>;
  readonly totalTrackedFiles: number;
  readonly baselineHash: string;
}

export interface PMADependencyImpactResult {
  readonly impactedSubsystems: readonly string[];
  readonly impactsImports: boolean;
  readonly impactsExports: boolean;
  readonly impactsEntrypoints: boolean;
  readonly impactsTests: boolean;
  readonly impactsConfiguration: boolean;
  readonly impactsSpatial369: boolean;
  readonly impactsDatabase: boolean;
  readonly affectedFiles: readonly string[];
  readonly notes: string;
}

export interface PMAFileChangeRecord {
  readonly changeId: string;
  readonly taskId?: string;
  readonly conversationId?: string;
  readonly timestamp: number;
  readonly path: string;
  readonly changeType: PMAChangeType;
  readonly previousHash?: string;
  readonly currentHash?: string;
  readonly previousSize?: number;
  readonly currentSize?: number;
  readonly scopeStatus: 'IN_SCOPE' | 'OUT_OF_SCOPE' | 'UNASSOCIATED' | 'UNKNOWN';
  readonly classification: PMAChangeClassification;
  readonly protectionStatus: 'PROTECTED_MUTATION_ALERT' | 'NORMAL';
  readonly verificationStatus: 'VERIFIED' | 'VERIFICATION_REQUIRED' | 'BLOCKED';
  readonly dependencyImpact?: PMADependencyImpactResult;
  readonly provenance: string;
}

export interface PMATaskContext {
  readonly taskId: string;
  readonly objective: string;
  readonly startTime: number;
  readonly allowedFiles: readonly string[];
  readonly protectedFiles: readonly string[];
  readonly baselineSnapshot: ReadonlyMap<string, PMAFileBaselineEntry>;
  readonly status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  readonly conversationId?: string;
}

export interface PMAWatcherStatus {
  readonly state: PMAWatcherStatusState;
  readonly hostConversationHookAvailable: boolean;
  readonly statusMessage: string;
  readonly totalTrackedFiles: number;
  readonly recentChangesCount: number;
  readonly lastReconciliationTime: number;
}

