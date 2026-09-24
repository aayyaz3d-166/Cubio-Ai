/**
 * CUBiO AI — Phase 6: Task 87
 * Native Language + Spatial Intelligence Layer
 * src/cubio/language/native/spatial/spatialReasoningEngine.ts
 *
 * Deterministic spatial reasoning engine using src/core/address369.ts
 * as the sole spatial authority. Evaluates relative positions, metrics,
 * multi-hop navigation traces, and transitive spatial relationships.
 */

import { Coordinate3D } from '../../../../types/memory';
import {
  coordinateToCellId,
  cellIdToCoordinate,
  cellIdToAddress369,
  address369ToCellId,
  validateCoordinate,
  validateCellId,
  validateAddress,
  TOTAL_SPATIAL_CELLS,
  DIMENSION,
} from '../../../../core/address369';
import {
  SpatialDirection,
  SpatialRelationType,
  SpatialEpistemicStatus,
  SpatialReasoningStep,
  SpatialReasoningTrace,
  DIRECTION_OFFSETS,
  OutOfBoundsSpatialError,
} from './spatialLanguageTypes';
import crypto from 'crypto';

export interface DistanceMetrics {
  readonly manhattan: number;
  readonly euclidean: number;
  readonly chebyshev: number;
  readonly deltaX: number;
  readonly deltaY: number;
  readonly deltaZ: number;
}

export interface MultiStepNavigationInstruction {
  readonly direction: SpatialDirection;
  readonly distance: number;
  readonly description?: string;
}

export class SpatialReasoningEngine {
  /**
   * Computes exact distance metrics between two 3D coordinates.
   */
  public computeDistanceMetrics(c1: Coordinate3D, c2: Coordinate3D): DistanceMetrics {
    validateCoordinate(c1.x, c1.y, c1.z);
    validateCoordinate(c2.x, c2.y, c2.z);

    const dx = Math.abs(c1.x - c2.x);
    const dy = Math.abs(c1.y - c2.y);
    const dz = Math.abs(c1.z - c2.z);

    return Object.freeze({
      manhattan: dx + dy + dz,
      euclidean: Math.round(Math.sqrt(dx * dx + dy * dy + dz * dz) * 1000) / 1000,
      chebyshev: Math.max(dx, dy, dz),
      deltaX: c1.x - c2.x,
      deltaY: c1.y - c2.y,
      deltaZ: c1.z - c2.z,
    });
  }

  /**
   * Evaluates if two coordinates satisfy a given spatial relationship.
   */
  public evaluateRelation(
    c1: Coordinate3D,
    c2: Coordinate3D,
    relation: SpatialRelationType,
    distanceThreshold = 1
  ): boolean {
    validateCoordinate(c1.x, c1.y, c1.z);
    validateCoordinate(c2.x, c2.y, c2.z);

    switch (relation) {
      case 'SAME_CELL':
        return c1.x === c2.x && c1.y === c2.y && c1.z === c2.z;
      case 'ADJACENT': {
        const m = Math.abs(c1.x - c2.x) + Math.abs(c1.y - c2.y) + Math.abs(c1.z - c2.z);
        return m === 1;
      }
      case 'EAST_OF':
        return c1.x > c2.x;
      case 'WEST_OF':
        return c1.x < c2.x;
      case 'NORTH_OF':
        return c1.y > c2.y;
      case 'SOUTH_OF':
        return c1.y < c2.y;
      case 'ABOVE':
        return c1.z > c2.z;
      case 'BELOW':
        return c1.z < c2.z;
      case 'COLLINEAR_X':
        return c1.y === c2.y && c1.z === c2.z;
      case 'COLLINEAR_Y':
        return c1.x === c2.x && c1.z === c2.z;
      case 'COLLINEAR_Z':
        return c1.x === c2.x && c1.y === c2.y;
      case 'DISTANCE_WITHIN': {
        const m = Math.abs(c1.x - c2.x) + Math.abs(c1.y - c2.y) + Math.abs(c1.z - c2.z);
        return m <= distanceThreshold;
      }
      default:
        return false;
    }
  }

