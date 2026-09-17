/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R8: Transform Commit Engine
 *
 * Controlled Workspace transform commits. A commit means Workspace state changed.
 * It does NOT mean Reality state changed. Reality remains authoritative and unchanged.
 */

import {
  TransformCommit,
  WorkspaceTransform,
  InteractionTarget,
  InteractionProvenance,
} from './types';
import { R8TransformEngine } from './transformEngine';
import {
  generateDeterministicCommitId,
  deterministicHash,
} from './determinism';

export class R8TransformCommitEngine {
  public static commitTransform(
    target: InteractionTarget,
    newTransform: WorkspaceTransform,
    provenance: InteractionProvenance,
    seq = 0
  ): TransformCommit {
    const commitId = generateDeterministicCommitId(target.visualObjectId, seq);
    const previousTransform = target.workspaceTransform;
    const transformDelta = R8TransformEngine.computeTransformDelta(previousTransform, newTransform);
    const visualPosition = R8TransformEngine.computeVisualPosition(
      target.realityCoordinates,
      newTransform
    );

    const commitChecksum = `CS_CMT_${deterministicHash(
      JSON.stringify([
        commitId,
        target.realityObjectId,
        target.realityStateId,
        target.realityCoordinates,
        previousTransform.transformChecksum,
        newTransform.transformChecksum,
        seq,
      ])
    )}`;

    return Object.freeze({
      commitId,
      targetObjectId: target.visualObjectId,
      realityObjectId: target.realityObjectId,
      realityStateId: target.realityStateId,
      originalRealityCoordinates: target.realityCoordinates,
      previousTransform,
      newTransform,
      transformDelta,
      visualPosition,
      provenance,
      sequenceIndex: seq,
      commitChecksum,
    });
  }
}
