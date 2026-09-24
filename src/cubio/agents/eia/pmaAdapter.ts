/**
 * CUBiO AI — 3D Memory Studio
 * AGENT-004 — EIA (Evidence & Audit Agent)
 * src/cubio/agents/eia/pmaAdapter.ts
 *
 * Sovereign PMA compatibility adapter for EIA.
 * Allows auditing of PMA Handoff Contracts, Review Verdicts, and RX Evidence
 * summaries without modifying core PMA files.
 */

import {
  PMAHandoffContract,
  PMAReviewVerdict,
} from '../../language/native/pma/types';
import { PMARxEvidenceSummary } from '../../language/native/pma/pmaRxEvidenceLifecycle';
import { EIAAuditScope, EIAAuditReport, EIAEvidenceArtifact } from './types';
import { EIAArtifactIdentity } from './artifactIdentity';
import { EIAAuditSealer } from './auditSealer';

export class EIAPmaAdapter {
  /**
   * Translates a PMAHandoffContract into an EIAAuditScope.
   */
  public static handoffToAuditScope(handoff: PMAHandoffContract): EIAAuditScope {
    const identity = new EIAArtifactIdentity();
    const artifacts: EIAEvidenceArtifact[] = [];

    // Fingerprint handoff contract itself as an in-memory artifact
    artifacts.push(
      identity.fingerprintPayload(
        `pma_handoff_${handoff.taskId}`,
        handoff,
        'PMA_HANDOFF',
        { handoffHash: handoff.handoffHash }
      )
    );

    // If allowedFiles exist on disk, add them as source file artifacts
    for (const file of handoff.allowedFiles) {
      try {
        artifacts.push(identity.fingerprintFile(file, 'SOURCE_FILE'));
      } catch {
        // File may be new or pending creation; skip or mark metadata
      }
    }

    return Object.freeze({
      taskId: handoff.taskId,
      objective: `Audit PMA Handoff: ${handoff.objective}`,
      artifacts: Object.freeze(artifacts),
      allowedFiles: handoff.allowedFiles,
      touchedFiles: handoff.relevantFiles,
      metadata: Object.freeze({
        reuseStrategy: handoff.reuseStrategy,
        primarySubsystem: handoff.scope.primarySubsystem,
        isApproved: handoff.isApprovedForDevelopment,
      }),
    });
  }

  /**
   * Translates a PMARxEvidenceSummary into an EIAAuditScope.
   */
  public static rxSummaryToAuditScope(summary: PMARxEvidenceSummary): EIAAuditScope {
    const identity = new EIAArtifactIdentity();
    const artifacts: EIAEvidenceArtifact[] = [];

    artifacts.push(
      identity.fingerprintPayload(
        `pma_rx_summary_${summary.taskId}`,
        summary,
        'STATE_T_TRANSITION',
        { masterProvenanceHash: summary.masterProvenanceHash }
      )
    );

    for (const file of summary.involvedFiles) {
      try {
        artifacts.push(identity.fingerprintFile(file, 'SOURCE_FILE'));
      } catch {
        // Ephemeral or deleted file
      }
    }

    return Object.freeze({
      taskId: summary.taskId,
      objective: `Audit PMA RX Lifecycle: ${summary.rxLifecycleId}`,
      artifacts: Object.freeze(artifacts),
      touchedFiles: summary.involvedFiles,
      metadata: Object.freeze({
        finalStage: summary.finalStage,
        eventCount: summary.totalEvidenceCount,
        finalVerdict: summary.finalVerdict,
      }),
    });
  }

  /**
   * Formats an audit report into a clean PMA pre-flight certificate markdown string.
   */
  public static formatPmaCertificate(report: EIAAuditReport): string {
    return EIAAuditSealer.formatAuditCertificate(report);
  }
}
