/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R8: Transform Preview Engine
 *
 * Temporary, reversible, non-authoritative transform preview.
 * Preview is non-persistent until explicit workspace commit.
 * Canceling preview restores the exact previous workspace state.
 */

import {
  TransformPreview,
  WorkspaceTransform,
  InteractionTarget,
} from './types';
import { R8TransformEngine } from './transformEngine';
import {
  generateDeterministicPreviewId,
  deterministicHash,
} from './determinism';

export class R8TransformPreviewEngine {
  public static createTranslatePreview(
    sessionId: string,
    target: InteractionTarget,
    delta: readonly [number, number, number],
    seq = 0
  ): TransformPreview {
    const previewId = generateDeterministicPreviewId(sessionId, target.visualObjectId, seq);
    const previewTransform = R8TransformEngine.translate(target.workspaceTransform, delta);
    const previewVisualPosition = R8TransformEngine.computeVisualPosition(
      target.realityCoordinates,
      previewTransform
    );

    const previewChecksum = `CS_PREV_${deterministicHash(
      JSON.stringify([previewId, previewTransform.transformChecksum])
    )}`;

    return Object.freeze({
      previewId,
      targetObjectId: target.visualObjectId,
      initialTransform: target.workspaceTransform,
      previewTransform,
      previewVisualPosition,
      isActive: true,
      previewChecksum,
    });
  }

  public static createRotatePreview(
    sessionId: string,
    target: InteractionTarget,
    delta: readonly [number, number, number],
    seq = 0
  ): TransformPreview {
    const previewId = generateDeterministicPreviewId(sessionId, target.visualObjectId, seq);
    const previewTransform = R8TransformEngine.rotate(target.workspaceTransform, delta);
    const previewVisualPosition = R8TransformEngine.computeVisualPosition(
      target.realityCoordinates,
      previewTransform
    );

    const previewChecksum = `CS_PREV_${deterministicHash(
      JSON.stringify([previewId, previewTransform.transformChecksum])
    )}`;

    return Object.freeze({
      previewId,
      targetObjectId: target.visualObjectId,
      initialTransform: target.workspaceTransform,
      previewTransform,
      previewVisualPosition,
      isActive: true,
      previewChecksum,
    });
  }

  public static createScalePreview(
    sessionId: string,
    target: InteractionTarget,
    factor: readonly [number, number, number],
    seq = 0
  ): TransformPreview {
    const previewId = generateDeterministicPreviewId(sessionId, target.visualObjectId, seq);
    const previewTransform = R8TransformEngine.scale(target.workspaceTransform, factor);
    const previewVisualPosition = R8TransformEngine.computeVisualPosition(
      target.realityCoordinates,
      previewTransform
    );

    const previewChecksum = `CS_PREV_${deterministicHash(
      JSON.stringify([previewId, previewTransform.transformChecksum])
    )}`;

    return Object.freeze({
      previewId,
      targetObjectId: target.visualObjectId,
      initialTransform: target.workspaceTransform,
      previewTransform,
      previewVisualPosition,
      isActive: true,
      previewChecksum,
    });
  }

  public static cancelPreview(preview: TransformPreview): {
    restoredTransform: WorkspaceTransform;
    cancelledPreviewId: string;
  } {
    return {
      restoredTransform: preview.initialTransform,
      cancelledPreviewId: preview.previewId,
    };
  }
}
