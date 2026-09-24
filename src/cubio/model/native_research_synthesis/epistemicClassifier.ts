/**
 * CUBiO AI — Task 194: Native Research and Information Synthesis
 * src/cubio/model/native_research_synthesis/epistemicClassifier.ts
 *
 * Deterministic Epistemic Classifier:
 * Partitions research assertions into FACT, DERIVED, THEORY, HYPOTHESIS, and UNKNOWN.
 * Strictly enforces anti-fabrication by mapping contradictory or missing evidence to UNKNOWN.
 */

import { ResearchEpistemicState } from './types';
import { KnowledgeEpistemicStatus } from '../native_knowledge_architecture/types';

export interface ClassificationInput {
  readonly epistemicTier: KnowledgeEpistemicStatus;
  readonly isDerived?: boolean;
  readonly derivationRule?: string;
  readonly evidenceChainCount: number;
  readonly isEvidenceVerified: boolean;
  readonly hasContradiction?: boolean;
  readonly contradictionReason?: string;
  readonly isMissingRequiredEvidence?: boolean;
}

export interface ClassificationOutput {
  readonly epistemicState: ResearchEpistemicState;
  readonly confidenceMultiplier: number;
  readonly uncertaintyNotes?: string;
}

export class EpistemicClassifier {
  /**
   * Classifies a claim into one of the 5 canonical research epistemic states.
   */
  public static classify(input: ClassificationInput): ClassificationOutput {
    // 1. Anti-Fabrication: Contradictions immediately yield UNKNOWN
    if (input.hasContradiction) {
      return {
        epistemicState: 'UNKNOWN',
        confidenceMultiplier: 0.1,
        uncertaintyNotes: `Unresolved contradiction: ${input.contradictionReason ?? 'Conflicting evidence claims detected'}`,
      };
    }

    // 2. Anti-Fabrication: Missing required evidence immediately yields UNKNOWN
    if (input.isMissingRequiredEvidence || input.evidenceChainCount === 0) {
      return {
        epistemicState: 'UNKNOWN',
        confidenceMultiplier: 0.05,
        uncertaintyNotes: 'Insufficient grounding: Missing required empirical or deductive evidence chain',
      };
    }

    // 3. Formally derived conclusion from verified premises
    if (input.isDerived && input.isEvidenceVerified) {
      return {
        epistemicState: 'DERIVED',
        confidenceMultiplier: 0.95,
      };
    }

    // 4. Grounded Canonical Fact or Axiom
    if ((input.epistemicTier === 'FACT' || input.epistemicTier === 'AXIOM') && input.isEvidenceVerified) {
      return {
        epistemicState: 'FACT',
        confidenceMultiplier: 1.0,
      };
    }

    // 5. Grounded Theory or Empirical Rule
    if (
      (input.epistemicTier === 'THEORY' || input.epistemicTier === 'EMPIRICAL_RULE') &&
      input.isEvidenceVerified
    ) {
      return {
        epistemicState: 'THEORY',
        confidenceMultiplier: 0.85,
      };
    }

    // 6. Supported or speculative hypothesis
    if (input.epistemicTier === 'HYPOTHESIS' || input.epistemicTier === 'CONJECTURE') {
      return {
        epistemicState: 'HYPOTHESIS',
        confidenceMultiplier: 0.4,
        uncertaintyNotes: 'Hypothetical assertion with partial empirical support',
      };
    }

    // Default fallback to UNKNOWN for unverified states
    return {
      epistemicState: 'UNKNOWN',
      confidenceMultiplier: 0.2,
      uncertaintyNotes: 'Epistemic tier unverified or lacking cryptographic proof',
    };
  }
}
