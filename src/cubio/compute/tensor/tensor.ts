/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 15: Hardware-Neutral Tensor Runtime & CubiOTensor
 *
 * Implements N-dimensional array tensors, element-wise math, linear algebra (matmul, dot),
 * reductions (sum, mean, softmax), transpositions, and deterministic hashing.
 */

import { TensorDType, TensorShape } from '../types';
import { deterministicHash } from '../../state/determinism';

export class CubiOTensor {
  public readonly shape: TensorShape;
  public readonly dtype: TensorDType;
  public readonly data: Float64Array;
  private cachedChecksum?: string;

  constructor(dimensions: readonly number[], data?: Float64Array | readonly number[], dtype: TensorDType = 'FLOAT64') {
    const rank = dimensions.length;
    let elementCount = 1;
    for (const d of dimensions) {
      elementCount *= d;
    }

    const strides = new Array(rank).fill(1);
    for (let i = rank - 2; i >= 0; i--) {
      strides[i] = strides[i + 1] * dimensions[i + 1];
    }

    this.shape = Object.freeze({
      dimensions: Object.freeze([...dimensions]),
      rank,
      elementCount,
      strides: Object.freeze(strides),
    });

    this.dtype = dtype;

    if (data) {
      if (data instanceof Float64Array) {
        this.data = new Float64Array(data);
      } else {
        this.data = new Float64Array(data);
      }
    } else {
      this.data = new Float64Array(elementCount);
    }
  }

  public static zeros(dimensions: readonly number[]): CubiOTensor {
    return new CubiOTensor(dimensions);
  }

  public static ones(dimensions: readonly number[]): CubiOTensor {
    const t = new CubiOTensor(dimensions);
    t.data.fill(1.0);
    return t;
  }

  public static fromArray(dimensions: readonly number[], values: readonly number[]): CubiOTensor {
    return new CubiOTensor(dimensions, values);
  }

  public get(indices: readonly number[]): number {
    let offset = 0;
    for (let i = 0; i < indices.length; i++) {
      offset += indices[i] * this.shape.strides[i];
    }
    return this.data[offset];
  }

  public set(indices: readonly number[], value: number): void {
    let offset = 0;
    for (let i = 0; i < indices.length; i++) {
      offset += indices[i] * this.shape.strides[i];
    }
    this.data[offset] = value;
    this.cachedChecksum = undefined;
  }

  public getChecksum(): string {
    if (!this.cachedChecksum) {
      let preview = '';
      const len = Math.min(64, this.data.length);
      for (let i = 0; i < len; i++) {
        preview += this.data[i].toFixed(4) + ',';
      }
      this.cachedChecksum = deterministicHash(
        `TENSOR:${this.shape.dimensions.join('x')}:${this.shape.elementCount}:${preview}`
      );
    }
    return this.cachedChecksum;
  }

  public clone(): CubiOTensor {
    return new CubiOTensor(this.shape.dimensions, this.data, this.dtype);
  }
}

export class TensorRuntime {
  /**
   * Element-wise Addition (A + B)
   */
  public static add(a: CubiOTensor, b: CubiOTensor): CubiOTensor {
    if (a.shape.elementCount !== b.shape.elementCount) {
      throw new Error(`Shape mismatch for add: ${a.shape.dimensions} vs ${b.shape.dimensions}`);
    }
    const out = new CubiOTensor(a.shape.dimensions);
    for (let i = 0; i < a.shape.elementCount; i++) {
      out.data[i] = a.data[i] + b.data[i];
    }
    return out;
  }

  /**
   * Element-wise Subtraction (A - B)
   */
  public static subtract(a: CubiOTensor, b: CubiOTensor): CubiOTensor {
    if (a.shape.elementCount !== b.shape.elementCount) {
      throw new Error(`Shape mismatch for subtract: ${a.shape.dimensions} vs ${b.shape.dimensions}`);
    }
    const out = new CubiOTensor(a.shape.dimensions);
    for (let i = 0; i < a.shape.elementCount; i++) {
      out.data[i] = a.data[i] - b.data[i];
    }
    return out;
  }

  /**
   * Element-wise Multiplication / Hadamard product (A * B)
   */
  public static multiply(a: CubiOTensor, b: CubiOTensor | number): CubiOTensor {
    const out = new CubiOTensor(a.shape.dimensions);
    if (typeof b === 'number') {
      for (let i = 0; i < a.shape.elementCount; i++) {
        out.data[i] = a.data[i] * b;
      }
    } else {
      if (a.shape.elementCount !== b.shape.elementCount) {
        throw new Error(`Shape mismatch for multiply: ${a.shape.dimensions} vs ${b.shape.dimensions}`);
      }
      for (let i = 0; i < a.shape.elementCount; i++) {
        out.data[i] = a.data[i] * b.data[i];
      }
    }
    return out;
  }

