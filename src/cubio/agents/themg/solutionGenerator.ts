/**
 * CUBiO AI — 3D Memory Studio
 * AGENT-005 — TheMG (Evidence & Solution Planning Agent)
 * src/cubio/agents/themg/solutionGenerator.ts
 *
 * Generates candidate technical solutions based on existing capabilities
 * (reusing DRA and MEA principles) without inventing unverifiable evidence
 * or modifying frozen files.
 */

import {
  TheMGFact,
  TheMGObservedFailure,
  TheMGProposedSolution,
  TheMGPlanningScope,
} from './types';
import { FrozenProtectionGuard } from '../../language/native/pma/frozenProtectionGuard';

export class TheMGSolutionGenerator {
  private readonly frozenGuard: FrozenProtectionGuard;

  constructor(customRootDir?: string) {
    this.frozenGuard = new FrozenProtectionGuard(customRootDir);
  }

  /**
   * Generates viable candidate solutions addressing the objective and identified failures.
   */
  public generateSolutions(
    scope: TheMGPlanningScope,
    facts: readonly TheMGFact[],
    failures: readonly TheMGObservedFailure[]
  ): readonly TheMGProposedSolution[] {
    const solutions: TheMGProposedSolution[] = [];
    const targetFailureIds = failures.map((f) => f.failureId);

    // Filter out protected files from any proposed modification
    const safeAllowedFiles = (scope.allowedFiles || []).filter(
      (f) => !this.frozenGuard.isProtected(f)
    );

    // Primary Solution: Targeted Fix / Extension
    solutions.push({
      solutionId: `SOL_TARGETED_${scope.taskId}`,
      title: `Targeted Resolution for ${scope.objective}`,
      description: `Implement direct minimal changes to satisfy objective and resolve ${failures.length} observed failure(s).`,
      targetFailures: Object.freeze(targetFailureIds),
      capabilitiesToReuse: ['DRA_CAPABILITY_RESOLVER', 'MEA_CONTEXT_RETRIEVAL', 'TGA_TEST_GATES'],
      filesToModify: Object.freeze(safeAllowedFiles),
      newFilesRequired: Object.freeze([]),
      estimatedRisk: failures.length > 2 ? 'MEDIUM' : 'LOW',
      architecturalCompliance: true,
      rationale: 'Reuses existing native capabilities and avoids touching frozen baselines.',
    });

    // Secondary Solution: Modular Adapter / Non-Intrusive Wrapper
    solutions.push({
      solutionId: `SOL_ADAPTER_${scope.taskId}`,
      title: `Modular Adapter Isolation for ${scope.objective}`,
      description: `Encapsulate functionality within a dedicated adapter under src/cubio/ to guarantee zero side-effects.`,
      targetFailures: Object.freeze(targetFailureIds),
      capabilitiesToReuse: ['EXISTING_SUB_ENGINES'],
      filesToModify: Object.freeze([]),
      newFilesRequired: Object.freeze([`src/cubio/adapters/${scope.taskId.toLowerCase()}Adapter.ts`]),
      estimatedRisk: 'LOW',
      architecturalCompliance: true,
      rationale: 'Purely additive, zero risk to existing modules or frozen files.',
    });

    return Object.freeze(solutions);
  }
}
