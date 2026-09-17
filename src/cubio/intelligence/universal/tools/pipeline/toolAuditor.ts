/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F56: Tool Auditor
 *
 * Pillar 6: Immutable Cryptographic Audit Trail
 */

import { deterministicHash } from '../../../../state/determinism';
import { ToolAuditRecord, ToolCategory, ToolPermissionLevel, ToolScope } from '../types';

export class ToolAuditor {
  private auditTrail: ToolAuditRecord[] = [];
  private lastAuditChecksum: string = 'GENESIS_AUDIT_HASH';

  public recordAudit(
    toolId: string,
    category: ToolCategory,
    permission: ToolPermissionLevel,
    scope: ToolScope,
    authorized: boolean,
    executionTimeMs: number,
    status: 'SUCCESS' | 'FAILURE' | 'BLOCKED'
  ): ToolAuditRecord {
    const timestamp = Date.now();
    const auditId = `AUD_${deterministicHash(`${toolId}:${timestamp}:${status}`).slice(2, 10)}`;
    const auditChecksum = deterministicHash(
      `${this.lastAuditChecksum}:${auditId}:${toolId}:${status}:${executionTimeMs}`
    );

    this.lastAuditChecksum = auditChecksum;

    const record: ToolAuditRecord = Object.freeze({
      auditId,
      toolId,
      category,
      permission,
      scope: Object.freeze({ ...scope }),
      authorized,
      executionTimeMs,
      status,
      auditChecksum,
      timestamp,
    });

    this.auditTrail.push(record);
    return record;
  }

  public getTrail(): readonly ToolAuditRecord[] {
    return Object.freeze([...this.auditTrail]);
  }
}
