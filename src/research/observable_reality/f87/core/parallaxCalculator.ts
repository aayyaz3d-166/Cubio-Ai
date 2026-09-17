/**
 * 3D Memory Studio — Funnel 87
 * Core: Parallax Differential Motion Calculator
 */

import { F87ObjectRenderRecord, F87ParallaxMeasurement } from '../types';

export function calculateParallaxMeasurement(
  currentRecords: readonly F87ObjectRenderRecord[],
  baselineRecords?: readonly F87ObjectRenderRecord[] | null
): F87ParallaxMeasurement | null {
  if (currentRecords.length < 2) return null;

  // Identify Near object (lowest depthZ) and Far object (highest depthZ)
  const sorted = [...currentRecords].sort((a, b) => a.depthZ - b.depthZ);
  const nearObj = sorted[0];
  const farObj = sorted[sorted.length - 1];

  let deltaNear: [number, number] = [0, 0];
  let deltaFar: [number, number] = [0, 0];

  if (baselineRecords) {
    const baseNear = baselineRecords.find((r) => r.id === nearObj.id);
    const baseFar = baselineRecords.find((r) => r.id === farObj.id);

    if (baseNear) {
      deltaNear = [
        Number((nearObj.screenPosition[0] - baseNear.screenPosition[0]).toFixed(2)),
        Number((nearObj.screenPosition[1] - baseNear.screenPosition[1]).toFixed(2)),
      ];
    }

    if (baseFar) {
      deltaFar = [
        Number((farObj.screenPosition[0] - baseFar.screenPosition[0]).toFixed(2)),
        Number((farObj.screenPosition[1] - baseFar.screenPosition[1]).toFixed(2)),
      ];
    }
  }

  const diffX = Math.abs(deltaNear[0] - deltaFar[0]);
  const diffY = Math.abs(deltaNear[1] - deltaFar[1]);
  const totalDiff = Math.hypot(diffX, diffY);

  return {
    nearObjectId: nearObj.id,
    farObjectId: farObj.id,
    nearScreenPos: nearObj.screenPosition,
    farScreenPos: farObj.screenPosition,
    deltaScreenNear: deltaNear,
    deltaScreenFar: deltaFar,
    parallaxDifferenceX: Number(diffX.toFixed(2)),
    parallaxDifferenceY: Number(diffY.toFixed(2)),
    totalParallaxDifference: Number(totalDiff.toFixed(2)),
    isParallaxDetected: totalDiff > 0.5,
  };
}
