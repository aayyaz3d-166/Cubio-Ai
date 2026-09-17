/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel F11: World Relation Engine
 *
 * Represents and calculates spatial and topological relationships between entities.
 * Retains strict evidence classification and confidence metrics.
 */

import {
  WorldEntity,
  WorldRelation,
  WorldRelationType,
  RelationCategory,
  Evidence,
  EvidenceType,
} from './types';
import {
  generateDeterministicRelationId,
  generateDeterministicEvidenceId,
  computeRelationChecksum,
  deterministicHash,
} from './determinism';

export class F11WorldRelationEngine {
  public static createRelation(
    modelId: string,
    sourceEntityId: string,
    targetEntityId: string,
    relationType: WorldRelationType,
    category: RelationCategory,
    evidenceType: EvidenceType,
    confidence = 1.0,
    parameters: Record<string, any> = {},
    method = 'GEOMETRIC_DERIVATION',
    description = '',
    seq = 0
  ): Readonly<WorldRelation> {
    const relationId = generateDeterministicRelationId(
      modelId,
      relationType,
      sourceEntityId,
      targetEntityId,
      seq
    );

    const evidenceId = generateDeterministicEvidenceId(relationId, evidenceType, seq);
    const evidenceChecksum = `CS_EVID_${deterministicHash(`${evidenceId}:${evidenceType}:${method}`)}`;

    const evidence: Evidence = Object.freeze({
      evidenceId,
      evidenceType,
      sourceFactIds: Object.freeze([sourceEntityId, targetEntityId]),
      method,
      description: description || `${relationType} relationship between ${sourceEntityId} and ${targetEntityId}`,
      evidenceChecksum,
    });

    const relationChecksum = computeRelationChecksum(
      sourceEntityId,
      targetEntityId,
      relationType,
      confidence
    );

    const relation: WorldRelation = {
      relationId,
      sourceEntityId,
      targetEntityId,
      relationType,
      category,
      evidence,
      confidence: Math.max(0, Math.min(1.0, confidence)),
      parameters: Object.freeze({ ...parameters }),
      relationChecksum,
    };

    return Object.freeze(relation);
  }

