/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R8: Transform Engine
 *
 * Downstream Workspace transformations (TRANSLATE, ROTATE, SCALE).
 * Maintains two completely separate coordinate domains:
 *   AUTHORITATIVE REALITY TRANSFORM  (immutable [5,3,6])
 *   WORKSPACE VISUAL TRANSFORM       (translation/rotation/scale overlay)
 *
 * Example:
 *   Reality: [5,3,6]  +  Workspace translation: [+10,0,0]  →  Visual position: [15,3,6]
 *   Reality remains [5,3,6].
 */

import {
  WorkspaceTransform,
  WorkspaceTranslation,
  WorkspaceRotation,
  WorkspaceScale,
  InteractionTarget,
} from './types';
import { computeTransformChecksum } from './determinism';
import { R7InteractionReader } from './r7Adapters';

export class R8TransformEngine {
  public static readonly IDENTITY_TRANSFORM: WorkspaceTransform = R7InteractionReader.DEFAULT_TRANSFORM;

  public static translate(
    current: WorkspaceTransform,
    delta: WorkspaceTranslation
  ): WorkspaceTransform {
    const translation: WorkspaceTranslation = Object.freeze([
      current.translation[0] + delta[0],
      current.translation[1] + delta[1],
      current.translation[2] + delta[2],
    ]);
    const checksum = computeTransformChecksum(translation, current.rotation, current.scale);

    return Object.freeze({
      translation,
      rotation: current.rotation,
      scale: current.scale,
      transformChecksum: checksum,
    });
  }

  public static rotate(
    current: WorkspaceTransform,
    delta: WorkspaceRotation
  ): WorkspaceTransform {
    const rotation: WorkspaceRotation = Object.freeze([
      current.rotation[0] + delta[0],
      current.rotation[1] + delta[1],
      current.rotation[2] + delta[2],
    ]);
    const checksum = computeTransformChecksum(current.translation, rotation, current.scale);

    return Object.freeze({
      translation: current.translation,
      rotation,
      scale: current.scale,
      transformChecksum: checksum,
    });
  }

  public static scale(
    current: WorkspaceTransform,
    factor: WorkspaceScale
  ): WorkspaceTransform {
    const newScale: WorkspaceScale = Object.freeze([
      current.scale[0] * factor[0],
      current.scale[1] * factor[1],
      current.scale[2] * factor[2],
    ]);
    const checksum = computeTransformChecksum(current.translation, current.rotation, newScale);

    return Object.freeze({
      translation: current.translation,
      rotation: current.rotation,
      scale: newScale,
      transformChecksum: checksum,
    });
  }

  public static computeVisualPosition(
    realityCoordinates: readonly [number, number, number],
    transform: WorkspaceTransform
  ): readonly [number, number, number] {
    return Object.freeze([
      realityCoordinates[0] + transform.translation[0],
      realityCoordinates[1] + transform.translation[1],
      realityCoordinates[2] + transform.translation[2],
    ]);
  }

  public static computeTransformDelta(
    before: WorkspaceTransform,
    after: WorkspaceTransform
  ): WorkspaceTransform {
    const translation: WorkspaceTranslation = Object.freeze([
      after.translation[0] - before.translation[0],
      after.translation[1] - before.translation[1],
      after.translation[2] - before.translation[2],
    ]);
    const rotation: WorkspaceRotation = Object.freeze([
      after.rotation[0] - before.rotation[0],
      after.rotation[1] - before.rotation[1],
      after.rotation[2] - before.rotation[2],
    ]);
    const scale: WorkspaceScale = Object.freeze([
      before.scale[0] !== 0 ? after.scale[0] / before.scale[0] : 1,
      before.scale[1] !== 0 ? after.scale[1] / before.scale[1] : 1,
      before.scale[2] !== 0 ? after.scale[2] / before.scale[2] : 1,
    ]);
    const checksum = computeTransformChecksum(translation, rotation, scale);

    return Object.freeze({
      translation,
      rotation,
      scale,
      transformChecksum: checksum,
    });
  }

  public static resetTransform(): WorkspaceTransform {
    return R8TransformEngine.IDENTITY_TRANSFORM;
  }

  public static applyTransformToTarget(
    target: InteractionTarget,
    newTransform: WorkspaceTransform
  ): InteractionTarget {
    const visualPosition = R8TransformEngine.computeVisualPosition(
      target.realityCoordinates,
      newTransform
    );

    return Object.freeze({
      ...target,
      workspaceTransform: newTransform,
      visualPosition,
    });
  }
}
