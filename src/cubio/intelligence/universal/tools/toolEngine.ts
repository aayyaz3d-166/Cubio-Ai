/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F56: Master Universal Tool Engine
 *
 * Implements the full 6-pillar lifecycle for 7 tool categories:
 * Permission -> Scope -> Authorization -> Execution -> Result -> Audit
 */

import { deterministicHash } from '../../../state/determinism';
import {
  IToolEngine,
  ToolCategory,
  ToolInvocationRequest,
  ToolInvocationResult,
  UniversalToolDefinition,
  ToolAuditRecord,
  ToolPermissionLevel,
  ToolScope,
} from './types';
import { PermissionController } from './pipeline/permissionController';
import { ScopeValidator } from './pipeline/scopeValidator';
import { ToolAuthorizationGate } from './pipeline/authorizationGate';
import { ToolAuditor } from './pipeline/toolAuditor';

// 7 Category Tools
import { fsReadFileTool, fsWriteFileTool, handleFsReadFile, handleFsWriteFile } from './categories/filesystemTools';
import { httpGetTool, httpPostTool, handleHttpGet, handleHttpPost } from './categories/apiTools';
import { dbQueryTool, dbSetTool, handleDbQuery, handleDbSet } from './categories/databaseTools';
import { webSearchTool, vectorSearchTool, handleWebSearch, handleVectorSearch } from './categories/searchTools';
import { mathEvalTool, matrixMultiplyTool, handleMathEval, handleMatrixMult } from './categories/calculatorTools';
import { lintCodeTool, gitStatusTool, handleLintCode, handleGitStatus } from './categories/developerTools';
import { inspectProjectTool, checkDependenciesTool, handleInspectProject, handleCheckDependencies } from './categories/projectTools';

// Legacy Tools
import { deleteFileTool, handleDeleteFile, handleListDirectory, listDirectoryTool } from './fileTools';
import { handleTerminalExec, terminalExecTool } from './terminalTools';
import { fetchUrlTool, handleFetchUrl } from './browserTools';
import { compute369Tool, handleCompute369, handleProject4DTesseract, project4DTesseractTool } from './spatialTools';

export class CubiOUniversalToolEngine implements IToolEngine {
  private tools: Map<string, UniversalToolDefinition> = new Map();
  private handlers: Map<string, (params: Record<string, unknown>) => Promise<unknown>> = new Map();

  private permissionController = new PermissionController();
  private scopeValidator = new ScopeValidator();
  private authGate = new ToolAuthorizationGate();
  private auditor = new ToolAuditor();

  private grantedPermissions: Set<ToolPermissionLevel> = new Set([
    'READ_ONLY',
    'WORKSPACE_WRITE',
    'NETWORK_ACCESS',
    'DATABASE_ACCESS',
  ]);

  constructor() {
    this.registerBuiltinTools();
  }

  private registerBuiltinTools() {
    // Category 1: Filesystem
    this.registerTool(fsReadFileTool, handleFsReadFile);
    this.registerTool(fsWriteFileTool, handleFsWriteFile);
    this.registerTool(listDirectoryTool, handleListDirectory);
    this.registerTool(deleteFileTool, handleDeleteFile);

    // Category 2: APIs
    this.registerTool(httpGetTool, handleHttpGet);
    this.registerTool(httpPostTool, handleHttpPost);

    // Category 3: Databases
    this.registerTool(dbQueryTool, handleDbQuery);
    this.registerTool(dbSetTool, handleDbSet);

    // Category 4: Search
    this.registerTool(webSearchTool, handleWebSearch);
    this.registerTool(vectorSearchTool, handleVectorSearch);

    // Category 5: Calculators
    this.registerTool(mathEvalTool, handleMathEval);
    this.registerTool(matrixMultiplyTool, handleMatrixMult);

    // Category 6: Developer Tools
    this.registerTool(lintCodeTool, handleLintCode);
    this.registerTool(gitStatusTool, handleGitStatus);

    // Category 7: Project Tools
    this.registerTool(inspectProjectTool, handleInspectProject);
    this.registerTool(checkDependenciesTool, handleCheckDependencies);

    // Legacy Support
    this.registerTool(terminalExecTool, handleTerminalExec);
    this.registerTool(fetchUrlTool, handleFetchUrl);
    this.registerTool(compute369Tool, handleCompute369);
    this.registerTool(project4DTesseractTool, handleProject4DTesseract);
  }

  public registerTool(
    tool: UniversalToolDefinition,
    handler: (params: Record<string, unknown>) => Promise<unknown>
  ): void {
    this.tools.set(tool.toolId, tool);
    this.handlers.set(tool.toolId, handler);
  }

  public listTools(category?: ToolCategory): readonly UniversalToolDefinition[] {
    const all = Array.from(this.tools.values());
    if (!category) return Object.freeze(all);
    return Object.freeze(all.filter((t) => t.category === category));
  }

  public approveToolGate(gateId: string, token: string): boolean {
    return this.authGate.approveGate(gateId, token);
  }

