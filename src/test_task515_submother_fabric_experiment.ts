/**
 * ============================================================================
 * CUBiO AI — PHASE 31 TASK 515 TEST SUITE
 * src/test_task515_submother_fabric_experiment.ts
 * ============================================================================
 *
 * Final controlled empirical experiment test suite for Phase 31 Submother Fabric:
 *   1. End-to-end evaluation of 5 complex multi-Submother workflows:
 *      - WF-01: Specialized Reasoning Deduction
 *      - WF-02: Multi-Submother Coordinated Pipeline (Reasoning + Coding + Math)
 *      - WF-03: Parallel Possibility Exploration (1 → ∞ → 1 Fan-Out)
 *      - WF-04: Conflicting-Result Resolution & Grounding
 *      - WF-05: Multilingual & Intent Alignment (Language Submother)
 *   2. Strict verification of Mother Core final authority across all workflows.
 *   3. Separation of MEASURED FACTS, DERIVED METRICS, and BOUNDED HYPOTHESES.
 *   4. Strict compliance: Zero claims of AGI, consciousness, or unlimited intelligence.
 *   5. Bit-exact determinism across repeated experiment runs (0 drift).
 *   6. Pre/Post sovereign asset custody checks & permanent safety invariants.
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
  Phase31SubmotherFabricExperimentEngine,
  EXPERIMENT_ENGINE_ID,
  EXPERIMENT_ENGINE_VERSION,
} from './cubio/submother/phase31SubmotherFabricExperimentEngine';
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
  console.log('RUNNING TASK 515 TEST SUITE: SUBMOTHER FABRIC INTELLIGENCE EXPERIMENT');
  console.log('================================================================');

  // Pre-Execution Sovereign Verification
  verifySovereignAssets('PRE-EXEC');

  // Test 1: Invariants
  assert(IS_ACTUATION_BLOCKED === true, 'TEST 1: Actuation Blocked', 'IS_ACTUATION_BLOCKED must be true');
  assert(OFFLINE_ISOLATED === true, 'TEST 1: Offline Isolated', 'OFFLINE_ISOLATED must be true');

  // Test 2: Singleton Lifecycle & Engine Properties
  Phase31SubmotherFabricExperimentEngine.resetInstance();
  const engine1 = Phase31SubmotherFabricExperimentEngine.getInstance();
  const engine2 = Phase31SubmotherFabricExperimentEngine.getInstance();
  assert(engine1 === engine2, 'TEST 2: Singleton Instance Consistency', 'Must return identical singleton instance');
  assert(EXPERIMENT_ENGINE_ID === 'CUBIO_SUBMOTHER_FABRIC_EXPERIMENT_ENGINE', 'TEST 2: Engine ID Correct');
  assert(EXPERIMENT_ENGINE_VERSION === '31.515.0', 'TEST 2: Engine Version Correct');

  // Test 3: Run Full Empirical Experiment
  console.log('Executing Phase 31 Submother Fabric Experiment across 5 complex workflows...');
  const report1 = await engine1.runExperiment('tenant_exp_001');

  assert(report1.totalWorkflowsTested === 5, 'TEST 3: Tested all 5 complex workflows');
  assert(report1.motherCoreModelId === CUBIO_NATIVE_MODEL_ID, 'TEST 3: Mother Core model ID bound');
  assert(report1.nativeParameters === TOTAL_NATIVE_PARAMETERS, 'TEST 3: Native parameter count matches', `${TOTAL_NATIVE_PARAMETERS}`);
  assert(report1.nonTrainableInvariantEnforced === true, 'TEST 3: Non-trainable invariant enforced');
  assert(report1.aggregateExperimentDigest.length === 64, 'TEST 3: Aggregate SHA256 digest valid');

  // Test 4: Individual Workflow Trials Verification
  for (const trial of report1.workflowTrials) {
    assert(trial.workflowId.startsWith('WF-'), `TEST 4: Workflow ${trial.workflowId} ID valid`);
    assert(trial.confidenceScore >= 0.80, `TEST 4: Workflow ${trial.workflowId} confidence >= 0.80`, `${trial.confidenceScore}`);
    assert(trial.evaluationDecision === 'ACCEPT_SINGLE' || trial.evaluationDecision === 'SYNTHESIZE_COMPOSITE', `TEST 4: Workflow ${trial.workflowId} certified decision`);
    assert(trial.trialDigest.length === 64, `TEST 4: Workflow ${trial.workflowId} trial digest valid`);
    assert(trial.determinismVerified === true, `TEST 4: Workflow ${trial.workflowId} determinism verified`);
  }

  // Test 5: Tri-Partite Epistemic Separation
  const ep = report1.epistemics;
  assert(ep.measuredFacts.length >= 5, 'TEST 5: Measured facts present', `Count: ${ep.measuredFacts.length}`);
  assert(ep.derivedMetrics.meanWorkflowLatencyMs !== undefined, 'TEST 5: Derived latency metric present');
  assert(ep.derivedMetrics.decisionAuthorityRetainedByMotherCore === true, 'TEST 5: Decision authority retained by Mother Core');
  assert(ep.boundedHypotheses.length >= 2, 'TEST 5: Bounded hypotheses separated cleanly');

  // Test 6: Non-Claim Boundary Declaration
  const reportStr = JSON.stringify(report1).toLowerCase();
  assert(!reportStr.includes('artificial general intelligence') && !reportStr.includes('agi'), 'TEST 6: Zero AGI claims');
  assert(!reportStr.includes('consciousness') && !reportStr.includes('sentien'), 'TEST 6: Zero consciousness claims');
  assert(!reportStr.includes('unlimited') && !reportStr.includes('infinite'), 'TEST 6: Zero unlimited intelligence claims');

  // Test 7: Repeat Execution Parity
  console.log('Executing repeat experiment run to verify bit-exact determinism...');
  const report2 = await engine1.runExperiment('tenant_exp_001');
  assert(report1.workflowTrials[0].trialDigest === report2.workflowTrials[0].trialDigest, 'TEST 7: WF-01 digest matches across runs (0 drift)');
  assert(report1.workflowTrials[1].trialDigest === report2.workflowTrials[1].trialDigest, 'TEST 7: WF-02 digest matches across runs (0 drift)');
  assert(report1.workflowTrials[2].trialDigest === report2.workflowTrials[2].trialDigest, 'TEST 7: WF-03 digest matches across runs (0 drift)');

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
