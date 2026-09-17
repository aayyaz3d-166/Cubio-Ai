/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.7: 2D Sketch Builder
 *
 * Constructs deterministic 2D sketches with explicit geometric constraints.
 */

import { Sketch2D, SketchEntity2D, SketchConstraint } from './types';
import { ParametricConstraintsEngine } from './parametricConstraints';
import { deterministicHash } from './determinism';

export class SketchBuilder {
  public static createRectangleSketch(
    width: number,
    height: number,
    plane: 'XY' | 'XZ' | 'YZ' = 'XY',
    origin: readonly [number, number, number] = [0, 0, 0],
    id = 'SKETCH_RECT'
  ): Sketch2D {
    if (width <= 0 || height <= 0 || !isFinite(width) || !isFinite(height)) {
      throw new Error('Rectangle sketch requires positive finite width and height.');
    }

    const w2 = width / 2;
    const h2 = height / 2;

    const entities: SketchEntity2D[] = [
      { id: 'E1', type: 'LINE', points: [[-w2, -h2], [w2, -h2]] },
      { id: 'E2', type: 'LINE', points: [[w2, -h2], [w2, h2]] },
      { id: 'E3', type: 'LINE', points: [[w2, h2], [-w2, h2]] },
      { id: 'E4', type: 'LINE', points: [[-w2, h2], [-w2, -h2]] },
    ];

    const constraints: SketchConstraint[] = [
      { id: 'C1', type: 'HORIZONTAL', targetEntityIds: ['E1'] },
      { id: 'C2', type: 'VERTICAL', targetEntityIds: ['E2'] },
      { id: 'C3', type: 'HORIZONTAL', targetEntityIds: ['E3'] },
      { id: 'C4', type: 'VERTICAL', targetEntityIds: ['E4'] },
      { id: 'C5', type: 'DISTANCE', targetEntityIds: ['E1'], value: width },
      { id: 'C6', type: 'DISTANCE', targetEntityIds: ['E2'], value: height },
    ];

    const status = ParametricConstraintsEngine.evaluateConstraintStatus(entities, constraints);
    const checksum = deterministicHash(JSON.stringify(['SKETCH_RECT', width, height, plane, origin]));

    return Object.freeze({
      id,
      plane,
      origin: Object.freeze([...origin] as [number, number, number]),
      entities: Object.freeze(entities),
      constraints: Object.freeze(constraints),
      isClosedProfile: true,
      status,
      checksum,
    });
  }

  public static createCircleSketch(
    radius: number,
    plane: 'XY' | 'XZ' | 'YZ' = 'XY',
    origin: readonly [number, number, number] = [0, 0, 0],
    id = 'SKETCH_CIRCLE'
  ): Sketch2D {
    if (radius <= 0 || !isFinite(radius)) {
      throw new Error('Circle sketch requires positive finite radius.');
    }

    const entities: SketchEntity2D[] = [
      { id: 'E1', type: 'CIRCLE', points: [[0, 0]], radius },
    ];

    const constraints: SketchConstraint[] = [
      { id: 'C1', type: 'RADIUS', targetEntityIds: ['E1'], value: radius },
      { id: 'C2', type: 'FIXED', targetEntityIds: ['E1'] },
    ];

    const status = ParametricConstraintsEngine.evaluateConstraintStatus(entities, constraints);
    const checksum = deterministicHash(JSON.stringify(['SKETCH_CIRCLE', radius, plane, origin]));

    return Object.freeze({
      id,
      plane,
      origin: Object.freeze([...origin] as [number, number, number]),
      entities: Object.freeze(entities),
      constraints: Object.freeze(constraints),
      isClosedProfile: true,
      status,
      checksum,
    });
  }
}