  /**
   * Evaluates and extracts all direct pairwise spatial relationships from entity coordinates and bounding boxes.
   */
  public static deriveDirectRelations(
    modelId: string,
    entities: Readonly<Record<string, WorldEntity>>
  ): readonly WorldRelation[] {
    const list = Object.values(entities);
    const relations: WorldRelation[] = [];
    let seq = 0;

    for (let i = 0; i < list.length; i++) {
      for (let j = 0; j < list.length; j++) {
        if (i === j) continue;
        const eA = list[i];
        const eB = list[j];

        const posA = eA.coordinates || eA.transform?.translation;
        const posB = eB.coordinates || eB.transform?.translation;

        if (!posA || !posB) continue;

        const dx = posA[0] - posB[0];
        const dy = posA[1] - posB[1];
        const dz = posA[2] - posB[2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        const evidenceType: EvidenceType =
          eA.origin === 'OBSERVED' && eB.origin === 'OBSERVED'
            ? 'DERIVED_FROM_GEOMETRY'
            : 'DERIVED_FROM_WORLD_MODEL';

        // Vertical Relations (ABOVE / BELOW)
        if (dy > 0.4) {
          relations.push(
            this.createRelation(
              modelId,
              eA.entityId,
              eB.entityId,
              'ABOVE',
              'DIRECT',
              evidenceType,
              1.0,
              { deltaY: dy },
              'COORDINATE_Y_COMPARISON',
              `${eA.name} is ABOVE ${eB.name} (ΔY = +${dy.toFixed(2)})`,
              seq++
            )
          );
        } else if (dy < -0.4) {
          relations.push(
            this.createRelation(
              modelId,
              eA.entityId,
              eB.entityId,
              'BELOW',
              'DIRECT',
              evidenceType,
              1.0,
              { deltaY: dy },
              'COORDINATE_Y_COMPARISON',
              `${eA.name} is BELOW ${eB.name} (ΔY = ${dy.toFixed(2)})`,
              seq++
            )
          );
        }

        // Horizontal Lateral Relations (LEFT_OF / RIGHT_OF)
        if (dx < -0.5) {
          relations.push(
            this.createRelation(
              modelId,
              eA.entityId,
              eB.entityId,
              'LEFT_OF',
              'DIRECT',
              evidenceType,
              1.0,
              { deltaX: dx },
              'COORDINATE_X_COMPARISON',
              `${eA.name} is LEFT_OF ${eB.name} (ΔX = ${dx.toFixed(2)})`,
              seq++
            )
          );
        } else if (dx > 0.5) {
          relations.push(
            this.createRelation(
              modelId,
              eA.entityId,
              eB.entityId,
              'RIGHT_OF',
              'DIRECT',
              evidenceType,
              1.0,
              { deltaX: dx },
              'COORDINATE_X_COMPARISON',
              `${eA.name} is RIGHT_OF ${eB.name} (ΔX = +${dx.toFixed(2)})`,
              seq++
            )
          );
        }

        // Depth Relations (FRONT_OF / BEHIND)
        if (dz > 0.5) {
          relations.push(
            this.createRelation(
              modelId,
              eA.entityId,
              eB.entityId,
              'FRONT_OF',
              'DIRECT',
              evidenceType,
              1.0,
              { deltaZ: dz },
              'COORDINATE_Z_COMPARISON',
              `${eA.name} is FRONT_OF ${eB.name} (ΔZ = +${dz.toFixed(2)})`,
              seq++
            )
          );
        } else if (dz < -0.5) {
          relations.push(
            this.createRelation(
              modelId,
              eA.entityId,
              eB.entityId,
              'BEHIND',
              'DIRECT',
              evidenceType,
              1.0,
              { deltaZ: dz },
              'COORDINATE_Z_COMPARISON',
              `${eA.name} is BEHIND ${eB.name} (ΔZ = ${dz.toFixed(2)})`,
              seq++
            )
          );
        }

        // Proximity (NEAR / FAR)
        if (dist < 4.0) {
          relations.push(
            this.createRelation(
              modelId,
              eA.entityId,
              eB.entityId,
              'NEAR',
              'DIRECT',
              evidenceType,
              1.0,
              { distance: dist },
              'EUCLIDEAN_DISTANCE',
              `${eA.name} is NEAR ${eB.name} (dist = ${dist.toFixed(2)}m)`,
              seq++
            )
          );
        } else if (dist > 10.0) {
          relations.push(
            this.createRelation(
              modelId,
              eA.entityId,
              eB.entityId,
              'FAR',
              'DIRECT',
              evidenceType,
              1.0,
              { distance: dist },
              'EUCLIDEAN_DISTANCE',
              `${eA.name} is FAR from ${eB.name} (dist = ${dist.toFixed(2)}m)`,
              seq++
            )
          );
        }

        // Containment (CONTAINS / INSIDE)
        if (eA.entityType === 'CONTAINER' || eA.entityType === 'REGION') {
          const dimsA = eA.dimensions || { width: 5, height: 5, depth: 5 };
          const minX = posA[0] - dimsA.width / 2;
          const maxX = posA[0] + dimsA.width / 2;
          const minY = posA[1] - dimsA.height / 2;
          const maxY = posA[1] + dimsA.height / 2;
          const minZ = posA[2] - dimsA.depth / 2;
          const maxZ = posA[2] + dimsA.depth / 2;

          const inside =
            posB[0] >= minX && posB[0] <= maxX &&
            posB[1] >= minY && posB[1] <= maxY &&
            posB[2] >= minZ && posB[2] <= maxZ;

          if (inside) {
            relations.push(
              this.createRelation(
                modelId,
                eA.entityId,
                eB.entityId,
                'CONTAINS',
                'DIRECT',
                evidenceType,
                1.0,
                {},
                'BOUNDING_BOX_INTERSECTION',
                `${eA.name} CONTAINS ${eB.name}`,
                seq++
              )
            );
            relations.push(
              this.createRelation(
                modelId,
                eB.entityId,
                eA.entityId,
                'INSIDE',
                'DIRECT',
                evidenceType,
                1.0,
                {},
                'BOUNDING_BOX_INTERSECTION',
                `${eB.name} is INSIDE ${eA.name}`,
                seq++
              )
            );
          }
        }
      }
    }

    return Object.freeze(relations);
  }
}
