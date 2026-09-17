/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 18: Step 13 Quantized Tensor Engine Types
 *
 * Master specifications for:
 * - Hardware-neutral quantization formats: FP32, FP16, INT8, INT4
 * - Quantization scale & zero-point parameters
 * - Quantized tensor descriptors and error metrics
 * - Quantized tiled tensor memory bounds and CAS residency
 */

import { TensorShape, TensorDType } from '../types';

export type QuantizationFormat = 'FP32' | 'FP16' | 'INT8' | 'INT4';

export interface QuantizationParams {
  readonly scale: number;
  readonly zeroPoint: number;
  readonly minValue: number;
  readonly maxValue: number;
  readonly bits: number;
  readonly isSymmetric: boolean;
}

export interface QuantizedTensorDescriptor {
  readonly tensorId: string;
  readonly shape: TensorShape;
  readonly format: QuantizationFormat;
  readonly params: QuantizationParams;
  readonly byteSize: number;
  readonly originalByteSize: number;
  readonly compressionRatio: number;
  readonly checksum: string;
}

export interface QuantizationErrorMetrics {
  readonly meanAbsoluteError: number;
  readonly rootMeanSquaredError: number;
  readonly maxAbsoluteError: number;
  readonly signalToNoiseRatioDb: number;
  readonly relativeError: number;
  readonly elementCount: number;
}

export interface QuantizedTile {
  readonly tileId: string;
  readonly parentTensorId: string;
  readonly shape: readonly number[];
  readonly offsets: readonly number[];
  readonly format: QuantizationFormat;
  readonly params: QuantizationParams;
  readonly byteSize: number;
  readonly isResident: boolean;
  readonly isDirty: boolean;
  readonly data?: Uint8Array | Float32Array;
  readonly blockId?: string;
}

export interface QuantizedTiledTensorDescriptor {
  readonly tensorId: string;
  readonly fullShape: readonly number[];
  readonly tileShape: readonly number[];
  readonly format: QuantizationFormat;
  readonly totalTiles: number;
  readonly totalElements: number;
  readonly totalSizeBytes: number;
  readonly originalSizeBytes: number;
  readonly memorySavingsRatio: number;
  readonly tiles: readonly QuantizedTile[];
}
