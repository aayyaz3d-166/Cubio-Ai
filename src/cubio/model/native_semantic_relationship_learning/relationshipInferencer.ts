/**
 * CUBiO AI — Task 188: Native Semantic Relationship Learning
 * src/cubio/model/native_semantic_relationship_learning/relationshipInferencer.ts
 *
 * Bounded Relationship Inference Engine:
 * Performs multi-pass symbolic derivation across relationships under
 * strict depth ceilings, candidate ceilings, and deduplication guards.
 */

import {
  InferredRelationshipCandidate,
  RelationshipInferenceConfig,
  SemanticExplosionLimitError,
} from './types';
import { InferenceRule, DEFAULT_INFERENCE_RULES } from './ruleEngine';
import { ConfidenceAssigner } from './confidenceAssigner';
import { GraphEdgeRef } from '../native_knowledge_graph_expansion/types';

export class RelationshipInferencer {
  public static readonly HARD_MAX_DEPTH = 4;
  public static readonly HARD_MAX_CANDIDATES = 256;

  private readonly rules: readonly InferenceRule[];

  constructor(customRules?: readonly InferenceRule[]) {
    this.rules = customRules ?? DEFAULT_INFERENCE_RULES;
  }

  /**
   * Executes bounded relationship inference over a base edge set.
   */
  public inferCandidates(
    baseEdges: readonly GraphEdgeRef[],
    callerTenantId: string,
    config?: RelationshipInferenceConfig
  ): readonly InferredRelationshipCandidate[] {
    const maxDepth = config?.maxInferenceDepth ?? 2;
    const maxCandidates = config?.maxCandidates ?? 64;
    const minConfidence = config?.minConfidenceThreshold ?? 0.30;
    const targetRelations = config?.targetRelations ? new Set(config.targetRelations) : null;

    if (maxDepth > RelationshipInferencer.HARD_MAX_DEPTH) {
      throw new SemanticExplosionLimitError('maxInferenceDepth', maxDepth, RelationshipInferencer.HARD_MAX_DEPTH);
    }
    if (maxCandidates > RelationshipInferencer.HARD_MAX_CANDIDATES) {
      throw new SemanticExplosionLimitError('maxCandidates', maxCandidates, RelationshipInferencer.HARD_MAX_CANDIDATES);
    }

    // Index existing edges to avoid re-inferring existing facts
    const existingEdgeKeys = new Set<string>();
    for (const e of baseEdges) {
      if (e.tenantId === callerTenantId) {
        existingEdgeKeys.add(`${e.sourceId}:${e.relationType}:${e.targetId}`);
        if (!e.isDirected) {
          existingEdgeKeys.add(`${e.targetId}:${e.relationType}:${e.sourceId}`);
        }
      }
    }

    const inferredMap = new Map<string, InferredRelationshipCandidate>();
    let currentPool: GraphEdgeRef[] = baseEdges.filter((e) => e.tenantId === callerTenantId);

    for (let depth = 1; depth <= maxDepth; depth++) {
      if (inferredMap.size >= maxCandidates) break;

      const newInferredThisPass: GraphEdgeRef[] = [];

      for (let i = 0; i < currentPool.length; i++) {
        if (inferredMap.size >= maxCandidates) break;
        const e1 = currentPool[i];

        for (let j = 0; j < currentPool.length; j++) {
          if (inferredMap.size >= maxCandidates) break;
          const e2 = currentPool[j];

          for (const rule of this.rules) {
            if (inferredMap.size >= maxCandidates) break;

            const match = rule.evaluate(e1, e2);
            if (!match) continue;

            if (targetRelations && !targetRelations.has(match.relationType)) continue;
            if (match.confidence < minConfidence) continue;

            const edgeKey = `${match.sourceId}:${match.relationType}:${match.targetId}`;
            if (existingEdgeKeys.has(edgeKey)) continue;

            // Combine supporting evidence / premises
            const premises = [e1.edgeId, e2.edgeId];
            const evidenceIds: string[] = [];

            const candidate = ConfidenceAssigner.calibrateCandidate({
              sourceId: match.sourceId,
              targetId: match.targetId,
              relationType: match.relationType,
              baseConfidence: match.confidence,
              epistemicStatus: match.epistemicStatus,
              derivationRule: match.ruleId,
              premises,
              supportingEvidenceIds: evidenceIds,
              tenantId: callerTenantId,
              derivationDepth: depth,
              isDirected: match.isDirected,
            });

            // Store candidate and record key
            existingEdgeKeys.add(edgeKey);
            if (!match.isDirected) {
              existingEdgeKeys.add(`${match.targetId}:${match.relationType}:${match.sourceId}`);
            }

            inferredMap.set(candidate.candidateId, candidate);

            // Represent candidate as virtual GraphEdgeRef to allow deeper multi-hop passes
            newInferredThisPass.push({
              edgeId: candidate.candidateId,
              sourceId: candidate.sourceId,
              targetId: candidate.targetId,
              relationType: candidate.relationType,
              weight: candidate.confidence,
              tenantId: callerTenantId,
              stateVersion: 1,
              checksum: candidate.checksum,
              isDirected: candidate.isDirected,
            });
          }
        }
      }

      if (newInferredThisPass.length === 0) break;
      currentPool = [...currentPool, ...newInferredThisPass];
    }

    // Deterministic sorting by candidateId
    const result = Array.from(inferredMap.values()).sort((a, b) =>
      a.candidateId.localeCompare(b.candidateId)
    );

    return Object.freeze(result);
  }
}
