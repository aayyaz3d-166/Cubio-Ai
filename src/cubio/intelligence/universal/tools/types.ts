/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F56: Universal Tool Intelligence Types & Contracts
 *
 * Core contracts for 7 Tool Categories:
 * 1. Filesystem
 * 2. APIs
 * 3. Databases
 * 4. Search
 * 5. Calculators
 * 6. Developer Tools
 * 7. Project Tools
 *
 * Enforcing the 6-Pillar Lifecycle:
 * Permission -> Scope -> Authorization -> Execution -> Result -> Audit
 */

export type ToolCategory =
  | 'FILESYSTEM'
  | 'APIS'
  | 'DATABASES'
  | 'SEARCH'
  | 'CALCULATORS'
  | 'DEVELOPER_TOOLS'
  | 'PROJECT_TOOLS'
  | 'FILE_SYSTEM'
  | 'TERMINAL'
  | 'BROWSER'
  | 'API'
  | 'SPATIAL_COMPUTE';

export type ToolPermissionLevel =
  | 'READ_ONLY'
  | 'WORKSPACE_WRITE'
  | 'NETWORK_ACCESS'
  | 'DATABASE_ACCESS'
  | 'SYSTEM_EXECUTE';

export interface ToolScope {
  readonly allowedPaths?: readonly string[];
  readonly allowedDomains?: readonly string[];
  readonly allowedTables?: readonly string[];
  readonly isGlobal?: boolean;
}

export interface UniversalToolDefinition {
  readonly toolId: string;
  readonly name: string;
  readonly category: ToolCategory;
  readonly description: string;
  readonly permissionLevel: ToolPermissionLevel;
  readonly isDestructive: boolean;
  readonly defaultScope?: ToolScope;
  readonly parametersSchema: Readonly<Record<string, unknown>>;
}

export interface ToolAuthorizationGateRecord {
  readonly gateId: string;
  readonly level: 'AUTO_APPROVED' | 'REQUIRES_USER_CONFIRMATION' | 'BLOCKED';
  readonly status: 'PENDING' | 'APPROVED' | 'REJECTED';
  readonly authorizationToken?: string;
  readonly riskAssessment: string;
}

export interface ToolAuditRecord {
  readonly auditId: string;
  readonly toolId: string;
  readonly category: ToolCategory;
  readonly permission: ToolPermissionLevel;
  readonly scope: ToolScope;
  readonly authorized: boolean;
  readonly executionTimeMs: number;
  readonly status: 'SUCCESS' | 'FAILURE' | 'BLOCKED';
  readonly auditChecksum: string;
  readonly timestamp: number;
}

export interface ToolInvocationRequest {
  readonly toolId: string;
  readonly parameters: Readonly<Record<string, unknown>>;
  readonly permissionGranted?: boolean;
  readonly scope?: ToolScope;
  readonly authorizationToken?: string;
  readonly timeoutMs?: number;
}

export interface ToolInvocationResult {
  readonly toolId: string;
  readonly success: boolean;
  readonly output: unknown;
  readonly error?: string;
  readonly executionTimeMs: number;
  readonly executionChecksum: string;
  readonly auditRecord?: ToolAuditRecord;
  readonly authorizationGate?: ToolAuthorizationGateRecord;
}

export interface IToolEngine {
  registerTool(tool: UniversalToolDefinition, handler: (params: Record<string, unknown>) => Promise<unknown>): void;
  listTools(category?: ToolCategory): readonly UniversalToolDefinition[];
  invokeTool(request: ToolInvocationRequest): Promise<ToolInvocationResult>;
  approveToolGate(gateId: string, token: string): boolean;
  getAuditTrail(): readonly ToolAuditRecord[];
}
