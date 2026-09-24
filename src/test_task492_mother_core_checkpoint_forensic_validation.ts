/**
 * ============================================================================
 * CUBiO AI — PHASE 30 TASK 492 TEST SUITE: CANDIDATE CHECKPOINT FORENSICS
 * src/test_task492_mother_core_checkpoint_forensic_validation.ts
 * ============================================================================
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

import {
  Phase30MotherCoreCheckpointValidator,
  P30_VALIDATOR_TRACK_ID,
  P30_VALIDATOR_EXPERIMENT_ID,
  CANDIDATE_CHECKPOINT_PATH,
  PRODUCTION_CHECKPOINT_PATH,
  PRODUCTION_CHECKPOINT_EXPECTED_HASH,
} from './cubio/benchmark/phase30MotherCoreCheckpointValidator';
import {
  IS_ACTUATION_BLOCKED,
  OFFLINE_ISOLATED,
} from './cubio/intelligence/core/coreEngineContract';

const SOVEREIGN_ASSETS = [
  { path: 'data/cubio_studio.db', expected: 'bafd4afd53bf93b2924f869e2c061853162a0d6eedd853a7ba704172e9fd9ff6' },
  { path: 'src/core/address369.ts', expected: '12eef2d3ec79bce873a064443787587a32711145ea82d375333c2222303fe612' },
  { path: 'data/checkpoints/phase16_production_final_sealed_1m.3dmemory', expected: '453590e284f250525d42d5f99d8fca07957f1e0ac1218b7d43eff6d3a762c1b8' },
  { path: 'src/cubio/core/chatMemoryIntegration.ts', expected: 'cb2978981826e5b1f500bf08d280cb0354b8cbda82140b67d5b938bbd0c144ac' },
  { path: 'src/cubio/core/canonicalIdentity.ts', expected: '3fcb2b18066fdd4c53bdc2a00d8bee8837cf366c4526e36f5718ca78c7036a29' },
  { path: 'src/funnel71/persistence/sqlitePersistence.ts', expected: 'cf78f31106ac0d754a404c72ef90f95c8b93c8d55d163e9ceb32d53693b1f0c6' },
];

function verifySovereignCustody(label: string): void {
  for (const asset of SOVEREIGN_ASSETS) {
    const fullPath = path.resolve(process.cwd(), asset.path);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`[CUSTODY_BREACH] ${label}: Missing file ${asset.path}`);
    }
    const buf = fs.readFileSync(fullPath);
    const hash = crypto.createHash('sha256').update(buf).digest('hex');
    if (hash !== asset.expected) {
      throw new Error(
        `[CUSTODY_BREACH] ${label}: Hash mismatch on ${asset.path}!\nExpected: ${asset.expected}\nActual:   ${hash}`
      );
    }
  }
}

async function runTask492Tests() {
  console.log('================================================================');
  console.log('CUBiO AI — PHASE 30 TASK 492: CANDIDATE CHECKPOINT FORENSIC TEST');
  console.log('================================================================');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  // 1. Pre-test Sovereign Custody verification
  verifySovereignCustody('PRE-TEST');
  assert(true, 'Baseline 6 sovereign assets match immutable SHA-256 digests');

  assert(IS_ACTUATION_BLOCKED === true, 'IS_ACTUATION_BLOCKED === true permanently');
  assert(OFFLINE_ISOLATED === true, 'OFFLINE_ISOLATED === true permanently');

  const validator = Phase30MotherCoreCheckpointValidator.getInstance();
  assert(validator !== null, 'Phase30MotherCoreCheckpointValidator singleton initialized');

  // 2. Execute Full Forensic Validation
  console.log('\n--- Executing Full Forensic Validation Audit on Candidate Checkpoint ---');
  const report = await validator.runFullForensicValidation();

  assert(report.trackId === P30_VALIDATOR_TRACK_ID, 'Report trackId matches P30_VALIDATOR_TRACK_ID');
  assert(report.experimentId === P30_VALIDATOR_EXPERIMENT_ID, 'Report experimentId matches P30_VALIDATOR_EXPERIMENT_ID');
  assert(report.candidateCheckpointPath === CANDIDATE_CHECKPOINT_PATH, 'Candidate path verified');

  // 3. Container & Header Format Assertions
  console.log('\n--- Container & Header Forensics ---');
  console.log(`  Container Magic:     ${report.containerForensics.magic}`);
  console.log(`  Format:              ${report.containerForensics.format}`);
  console.log(`  Version:             ${report.containerForensics.version}`);
  console.log(`  Checkpoint ID:       ${report.containerForensics.checkpointId}`);
  console.log(`  Tenant ID:           ${report.containerForensics.tenantId}`);
  console.log(`  Entry Count:         ${report.containerForensics.entryCount}`);
  console.log(`  File Size:           ${(report.containerForensics.totalFileBytes / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`  File SHA-256:        ${report.containerForensics.fileSha256Digest}`);

  assert(report.containerForensics.magic === '3DMEMORY_CHECKPOINT_V3', 'Header magic is 3DMEMORY_CHECKPOINT_V3');
  assert(report.containerForensics.version === 3, 'Container format version is 3');
  assert(report.containerForensics.tenantId === 'root', 'Tenant ID is root');
  assert(report.containerForensics.entryCount >= 3, 'Entry count >= 3');
  assert(report.containerForensics.totalFileBytes > 2500000, 'Candidate file size > 2.5 MB');
  assert(report.containerForensics.fileSha256Digest.length === 64, 'Candidate SHA-256 digest is valid 64-char hex');
  assert(report.containerForensics.isFormatValid === true, 'Container binary format verified');

  // 4. Parameter Accounting & Architecture Integrity
  console.log('\n--- Parameter Accounting & Architecture Integrity ---');
  console.log(`  Total Parameters:    ${report.parameterForensics.totalParameters}`);
  console.log(`  Trainable Params:    ${report.parameterForensics.trainableParameters}`);
  console.log(`  Non-Trainable:       ${report.parameterForensics.nonTrainableParameters}`);
  console.log(`  Tensor Count:        ${report.parameterForensics.tensorCount}`);

  assert(report.parameterForensics.totalParameters === 219264, 'Total parameters equals exactly 219,264');
  assert(report.parameterForensics.trainableParameters === 219264, 'Trainable parameters equals 219,264');
  assert(report.parameterForensics.nonTrainableParameters === 0, 'Zero non-trainable parameters');
  assert(report.parameterForensics.tensorCount === 37, 'Tensor count equals exactly 37');
  assert(report.parameterForensics.tensorInventoryMatches === true, 'Sum of tensor dimensions equals total parameters');
  assert(report.parameterForensics.architectureVerified === true, 'Architecture verified fail-closed');

  // 5. Record Checksums Integrity
  console.log('\n--- Record-Level Checksum Integrity ---');
  report.recordIntegrity.forEach((r) => {
    console.log(`  [Record ${r.objectId}]: Checksum=${r.checksumInHeader} -> Valid=${r.isChecksumValid}`);
    assert(r.isChecksumValid === true, `Record ${r.objectId} canonical checksum verified`);
  });

  // 6. Save -> Restore -> Inference Parity Gate
  console.log('\n--- Save -> Restore -> Inference Parity Gate ---');
  console.log(`  Initial Inference Loss:      ${report.roundTripParity.initialLoss}`);
  console.log(`  Round-Trip Inference Loss:   ${report.roundTripParity.roundTripLoss}`);
  console.log(`  Loss Parity Delta:           ${report.roundTripParity.lossParityDelta}`);
  console.log(`  Initial State Hash:          ${report.roundTripParity.initialWeightsStateHash}`);
  console.log(`  Round-Trip State Hash:       ${report.roundTripParity.roundTripWeightsStateHash}`);
  console.log(`  Bit-Exact Identical:         ${report.roundTripParity.isBitExactIdentical}`);

  assert(report.roundTripParity.initialLoss === report.roundTripParity.roundTripLoss, 'Inference loss matches bit-exact');
  assert(report.roundTripParity.lossParityDelta === 0, 'Loss parity delta equals 0.000000');
  assert(report.roundTripParity.initialWeightsStateHash === report.roundTripParity.roundTripWeightsStateHash, 'State hashes match bit-exact');
  assert(report.roundTripParity.isBitExactIdentical === true, 'Round-trip save->restore->inference parity verified');

  // 7. Corruption & Incompatibility Rejection Probes
  console.log('\n--- Corruption & Incompatibility Rejection Probes ---');
  report.corruptionRejectionProbes.forEach((p) => {
    console.log(`  [${p.probeName}]: ${p.description}`);
    console.log(`    Caught: ${p.exceptionCaught} (${p.errorCodeOrMessage})`);
    assert(p.failClosedVerified === true, `Probe [${p.probeName}] rejected fail-closed`);
  });

  // 8. Protected Production Checkpoint Custody Confirmation
  console.log('\n--- Protected Production Checkpoint Custody ---');
  console.log(`  Production Checkpoint:       ${report.productionCustody.productionFilePath}`);
  console.log(`  Expected SHA-256:            ${report.productionCustody.expectedSha256}`);
  console.log(`  Actual SHA-256:              ${report.productionCustody.actualSha256}`);
  console.log(`  Production Untouched:        ${report.productionCustody.isBitExactPristine}`);

  assert(report.productionCustody.isBitExactPristine === true, 'Phase 16 production checkpoint untouched with 0 bit drift');
  assert(report.productionCustody.isOverwritingPrevented === true, 'Production checkpoint protected from unauthorized promotion');
  assert(report.validationDecision === 'VALIDATED_AND_CERTIFIED', 'Candidate checkpoint validated and certified successfully');

  // 9. Post-test Sovereign Custody verification
  verifySovereignCustody('POST-TEST');
  assert(true, 'Post-experiment 6 sovereign assets match immutable SHA-256 digests (0 bit drift)');

  console.log('================================================================');
  console.log(`TASK 492 VALIDATION RESULT: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTask492Tests().catch((err) => {
  console.error('Fatal Error in Task 492 tests:', err);
  process.exit(1);
});
