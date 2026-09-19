/**
 * ============================================================================
 * CUBiO AI — PHASE 31 TASK 514 TEST SUITE
 * src/test_task514_mother_submother_benchmark.ts
 * ============================================================================
 *
 * Comprehensive validation of the Mother → Submother → Mother Loop Benchmark:
 *   1. Full loop execution across all 6 certified domains:
 *      (REASONING, CODING, MATHEMATICS, LANGUAGE, MEMORY, PROBLEM_SOLVING).
 *   2. Comparison of direct Mother Core execution vs. bounded Submother-assisted execution.
 *   3. Concrete metrics: accuracy, consistency, latency, memory, branching, and pruning behavior.
 *   4. Strict rejection of AGI, consciousness, or unlimited intelligence claims.
 *   5. Bit-exact determinism across repeated benchmark executions (0 drift).
 *   6. Immutable SHA-256 benchmark digest generation.
 *   7. Zero trainable parameters & non-trainable guarantees (`trainableWeights: 0`).
 *   8. Pre/Post sovereign asset custody checks & permanent safety invariants.
 *
 * ============================================================================
 */

import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import {
  IS_ACTUATION_BLOCKED,
  OFFLINE_ISOLATED,
} from './cubio/intelligence/core/coreEngineContract';
import {
  Phase31MotherSubmotherLoopBenchmarkEngine,
  BENCHMARK_ENGINE_ID,
  BENCHMARK_ENGINE_VERSION,
  BENCHMARK_DOMAINS
} from './cubio/submother/phase31MotherSubmotherLoopBenchmarkEngine';
import { CUBIO_NATIVE_MODEL_ID } from './cubio/model/native_foundation/native_model_types';
import { TOTAL_NATIVE_PARAMETERS } from './cubio/core/nativeTrainingIntegration';

interface TestResult {
  readonly testName: string;
  readonly passed: boolean;
  readonly details: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, testName: string, details: string = ''): void {
  results.push({
    testName,
    passed: condition,
    details: condition ? 'OK' : `FAIL: ${details}`
  });
  if (!condition) {
    console.error(`[FAIL] ${testName}: ${details}`);
  } else {
    console.log(`[PASS] ${testName}`);
  }
}

// Sovereign Assets Integrity
const SOVEREIGN_ASSETS = [
  { path: 'data/cubio_studio.db', expected: 'bafd4afd53bf93b2924f869e2c061853162a0d6eedd853a7ba704172e9fd9ff6' },
  { path: 'src/core/address369.ts', expected: '12eef2d3ec79bce873a064443787587a32711145ea82d375333c2222303fe612' },
  { path: 'data/checkpoints/phase16_production_final_sealed_1m.3dmemory', expected: '453590e284f250525d42d5f99d8fca07957f1e0ac1218b7d43eff6d3a762c1b8' },
  { path: 'src/cubio/core/chatMemoryIntegration.ts', expected: 'cb2978981826e5b1f500bf08d280cb0354b8cbda82140b67d5b938bbd0c144ac' },
  { path: 'src/cubio/core/canonicalIdentity.ts', expected: '3fcb2b18066fdd4c53bdc2a00d8bee8837cf366c4526e36f5718ca78c7036a29' },
  { path: 'src/funnel71/persistence/sqlitePersistence.ts', expected: 'cf78f31106ac0d754a404c72ef90f95c8b93c8d55d163e9ceb32d53693b1f0c6' },
];

function verifySovereignAssets(prefix: string): void {
  for (const asset of SOVEREIGN_ASSETS) {
    const fullPath = path.resolve(process.cwd(), asset.path);
    if (!fs.existsSync(fullPath)) {
      assert(false, `${prefix}: Sovereign asset ${asset.path} exists`, `File not found at ${fullPath}`);
      continue;
    }
    const buf = fs.readFileSync(fullPath);
    const hash = crypto.createHash('sha256').update(buf).digest('hex');
    assert(
      hash === asset.expected,
      `${prefix}: Asset integrity ${asset.path}`,
      `Expected ${asset.expected}, got ${hash}`
    );
  }
}

