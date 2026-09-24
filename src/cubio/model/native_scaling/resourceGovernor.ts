/**
 * CUBiO AI — Task 159: Native Model Scaling Architecture
 * src/cubio/model/native_scaling/resourceGovernor.ts
 *
 * Enforces bounded CPU and RAM usage, memory footprint estimation,
 * and fail-closed rejection of unsupported or resource-exhausting model configurations.
 */

import {
  NativeModelArchitectureConfig,
  NativeMemoryFootprint,
  NativeResourceLimits,
  NativeScalingProfileId,
} from './types';
import { calculateParameterBreakdown } from './scalingProfiles';

export class ResourceQuotaExceededError extends Error {
  constructor(message: string) {
    super(`[RESOURCE_QUOTA_EXCEEDED] ${message}`);
    this.name = 'ResourceQuotaExceededError';
  }
}

export class UnsupportedConfigurationError extends Error {
  constructor(message: string) {
    super(`[UNSUPPORTED_CONFIGURATION] ${message}`);
    this.name = 'UnsupportedConfigurationError';
  }
}

/**
 * Default hard limits enforced by the sovereign governor.
 */
export const DEFAULT_RESOURCE_LIMITS: NativeResourceLimits = Object.freeze({
  maxParameters: 105_000_000, // 105M absolute parameter cap
  minParameters: 200_000,     // 200K minimum floor
  maxLayerCount: 32,          // Up to 32 transformer layers
  maxHiddenDimension: 1024,   // Max hidden dimension 1024
  maxSequenceLength: 4096,    // Max sequence length 4096
  maxRamBytes: 1024 * 1024 * 1024, // 1 GB execution memory cap
  maxForwardLatencyMs: 5000,
});

/**
 * Computes memory footprint across FP32, FP16, INT8, and peak working RAM.
 */
export function estimateMemoryFootprint(
  config: NativeModelArchitectureConfig,
  maxAllowedRamBytes: number = DEFAULT_RESOURCE_LIMITS.maxRamBytes
): NativeMemoryFootprint {
  const breakdown = calculateParameterBreakdown(config);
  const totalParams = breakdown.totalParameters;

  // Weight storage
  const residentWeightBytesFP32 = totalParams * 4;
  const residentWeightBytesFP16 = totalParams * 2;
  const residentWeightBytesINT8 = totalParams * 1;

  // Activation buffer for forward inference:
  // ~ 2 * layerCount * maxSeqLen * hiddenDimension * 4 bytes
  const activationWorkingSetBytes = Math.ceil(
    2 * config.layerCount * config.maxSequenceLength * config.hiddenDimension * 4
  );

  // Peak RAM: resident FP32 weights + activation workspace + 15% runtime buffer overhead
  const peakRamEstimateBytes = Math.ceil((residentWeightBytesFP32 + activationWorkingSetBytes) * 1.15);

  const isWithinBudget = peakRamEstimateBytes <= maxAllowedRamBytes;

  return Object.freeze({
    profileId: config.profileId,
    totalParameters: totalParams,
    residentWeightBytesFP32,
    residentWeightBytesFP16,
    residentWeightBytesINT8,
    activationWorkingSetBytes,
    peakRamEstimateBytes,
    isWithinBudget,
    maxAllowedRamBytes,
  });
}

/**
 * Asserts that a configuration satisfies all bounded resource criteria.
 * Throws ResourceQuotaExceededError or UnsupportedConfigurationError on violation.
 */
export function assertWithinResourceBounds(
  config: NativeModelArchitectureConfig,
  customLimits?: Partial<NativeResourceLimits>
): void {
  const limits: NativeResourceLimits = {
    ...DEFAULT_RESOURCE_LIMITS,
    ...customLimits,
  };

  const breakdown = calculateParameterBreakdown(config);

  // 1. Parameter limits
  if (breakdown.totalParameters > limits.maxParameters) {
    throw new ResourceQuotaExceededError(
      `Parameter count ${breakdown.totalParameters.toLocaleString()} exceeds hard ceiling of ${limits.maxParameters.toLocaleString()}.`
    );
  }

  if (breakdown.totalParameters < limits.minParameters) {
    throw new UnsupportedConfigurationError(
      `Parameter count ${breakdown.totalParameters.toLocaleString()} is below minimum floor of ${limits.minParameters.toLocaleString()}.`
    );
  }

  // 2. Structural dimension limits
  if (config.layerCount > limits.maxLayerCount) {
    throw new ResourceQuotaExceededError(
      `Layer count ${config.layerCount} exceeds maximum limit of ${limits.maxLayerCount}.`
    );
  }

  if (config.hiddenDimension > limits.maxHiddenDimension) {
    throw new ResourceQuotaExceededError(
      `Hidden dimension ${config.hiddenDimension} exceeds maximum limit of ${limits.maxHiddenDimension}.`
    );
  }

  if (config.maxSequenceLength > limits.maxSequenceLength) {
    throw new ResourceQuotaExceededError(
      `Sequence length ${config.maxSequenceLength} exceeds maximum limit of ${limits.maxSequenceLength}.`
    );
  }

  // 3. Memory budget check
  const footprint = estimateMemoryFootprint(config, limits.maxRamBytes);
  if (!footprint.isWithinBudget) {
    throw new ResourceQuotaExceededError(
      `Peak RAM estimate ${Math.round(footprint.peakRamEstimateBytes / (1024 * 1024))} MB exceeds max budget ${Math.round(limits.maxRamBytes / (1024 * 1024))} MB.`
    );
  }
}
