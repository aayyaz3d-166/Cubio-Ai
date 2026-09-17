/**
 * 3D Memory Studio — Funnel 65
 * Viewport Diagnostics & Non-Zero Dimension Validator
 */

export interface ViewportCheckResult {
  valid: boolean;
  width: number;
  height: number;
  dpr: number;
  reason?: string;
}

export function validateViewport(
  width: number,
  height: number,
  dpr = 1.0
): ViewportCheckResult {
  if (width <= 0 || isNaN(width) || !isFinite(width)) {
    return { valid: false, width, height, dpr, reason: 'Invalid or non-positive width' };
  }
  if (height <= 0 || isNaN(height) || !isFinite(height)) {
    return { valid: false, width, height, dpr, reason: 'Invalid or non-positive height' };
  }
  return { valid: true, width, height, dpr };
}
