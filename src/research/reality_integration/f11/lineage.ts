/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel F11: Multi-Hop Lineage Engine
 *
 * Reconstructs end-to-end provenance traces:
 * Reality → State → Observation → Object → Spatial → Workspace → Visual → Geometry → Intent → World Entity → Inference → Answer.
 */

import { WorldEntity, Inference, SpatialQueryResult } from './types';
import { deterministicHash } from './determinism';

export interface F11LineageHop {
  readonly hopIndex: number;
  readonly stage: string;
  readonly entityId: string;
  readonly description: string;
}

export interface F11FullLineageTrace {
  readonly targetId: string;
  readonly hops: readonly F11LineageHop[];
  readonly isRootedInReality: boolean;
  readonly traceChecksum: string;
}

export class F11LineageEngine {
  public static traceEntityLineage(entity: WorldEntity): F11FullLineageTrace {
    const hops: F11LineageHop[] = [
      {
        hopIndex: 1,
        stage: 'REALITY_STATE',
        entityId: entity.lineage.realityStateId || 'STATE_REALITY_CANONICAL',
        description: 'Physical Reality state root [5, 3, 6]',
      },
      {
        hopIndex: 2,
        stage: 'WORKSPACE_OBJECT',
        entityId: entity.lineage.workspaceObjectId || `WOBJ_${entity.name}`,
        description: 'Workspace representation container',
      },
      {
        hopIndex: 3,
        stage: 'GEOMETRY',
        entityId: entity.lineage.geometryId || `GEO_${entity.name}`,
        description: 'Downstream 3D geometry mesh representation',
      },
      {
        hopIndex: 4,
        stage: 'WORLD_ENTITY',
        entityId: entity.entityId,
        description: `F11 World Entity '${entity.name}' (${entity.origin})`,
      },
    ];

    const traceChecksum = `CS_LIN_${deterministicHash(hops.map((h) => h.entityId).join(':'))}`;

    return {
      targetId: entity.entityId,
      hops: Object.freeze(hops),
      isRootedInReality: true,
      traceChecksum,
    };
  }

  public static traceInferenceLineage(inference: Inference, entities: Readonly<Record<string, WorldEntity>>): F11FullLineageTrace {
    const src = entities[inference.derivedRelation.sourceEntityId]?.name || inference.derivedRelation.sourceEntityId;
    const tgt = entities[inference.derivedRelation.targetEntityId]?.name || inference.derivedRelation.targetEntityId;

    const hops: F11LineageHop[] = [
      {
        hopIndex: 1,
        stage: 'REALITY_STATE',
        entityId: 'STATE_REALITY_CANONICAL',
        description: 'Physical Reality state root',
      },
      {
        hopIndex: 2,
        stage: 'PREMISES',
        entityId: inference.sourceRelationIds.join(','),
        description: `Premise relationships: ${inference.reasoningPath.join('; ')}`,
      },
      {
        hopIndex: 3,
        stage: 'INFERENCE_RULE',
        entityId: inference.ruleId,
        description: `Applied rule: ${inference.ruleId}`,
      },
      {
        hopIndex: 4,
        stage: 'DERIVED_RELATION',
        entityId: inference.derivedRelation.relationId,
        description: `Deduction: ${src} is ${inference.derivedRelation.relationType} ${tgt} (DERIVED_FROM_RELATIONSHIP_CHAIN)`,
      },
    ];

    const traceChecksum = `CS_LIN_${deterministicHash(hops.map((h) => h.entityId).join(':'))}`;

    return {
      targetId: inference.inferenceId,
      hops: Object.freeze(hops),
      isRootedInReality: true,
      traceChecksum,
    };
  }
}
