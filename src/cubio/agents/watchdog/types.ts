/**
 * CUBiO AI — 3D Memory Studio
 * AGENT-006 — BTWA (Background Task Watchdog Agent) v2 Supervisor
 * src/cubio/agents/watchdog/types.ts
 *
 * Authoritative contracts and type definitions for background task
 * supervision, process-tree monitoring, CPU/RAM metrics, log growth,
 * heartbeat & progress detection, runtime stages, health states,
 * stall detection, safe recovery, and deterministic audit trails.
 */

export type TaskLivenessState =
  | 'STARTING'
  | 'RUNNING'
  | 'FINALIZING'
  | 'ACTIVE'
  | 'ACTIVE_PROGRESSING'
  | 'LONG_RUNNING'
  | 'LEGITIMATE_LONG_RUNNING'
  | 'STALLED'
  | 'SUSPECT_STALLED'
  | 'CONFIRMED_STUCK'
  | 'RECOVERING'
  | 'RECOVERED_IDLE'
  | 'FAILED'
  | 'BLOCKED'
  | 'COMPLETED'
  | 'TERMINATED';

export type TaskCompletionClassification =
  | 'SUCCESS'
  | 'INCOMPLETE'
  | 'FAILED'
  | 'MISSING_EVIDENCE'
  | 'NON_ZERO_EXIT'
  | 'WRAPPER_STILL_ACTIVE'
  | 'TIMEOUT_EXCEEDED';

export interface ExpectedTaskArtifact {
  readonly path: string;
  readonly minSizeBytes?: number;
  readonly requiredPattern?: string | RegExp;
  readonly description?: string;
}

export interface TaskCompletionCriteria {
  readonly expectedArtifacts?: readonly (string | ExpectedTaskArtifact)[];
  readonly expectedReportPath?: string;
  readonly completionMarkers?: readonly string[];
  readonly requiredExitCode?: number; // default: 0
  readonly requireClosedPipes?: boolean;
}

export interface TaskEvidencePackage {
  readonly exitCode: number | null;
  readonly durationMs: number;
  readonly finalLogSnippet?: string;
  readonly artifactsFound: readonly string[];
  readonly missingArtifacts: readonly string[];
  readonly stdoutStderrClosed: boolean;
  readonly childProcessesCleaned: readonly number[];
  readonly completionMarkersFound: readonly string[];
  readonly verificationPassed: boolean;
  readonly classification: TaskCompletionClassification;
  readonly evidenceHash: string;
}

export interface TaskLedgerRecord {
  readonly taskId: string;
  readonly command: string;
  readonly pid: number;
  readonly initialState: TaskLivenessState;
  readonly finalState: TaskLivenessState;
  readonly exitCode: number | null;
  readonly runtimeMs: number;
  readonly startTimeMs: number;
  readonly endTimeMs: number;
  readonly healthRating: TaskHealthRating;
  readonly evidence: TaskEvidencePackage;
  readonly wrapperCleanupSuccess: boolean;
  readonly nextTaskReadiness: boolean;
  readonly ledgerTimestamp: number;
  readonly recordHash: string;
}

export type TaskHealthRating = 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'STUCK' | 'UNKNOWN';

export type TerminationMethod = 'SIGTERM' | 'SIGKILL' | 'TASKKILL_TREE' | 'MOCK_TERMINATION';

export interface ProcessMetrics {
  readonly cpuPercent: number;
  readonly memoryWorkingSetBytes: number;
  readonly handlesCount?: number;
  readonly threadCount?: number;
}

export interface ProcessActivitySample {
  readonly timestamp: number;
  readonly pid: number;
  readonly isRunning: boolean;
  readonly logByteSize: number;
  readonly logLastModifiedMs: number;
  readonly lastHeartbeatMs?: number;
  readonly activeChildPids: readonly number[];
  readonly lastOutputSnippet?: string;
  readonly progressStep?: number;
  readonly currentStage?: string;
  readonly metrics?: ProcessMetrics;
}

export interface ProgressSnapshot {
  readonly snapshotId: string;
  readonly taskId: string;
  readonly timestamp: number;
  readonly stage: string;
  readonly progressPercent: number;
  readonly logBytes: number;
  readonly activeChildCount: number;
  readonly cpuPercent: number;
  readonly memoryBytes: number;
  readonly snapshotHash: string;
}

export interface WatchedTask {
  readonly taskId: string;
  readonly command: string;
  readonly pid: number;
  readonly logPath?: string;
  readonly startTimeMs: number;
  readonly lastMeaningfulProgressMs: number;
  readonly currentLivenessState: TaskLivenessState;
  readonly healthRating?: TaskHealthRating;
  readonly childPids: readonly number[];
  readonly samples: readonly ProcessActivitySample[];
  readonly snapshots?: readonly ProgressSnapshot[];
  readonly runtimeStage?: string;
  readonly progressStep?: number;
  readonly completionCriteria?: TaskCompletionCriteria;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface WatchdogConfig {
  readonly inactivityThresholdMs: number; // default: 600,000ms (10 minutes)
  readonly stallWarningThresholdMs?: number; // default: 300,000ms (5 minutes)
  readonly sampleIntervalMs: number;     // default: 5,000ms
  readonly minLogGrowthBytes: number;     // default: 1 byte
  readonly logGracePeriodMs: number;      // default: 10,000ms
  readonly autoRecover: boolean;          // default: true
  readonly maxRecoveryAttempts?: number;  // default: 3
}

export interface StuckDiagnosis {
  readonly taskId: string;
  readonly pid: number;
  readonly isStuck: boolean;
  readonly isStalled: boolean;
  readonly confidence: number; // 0.0 to 1.0
  readonly durationSinceProgressMs: number;
  readonly reason: string;
  readonly evidenceSummary: string;
  readonly recommendation:
    | 'MAINTAIN_OBSERVATION'
    | 'MONITOR_STALL'
    | 'TERMINATE_AND_RECOVER'
    | 'NO_ACTION_REQUIRED';
}

export interface WatchdogActionRecord {
  readonly actionId: string;
  readonly taskId: string;
  readonly pid: number;
  readonly actionType: 'INSPECTION' | 'SNAPSHOT' | 'STALL_WARNING' | 'TERMINATION' | 'RECOVERY_ATTEMPT' | 'CLEAN_RECOVERY' | 'SAFETY_ABORT';
  readonly method?: TerminationMethod;
  readonly affectedPids: readonly number[];
  readonly success: boolean;
  readonly details: string;
  readonly timestamp: number;
  readonly actionHash: string;
}

export interface WatchdogAuditReport {
  readonly agentId: 'AGENT-006-BTWA';
  readonly version: '2.1.0' | '2.0.0';
  readonly reportId: string;
  readonly taskId: string;
  readonly initialLivenessState: TaskLivenessState;
  readonly finalLivenessState: TaskLivenessState;
  readonly healthRating: TaskHealthRating;
  readonly diagnosis: StuckDiagnosis;
  readonly latestSnapshot?: ProgressSnapshot;
  readonly evidence?: TaskEvidencePackage;
  readonly ledgerRecord?: TaskLedgerRecord;
  readonly actions: readonly WatchdogActionRecord[];
  readonly masterAuditHash: string;
  readonly executionTimeMs: number;
  readonly rxLifecycleId: string;
  readonly isActuationBlocked: true;
  readonly protectedAssetsUntouched: true;
}

export interface WatchdogSafetyStatus {
  readonly isActuationBlocked: boolean;
  readonly isOfflineOnly: boolean;
  readonly externalAiDetected: boolean;
  readonly protectedAssetsProtected: boolean;
}
