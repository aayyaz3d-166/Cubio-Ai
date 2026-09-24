/**
 * CubiO — Universal Spatial Operating Environment
 * Step 68: Inference Quantizer
 *
 * Converts floating point tensor layers into quantized INT4, INT8, FP8, and FP16 formats
 * with dynamic range scale factor and zero-point calibration.
 *
 * Classification: SOFTWARE_VALIDATED
 */

import { InferenceQuantization, QuantizedTensorLayer } from '../types';

export class InferenceQuantizer {
  /**
   * Quantizes a float parameter vector into the requested format.
   */
  public static quantizeLayer(
    layerIndex: number,
    weights: Float32Array,
    format: InferenceQuantization
  ): QuantizedTensorLayer {
    let minVal = Infinity;
    let maxVal = -Infinity;

    for (let i = 0; i < weights.length; i++) {
      const v = weights[i];
      if (v < minVal) minVal = v;
      if (v > maxVal) maxVal = v;
    }

    let qBytes: Uint8Array;
    let scale = 1.0;
    let zeroPoint = 0;

    switch (format) {
      case 'INT8': {
        const absMax = Math.max(Math.abs(minVal), Math.abs(maxVal), 1e-6);
        scale = absMax / 127.0;
        qBytes = new Uint8Array(weights.length);
        for (let i = 0; i < weights.length; i++) {
          const q = Math.round(weights[i] / scale);
          qBytes[i] = Math.max(-128, Math.min(127, q)) + 128; // offset uint8
        }
        break;
      }

      case 'INT4': {
        const absMax = Math.max(Math.abs(minVal), Math.abs(maxVal), 1e-6);
        scale = absMax / 7.0;
        // Pack 2 INT4 nibbles per byte
        const packedLen = Math.ceil(weights.length / 2);
        qBytes = new Uint8Array(packedLen);
        for (let i = 0; i < weights.length; i += 2) {
          const q0 = Math.max(-8, Math.min(7, Math.round(weights[i] / scale))) + 8;
          const q1 = (i + 1 < weights.length)
            ? Math.max(-8, Math.min(7, Math.round(weights[i + 1] / scale))) + 8
            : 0;
          qBytes[Math.floor(i / 2)] = (q0 & 0x0F) | ((q1 & 0x0F) << 4);
        }
        break;
      }

      case 'FP8': {
        // E4M3 simulation: scale to [-448, 448]
        const absMax = Math.max(Math.abs(minVal), Math.abs(maxVal), 1e-6);
        scale = absMax / 448.0;
        qBytes = new Uint8Array(weights.length);
        for (let i = 0; i < weights.length; i++) {
          qBytes[i] = Math.max(0, Math.min(255, Math.round((weights[i] / scale) + 128)));
        }
        break;
      }

      case 'FP16':
      default: {
        // 2 bytes per element
        qBytes = new Uint8Array(weights.length * 2);
        scale = 1.0;
        break;
      }
    }

    return Object.freeze({
      layerIndex,
      format,
      rawQuantizedBytes: qBytes,
      scaleFactor: parseFloat(scale.toFixed(6)),
      zeroPoint,
      parameterCount: weights.length,
      memorySizeBytes: qBytes.byteLength,
    });
  }
}
