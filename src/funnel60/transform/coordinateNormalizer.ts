/**
 * 3D Memory Studio — Funnel 60
 * Deterministic Coordinate Normalizer & Bounds Enforcer
 *
 * Prevents NaN, Infinity, and unbounded coordinates from leaking to the GPU.
 */

export const WORLD_MIN = -500;
export const WORLD_MAX = 500;

export function isValidCoordinate(val: unknown): boolean {
  if (typeof val !== 'number') return false;
  if (isNaN(val) || !isFinite(val)) return false;
  return true;
}

export function clampValue(val: number, min = WORLD_MIN, max = WORLD_MAX): number {
  if (!isValidCoordinate(val)) return 0;
  return Math.max(min, Math.min(max, val));
}

export function clamp3DPosition(
  pos: readonly [number, number, number],
  min = WORLD_MIN,
  max = WORLD_MAX
): [number, number, number] {
  return [
    Number(clampValue(pos[0], min, max).toFixed(3)),
    Number(clampValue(pos[1], min, max).toFixed(3)),
    Number(clampValue(pos[2], min, max).toFixed(3)),
  ];
}

export function sanitizeRawCoordinateValues(
  rawValues: readonly number[]
): { sanitized: number[]; isValid: boolean } {
  if (!rawValues || rawValues.length === 0) {
    return { sanitized: [0, 0, 0], isValid: false };
  }

  const sanitized: number[] = [];
  let allValid = true;

  for (const v of rawValues) {
    if (!isValidCoordinate(v)) {
      allValid = false;
      sanitized.push(0);
    } else {
      sanitized.push(clampValue(v));
    }
  }

  return { sanitized, isValid: allValid };
}
