/**
 * CUBiO AI — Task 193: Native Evidence and Source Provenance Architecture
 * src/cubio/model/native_evidence_provenance/evidenceValidator.ts
 *
 * Deterministic Evidence Validator:
 * Verifies cryptographic integrity of evidence chains, intercepts missing or
 * corrupted evidence fail-closed, and enforces epistemic anti-promotion guards.
 */

import * as crypto from 'crypto';
import {
  EvidenceChain,
  EvidenceVerificationResult,
  EvidenceVerificationStatus,
  CanonicalPromotionCandidate,
  EvidenceCorruptedError,
  EvidenceMissingError,
  EvidenceUnverifiableLineageError,
  EvidenceUnsupportedPromotionError,
} from './types';
import { EvidenceChainBuilder } from './evidenceChainBuilder';
import { EPISTEMIC_WEIGHTS, KnowledgeEpistemicStatus } from '../native_knowledge_architecture/types';

export class EvidenceValidator {
  /**
   * Validates an entire evidence chain fail-closed.
   */
  public static validateChain(
    chain: EvidenceChain,
    strict: boolean = true
  ): EvidenceVerificationResult {
    // 1. Missing evidence check
    if (!chain || !chain.nodes || chain.nodes.length === 0) {
      if (strict) {
        throw new EvidenceMissingError(chain?.claimId ?? 'unknown', 'Evidence chain is empty or null');
      }
      return {
        valid: false,
        status: 'MISSING_EVIDENCE',
        chainDepth: 0,
        rootSourceIds: [],
        compositeHash: '',
        failureReason: 'Evidence chain contains zero nodes',
      };
    }

    const nodeHashMap = new Map<string, string>();

    // 2. Node-by-node verification
    for (let i = 0; i < chain.nodes.length; i++) {
      const node = chain.nodes[i];

      // Payload checksum verification if raw payload is supplied
      if (node.rawPayloadContent !== undefined) {
        const computedPayloadChecksum = crypto
          .createHash('sha256')
          .update(node.rawPayloadContent)
          .digest('hex');

        if (computedPayloadChecksum !== node.sourceIdentity.payloadChecksum) {
          const reason = `Payload checksum mismatch on node '${node.nodeId}'. Expected '${node.sourceIdentity.payloadChecksum}', computed '${computedPayloadChecksum}'`;
          if (strict) {
            throw new EvidenceCorruptedError(node.nodeId, reason);
          }
          return {
            valid: false,
            status: 'CORRUPTED_CHECKSUM',
            chainDepth: chain.nodes.length,
            rootSourceIds: chain.rootSourceIds,
            compositeHash: chain.compositeHash,
            failureReason: reason,
          };
        }
      }

      // Lineage connection check
      let expectedParentHash = '';
      if (node.parentNodeId) {
        if (!nodeHashMap.has(node.parentNodeId)) {
          const reason = `Node '${node.nodeId}' references parent '${node.parentNodeId}' which is not evaluated or missing`;
          if (strict) {
            throw new EvidenceUnverifiableLineageError(chain.chainId, reason);
          }
          return {
            valid: false,
            status: 'UNVERIFIABLE_LINEAGE',
            chainDepth: chain.nodes.length,
            rootSourceIds: chain.rootSourceIds,
            compositeHash: chain.compositeHash,
            failureReason: reason,
          };
        }
        expectedParentHash = nodeHashMap.get(node.parentNodeId)!;
      }

      // Recomputed chained hash check
      const recomputedHash = EvidenceChainBuilder.computeChainedHash(
        node.nodeId,
        node.parentNodeId,
        expectedParentHash,
        node.sourceIdentity.payloadChecksum,
        node.epistemicTier,
        node.confidence,
        node.derivationRule
      );

      if (recomputedHash !== node.chainedHash) {
        const reason = `Chained hash tampering detected on node '${node.nodeId}'. Expected '${node.chainedHash}', recomputed '${recomputedHash}'`;
        if (strict) {
          throw new EvidenceCorruptedError(node.nodeId, reason);
        }
        return {
          valid: false,
          status: 'CORRUPTED_CHECKSUM',
          chainDepth: chain.nodes.length,
          rootSourceIds: chain.rootSourceIds,
          compositeHash: chain.compositeHash,
          failureReason: reason,
        };
      }

      nodeHashMap.set(node.nodeId, recomputedHash);
    }

    // 3. Composite hash verification
    const allChainedHashes = chain.nodes.map((n) => n.chainedHash).join(':::');
    const expectedCompositeHash = crypto
      .createHash('sha256')
      .update(`CHAIN:::${chain.tenantId}:::${chain.claimId}:::${allChainedHashes}`)
      .digest('hex');

    if (expectedCompositeHash !== chain.compositeHash) {
      const reason = `Composite chain hash mismatch for chain '${chain.chainId}'. Expected '${chain.compositeHash}', computed '${expectedCompositeHash}'`;
      if (strict) {
        throw new EvidenceCorruptedError(chain.chainId, reason);
      }
      return {
        valid: false,
        status: 'CORRUPTED_CHECKSUM',
        chainDepth: chain.nodes.length,
        rootSourceIds: chain.rootSourceIds,
        compositeHash: chain.compositeHash,
        failureReason: reason,
      };
    }

    return {
      valid: true,
      status: 'VERIFIED',
      chainDepth: chain.nodes.length,
      rootSourceIds: chain.rootSourceIds,
      compositeHash: chain.compositeHash,
    };
  }

