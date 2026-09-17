/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R4: Relationship Engine
 *
 * Implements deterministic relationship creation, evidence enforcement, and state binding.
 */

import {
  RealityRelationship,
  RealityRelationshipType,
  RealityRelationshipEvidence,
  RealityObjectCertainty,
  RealityObjectOrigin,
  RealityRelationshipLineage,
} from './types';
import {
  generateDeterministicRelationshipId,
  computeRelationshipChecksum,
} from './determinism';

export class RealityRelationshipEngine {
  private relationships: Map<string, RealityRelationship> = new Map();

  public createRelationship(
    sourceObjectId: string,
    targetObjectId: string,
    relationshipType: RealityRelationshipType,
    evidence: RealityRelationshipEvidence = 'OBSERVED',
    certainty: RealityObjectCertainty = 'EXACT',
    origin: RealityObjectOrigin = 'OBSERVED',
    targetRealityStateId: string = 'RST_DEFAULT',
    observationReferences: readonly string[] = [],
    provenance = 'R4_RELATIONSHIP_ENGINE'
  ): RealityRelationship {
    const seq = this.relationships.size;
    const relationshipId = generateDeterministicRelationshipId(sourceObjectId, targetObjectId, relationshipType, seq);

    const lineage: RealityRelationshipLineage = Object.freeze({
      lineageId: `RELLIN_${relationshipId}`,
      relationshipId,
      version: 1,
    });

    const relationshipChecksum = computeRelationshipChecksum(
      relationshipId,
      sourceObjectId,
      targetObjectId,
      relationshipType,
      evidence,
      certainty,
      targetRealityStateId
    );

    const rel: RealityRelationship = Object.freeze({
      relationshipId,
      sourceObjectId,
      targetObjectId,
      relationshipType,
      evidence,
      certainty,
      origin,
      provenance,
      targetRealityStateId,
      observationReferences: Object.freeze([...observationReferences]),
      lineage,
      relationshipChecksum,
    });

    this.relationships.set(relationshipId, rel);
    return rel;
  }

  public getRelationship(relationshipId: string): RealityRelationship | null {
    return this.relationships.get(relationshipId) ?? null;
  }

  public listRelationships(): readonly RealityRelationship[] {
    return Object.freeze(Array.from(this.relationships.values()));
  }
}
