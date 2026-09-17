/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel F11: Spatial Query Engine
 *
 * Evaluates structured spatial queries (Relations, Superlatives, Betweenness, Paths, Changes)
 * against the World Model, generating deterministic explanations and reasoning traces.
 */

import {
  WorldModel,
  SpatialQuery,
  SpatialQueryResult,
  WorldRelation,
  ReasoningTrace,
  ReasoningStep,
  EvidenceChain,
  Evidence,
  WorldRelationType,
} from './types';
import { F11ContextResolver } from './contextResolver';
import { F11RelationshipGraph } from './relationshipGraph';
import {
  generateDeterministicQueryId,
  generateDeterministicReasoningTraceId,
  deterministicHash,
} from './determinism';

export class F11QueryEngine {
  public static parseQuery(rawText: string, model: WorldModel): SpatialQuery {
    const text = rawText.toLowerCase().trim();
    const queryId = generateDeterministicQueryId(model.modelId, Math.floor(Math.random() * 1000));

    // 1. Superlative Queries
    if (/\b(leftmost|on the left)\b/.test(text)) {
      return { queryId, queryType: 'SUPERLATIVE', superlative: 'LEFTMOST', sourceText: rawText };
    }
    if (/\b(rightmost|on the right)\b/.test(text)) {
      return { queryId, queryType: 'SUPERLATIVE', superlative: 'RIGHTMOST', sourceText: rawText };
    }
    if (/\b(highest|top|uppermost)\b/.test(text)) {
      return { queryId, queryType: 'SUPERLATIVE', superlative: 'HIGHEST', sourceText: rawText };
    }
    if (/\b(lowest|bottom)\b/.test(text)) {
      return { queryId, queryType: 'SUPERLATIVE', superlative: 'LOWEST', sourceText: rawText };
    }

    // 2. Betweenness (e.g. "what is between X and Y")
    const betweenMatch = text.match(/between\s+([a-z0-9_\-]+)\s+and\s+([a-z0-9_\-]+)/);
    if (betweenMatch) {
      const resA = F11ContextResolver.resolveEntity(betweenMatch[1], model.entities);
      const resB = F11ContextResolver.resolveEntity(betweenMatch[2], model.entities);
      return {
        queryId,
        queryType: 'BETWEEN',
        sourceText: rawText,
        referenceEntityId: resA.resolvedEntityId,
        secondaryReferenceEntityId: resB.resolvedEntityId,
      };
    }

    // 3. Path / Connected (e.g. "path from A to C", "how are A and C connected")
    const pathMatch = text.match(/(?:path from|connection between|connected)\s+([a-z0-9_\-]+)\s+(?:to|and)\s+([a-z0-9_\-]+)/);
    if (pathMatch) {
      const resA = F11ContextResolver.resolveEntity(pathMatch[1], model.entities);
      const resB = F11ContextResolver.resolveEntity(pathMatch[2], model.entities);
      return {
        queryId,
        queryType: 'PATH',
        sourceText: rawText,
        targetEntityId: resA.resolvedEntityId,
        referenceEntityId: resB.resolvedEntityId,
      };
    }

    // 4. Relational Queries (above, below, left of, right of, near, inside, connected to)
    let relType: WorldRelationType | null = null;
    if (/\babove\b/.test(text)) relType = 'ABOVE';
    else if (/\bbelow\b|\bunder\b/.test(text)) relType = 'BELOW';
    else if (/\bleft of\b|\bto the left\b/.test(text)) relType = 'LEFT_OF';
    else if (/\bright of\b|\bto the right\b/.test(text)) relType = 'RIGHT_OF';
    else if (/\bnear\b|\bnext to\b|\bbeside\b/.test(text)) relType = 'NEAR';
    else if (/\binside\b|\bin\b/.test(text)) relType = 'INSIDE';
    else if (/\bcontains\b/.test(text)) relType = 'CONTAINS';
    else if (/\bconnected\b/.test(text)) relType = 'CONNECTED_TO';

    // Find reference entity after relation keyword
    if (relType) {
      const parts = text.split(new RegExp(`\\b(?:${relType.toLowerCase()}|above|below|under|left of|right of|near|inside|contains|connected to)\\b`));
      const refText = parts[parts.length - 1].trim().replace(/^(the|a|an)\s+/, '');
      const resRef = F11ContextResolver.resolveEntity(refText, model.entities);

      return {
        queryId,
        queryType: 'OBJECTS_RELATION',
        sourceText: rawText,
        relationType: relType,
        referenceEntityId: resRef.resolvedEntityId,
      };
    }

    // Default: General Query
    return {
      queryId,
      queryType: 'GENERAL',
      sourceText: rawText,
    };
  }

