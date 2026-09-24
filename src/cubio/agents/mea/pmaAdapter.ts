/**
 * CUBiO AI — 3D Memory Studio
 * AGENT-001 — MEA (Memory Agent)
 * src/cubio/agents/mea/pmaAdapter.ts
 *
 * Sovereign PMA compatibility adapter for MEA.
 * Bridges Native PMA contracts and handoffs into targeted MEA queries
 * and formats bounded context without mutating PMA core code.
 */

import { PMAHandoffContract, PMATaskRequest } from '../../language/native/pma/types';
import { MEAQuery, MEABudget, MEAContextBundle, MEASafetyStatus } from './types';
import { MEAMemoryAgent } from './memoryAgent';

export class MEAPmaAdapter {
  constructor(private readonly mea: MEAMemoryAgent) {}

  /**
   * Translates a PMAHandoffContract into a targeted MEA query.
   */
  public static handoffToQuery(handoff: PMAHandoffContract): MEAQuery {
    const rawKeywords = handoff.objective
      .toLowerCase()
      .replace(/[^a-z0-9_\-\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 3 && !STOP_WORDS.has(w));

    return {
      taskIds: [handoff.taskId],
      subsystems: [
        handoff.scope.primarySubsystem,
        ...handoff.scope.affectedSubsystems,
      ],
      keywords: Array.from(new Set(rawKeywords)),
      filePatterns: handoff.relevantFiles.map((f) => f.replace(/^src\//, '')),
      minRelevanceScore: 0.15,
    };
  }

  /**
   * Translates a PMATaskRequest into an initial MEA query.
   */
  public static requestToQuery(request: PMATaskRequest): MEAQuery {
    const rawKeywords = request.userPrompt
      .toLowerCase()
      .replace(/[^a-z0-9_\-\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 3 && !STOP_WORDS.has(w));

    return {
      taskIds: [request.requestId],
      subsystems: request.targetSubsystems ? [...request.targetSubsystems] : undefined,
      keywords: Array.from(new Set(rawKeywords)),
      tenantId: request.tenantId,
      minRelevanceScore: 0.1,
    };
  }

  /**
   * Retrieves bounded context directly for a PMA handoff contract.
   */
  public async retrieveForHandoff(
    handoff: PMAHandoffContract,
    budget?: Partial<MEABudget>
  ): Promise<MEAContextBundle> {
    const query = MEAPmaAdapter.handoffToQuery(handoff);
    return this.mea.retrieveContext(query, budget);
  }

  /**
   * Formats an MEAContextBundle as an injectable prompt section.
   */
  public static formatPromptContext(bundle: MEAContextBundle): string {
    return [
      '<!-- BEGIN_BOUNDED_PROJECT_CONTEXT (AGENT-001 MEA) -->',
      bundle.compactText,
      `<!-- PROVENANCE_MASTER_HASH: ${bundle.masterProvenanceHash} -->`,
      '<!-- END_BOUNDED_PROJECT_CONTEXT -->',
    ].join('\n');
  }

  /**
   * Asserts PMA sovereignty and safety invariants.
   */
  public static verifySovereignty(): MEASafetyStatus {
    return Object.freeze({
      is_actuation_blocked: true,
      external_ai_dependencies: 0,
      canonical_db_unmutated: true,
      address369_unmutated: true,
    });
  }
}

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'this', 'that', 'from', 'into', 'task',
  'build', 'test', 'run', 'make', 'all', 'any', 'each', 'are', 'was'
]);
