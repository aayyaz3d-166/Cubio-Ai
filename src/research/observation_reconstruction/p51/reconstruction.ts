/**
 * 3D Memory Studio — Phase 5: Observation & Reconstruction
 * P5.1: Structural Reconstruction
 *
 * Given an observable frame F, attempts to reconstruct the underlying
 * structural representation using only the information available in
 * the observation (object IDs, projected coordinates, observer parameters).
 *
 * This is NOT semantic decoding. It operates on geometry only.
 * If exact reconstruction is impossible, it reports the information loss.
 */

import {
  P51ObservableFrame,
  P51ObserverFrame,
  P51UnderlyingState,
  P51ReconstructionReport,
  P51ReconstructedObject,
  P51ReconstructionCertainty,
} from './types';

/**
 * Attempt inverse projection from screen coordinates back to world coordinates
 * using the observer parameters.
 *
 * For perspective 3D: the depth is known from the projected coordinate,
 * so we can reconstruct fully.
 *
 * For Z2: z is lost → CONSTRAINED
 * For Z1: y and z are lost → AMBIGUOUS
 */
function inverseProject(
  screenCoord: readonly [number, number],
  projectedCoord: readonly [number, number, number | null],
  observer: P51ObserverFrame
): { position: [number | null, number | null, number | null]; certainty: P51ReconstructionCertainty } {
  if (observer.dimension === 3 && projectedCoord[2] !== null) {
    // Full 3D view-space coordinates available → reconstruct world position
    const viewX = projectedCoord[0] as number;
    const viewY = projectedCoord[1] as number;
    const viewZ = projectedCoord[2] as number;

    // Inverse view transform: world = eye + right*vx + up*vy + forward*vz
    const eye = observer.position;
    const target = observer.target;
    const up = observer.up;

    let fx = target[0] - eye[0];
    let fy = target[1] - eye[1];
    let fz = target[2] - eye[2];
    const fLen = Math.sqrt(fx * fx + fy * fy + fz * fz) || 1;
    fx /= fLen; fy /= fLen; fz /= fLen;

    let rx = fy * up[2] - fz * up[1];
    let ry = fz * up[0] - fx * up[2];
    let rz = fx * up[1] - fy * up[0];
    const rLen = Math.sqrt(rx * rx + ry * ry + rz * rz) || 1;
    rx /= rLen; ry /= rLen; rz /= rLen;

    const ux = ry * fz - rz * fy;
    const uy = rz * fx - rx * fz;
    const uz = rx * fy - ry * fx;

    const wx = eye[0] + rx * viewX + ux * viewY + fx * viewZ;
    const wy = eye[1] + ry * viewX + uy * viewY + fy * viewZ;
    const wz = eye[2] + rz * viewX + uz * viewY + fz * viewZ;

    return {
      position: [Number(wx.toFixed(4)), Number(wy.toFixed(4)), Number(wz.toFixed(4))],
      certainty: 'EXACT',
    };
  }

  if (observer.dimension === 2) {
    // Z2: x and y known, z lost
    return {
      position: [projectedCoord[0], projectedCoord[1], null],
      certainty: 'CONSTRAINED',
    };
  }

  // Z1: only x known
  return {
    position: [projectedCoord[0], null, null],
    certainty: 'AMBIGUOUS',
  };
}

function computePositionError(
  reconstructed: readonly [number | null, number | null, number | null],
  truth: readonly [number, number, number]
): number | null {
  let sumSq = 0;
  let components = 0;

  for (let i = 0; i < 3; i++) {
    const r = reconstructed[i];
    const t = truth[i];
    if (r !== null) {
      sumSq += (r - t) * (r - t);
      components++;
    }
  }

  if (components === 0) return null;
  return Number(Math.sqrt(sumSq).toFixed(6));
}

export function reconstructFromFrame(
  frame: P51ObservableFrame,
  observer: P51ObserverFrame,
  truthState: P51UnderlyingState
): P51ReconstructionReport {
  const reconstructedObjects: P51ReconstructedObject[] = [];

  for (const projected of frame.objects) {
    const { position, certainty } = inverseProject(
      projected.screenCoordinate,
      projected.projectedCoordinate,
      observer
    );

    const truth = truthState.records.find((r) => r.id === projected.sourceStateId);
    const truePos: [number, number, number] = truth
      ? [truth.canonicalPosition[0], truth.canonicalPosition[1], truth.canonicalPosition[2]]
      : [0, 0, 0];

    const error = computePositionError(position, truePos);
    const isExact = error !== null && error < 0.01;

    reconstructedObjects.push({
      id: projected.sourceStateId,
      reconstructedPosition: position,
      trueWorldPosition: truePos,
      certainty,
      positionError: error,
      isExactMatch: isExact,
      sourceObservers: [observer.observerId],
    });
  }

  const exactCount = reconstructedObjects.filter((o) => o.isExactMatch).length;
  const total = reconstructedObjects.length;
  const truthCount = truthState.records.length;
  const missing = truthCount - total;

  const accuracyScore = total > 0 ? Number((exactCount / total).toFixed(4)) : 0;
  const infoLoss = total > 0 ? Number((1 - exactCount / total).toFixed(4)) : 1;

  return Object.freeze({
    sourceFrameId: frame.frameId,
    observerId: observer.observerId,
    totalObserved: total,
    reconstructedObjects: Object.freeze(reconstructedObjects),
    exactMatchCount: exactCount,
    missingObjectCount: missing,
    accuracyScore,
    informationLossScore: infoLoss,
    isExactReconstruction: exactCount === total && missing === 0,
  });
}
