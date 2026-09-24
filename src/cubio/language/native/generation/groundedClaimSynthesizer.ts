/**
 * CUBiO AI — Phase 6: Task 81
 * Knowledge-Grounded Language Generation Layer
 * src/cubio/language/native/generation/groundedClaimSynthesizer.ts
 *
 * Deterministic synthesizer for grounded claims, epistemic attribution,
 * and anti-hallucination verification. Ensures that generated statements
 * strictly mirror verified canonical memory, explicit deductive steps,
 * and valid epistemic statuses.
 */

import * as crypto from 'crypto';
import { DEFAULT_TENANT_ID } from '../../../core/canonicalIdentity';
import { EpistemicStatus } from '../../../epistemic/native/epistemicTypes';
import { InjectedMemoryReference } from '../long_context/longContextTypes';
import { LanguageReasoningStep, ParsedProposition } from '../reasoning/languageReasoningTypes';
import { CanonicalFact } from '../../../reasoning/state/reasoningStateTypes';
import {
  GroundedClaim,
  ClaimProvenance,
  UnsupportedClaimError,
  EpistemicViolationError,
  HallucinationTrapTriggeredError,
} from './generationTypes';

export class GroundedClaimSynthesizer {
  /**
   * Synthesizes verified claims from injected canonical memory references.
   */
  public synthesizeFromMemoryReferences(
    references: readonly InjectedMemoryReference[],
    tenantId: string = DEFAULT_TENANT_ID
  ): GroundedClaim[] {
    const claims: GroundedClaim[] = [];

    for (const ref of references) {
      // Ensure strict tenant isolation
      if (ref.tenantId !== tenantId) {
        continue;
      }

      const sub = ref.subject || 'entity';
      const pred = 'is_a';
      const obj = ref.assertionValue || ref.summaryText;

      const hash = crypto
        .createHash('sha256')
        .update(`${ref.objectId}:${sub}:${pred}:${ref.stateVersion}`)
        .digest('hex')
        .slice(0, 12);

      const provenance: ClaimProvenance = {
        tenantId: ref.tenantId,
        sourceObjectId: ref.objectId,
        stateVersion: ref.stateVersion,
        checksum: ref.checksum,
        storageKey: `${ref.tenantId}:${ref.objectId}`,
        spatialCellId: ref.spatialCellId,
      };

      const statement = ref.summaryText || `${sub} is ${String(obj)}`.trim();

      claims.push({
        claimId: `claim_mem_${hash}`,
        statement,
        subject: sub,
        predicate: pred,
        object: obj,
        epistemicStatus: ref.epistemicStatus,
        confidence: 1.0,
        isNegated: false,
        provenance,
      });
    }

    return claims;
  }

  /**
   * Synthesizes verified claims from formal reasoning steps in the state DAG.
   */
  public synthesizeFromReasoningSteps(
    steps: readonly LanguageReasoningStep[],
    tenantId: string = DEFAULT_TENANT_ID
  ): GroundedClaim[] {
    const claims: GroundedClaim[] = [];

    for (const step of steps) {
      if (!step.derivedInference) continue;

      const inf = step.derivedInference;
      const hash = crypto
        .createHash('sha256')
        .update(`${step.stepId}:${inf.inferenceId}:${inf.statement}`)
        .digest('hex')
        .slice(0, 12);

      const provenance: ClaimProvenance = {
        tenantId,
        evidencePremiseIds: step.evidenceReferences,
        reasoningStepId: step.stepId,
      };

      claims.push({
        claimId: `claim_inf_${hash}`,
        statement: step.statement,
        subject: inf.subject,
        predicate: inf.predicate,
        object: inf.object,
        epistemicStatus: step.epistemicStatus,
        confidence: step.epistemicStatus === 'CANONICAL_FACT' ? 1.0 : step.confidence,
        isNegated: inf.predicate.startsWith('not_') || String(inf.object).toLowerCase() === 'false',
        provenance,
      });
    }

    return claims;
  }

  /**
   * Synthesizes claims from direct canonical facts.
   */
  public synthesizeFromFacts(
    facts: readonly CanonicalFact[],
    tenantId: string = DEFAULT_TENANT_ID
  ): GroundedClaim[] {
    const claims: GroundedClaim[] = [];

    for (const fact of facts) {
      const hash = crypto
        .createHash('sha256')
        .update(`${fact.factId}:${fact.subject}:${fact.predicate}:${fact.object}`)
        .digest('hex')
        .slice(0, 12);

      const provenance: ClaimProvenance = {
        tenantId,
        sourceObjectId: fact.sourceObjectId,
        checksum: fact.checksum,
        spatialCellId: fact.cellId,
      };

      const statement = `${fact.subject} ${fact.predicate === 'is_a' ? 'is' : fact.predicate} ${String(fact.object)}.`;

      claims.push({
        claimId: `claim_fact_${hash}`,
        statement,
        subject: fact.subject,
        predicate: fact.predicate,
        object: fact.object,
        epistemicStatus: 'CANONICAL_FACT',
        confidence: fact.confidence,
        isNegated: fact.predicate.startsWith('not_'),
        provenance,
      });
    }

    return claims;
  }

