/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel F11: Spatial Inference Engine
 *
 * Deterministically computes multi-hop inferences across transitive relations and inversions.
 * Invariant: Every derived relation receives DERIVED_FROM_RELATIONSHIP_CHAIN and never OBSERVED.
 */

import {
  WorldEntity,
  WorldRelation,
  Inference,
  WorldRelationType,
  Evidence,
  WorldLineage,
} from './types';
import { SPATIAL_REASONING_RULES, isRelationTransitive } from './reasoningRules';
import {
  generateDeterministicInferenceId,
  generateDeterministicRelationId,
  generateDeterministicEvidenceId,
  generateDeterministicLineageId,
  computeRelationChecksum,
  deterministicHash,
} from './determinism';
import { F11RelationshipGraph } from './relationshipGraph';

export class F11InferenceEngine {
  public static runInference(
    modelId: string,
    entities: Readonly<Record<string, WorldEntity>>,
    directRelations: readonly WorldRelation[]
  ): readonly Inference[] {
    const inferences: Inference[] = [];
    const graph = new F11RelationshipGraph(entities, directRelations);
    const existingDirectKeys = new Set(
      directRelations.map((r) => `${r.sourceEntityId}:${r.targetEntityId}:${r.relationType}`)
    );
    const derivedKeys = new Set<string>();
    let seq = 0;

    // 1. Transitivity Rules (e.g. A ABOVE B and B ABOVE C -> A ABOVE C)
    const transitiveRules = SPATIAL_REASONING_RULES.filter((r) => r.isTransitive);

    for (const rule of transitiveRules) {
      const relType = rule.conclusionRelation;
      if (!isRelationTransitive(relType)) continue;

      const entityIds = Object.keys(entities).sort();

      for (const entA of entityIds) {
        // Find all multi-hop descendants reachable via this relation type
        const descendants = graph.getDescendants(entA, relType);

        for (const desc of descendants) {
          if (desc.depth > 1) {
            const entC = desc.entityId;
            const key = `${entA}:${entC}:${relType}`;

            if (!existingDirectKeys.has(key) && !derivedKeys.has(key)) {
              derivedKeys.add(key);

              const relId = generateDeterministicRelationId(
                modelId,
                relType,
                entA,
                entC,
                seq
              );
              const infId = generateDeterministicInferenceId(modelId, rule.ruleId, seq);
              const evidId = generateDeterministicEvidenceId(relId, rule.evidenceType, seq);

              const sourceRelIds = desc.path.map((p) => p.relationId);
              const reasoningPath = desc.path.map(
                (p) => `${entities[p.sourceEntityId]?.name || p.sourceEntityId} ${p.relationType} ${entities[p.targetEntityId]?.name || p.targetEntityId}`
              );

              const evidence: Evidence = Object.freeze({
                evidenceId: evidId,
                evidenceType: rule.evidenceType,
                sourceFactIds: Object.freeze(sourceRelIds),
                method: `MULTI_HOP_TRANSITIVITY_${rule.ruleId}`,
                description: `Transitive deduction via chain: ${reasoningPath.join(' -> ')}`,
                evidenceChecksum: `CS_EVID_${deterministicHash(evidId + sourceRelIds.join(':'))}`,
              });

              // Confidence decays slightly with depth
              const conf = Math.max(0.7, 1.0 - (desc.depth - 1) * 0.05);

              const derivedRelation: WorldRelation = Object.freeze({
                relationId: relId,
                sourceEntityId: entA,
                targetEntityId: entC,
                relationType: relType,
                category: 'INFERRED',
                evidence,
                confidence: conf,
                relationChecksum: computeRelationChecksum(entA, entC, relType, conf),
              });

              const lineage: WorldLineage = Object.freeze({
                lineageId: generateDeterministicLineageId(modelId, infId),
                realityStateId: 'STATE_REALITY_CANONICAL',
                worldEntityId: entA,
                parentEntityId: entC,
                derivationSource: rule.ruleId,
                version: 1,
              });

              const infChecksum = `CS_INF_${deterministicHash(`${infId}:${relId}:${conf.toFixed(4)}`)}`;

              inferences.push(
                Object.freeze({
                  inferenceId: infId,
                  ruleId: rule.ruleId,
                  derivedRelation,
                  sourceRelationIds: Object.freeze(sourceRelIds),
                  reasoningPath: Object.freeze(reasoningPath),
                  evidence,
                  confidence: conf,
                  lineage,
                  inferenceChecksum: infChecksum,
                })
              );
              seq++;
            }
          }
        }
      }
    }

    // 2. Inversion Rules (e.g. A ABOVE B -> B BELOW A)
    const inversionRules = SPATIAL_REASONING_RULES.filter((r) => r.ruleId.startsWith('RULE_INV_'));

    for (const rule of inversionRules) {
      const premiseType = rule.premiseRelations[0];
      const conclusionType = rule.conclusionRelation;

      const matchingDirect = directRelations.filter((r) => r.relationType === premiseType);

      for (const rel of matchingDirect) {
        const src = rel.targetEntityId; // Inverted
        const tgt = rel.sourceEntityId;
        const key = `${src}:${tgt}:${conclusionType}`;

        if (!existingDirectKeys.has(key) && !derivedKeys.has(key)) {
          derivedKeys.add(key);

          const relId = generateDeterministicRelationId(modelId, conclusionType, src, tgt, seq);
          const infId = generateDeterministicInferenceId(modelId, rule.ruleId, seq);
          const evidId = generateDeterministicEvidenceId(relId, rule.evidenceType, seq);

          const evidence: Evidence = Object.freeze({
            evidenceId: evidId,
            evidenceType: rule.evidenceType,
            sourceFactIds: Object.freeze([rel.relationId]),
            method: `INVERSION_${rule.ruleId}`,
            description: `Inverted from '${entities[tgt]?.name || tgt} ${premiseType} ${entities[src]?.name || src}'`,
            evidenceChecksum: `CS_EVID_${deterministicHash(evidId + rel.relationId)}`,
          });

          const derivedRelation: WorldRelation = Object.freeze({
            relationId: relId,
            sourceEntityId: src,
            targetEntityId: tgt,
            relationType: conclusionType,
            category: 'INFERRED',
            evidence,
            confidence: rel.confidence,
            relationChecksum: computeRelationChecksum(src, tgt, conclusionType, rel.confidence),
          });

          const lineage: WorldLineage = Object.freeze({
            lineageId: generateDeterministicLineageId(modelId, infId),
            realityStateId: 'STATE_REALITY_CANONICAL',
            worldEntityId: src,
            parentEntityId: tgt,
            derivationSource: rule.ruleId,
            version: 1,
          });

          const infChecksum = `CS_INF_${deterministicHash(`${infId}:${relId}:${rel.confidence.toFixed(4)}`)}`;

          inferences.push(
            Object.freeze({
              inferenceId: infId,
              ruleId: rule.ruleId,
              derivedRelation,
              sourceRelationIds: Object.freeze([rel.relationId]),
              reasoningPath: Object.freeze([`${entities[tgt]?.name || tgt} ${premiseType} ${entities[src]?.name || src}`]),
              evidence,
              confidence: rel.confidence,
              lineage,
              inferenceChecksum: infChecksum,
            })
          );
          seq++;
        }
      }
    }

    return Object.freeze(inferences);
  }
}
