/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel F10: Spatial Command Planner
 *
 * Deterministically generates machine-readable SpatialCommandPlan with ordered steps,
 * parameters, validation state, and explicit realityMutation = false guarantee.
 */

import { WorkspaceGeometry, GeometryPrimitiveType } from '../r9/types';
import {
  SpatialCommandPlan,
  SpatialPlanOperation,
  SpatialPlanParameters,
  ResolvedContextReference,
  AIIntentType,
} from './types';
import { ParsedCommand } from './commandParser';
import { F10SpatialRelationsEngine } from './spatialRelations';
import {
  generateDeterministicPlanId,
  computePlanChecksum,
} from './determinism';

export class F10CommandPlanner {
  public static generatePlan(
    parsed: ParsedCommand,
    commandId: string,
    sessionId: string,
    realityChecksum: string,
    geometries: Readonly<Record<string, WorkspaceGeometry>>
  ): SpatialCommandPlan {
    const { intent, slots, resolvedTarget, referenceTarget, utterance } = parsed;
    const planId = generateDeterministicPlanId(commandId, intent);
    const operations: SpatialPlanOperation[] = [];
    const validationIssues: string[] = [];

    let summary = '';
    const resolvedReferences: ResolvedContextReference[] = [];
    if (resolvedTarget.targetGeometryId) {
      resolvedReferences.push(resolvedTarget);
    }

    switch (intent) {
      case 'CREATE': {
        const primType: GeometryPrimitiveType = slots.primitive || 'BOX';
        const qty = slots.quantity || 1;
        summary = `Create ${qty > 1 ? qty + ' ' : 'a '}${primType.toLowerCase()}`;

        for (let i = 0; i < qty; i++) {
          let targetPos: [number, number, number] = [i * 3.0, 1.0, 0];

          // If spatial relation is specified relative to an existing reference object
          if (slots.spatialRelation && referenceTarget) {
            targetPos = [...F10SpatialRelationsEngine.computeRelativePosition(
              slots.spatialRelation,
              referenceTarget,
              { width: 2, height: 2, depth: 2 },
              0.5
            )] as [number, number, number];
            summary += ` ${slots.spatialRelation.toLowerCase()} ${referenceTarget.identity.name}`;
          }

          operations.push({
            stepIndex: i + 1,
            operationType: 'CREATE_PRIMITIVE',
            targetGeometryId: null,
            targetName: `${primType}_${Date.now()}_${i}`,
            description: `Instantiate primitive ${primType} in workspace (USER_CONSTRUCTED)`,
            parameters: {
              primitiveType: primType,
              dimensions: { width: 2, height: 2, depth: 2, radius: 1 },
              targetPosition: targetPos,
              spatialRelation: slots.spatialRelation,
              referenceTargetId: referenceTarget?.geometryId,
            },
            domain: 'WORKSPACE',
            createsNewGeometry: true,
            resultingOrigin: 'USER_CONSTRUCTED',
          });
        }
        break;
      }

      case 'MOVE': {
        const targetId = resolvedTarget.targetGeometryId;
        const targetGeo = targetId ? geometries[targetId] : null;

        if (!targetId || !targetGeo) {
          validationIssues.push(`Target object could not be resolved for MOVE operation.`);
          summary = `Unable to resolve target to move`;
        } else {
          let deltaT: [number, number, number] = [0, 0, 0];
          const dist = slots.distance || 2.0;

          if (slots.spatialRelation && referenceTarget) {
            const desiredPos = F10SpatialRelationsEngine.computeRelativePosition(
              slots.spatialRelation,
              referenceTarget,
              targetGeo.dimensions,
              0.5
            );
            deltaT = [
              desiredPos[0] - targetGeo.transform.translation[0],
              desiredPos[1] - targetGeo.transform.translation[1],
              desiredPos[2] - targetGeo.transform.translation[2],
            ];
            summary = `Move ${targetGeo.identity.name} ${slots.spatialRelation.toLowerCase()} ${referenceTarget.identity.name}`;
          } else if (slots.direction) {
            switch (slots.direction) {
              case 'LEFT': deltaT = [-dist, 0, 0]; break;
              case 'RIGHT': deltaT = [dist, 0, 0]; break;
              case 'UP': deltaT = [0, dist, 0]; break;
              case 'DOWN': deltaT = [0, -dist, 0]; break;
              case 'FORWARD': deltaT = [0, 0, dist]; break;
              case 'BACKWARD': deltaT = [0, 0, -dist]; break;
            }
            summary = `Move ${targetGeo.identity.name} ${dist}m ${slots.direction.toLowerCase()}`;
          } else if (slots.axis) {
            if (slots.axis === 'X') deltaT = [dist, 0, 0];
            else if (slots.axis === 'Y') deltaT = [0, dist, 0];
            else if (slots.axis === 'Z') deltaT = [0, 0, dist];
            summary = `Translate ${targetGeo.identity.name} ${dist} units along ${slots.axis}`;
          } else {
            deltaT = [dist, 0, 0];
            summary = `Translate ${targetGeo.identity.name} ${dist} units on X`;
          }

          operations.push({
            stepIndex: 1,
            operationType: 'TRANSLATE_GEOMETRY',
            targetGeometryId: targetGeo.geometryId,
            targetName: targetGeo.identity.name,
            description: `Translate workspace geometry by [${deltaT.join(', ')}]`,
            parameters: {
              deltaTranslation: deltaT,
              distance: dist,
              axis: slots.axis,
            },
            domain: 'WORKSPACE',
            createsNewGeometry: false,
            resultingOrigin: targetGeo.identity.origin,
          });
        }
        break;
      }

      case 'SCALE': {
        const targetId = resolvedTarget.targetGeometryId;
        const targetGeo = targetId ? geometries[targetId] : null;

        if (!targetId || !targetGeo) {
          validationIssues.push(`Target object could not be resolved for SCALE operation.`);
          summary = `Unable to resolve target to scale`;
        } else {
          const factor = slots.scaleFactor || 1.5;
          const factorScale: [number, number, number] = [factor, factor, factor];
          summary = `Scale ${targetGeo.identity.name} by factor ${factor}x`;

          operations.push({
            stepIndex: 1,
            operationType: 'SCALE_GEOMETRY',
            targetGeometryId: targetGeo.geometryId,
            targetName: targetGeo.identity.name,
            description: `Scale workspace geometry dimensions by factor ${factor}`,
            parameters: {
              factorScale,
            },
            domain: 'WORKSPACE',
            createsNewGeometry: false,
            resultingOrigin: targetGeo.identity.origin,
          });
        }
        break;
      }

      case 'ROTATE': {
        const targetId = resolvedTarget.targetGeometryId;
        const targetGeo = targetId ? geometries[targetId] : null;

        if (!targetId || !targetGeo) {
          validationIssues.push(`Target object could not be resolved for ROTATE operation.`);
          summary = `Unable to resolve target to rotate`;
        } else {
          const deg = slots.degrees || 45;
          const axis = slots.axis || 'Y';
          const deltaRot: [number, number, number] = [
            axis === 'X' ? deg : 0,
            axis === 'Y' ? deg : 0,
            axis === 'Z' ? deg : 0,
          ];
          summary = `Rotate ${targetGeo.identity.name} ${deg}° around ${axis}`;

          operations.push({
            stepIndex: 1,
            operationType: 'ROTATE_GEOMETRY',
            targetGeometryId: targetGeo.geometryId,
            targetName: targetGeo.identity.name,
            description: `Rotate workspace geometry by ${deg}° on ${axis} axis`,
            parameters: {
              deltaRotation: deltaRot,
              axis,
            },
            domain: 'WORKSPACE',
            createsNewGeometry: false,
            resultingOrigin: targetGeo.identity.origin,
          });
        }
        break;
      }

      case 'SELECT': {
        const targetId = resolvedTarget.targetGeometryId;
        const targetGeo = targetId ? geometries[targetId] : null;
        if (targetGeo) {
          summary = `Select ${targetGeo.identity.name}`;
          operations.push({
            stepIndex: 1,
            operationType: 'SELECT_GEOMETRY',
            targetGeometryId: targetGeo.geometryId,
            targetName: targetGeo.identity.name,
            description: `Set active selection to ${targetGeo.identity.name}`,
            parameters: {},
            domain: 'WORKSPACE',
            createsNewGeometry: false,
            resultingOrigin: targetGeo.identity.origin,
          });
        } else {
          validationIssues.push(`Target object could not be resolved for selection.`);
        }
        break;
      }

      case 'DESELECT': {
        summary = `Clear active selection`;
        operations.push({
          stepIndex: 1,
          operationType: 'DESELECT_ALL',
          targetGeometryId: null,
          targetName: 'WORKSPACE',
          description: `Clear all active workspace selection`,
          parameters: {},
          domain: 'WORKSPACE',
          createsNewGeometry: false,
          resultingOrigin: 'USER_CONSTRUCTED',
        });
        break;
      }

      case 'UNDO': {
        summary = `Undo last workspace operation`;
        operations.push({
          stepIndex: 1,
          operationType: 'UNDO_OPERATION',
          targetGeometryId: null,
          targetName: 'WORKSPACE',
          description: `Revert last committed workspace step (R9 Undo)`,
          parameters: {},
          domain: 'WORKSPACE',
          createsNewGeometry: false,
          resultingOrigin: 'USER_CONSTRUCTED',
        });
        break;
      }

      case 'REDO': {
        summary = `Redo previously undone workspace operation`;
        operations.push({
          stepIndex: 1,
          operationType: 'REDO_OPERATION',
          targetGeometryId: null,
          targetName: 'WORKSPACE',
          description: `Replay undone workspace step (R9 Redo)`,
          parameters: {},
          domain: 'WORKSPACE',
          createsNewGeometry: false,
          resultingOrigin: 'USER_CONSTRUCTED',
        });
        break;
      }

      case 'BOOLEAN': {
        const targetIdA = resolvedTarget.targetGeometryId;
        const targetIdB = referenceTarget?.geometryId || Object.keys(geometries).find((id) => id !== targetIdA) || null;
        const boolOp = slots.booleanOp || 'UNION';

        if (!targetIdA || !targetIdB) {
          validationIssues.push(`Boolean operation requires two valid geometry targets.`);
          summary = `Unable to resolve two objects for boolean ${boolOp}`;
        } else {
          const geoA = geometries[targetIdA];
          const geoB = geometries[targetIdB];
          summary = `Boolean ${boolOp}: ${geoA.identity.name} and ${geoB.identity.name}`;

          operations.push({
            stepIndex: 1,
            operationType: `BOOLEAN_${boolOp}`,
            targetGeometryId: targetIdA,
            targetName: `${geoA.identity.name}_${boolOp}_${geoB.identity.name}`,
            description: `Execute boolean ${boolOp} creating DERIVED geometry`,
            parameters: {
              booleanOp: boolOp,
              secondaryTargetId: targetIdB,
            },
            domain: 'DERIVED_GEOMETRY',
            createsNewGeometry: true,
            resultingOrigin: 'DERIVED',
          });
        }
        break;
      }

      case 'EXTRUDE': {
        const targetId = resolvedTarget.targetGeometryId;
        const targetGeo = targetId ? geometries[targetId] : null;
        if (!targetGeo) {
          validationIssues.push(`Target object could not be resolved for EXTRUDE.`);
        } else {
          summary = `Extrude face on ${targetGeo.identity.name}`;
          operations.push({
            stepIndex: 1,
            operationType: 'EXTRUDE_FACE',
            targetGeometryId: targetGeo.geometryId,
            targetName: targetGeo.identity.name,
            description: `Extrude face 1.5 units along normal`,
            parameters: { editAmount: 1.5 },
            domain: 'WORKSPACE',
            createsNewGeometry: false,
            resultingOrigin: targetGeo.identity.origin,
          });
        }
        break;
      }

      case 'SUBDIVIDE': {
        const targetId = resolvedTarget.targetGeometryId;
        const targetGeo = targetId ? geometries[targetId] : null;
        if (!targetGeo) {
          validationIssues.push(`Target object could not be resolved for SUBDIVIDE.`);
        } else {
          summary = `Subdivide mesh on ${targetGeo.identity.name}`;
          operations.push({
            stepIndex: 1,
            operationType: 'SUBDIVIDE_MESH',
            targetGeometryId: targetGeo.geometryId,
            targetName: targetGeo.identity.name,
            description: `Subdivide and smooth geometry`,
            parameters: {},
            domain: 'WORKSPACE',
            createsNewGeometry: false,
            resultingOrigin: targetGeo.identity.origin,
          });
        }
        break;
      }

      case 'MEASURE': {
        const targetId = resolvedTarget.targetGeometryId;
        const targetGeo = targetId ? geometries[targetId] : null;
        const mType = slots.measurementType || 'DISTANCE';
        summary = `Measure ${mType.toLowerCase()} on ${targetGeo ? targetGeo.identity.name : 'workspace'}`;

        operations.push({
          stepIndex: 1,
          operationType: `MEASURE_${mType}`,
          targetGeometryId: targetId,
          targetName: targetGeo?.identity.name || 'MEASUREMENT',
          description: `Compute ${mType} measurement in workspace`,
          parameters: { measurementType: mType },
          domain: 'WORKSPACE',
          createsNewGeometry: false,
          resultingOrigin: 'USER_CONSTRUCTED',
        });
        break;
      }

      case 'QUERY': {
        summary = `Inspect and explain spatial properties: ${slots.queryType || 'GENERAL'}`;
        operations.push({
          stepIndex: 1,
          operationType: 'QUERY_EXPLANATION',
          targetGeometryId: resolvedTarget.targetGeometryId,
          targetName: resolvedTarget.resolvedName || 'SYSTEM',
          description: `Query spatial telemetry and provenance`,
          parameters: { queryTarget: slots.queryType },
          domain: 'CONVERSATION',
          createsNewGeometry: false,
          resultingOrigin: 'USER_CONSTRUCTED',
        });
        break;
      }

      default: {
        validationIssues.push(`Unknown intent '${intent}' for utterance: "${utterance.rawText}"`);
        summary = `Unknown command intent`;
        break;
      }
    }

    const planChecksum = computePlanChecksum(
      commandId,
      intent,
      resolvedReferences.map((r) => r.targetGeometryId || 'NONE'),
      operations.length
    );

    return {
      planId,
      commandId,
      sessionId,
      intent,
      sourceText: utterance.rawText,
      resolvedReferences,
      operations,
      summary,
      status: validationIssues.length > 0 ? 'REJECTED' : 'PREPARED',
      validationIssues,
      realityMutation: false,
      realityChecksum,
      timestamp: Date.now(),
      planChecksum,
    };
  }
}
