/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel F10: Spatial Relations Engine
 *
 * Deterministically computes relative 3D placement vectors based on spatial relations:
 * ABOVE, BELOW, LEFT_OF, RIGHT_OF, IN_FRONT_OF, BEHIND, BESIDE, NEAR, INSIDE, CENTERED_ON.
 */

import { WorkspaceGeometry } from '../r9/types';
import { SpatialRelationType } from './types';

export class F10SpatialRelationsEngine {
  public static computeRelativePosition(
    relation: SpatialRelationType,
    referenceGeo: WorkspaceGeometry,
    targetDimensions?: { width?: number; height?: number; depth?: number },
    margin = 0.5
  ): readonly [number, number, number] {
    const refPos = referenceGeo.transform.translation;
    const refDims = referenceGeo.dimensions;
    const targetW = targetDimensions?.width ?? 2;
    const targetH = targetDimensions?.height ?? 2;
    const targetD = targetDimensions?.depth ?? 2;

    const refW = refDims.width ?? 2;
    const refH = refDims.height ?? 2;
    const refD = refDims.depth ?? 2;

    let posX = refPos[0];
    let posY = refPos[1];
    let posZ = refPos[2];

    switch (relation) {
      case 'ABOVE':
        posY = refPos[1] + refH / 2 + targetH / 2 + margin;
        break;
      case 'BELOW':
        posY = refPos[1] - refH / 2 - targetH / 2 - margin;
        break;
      case 'LEFT_OF':
        posX = refPos[0] - refW / 2 - targetW / 2 - margin;
        break;
      case 'RIGHT_OF':
      case 'BESIDE':
        posX = refPos[0] + refW / 2 + targetW / 2 + margin;
        break;
      case 'IN_FRONT_OF':
        posZ = refPos[2] + refD / 2 + targetD / 2 + margin;
        break;
      case 'BEHIND':
        posZ = refPos[2] - refD / 2 - targetD / 2 - margin;
        break;
      case 'NEAR':
        posX = refPos[0] + refW / 2 + targetW / 2 + margin;
        posZ = refPos[2] + margin;
        break;
      case 'INSIDE':
      case 'CENTERED_ON':
      case 'ALIGNED_WITH':
      default:
        posX = refPos[0];
        posY = refPos[1];
        posZ = refPos[2];
        break;
    }

    return Object.freeze([
      Number(posX.toFixed(4)),
      Number(posY.toFixed(4)),
      Number(posZ.toFixed(4)),
    ]);
  }
}
