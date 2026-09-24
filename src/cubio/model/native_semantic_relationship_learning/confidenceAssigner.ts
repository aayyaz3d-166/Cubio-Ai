/**
 * CUBiO AI — Task 188: Native Semantic Relationship Learning
 * src/cubio/model/native_semantic_relationship_learning/confidenceAssigner.ts
 *
 * Epistemic & Confidence Assigner:
 * Enforces anti-inflation governance, multi-hop decay, and
 * prevents unsupported claims from being elevated to FACT or AXIOM.
 */

import * as crypto from 'crypto';
import {
  InferredRelationshipCandidate,
  SemanticUnsupportedClaimError,
} from './types';
import {
  KnowledgeEpistemicStatus,
  EPISTEMIC_WEIGHTS,
} from '../native_knowledge_architecture/types';

export class ConfidenceAssigner {
  public static readonly MAX_INFERRED_CONFIDENCE = 0.88;

  /**
   * Applies multi-hop decay and validates epistemic constraints.
   */
  public static calibrateCandidate(
    params: {
      sourceId: string;
      targetId: string;
      relationType: string;
      baseConfidence: number;
      epistemicStatus: KnowledgeEpistemicStatus;
      derivationRule: string;
      premises: readonly string[];
      supportingEvidenceIds: readonly string[];
      tenantId: string;
      derivationDepth: number;
      isDirected: boolean;
    }
  ): InferredRelationshipCandidate {
    // 1. Enforce anti-inflation: inferred claims can NEVER be AXIOM or FACT
    if (params.epistemicStatus === 'AXIOM' || params.epistemicStatus === 'FACT') {
      throw new SemanticUnsupportedClaimError(
        `${params.sourceId}->${params.targetId}`,
        `Inferred relationship cannot be assigned epistemic status "${params.epistemicStatus}" without direct canonical grounding.`
      );
    }

    // 2. Multi-hop decay: 5% reduction per hop beyond depth 1
    const depthPenalty = Math.max(0, (params.derivationDepth - 1) * 0.05);
    let calibratedConfidence = Math.min(
      params.baseConfidence * (1.0 - depthPenalty),
      ConfidenceAssigner.MAX_INFERRED_CONFIDENCE
    );

    // Round to 4 decimal places for bitwise determinism
    calibratedConfidence = Math.round(calibratedConfidence * 10000) / 10000;

    // 3. Epistemic status confirmation based on confidence ceilings
    let calibratedEpistemic: KnowledgeEpistemicStatus = params.epistemicStatus;
    if (calibratedConfidence < 0.40) {
      calibratedEpistemic = 'HYPOTHESIS';
    } else if (calibratedConfidence < 0.65 && calibratedEpistemic === 'DERIVED') {
      calibratedEpistemic = 'THEORY';
    }

    // 4. Generate deterministic candidate ID and SHA-256 derivation checksum
    const candidateId = `inferred_${crypto
      .createHash('sha256')
      .update(
        `${params.tenantId}:${params.sourceId}:${params.relationType}:${params.targetId}:${params.derivationRule}`
      )
      .digest('hex')
      .slice(0, 16)}`;

    const checksumPayload = JSON.stringify({
      candidateId,
      sourceId: params.sourceId,
      targetId: params.targetId,
      relationType: params.relationType,
      confidence: calibratedConfidence,
      epistemicStatus: calibratedEpistemic,
      derivationRule: params.derivationRule,
      premises: [...params.premises].sort(),
      tenantId: params.tenantId,
      depth: params.derivationDepth,
    });

    const checksum = crypto.createHash('sha256').update(checksumPayload).digest('hex');

    return Object.freeze({
      candidateId,
      sourceId: params.sourceId,
      targetId: params.targetId,
      relationType: params.relationType as any,
      confidence: calibratedConfidence,
      epistemicStatus: calibratedEpistemic,
      supportingEvidenceIds: Object.freeze([...params.supportingEvidenceIds].sort()),
      derivationRule: params.derivationRule,
      premises: Object.freeze([...params.premises].sort()),
      tenantId: params.tenantId,
      derivationDepth: params.derivationDepth,
      checksum,
      isDirected: params.isDirected,
    });
  }
}
