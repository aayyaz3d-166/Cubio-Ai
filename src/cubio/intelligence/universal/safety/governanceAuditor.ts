/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F67: Governance Auditor
 *
 * Maintains an immutable audit ledger with cryptographic SHA-256 signatures.
 */

import { deterministicHash } from '../../../state/determinism';
import { ComplianceReport, SafetyAuditRecord } from './types';

export class GovernanceAuditor {
  private auditLog: SafetyAuditRecord[] = [];

  public recordAudit(
    requestPrompt: string,
    isAllowed: boolean,
    guardrailScore: number,
    violations: readonly string[]
  ): Readonly<SafetyAuditRecord> {
    const timestamp = Date.now();
    const signature = deterministicHash(
      `AUDIT_RECORD:${requestPrompt}:${isAllowed}:${guardrailScore}:${violations.join(';')}:${timestamp}`
    );
    const auditId = `AUDIT_${signature.slice(2, 10)}`;

    const record: SafetyAuditRecord = Object.freeze({
      auditId,
      requestPrompt,
      isAllowed,
      guardrailScore,
      violations: Object.freeze([...violations]),
      signature,
      timestamp,
    });

    this.auditLog.push(record);
    return record;
  }

  public generateComplianceReport(activeRulesCount: number): Readonly<ComplianceReport> {
    const totalAudits = this.auditLog.length;
    const allowedAudits = this.auditLog.filter((a) => a.isAllowed).length;
    const complianceScore = totalAudits > 0 ? Math.round((allowedAudits / totalAudits) * 100) : 100;
    const activeViolationsCount = totalAudits - allowedAudits;

    const reportChecksum = deterministicHash(
      `COMPLIANCE_REPORT:${totalAudits}:${allowedAudits}:${complianceScore}:${activeRulesCount}`
    );

    return Object.freeze({
      overallCompliant: complianceScore >= 80,
      complianceScore,
      totalAudits,
      activeRulesCount,
      activeViolationsCount,
      reportChecksum,
      timestamp: Date.now(),
    });
  }

  public getAuditLog(): readonly SafetyAuditRecord[] {
    return Object.freeze(this.auditLog);
  }
}
