/**
 * 3D Memory Studio — Funnel 85
 * Projection: Projection Space → Screen Space (P → S)
 */

export function transformProjectionToScreen(
  projectedPos: readonly [number, number, number],
  apparentScale = 1.0,
  width = 800,
  height = 500,
  scaleFactor = 12
): {
  screenPos: [number, number];
  screenRadius: number;
  inFrustum: boolean;
} {
  const centerX = width / 2;
  const centerY = height / 2;

  const [px, py, pz] = projectedPos;

  const sx = centerX + px * scaleFactor;
  const sy = centerY - py * scaleFactor;

  const inFrustum = sx >= 20 && sx <= width - 20 && sy >= 20 && sy <= height - 20;
  const screenRadius = Math.max(4, Math.min(24, 8 * apparentScale));

  return {
    screenPos: [Number(sx.toFixed(2)), Number(sy.toFixed(2))],
    screenRadius: Number(screenRadius.toFixed(2)),
    inFrustum,
  };
}
