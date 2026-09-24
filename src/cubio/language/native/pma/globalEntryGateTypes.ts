/**
 * CUBiO AI — Task 31: Global PMA Entry Gate & Mandatory Task Routing Layer
 * src/cubio/language/native/pma/globalEntryGateTypes.ts
 *
 * Authoritative types and contracts for the top-level task intake,
 * deterministic routing state machine, execution authorization, and bypass protection.
 *
 * Core Principle:
 * NO TASK MAY DIRECTLY REACH:
 * - developer / agent
 * - file modification
 * - build operation
 * - test execution
 * - experiment execution
 * - training execution
 * before passing through the Global PMA Entry Gate.
 */

import { PMATaskType, PMAHandoffContract, PMAVerdictStatus } from './types';
import { TinyPMARequestType, TinyPMAHandoff } from './tinyPMATypes';
import { PMARxEvidenceSummary } from './pmaRxEvidenceLifecycle';

// ---------------------------------------------------------------------------
// ROUTING STATE MACHINE
// ---------------------------------------------------------------------------

export type TaskRoutingState =
  | 'RECEIVED'
  | 'ENTRY_VALIDATED'
  | 'TINY_PMA_PENDING'
  | 'TINY_PMA_ACTIVE'
  | 'NATIVE_PMA_PENDING'
  | 'NATIVE_PMA_ACTIVE'
  | 'DISCOVERY'
  | 'CAPABILITY_RESOLUTION'
  | 'SAFETY_CHECK'
  | 'HANDOFF_READY'
  | 'EXECUTION_AUTHORIZED'
  | 'EXECUTING'
  | 'VERIFICATION'
  | 'FINAL_REVIEW'
  | 'MEMORY_COMMIT'
  | 'CLOSED'
  // Terminal / Failure States
  | 'REJECTED'
  | 'BLOCKED'
  | 'FAILED'
  | 'UNKNOWN'
  | 'UNAUTHORIZED'
  | 'BYPASS_ATTEMPT';

// ---------------------------------------------------------------------------
// TASK INTAKE CONTRACT
// ---------------------------------------------------------------------------

export interface TaskIntakeRequest {
  readonly userPrompt: string;
  readonly requestId?: string;
  readonly requestType?: TinyPMARequestType | string;
  readonly source?: string;
  readonly tenantId?: string;
  readonly allowedFileOverrides?: readonly string[];
  readonly bypassCheckToken?: string;
}

export interface TaskIntakeRecord {
  readonly taskIntakeId: string;
  readonly taskId: string;
  readonly request: string;
  readonly requestType: TinyPMARequestType;
  readonly source: string;
  readonly receivedAt: number;
  readonly routingState: TaskRoutingState;
  readonly tinyPMAStatus: 'PENDING' | 'ACTIVE' | 'APPROVED' | 'REJECTED' | 'BYPASSED';
  readonly nativePMAStatus: 'PENDING' | 'ACTIVE' | 'APPROVED' | 'BLOCKED' | 'BYPASSED';
  readonly authorizationState: 'UNAUTHORIZED' | 'PENDING' | 'AUTHORIZED' | 'REVOKED' | 'BYPASS_REJECTED';
  readonly scope: readonly string[];
  readonly allowedFiles: readonly string[];
  readonly protectedFiles: readonly string[];
  readonly executionState: 'IDLE' | 'EXECUTING' | 'VERIFYING' | 'COMPLETED' | 'BLOCKED';
  readonly finalState?: PMAVerdictStatus | 'BLOCKED' | 'REJECTED';
  readonly provenanceHash: string;
}

// ---------------------------------------------------------------------------
// AUTHORIZATION MODEL
// ---------------------------------------------------------------------------

export interface TaskExecutionAuthorization {
  readonly isAuthorized: boolean;
  readonly authorizationToken: string;
  readonly taskIntakeId: string;
  readonly taskId: string;
  readonly requestType: TinyPMARequestType;
  readonly allowedFiles: readonly string[];
  readonly protectedFiles: readonly string[];
  readonly scope: readonly string[];
  readonly capabilities: readonly string[];
  readonly dependencies: readonly string[];
  readonly safetyConstraints: readonly string[];
  readonly acceptanceCriteria: readonly string[];
  readonly handoffHash: string;
  readonly provenanceHash: string;
  readonly authorizedAt: number;
  readonly rejectionReason?: string;
}

// ---------------------------------------------------------------------------
// BYPASS PROTECTION
// ---------------------------------------------------------------------------

export interface TaskBypassRecord {
  readonly bypassId: string;
  readonly timestamp: number;
  readonly attemptedAction: string;
  readonly targetFiles: readonly string[];
  readonly authorizationTokenProvided?: string;
  readonly rejectionReason: string;
  readonly provenanceHash: string;
}

// ---------------------------------------------------------------------------
// INTAKE EXECUTION RESULT
// ---------------------------------------------------------------------------

export interface TaskIntakeRoutingResult {
  readonly intakeRecord: TaskIntakeRecord;
  readonly tinyPMAHandoff?: TinyPMAHandoff;
  readonly pmaHandoff?: PMAHandoffContract;
  readonly authorization: TaskExecutionAuthorization;
}
