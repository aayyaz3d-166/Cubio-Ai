/**
 * CUBiO AI — Task 194: Native Research and Information Synthesis
 * src/cubio/model/native_research_synthesis/researchSynthesisCoordinator.ts
 *
 * Master Orchestrator for Research Synthesis, Epistemic Partitioning,
 * Phase 10 Reasoning Advisory Integration, and Actuation Lockout.
 */

import {
  TASK_194_ID,
  IS_ACTUATION_BLOCKED,
  ResearchQuery,
  ResearchSynthesisDossier,
  Phase10SynthesisAdvisory,
  ResearchEpistemicState,
  ResearchActuationBlockedError,
  ResearchTenantViolationError,
} from './types';
import { ResearchSynthesizer, ResearchContextInput } from './researchSynthesizer';

export class ResearchSynthesisCoordinator {
  private readonly tenantId: string;
  private readonly advisories: Phase10SynthesisAdvisory[] = [];

  constructor(tenantId: string) {
    if (!tenantId || tenantId.trim().length === 0) {
      throw new ResearchTenantViolationError('Tenant ID cannot be empty');
    }
    this.tenantId = tenantId;
  }

  public getTenantId(): string {
    return this.tenantId;
  }

  /**
   * Executes research synthesis over supplied context, produces a dossier,
   * and emits a Phase 10 reasoning advisory.
   */
  public synthesizeResearch(
    query: ResearchQuery,
    context: ResearchContextInput,
    timestamp: number = 1000
  ): ResearchSynthesisDossier {
    this.assertActuationBlocked();

    if (query.tenantId !== this.tenantId) {
      throw new ResearchTenantViolationError(
        `Query tenant '${query.tenantId}' does not match coordinator tenant '${this.tenantId}'`
      );
    }

    const dossier = ResearchSynthesizer.synthesize(query, context, timestamp);

    // Build breakdown for advisory
    const breakdown: Record<ResearchEpistemicState, number> = {
      FACT: dossier.conclusionsByState.FACT.length,
      DERIVED: dossier.conclusionsByState.DERIVED.length,
      THEORY: dossier.conclusionsByState.THEORY.length,
      HYPOTHESIS: dossier.conclusionsByState.HYPOTHESIS.length,
      UNKNOWN: dossier.conclusionsByState.UNKNOWN.length,
    };

    const advisory: Phase10SynthesisAdvisory = {
      advisoryId: `ADV-SYNTH-${dossier.synthesisDigest.slice(0, 16)}`,
      tenantId: this.tenantId,
      queryTopic: query.topic,
      totalConclusions: dossier.allConclusions.length,
      breakdown,
      digest: dossier.synthesisDigest,
      emittedAt: timestamp,
    };
    this.advisories.push(advisory);

    return dossier;
  }

  /**
   * Retrieves emitted Phase 10 reasoning advisories.
   */
  public getAdvisories(): readonly Phase10SynthesisAdvisory[] {
    return [...this.advisories];
  }

  /**
   * Enforces permanent hardware actuation lockout.
   */
  private assertActuationBlocked(): void {
    if (!IS_ACTUATION_BLOCKED) {
      throw new ResearchActuationBlockedError('UNBLOCK_ACTUATION');
    }
  }

  /**
   * Simulates actuation attempt for verification.
   */
  public triggerActuationAttempt(): void {
    throw new ResearchActuationBlockedError('PHYSICAL_MOTOR_TRIGGER');
  }
}