  /**
   * Enforces Epistemic Anti-Promotion Guards.
   * Prevents speculative, ungrounded, or weakly evidenced claims from being
   * elevated to canonical FACT or AXIOM.
   */
  public static validatePromotion(
    candidate: CanonicalPromotionCandidate,
    chain: EvidenceChain,
    strict: boolean = true
  ): boolean {
    // First validate the underlying chain
    this.validateChain(chain, true);

    const targetTier = candidate.requestedEpistemicTier;
    const targetWeight = EPISTEMIC_WEIGHTS[targetTier] ?? 0.5;

    // Evaluate strongest evidence in chain
    let maxChainTierWeight = 0;
    let avgConfidence = 0;
    let hasDeductiveProof = false;
    let hasEmpiricalObservation = false;

    for (const node of chain.nodes) {
      const tierWeight = EPISTEMIC_WEIGHTS[node.epistemicTier] ?? 0.3;
      if (tierWeight > maxChainTierWeight) {
        maxChainTierWeight = tierWeight;
      }
      avgConfidence += node.confidence;

      if (node.sourceIdentity.sourceType === 'DEDUCTIVE_PROOF' || node.derivationRule?.includes('PROOF')) {
        hasDeductiveProof = true;
      }
      if (
        node.sourceIdentity.sourceType === 'DIRECT_OBSERVATION' ||
        node.sourceIdentity.sourceType === 'EMPIRICAL_MEASUREMENT' ||
        node.sourceIdentity.sourceType.startsWith('SENSOR_')
      ) {
        hasEmpiricalObservation = true;
      }
    }
    avgConfidence = avgConfidence / chain.nodes.length;

    // Promotion Guard Rules:
    // 1. Promotion to AXIOM requires mathematical / deductive proof and high confidence (>= 0.95)
    if (targetTier === 'AXIOM') {
      if (!hasDeductiveProof || avgConfidence < 0.95 || maxChainTierWeight < 0.85) {
        const reason = `Promotion of claim '${candidate.claimId}' to AXIOM rejected: requires verified DEDUCTIVE_PROOF and confidence >= 0.95 (actual: proof=${hasDeductiveProof}, conf=${avgConfidence.toFixed(2)})`;
        if (strict) {
          throw new EvidenceUnsupportedPromotionError(candidate.claimId, reason);
        }
        return false;
      }
    }

    // 2. Promotion to FACT requires empirical measurement or deductive proof and confidence >= 0.75
    if (targetTier === 'FACT') {
      if ((!hasEmpiricalObservation && !hasDeductiveProof) || avgConfidence < 0.75) {
        const reason = `Promotion of claim '${candidate.claimId}' to FACT rejected: requires empirical observation or deductive proof with confidence >= 0.75 (actual: obs=${hasEmpiricalObservation}, conf=${avgConfidence.toFixed(2)})`;
        if (strict) {
          throw new EvidenceUnsupportedPromotionError(candidate.claimId, reason);
        }
        return false;
      }
    }

    // 3. Candidate target tier cannot be more than 1 epistemic step higher than chain max tier weight
    if (targetWeight - maxChainTierWeight > 0.3) {
      const reason = `Promotion of claim '${candidate.claimId}' to '${targetTier}' rejected: exceeds evidence chain epistemic ceiling (${targetWeight} vs ${maxChainTierWeight})`;
      if (strict) {
        throw new EvidenceUnsupportedPromotionError(candidate.claimId, reason);
      }
      return false;
    }

    return true;
  }
}
