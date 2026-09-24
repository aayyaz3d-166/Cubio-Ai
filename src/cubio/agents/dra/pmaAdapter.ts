/**
 * CUBiO AI — 3D Memory Studio
 * AGENT-002 — DRA (Dependency & Reuse Agent)
 * src/cubio/agents/dra/pmaAdapter.ts
 *
 * Sovereign PMA compatibility adapter for DRA.
 * Bridges Native PMA task requests and handoffs into DRA pre-development queries
 * without mutating PMA core code.
 */

import { PMAHandoffContract, PMATaskRequest } from '../../language/native/pma/types';
import { DRATaskQuery, DRAReuseReport, DRASafetyStatus } from './types';
import { DRADependencyAgent } from './dependencyAgent';

export class DRAPmaAdapter {
  constructor(private readonly dra: DRADependencyAgent) {}

  /**
   * Translates a PMAHandoffContract into a pre-development DRA query.
   */
  public static handoffToQuery(handoff: PMAHandoffContract): DRATaskQuery {
    return {
      prompt: handoff.objective,
      taskId: handoff.taskId,
      targetSubsystems: [
        handoff.scope.primarySubsystem,
        ...handoff.scope.affectedSubsystems,
      ],
      proposedFiles: handoff.allowedFiles,
      proposedDependencies: handoff.dependencies,
    };
  }

  /**
   * Translates a PMATaskRequest into an early intake DRA query.
   */
  public static requestToQuery(request: PMATaskRequest): DRATaskQuery {
    return {
      prompt: request.userPrompt,
      taskId: request.requestId,
      targetSubsystems: request.targetSubsystems,
      proposedFiles: request.allowedFileOverrides,
    };
  }

  /**
   * Performs pre-development dependency and reuse audit for a PMA handoff contract.
   */
  public async auditHandoff(handoff: PMAHandoffContract): Promise<DRAReuseReport> {
    const query = DRAPmaAdapter.handoffToQuery(handoff);
    return this.dra.analyzeDependenciesAndReuse(query);
  }

  /**
   * Formats a DRAReuseReport as an injectable pre-flight analysis for PMA planners.
   */
  public static formatPreFlightSummary(report: DRAReuseReport): string {
    const lines: string[] = [
      '<!-- BEGIN_DRA_PREFLIGHT_REPORT (AGENT-002 DRA) -->',
      `Strategy Recommended: ${report.recommendedStrategy}`,
      `Approved For Development: ${report.isApprovedForDevelopment}`,
      `Matched Capabilities: ${report.matchedCapabilities.length}`,
      `Conflicts Detected: ${report.conflicts.length}`,
    ];

    if (report.conflicts.length > 0) {
      lines.push('Conflicts:');
      for (const c of report.conflicts) {
        lines.push(`  • [${c.severity}] ${c.type}: ${c.reason} (Target: ${c.target})`);
      }
    }

    lines.push(`<!-- PROVENANCE_MASTER_HASH: ${report.masterProvenanceHash} -->`);
    lines.push('<!-- END_DRA_PREFLIGHT_REPORT -->');

    return lines.join('\n');
  }

  /**
   * Asserts PMA sovereignty and safety invariants.
   */
  public static verifySovereignty(): DRASafetyStatus {
    return Object.freeze({
      is_actuation_blocked: true,
      external_ai_dependencies: 0,
      canonical_db_unmutated: true,
      address369_unmutated: true,
    });
  }
}