  /**
   * Applies a directional step from an origin coordinate.
   * Throws OutOfBoundsSpatialError if next position exceeds [0..6].
   */
  public stepFrom(
    origin: Coordinate3D,
    direction: SpatialDirection,
    distance = 1
  ): {
    nextCoordinate: Coordinate3D;
    nextCellId: number;
    nextAddress369: number;
  } {
    validateCoordinate(origin.x, origin.y, origin.z);

    const offset = DIRECTION_OFFSETS[direction];
    const nx = origin.x + offset.dx * distance;
    const ny = origin.y + offset.dy * distance;
    const nz = origin.z + offset.dz * distance;

    try {
      validateCoordinate(nx, ny, nz);
    } catch (err: any) {
      throw new OutOfBoundsSpatialError(
        `Step of ${distance} in direction ${direction} from (${origin.x}, ${origin.y}, ${origin.z}) reaches out-of-bounds coordinate (${nx}, ${ny}, ${nz}). Dimension bounds: [0..${DIMENSION - 1}].`
      );
    }

    const nextCellId = coordinateToCellId(nx, ny, nz);
    const nextAddress369 = cellIdToAddress369(nextCellId);

    return {
      nextCoordinate: Object.freeze({ x: nx, y: ny, z: nz }),
      nextCellId,
      nextAddress369,
    };
  }

  /**
   * Executes deterministic multi-step spatial navigation reasoning,
   * verifying every intermediate point along the path.
   */
  public traceMultiStepReasoning(
    origin: Coordinate3D,
    steps: readonly MultiStepNavigationInstruction[],
    queryDescription = 'Multi-step spatial navigation'
  ): SpatialReasoningTrace {
    validateCoordinate(origin.x, origin.y, origin.z);

    const reasoningSteps: SpatialReasoningStep[] = [];
    let currentCoord = origin;

    for (let i = 0; i < steps.length; i++) {
      const stepInst = steps[i];
      const stepResult = this.stepFrom(currentCoord, stepInst.direction, stepInst.distance);

      const premise = stepInst.description ??
        `Step ${i + 1}: Move ${stepInst.distance} unit(s) ${stepInst.direction} from (${currentCoord.x}, ${currentCoord.y}, ${currentCoord.z})`;

      reasoningSteps.push(
        Object.freeze({
          stepIndex: i + 1,
          premise,
          ruleId: `SPATIAL_VECTOR_TRANSLATION_${stepInst.direction}`,
          intermediateCoordinate: stepResult.nextCoordinate,
          intermediateCellId: stepResult.nextCellId,
          intermediateAddress369: stepResult.nextAddress369,
          confidence: 1.0,
        })
      );

      currentCoord = stepResult.nextCoordinate;
    }

    const finalCellId = coordinateToCellId(currentCoord.x, currentCoord.y, currentCoord.z);
    const finalAddress369 = cellIdToAddress369(finalCellId);

    const finalConclusion =
      `Navigated ${steps.length} step(s) to coordinate (${currentCoord.x}, ${currentCoord.y}, ${currentCoord.z}) ` +
      `[Cell ID: ${finalCellId}, Formula A Address: ${finalAddress369}].`;

    const stepSignatures = reasoningSteps.map(s => `${s.ruleId}:${s.intermediateCellId}`).join(';');
    const traceDigest = crypto
      .createHash('sha256')
      .update(
        `${origin.x},${origin.y},${origin.z}:${finalCellId}:${reasoningSteps.length}:${stepSignatures}`,
        'utf8'
      )
      .digest('hex');
    const traceId = `trace_sp_${traceDigest.slice(0, 12)}`;

    return Object.freeze({
      traceId,
      query: queryDescription,
      steps: Object.freeze(reasoningSteps),
      finalConclusion,
      reasoningDepth: steps.length,
      provenCoordinate: currentCoord,
      provenCellId: finalCellId,
      provenAddress369: finalAddress369,
      epistemicStatus: 'INFERRED_RELATIONSHIP',
      confidence: 1.0,
      isSound: true,
      traceChecksum: traceDigest,
    });
  }

  /**
   * Evaluates formal transitivity between two spatial relations.
   * e.g. A is EAST_OF B, B is EAST_OF C => A is EAST_OF C.
   */
  public deriveTransitiveRelation(
    r1: SpatialRelationType,
    r2: SpatialRelationType
  ): SpatialRelationType | null {
    if (r1 === r2) {
      if (
        r1 === 'EAST_OF' ||
        r1 === 'WEST_OF' ||
        r1 === 'NORTH_OF' ||
        r1 === 'SOUTH_OF' ||
        r1 === 'ABOVE' ||
        r1 === 'BELOW'
      ) {
        return r1;
      }
    }

    // Collinear combinations
    if (r1 === 'SAME_CELL') return r2;
    if (r2 === 'SAME_CELL') return r1;

    return null;
  }
}
