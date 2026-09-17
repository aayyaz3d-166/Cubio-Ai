/**
 * 3D Memory Studio — Funnel 55
 * GPU / WebGL Capability Detector
 *
 * Safe capability detection across Browser, WebGL, Canvas2D, and Node.js headless test environments.
 */

import { RendererCapabilities, RendererBackendType, RendererQuality } from '../types';

export function detectRendererCapabilities(canvasElement?: unknown): RendererCapabilities {
  // 1. Safe detection of Browser Window & Reduced Motion
  const isBrowser = typeof window !== 'undefined';
  const rawDpr = isBrowser && window.devicePixelRatio ? window.devicePixelRatio : 1.0;
  const maxBoundedDpr = Math.min(2.0, Math.max(1.0, rawDpr));

  const prefersReducedMotion =
    isBrowser &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 2. Check WebGL availability
  let webglAvailable = false;
  let webglVersion = 0;
  let maxTextureSize = 2048;
  let rendererType: RendererBackendType = 'HEADLESS_MOCK';

  if (isBrowser) {
    try {
      const testCanvas = (canvasElement as HTMLCanvasElement) || document.createElement('canvas');
      let gl: WebGLRenderingContext | WebGL2RenderingContext | null = null;

      // Try WebGL2 first
      gl = testCanvas.getContext('webgl2') as WebGL2RenderingContext | null;
      if (gl) {
        webglAvailable = true;
        webglVersion = 2;
        rendererType = 'WEBGL';
      } else {
        // Try WebGL1
        gl = (testCanvas.getContext('webgl') ||
          testCanvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
        if (gl) {
          webglAvailable = true;
          webglVersion = 1;
          rendererType = 'WEBGL';
        }
      }

      if (gl) {
        maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) || 2048;
      } else {
        // Fallback to Canvas2D
        const ctx2d = testCanvas.getContext('2d');
        if (ctx2d) {
          rendererType = 'CANVAS2D';
        }
      }
    } catch {
      rendererType = 'CANVAS2D';
    }
  }

  const fallbackRequired = !webglAvailable;

  // 3. Recommended quality level
  let recommendedQuality: RendererQuality = 'MEDIUM';
  if (!webglAvailable || prefersReducedMotion) {
    recommendedQuality = 'LOW';
  } else if (webglVersion === 2 && maxTextureSize >= 4096) {
    recommendedQuality = 'HIGH';
  }

  return Object.freeze({
    webglAvailable,
    webglVersion,
    rendererType,
    maxTextureSize,
    devicePixelRatio: rawDpr,
    maxBoundedDpr,
    recommendedQuality,
    prefersReducedMotion,
    fallbackRequired,
  });
}
