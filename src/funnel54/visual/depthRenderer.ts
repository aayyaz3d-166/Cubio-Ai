/**
 * 3D Memory Studio — Funnel 54
 * Depth Rendering & Atmospheric Falloff Utilities
 */

/**
 * Computes depth-based opacity attenuation given zDepth
 * Closer objects (zDepth < 0) are more opaque (up to 1.0),
 * Farther objects (zDepth > 0) have atmospheric falloff (down to 0.45).
 */
export function calculateDepthOpacity(zDepth: number, minOpacity = 0.45, maxOpacity = 1.0): number {
  const normalized = (zDepth + 400) / 1200;
  const clamped = Math.max(0, Math.min(1, normalized));
  return maxOpacity - clamped * (maxOpacity - minOpacity);
}

/**
 * Computes depth-based scale factor
 */
export function calculateDepthScale(zDepth: number, baseScale: number): number {
  const depthFactor = 800 / (800 + Math.max(-600, zDepth));
  return baseScale * Math.max(0.2, Math.min(2.5, depthFactor));
}
