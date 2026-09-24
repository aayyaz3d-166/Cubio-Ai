/**
 * CUBiO AI — 3D Memory Studio
 * AGENT-002 — DRA (Dependency & Reuse Agent)
 * src/cubio/agents/dra/reuseAnalyzer.ts
 *
 * Capability discovery and reuse strategy analyzer.
 * Enforces the canonical hierarchy: REUSE -> COMPOSE -> EXTEND -> NEW.
 */

import { PMAReuseStrategy, PMACandidateCapability } from '../../language/native/pma/types';
import { DRAReuseCandidate, DRATaskQuery } from './types';
import { CapabilityResolver } from '../../language/native/pma/capabilityResolver';

export class DRAReuseAnalyzer {
  private readonly capabilityResolver: CapabilityResolver;

  constructor(customResolver?: CapabilityResolver) {
    this.capabilityResolver = customResolver || new CapabilityResolver();
  }

  /**
   * Evaluates task prompt and scope to discover reusable capabilities and determine strategy.
   */
  public analyzeReuse(query: DRATaskQuery): {
    matchedCandidates: readonly DRAReuseCandidate[];
    recommendedStrategy: PMAReuseStrategy;
    summaryRationale: string;
  } {
    const targetSubsystems = query.targetSubsystems || [];
    const resolution = this.capabilityResolver.resolveCapabilitiesForTask(
      query.prompt,
      targetSubsystems
    );

    const candidates: DRAReuseCandidate[] = [];

    for (const cap of resolution.matchedCapabilities) {
      const candidate: DRAReuseCandidate = {
        capabilityId: this.deriveCapabilityId(cap.capabilityName),
        capabilityName: cap.capabilityName,
        path: cap.path,
        implementation: cap.implementation,
        status: cap.status,
        tests: cap.tests,
        dependencies: cap.dependencies,
        reuseValue: cap.reuseValue,
        recommendedStrategy: cap.reuseStrategy,
        rationale: cap.notes || `Reusable verified implementation in ${cap.path}`,
      };
      candidates.push(candidate);
    }

    // Determine overall recommended strategy
    let recommendedStrategy: PMAReuseStrategy = 'NEW';
    let summaryRationale = 'No viable existing capability found; new implementation required.';

    if (candidates.length === 1 && candidates[0].reuseValue === 'MAXIMUM') {
      recommendedStrategy = 'REUSE';
      summaryRationale = `Exact authority exists in ${candidates[0].path} (${candidates[0].capabilityName}); direct REUSE required.`;
    } else if (candidates.length >= 2) {
      recommendedStrategy = 'COMPOSE';
      summaryRationale = `Multiple complementary capabilities detected (${candidates
        .map((c) => c.capabilityName)
        .join(', ')}); pipeline composition recommended.`;
    } else if (candidates.length === 1) {
      recommendedStrategy = candidates[0].recommendedStrategy;
      summaryRationale = `Existing capability in ${candidates[0].path} can be leveraged via ${recommendedStrategy}.`;
    }

    // If query prompt explicitly specifies a standalone agent or adapter
    if (recommendedStrategy === 'NEW' && query.prompt.toLowerCase().includes('agent')) {
      summaryRationale =
        'New sovereign agent architecture requested; compose with existing underlying memory and indexes.';
    }

    return {
      matchedCandidates: Object.freeze(candidates),
      recommendedStrategy,
      summaryRationale,
    };
  }

  private deriveCapabilityId(name: string): string {
    return name
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '_')
      .replace(/_+/g, '_');
  }
}
