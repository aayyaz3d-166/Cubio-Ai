/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 45: Memory Estimator & Scientific Ledger
 *
 * Mathematically calculates storage footprint, resident weight footprint,
 * activation buffers, and working-set RSS across quantization formats.
 */

import {
  ScalableModelArchitectureConfig,
  MemoryEstimationReport,
} from './types';
import { ParameterEstimator } from './parameterEstimator';
import { EdgeProfileName } from '../../fabric/types';

export class MemoryEstimator {
  /**
   * Generates a scientific memory estimation report.
   */
  public static estimate(cfg: ScalableModelArchitectureConfig): MemoryEstimationReport {
    const params = ParameterEstimator.estimate(cfg);
    const n = params.totalParameters;

    // Weight footprints:
    const fp16Bytes = n * 2;
    const int8Bytes = n * 1;
    const int4Bytes = Math.ceil(n * 0.5);

    // Compressed CAS storage on disk (estimated 65% zstandard/gzip ratio over INT8)
    const storageBytesCas = Math.round(int8Bytes * 0.65);

    // Activation memory per sample batch (SeqLen * HiddenDim * Layers * 2 bytes)
    const batchSize = 1;
    const seqLen = Math.min(cfg.maxSequenceLength, 512);
    const layers = cfg.enableActivationCheckpointing ? 1 : cfg.layerCount;
    const activationMemoryPerBatchBytes = batchSize * seqLen * cfg.hiddenDimension * layers * 2;

    // Execution Working Set under Tiled Execution:
    // Only current layer tile + activation buffer reside in RAM simultaneously
    const singleLayerParams = params.attentionParamsPerLayer + params.ffnParamsPerLayer;
    const activeLayerWeightBytes = singleLayerParams * (cfg.defaultQuantization === 'INT4' ? 0.5 : 1.0);
    const executionWorkingSetBytes = cfg.tileSizeBytes + activeLayerWeightBytes + activationMemoryPerBatchBytes;

    let recommendedProfile: EdgeProfileName = 'CUBIO_EDGE_2GB';
    if (fp16Bytes > 2 * 1024 * 1024 * 1024) {
      recommendedProfile = 'CUBIO_8GB';
    } else if (fp16Bytes > 512 * 1024 * 1024) {
      recommendedProfile = 'CUBIO_4GB';
    }

    const is2GBCompliant = executionWorkingSetBytes <= 512 * 1024 * 1024;

    return Object.freeze({
      configId: cfg.modelId,
      profile: cfg.profile,
      totalParameters: n,
      storageBytesCas,
      residentWeightBytesFP16: fp16Bytes,
      residentWeightBytesINT8: int8Bytes,
      residentWeightBytesINT4: int4Bytes,
      activationMemoryPerBatchBytes,
      executionWorkingSetBytes,
      maxRecommendedEdgeProfile: recommendedProfile,
      is2GBEdgeCompliant: is2GBCompliant,
    });
  }
}
