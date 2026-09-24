/**
 * CUBiO AI — 3D Memory Studio
 * AGENT-002 — DRA (Dependency & Reuse Agent)
 * src/cubio/agents/dra/frozenConflictGuard.ts
 *
 * Frozen component conflict guard.
 * Audits proposed development files and prompts against frozen authorities
 * to prevent regression and unauthorized mutation.
 */

import { DRAConflictWarning, DRATaskQuery } from './types';
import { FrozenProtectionGuard } from '../../language/native/pma/frozenProtectionGuard';

export class DRAFrozenConflictGuard {
  private readonly frozenGuard: FrozenProtectionGuard;

  constructor(customGuard?: FrozenProtectionGuard) {
    this.frozenGuard = customGuard || new FrozenProtectionGuard();
  }

  /**
   * Audits query proposed files and prompt against the frozen authority list.
   */
  public auditFrozenConflicts(query: DRATaskQuery): {
    warnings: readonly DRAConflictWarning[];
    protectedFilesImpacted: readonly string[];
  } {
    const warnings: DRAConflictWarning[] = [];
    const protectedFilesImpacted: string[] = [];
    const proposed = query.proposedFiles || [];

    for (const file of proposed) {
      if (this.frozenGuard.isProtected(file)) {
        protectedFilesImpacted.push(file);
        warnings.push({
          type: 'FROZEN_MODIFICATION_RISK',
          severity: 'CRITICAL',
          target: file,
          reason: `Proposed file '${file}' is a certified frozen authority. Direct modification is strictly prohibited.`,
          impact:
            'Violates Section 10/11 Architecture Freeze; any mutation triggers immediate regression failure.',
          safeAlternatives: [
            'Treat target as read-only; import existing exports without modifying the source file',
            'Develop a separate adapter, agent, or extension in an authorized non-frozen directory',
          ],
        });
      }
    }

    // Also inspect prompt for direct instructions targeting frozen authorities
    const promptLower = query.prompt.toLowerCase();
    if (
      /\b(?:modify|update|edit|patch|change|delete|overwrite)\b/i.test(promptLower) &&
      /\b(?:address369|cubio_studio\.db|outputguard|phase8_baseline)\b/i.test(promptLower)
    ) {
      warnings.push({
        type: 'FROZEN_MODIFICATION_RISK',
        severity: 'CRITICAL',
        target: 'FROZEN_AUTHORITY_SCOPE',
        reason: 'Task prompt requests direct modification of frozen system files.',
        impact: 'Violates Phase 8 frozen baseline immutability invariant.',
        safeAlternatives: [
          'Re-scope task to read-only consumption or modular external extension',
        ],
      });
    }

    return {
      warnings: Object.freeze(warnings),
      protectedFilesImpacted: Object.freeze(protectedFilesImpacted),
    };
  }
}
