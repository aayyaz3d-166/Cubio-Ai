/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F67: Safety, Authorization & Governance Types & Contracts
 *
 * Multimodal Guardrails, Policy Engine, Epistemic Governance, Immutable Audit Ledger,
 * and Full 11-Pillar Controlled Authority Specifications.
 */

export interface SafetyGuardrailCheckResult {
  readonly isSafe: boolean;
  readonly injectionDetected: boolean;
  readonly toxicityScore: number; // 0.0 .. 1.0 (Lower is safer)
  readonly violations: readonly string[];
  readonly reason?: string;
  readonly checkChecksum: string;
}

export interface GovernanceRule {
  readonly ruleId: string;
  readonly name: string;
  readonly category: 'SECURITY' | 'EPISTEMIC' | 'AUTHORIZATION' | 'QUOTA';
  readonly description: string;
  readonly isEnforced: boolean;
}

export interface PolicyEvaluationResult {
  readonly isAllowed: boolean;
  readonly requiresHumanAuthorization: boolean;
  readonly epistemicBoundaryValid: boolean;
  readonly quotaRemaining: number;
  readonly violations: readonly string[];
  readonly policyChecksum: string;
}

export interface SafetyAuditRecord {
  readonly auditId: string;
  readonly requestPrompt: string;
  readonly isAllowed: boolean;
  readonly guardrailScore: number;
  readonly violations: readonly string[];
  readonly signature: string;
  readonly timestamp: number;
}

export interface ComplianceReport {
  readonly overallCompliant: boolean;
  readonly complianceScore: number; // 0 .. 100
  readonly totalAudits: number;
  readonly activeRulesCount: number;
  readonly activeViolationsCount: number;
  readonly reportChecksum: string;
  readonly timestamp: number;
}

export interface ISafetyGovernanceEngine {
  evaluateSafety(prompt: string, context?: Readonly<Record<string, unknown>>): Promise<Readonly<SafetyGuardrailCheckResult>>;
  evaluatePolicy(action: string, metadata?: Readonly<Record<string, unknown>>): Readonly<PolicyEvaluationResult>;
  auditExecution(prompt: string, result: unknown, isAllowed?: boolean): Readonly<SafetyAuditRecord>;
  generateComplianceReport(): Readonly<ComplianceReport>;
}

// ─── CONTROLLED AUTHORITY EXTENSIONS (11 PILLARS) ──────────────────────────

export type ControlledPermissionLevel =
  | 'READ_ONLY'
  | 'WORKSPACE_WRITE'
  | 'SYSTEM_WRITE'
  | 'NETWORK_ACCESS'
  | 'TOOL_INVOCATION'
  | 'AGENT_SPAWN'
  | 'DEPLOY_PROD'
  | 'SECRET_ACCESS';

export type HumanApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';

export interface HumanApprovalGateRecord {
  readonly gateId: string;
  readonly action: string;
  readonly status: HumanApprovalStatus;
  readonly token?: string;
  readonly reason?: string;
  readonly createdAt: number;
  readonly expiresAt: number;
}

export interface AgentAuthorityBounds {
  readonly agentId: string;
  readonly maxCallDepth: number;
  readonly maxSubAgents: number;
  readonly maxExecutionTimeMs: number;
  readonly allowedPermissions: readonly ControlledPermissionLevel[];
}

export interface FilesystemScopeConfig {
  readonly allowedWorkspaceRoots: readonly string[];
  readonly forbidParentTraversal: boolean;
  readonly readOnly: boolean;
}

export interface FilesystemScopeCheckResult {
  readonly inScope: boolean;
  readonly sanitizedPath: string;
  readonly error?: string;
}

export interface ApiScopeConfig {
  readonly allowedDomains: readonly string[];
  readonly allowedMethods: readonly ('GET' | 'POST' | 'PUT' | 'DELETE')[];
}

export interface ApiScopeCheckResult {
  readonly allowed: boolean;
  readonly domain: string;
  readonly error?: string;
}

export interface SecretProtectionResult {
  readonly redactedText: string;
  readonly secretsFoundCount: number;
  readonly hasSecrets: boolean;
}

export interface ActionAuditBlock {
  readonly blockIndex: number;
  readonly actionName: string;
  readonly isAuthorized: boolean;
  readonly previousHash: string;
  readonly currentHash: string;
  readonly timestamp: number;
  readonly payloadSummary: string;
}

export interface ICancellationToken {
  readonly isCancelled: boolean;
  readonly cancellationReason?: string;
  abort(reason?: string): void;
}

export interface RollbackSnapshot {
  readonly snapshotId: string;
  readonly actionId: string;
  readonly stateBefore: unknown;
  readonly isReverted: boolean;
  readonly createdAt: number;
}

export interface ControlledAuthorityExecutionRequest {
  readonly actionName: string;
  readonly requestedPermission: ControlledPermissionLevel;
  readonly agentId: string;
  readonly params?: Readonly<Record<string, unknown>>;
  readonly authorizationToken?: string;
  readonly workspacePath?: string;
  readonly targetApiUrl?: string;
  readonly stateBeforeMutation?: unknown;
  readonly cancellationToken?: ICancellationToken;
}

export interface ControlledAuthorityExecutionResponse {
  readonly isAuthorized: boolean;
  readonly executionPermitted: boolean;
  readonly approvalGate?: HumanApprovalGateRecord;
  readonly auditBlock: ActionAuditBlock;
  readonly rollbackSnapshotId?: string;
  readonly sanitizedParams: Readonly<Record<string, unknown>>;
  readonly error?: string;
}

export interface IMasterControlledAuthorityCoordinator {
  authorizeAndInspectAction(
    request: ControlledAuthorityExecutionRequest
  ): Promise<Readonly<ControlledAuthorityExecutionResponse>>;
  issueHumanApproval(gateId: string): HumanApprovalGateRecord;
  rollbackAction(snapshotId: string): { success: boolean; snapshot: RollbackSnapshot };
}
