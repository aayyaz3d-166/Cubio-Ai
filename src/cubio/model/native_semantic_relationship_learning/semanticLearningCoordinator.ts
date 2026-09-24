/**
 * CUBiO AI — Task 188: Native Semantic Relationship Learning
 * src/cubio/model/native_semantic_relationship_learning/semanticLearningCoordinator.ts
 *
 * Semantic Learning Coordinator:
 * Master orchestration facade for relationship inference, epistemic calibration,
 * graph promotion, and summary digest generation under sovereign safety controls.
 */

import * as crypto from 'crypto';
import {
  TASK_188_ID,
  IS_ACTUATION_BLOCKED,
  InferredRelationshipCandidate,
  RelationshipInferenceConfig,
  RelationshipLearningSummary,
  SemanticTenantViolationError,
} from './types';
import { RelationshipInferencer } from './relationshipInferencer';
import { KnowledgeGovernor } from '../native_knowledge_architecture/knowledgeGovernor';
import {
  Relationship,
  KnowledgeEpistemicStatus,
} from '../native_knowledge_architecture/types';
import { GraphIndex } from '../native_knowledge_graph_expansion/graphIndex';
import { GraphEdgeRef } from '../native_knowledge_graph_expansion/types';

export class SemanticLearningCoordinator {
  public static readonly VERSION = '188.1.0';
  public static readonly IS_ACTUATION_BLOCKED = IS_ACTUATION_BLOCKED;

  private readonly inferencer: RelationshipInferencer;

  constructor(inferencer?: RelationshipInferencer) {
    this.inferencer = inferencer ?? new RelationshipInferencer();
  }

  /**
   * Infers candidate relationships directly from an active GraphIndex.
   */
  public inferFromGraph(
    graphIndex: GraphIndex,
    callerTenantId: string,
    config?: RelationshipInferenceConfig
  ): {
    readonly candidates: readonly InferredRelationshipCandidate[];
    readonly summary: RelationshipLearningSummary;
  } {
    KnowledgeGovernor.assertActuationBlocked(callerTenantId);

    const baseEdges = graphIndex.getAllEdges(callerTenantId);
    return this.inferFromEdges(baseEdges, callerTenantId, config);
  }

  /**
   * Infers candidate relationships from an explicit edge array.
   */
  public inferFromEdges(
    baseEdges: readonly GraphEdgeRef[],
    callerTenantId: string,
    config?: RelationshipInferenceConfig
  ): {
    readonly candidates: readonly InferredRelationshipCandidate[];
    readonly summary: RelationshipLearningSummary;
  } {
    KnowledgeGovernor.assertActuationBlocked(callerTenantId);

    // Verify tenant integrity across input edges
    for (const edge of baseEdges) {
      if (edge.tenantId !== callerTenantId) {
        throw new SemanticTenantViolationError(callerTenantId, edge.tenantId);
      }
    }

    const candidates = this.inferencer.inferCandidates(baseEdges, callerTenantId, config);

    // Compute rule metrics and epistemic breakdown
    const rulesTriggered: Record<string, number> = {};
    const epistemicDistribution: Record<KnowledgeEpistemicStatus, number> = {
      AXIOM: 0,
      FACT: 0,
      DERIVED: 0,
      THEORY: 0,
      OBSERVATION: 0,
      HYPOTHESIS: 0,
    };

    for (const c of candidates) {
      rulesTriggered[c.derivationRule] = (rulesTriggered[c.derivationRule] ?? 0) + 1;
      epistemicDistribution[c.epistemicStatus] = (epistemicDistribution[c.epistemicStatus] ?? 0) + 1;
    }

    // Deterministic summary digest
    const digestPayload = JSON.stringify({
      tenantId: callerTenantId,
      inputCount: baseEdges.length,
      candidateCount: candidates.length,
      rules: Object.keys(rulesTriggered).sort().reduce((acc, k) => {
        acc[k] = rulesTriggered[k];
        return acc;
      }, {} as Record<string, number>),
      epistemic: epistemicDistribution,
      candidateIds: candidates.map((c) => c.candidateId),
    });

    const digest = crypto.createHash('sha256').update(digestPayload).digest('hex');

    const summary: RelationshipLearningSummary = Object.freeze({
      tenantId: callerTenantId,
      inputRelationshipsCount: baseEdges.length,
      inferredCandidatesCount: candidates.length,
      rulesTriggered: Object.freeze(rulesTriggered),
      epistemicDistribution: Object.freeze(epistemicDistribution),
      executionTimeMs: 0, // Deterministic zero
      digest,
    });

    return Object.freeze({
      candidates,
      summary,
    });
  }

  /**
   * Promotes an inferred candidate into an immutable canonical Relationship for VDB storage.
   */
  public promoteCandidateToCanonicalRelationship(
    candidate: InferredRelationshipCandidate,
    callerTenantId: string
  ): Relationship {
    KnowledgeGovernor.assertActuationBlocked(candidate.relationType);
    KnowledgeGovernor.assertTenantIntegrity(callerTenantId, candidate.tenantId);

    return Object.freeze({
      relationshipId: candidate.candidateId,
      sourceId: candidate.sourceId,
      targetId: candidate.targetId,
      relationType: candidate.relationType as any,
      weight: candidate.confidence,
      bidirectional: !candidate.isDirected,
      tenantId: candidate.tenantId,
      stateVersion: 1,
      checksum: candidate.checksum,
      epistemicStatus: candidate.epistemicStatus,
      evidenceIds: Object.freeze([...candidate.supportingEvidenceIds, ...candidate.premises]),
      createdAt: 1000,
      updatedAt: 1000,
    });
  }

  /**
   * Promotes an inferred candidate into a GraphEdgeRef and adds it to the GraphIndex.
   */
  public promoteCandidateToGraphEdge(
    candidate: InferredRelationshipCandidate,
    graphIndex: GraphIndex,
    callerTenantId: string
  ): GraphEdgeRef {
    KnowledgeGovernor.assertActuationBlocked(candidate.relationType);
    KnowledgeGovernor.assertTenantIntegrity(callerTenantId, candidate.tenantId);

    const edgeRef: GraphEdgeRef = {
      edgeId: candidate.candidateId,
      sourceId: candidate.sourceId,
      targetId: candidate.targetId,
      relationType: candidate.relationType,
      weight: candidate.confidence,
      tenantId: candidate.tenantId,
      stateVersion: 1,
      checksum: candidate.checksum,
      isDirected: candidate.isDirected,
    };

    return graphIndex.addEdge(edgeRef);
  }

  /**
   * Emits an advisory under sovereign read-only constraints.
   */
  public emitAdvisory(message: string): {
    readonly taskId: string;
    readonly status: 'ADVISORY_EMITTED';
    readonly message: string;
    readonly actuationBlocked: boolean;
  } {
    KnowledgeGovernor.assertActuationBlocked(message);
    return Object.freeze({
      taskId: TASK_188_ID,
      status: 'ADVISORY_EMITTED',
      message,
      actuationBlocked: IS_ACTUATION_BLOCKED,
    });
  }
}
