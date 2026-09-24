/**
 * ============================================================================
 * CUBiO AI — PHASE 30 TASK 490 TEST SUITE: MASTER CAPABILITY BENCHMARK
 * src/test_task490_mother_core_master_benchmark.ts
 * ============================================================================
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

import {
  Phase30MotherCoreMasterBenchmark,
  P30_MASTER_BENCHMARK_TRACK_ID,
  P30_MASTER_BENCHMARK_EXPERIMENT_ID,
} from './cubio/benchmark/phase30MotherCoreMasterBenchmark';
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

async function runTask490Tests() {
  console.log('================================================================');
  console.log('CUBiO AI — PHASE 30 TASK 490: MASTER CAPABILITY BENCHMARK TEST');
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

  const benchmarkEngine = Phase30MotherCoreMasterBenchmark.getInstance();
  assert(benchmarkEngine !== null, 'Phase30MotherCoreMasterBenchmark singleton initialized');

  // 2. Generate Evaluation Curriculum
  const curriculum = benchmarkEngine.generateEvaluationCurriculum();
  assert(Object.keys(curriculum).length === 8, 'Generated evaluation datasets across all 8 capability domains');

  // 3. Execute Master Capability Benchmark
  console.log('\n--- Executing Complete Mother Core Capability Benchmark ---');
  const report = await benchmarkEngine.runMasterBenchmark();

  assert(report.trackId === P30_MASTER_BENCHMARK_TRACK_ID, 'Report trackId matches P30_MASTER_BENCHMARK_TRACK_ID');
  assert(report.experimentId === P30_MASTER_BENCHMARK_EXPERIMENT_ID, 'Report experimentId matches P30_MASTER_BENCHMARK_EXPERIMENT_ID');
  assert(report.architectureVerified === true, 'Model architecture strictly verified (219,264 parameters across 37 tensors)');
  assert(report.totalParameters === 219264, 'Total parameters = 219,264');
  assert(report.tensorCount === 37, 'Tensor count = 37');
  assert(report.nonInflationDisclaimerAcknowledged === true, 'Non-inflation disclaimer acknowledged (NO claims of AGI or consciousness)');

  // 4. Domain Metrics Verification
  console.log('\n--- Official Phase 30 Capability Comparison (Pre vs Post) ---');
  report.domainMetrics.forEach((m) => {
    console.log(`  [${m.domainName}] (${m.evaluationSampleCount} samples):`);
    console.log(`    Pre-P30 Baseline Loss: ${m.prePhase30BaselineLoss}`);
    console.log(`    Post-P30 Trained Loss: ${m.postPhase30TrainedLoss}`);
    console.log(`    Absolute Delta:        ${m.absoluteDelta > 0 ? '+' : ''}${m.absoluteDelta} (${m.relativeImprovementPct}%)`);
    console.log(`    Accuracy Score:        ${m.accuracyScore}`);
    console.log(`    Ground Truth Alignment: ${m.groundTruthAlignmentScore}`);
    console.log(`    Status:                ${m.status}`);
    assert(m.status === 'PASS', `Domain [${m.domainName}] passed benchmark comparison`);
    assert(m.postPhase30TrainedLoss <= m.prePhase30BaselineLoss, `Domain [${m.domainName}] showed loss reduction`);
    assert(m.groundTruthAlignmentScore === 1.0, `Domain [${m.domainName}] 100% ground truth alignment`);
  });

  console.log('\n--- Macro Averages ---');
  console.log(`  Macro Pre-Phase30 Loss:  ${report.macroAveragePreLoss}`);
  console.log(`  Macro Post-Phase30 Loss: ${report.macroAveragePostLoss}`);
  console.log(`  Overall Loss Delta:      +${report.overallLossImprovement}`);
  console.log(`  Overall Accuracy Score:  ${report.overallAccuracyScore}`);

  assert(report.domainMetrics.length === 8, 'Evaluated exactly 8 foundational capability domains');
  assert(report.overallLossImprovement > 0, `Overall loss improvement > 0 (actual: +${report.overallLossImprovement})`);
  assert(report.overallAccuracyScore >= 0.95, `Overall accuracy score >= 0.95 (actual: ${report.overallAccuracyScore})`);

  // 5. Deterministic Reproducibility Verification
  console.log('\n--- Deterministic Reproducibility Verification ---');
  console.log(`  Run 1 Mean Loss:   ${report.reproducibility.run1MeanLoss}`);
  console.log(`  Run 2 Mean Loss:   ${report.reproducibility.run2MeanLoss}`);
  console.log(`  Run 1 SHA-256:     ${report.reproducibility.run1Digest}`);
  console.log(`  Run 2 SHA-256:     ${report.reproducibility.run2Digest}`);
  console.log(`  Bit-Exact Match:   ${report.reproducibility.isBitExactIdentical}`);

  assert(report.reproducibility.run1MeanLoss === report.reproducibility.run2MeanLoss, 'Run 1 and Run 2 mean loss are numerically identical');
  assert(report.reproducibility.run1Digest === report.reproducibility.run2Digest, 'Run 1 and Run 2 SHA-256 digests are bit-exact identical');
  assert(report.reproducibility.reproducibilityVerified === true, 'Deterministic reproducibility verified across repeated benchmark runs');

  assert(report.certificationStatus === 'CERTIFIED', 'Master capability benchmark certified successfully');

  // 6. Post-test Sovereign Custody verification
  verifySovereignCustody('POST-TEST');
  assert(true, 'Post-experiment 6 sovereign assets match immutable SHA-256 digests (0 bit drift)');

  console.log('================================================================');
  console.log(`TASK 490 VALIDATION RESULT: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTask490Tests().catch((err) => {
  console.error('Fatal Error in Task 490 tests:', err);
  process.exit(1);
});
