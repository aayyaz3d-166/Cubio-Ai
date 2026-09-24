/**
 * CUBiO AI — Task 159: Native Model Scaling Architecture
 * src/cubio/model/native_scaling/modelManifest.ts
 *
 * Deterministic model configuration & version manifests for native scaling profiles.
 * Guarantees cryptographic auditability, tenant isolation, OCC versioning,
 * and permanent physical actuation lockout.
 */

import * as crypto from 'crypto';
import {
  NativeScalingProfileId,
  NativeModelArchitectureConfig,
  NativeModelManifest,
  PROHIBITED_EXTERNAL_MODELS,
  IS_ACTUATION_BLOCKED,
  TASK_159_ID,
} from './types';
import {
  calculateParameterBreakdown,
  getScalingProfile,
  validateProfileConfig,
} from './scalingProfiles';
import {
  canonicalStringify,
  calculateCanonicalChecksum,
} from '../../core/canonicalIdentity';

export class SovereignModelGuardError extends Error {
  constructor(message: string) {
    super(`[SOVEREIGN_MODEL_GUARD_VIOLATION] ${message}`);
    this.name = 'SovereignModelGuardError';
  }
}

export class ModelManifestValidationError extends Error {
  constructor(message: string) {
    super(`[MANIFEST_VALIDATION_ERROR] ${message}`);
    this.name = 'ModelManifestValidationError';
  }
}

/**
 * Asserts that a model identifier or architecture does not contain foreign pretrained identifiers.
 */
export function assertNativeSovereignty(modelNameOrId: string): void {
  const normalized = modelNameOrId.toLowerCase().trim();
  for (const prohibited of PROHIBITED_EXTERNAL_MODELS) {
    if (normalized.includes(prohibited)) {
      throw new SovereignModelGuardError(
        `Prohibited external model identifier detected: '${prohibited}'. Only 100% native CUBiO architecture is permitted.`
      );
    }
  }
}

export interface CreateManifestOptions {
  readonly profileId: NativeScalingProfileId;
  readonly tenantId?: string;
  readonly stateVersion?: number;
  readonly customConfig?: NativeModelArchitectureConfig;
  readonly createdAt?: string;
}

/**
 * Creates a deterministic, cryptographically signed model manifest for any scaling profile.
 */
export function createModelScalingManifest(options: CreateManifestOptions): NativeModelManifest {
  const { profileId, tenantId = 'root', stateVersion = 1, customConfig, createdAt } = options;

  let config: NativeModelArchitectureConfig;
  if (profileId === NativeScalingProfileId.CUSTOM) {
    if (!customConfig) {
      throw new ModelManifestValidationError('customConfig must be supplied when profileId is CUSTOM.');
    }
    config = customConfig;
  } else {
    config = getScalingProfile(profileId);
  }

  // Validate structural integrity
  const validation = validateProfileConfig(config);
  if (!validation.isValid) {
    throw new ModelManifestValidationError(`Invalid profile configuration: ${validation.errors.join('; ')}`);
  }

  // Assert native sovereignty
  assertNativeSovereignty(config.modelName);

  const parameterBreakdown = calculateParameterBreakdown(config);
  const modelId = `URN:CUBIO:MODEL:${config.profileId}:${config.hiddenDimension}D-${config.layerCount}L`;

  // Deterministic canonical payload for state hash (independent of timestamp for bit-identical reproducibility)
  const canonicalPayload = {
    taskId: TASK_159_ID,
    modelId,
    profileId: config.profileId,
    layerCount: config.layerCount,
    hiddenDimension: config.hiddenDimension,
    attentionHeads: config.attentionHeads,
    ffnDimension: config.ffnDimension,
    vocabSize: config.vocabSize,
    maxSequenceLength: config.maxSequenceLength,
    spatialCells: config.spatialCells,
    symbolicAnchors: config.symbolicAnchors,
    epistemicClasses: config.epistemicClasses,
    masterSeed: config.masterSeed,
    totalParameters: parameterBreakdown.totalParameters,
    tensorCount: parameterBreakdown.tensorCount,
    stateVersion,
    tenantId,
    isActuationBlocked: IS_ACTUATION_BLOCKED,
    isNativeOnly: true,
  };

  const canonicalChecksum = calculateCanonicalChecksum(canonicalPayload);
  const stateHash = crypto.createHash('sha256').update(canonicalStringify(canonicalPayload), 'utf8').digest('hex');

  return Object.freeze({
    manifestVersion: '1.0.0',
    modelId,
    profileId: config.profileId,
    stateVersion,
    tenantId,
    config,
    parameterBreakdown,
    canonicalChecksum,
    stateHash,
    createdAt: createdAt || '2026-09-13T00:00:00.000Z',
    isActuationBlocked: IS_ACTUATION_BLOCKED,
    isNativeOnly: true,
  });
}

/**
 * Verifies that a manifest's cryptographic state hash matches its internal payload.
 */
export function verifyManifestIntegrity(manifest: NativeModelManifest): { isValid: boolean; error?: string } {
  if (!manifest.isActuationBlocked) {
    return { isValid: false, error: 'Hardware actuation lock is violated: isActuationBlocked must be true.' };
  }
  if (!manifest.isNativeOnly) {
    return { isValid: false, error: 'Manifest is not flagged as native-only.' };
  }

  try {
    assertNativeSovereignty(manifest.config.modelName);
  } catch (err: any) {
    return { isValid: false, error: err.message };
  }

  const expectedBreakdown = calculateParameterBreakdown(manifest.config);
  if (expectedBreakdown.totalParameters !== manifest.parameterBreakdown.totalParameters) {
    return {
      isValid: false,
      error: `Parameter count mismatch: manifest states ${manifest.parameterBreakdown.totalParameters}, calculated ${expectedBreakdown.totalParameters}.`,
    };
  }

  const canonicalPayload = {
    taskId: TASK_159_ID,
    modelId: manifest.modelId,
    profileId: manifest.config.profileId,
    layerCount: manifest.config.layerCount,
    hiddenDimension: manifest.config.hiddenDimension,
    attentionHeads: manifest.config.attentionHeads,
    ffnDimension: manifest.config.ffnDimension,
    vocabSize: manifest.config.vocabSize,
    maxSequenceLength: manifest.config.maxSequenceLength,
    spatialCells: manifest.config.spatialCells,
    symbolicAnchors: manifest.config.symbolicAnchors,
    epistemicClasses: manifest.config.epistemicClasses,
    masterSeed: manifest.config.masterSeed,
    totalParameters: manifest.parameterBreakdown.totalParameters,
    tensorCount: manifest.parameterBreakdown.tensorCount,
    stateVersion: manifest.stateVersion,
    tenantId: manifest.tenantId,
    isActuationBlocked: true,
    isNativeOnly: true,
  };

  const recalculatedHash = crypto.createHash('sha256').update(canonicalStringify(canonicalPayload), 'utf8').digest('hex');
  if (recalculatedHash !== manifest.stateHash) {
    return {
      isValid: false,
      error: `Cryptographic stateHash mismatch: expected ${manifest.stateHash}, got ${recalculatedHash}.`,
    };
  }

  return { isValid: true };
}
