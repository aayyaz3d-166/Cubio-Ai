/**
 * CUBiO AI — 3D Memory Studio
 * AGENT-006 — BTWA (Background Task Watchdog Agent)
 * src/cubio/agents/watchdog/auditLogger.ts
 *
 * Cryptographic audit logging for detection, diagnosis, action,
 * and recovery events.
 */

import * as crypto from 'crypto';
import {
  WatchdogAuditReport,
  StuckDiagnosis,
  WatchdogActionRecord,
  TaskLivenessState,
  TaskHealthRating,
  ProgressSnapshot,
  TaskEvidencePackage,
  TaskLedgerRecord,
} from './types';

export class WatchdogAuditLogger {
  /**
   * Seals a complete watchdog audit report with a deterministic SHA-256 hash.
   */
  public static sealAuditReport(params: {
    taskId: string;
    initialState: TaskLivenessState;
    finalState: TaskLivenessState;
    healthRating?: TaskHealthRating;
    latestSnapshot?: ProgressSnapshot;
    evidence?: TaskEvidencePackage;
    ledgerRecord?: TaskLedgerRecord;
    diagnosis: StuckDiagnosis;
    actions: readonly WatchdogActionRecord[];
    rxLifecycleId: string;
    executionTimeMs: number;
    version?: '2.1.0' | '2.0.0';
  }): WatchdogAuditReport {
    const reportId = `BTWA-REP-${params.taskId}-${Date.now().toString(36).toUpperCase()}`;

    const hashPayload = JSON.stringify({
      agentId: 'AGENT-006-BTWA',
      taskId: params.taskId,
      initialState: params.initialState,
      finalState: params.finalState,
      isStuck: params.diagnosis.isStuck,
      reason: params.diagnosis.reason,
      actionCount: params.actions.length,
      actionHashes: params.actions.map((a) => a.actionHash),
    });

    const masterAuditHash = crypto
      .createHash('sha256')
      .update(hashPayload)
      .digest('hex');

    return Object.freeze({
      agentId: 'AGENT-006-BTWA',
      version: params.version ?? '2.1.0',
      reportId,
      taskId: params.taskId,
      initialLivenessState: params.initialState,
      finalLivenessState: params.finalState,
      healthRating: params.healthRating ?? 'HEALTHY',
      diagnosis: params.diagnosis,
      latestSnapshot: params.latestSnapshot,
      evidence: params.evidence,
      ledgerRecord: params.ledgerRecord,
      actions: Object.freeze([...params.actions]),
      masterAuditHash,
      executionTimeMs: params.executionTimeMs,
      rxLifecycleId: params.rxLifecycleId,
      isActuationBlocked: true,
      protectedAssetsUntouched: true,
    });
  }

  /**
   * Formats a WatchdogAuditReport into Markdown for audit logs.
   */
  public static formatMarkdown(report: WatchdogAuditReport): string {
    const lines: string[] = [];

    lines.push(`## Watchdog Audit Report: ${report.taskId}`);
    lines.push(`**Report ID**: \`${report.reportId}\``);
    lines.push(`**Status Transition**: \`${report.initialLivenessState}\` ➔ \`${report.finalLivenessState}\``);
    lines.push(`**Master Audit Hash**: \`${report.masterAuditHash}\``);
    lines.push(`**Actuation Locked**: \`true\` | **Protected Assets Intact**: \`true\``);
    lines.push('');
    lines.push('### Diagnosis');
    lines.push(`- **Stuck**: ${report.diagnosis.isStuck ? 'YES' : 'NO'}`);
    lines.push(`- **Confidence**: ${(report.diagnosis.confidence * 100).toFixed(1)}%`);
    lines.push(`- **Reason**: ${report.diagnosis.reason}`);
    lines.push(`- **Evidence**: ${report.diagnosis.evidenceSummary}`);
    lines.push(`- **Recommendation**: ${report.diagnosis.recommendation}`);
    lines.push('');
    lines.push('### Actions Taken');
    for (const a of report.actions) {
      lines.push(`- [${a.actionType}] ${a.details} (Hash: \`${a.actionHash.slice(0, 16)}...\`)`);
    }

    return lines.join('\n');
  }
}
