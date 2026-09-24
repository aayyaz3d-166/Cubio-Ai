/**
 * CUBiO AI — 3D Memory Studio
 * AGENT-004 — EIA (Evidence & Audit Agent)
 * src/cubio/agents/eia/auditSealer.ts
 *
 * Audit sealing engine.
 * Computes deterministic master audit hashes, classifies audit verdicts,
 * seals immutable EIAAuditReport instances, and renders markdown audit certificates.
 */

import * as crypto from 'crypto';
import {
  EIAAuditReport,
  EIAAuditScope,
  EIADiscrepancy,
  EIAAuditStatus,
  EIAEvidenceArtifact,
  EIAChainOfCustodyStep,
} from './types';

export class EIAAuditSealer {
  /**
   * Seals the audit scope into an immutable, cryptographically anchored EIAAuditReport.
   */
  public static sealAudit(params: {
    taskId: string;
    scope: EIAAuditScope;
    artifacts: readonly EIAEvidenceArtifact[];
    custodySteps: readonly EIAChainOfCustodyStep[];
    discrepancies: readonly EIADiscrepancy[];
    rxLifecycleId: string;
    executionTimeMs: number;
  }): EIAAuditReport {
    const auditId = `AUDIT-${params.taskId}-${Date.now().toString(36).toUpperCase()}`;

    const criticalDiscrepancies = params.discrepancies.filter(
      (d) => d.severity === 'CRITICAL'
    );
    const warningDiscrepancies = params.discrepancies.filter(
      (d) => d.severity === 'WARNING'
    );

    let status: EIAAuditStatus = 'CERTIFIED_SEALED';
    if (criticalDiscrepancies.length > 0) {
      status = 'REJECTED_CORRUPTED';
    } else if (warningDiscrepancies.length > 0) {
      status = 'DISCREPANCY_FLAGGED';
    }

    const totalArtifacts = params.artifacts.length;
    const corruptedArtifacts = params.discrepancies.filter(
      (d) => d.type === 'HASH_MISMATCH' || d.type === 'MISSING_ARTIFACT'
    ).length;
    const verifiedArtifacts = Math.max(0, totalArtifacts - corruptedArtifacts);

    const totalTransitions = params.scope.transitions?.length || 0;
    const invalidTransitions = params.discrepancies.filter(
      (d) => d.type === 'OUT_OF_ORDER' || d.type === 'STAGE_SKIPPED'
    ).length;
    const validTransitions = Math.max(0, totalTransitions - invalidTransitions);

    // Compute bit-exact deterministic master audit hash
    const sortedArtifacts = [...params.artifacts]
      .map((a) => `${a.uri}:${a.contentHash}`)
      .sort();

    const lastCustodyHash =
      params.custodySteps.length > 0
        ? params.custodySteps[params.custodySteps.length - 1].stepHash
        : 'GENESIS';

    const sortedDiscrepancies = [...params.discrepancies]
      .map((d) => `${d.severity}:${d.type}:${d.targetReference}`)
      .sort();

    const hashPayload = JSON.stringify({
      agentId: 'AGENT-004-EIA',
      taskId: params.taskId,
      status,
      totalArtifacts,
      verifiedArtifacts,
      corruptedArtifacts,
      totalTransitions,
      validTransitions,
      sortedArtifacts,
      lastCustodyHash,
      sortedDiscrepancies,
    });

    const masterAuditHash = crypto
      .createHash('sha256')
      .update(hashPayload)
      .digest('hex');

    return Object.freeze({
      agentId: 'AGENT-004-EIA',
      version: '1.0.0',
      auditId,
      taskId: params.taskId,
      status,
      totalArtifacts,
      verifiedArtifacts,
      corruptedArtifacts,
      totalTransitions,
      validTransitions,
      chainOfCustody: Object.freeze([...params.custodySteps]),
      discrepancies: Object.freeze([...params.discrepancies]),
      masterAuditHash,
      executionTimeMs: params.executionTimeMs,
      rxLifecycleId: params.rxLifecycleId,
      isActuationBlocked: true,
    });
  }

  /**
   * Formats an EIAAuditReport into a Markdown audit certificate.
   */
  public static formatAuditCertificate(report: EIAAuditReport): string {
    const lines: string[] = [];

    lines.push('====================================================================');
    lines.push('  CUBiO AI — EIA (Evidence & Audit Agent) Sealed Audit Certificate  ');
    lines.push('====================================================================');
    lines.push(`Audit ID:       ${report.auditId}`);
    lines.push(`Task ID:        ${report.taskId}`);
    lines.push(`Audit Status:   ${report.status}`);
    lines.push(`Master Hash:    ${report.masterAuditHash}`);
    lines.push(`Lifecycle ID:   ${report.rxLifecycleId}`);
    lines.push(`Artifacts:      ${report.verifiedArtifacts}/${report.totalArtifacts} verified (${report.corruptedArtifacts} corrupted)`);
    lines.push(`Custody Steps:  ${report.chainOfCustody.length} recorded`);
    lines.push(`Discrepancies:  ${report.discrepancies.length} detected`);
    lines.push(`Actuation Lock: LOCKED (is_actuation_blocked === true)`);
    lines.push('--------------------------------------------------------------------');

    if (report.discrepancies.length > 0) {
      lines.push('DISCREPANCY FINDINGS:');
      for (const d of report.discrepancies) {
        lines.push(`  - [${d.severity}] ${d.type}: ${d.description} (${d.targetReference})`);
      }
      lines.push('--------------------------------------------------------------------');
    }

    lines.push(`FINAL VERDICT:  ${report.status === 'CERTIFIED_SEALED' ? 'PASS (SEALED)' : report.status}`);
    lines.push('====================================================================');

    return lines.join('\n');
  }
}
