/**
 * ============================================================================
 * CUBiO AI — PHASE 30 TASK 492: CANDIDATE CHECKPOINT FORENSIC VALIDATOR
 * src/cubio/benchmark/phase30MotherCoreCheckpointValidator.ts
 * ============================================================================
 *
 * Performs comprehensive forensic validation of the candidate Mother Core checkpoint:
 * 1. Container & Header Format (.3dmemory V3 binary container, magic bytes, offsets).
 * 2. Parameter Accounting & Architecture Integrity (219,264 float32 weights, 37 tensors).
 * 3. Cryptographic State Verification (SHA-256 digests, canonical record checksums).
 * 4. Save -> Restore -> Inference Parity Gate (Bit-exact output & loss match).
 * 5. Corruption & Incompatibility Rejection Probes (Checksum tampering, tenant mismatch, truncation).
 * 6. Protected Production Checkpoint Custody Confirmation (Phase 16 remains pristine).
 * 7. Enforces IS_ACTUATION_BLOCKED === true, OFFLINE_ISOLATED === true, and 0-bit drift.
 * ============================================================================
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

import {
  IS_ACTUATION_BLOCKED,
  OFFLINE_ISOLATED,
} from '../intelligence/core/coreEngineContract';
import { ExternalModelGuard } from '../model/native_foundation/external_model_guard';
import {
  CUBIO_NATIVE_MODEL_ID,
  EpistemicStatus,
} from '../model/native_foundation/native_model_types';
import { SQLiteDataStore } from '../../funnel71/persistence/sqlitePersistence';
import {
  NativeTrainingIntegrationEngine,
  CanonicalTrainingSample,
} from '../core/nativeTrainingIntegration';
import {
  ThreeDMemoryCheckpointEngine,
  CheckpointHeader,
  CheckpointIndexEntry,
} from '../core/threeDMemoryStreaming';
import { calculateCanonicalChecksum } from '../core/canonicalIdentity';
import { Phase30MotherCoreMasterBenchmark } from './phase30MotherCoreMasterBenchmark';

export const P30_VALIDATOR_TRACK_ID = 'PHASE30_MOTHER_CORE_CHECKPOINT_FORENSIC_VALIDATION_V1';
export const P30_VALIDATOR_EXPERIMENT_ID = 'EXP_MOTHER_CORE_P30_T492_CHECKPOINT_VALIDATION';
export const CANDIDATE_CHECKPOINT_PATH = 'data/checkpoints/phase30/mother_core_phase30_anti_regression_v1.3dmemory';
export const PRODUCTION_CHECKPOINT_PATH = 'data/checkpoints/phase16_production_final_sealed_1m.3dmemory';
export const PRODUCTION_CHECKPOINT_EXPECTED_HASH = '453590e284f250525d42d5f99d8fca07957f1e0ac1218b7d43eff6d3a762c1b8';

export interface ContainerForensicRecord {
  readonly magic: string;
  readonly format: string;
  readonly version: number;
  readonly checkpointId: string;
  readonly tenantId: string;
  readonly createdAt: string;
  readonly entryCount: number;
  readonly totalFileBytes: number;
  readonly fileSha256Digest: string;
  readonly isFormatValid: boolean;
}

export interface ParameterForensicRecord {
  readonly totalParameters: number;
  readonly trainableParameters: number;
  readonly nonTrainableParameters: number;
  readonly tensorCount: number;
  readonly tensorInventoryMatches: boolean;
  readonly architectureVerified: boolean;
}

export interface RecordIntegrityForensicRecord {
  readonly objectId: string;
  readonly tenantId: string;
  readonly domain: string;
  readonly checksumInHeader: string;
  readonly checksumRecomputed: string;
  readonly isChecksumValid: boolean;
}

export interface RoundTripParityRecord {
  readonly initialLoss: number;
  readonly roundTripLoss: number;
  readonly initialEpistemicConfidence: number;
  readonly roundTripEpistemicConfidence: number;
  readonly initialWeightsStateHash: string;
  readonly roundTripWeightsStateHash: string;
  readonly isBitExactIdentical: boolean;
  readonly lossParityDelta: number;
}

export interface CorruptionRejectionProbeResult {
  readonly probeName: string;
  readonly description: string;
  readonly exceptionCaught: boolean;
  readonly errorCodeOrMessage: string;
  readonly failClosedVerified: boolean;
}

export interface ProductionCheckpointCustodyRecord {
  readonly productionFilePath: string;
  readonly expectedSha256: string;
  readonly actualSha256: string;
  readonly isBitExactPristine: boolean;
  readonly isOverwritingPrevented: boolean;
}

export interface CandidateCheckpointValidationReport {
  readonly trackId: string;
  readonly experimentId: string;
  readonly timestamp: string;
  readonly candidateCheckpointPath: string;
  readonly containerForensics: ContainerForensicRecord;
  readonly parameterForensics: ParameterForensicRecord;
  readonly recordIntegrity: readonly RecordIntegrityForensicRecord[];
  readonly roundTripParity: RoundTripParityRecord;
  readonly corruptionRejectionProbes: readonly CorruptionRejectionProbeResult[];
  readonly productionCustody: ProductionCheckpointCustodyRecord;
  readonly validationDecision: 'VALIDATED_AND_CERTIFIED' | 'REJECTED';
}

export class Phase30MotherCoreCheckpointValidator {
  private static instance: Phase30MotherCoreCheckpointValidator | null = null;

  private readonly checkpointEngine: ThreeDMemoryCheckpointEngine;

  private constructor() {
    ExternalModelGuard.assertNativeOnly('PHASE30_MOTHER_CORE_CHECKPOINT_VALIDATOR');
    this.checkpointEngine = new ThreeDMemoryCheckpointEngine();
  }

  public static getInstance(): Phase30MotherCoreCheckpointValidator {
    if (!Phase30MotherCoreCheckpointValidator.instance) {
      Phase30MotherCoreCheckpointValidator.instance = new Phase30MotherCoreCheckpointValidator();
    }
    return Phase30MotherCoreCheckpointValidator.instance;
  }

  /**
   * 1. Container & Header Format Validation
   */
  public inspectContainer(targetPath: string): ContainerForensicRecord {
    const fullPath = path.resolve(process.cwd(), targetPath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`[CHECKPOINT_FILE_MISSING] ${fullPath}`);
    }

    const fileBytes = fs.readFileSync(fullPath);
    const fileSha256 = crypto.createHash('sha256').update(fileBytes).digest('hex');
    const header = this.checkpointEngine.readHeader(fullPath);

    const isFormatValid =
      header.magic === '3DMEMORY_CHECKPOINT_V3' &&
      header.version === 3 &&
      header.format === '3dmemory' &&
      header.tenantId === 'root' &&
      header.entryCount >= 3;

    return {
      magic: header.magic,
      format: header.format,
      version: header.version,
      checkpointId: header.checkpointId,
      tenantId: header.tenantId,
      createdAt: header.createdAt,
      entryCount: header.entryCount,
      totalFileBytes: fileBytes.length,
      fileSha256Digest: fileSha256,
      isFormatValid,
    };
  }

  /**
   * 2. Parameter Accounting & Tensor Inventory Verification
   */
  public inspectParameters(targetPath: string): ParameterForensicRecord {
    const fullPath = path.resolve(process.cwd(), targetPath);
    const manifestRec = this.checkpointEngine.readEntry(fullPath, `CUBIO_MODEL_MANIFEST_${CUBIO_NATIVE_MODEL_ID}`);
    const payload = manifestRec.payload as any;

    if (!payload || !payload.inventory) {
      throw new Error('[PARAMETER_INSPECTION_FAILURE] Checkpoint manifest missing parameter inventory');
    }

    const inv = payload.inventory;
    const tensorRecords = inv.tensors || [];
    const tensorCount = tensorRecords.length;
    const totalParams = inv.totalParameters;
    const trainableParams = inv.trainableParameters;
    const nonTrainableParams = inv.nonTrainableParameters;

    const sumParameters = tensorRecords.reduce((acc: number, t: any) => acc + t.parameterCount, 0);

    const architectureVerified =
      tensorCount === 37 &&
      totalParams === 219264 &&
      trainableParams === 219264 &&
      nonTrainableParams === 0 &&
      sumParameters === 219264 &&
      inv.accountingVerified === true;

    return {
      totalParameters: totalParams,
      trainableParameters: trainableParams,
      nonTrainableParameters: nonTrainableParams,
      tensorCount,
      tensorInventoryMatches: sumParameters === totalParams,
      architectureVerified,
    };
  }

  /**
   * 3. Record-Level Cryptographic Checksum Integrity
   */
  public inspectRecordIntegrity(targetPath: string): RecordIntegrityForensicRecord[] {
    const fullPath = path.resolve(process.cwd(), targetPath);
    const index = this.checkpointEngine.readIndex(fullPath);
    const results: RecordIntegrityForensicRecord[] = [];

    for (const entry of index) {
      const record = this.checkpointEngine.readEntry(fullPath, entry.objectId);
      const recomputed = calculateCanonicalChecksum(record.payload);
      const isValid = record.identity.checksum === recomputed && entry.checksum === recomputed;

      results.push({
        objectId: entry.objectId,
        tenantId: entry.tenantId,
        domain: entry.domain,
        checksumInHeader: entry.checksum,
        checksumRecomputed: recomputed,
        isChecksumValid: isValid,
      });
    }

    return results;
  }

  /**
   * 4. Save -> Restore -> Inference Parity Gate
   */
  public async verifyRoundTripParity(targetPath: string): Promise<RoundTripParityRecord> {
    const fullPath = path.resolve(process.cwd(), targetPath);
    const dbPath = path.resolve(process.cwd(), 'data/cubio_studio.db');
    const sqliteStore = new SQLiteDataStore({ dbPath });

    // Instance A: Restores candidate checkpoint
    const engineA = new NativeTrainingIntegrationEngine({
      store: sqliteStore,
      modelConfig: {
        modelId: CUBIO_NATIVE_MODEL_ID,
        masterSeed: 369001000,
      },
    });
    const restoreA = engineA.restoreCheckpoint(fullPath, 'root');
    const stateHashA = restoreA.stateHash;

    // Evaluate reference inference sample on Instance A
    const bm = Phase30MotherCoreMasterBenchmark.getInstance();
    const curriculum = bm.generateEvaluationCurriculum();
    const testSample = curriculum.KNOWLEDGE[0];

    const evalA = engineA.evaluateSample(testSample);

    // Re-export candidate weights to a round-trip test container
    const roundTripTmpPath = path.resolve(process.cwd(), 'data/checkpoints/phase30/test_roundtrip_temp.3dmemory');
    engineA.exportCheckpoint(roundTripTmpPath, {
      tenantId: 'root',
      trainingRunId: 'ROUNDTRIP_PARITY_TEST',
      epoch: restoreA.epoch,
      provenanceHash: restoreA.provenanceHash,
    });

    // Instance B: Fresh genesis model instance restores the re-exported container
    const engineB = new NativeTrainingIntegrationEngine({
      store: sqliteStore,
      modelConfig: {
        modelId: CUBIO_NATIVE_MODEL_ID,
        masterSeed: 369001000,
      },
    });
    const restoreB = engineB.restoreCheckpoint(roundTripTmpPath, 'root');
    const stateHashB = restoreB.stateHash;

    const evalB = engineB.evaluateSample(testSample);

    // Clean up temporary round-trip container
    if (fs.existsSync(roundTripTmpPath)) {
      fs.unlinkSync(roundTripTmpPath);
    }

    const isBitExact =
      stateHashA === stateHashB &&
      evalA.totalLoss === evalB.totalLoss &&
      evalA.tokenLoss === evalB.tokenLoss &&
      evalA.epistemicLoss === evalB.epistemicLoss;

    return {
      initialLoss: Number(evalA.totalLoss.toFixed(4)),
      roundTripLoss: Number(evalB.totalLoss.toFixed(4)),
      initialEpistemicConfidence: Number((1.0 - evalA.epistemicLoss / 10).toFixed(4)),
      roundTripEpistemicConfidence: Number((1.0 - evalB.epistemicLoss / 10).toFixed(4)),
      initialWeightsStateHash: stateHashA,
      roundTripWeightsStateHash: stateHashB,
      isBitExactIdentical: isBitExact,
      lossParityDelta: Number(Math.abs(evalA.totalLoss - evalB.totalLoss).toFixed(6)),
    };
  }

  /**
   * 5. Corruption & Incompatibility Rejection Probes
   */
  public executeCorruptionRejectionProbes(targetPath: string): CorruptionRejectionProbeResult[] {
    const fullPath = path.resolve(process.cwd(), targetPath);
    const results: CorruptionRejectionProbeResult[] = [];

    // Probe A: Tampered / Corrupted Record Checksum
    const tamperedPath = path.resolve(process.cwd(), 'data/checkpoints/phase30/test_tampered_temp.3dmemory');
    try {
      const originalBytes = fs.readFileSync(fullPath);
      const mutatedBytes = Buffer.from(originalBytes);
      // Mutate 4 bytes in the payload section (around offset 5000)
      mutatedBytes[5000] = (mutatedBytes[5000] + 1) % 256;
      mutatedBytes[5001] = (mutatedBytes[5001] + 1) % 256;
      fs.writeFileSync(tamperedPath, mutatedBytes);

      let exceptionCaught = false;
      let errorMsg = '';
      try {
        const testEngine = new NativeTrainingIntegrationEngine({
          store: new SQLiteDataStore({ dbPath: path.resolve(process.cwd(), 'data/cubio_studio.db') }),
        });
        testEngine.restoreCheckpoint(tamperedPath, 'root');
      } catch (err: any) {
        exceptionCaught = true;
        errorMsg = err.message || err.name;
      }

      results.push({
        probeName: 'CORRUPTED_RECORD_CHECKSUM_REJECTION',
        description: 'Single-byte bitflip in payload triggers fail-closed checksum integrity rejection',
        exceptionCaught,
        errorCodeOrMessage: errorMsg,
        failClosedVerified: exceptionCaught,
      });
    } finally {
      if (fs.existsSync(tamperedPath)) {
        fs.unlinkSync(tamperedPath);
      }
    }

    // Probe B: Tenant Mismatch Conflict
    let tenantMismatchCaught = false;
    let tenantErrorMsg = '';
    try {
      const testEngine = new NativeTrainingIntegrationEngine({
        store: new SQLiteDataStore({ dbPath: path.resolve(process.cwd(), 'data/cubio_studio.db') }),
      });
      testEngine.restoreCheckpoint(fullPath, 'unauthorized_foreign_tenant');
    } catch (err: any) {
      tenantMismatchCaught = true;
      tenantErrorMsg = err.message || err.name;
    }
    results.push({
      probeName: 'TENANT_MISMATCH_REJECTION',
      description: 'Restoration attempted under unauthorized foreign tenant fails closed',
      exceptionCaught: tenantMismatchCaught,
      errorCodeOrMessage: tenantErrorMsg,
      failClosedVerified: tenantMismatchCaught,
    });

    // Probe C: Truncated Container File
    const truncatedPath = path.resolve(process.cwd(), 'data/checkpoints/phase30/test_truncated_temp.3dmemory');
    try {
      const originalBytes = fs.readFileSync(fullPath);
      // Write only first 512 bytes (smaller than required 1024-byte header)
      fs.writeFileSync(truncatedPath, originalBytes.subarray(0, 512));

      let truncCaught = false;
      let truncMsg = '';
      try {
        const testEngine = new NativeTrainingIntegrationEngine({
          store: new SQLiteDataStore({ dbPath: path.resolve(process.cwd(), 'data/cubio_studio.db') }),
        });
        testEngine.restoreCheckpoint(truncatedPath, 'root');
      } catch (err: any) {
        truncCaught = true;
        truncMsg = err.message || err.name;
      }
      results.push({
        probeName: 'TRUNCATED_CONTAINER_REJECTION',
        description: 'Truncated container file (< 1024 bytes) fails closed with format exception',
        exceptionCaught: truncCaught,
        errorCodeOrMessage: truncMsg,
        failClosedVerified: truncCaught,
      });
    } finally {
      if (fs.existsSync(truncatedPath)) {
        fs.unlinkSync(truncatedPath);
      }
    }

    // Probe D: Missing File Path
    let missingCaught = false;
    let missingMsg = '';
    try {
      const testEngine = new NativeTrainingIntegrationEngine({
        store: new SQLiteDataStore({ dbPath: path.resolve(process.cwd(), 'data/cubio_studio.db') }),
      });
      testEngine.restoreCheckpoint('data/checkpoints/phase30/non_existent_file.3dmemory', 'root');
    } catch (err: any) {
      missingCaught = true;
      missingMsg = err.message || err.name;
    }
    results.push({
      probeName: 'NON_EXISTENT_FILE_REJECTION',
      description: 'Attempted restoration of non-existent checkpoint path fails closed',
      exceptionCaught: missingCaught,
      errorCodeOrMessage: missingMsg,
      failClosedVerified: missingCaught,
    });

    return results;
  }

  /**
   * 6. Production Checkpoint Custody Confirmation
   */
  public verifyProductionCheckpointCustody(): ProductionCheckpointCustodyRecord {
    const prodPath = path.resolve(process.cwd(), PRODUCTION_CHECKPOINT_PATH);
    if (!fs.existsSync(prodPath)) {
      throw new Error(`[PRODUCTION_CHECKPOINT_MISSING] Sealed Phase 16 checkpoint missing at ${prodPath}`);
    }

    const prodBytes = fs.readFileSync(prodPath);
    const prodHash = crypto.createHash('sha256').update(prodBytes).digest('hex');

    const isBitExact = prodHash === PRODUCTION_CHECKPOINT_EXPECTED_HASH;

    return {
      productionFilePath: PRODUCTION_CHECKPOINT_PATH,
      expectedSha256: PRODUCTION_CHECKPOINT_EXPECTED_HASH,
      actualSha256: prodHash,
      isBitExactPristine: isBitExact,
      isOverwritingPrevented: isBitExact,
    };
  }

  /**
   * Runs the complete forensic validation audit.
   */
  public async runFullForensicValidation(): Promise<CandidateCheckpointValidationReport> {
    ExternalModelGuard.assertNativeOnly('PHASE30_MOTHER_CORE_CHECKPOINT_VALIDATOR');

    if (!IS_ACTUATION_BLOCKED) {
      throw new Error('[SECURITY_LOCKOUT] IS_ACTUATION_BLOCKED is false');
    }
    if (!OFFLINE_ISOLATED) {
      throw new Error('[SECURITY_LOCKOUT] OFFLINE_ISOLATED is false');
    }

    const containerForensics = this.inspectContainer(CANDIDATE_CHECKPOINT_PATH);
    const parameterForensics = this.inspectParameters(CANDIDATE_CHECKPOINT_PATH);
    const recordIntegrity = this.inspectRecordIntegrity(CANDIDATE_CHECKPOINT_PATH);
    const roundTripParity = await this.verifyRoundTripParity(CANDIDATE_CHECKPOINT_PATH);
    const corruptionRejectionProbes = this.executeCorruptionRejectionProbes(CANDIDATE_CHECKPOINT_PATH);
    const productionCustody = this.verifyProductionCheckpointCustody();

    const allRecordsValid = recordIntegrity.every((r) => r.isChecksumValid);
    const allProbesPassed = corruptionRejectionProbes.every((p) => p.failClosedVerified);

    const isCertified =
      containerForensics.isFormatValid &&
      parameterForensics.architectureVerified &&
      allRecordsValid &&
      roundTripParity.isBitExactIdentical &&
      allProbesPassed &&
      productionCustody.isBitExactPristine;

    return {
      trackId: P30_VALIDATOR_TRACK_ID,
      experimentId: P30_VALIDATOR_EXPERIMENT_ID,
      timestamp: new Date().toISOString(),
      candidateCheckpointPath: CANDIDATE_CHECKPOINT_PATH,
      containerForensics,
      parameterForensics,
      recordIntegrity: Object.freeze(recordIntegrity),
      roundTripParity,
      corruptionRejectionProbes: Object.freeze(corruptionRejectionProbes),
      productionCustody,
      validationDecision: isCertified ? 'VALIDATED_AND_CERTIFIED' : 'REJECTED',
    };
  }
}
