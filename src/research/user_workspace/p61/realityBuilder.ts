/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.1: Reality Builder
 *
 * Allows controlled construction of underlying reality X.
 * Distinguishes authoritative canonical data from user-generated experimental data.
 */

import { WorkspaceObject, WorkspaceReality, WorkspaceSourceMode } from './types';
import { CANONICAL_P52_RECORDS } from '../../observation_reconstruction/p52/experimentState';

export function simpleHash(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function computeRealityChecksum(objects: readonly WorkspaceObject[]): string {
  const normalized = objects.map((o) => [
    o.id,
    o.label,
    o.position[0],
    o.position[1],
    o.position[2],
    o.category,
    o.color,
    o.internalPayload || '',
  ]);
  return simpleHash(JSON.stringify(normalized));
}

/**
 * Creates the default experimental reality:
 * Node A: [5, 3, 6]
 * Node B: [15, 3, 6] (X displacement +10)
 * Node C: [5, 13, 6] (Y displacement +10)
 * Node D: [5, 3, 16] (Z displacement +10)
 */
export function createDefaultExperimentalReality(): WorkspaceReality {
  const objects: readonly WorkspaceObject[] = Object.freeze([
    {
      id: 'P61_OBJ_A',
      label: 'Object A (Origin Reference)',
      position: [5, 3, 6] as const,
      category: 'EXPERIMENTAL_ORIGIN',
      color: '#06b6d4',
      radius: 8,
      isCanonicalCopy: false,
      metadata: { description: 'Base origin spatial reference node' },
      internalPayload: 'PAYLOAD_NODE_A',
    },
    {
      id: 'P61_OBJ_B',
      label: 'Object B (+10 X Displacement)',
      position: [15, 3, 6] as const,
      category: 'X_AXIS_DISPLACED',
      color: '#3b82f6',
      radius: 8,
      isCanonicalCopy: false,
      metadata: { displacement: '+10 X' },
      internalPayload: 'PAYLOAD_NODE_B',
    },
    {
      id: 'P61_OBJ_C',
      label: 'Object C (+10 Y Displacement)',
      position: [5, 13, 6] as const,
      category: 'Y_AXIS_DISPLACED',
      color: '#10b981',
      radius: 8,
      isCanonicalCopy: false,
      metadata: { displacement: '+10 Y' },
      internalPayload: 'PAYLOAD_NODE_C',
    },
    {
      id: 'P61_OBJ_D',
      label: 'Object D (+10 Z Displacement)',
      position: [5, 3, 16] as const,
      category: 'Z_AXIS_DISPLACED',
      color: '#f59e0b',
      radius: 8,
      isCanonicalCopy: false,
      metadata: { displacement: '+10 Z' },
      internalPayload: 'PAYLOAD_NODE_D',
    },
  ]);

  return Object.freeze({
    realityId: 'P61_EXPERIMENTAL_REALITY_DEFAULT',
    realityChecksum: computeRealityChecksum(objects),
    objects,
    sourceMode: 'USER_CONSTRUCTED',
    timestamp: 0,
  });
}

/**
 * Creates an empty workspace reality.
 */
export function createEmptyReality(): WorkspaceReality {
  const objects: readonly WorkspaceObject[] = Object.freeze([]);
  return Object.freeze({
    realityId: 'P61_EMPTY_REALITY',
    realityChecksum: computeRealityChecksum(objects),
    objects,
    sourceMode: 'USER_CONSTRUCTED',
    timestamp: 0,
  });
}

/**
 * Creates a workspace-owned copy of the Canonical P5 Reality.
 * Protects the source by making an isolated, cloneable copy.
 */
export function createCanonicalP5RealityCopy(): WorkspaceReality {
  const objects: WorkspaceObject[] = CANONICAL_P52_RECORDS.map((rec) => ({
    id: `P61_COPY_${rec.id}`,
    label: rec.entityName,
    position: [rec.canonicalPosition[0], rec.canonicalPosition[1], rec.canonicalPosition[2]],
    category: rec.category,
    color: rec.color,
    radius: 8,
    isCanonicalCopy: true,
    metadata: {
      canonicalSourceId: rec.id,
      relationships: [...rec.relationships],
    },
    internalPayload: rec.internalPayload,
  }));

  const frozen = Object.freeze(objects);
  return Object.freeze({
    realityId: 'P61_CANONICAL_P5_COPY',
    realityChecksum: computeRealityChecksum(frozen),
    objects: frozen,
    sourceMode: 'P5_CANONICAL_COPY',
    timestamp: 0,
  });
}

/**
 * Immutable Builders & Modifiers for Reality Objects
 */
export function addObjectToReality(
  reality: WorkspaceReality,
  object: Omit<WorkspaceObject, 'id'> & { id?: string }
): WorkspaceReality {
  const id = object.id || `P61_OBJ_${(reality.objects.length + 1).toString().padStart(2, '0')}`;
  const newObj: WorkspaceObject = {
    id,
    label: object.label,
    position: object.position,
    category: object.category,
    color: object.color,
    radius: object.radius || 8,
    isCanonicalCopy: false,
    metadata: object.metadata || {},
    internalPayload: object.internalPayload,
  };

  const nextObjects = Object.freeze([...reality.objects, newObj]);
  return Object.freeze({
    realityId: reality.realityId,
    realityChecksum: computeRealityChecksum(nextObjects),
    objects: nextObjects,
    sourceMode: reality.sourceMode,
    timestamp: Date.now(),
  });
}

export function removeObjectFromReality(
  reality: WorkspaceReality,
  objectId: string
): WorkspaceReality {
  const nextObjects = Object.freeze(reality.objects.filter((o) => o.id !== objectId));
  return Object.freeze({
    realityId: reality.realityId,
    realityChecksum: computeRealityChecksum(nextObjects),
    objects: nextObjects,
    sourceMode: reality.sourceMode,
    timestamp: Date.now(),
  });
}

export function moveObjectInReality(
  reality: WorkspaceReality,
  objectId: string,
  newPosition: readonly [number, number, number]
): WorkspaceReality {
  const nextObjects = Object.freeze(
    reality.objects.map((o) => {
      if (o.id === objectId) {
        return { ...o, position: newPosition };
      }
      return o;
    })
  );

  return Object.freeze({
    realityId: reality.realityId,
    realityChecksum: computeRealityChecksum(nextObjects),
    objects: nextObjects,
    sourceMode: reality.sourceMode,
    timestamp: Date.now(),
  });
}

export function updateObjectInReality(
  reality: WorkspaceReality,
  objectId: string,
  updates: Partial<Omit<WorkspaceObject, 'id'>>
): WorkspaceReality {
  const nextObjects = Object.freeze(
    reality.objects.map((o) => {
      if (o.id === objectId) {
        return {
          ...o,
          ...updates,
          position: updates.position || o.position,
          metadata: { ...o.metadata, ...(updates.metadata || {}) },
        };
      }
      return o;
    })
  );

  return Object.freeze({
    realityId: reality.realityId,
    realityChecksum: computeRealityChecksum(nextObjects),
    objects: nextObjects,
    sourceMode: reality.sourceMode,
    timestamp: Date.now(),
  });
}

export function duplicateObjectInReality(
  reality: WorkspaceReality,
  objectId: string
): WorkspaceReality {
  const target = reality.objects.find((o) => o.id === objectId);
  if (!target) return reality;

  const duplicateId = `${target.id}_COPY_${reality.objects.length + 1}`;
  const duplicatedObj: WorkspaceObject = {
    ...target,
    id: duplicateId,
    label: `${target.label} (Copy)`,
    position: [target.position[0] + 5, target.position[1] + 5, target.position[2] + 5],
    isCanonicalCopy: false,
  };

  const nextObjects = Object.freeze([...reality.objects, duplicatedObj]);
  return Object.freeze({
    realityId: reality.realityId,
    realityChecksum: computeRealityChecksum(nextObjects),
    objects: nextObjects,
    sourceMode: reality.sourceMode,
    timestamp: Date.now(),
  });
}