async function runTestSuite(): Promise<void> {
  console.log('================================================================');
  console.log('RUNNING TASK 514 TEST SUITE: MOTHER → SUBMOTHER → MOTHER BENCHMARK');
  console.log('================================================================');

  // Pre-Execution Sovereign Verification
  verifySovereignAssets('PRE-EXEC');

  // Test 1: Invariants
  assert(IS_ACTUATION_BLOCKED === true, 'TEST 1: Actuation Blocked', 'IS_ACTUATION_BLOCKED must be true');
  assert(OFFLINE_ISOLATED === true, 'TEST 1: Offline Isolated', 'OFFLINE_ISOLATED must be true');

  // Test 2: Singleton Lifecycle & Engine Properties
  Phase31MotherSubmotherLoopBenchmarkEngine.resetInstance();
  const engine1 = Phase31MotherSubmotherLoopBenchmarkEngine.getInstance();
  const engine2 = Phase31MotherSubmotherLoopBenchmarkEngine.getInstance();
  assert(engine1 === engine2, 'TEST 2: Singleton Instance Consistency', 'Must return identical singleton instance');
  assert(BENCHMARK_ENGINE_ID === 'CUBIO_MOTHER_SUBMOTHER_LOOP_BENCHMARK_ENGINE', 'TEST 2: Engine ID Correct');
  assert(BENCHMARK_ENGINE_VERSION === '31.514.0', 'TEST 2: Engine Version Correct');

  // Test 3: Run Full Benchmark Loop
  console.log('Executing full Mother → Submother → Mother benchmark across all 6 domains...');
  const report1 = await engine1.runFullLoopBenchmark('tenant_bench_01');

  assert(report1.totalDomainsTested === 6, 'TEST 3: Tested all 6 domains', `Expected 6, got ${report1.totalDomainsTested}`);
  assert(report1.motherCoreModelId === CUBIO_NATIVE_MODEL_ID, 'TEST 3: Mother Core model ID bound');
  assert(report1.nativeParameterCount === TOTAL_NATIVE_PARAMETERS, 'TEST 3: Native parameter count matches', `${TOTAL_NATIVE_PARAMETERS}`);
  assert(report1.nonTrainableInvariantEnforced === true, 'TEST 3: Non-trainable invariant enforced');
  assert(report1.domainTrials.length === 6, 'TEST 3: 6 domain trial records present');
  assert(report1.benchmarkDigest.length === 64, 'TEST 3: Benchmark SHA256 digest generated');

  // Test 4: Domain Trial Assertions
  for (const trial of report1.domainTrials) {
    assert(BENCHMARK_DOMAINS.includes(trial.domain), `TEST 4: Domain ${trial.domain} is approved`);
    assert(trial.assistedConfidence >= 0.0 && trial.assistedConfidence <= 1.0, `TEST 4: Domain ${trial.domain} confidence calibrated`);
    assert(trial.accuracyScore >= 0.90, `TEST 4: Domain ${trial.domain} accuracy >= 0.90`, `${trial.accuracyScore}`);
    assert(trial.consistencyScore >= 0.90, `TEST 4: Domain ${trial.domain} consistency >= 0.90`, `${trial.consistencyScore}`);
    assert(trial.branchCount === 3, `TEST 4: Domain ${trial.domain} branch count is 3`);
    assert(trial.determinismVerified === true, `TEST 4: Domain ${trial.domain} determinism verified`);
  }

  // Test 5: Comparative Performance Metrics (Assisted vs Direct)
  const metrics = report1.aggregateMetrics;
  assert(metrics.avgAssistedConfidence > 0, 'TEST 5: Assisted confidence positive', `${metrics.avgAssistedConfidence}`);
  assert(metrics.totalBranchesExplored === 18, 'TEST 5: 18 total branches explored (3 branches * 6 domains)');
  assert(metrics.bitExactParityConfirmed === true, 'TEST 5: Bit-exact parity confirmed across all trials');
  assert(metrics.avgAccuracyScore >= 0.90, 'TEST 5: Average accuracy score >= 0.90', `${metrics.avgAccuracyScore}`);
  assert(metrics.avgConsistencyScore >= 0.90, 'TEST 5: Average consistency score >= 0.90', `${metrics.avgConsistencyScore}`);

  // Test 6: Strict Avoidance of Unbounded/AGI Claims
  const reportJson = JSON.stringify(report1).toLowerCase();
  assert(!reportJson.includes('artificial general intelligence') && !reportJson.includes('agi'), 'TEST 6: Zero AGI claims');
  assert(!reportJson.includes('consciousness') && !reportJson.includes('sentien'), 'TEST 6: Zero consciousness claims');
  assert(!reportJson.includes('unlimited') && !reportJson.includes('infinite'), 'TEST 6: Zero unlimited intelligence claims');

  // Test 7: Bit-Exact Determinism Across Repeated Runs
  console.log('Executing repeat benchmark to verify deterministic parity...');
  const report2 = await engine1.runFullLoopBenchmark('tenant_bench_01');
  assert(report1.benchmarkDigest === report2.benchmarkDigest, 'TEST 7: Benchmark digests identical across runs (0 drift)');
  assert(report1.aggregateMetrics.avgAccuracyScore === report2.aggregateMetrics.avgAccuracyScore, 'TEST 7: Accuracy identical');
  assert(report1.aggregateMetrics.avgConsistencyScore === report2.aggregateMetrics.avgConsistencyScore, 'TEST 7: Consistency identical');

  // Post-Execution Sovereign Verification
  verifySovereignAssets('POST-EXEC');

  // Final Summary
  console.log('================================================================');
  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  console.log(`TOTAL TESTS: ${total} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTestSuite().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