  /**
   * Fused Multiply-Add (A * B + C)
   */
  public static fma(a: CubiOTensor, b: CubiOTensor, c: CubiOTensor): CubiOTensor {
    const out = new CubiOTensor(a.shape.dimensions);
    for (let i = 0; i < a.shape.elementCount; i++) {
      out.data[i] = a.data[i] * b.data[i] + c.data[i];
    }
    return out;
  }

  /**
   * 2D Matrix Multiplication [M, K] x [K, N] -> [M, N]
   */
  public static matmul(a: CubiOTensor, b: CubiOTensor): CubiOTensor {
    if (a.shape.rank !== 2 || b.shape.rank !== 2) {
      throw new Error('matmul requires rank-2 2D tensors');
    }
    const [M, K1] = a.shape.dimensions;
    const [K2, N] = b.shape.dimensions;
    if (K1 !== K2) {
      throw new Error(`Inner dimension mismatch for matmul: [${M}, ${K1}] x [${K2}, ${N}]`);
    }

    const out = new CubiOTensor([M, N]);
    for (let m = 0; m < M; m++) {
      for (let n = 0; n < N; n++) {
        let sum = 0.0;
        for (let k = 0; k < K1; k++) {
          sum += a.data[m * K1 + k] * b.data[k * N + n];
        }
        out.data[m * N + n] = sum;
      }
    }
    return out;
  }

  /**
   * 1D Vector Dot Product
   */
  public static dot(a: CubiOTensor, b: CubiOTensor): number {
    if (a.shape.elementCount !== b.shape.elementCount) {
      throw new Error('Vector dot product requires matching element counts');
    }
    let sum = 0.0;
    for (let i = 0; i < a.shape.elementCount; i++) {
      sum += a.data[i] * b.data[i];
    }
    return parseFloat(sum.toFixed(6));
  }

  /**
   * Sum Reduction over all elements
   */
  public static reduceSum(t: CubiOTensor): number {
    let sum = 0.0;
    for (let i = 0; i < t.shape.elementCount; i++) {
      sum += t.data[i];
    }
    return parseFloat(sum.toFixed(6));
  }

  /**
   * Mean Reduction over all elements
   */
  public static reduceMean(t: CubiOTensor): number {
    if (t.shape.elementCount === 0) return 0.0;
    return parseFloat((this.reduceSum(t) / t.shape.elementCount).toFixed(6));
  }

  /**
   * Softmax normalizer along the last dimension
   */
  public static softmax(t: CubiOTensor): CubiOTensor {
    const out = t.clone();
    let maxVal = -Infinity;
    for (let i = 0; i < out.shape.elementCount; i++) {
      if (out.data[i] > maxVal) maxVal = out.data[i];
    }

    let sumExp = 0.0;
    for (let i = 0; i < out.shape.elementCount; i++) {
      out.data[i] = Math.exp(out.data[i] - maxVal);
      sumExp += out.data[i];
    }

    if (sumExp > 0) {
      for (let i = 0; i < out.shape.elementCount; i++) {
        out.data[i] = parseFloat((out.data[i] / sumExp).toFixed(6));
      }
    }

    return out;
  }

  /**
   * 2D Matrix Transpose [M, N] -> [N, M]
   */
  public static transpose(t: CubiOTensor): CubiOTensor {
    if (t.shape.rank !== 2) {
      throw new Error('Transpose currently supports rank-2 matrices');
    }
    const [M, N] = t.shape.dimensions;
    const out = new CubiOTensor([N, M]);
    for (let m = 0; m < M; m++) {
      for (let n = 0; n < N; n++) {
        out.data[n * M + m] = t.data[m * N + n];
      }
    }
    return out;
  }

  /**
   * Reshape tensor into new dimensions with same element count
   */
  public static reshape(t: CubiOTensor, newDimensions: readonly number[]): CubiOTensor {
    let newCount = 1;
    for (const d of newDimensions) {
      newCount *= d;
    }
    if (newCount !== t.shape.elementCount) {
      throw new Error(`Cannot reshape tensor with ${t.shape.elementCount} elements into ${newCount}`);
    }
    return new CubiOTensor(newDimensions, t.data, t.dtype);
  }
}
