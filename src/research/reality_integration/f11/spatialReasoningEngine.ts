/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel F11: Master Spatial Reasoning Engine
 *
 * Coordinates multi-hop reasoning, transitivity, constraint evaluation,
 * graph traversal, spatial ordering, and formal reasoning trace generation.
 */

import {
  WorldModel,
  WorldEntity,
  WorldRelation,
  Inference,
  SpatialConstraint,
  ConstraintEvaluation,
  ReasoningTrace,
  ReasoningStep,
  EvidenceChain,
  WorldRelationType,
} from './types';
import { F11RelationshipGraph } from './relationshipGraph';
import { F11ConstraintEngine } from './constraintEngine';
import {
  generateDeterministicReasoningTraceId,
  deterministicHash,
} from './determinism';

export class F11SpatialReasoningEngine {
  public static evaluateAllConstraints(
    model: WorldModel
  ): readonly ConstraintEvaluation[] {
    return Object.freeze(
      model.constraints.map((c) => F11ConstraintEngine.evaluateConstraint(c, model))
    );
  }

  public static traceRelationshipReasoning(
    model: WorldModel,
    sourceEntityId: string,
    targetEntityId: string,
    relationType: WorldRelationType
  ): ReasoningTrace | null {
    const src = model.entities[sourceEntityId];
    const tgt = model.entities[targetEntityId];
    if (!src || !tgt) return null;

    // Check direct relation
    const direct = model.relations.find(
      (r) =>
        r.sourceEntityId === sourceEntityId &&
        r.targetEntityId === targetEntityId &&
        r.relationType === relationType
    );

    if (direct) {
      const step: ReasoningStep = {
        stepIndex: 1,
        premiseDescription: `Geometric observation: ${src.name} coordinates vs ${tgt.name} coordinates`,
        ruleUsed: 'DIRECT_GEOMETRIC_DERIVATION',
        intermediateConclusion: `${src.name} is ${relationType} ${tgt.name}`,
        evidence: direct.evidence,
      };

      const chain: EvidenceChain = {
        chainId: `CHAIN_${direct.relationId}`,
        steps: [direct.evidence],
        isRootedInReality: true,
        chainChecksum: `CS_CHAIN_${deterministicHash(direct.relationId)}`,
      };

      return {
        traceId: generateDeterministicReasoningTraceId(direct.relationId, 1),
        query: `Is ${src.name} ${relationType} ${tgt.name}?`,
        steps: Object.freeze([step]),
        finalConclusion: `${src.name} is DIRECTLY ${relationType} ${tgt.name}.`,
        evidenceChain: Object.freeze(chain),
        realityMutation: 0,
        traceChecksum: `CS_TRACE_${deterministicHash(direct.relationId + relationType)}`,
      };
    }

    // Check inferred relation
    const inf = model.inferences.find(
      (i) =>
        i.derivedRelation.sourceEntityId === sourceEntityId &&
        i.derivedRelation.targetEntityId === targetEntityId &&
        i.derivedRelation.relationType === relationType
    );

    if (inf) {
      const steps: ReasoningStep[] = inf.reasoningPath.map((stepDesc, idx) => ({
        stepIndex: idx + 1,
        premiseDescription: stepDesc,
        ruleUsed: inf.ruleId,
        intermediateConclusion: `Premise step satisfied`,
        evidence: inf.evidence,
      }));

      const chain: EvidenceChain = {
        chainId: `CHAIN_${inf.inferenceId}`,
        steps: [inf.evidence],
        isRootedInReality: true,
        chainChecksum: `CS_CHAIN_${deterministicHash(inf.inferenceId)}`,
      };

      return {
        traceId: generateDeterministicReasoningTraceId(inf.inferenceId, 1),
        query: `Why is ${src.name} ${relationType} ${tgt.name}?`,
        steps: Object.freeze(steps),
        finalConclusion: `${src.name} is INFERRED to be ${relationType} ${tgt.name} via ${inf.ruleId}.`,
        evidenceChain: Object.freeze(chain),
        realityMutation: 0,
        traceChecksum: `CS_TRACE_${deterministicHash(inf.inferenceId + relationType)}`,
      };
    }

    return null;
  }
}
