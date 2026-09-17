/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 18: Quantized Tensor
 *
 * Implements quantized tensor representation with linear algebra operations:
 * dot, matmul, reduceSum, FMA, error analysis, and compression ratio tracking.
 */

import { CubiOTensor } from '../tensor/tensor';
import { TensorShape } from '../types';
import {
  QuantizationFormat,
  QuantizationParams,
  QuantizedTensorDescriptor,
  QuantizationErrorMetrics,
} from './types';
import { Quantizer } from './quantizer';
import { deterministicHash } from '../../state/determinism';

export class QuantizedTensor {
  public readonly descriptor: QuantizedTensorDescriptor;
  public readonly buffer: Uint8Array | Float32Array;

  constructor(
    tensorId: string,
    shape: TensorShape,
    format: QuantizationFormat,
    buffer: Uint8Array | Float32Array,
    params: QuantizationParams
  ) {
    const byteSize = buffer.byteLength;
    const originalByteSize = shape.elementCount * 8; // Float64 baseline is 8 bytes/element
    const compressionRatio = parseFloat((originalByteSize / Math.max(1, byteSize)).toFixed(2));

    const checksum = deterministicHash(
      `QTENSOR:${tensorId}:${shape.dimensions.join('x')}:${format}:${params.scale.toFixed(6)}:${params.zeroPoint}:${byteSize}`
    );

    this.descriptor = Object.freeze({
      tensorId,
      shape,
      format,
      params,
      byteSize,
      originalByteSize,
      compressionRatio,
      checksum,
    });

    this.buffer = buffer;
  }

  public static fromTensor(
    tensor: CubiOTensor,
    format: QuantizationFormat = 'INT8',
    isSymmetric = false,
    customTensorId?: string
  ): QuantizedTensor {
    const tensorId = customTensorId || `QT_${deterministicHash(tensor.getChecksum() + format).slice(2, 10)}`;
    const { buffer, params } = Quantizer.quantize(tensor.data, format, Quantizer.computeParams(tensor.data, format, isSymmetric));
    return new QuantizedTensor(tensorId, tensor.shape, format, buffer, params);
  }

  public toTensor(): CubiOTensor {
    const deq = Quantizer.dequantize(
      this.buffer,
      this.descriptor.format,
      this.descriptor.params,
      this.descriptor.shape.elementCount
    );
    return new CubiOTensor(this.descriptor.shape.dimensions, deq);
  }

  public computeError(originalTensor: CubiOTensor): QuantizationErrorMetrics {
    const deq = Quantizer.dequantize(
      this.buffer,
      this.descriptor.format,
      this.descriptor.params,
      this.descriptor.shape.elementCount
    );
    return Quantizer.computeErrorMetrics(originalTensor.data, deq);
  }

  public memorySize(): number {
    return this.descriptor.byteSize;
  }

  public compressionRatio(): number {
    return this.descriptor.compressionRatio;
  }

  /**
   * Computes quantized dot product between two 1D/flattened tensors.
   */
  public quantizedDot(other: QuantizedTensor): number {
    if (this.descriptor.shape.elementCount !== other.descriptor.shape.elementCount) {
      throw new Error(`Element count mismatch: ${this.descriptor.shape.elementCount} vs ${other.descriptor.shape.elementCount}`);
    }

    const deqA = Quantizer.dequantize(this.buffer, this.descriptor.format, this.descriptor.params, this.descriptor.shape.elementCount);
    const deqB = Quantizer.dequantize(other.buffer, other.descriptor.format, other.descriptor.params, other.descriptor.shape.elementCount);

    let sum = 0;
    for (let i = 0; i < deqA.length; i++) {
      sum += deqA[i] * deqB[i];
    }
    return sum;
  }

  /**
   * Computes quantized Matrix Multiplication: [M, K] x [K, N] -> [M, N].
   */
  public quantizedMatMul(other: QuantizedTensor): QuantizedTensor {
    if (this.descriptor.shape.rank !== 2 || other.descriptor.shape.rank !== 2) {
      throw new Error('quantizedMatMul requires rank-2 tensors');
    }

    const [M, K1] = this.descriptor.shape.dimensions;
    const [K2, N] = other.descriptor.shape.dimensions;

    if (K1 !== K2) {
      throw new Error(`Incompatible matrix dimensions: [${M}, ${K1}] x [${K2}, ${N}]`);
    }

    const deqA = Quantizer.dequantize(this.buffer, this.descriptor.format, this.descriptor.params, this.descriptor.shape.elementCount);
    const deqB = Quantizer.dequantize(other.buffer, other.descriptor.format, other.descriptor.params, other.descriptor.shape.elementCount);

    const outData = new Float64Array(M * N);
    for (let i = 0; i < M; i++) {
      for (let j = 0; j < N; j++) {
        let sum = 0;
        for (let k = 0; k < K1; k++) {
          sum += deqA[i * K1 + k] * deqB[k * N + j];
        }
        outData[i * N + j] = sum;
      }
    }

    const format = this.descriptor.format;
    const outParams = Quantizer.computeParams(outData, format, this.descriptor.params.isSymmetric);
    const { buffer: outBuf } = Quantizer.quantize(outData, format, outParams);

    const resTensorId = `QMATMUL_${deterministicHash(this.descriptor.tensorId + other.descriptor.tensorId).slice(2, 10)}`;
    const strides = [N, 1];
    const shape: TensorShape = Object.freeze({
      dimensions: Object.freeze([M, N]),
      rank: 2,
      elementCount: M * N,
      strides: Object.freeze(strides),
    });

    return new QuantizedTensor(resTensorId, shape, format, outBuf, outParams);
  }

  /**
   * Computes quantized sum reduction.
   */
  public quantizedReduceSum(): number {
    const deq = Quantizer.dequantize(this.buffer, this.descriptor.format, this.descriptor.params, this.descriptor.shape.elementCount);
    let sum = 0;
    for (let i = 0; i < deq.length; i++) {
      sum += deq[i];
    }
    return sum;
  }

  /**
   * Computes quantized Fused Multiply-Add: this * multiplier + addend.
   */
  public quantizedFMA(multiplier: QuantizedTensor, addend: QuantizedTensor): QuantizedTensor {
    const len = this.descriptor.shape.elementCount;
    if (len !== multiplier.descriptor.shape.elementCount || len !== addend.descriptor.shape.elementCount) {
      throw new Error('Tensor shape mismatch in FMA');
    }

    const deqA = Quantizer.dequantize(this.buffer, this.descriptor.format, this.descriptor.params, len);
    const deqM = Quantizer.dequantize(multiplier.buffer, multiplier.descriptor.format, multiplier.descriptor.params, len);
    const deqAdd = Quantizer.dequantize(addend.buffer, addend.descriptor.format, addend.descriptor.params, len);

    const outData = new Float64Array(len);
    for (let i = 0; i < len; i++) {
      outData[i] = deqA[i] * deqM[i] + deqAdd[i];
    }

    const format = this.descriptor.format;
    const params = Quantizer.computeParams(outData, format);
    const { buffer: outBuf } = Quantizer.quantize(outData, format, params);

    return new QuantizedTensor(
      `QFMA_${deterministicHash(this.descriptor.tensorId + multiplier.descriptor.tensorId).slice(2, 10)}`,
      this.descriptor.shape,
      format,
      outBuf,
      params
    );
  }
}
