/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.2: Reality Mutation Engine
 *
 * Implements atomic, validated, deterministic mutations over WorkspaceReality.
 */

import { WorkspaceObject, WorkspaceReality } from '../p61/types';
import {
  addObjectToReality,
  removeObjectFromReality,
  moveObjectInReality,
  updateObjectInReality,
  duplicateObjectInReality,
  createDefaultExperimentalReality,
  createEmptyReality,
  createCanonicalP5RealityCopy,
} from '../p61/realityBuilder';
import { generateDeterministicObjectId } from './determinism';

export class RealityMutationEngine {
  public static createObject(
    reality: WorkspaceReality,
    partial?: Partial<Omit<WorkspaceObject, 'id'>> & { id?: string }
  ): { updatedReality: WorkspaceReality; createdObjectId: string } {
    const nextId = partial?.id || generateDeterministicObjectId(reality.objects.length);
    const newObj: WorkspaceObject = {
      id: nextId,
      label: partial?.label || `Node ${nextId.replace('P62_OBJ_', '')}`,
      position: partial?.position || [
        5 + (reality.objects.length % 5) * 5,
        3 + (reality.objects.length % 3) * 5,
        6 + (reality.objects.length % 4) * 5,
      ],
      category: partial?.category || 'USER_EXPERIMENTAL',
      color: partial?.color || '#06b6d4',
      radius: partial?.radius || 8,
      isCanonicalCopy: false,
      metadata: partial?.metadata || { createdBy: 'P6.2_MUTATION_ENGINE' },
      internalPayload: partial?.internalPayload,
    };

    const updatedReality = addObjectToReality(reality, newObj);
    return { updatedReality, createdObjectId: nextId };
  }

  public static moveObject(
    reality: WorkspaceReality,
    objectId: string,
    newPosition: readonly [number, number, number]
  ): WorkspaceReality {
    if (!Array.isArray(newPosition) || newPosition.length !== 3 || newPosition.some((v) => isNaN(v) || !isFinite(v))) {
      throw new Error(`Invalid position vector [${newPosition}]`);
    }
    return moveObjectInReality(reality, objectId, newPosition);
  }

  public static duplicateObject(
    reality: WorkspaceReality,
    objectId: string
  ): { updatedReality: WorkspaceReality; duplicatedObjectId: string | null } {
    const target = reality.objects.find((o) => o.id === objectId);
    if (!target) return { updatedReality: reality, duplicatedObjectId: null };

    const newId = generateDeterministicObjectId(reality.objects.length);
    const newObj: WorkspaceObject = {
      ...target,
      id: newId,
      label: `${target.label} (Copy)`,
      position: [target.position[0] + 5, target.position[1] + 5, target.position[2] + 5],
      isCanonicalCopy: false,
    };

    const updatedReality = addObjectToReality(reality, newObj);
    return { updatedReality, duplicatedObjectId: newId };
  }

  public static deleteObject(reality: WorkspaceReality, objectId: string): WorkspaceReality {
    return removeObjectFromReality(reality, objectId);
  }

  public static resetReality(): WorkspaceReality {
    return createDefaultExperimentalReality();
  }

  public static clearReality(): WorkspaceReality {
    return createEmptyReality();
  }

  public static loadCanonicalCopy(): WorkspaceReality {
    return createCanonicalP5RealityCopy();
  }
}
