/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F77: Security Certification Types & Contracts
 *
 * Covers 12 Security Pillars:
 * Zero-Trust, Authentication, Authorization, Tenant Isolation, Sandbox Isolation,
 * Secret Handling, Tool Permissions, API Security, File Security, Agent Permissions,
 * Prompt/Tool Injection Defenses, Audit Logs.
 *
 * Invariant: Security must be independent of intelligence claims.
 */

export type SecurityAuditPillar =
  | 'ZERO_TRUST'
  | 'AUTHENTICATION'
  | 'AUTHORIZATION'
  | 'TENANT_ISOLATION'
  | 'SANDBOX_ISOLATION'
  | 'SECRET_HANDLING'
  | 'TOOL_PERMISSIONS'
  | 'API_SECURITY'
  | 'FILE_SECURITY'
  | 'AGENT_PERMISSIONS'
  | 'INJECTION_DEFENSE'
  | 'AUDIT_LOGS';

export interface SecurityPillarEvaluation {
  readonly pillar: SecurityAuditPillar;
  readonly name: string;
  readonly isCompliant: boolean;
  readonly vulnerabilityCount: number;
  readonly proofDetail: string;
}

export interface UniversalSecurityAuditReport {
  readonly auditId: string;
  readonly totalPillars: number;
  readonly compliantPillars: number;
  readonly isZeroTrustCertified: boolean;
  readonly independentFromIntelligence: boolean;
  readonly checksum: string;
  readonly timestamp: number;
  readonly evaluations: readonly SecurityPillarEvaluation[];
}

export interface ISecurityCertificationEngine {
  runFullSecurityAudit(): Promise<Readonly<UniversalSecurityAuditReport>>;
}
