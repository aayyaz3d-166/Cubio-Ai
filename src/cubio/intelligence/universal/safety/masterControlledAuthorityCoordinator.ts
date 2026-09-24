/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F67: Master Controlled Authority Coordinator
 *
 * The definitive shield enforcing controlled authority around the Master Orchestrator.
 * Guaranteed Invariant: Koi sensitive autonomous action authorization ke baghair execute na ho.
 */

import {
  ControlledAuthorityExecutionRequest,
  ControlledAuthorityExecutionResponse,
  HumanApprovalGateRecord,
  IMasterControlledAuthorityCoordinator,
  RollbackSnapshot,
} from './types';
import { PermissionEngine } from './permissionEngine';
import { HumanApprovalGates } from './humanApprovalGates';
import { ToolAuthorizer } from './toolAuthorizer';
import { AgentAuthorityLimiter } from './agentAuthorityLimits';
import { FilesystemScopeGuard } from './filesystemScopeGuard';
import { ApiScopeGuard } from './apiScopeGuard';
import { SecretProtectionFilter } from './secretProtection';
import { ActionAuditorLedger } from './actionAuditor';
import { RollbackEngine } from './rollbackEngine';

export class CubiOMasterControlledAuthorityCoordinator
  implements IMasterControlledAuthorityCoordinator
{
  private permissions = new PermissionEngine();
  private approvalGates = new HumanApprovalGates();
  private toolAuthorizer = new ToolAuthorizer();
  private agentLimiter = new AgentAuthorityLimiter();
  private fsGuard = new FilesystemScopeGuard();
  private apiGuard = new ApiScopeGuard();
  private secretFilter = new SecretProtectionFilter();
  private auditorLedger = new ActionAuditorLedger();
  private rollbackEngine = new RollbackEngine();

  /**
   * Main gatekeeper: inspects and authorizes any autonomous action before execution.
   */
  public async authorizeAndInspectAction(
    request: ControlledAuthorityExecutionRequest
  ): Promise<Readonly<ControlledAuthorityExecutionResponse>> {
    // Check 0: Emergency cancellation token
    if (request.cancellationToken?.isCancelled) {
      const auditBlock = this.auditorLedger.recordAction(
        request.actionName,
        false,
        `Aborted: ${request.cancellationToken.cancellationReason || 'Cancelled by operator.'}`
      );
      return Object.freeze({
        isAuthorized: false,
        executionPermitted: false,
        auditBlock,
        sanitizedParams: {},
        error: `Action aborted by cancellation token: ${request.cancellationToken.cancellationReason || 'Cancelled by operator.'}`,
      });
    }

    // 1. Secret Sanitization on input parameters
    const sanitizedParams = request.params
      ? this.secretFilter.sanitizeObject(request.params)
      : {};

    // 2. Deny-by-Default Permission Check
    const hasPermission = this.permissions.checkPermission(
      request.agentId,
      request.requestedPermission
    );
    if (!hasPermission) {
      const auditBlock = this.auditorLedger.recordAction(
        request.actionName,
        false,
        `Permission Denied: Agent "${request.agentId}" lacks "${request.requestedPermission}"`
      );
      return Object.freeze({
        isAuthorized: false,
        executionPermitted: false,
        auditBlock,
        sanitizedParams,
        error: `PERMISSION_DENIED: Agent "${request.agentId}" is not granted "${request.requestedPermission}" (Deny-by-default policy).`,
      });
    }

    // 3. Agent Authority Bounds Validation
    const agentCheck = this.agentLimiter.validateAgentCall(request.agentId, 1, 0);
    if (!agentCheck.valid) {
      const auditBlock = this.auditorLedger.recordAction(
        request.actionName,
        false,
        `Agent Bound Exceeded: ${agentCheck.reason}`
      );
      return Object.freeze({
        isAuthorized: false,
        executionPermitted: false,
        auditBlock,
        sanitizedParams,
        error: agentCheck.reason,
      });
    }

    // 4. Filesystem Scope Validation (if path provided)
    if (request.workspacePath) {
      const isWrite = request.requestedPermission === 'WORKSPACE_WRITE' || request.requestedPermission === 'SYSTEM_WRITE';
      const fsCheck = this.fsGuard.validatePath(request.workspacePath, isWrite);
      if (!fsCheck.inScope) {
        const auditBlock = this.auditorLedger.recordAction(
          request.actionName,
          false,
          `FS Violation: ${fsCheck.error}`
        );
        return Object.freeze({
          isAuthorized: false,
          executionPermitted: false,
          auditBlock,
          sanitizedParams,
          error: fsCheck.error,
        });
      }
    }

    // 5. API Scope Validation (if URL provided)
    if (request.targetApiUrl) {
      const apiCheck = this.apiGuard.validateUrl(request.targetApiUrl);
      if (!apiCheck.allowed) {
        const auditBlock = this.auditorLedger.recordAction(
          request.actionName,
          false,
          `API Scope Violation: ${apiCheck.error}`
        );
        return Object.freeze({
          isAuthorized: false,
          executionPermitted: false,
          auditBlock,
          sanitizedParams,
          error: apiCheck.error,
        });
      }
    }

    // 6. Sensitive Action Human Approval Gate Check
    const isSensitive = /deploy_prod|system_write|secret_access|destroy|format/i.test(
      `${request.actionName}_${request.requestedPermission}`
    );

    let approvalGate: HumanApprovalGateRecord | undefined;
    if (isSensitive) {
      const hasValidToken = this.approvalGates.verifyToken(
        request.actionName,
        request.authorizationToken
      );

      if (!hasValidToken) {
        approvalGate = this.approvalGates.createGate(
          request.actionName,
          `Action "${request.actionName}" requires sovereign human approval.`
        );

        const auditBlock = this.auditorLedger.recordAction(
          request.actionName,
          false,
          `Awaiting Human Approval Gate: ${approvalGate.gateId}`
        );

        return Object.freeze({
          isAuthorized: false,
          executionPermitted: false,
          approvalGate,
          auditBlock,
          sanitizedParams,
          error: `AWAITING_HUMAN_APPROVAL: Action "${request.actionName}" is sensitive and held at approval gate "${approvalGate.gateId}".`,
        });
      }
    }

    // 7. Pre-execution Rollback Snapshot Capture
    let rollbackSnapshotId: string | undefined;
    if (request.stateBeforeMutation !== undefined) {
      const snap = this.rollbackEngine.captureSnapshot(
        request.actionName,
        request.stateBeforeMutation
      );
      rollbackSnapshotId = snap.snapshotId;
    }

    // 8. Final Authorization & Hash-Chained Audit Record
    const auditBlock = this.auditorLedger.recordAction(
      request.actionName,
      true,
      `Authorized & Passed all 11 Controlled Authority Invariants.`
    );

    return Object.freeze({
      isAuthorized: true,
      executionPermitted: true,
      approvalGate,
      auditBlock,
      rollbackSnapshotId,
      sanitizedParams,
    });
  }

  public issueHumanApproval(gateId: string): HumanApprovalGateRecord {
    return this.approvalGates.approveGate(gateId);
  }

  public rollbackAction(snapshotId: string): { success: boolean; snapshot: RollbackSnapshot } {
    return this.rollbackEngine.rollback(snapshotId);
  }

  public getPermissionEngine(): PermissionEngine {
    return this.permissions;
  }

  public getApprovalGates(): HumanApprovalGates {
    return this.approvalGates;
  }
}
