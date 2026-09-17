/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 18: Quantizer Engine
 *
 * Implements hardware-neutral uniform affine and symmetric quantization
 * for FP32, FP16, INT8, and INT4 tensor representations.
 */

import { QuantizationFormat, QuantizationParams, QuantizationErrorMetrics } from './types';

export class Quantizer {
  /**
   * Computes scale and zero-point parameters for a given tensor buffer.
   */
  public static computeParams(
    data: Float64Array | Float32Array | readonly number[],
    format: QuantizationFormat,
    isSymmetric = false
  ): QuantizationParams {
    let min = Infinity;
    let max = -Infinity;

    for (let i = 0; i < data.length; i++) {
      const v = data[i];
      if (v < min) min = v;
      if (v > max) max = v;
    }

    if (min === Infinity || max === -Infinity || data.length === 0) {
      min = 0;
      max = 1;
    }

    // Ensure range is non-zero
    if (Math.abs(max - min) < 1e-7) {
      max = min + 1e-4;
    }

    let bits = 32;
    if (format === 'FP16') bits = 16;
    if (format === 'INT8') bits = 8;
    if (format === 'INT4') bits = 4;

    if (format === 'FP32' || format === 'FP16') {
      return Object.freeze({
        scale: 1.0,
        zeroPoint: 0,
        minValue: min,
        maxValue: max,
        bits,
        isSymmetric,
      });
    }

    const qMax = Math.pow(2, bits) - 1;
    const scale = (max - min) / qMax;
    const zeroPoint = 0;

    return Object.freeze({
      scale: Math.max(1e-9, scale),
      zeroPoint,
      minValue: min,
      maxValue: max,
      bits,
      isSymmetric,
    });
  }

  /**
   * Quantizes floating-point buffer into target quantized byte representation.
   */
  public static quantize(
    data: Float64Array | Float32Array | readonly number[],
    format: QuantizationFormat,
    customParams?: QuantizationParams
  ): { buffer: Uint8Array | Float32Array; params: QuantizationParams } {
    const params = customParams || this.computeParams(data, format);
    const len = data.length;

    if (format === 'FP32') {
      const buf = new Float32Array(len);
      for (let i = 0; i < len; i++) buf[i] = data[i];
      return { buffer: buf, params };
    }

    if (format === 'FP16') {
      const u8 = new Uint8Array(len * 2);
      const view = new DataView(u8.buffer);
      const range = Math.max(1e-7, params.maxValue - params.minValue);
      for (let i = 0; i < len; i++) {
        const qVal = Math.max(0, Math.min(65535, Math.round(((data[i] - params.minValue) / range) * 65535)));
        view.setUint16(i * 2, qVal, true);
      }
      return { buffer: u8, params };
    }

    if (format === 'INT8') {
      const u8 = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        const q = Math.round((data[i] - params.minValue) / params.scale);
        u8[i] = Math.max(0, Math.min(255, q));
      }
      return { buffer: u8, params };
    }

    if (format === 'INT4') {
      const byteLen = Math.ceil(len / 2);
      const u8 = new Uint8Array(byteLen);
      for (let i = 0; i < len; i += 2) {
        const q0 = Math.max(0, Math.min(15, Math.round((data[i] - params.minValue) / params.scale)));
        let q1 = 0;
        if (i + 1 < len) {
          q1 = Math.max(0, Math.min(15, Math.round((data[i + 1] - params.minValue) / params.scale)));
        }
        u8[i >> 1] = (q0 & 0x0f) | ((q1 & 0x0f) << 4);
      }
      return { buffer: u8, params };
    }

    throw new Error(`Unsupported quantization format: ${format}`);
  }

  /**
   * Dequantizes quantized buffer back into Float64Array.
   */
  public static dequantize(
    buffer: Uint8Array | Float32Array,
    format: QuantizationFormat,
    params: QuantizationParams,
    elementCount: number
  ): Float64Array {
    const out = new Float64Array(elementCount);

    if (format === 'FP32') {
      const f32 = buffer instanceof Float32Array ? buffer : new Float32Array(buffer.buffer);
      for (let i = 0; i < elementCount; i++) out[i] = f32[i];
      return out;
    }

    if (format === 'FP16') {
      const u8 = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer.buffer);
      const view = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
      const step = (params.maxValue - params.minValue) / 65535;
      for (let i = 0; i < elementCount; i++) {
        const qVal = view.getUint16(i * 2, true);
        out[i] = params.minValue + qVal * step;
      }
      return out;
    }

    if (format === 'INT8') {
      const u8 = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer.buffer);
      for (let i = 0; i < elementCount; i++) {
        out[i] = params.minValue + u8[i] * params.scale;
      }
      return out;
    }

    if (format === 'INT4') {
      const u8 = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer.buffer);
      for (let i = 0; i < elementCount; i++) {
        const byteVal = u8[i >> 1];
        const q = (i % 2 === 0) ? (byteVal & 0x0f) : ((byteVal >> 4) & 0x0f);
        out[i] = params.minValue + q * params.scale;
      }
      return out;
    }

    throw new Error(`Unsupported quantization format: ${format}`);
  }

  /**
   * Computes error metrics between original float buffer and dequantized buffer.
   */
  public static computeErrorMetrics(
    original: Float64Array | Float32Array | readonly number[],
    dequantized: Float64Array | readonly number[]
  ): QuantizationErrorMetrics {
    const len = original.length;
    let sumAbs = 0;
    let sumSq = 0;
    let maxAbs = 0;
    let origSigSq = 0;
    let noiseSq = 0;

    for (let i = 0; i < len; i++) {
      const diff = Math.abs(original[i] - dequantized[i]);
      sumAbs += diff;
      sumSq += diff * diff;
      if (diff > maxAbs) maxAbs = diff;

      origSigSq += original[i] * original[i];
      noiseSq += diff * diff;
    }

    const mae = len > 0 ? sumAbs / len : 0;
    const rmse = len > 0 ? Math.sqrt(sumSq / len) : 0;
    const snr = noiseSq > 1e-12 ? 10 * Math.log10(origSigSq / noiseSq) : 99.0;
    const origNorm = origSigSq > 0 ? Math.sqrt(origSigSq) : 1.0;
    const relError = origNorm > 0 ? Math.sqrt(noiseSq) / origNorm : 0;

    return Object.freeze({
      meanAbsoluteError: parseFloat(mae.toFixed(6)),
      rootMeanSquaredError: parseFloat(rmse.toFixed(6)),
      maxAbsoluteError: parseFloat(maxAbs.toFixed(6)),
      signalToNoiseRatioDb: parseFloat(snr.toFixed(2)),
      relativeError: parseFloat(relError.toFixed(6)),
      elementCount: len,
    });
  }
}
