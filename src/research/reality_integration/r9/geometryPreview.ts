/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R9: Geometry Preview Engine
 *
 * Implements non-destructive, temporary, reversible preview states for geometry operations.
 * Invariant: Preview states are strictly downstream and temporary. ΔReality = 0.
 */

import {
  WorkspaceGeometry,
  GeometryPreview,
  GeometryOperationType,
  GeometryMesh,
} from './types';
import {
  generateDeterministicPreviewId,
  computeGeometryChecksum,
  deterministicHash,
} from './determinism';

export class R9GeometryPreviewEngine {
  /**
   * Starts a preview session for a target geometry and preview mesh.
   */
  public static createPreview(
    sessionId: string,
    targetGeometry: WorkspaceGeometry,
    operationType: GeometryOperationType,
    previewMesh: GeometryMesh,
    seq: number = 0
  ): GeometryPreview {
    const previewId = generateDeterministicPreviewId(sessionId, targetGeometry.geometryId, seq);
    const previewChecksum = `PREV_CS_${deterministicHash(`${previewId}_${targetGeometry.geometryChecksum}_${previewMesh.meshChecksum}`)}`;

    return Object.freeze({
      previewId,
      targetGeometryId: targetGeometry.geometryId,
      operationType,
      originalMesh: targetGeometry.mesh,
      previewMesh,
      isActive: true,
      previewChecksum,
    });
  }

  /**
   * Cancels the active preview, restoring the original mesh.
   */
  public static cancelPreview(
    preview: GeometryPreview,
    targetGeometry: WorkspaceGeometry
  ): WorkspaceGeometry {
    return Object.freeze({
      ...targetGeometry,
      mesh: preview.originalMesh,
    });
  }

  /**
   * Commits preview mesh into workspace geometry state.
   */
  public static commitPreview(
    preview: GeometryPreview,
    targetGeometry: WorkspaceGeometry
  ): WorkspaceGeometry {
    const geometryChecksum = computeGeometryChecksum(
      targetGeometry.geometryId,
      preview.previewMesh.meshChecksum,
      targetGeometry.transform.transformChecksum
    );

    return Object.freeze({
      ...targetGeometry,
      mesh: preview.previewMesh,
      lineage: Object.freeze({
        ...targetGeometry.lineage,
        version: targetGeometry.lineage.version + 1,
      }),
      geometryChecksum,
    });
  }
}
