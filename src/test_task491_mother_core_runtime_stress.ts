/**
 * ============================================================================
 * CUBiO AI — PHASE 30 TASK 491 TEST SUITE: MOTHER CORE RUNTIME STRESS BENCHMARK
 * src/test_task491_mother_core_runtime_stress.ts
 * ============================================================================
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

import {
  Phase30MotherCoreStressEngine,
  P30_STRESS_TRACK_ID,
  P30_STRESS_EXPERIMENT_ID,
  P30_CERTIFIED_CHECKPOINT_PATH,
} from './cubio/benchmark/phase30MotherCoreStressEngine';
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

async function runTask491Tests() {
  console.log('================================================================');
  console.log('CUBiO AI — PHASE 30 TASK 491: MOTHER CORE RUNTIME STRESS TEST');
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

  const stressEngine = Phase30MotherCoreStressEngine.getInstance();
  assert(stressEngine !== null, 'Phase30MotherCoreStressEngine singleton initialized');

  assert(fs.existsSync(path.resolve(process.cwd(), P30_CERTIFIED_CHECKPOINT_PATH)), 'Trained Phase 30 checkpoint exists and is verified');

  // 2. Execute Complete Stress Benchmark
  console.log('\n--- Executing Controlled Workload Scaling Tiers & Stress Telemetry ---');
  const report = await stressEngine.runCompleteStressTest();

  assert(report.trackId === P30_STRESS_TRACK_ID, 'Report trackId matches P30_STRESS_TRACK_ID');
  assert(report.experimentId === P30_STRESS_EXPERIMENT_ID, 'Report experimentId matches P30_STRESS_EXPERIMENT_ID');
  assert(report.totalParameters === 219264, 'Total parameters = 219,264');
  assert(report.tensorCount === 37, 'Tensor count = 37');

  // 3. Workload Tier Assertions
  console.log('\n--- Workload Scaling Tier Results ---');
  report.tierResults.forEach((t) => {
    console.log(`  [${t.tierName}] (Reqs=${t.requestCount}, Concurrency=${t.concurrencyLevel}):`);
    console.log(`    Duration:        ${t.totalDurationMs} ms`);
    console.log(`    Throughput:      ${t.throughputOpsPerSec} ops/sec`);
    console.log(`    Latencies (ms):  p50=${t.latencies.p50Ms}, p95=${t.latencies.p95Ms}, p99=${t.latencies.p99Ms}, max=${t.latencies.maxMs}`);
    console.log(`    Heap Delta:      ${(t.heapDeltaBytes / 1024).toFixed(2)} KB`);
    console.log(`    Success Rate:    ${t.successRate}%`);
    console.log(`    Status:          ${t.status}`);

    assert(t.status === 'PASS', `Tier [${t.tierName}] passed stress criteria`);
    assert(t.successRate === 100, `Tier [${t.tierName}] achieved 100% success rate`);
    assert(t.errorCount === 0, `Tier [${t.tierName}] zero runtime errors`);
    assert(t.latencies.p95Ms < 100, `Tier [${t.tierName}] p95 latency < 100 ms (actual: ${t.latencies.p95Ms} ms)`);
  });

  // 4. Concurrency Scaling Assertions
  console.log('\n--- Concurrency Scaling Results ---');
  report.concurrencyScaling.forEach((c) => {
    console.log(`  [Concurrency Level ${c.concurrencyLevel}]: Throughput=${c.throughputOpsPerSec} ops/sec, Mean=${c.meanLatencyMs} ms, p95=${c.p95LatencyMs} ms`);
    assert(c.deadlocksDetected === false, `Concurrency level ${c.concurrencyLevel}: zero deadlocks`);
    assert(c.lockContentionFree === true, `Concurrency level ${c.concurrencyLevel}: lock-contention free`);
    assert(c.throughputOpsPerSec > 50, `Concurrency level ${c.concurrencyLevel}: throughput > 50 ops/sec (actual: ${c.throughputOpsPerSec})`);
  });

  // 5. Memory Endurance & Leak Assertions
  console.log('\n--- Memory Endurance Telemetry (1,000 Cycles) ---');
  console.log(`  Cycles Run:     ${report.enduranceTelemetry.totalCycles}`);
  console.log(`  Initial Heap:   ${(report.enduranceTelemetry.initialHeapBytes / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`  Final Heap:     ${(report.enduranceTelemetry.finalHeapBytes / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`  Heap Growth:    ${(report.enduranceTelemetry.heapGrowthBytes / 1024).toFixed(2)} KB`);
  console.log(`  Growth Slope:   ${report.enduranceTelemetry.heapSlopeBytesPerCycle} bytes/cycle`);
  console.log(`  Leak-Free:      ${report.enduranceTelemetry.isLeakFree}`);

  assert(report.enduranceTelemetry.totalCycles === 1000, 'Completed exactly 1,000 sustained endurance cycles');
  assert(report.enduranceTelemetry.isLeakFree === true, 'Endurance run verified leak-free (growth slope bounded)');

  // 6. Determinism Assertions
  console.log('\n--- Deterministic Bit-Exact Invariance ---');
  console.log(`  Prompt:             ${report.determinismAudit.samplePrompt}`);
  console.log(`  Iterations:         ${report.determinismAudit.iterationsRun}`);
  console.log(`  Unique Digest Set:  ${report.determinismAudit.uniqueHashesObserved}`);
  console.log(`  Bit-Exact Match:    ${report.determinismAudit.isBitExactIdentical}`);
  console.log(`  Output SHA-256:     ${report.determinismAudit.outputDigest}`);

  assert(report.determinismAudit.uniqueHashesObserved === 1, 'Observed exactly 1 unique output hash across all iterations');
  assert(report.determinismAudit.isBitExactIdentical === true, '100% deterministic bit-exact output verified across repeated evaluations');

  // 7. Failure Recovery Probes
  console.log('\n--- Failure Recovery & Adversarial Fuzz Probes ---');
  report.failureRecoveryProbes.forEach((p) => {
    console.log(`  [${p.testCase}]: ${p.payloadDescription} -> Code: ${p.errorCode}, Graceful: ${p.gracefulRecovery}`);
    assert(p.gracefulRecovery === true, `Probe [${p.testCase}] recovered gracefully without crashing`);
    assert(p.coreIntegrityPreserved === true, `Probe [${p.testCase}] preserved core model integrity`);
  });

  assert(report.overallStatus === 'CERTIFIED', 'Mother Core runtime stress benchmark certified successfully');

  // 8. Post-test Sovereign Custody verification
  verifySovereignCustody('POST-TEST');
  assert(true, 'Post-experiment 6 sovereign assets match immutable SHA-256 digests (0 bit drift)');

  console.log('================================================================');
  console.log(`TASK 491 VALIDATION RESULT: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTask491Tests().catch((err) => {
  console.error('Fatal Error in Task 491 tests:', err);
  process.exit(1);
});
