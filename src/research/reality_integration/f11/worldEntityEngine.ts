/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel F11: World Entity Engine
 *
 * Creates and manages canonical F11 World Entities (Objects, Regions, Containers, Spatial Entities).
 * Preserves identity, origin, certainty, provenance, lineage, and spatial coordinates.
 */

import {
  WorldEntity,
  WorldEntityType,
  WorldEntityOrigin,
  WorldEntityCertainty,
  WorldProvenance,
  WorldLineage,
} from './types';
import {
  generateDeterministicEntityId,
  generateDeterministicLineageId,
  computeEntityChecksum,
} from './determinism';

export class F11WorldEntityEngine {
  public static createEntity(
    modelId: string,
    name: string,
    entityType: WorldEntityType,
    origin: WorldEntityOrigin,
    certainty: WorldEntityCertainty,
    coordinates?: readonly [number, number, number],
    dimensions?: { width: number; height: number; depth: number; radius?: number },
    transform?: {
      translation: readonly [number, number, number];
      rotation: readonly [number, number, number];
      scale: readonly [number, number, number];
    },
    parentEntityId?: string | null,
    properties: Record<string, any> = {},
    actorId = 'SYSTEM',
    reason = 'WORLD_MODEL_INGESTION',
    seq = 0
  ): Readonly<WorldEntity> {
    const entityId = generateDeterministicEntityId(modelId, name, seq);
    const entityChecksum = computeEntityChecksum(name, entityType, origin, coordinates);

    const provenance: WorldProvenance = Object.freeze({
      actorId,
      reason,
      sourceDomain: origin === 'OBSERVED' ? 'REALITY' : 'WORLD_MODEL',
      timestamp: Date.now(),
    });

    const lineage: WorldLineage = Object.freeze({
      lineageId: generateDeterministicLineageId(modelId, entityId),
      realityStateId: 'STATE_REALITY_CANONICAL',
      worldEntityId: entityId,
      parentEntityId: parentEntityId || null,
      derivationSource: reason,
      version: 1,
    });

    const entity: WorldEntity = {
      entityId,
      name,
      entityType,
      origin,
      certainty,
      provenance,
      lineage,
      coordinates: coordinates ? Object.freeze([coordinates[0], coordinates[1], coordinates[2]]) : undefined,
      dimensions: dimensions ? Object.freeze({ ...dimensions }) : undefined,
      transform: transform
        ? {
            translation: [transform.translation[0], transform.translation[1], transform.translation[2]] as const,
            rotation: [transform.rotation[0], transform.rotation[1], transform.rotation[2]] as const,
            scale: [transform.scale[0], transform.scale[1], transform.scale[2]] as const,
          }
        : undefined,
      properties: Object.freeze({ ...properties }),
      parentEntityId: parentEntityId || null,
      entityChecksum,
    };

    return Object.freeze(entity);
  }

  public static createRegion(
    modelId: string,
    name: string,
    bounds: { min: readonly [number, number, number]; max: readonly [number, number, number] },
    seq = 0
  ): Readonly<WorldEntity> {
    const center: [number, number, number] = [
      (bounds.min[0] + bounds.max[0]) / 2,
      (bounds.min[1] + bounds.max[1]) / 2,
      (bounds.min[2] + bounds.max[2]) / 2,
    ];
    const dims = {
      width: bounds.max[0] - bounds.min[0],
      height: bounds.max[1] - bounds.min[1],
      depth: bounds.max[2] - bounds.min[2],
    };

    return this.createEntity(
      modelId,
      name,
      'REGION',
      'DERIVED',
      'CONSTRAINED',
      center,
      dims,
      undefined,
      null,
      { bounds },
      'SYSTEM',
      'REGION_DEFINITION',
      seq
    );
  }

  public static createContainer(
    modelId: string,
    name: string,
    coordinates: readonly [number, number, number],
    dimensions: { width: number; height: number; depth: number },
    capacity = 10,
    seq = 0
  ): Readonly<WorldEntity> {
    return this.createEntity(
      modelId,
      name,
      'CONTAINER',
      'USER_CONSTRUCTED',
      'EXACT',
      coordinates,
      dimensions,
      undefined,
      null,
      { capacity, contents: [] },
      'SYSTEM',
      'CONTAINER_CREATION',
      seq
    );
  }
}
