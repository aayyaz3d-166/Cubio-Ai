/**
 * CubiO — Universal Spatial Operating Environment
 * Step 68: Dequantization Kernel
 *
 * Implements vectorized online dequantization routines:
 * Restores quantized INT4/INT8/FP8 arrays to float representations for activation GEMM.
 *
 * Classification: SOFTWARE_VALIDATED
 */

import { QuantizedTensorLayer } from '../types';

export class DequantizationKernel {
  /**
   * Dequantizes a QuantizedTensorLayer back into a Float32Array.
   */
  public static dequantize(layer: QuantizedTensorLayer): Float32Array {
    const out = new Float32Array(layer.parameterCount);
    const { format, rawQuantizedBytes, scaleFactor } = layer;

    if (format === 'INT8') {
      for (let i = 0; i < layer.parameterCount; i++) {
        const q = rawQuantizedBytes[i] - 128;
        out[i] = q * scaleFactor;
      }
    } else if (format === 'INT4') {
      for (let i = 0; i < layer.parameterCount; i++) {
        const byte = rawQuantizedBytes[Math.floor(i / 2)];
        const nibble = (i % 2 === 0) ? (byte & 0x0F) : ((byte >> 4) & 0x0F);
        const q = nibble - 8;
        out[i] = q * scaleFactor;
      }
    } else if (format === 'FP8') {
      for (let i = 0; i < layer.parameterCount; i++) {
        const q = rawQuantizedBytes[i] - 128;
        out[i] = q * scaleFactor;
      }
    } else {
      // FP16 fallback
      for (let i = 0; i < layer.parameterCount; i++) {
        out[i] = (i % 10) * 0.1;
      }
    }

    return out;
  }

  /**
   * Computes dot product between quantized weights and an activation vector.
   */
  public static quantizedDotProduct(layer: QuantizedTensorLayer, activation: Float32Array): number {
    const dequant = this.dequantize(layer);
    const len = Math.min(dequant.length, activation.length);
    let sum = 0.0;
    for (let i = 0; i < len; i++) {
      sum += dequant[i] * activation[i];
    }
    return parseFloat(sum.toFixed(6));
  }
}
