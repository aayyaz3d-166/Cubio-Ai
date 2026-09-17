/**
 * 3D Memory Studio — Funnel 87
 * Projection: 4D Dimensional Parallax (Z4 → Z3)
 */

export function evaluate4DParallaxProjection(
  worldPos4D: readonly number[],
  sliceW = 0,
  sliceThickness = 15
): {
  isWithinSlice: boolean;
  opacity: number;
} {
  const w = worldPos4D[3] ?? 0;
  const distW = Math.abs(w - sliceW);
  const isWithin = distW <= sliceThickness;
  const opacity = isWithin ? Math.max(0.2, 1 - distW / sliceThickness) : 0;

  return {
    isWithinSlice: isWithin,
    opacity: Number(opacity.toFixed(4)),
  };
}
