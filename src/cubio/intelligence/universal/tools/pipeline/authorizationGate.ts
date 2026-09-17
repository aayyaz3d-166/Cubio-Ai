/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F56: Tool Authorization Gate
 *
 * Pillar 3: Authorization Gate for destructive and sensitive tools.
 */

import { deterministicHash } from '../../../../state/determinism';
import { ToolAuthorizationGateRecord, UniversalToolDefinition } from '../types';

export class ToolAuthorizationGate {
  private activeGates: Map<string, ToolAuthorizationGateRecord> = new Map();

  public evaluateAuthorization(
    tool: UniversalToolDefinition,
    providedToken?: string
  ): ToolAuthorizationGateRecord {
    if (!tool.isDestructive && tool.permissionLevel !== 'SYSTEM_EXECUTE') {
      const gateId = `GATE_${deterministicHash(`SAFE:${tool.toolId}`).slice(2, 10)}`;
      return Object.freeze({
        gateId,
        level: 'AUTO_APPROVED',
        status: 'APPROVED',
        riskAssessment: 'Non-destructive operation auto-approved.',
      });
    }

    const gateId = `GATE_${deterministicHash(`AUTH:${tool.toolId}:${Date.now()}`).slice(2, 10)}`;
    const isValidToken = Boolean(providedToken && (providedToken.startsWith('AUTH_TOKEN_') || providedToken.startsWith('VALID_')));

    const record: ToolAuthorizationGateRecord = Object.freeze({
      gateId,
      level: 'REQUIRES_USER_CONFIRMATION',
      status: isValidToken ? 'APPROVED' : 'PENDING',
      authorizationToken: providedToken,
      riskAssessment: tool.isDestructive
        ? 'Destructive operation requires explicit human confirmation.'
        : 'Privileged tool requires authorization token.',
    });

    this.activeGates.set(gateId, record);
    return record;
  }

  public approveGate(gateId: string, token: string): boolean {
    const record = this.activeGates.get(gateId);
    if (!record) return false;

    const updated: ToolAuthorizationGateRecord = Object.freeze({
      ...record,
      status: 'APPROVED',
      authorizationToken: token,
      riskAssessment: 'Authorized via confirmed operator token.',
    });

    this.activeGates.set(gateId, updated);
    return true;
  }

  public generateApprovalToken(gateId: string): string {
    return `AUTH_TOKEN_${deterministicHash(`GATE_APPROVE:${gateId}`).slice(2, 12)}`;
  }
}
