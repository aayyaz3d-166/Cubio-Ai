/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.2: Transform Controller
 *
 * Provides coordinate transformations, discrete translations, and axis clamping.
 */

import { WorkspaceObject, WorkspaceReality } from '../p61/types';
import { moveObjectInReality } from '../p61/realityBuilder';

export class TransformController {
  public static setAbsolutePosition(
    reality: WorkspaceReality,
    objectId: string,
    position: readonly [number, number, number]
  ): WorkspaceReality {
    return moveObjectInReality(reality, objectId, [
      Number(position[0]),
      Number(position[1]),
      Number(position[2]),
    ]);
  }

  public static translateObject(
    reality: WorkspaceReality,
    objectId: string,
    delta: readonly [number, number, number]
  ): WorkspaceReality {
    const target = reality.objects.find((o) => o.id === objectId);
    if (!target) return reality;

    const nextPos: [number, number, number] = [
      Number((target.position[0] + delta[0]).toFixed(3)),
      Number((target.position[1] + delta[1]).toFixed(3)),
      Number((target.position[2] + delta[2]).toFixed(3)),
    ];

    return moveObjectInReality(reality, objectId, nextPos);
  }

  public static validatePosition(pos: unknown): pos is [number, number, number] {
    if (!Array.isArray(pos) || pos.length !== 3) return false;
    return pos.every((v) => typeof v === 'number' && !isNaN(v) && isFinite(v));
  }
}
