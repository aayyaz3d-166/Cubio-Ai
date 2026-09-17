/**
 * 3D Memory Studio — Funnel 84
 * Projection: Display Projection Engine (F + P → D)
 */

import { ObservationFrame, ProjectionState, DisplayState, DisplayObject } from '../types';
import { projectDimensionalPoint } from './dimensionalProjection';
import { computeFNVHash } from '../core/observationState';

export function computeDisplayChecksum(display: DisplayState): string {
  const payload = display.displayObjects
    .map(
      (o) =>
        `${o.id}:${o.screenCoordinates[0].toFixed(2)},${o.screenCoordinates[1].toFixed(2)}:${o.screenRadius.toFixed(2)}:${o.visible ? 1 : 0}`
    )
    .sort()
    .join('|');
  return computeFNVHash(`${display.displayId}:${display.frameId}:${display.projectionId}:${payload}`);
}

export function projectFrameToDisplay(
  frame: ObservationFrame,
  projection: ProjectionState,
  width = 800,
  height = 600
): DisplayState {
  const centerX = width / 2;
  const centerY = height / 2;
  const scaleFactor = 15; // pixels per world unit

  const displayObjects: DisplayObject[] = frame.relativeObjects.map((obj) => {
    const dimPoint = projectDimensionalPoint(obj, projection);
    const coords = dimPoint.projectedCoordinates;

    let sx = centerX;
    let sy = centerY;
    let sz = 0;

    if (projection.projectionType === 'PERSPECTIVE_3D') {
      const [px = 0, py = 0, pz = 0] = coords;
      const depth = Math.max(10, 200 + pz);
      const factor = (projection.focalLength || 300) / depth;
      sx = centerX + px * factor;
      sy = centerY - py * factor;
      sz = pz;
    } else if (projection.projectionType === 'ISOMETRIC_3D') {
      const [px = 0, py = 0, pz = 0] = coords;
      // Standard isometric projection: x' = (x - z) * cos(30), y' = y + (x + z) * sin(30)
      const cos30 = 0.866;
      const sin30 = 0.5;
      sx = centerX + (px - pz) * cos30 * (scaleFactor * 0.8);
      sy = centerY - (py + (px + pz) * sin30) * (scaleFactor * 0.8);
      sz = (px + py + pz) / 3;
    } else if (projection.projectionType === 'DIMENSIONAL_PROJECT_Z2_Z1') {
      const [px = 0] = coords;
      sx = centerX + px * scaleFactor;
      sy = centerY;
      sz = 0;
    } else {
      // Orthographic 3D, Planar Z2, Dimensional Slices
      const [px = 0, py = 0, pz = 0] = coords;
      sx = centerX + px * scaleFactor;
      sy = centerY - py * scaleFactor;
      sz = pz;
    }

    const radius = Math.max(4, Math.min(24, 8 * (dimPoint.apparentScale || 1.0)));
    const color = (obj.properties.color as string) || '#06b6d4';
    const label = (obj.properties.label as string) || obj.id.replace('OBS_', '');

    return {
      id: `DISP_${obj.id}`,
      sourceObjectId: obj.sourceObjectId,
      screenCoordinates: [Number(sx.toFixed(2)), Number(sy.toFixed(2))],
      screenZ: Number(sz.toFixed(2)),
      screenRadius: Number(radius.toFixed(2)),
      screenColor: color,
      screenLabel: label,
      visible: dimPoint.visible,
      opacity: dimPoint.opacity,
    };
  });

  const displayId = `DISP_${frame.frameId}_${projection.projectionId}`;

  const partialDisplay: DisplayState = {
    displayId,
    frameId: frame.frameId,
    projectionId: projection.projectionId,
    displayObjects: Object.freeze(displayObjects),
    width,
    height,
    displayChecksum: '',
  };

  const displayChecksum = computeDisplayChecksum(partialDisplay);

  return Object.freeze({
    ...partialDisplay,
    displayChecksum,
  });
}
