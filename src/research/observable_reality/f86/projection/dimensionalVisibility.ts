/**
 * 3D Memory Studio — Funnel 86
 * Projection: 4D Dimensional Visibility (Z4 → Z3)
 */

export function evaluate4DDimensionalVisibility(
  worldPos4D: readonly number[],
  sliceW = 0,
  sliceThickness = 15
): {
  isWithin4DSlice: boolean;
  opacity4D: number;
} {
  const w = worldPos4D[3] ?? 0;
  const distW = Math.abs(w - sliceW);
  const isWithin = distW <= sliceThickness;
  const opacity = isWithin ? Math.max(0.2, 1 - distW / sliceThickness) : 0;

  return {
    isWithin4DSlice: isWithin,
    opacity4D: Number(opacity.toFixed(4)),
  };
}
