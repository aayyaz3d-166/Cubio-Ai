/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel F11: R5 Read-Only Adapter
 *
 * Ingests spatial relationships and topology data from R5 without mutating R5 state.
 * Invariant: ΔReality = 0.
 */

import { SpatialRelation } from '../r5/types';
import { WorldRelationType, EvidenceType } from './types';

export class F11R5Adapter {
  public static mapR5RelationType(r5Type: string): WorldRelationType {
    switch (r5Type) {
      case 'ABOVE': return 'ABOVE';
      case 'BELOW': return 'BELOW';
      case 'LEFT': return 'LEFT_OF';
      case 'RIGHT': return 'RIGHT_OF';
      case 'FRONT': return 'FRONT_OF';
      case 'BEHIND': return 'BEHIND';
      case 'NEAR': return 'NEAR';
      case 'FAR': return 'FAR';
      case 'ADJACENT': return 'ADJACENT';
      case 'DISJOINT': return 'DISJOINT';
      case 'OVERLAPS': return 'OVERLAPS';
      case 'CONTAINS': return 'CONTAINS';
      case 'INSIDE': return 'INSIDE';
      case 'INTERSECTS': return 'INTERSECTS';
      default: return 'NEAR';
    }
  }

  public static mapR5EvidenceType(r5Evidence: string): EvidenceType {
    switch (r5Evidence) {
      case 'OBSERVED': return 'OBSERVED';
      case 'EXPLICITLY_PROVIDED': return 'EXPLICITLY_PROVIDED';
      case 'DERIVED_FROM_GEOMETRY': return 'DERIVED_FROM_GEOMETRY';
      case 'DERIVED_FROM_TOPOLOGY': return 'DERIVED_FROM_TOPOLOGY';
      default: return 'UNKNOWN';
    }
  }

  public static extractRelationships(
    relationships: readonly SpatialRelation[]
  ): readonly { sourceId: string; targetId: string; type: WorldRelationType; evidence: EvidenceType; confidence: number }[] {
    return relationships.map((rel) => ({
      sourceId: rel.sourceObjectId,
      targetId: rel.targetObjectId,
      type: this.mapR5RelationType(rel.relationType),
      evidence: this.mapR5EvidenceType(rel.evidence),
      confidence: rel.certainty === 'EXACT' ? 1.0 : 0.8,
    }));
  }
}
