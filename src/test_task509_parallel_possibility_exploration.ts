/**
 * ============================================================================
 * CUBiO AI — PHASE 31 TASK 509 TEST SUITE
 * src/test_task509_parallel_possibility_exploration.ts
 * ============================================================================
 *
 * Comprehensive validation of Parallel Possibility Exploration Engine:
 *   1. Singleton pattern and initialization guards.
 *   2. Strict branch bounding (max 8 concurrent branches; rejects > 8).
 *   3. Rejection of duplicate or invalid branch indices.
 *   4. Bounded parallel exploration across multiple strategies & domains.
 *   5. Deterministic derivation and candidate reproducibility under identical inputs.
 *   6. Branch pruning verification (threshold enforcement & reasoning).
 *   7. Failure isolation (branch failure or timeout does not abort sibling branches).
 *   8. Absolute deference of final authoritative choice to Mother Core (no autonomous authority).
 *   9. Zero trainable parameters & non-trainability invariants across all branches.
 *  10. Pre/Post sovereign custody checks & permanent invariants (actuation blocked, offline isolated).
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
  Phase31ParallelPossibilityExplorationEngine,
  POSSIBILITY_EXPLORATION_ENGINE_ID,
  POSSIBILITY_EXPLORATION_ENGINE_VERSION,
  MAX_POSSIBILITY_BRANCHES,
  ExplorationTaskRequest,
  ExplorationBranchSpec
} from './cubio/submother/phase31ParallelPossibilityExplorationEngine';
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
  console.log('RUNNING TASK 509 TEST SUITE: PARALLEL POSSIBILITY EXPLORATION');
  console.log('================================================================');

  // Pre-Execution Sovereign Verification
  verifySovereignAssets('PRE-EXEC');

  // Test 1: Invariant Verification
  assert(IS_ACTUATION_BLOCKED === true, 'TEST 1: Actuation Blocked', 'IS_ACTUATION_BLOCKED must be true');
  assert(OFFLINE_ISOLATED === true, 'TEST 1: Offline Isolated', 'OFFLINE_ISOLATED must be true');

  // Test 2: Singleton Lifecycle & Engine Properties
  Phase31ParallelPossibilityExplorationEngine.resetInstance();
  const engine1 = Phase31ParallelPossibilityExplorationEngine.getInstance();
  const engine2 = Phase31ParallelPossibilityExplorationEngine.getInstance();
  assert(engine1 === engine2, 'TEST 2: Singleton Instance Consistency', 'Must return identical singleton instance');
  assert(POSSIBILITY_EXPLORATION_ENGINE_ID === 'CUBIO_PARALLEL_POSSIBILITY_EXPLORATION_ENGINE', 'TEST 2: Engine ID Correct');
  assert(POSSIBILITY_EXPLORATION_ENGINE_VERSION === '31.509.0', 'TEST 2: Engine Version Correct');

  // Test 3: Input Validation (Empty branches rejected)
  try {
    await engine1.explorePossibilities({
      tenantId: 'tenant_alpha',
      parentRequestId: 'req_001',
      taskContext: 'Optimizing search index',
      branchSpecs: []
    });
    assert(false, 'TEST 3: Empty branches rejection', 'Should have failed on empty branch specs');
  } catch (err: any) {
    assert(err.message.includes('cannot be empty'), 'TEST 3: Empty branches rejection', err.message);
  }

  // Test 4: Branch Ceiling Enforcement (max 8)
  const excessiveBranches: ExplorationBranchSpec[] = Array.from({ length: 9 }, (_, i) => ({
    branchIndex: i,
    domain: 'SYSTEMS',
    strategy: 'DIVERGENT_HYPOTHESIS',
    hypothesisAngle: `Angle ${i}`
  }));

  try {
    await engine1.explorePossibilities({
      tenantId: 'tenant_alpha',
      parentRequestId: 'req_002',
      taskContext: 'Large scale indexing',
      branchSpecs: excessiveBranches
    });
    assert(false, 'TEST 4: Excessive branches rejection', 'Should reject > 8 branches');
  } catch (err: any) {
    assert(err.message.includes('exceeds ceiling of 8'), 'TEST 4: Excessive branches rejection', err.message);
  }

  // Test 5: Duplicate Branch Index Rejection
  try {
    await engine1.explorePossibilities({
      tenantId: 'tenant_alpha',
      parentRequestId: 'req_003',
      taskContext: 'Testing duplicate indices',
      branchSpecs: [
        { branchIndex: 1, domain: 'CODE', strategy: 'ALTERNATIVE_ALGORITHM', hypothesisAngle: 'Iterative' },
        { branchIndex: 1, domain: 'CODE', strategy: 'ALTERNATIVE_ALGORITHM', hypothesisAngle: 'Recursive' }
      ]
    });
    assert(false, 'TEST 5: Duplicate branchIndex rejection', 'Should reject duplicate branchIndex');
  } catch (err: any) {
    assert(err.message.includes('Duplicate branchIndex'), 'TEST 5: Duplicate branchIndex rejection', err.message);
  }

  // Test 6: Bounded Parallel Exploration (5 diverse branches)
  const validSpecs: ExplorationBranchSpec[] = [
    { branchIndex: 0, domain: 'REASONING', strategy: 'DIVERGENT_HYPOTHESIS', hypothesisAngle: 'Top-down decomposition' },
    { branchIndex: 1, domain: 'CODING', strategy: 'ALTERNATIVE_ALGORITHM', hypothesisAngle: 'B-tree vs LSM tree tradeoff' },
    { branchIndex: 2, domain: 'MATHEMATICS', strategy: 'COUNTER_FACTUAL_PROBE', hypothesisAngle: 'Asymptotic worst-case boundary' },
    { branchIndex: 3, domain: 'LANGUAGE', strategy: 'EPISTEMIC_UNCERTAINTY', hypothesisAngle: 'Calibrated confidence margins' },
    { branchIndex: 4, domain: 'MEMORY', strategy: 'REPRESENTATION_SHIFT', hypothesisAngle: 'Dual vector & graph indexing' }
  ];

  const req6: ExplorationTaskRequest = {
    tenantId: 'tenant_cubio_prime',
    parentRequestId: 'req_explore_001',
    taskContext: 'High throughput distributed event cache architecture',
    branchSpecs: validSpecs,
    pruningConfidenceThreshold: 0.35
  };

  const res6 = await engine1.explorePossibilities(req6);
  assert(res6.totalBranchesRequested === 5, 'TEST 6: Total branches requested matches', `Expected 5, got ${res6.totalBranchesRequested}`);
  assert(res6.totalBranchesExecuted === 5, 'TEST 6: Total branches executed matches', `Expected 5, got ${res6.totalBranchesExecuted}`);
  assert(res6.motherCoreModelId === CUBIO_NATIVE_MODEL_ID, 'TEST 6: Mother Core model ID bound');
  assert(res6.motherCoreParameters === TOTAL_NATIVE_PARAMETERS, 'TEST 6: Native parameter count matches', `${TOTAL_NATIVE_PARAMETERS}`);
  assert(res6.nonTrainableInvariantEnforced === true, 'TEST 6: Non-trainable invariant enforced');
  assert(res6.authoritativeDecisionDeferredToMotherCore === true, 'TEST 6: Final authority strictly deferred to Mother Core');
  assert(res6.candidates.length === 5, 'TEST 6: Emitted 5 candidates');

  // Verify candidate properties
  for (const cand of res6.candidates) {
    assert(cand.candidateId.startsWith('cand_'), `TEST 6: Candidate ${cand.branchIndex} ID valid`, cand.candidateId);
    assert(cand.submotherId.length > 0, `TEST 6: Candidate ${cand.branchIndex} Submother ID present`);
    assert(cand.confidenceScore >= 0.0 && cand.confidenceScore <= 1.0, `TEST 6: Candidate ${cand.branchIndex} confidence calibrated`);
    assert(cand.provenanceDigest.length === 64, `TEST 6: Candidate ${cand.branchIndex} provenance digest valid SHA256`);
  }

  // Test 7: Deterministic Derivation & Reproducibility
  const res7 = await engine1.explorePossibilities(req6);
  assert(res6.executionDigest === res7.executionDigest, 'TEST 7: Execution digest matches deterministically across runs');
  assert(res6.candidates[0].candidateId === res7.candidates[0].candidateId, 'TEST 7: Candidate IDs identical across runs');
  assert(res6.candidates[0].confidenceScore === res7.candidates[0].confidenceScore, 'TEST 7: Confidence scores identical across runs');

  // Test 8: Pruning Policy Verification
  // Request with high pruning threshold (0.95) should prune most or all branches
  const highThresholdReq: ExplorationTaskRequest = {
    tenantId: 'tenant_cubio_prime',
    parentRequestId: 'req_prune_001',
    taskContext: 'Testing aggressive pruning threshold',
    branchSpecs: validSpecs.slice(0, 3),
    pruningConfidenceThreshold: 0.99 // nearly all should be pruned
  };
  const res8 = await engine1.explorePossibilities(highThresholdReq);
  assert(res8.prunedCandidatesCount > 0, 'TEST 8: Aggressive pruning marked candidates as pruned', `Pruned: ${res8.prunedCandidatesCount}`);
  const prunedCand = res8.candidates.find(c => c.isPruned);
  if (prunedCand) {
    assert(prunedCand.status === 'PRUNED', 'TEST 8: Pruned candidate has status PRUNED');
    assert(prunedCand.pruningReason !== undefined && prunedCand.pruningReason.includes('below threshold'), 'TEST 8: Pruning reason documented');
  }

  // Test 9: Failure Isolation Verification
  // If one branch encounters an invalid configuration or simulation issue, other branches complete cleanly
  // In our engine, invalid domain submother generation throws, but failure isolation catches it
  const mixedSpecs: ExplorationBranchSpec[] = [
    { branchIndex: 0, domain: 'CODING', strategy: 'ALTERNATIVE_ALGORITHM', hypothesisAngle: 'Valid QuickSort' },
    // An intentional branch that might trigger failure handling
    { branchIndex: 1, domain: 'INVALID_DOMAIN' as any, strategy: 'DIVERGENT_HYPOTHESIS', hypothesisAngle: 'Unsupported domain' },
    { branchIndex: 2, domain: 'REASONING', strategy: 'DIVERGENT_HYPOTHESIS', hypothesisAngle: 'Valid Inductive logic' }
  ];

  const res9 = await engine1.explorePossibilities({
    tenantId: 'tenant_fault_isolation',
    parentRequestId: 'req_fault_001',
    taskContext: 'Testing fault isolation across branches',
    branchSpecs: mixedSpecs
  });

  assert(res9.totalBranchesExecuted === 3, 'TEST 9: All 3 branches executed despite error in branch 1');
  const failedBranch = res9.candidates.find(c => c.branchIndex === 1);
  const validBranch0 = res9.candidates.find(c => c.branchIndex === 0);
  const validBranch2 = res9.candidates.find(c => c.branchIndex === 2);

  assert(failedBranch !== undefined && failedBranch.status === 'FAILED', 'TEST 9: Branch 1 captured as FAILED');
  assert(failedBranch?.pruningReason?.includes('Execution failure') === true, 'TEST 9: Failed branch recorded failure reason');
  assert(validBranch0 !== undefined && validBranch0.status === 'SUCCESS', 'TEST 9: Sibling Branch 0 succeeded cleanly');
  assert(validBranch2 !== undefined && validBranch2.status === 'SUCCESS', 'TEST 9: Sibling Branch 2 succeeded cleanly');

  // Test 10: Multi-Tenant Namespace Isolation
  const tenantA_Req: ExplorationTaskRequest = {
    tenantId: 'tenant_AAA',
    parentRequestId: 'req_multi_tenant',
    taskContext: 'Confidential corporate strategy',
    branchSpecs: [{ branchIndex: 0, domain: 'REASONING', strategy: 'DIVERGENT_HYPOTHESIS', hypothesisAngle: 'Internal market dynamics' }]
  };
  const tenantB_Req: ExplorationTaskRequest = {
    tenantId: 'tenant_BBB',
    parentRequestId: 'req_multi_tenant',
    taskContext: 'Confidential corporate strategy',
    branchSpecs: [{ branchIndex: 0, domain: 'REASONING', strategy: 'DIVERGENT_HYPOTHESIS', hypothesisAngle: 'Internal market dynamics' }]
  };

  const res10A = await engine1.explorePossibilities(tenantA_Req);
  const res10B = await engine1.explorePossibilities(tenantB_Req);

  assert(res10A.candidates[0].candidateId !== res10B.candidates[0].candidateId, 'TEST 10: Tenant candidate IDs isolated and unique');
  assert(res10A.executionDigest !== res10B.executionDigest, 'TEST 10: Tenant execution digests isolated and unique');

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