  public static executeQuery(query: SpatialQuery, model: WorldModel): SpatialQueryResult {
    const graph = new F11RelationshipGraph(model.entities, [
      ...model.relations,
      ...model.inferences.map((i) => i.derivedRelation),
    ]);

    // ─── Query 1: Superlatives (Leftmost, Rightmost, Highest, Lowest) ───
    if (query.queryType === 'SUPERLATIVE' && query.superlative) {
      const entityList = Object.values(model.entities).filter((e) => e.coordinates);
      if (entityList.length === 0) {
        return this.buildResult(query.queryId, 'NOT_FOUND', [], [], [], 'No entities have spatial coordinates.');
      }

      let best = entityList[0];
      let axis = 'X';
      let val = best.coordinates![0];

      if (query.superlative === 'LEFTMOST') {
        entityList.sort((a, b) => a.coordinates![0] - b.coordinates![0]);
        best = entityList[0];
        axis = 'X';
        val = best.coordinates![0];
      } else if (query.superlative === 'RIGHTMOST') {
        entityList.sort((a, b) => b.coordinates![0] - a.coordinates![0]);
        best = entityList[0];
        axis = 'X';
        val = best.coordinates![0];
      } else if (query.superlative === 'HIGHEST') {
        entityList.sort((a, b) => b.coordinates![1] - a.coordinates![1]);
        best = entityList[0];
        axis = 'Y';
        val = best.coordinates![1];
      } else if (query.superlative === 'LOWEST') {
        entityList.sort((a, b) => a.coordinates![1] - b.coordinates![1]);
        best = entityList[0];
        axis = 'Y';
        val = best.coordinates![1];
      }

      const explanation = `The ${query.superlative.toLowerCase()} object is ${best.name} at ${axis}=${val.toFixed(2)}.`;
      return this.buildResult(
        query.queryId,
        'SUCCESS',
        [best.entityId],
        [],
        [],
        explanation,
        null,
        null,
        1.0
      );
    }

    // ─── Query 2: Relational Lookup (e.g. "What is above X?") ───
    if (query.queryType === 'OBJECTS_RELATION' && query.relationType && query.referenceEntityId) {
      const refEntity = model.entities[query.referenceEntityId];
      if (!refEntity) {
        return this.buildResult(
          query.queryId,
          'NOT_FOUND',
          [],
          [],
          [],
          `Reference entity '${query.referenceEntityId}' not found.`
        );
      }

      // Find all entities where entity is <relationType> refEntity
      const allRelations = [...model.relations, ...model.inferences.map((i) => i.derivedRelation)];
      const matchingRels = allRelations.filter(
        (r) => r.targetEntityId === refEntity.entityId && r.relationType === query.relationType
      );

      const matchedIds = [...new Set(matchingRels.map((r) => r.sourceEntityId))];
      const matchedNames = matchedIds.map((id) => model.entities[id]?.name || id);

      if (matchedIds.length === 0) {
        return this.buildResult(
          query.queryId,
          'SUCCESS',
          [],
          [],
          [],
          `No objects found that are ${query.relationType} ${refEntity.name}.`
        );
      }

      const matchedInferences = model.inferences.filter((i) =>
        matchingRels.some((r) => r.relationId === i.derivedRelation.relationId)
      );

      const explanation = `Found ${matchedIds.length} object(s) ${query.relationType} ${refEntity.name}: ${matchedNames.join(', ')}.`;

      // Build formal reasoning trace
      const steps: ReasoningStep[] = matchingRels.map((r, idx) => ({
        stepIndex: idx + 1,
        premiseDescription: `${model.entities[r.sourceEntityId]?.name || r.sourceEntityId} is ${r.relationType} ${refEntity.name}`,
        ruleUsed: r.category === 'DIRECT' ? 'DIRECT_COORDINATE_DERIVATION' : 'MULTI_HOP_INFERENCE',
        intermediateConclusion: `Established ${r.category.toLowerCase()} relationship ${r.relationType}`,
        evidence: r.evidence,
      }));

      const evidenceChain: EvidenceChain = Object.freeze({
        chainId: `CHAIN_${query.queryId}`,
        steps: Object.freeze(matchingRels.map((r) => r.evidence)),
        isRootedInReality: true,
        chainChecksum: `CS_CHAIN_${deterministicHash(query.queryId)}`,
      });

      const trace: ReasoningTrace = Object.freeze({
        traceId: generateDeterministicReasoningTraceId(query.queryId, 1),
        query: query.sourceText,
        steps: Object.freeze(steps),
        finalConclusion: explanation,
        evidenceChain,
        realityMutation: 0,
        traceChecksum: `CS_TRACE_${deterministicHash(query.queryId + explanation)}`,
      });

      return this.buildResult(
        query.queryId,
        'SUCCESS',
        matchedIds,
        matchingRels,
        matchedInferences,
        explanation,
        trace,
        matchingRels[0]?.evidence || null,
        1.0
      );
    }

    // ─── Query 3: Shortest Path ───
    if (query.queryType === 'PATH' && query.targetEntityId && query.referenceEntityId) {
      const path = graph.findShortestPath(query.targetEntityId, query.referenceEntityId);
      if (!path) {
        return this.buildResult(
          query.queryId,
          'NOT_FOUND',
          [],
          [],
          [],
          `No spatial connection path found between '${query.targetEntityId}' and '${query.referenceEntityId}'.`
        );
      }

      const pathNames = path.nodes.map((id) => model.entities[id]?.name || id);
      const explanation = `Spatial Path (${path.totalLength} steps): ${pathNames.join(' -> ')}`;

      return this.buildResult(
        query.queryId,
        'SUCCESS',
        path.nodes,
        path.edges,
        [],
        explanation,
        null,
        null,
        1.0
      );
    }

    // ─── Query 4: Betweenness ───
    if (query.queryType === 'BETWEEN' && query.referenceEntityId && query.secondaryReferenceEntityId) {
      const eA = model.entities[query.referenceEntityId];
      const eB = model.entities[query.secondaryReferenceEntityId];

      if (!eA || !eB || !eA.coordinates || !eB.coordinates) {
        return this.buildResult(query.queryId, 'NOT_FOUND', [], [], [], 'Reference entities lack coordinates.');
      }

      const minX = Math.min(eA.coordinates[0], eB.coordinates[0]);
      const maxX = Math.max(eA.coordinates[0], eB.coordinates[0]);

      const betweenEntities = Object.values(model.entities).filter((e) => {
        if (e.entityId === eA.entityId || e.entityId === eB.entityId || !e.coordinates) return false;
        return e.coordinates[0] > minX && e.coordinates[0] < maxX;
      });

      const matchedIds = betweenEntities.map((e) => e.entityId);
      const matchedNames = betweenEntities.map((e) => e.name);

      const explanation =
        matchedIds.length > 0
          ? `Objects between ${eA.name} and ${eB.name}: ${matchedNames.join(', ')}`
          : `No objects found between ${eA.name} and ${eB.name}.`;

      return this.buildResult(query.queryId, 'SUCCESS', matchedIds, [], [], explanation);
    }

    return this.buildResult(query.queryId, 'UNKNOWN', [], [], [], `Query '${query.sourceText}' could not be evaluated.`);
  }

  private static buildResult(
    queryId: string,
    status: 'SUCCESS' | 'AMBIGUOUS' | 'NOT_FOUND' | 'UNKNOWN',
    matchedEntityIds: readonly string[],
    relations: readonly WorldRelation[],
    inferences: readonly any[],
    explanation: string,
    reasoningTrace: ReasoningTrace | null = null,
    evidence: Evidence | null = null,
    confidence = 1.0
  ): SpatialQueryResult {
    const resultChecksum = `CS_RES_${deterministicHash(`${queryId}:${status}:${matchedEntityIds.join(',')}:${confidence.toFixed(2)}`)}`;

    return Object.freeze({
      queryId,
      status,
      matchedEntityIds: Object.freeze([...matchedEntityIds]),
      relations: Object.freeze([...relations]),
      inferences: Object.freeze([...inferences]),
      explanation,
      reasoningTrace,
      evidence,
      confidence,
      realityMutation: 0,
      resultChecksum,
    });
  }
}