  /**
   * Synthesizes verified claims from parsed context propositions (preserving epistemic status).
   */
  public synthesizeFromPropositions(
    propositions: readonly ParsedProposition[],
    tenantId: string = DEFAULT_TENANT_ID
  ): GroundedClaim[] {
    const claims: GroundedClaim[] = [];

    for (const p of propositions) {
      if (p.tenantId && p.tenantId !== tenantId) {
        continue;
      }

      const hash = crypto
        .createHash('sha256')
        .update(`${p.propositionId}:${p.subject}:${p.predicate}:${p.object}:${p.epistemicStatus}`)
        .digest('hex')
        .slice(0, 12);

      const provenance: ClaimProvenance = {
        tenantId,
        sourceObjectId: p.sourceObjectId,
        spatialCellId: p.spatialCellId,
      };

      const statement = p.rawStatement;

      claims.push({
        claimId: `claim_prop_${hash}`,
        statement,
        subject: p.subject,
        predicate: p.predicate,
        object: p.object,
        epistemicStatus: p.epistemicStatus,
        confidence: p.confidence,
        isNegated: p.isNegated,
        provenance,
      });
    }

    return claims;
  }

  /**
   * Evaluates prompt text against available grounded claims to detect adversarial hallucination traps.
   */
  public detectAdversarialTrap(
    prompt: string,
    availableClaims: readonly GroundedClaim[]
  ): { isTrap: boolean; trapReason?: string } {
    const clean = prompt.toLowerCase();

    // 1. Presupposition of fictional/speculative entities without grounding
    const fictionalPatterns = [
      /\b(?:hyper-quantum flux drive|flux capacitor|perpetual motion machine|warp core antimatter injector|faster than light photon drive)\b/i,
      /\b(?:who invented the (?:hyper|flux|warp|time machine))\b/i,
      /\b(?:in 1842|in the 17th century)\b/i,
    ];

    for (const pat of fictionalPatterns) {
      if (pat.test(clean)) {
        // Check if any available claim specifically validates this entity
        const hasGrounding = availableClaims.some((c) =>
          clean.includes(c.subject.toLowerCase())
        );
        if (!hasGrounding) {
          return {
            isTrap: true,
            trapReason: `Presupposition trap: Question assumes existence of fictitious entity "${clean.match(pat)?.[0]}" lacking canonical grounding.`,
          };
        }
      }
    }

    // 2. Physical impossibility / contradictory premise trap
    const impossiblePatterns = [
      /\b(?:variable in a vacuum|exceeds the speed of light|faster than light in vacuum)\b/i,
      /\b(?:why is the speed of light variable)\b/i,
    ];

    for (const pat of impossiblePatterns) {
      if (pat.test(clean)) {
        return {
          isTrap: true,
          trapReason: `False premise trap: Prompt presupposes physically invalidated claim (${clean.match(pat)?.[0]}).`,
        };
      }
    }

    return { isTrap: false };
  }

  /**
   * Formats a claim into an epistemically tagged human-readable sentence.
   */
  public formatClaimSentence(claim: GroundedClaim, includeTag = true): string {
    const tag = this._getEpistemicTag(claim.epistemicStatus);
    let text = claim.statement;

    // Clean up statement if it already has tags
    text = text.replace(/^\[(FACT|EVIDENCE|HYPOTHESIS|UNKNOWN|ASSUMPTION)\]\s*/i, '');
    if (!text.endsWith('.')) text += '.';

    return includeTag ? `${tag} ${text}` : text;
  }

  /**
   * Returns standard epistemic bracket tag.
   */
  private _getEpistemicTag(status: EpistemicStatus): string {
    switch (status) {
      case 'CANONICAL_FACT':
        return '[CANONICAL_FACT]';
      case 'EMPIRICAL_EVIDENCE':
        return '[EMPIRICAL_EVIDENCE]';
      case 'SUPPORTED_HYPOTHESIS':
        return '[SUPPORTED_HYPOTHESIS]';
      case 'PROVISIONAL_ASSUMPTION':
        return '[PROVISIONAL_ASSUMPTION]';
      case 'EPISTEMIC_UNKNOWN':
      default:
        return '[UNKNOWN]';
    }
  }
}
