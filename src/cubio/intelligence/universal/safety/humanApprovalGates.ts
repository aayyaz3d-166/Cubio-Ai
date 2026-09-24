/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F67: Human Approval Gates
 *
 * Implements non-bypassable human approval gates for high-sensitivity actions.
 */

import { deterministicHash } from '../../../state/determinism';
import { HumanApprovalGateRecord, HumanApprovalStatus } from './types';

export class HumanApprovalGates {
  private gates: Map<string, HumanApprovalGateRecord> = new Map();

  public createGate(action: string, reason?: string): HumanApprovalGateRecord {
    const createdAt = Date.now();
    const expiresAt = createdAt + 1000 * 60 * 60; // 1 hour TTL
    const gateId = `GATE_${deterministicHash(`${action}:${createdAt}`).slice(2, 10)}`;

    const record: HumanApprovalGateRecord = Object.freeze({
      gateId,
      action,
      status: 'PENDING',
      reason: reason || `Action "${action}" requires explicit human sign-off before proceeding.`,
      createdAt,
      expiresAt,
    });

    this.gates.set(gateId, record);
    return record;
  }

  public approveGate(gateId: string): HumanApprovalGateRecord {
    const existing = this.gates.get(gateId);
    if (!existing) {
      throw new Error(`Gate ID "${gateId}" not found.`);
    }

    const token = `AUTH_TOKEN_${deterministicHash(`APPROVED:${gateId}:${Date.now()}`).slice(2, 14)}`;
    const approved: HumanApprovalGateRecord = Object.freeze({
      ...existing,
      status: 'APPROVED',
      token,
    });

    this.gates.set(gateId, approved);
    return approved;
  }

  public rejectGate(gateId: string, reason?: string): HumanApprovalGateRecord {
    const existing = this.gates.get(gateId);
    if (!existing) {
      throw new Error(`Gate ID "${gateId}" not found.`);
    }

    const rejected: HumanApprovalGateRecord = Object.freeze({
      ...existing,
      status: 'REJECTED',
      reason: reason || 'Action explicitly rejected by human operator.',
    });

    this.gates.set(gateId, rejected);
    return rejected;
  }

  public verifyToken(action: string, token?: string, consume: boolean = false): boolean {
    if (!token) return false;
    for (const [gateId, gate] of this.gates.entries()) {
      if (gate.action === action && gate.status === 'APPROVED' && gate.token === token) {
        if (consume) {
          this.gates.set(gateId, Object.freeze({ ...gate, status: 'REJECTED' }));
        }
        return true;
      }
    }
    return false;
  }

  public consumeToken(action: string, token?: string): boolean {
    return this.verifyToken(action, token, true);
  }

  public getGate(gateId: string): HumanApprovalGateRecord | undefined {
    return this.gates.get(gateId);
  }
}
