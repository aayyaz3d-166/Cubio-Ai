/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-12: CubiO Agent / AI Network (Types & Models)
 *
 * Formal specification for sovereign agent identity, lifecycle management,
 * capability scopes, delegation tokens, and execution sandboxing.
 *
 * CRITICAL ARCHITECTURAL INVARIANT:
 * - Agents operate under EXPLICIT authorization and DO NOT inherit unrestricted user privileges.
 * - Delegated permissions must be a strict subset of the principal's permissions.
 * - High-risk administrative permissions (KEY_ROTATE, ACCOUNT_DELETE, ADMIN_MANAGE) are forbidden for agents.
 * - Every agent action produces an immutable execution audit record.
 */

import { NetworkPermission } from '../authz/types';

export type AgentType =
  | 'ASSISTANT'
  | 'SPATIAL_DESIGNER'
  | 'AUTONOMOUS_WORKER'
  | 'CODE_ENGINEER'
  | 'DATA_ANALYST'
  | 'SYSTEM_MONITOR';

export type AgentLifecycleState =
  | 'DRAFT'
  | 'READY'
  | 'EXECUTING'
  | 'PAUSED'
  | 'SUSPENDED'
  | 'TERMINATED';

export type AgentCapability =
  | 'SPATIAL_QUERY'
  | 'STORAGE_ACCESS'
  | 'SERVICE_CALL'
  | 'MESSAGE_REPLY'
  | 'SCENE_MUTATE'
  | 'CODE_EXECUTE';

export interface AgentExecutionAuditRecord {
  readonly stepId: string;
  readonly action: string;
  readonly targetResource: string;
  readonly allowed: boolean;
  readonly timestamp: number;
  readonly durationMs: number;
  readonly reason?: string;
}

export interface AgentRecord {
  readonly agentId: string; // AGT_...
  readonly name: string;
  readonly description: string;
  readonly agentType: AgentType;
  readonly ownerCubId: string; // Principal sovereign CUB-XXXXXXXX
  readonly status: AgentLifecycleState;
  readonly allowedPermissions: readonly NetworkPermission[];
  readonly capabilities: readonly AgentCapability[];
  readonly modelUri: string; // e.g. "model://gemini-2.0-flash"
  readonly systemPrompt: string;
  readonly createdAt: number;
  readonly updatedAt: number;
  readonly metadata?: Readonly<Record<string, any>>;
}

export interface AgentDelegationToken {
  readonly delegationId: string; // DEL_...
  readonly agentId: string;
  readonly principalCubId: string;
  readonly token: string; // DELTOK_...
  readonly delegatedPermissions: readonly NetworkPermission[];
  readonly allowedResourcePatterns: readonly string[];
  readonly issuedAt: number;
  readonly expiresAt: number;
  readonly revoked: boolean;
}

export interface AgentTask {
  readonly taskId: string; // TSK_...
  readonly agentId: string;
  readonly principalCubId: string;
  readonly taskPrompt: string;
  readonly delegationToken: string;
  readonly status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  readonly inputData?: any;
  readonly outputData?: any;
  readonly error?: string;
  readonly startedAt?: number;
  readonly completedAt?: number;
  readonly executionAuditHistory: readonly AgentExecutionAuditRecord[];
}

export interface CreateAgentInput {
  readonly name: string;
  readonly description: string;
  readonly agentType: AgentType;
  readonly allowedPermissions: readonly NetworkPermission[];
  readonly capabilities: readonly AgentCapability[];
  readonly modelUri?: string;
  readonly systemPrompt?: string;
  readonly metadata?: Record<string, any>;
}

export interface CreateDelegationInput {
  readonly agentId: string;
  readonly delegatedPermissions: readonly NetworkPermission[];
  readonly allowedResourcePatterns?: readonly string[];
  readonly durationMs?: number; // default: 1 hour (3,600,000 ms)
}

export interface ExecuteAgentTaskInput {
  readonly agentId: string;
  readonly taskPrompt: string;
  readonly inputData?: any;
  readonly targetAction?: string;
  readonly targetResourceUri?: string;
}