  public generateApprovalToken(gateId: string): string {
    return this.authGate.generateApprovalToken(gateId);
  }

  public getAuditTrail(): readonly ToolAuditRecord[] {
    return this.auditor.getTrail();
  }

  /**
   * Invokes a tool through the full 6-pillar lifecycle:
   * 1. Permission -> 2. Scope -> 3. Authorization -> 4. Execution -> 5. Result -> 6. Audit
   */
  public async invokeTool(
    request: ToolInvocationRequest
  ): Promise<Readonly<ToolInvocationResult>> {
    const startTime = Date.now();
    const tool = this.tools.get(request.toolId);
    const handler = this.handlers.get(request.toolId);

    const defaultScope: ToolScope = request.scope || tool?.defaultScope || { isGlobal: true };

    if (!tool || !handler) {
      const audit = this.auditor.recordAudit(
        request.toolId,
        'DEVELOPER_TOOLS',
        'READ_ONLY',
        defaultScope,
        false,
        1,
        'FAILURE'
      );

      return Object.freeze({
        toolId: request.toolId,
        success: false,
        output: null,
        error: `Tool "${request.toolId}" is not registered in the CubiO Tool Engine.`,
        executionTimeMs: 1,
        executionChecksum: deterministicHash(`TOOL_NOT_FOUND:${request.toolId}`),
        auditRecord: audit,
      });
    }

    // Pillar 1: Permission Check
    const hasPermission = this.permissionController.checkPermission(tool, this.grantedPermissions);
    if (!hasPermission) {
      const audit = this.auditor.recordAudit(
        tool.toolId,
        tool.category,
        tool.permissionLevel,
        defaultScope,
        false,
        1,
        'BLOCKED'
      );
      return Object.freeze({
        toolId: tool.toolId,
        success: false,
        output: null,
        error: `PERMISSION_DENIED: Permission "${tool.permissionLevel}" is not granted for tool "${tool.name}".`,
        executionTimeMs: 1,
        executionChecksum: deterministicHash(`PERM_DENIED:${tool.toolId}`),
        auditRecord: audit,
      });
    }

    // Pillar 2: Scope Validation
    const scopeCheck = this.scopeValidator.validateScope(request.parameters, defaultScope);
    if (!scopeCheck.inScope) {
      const audit = this.auditor.recordAudit(
        tool.toolId,
        tool.category,
        tool.permissionLevel,
        defaultScope,
        false,
        1,
        'BLOCKED'
      );
      return Object.freeze({
        toolId: tool.toolId,
        success: false,
        output: null,
        error: `SCOPE_VIOLATION: ${scopeCheck.reason}`,
        executionTimeMs: 1,
        executionChecksum: deterministicHash(`SCOPE_VIOLATION:${tool.toolId}`),
        auditRecord: audit,
      });
    }

    // Pillar 3: Authorization Gate
    const gateRecord = this.authGate.evaluateAuthorization(tool, request.authorizationToken);
    if (gateRecord.status !== 'APPROVED' && request.permissionGranted !== true) {
      const audit = this.auditor.recordAudit(
        tool.toolId,
        tool.category,
        tool.permissionLevel,
        defaultScope,
        false,
        1,
        'BLOCKED'
      );
      return Object.freeze({
        toolId: tool.toolId,
        success: false,
        output: null,
        error: `AUTHORIZATION_REQUIRED: Tool "${tool.name}" (${tool.toolId}) requires explicit authorization. Gate ID: ${gateRecord.gateId}`,
        executionTimeMs: 1,
        executionChecksum: deterministicHash(`AUTH_REQUIRED:${gateRecord.gateId}`),
        authorizationGate: gateRecord,
        auditRecord: audit,
      });
    }

    // Pillar 4: Execution
    try {
      const output = await handler(request.parameters);
      const executionTimeMs = Math.max(1, Date.now() - startTime);

      // Pillar 5: Result
      const executionChecksum = deterministicHash(
        `TOOL_EXEC:${tool.toolId}:${JSON.stringify(output)}:${executionTimeMs}`
      );

      // Pillar 6: Audit
      const audit = this.auditor.recordAudit(
        tool.toolId,
        tool.category,
        tool.permissionLevel,
        defaultScope,
        true,
        executionTimeMs,
        'SUCCESS'
      );

      return Object.freeze({
        toolId: tool.toolId,
        success: true,
        output,
        executionTimeMs,
        executionChecksum,
        authorizationGate: gateRecord,
        auditRecord: audit,
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      const executionTimeMs = Math.max(1, Date.now() - startTime);

      const audit = this.auditor.recordAudit(
        tool.toolId,
        tool.category,
        tool.permissionLevel,
        defaultScope,
        true,
        executionTimeMs,
        'FAILURE'
      );

      return Object.freeze({
        toolId: tool.toolId,
        success: false,
        output: null,
        error: errorMsg,
        executionTimeMs,
        executionChecksum: deterministicHash(`TOOL_FAIL:${tool.toolId}:${errorMsg}`),
        authorizationGate: gateRecord,
        auditRecord: audit,
      });
    }
  }
}
