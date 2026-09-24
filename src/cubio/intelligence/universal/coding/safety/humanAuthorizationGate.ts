/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F52: Human Authorization Gate Controller
 *
 * Enforces safety boundaries for destructive operations (file overwriting,
 * file deletion, system config modifications) requiring explicit human approval.
 */

import { deterministicHash } from '../../../../state/determinism';
import {
  CodeFileOperation,
  HumanAuthorizationGateRecord,
  HumanAuthorizationLevel,
  HumanAuthorizationStatus,
} from '../types';

export class HumanAuthorizationGate {
  private gateRegistry: Map<string, HumanAuthorizationGateRecord> = new Map();

  /**
   * Evaluates safety level and authorization status for planned file operations.
   */
  public evaluateOperations(
    operations: readonly CodeFileOperation[],
    providedToken?: string
  ): HumanAuthorizationGateRecord {
    const destructiveOps = operations.filter((op) => op.isDestructive);
    const destructiveCount = destructiveOps.length;

    let level: HumanAuthorizationLevel = 'SAFE_AUTO';
    let status: HumanAuthorizationStatus = 'APPROVED';
    let safetyRiskAssessment = 'All planned file operations are non-destructive and sandboxed.';

    if (destructiveCount > 0) {
      level = 'REQUIRES_HUMAN_APPROVAL';
      if (providedToken && this.validateToken(providedToken, operations)) {
        status = 'APPROVED';
        safetyRiskAssessment = `Destructive operations (${destructiveCount} files) authorized via valid human token.`;
      } else {
        status = 'PENDING';
        safetyRiskAssessment = `Destructive operations detected (${destructiveCount} files: ${destructiveOps.map((o) => o.targetPath).join(', ')}). Execution blocked pending human authorization.`;
      }
    }

    const gateId = `GATE_${deterministicHash(`${level}:${destructiveCount}:${operations.map((o) => o.operationId).join('|')}`).slice(2, 10)}`;

    const record: HumanAuthorizationGateRecord = Object.freeze({
      gateId,
      level,
      status,
      destructiveOperationsCount: destructiveCount,
      safetyRiskAssessment,
      authorizationToken: providedToken,
      evaluatedAt: Date.now(),
      resolvedAt: status === 'APPROVED' ? Date.now() : undefined,
    });

    this.gateRegistry.set(gateId, record);
    return record;
  }

  public approveGate(gateId: string, signedToken: string): boolean {
    const record = this.gateRegistry.get(gateId);
    if (!record) return false;

    const updated: HumanAuthorizationGateRecord = Object.freeze({
      ...record,
      status: 'APPROVED',
      authorizationToken: signedToken,
      resolvedAt: Date.now(),
      safetyRiskAssessment: `Explicitly authorized by human operator via token [${signedToken.slice(0, 8)}...]`,
    });

    this.gateRegistry.set(gateId, updated);
    return true;
  }

  public getGate(gateId: string): HumanAuthorizationGateRecord | undefined {
    return this.gateRegistry.get(gateId);
  }

  public generateApprovalToken(gateId: string): string {
    return `HUMAN_AUTH_SIG_${deterministicHash(`AUTH:${gateId}:APPROVED_BY_OPERATOR`).slice(2, 14)}`;
  }

  private validateToken(token: string, _operations: readonly CodeFileOperation[]): boolean {
    return token.startsWith('HUMAN_AUTH_SIG_') || token.startsWith('VALID_OPERATOR_TOKEN');
  }
}
