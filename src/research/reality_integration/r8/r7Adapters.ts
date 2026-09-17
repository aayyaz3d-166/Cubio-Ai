/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R8: R7 Read-Only Integration Adapter
 *
 * Read-only interface consuming R7 Scene Graph & Visual Objects without mutation.
 */

import { R7SceneGraph, R7VisualObject } from '../r7/types';
import { WorkspaceState } from '../r6/types';
import {
  InteractionTarget,
  WorkspaceTransform,
} from './types';
import { computeTransformChecksum } from './determinism';

export class R7InteractionReader {
  public static readonly DEFAULT_TRANSFORM: WorkspaceTransform = Object.freeze({
    translation: Object.freeze([0, 0, 0] as const),
    rotation: Object.freeze([0, 0, 0] as const),
    scale: Object.freeze([1, 1, 1] as const),
    transformChecksum: computeTransformChecksum([0, 0, 0], [0, 0, 0], [1, 1, 1]),
  });

  public static createTargetFromVisualObject(
    vo: R7VisualObject,
    transform: WorkspaceTransform = R7InteractionReader.DEFAULT_TRANSFORM
  ): InteractionTarget {
    const realityCoords = vo.transform.coordinates;
    const visualPosition: readonly [number, number, number] = Object.freeze([
      realityCoords[0] + transform.translation[0],
      realityCoords[1] + transform.translation[1],
      realityCoords[2] + transform.translation[2],
    ]);

    return Object.freeze({
      visualObjectId: vo.identity.visualObjectId,
      workspaceObjectId: vo.identity.workspaceObjectId,
      realityObjectId: vo.identity.realityObjectId,
      realityStateId: vo.identity.realityStateId,
      realityCoordinates: realityCoords,
      workspaceTransform: transform,
      visualPosition,
      certainty: vo.certainty,
      origin: vo.origin,
    });
  }

  public static extractTargets(
    sceneGraph: R7SceneGraph,
    existingTransforms: Readonly<Record<string, WorkspaceTransform>> = {}
  ): Readonly<Record<string, InteractionTarget>> {
    const targets: Record<string, InteractionTarget> = {};

    for (const node of sceneGraph.nodes) {
      const vo = node.visualObject;
      const xform = existingTransforms[vo.identity.visualObjectId] ?? R7InteractionReader.DEFAULT_TRANSFORM;
      targets[vo.identity.visualObjectId] = R7InteractionReader.createTargetFromVisualObject(vo, xform);
    }

    return Object.freeze(targets);
  }

  public static readRealityStateId(wsState: WorkspaceState): string {
    return wsState.realityBinding.realityStateId;
  }

  public static readRealityChecksum(wsState: WorkspaceState): string {
    return wsState.realityBinding.realityStateChecksum;
  }

  public static readWorkspaceChecksum(wsState: WorkspaceState): string {
    return wsState.workspaceChecksum;
  }
}
