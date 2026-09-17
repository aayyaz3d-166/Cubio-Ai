/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel F10: Spatial Plan Preview Engine
 *
 * Computes non-destructive visual preview geometries for spatial command plans
 * prior to user approval.
 */

import { WorkspaceGeometry } from '../r9/types';
import { SpatialCommandPlan } from './types';
import { R9GeometryPrimitiveEngine } from '../r9/geometryPrimitiveEngine';
import { R9GeometryEditingEngine } from '../r9/geometryEditing';
import { R9BooleanEngine } from '../r9/booleanEngine';

export class F10PreviewEngine {
  public static generatePreview(
    plan: SpatialCommandPlan,
    geometries: Readonly<Record<string, WorkspaceGeometry>>
  ): WorkspaceGeometry | null {
    if (plan.operations.length === 0) return null;
    const op = plan.operations[0];

    // 1. Primitive Creation Preview
    if (op.operationType === 'CREATE_PRIMITIVE' && op.parameters.primitiveType) {
      const pType = op.parameters.primitiveType;
      const dims = {
        width: op.parameters.dimensions?.width ?? 2,
        height: op.parameters.dimensions?.height ?? 2,
        depth: op.parameters.dimensions?.depth ?? 2,
        radius: op.parameters.dimensions?.radius ?? 1,
      };
      const pos = op.parameters.targetPosition || [0, 1, 0];

      const previewGeo = R9GeometryPrimitiveEngine.createPrimitive(
        plan.sessionId,
        pType,
        dims,
        {
          translation: pos,
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
          transformChecksum: 'CS_PREVIEW_XFORM',
        },
        'WOBJ_PREVIEW',
        null,
        'USER_CONSTRUCTED',
        'ESTIMATED',
        `Preview_${pType}`,
        999
      );
      return previewGeo;
    }

    // 2. Transform Preview (MOVE / ROTATE / SCALE)
    if (op.targetGeometryId && geometries[op.targetGeometryId]) {
      const baseGeo = geometries[op.targetGeometryId];

      if (op.operationType === 'TRANSLATE_GEOMETRY' && op.parameters.deltaTranslation) {
        const delta = op.parameters.deltaTranslation;
        const curT = baseGeo.transform.translation;
        return {
          ...baseGeo,
          geometryId: `PREV_${baseGeo.geometryId}`,
          transform: {
            ...baseGeo.transform,
            translation: [curT[0] + delta[0], curT[1] + delta[1], curT[2] + delta[2]],
          },
        };
      }

      if (op.operationType === 'SCALE_GEOMETRY' && op.parameters.factorScale) {
        const factor = op.parameters.factorScale;
        const curS = baseGeo.transform.scale;
        return {
          ...baseGeo,
          geometryId: `PREV_${baseGeo.geometryId}`,
          transform: {
            ...baseGeo.transform,
            scale: [curS[0] * factor[0], curS[1] * factor[1], curS[2] * factor[2]],
          },
        };
      }

      if (op.operationType === 'ROTATE_GEOMETRY' && op.parameters.deltaRotation) {
        const deltaR = op.parameters.deltaRotation;
        const curR = baseGeo.transform.rotation;
        return {
          ...baseGeo,
          geometryId: `PREV_${baseGeo.geometryId}`,
          transform: {
            ...baseGeo.transform,
            rotation: [curR[0] + deltaR[0], curR[1] + deltaR[1], curR[2] + deltaR[2]],
          },
        };
      }

      if (op.operationType === 'EXTRUDE_FACE' && baseGeo.mesh.faces.length > 0) {
        const extruded = R9GeometryEditingEngine.extrudeFace(
          plan.sessionId,
          baseGeo,
          baseGeo.mesh.faces[0].faceId,
          op.parameters.editAmount || 1.5
        );
        return {
          ...extruded,
          geometryId: `PREV_${baseGeo.geometryId}`,
        };
      }

      if (op.operationType === 'SUBDIVIDE_MESH') {
        const subdiv = R9GeometryEditingEngine.subdivide(plan.sessionId, baseGeo);
        return {
          ...subdiv,
          geometryId: `PREV_${baseGeo.geometryId}`,
        };
      }
    }

    // 3. Boolean Preview
    if (op.operationType.startsWith('BOOLEAN_') && op.targetGeometryId && op.parameters.secondaryTargetId) {
      const geoA = geometries[op.targetGeometryId];
      const geoB = geometries[op.parameters.secondaryTargetId];
      if (geoA && geoB && op.parameters.booleanOp) {
        const boolRes = R9BooleanEngine.executeBoolean(
          plan.sessionId,
          op.parameters.booleanOp,
          geoA,
          geoB,
          Object.keys(geometries).length + 1
        );
        return {
          ...boolRes.resultGeometry,
          geometryId: `PREV_BOOL_${boolRes.resultGeometry.geometryId}`,
        };
      }
    }

    return null;
  }
}
