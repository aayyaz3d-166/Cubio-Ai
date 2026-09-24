/**
 * CubiO — Universal Spatial Operating Environment
 * Step 68: Hardware Fallback Cascade
 *
 * Implements smooth hardware backend tiering and graceful fallback:
 * WEBGPU -> WASM_SIMD -> NATIVE_CPU -> EDGE_REDUCED
 *
 * Classification: SOFTWARE_VALIDATED
 */

import { InferenceBackendType } from '../types';

export class HardwareFallbackCascade {
  /**
   * Resolves the best available hardware backend given system capabilities.
   */
  public static resolveOptimalBackend(
    hasWebGPU = false,
    hasWasmSIMD = true,
    hasNativeCPU = true
  ): { activeBackend: InferenceBackendType; fallbackHistory: InferenceBackendType[] } {
    const history: InferenceBackendType[] = [];

    if (hasWebGPU) {
      return { activeBackend: 'WEBGPU', fallbackHistory: [] };
    }
    history.push('WEBGPU');

    if (hasWasmSIMD) {
      return { activeBackend: 'WASM_SIMD', fallbackHistory: history };
    }
    history.push('WASM_SIMD');

    if (hasNativeCPU) {
      return { activeBackend: 'NATIVE_CPU', fallbackHistory: history };
    }
    history.push('NATIVE_CPU');

    return { activeBackend: 'EDGE_REDUCED', fallbackHistory: history };
  }
}
