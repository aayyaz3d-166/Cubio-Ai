/**
 * ============================================================================
 * CUBiO AI — PHASE 31 TASK 508: MULTI-SUBMOTHER COORDINATION TEST SUITE
 * src/test_task508_multi_submother_coordination_engine.ts
 * ============================================================================
 *
 * Forensic test suite for the Multi-Submother Coordination Engine.
 *
 * Sections:
 *   1. Pre-Test Sovereign Asset Custody Check
 *   2. Parallel Multi-Submother Coordinated Exploration & Parity Hash Parity
 *   3. Sequential Chained Multi-Submother Exploration Parity
 *   4. Zero Trainable Weights & Non-Trainable Invariant Enforcement
 *   5. Circular Delegation Trapping (Fail-Closed Cycle Detection)
 *   6. Concurrency Ceiling Enforcement (>8 Branches Blocked)
 *   7. Deduplication of Redundant Branch Tasks
 *   8. Deterministic Parity Hash Reproduction Across Runs
 *   9. Cryptographic Audit Ledger Parity & Mother Core Provenance
 *  10. Post-Test Sovereign Asset Custody Check
 *  11. Permanent Actuation & Air-Gap Invariants
 *
 * ============================================================================
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

import {
  IS_ACTUATION_BLOCKED,
  OFFLINE_ISOLATED,
} from './cubio/intelligence/core/coreEngineContract';
import {
  Phase31MultiSubmotherCoordinationEngine,
  COORDINATION_ENGINE_VERSION,
  COORDINATION_ENGINE_ID,
  MAX_COORDINATED_SUBMOTHERS,
  type SubmotherBranchPlan,
  type CoordinatedTaskRequest,
} from './cubio/submother/phase31MultiSubmotherCoordinationEngine';
import { SOVEREIGN_ASSETS } from './cubio/submother/phase31SubmotherFabricArchitectureFreeze';
import { PRODUCTION_CHECKPOINT_EXPECTED_HASH } from './cubio/benchmark/phase30MotherCoreCheckpointValidator';
import { TOTAL_NATIVE_PARAMETERS } from './cubio/core/nativeTrainingIntegration';
import { CUBIO_NATIVE_MODEL_ID } from './cubio/model/native_foundation/native_model_types';

const projectRoot = process.cwd();
let assertionCount = 0;
let passCount = 0;
let failCount = 0;

function computeSha256(relativePath: string): string {
  const fullPath = path.resolve(projectRoot, relativePath);
  if (!fs.existsSync(fullPath)) return 'FILE_NOT_FOUND';
  return crypto.createHash('sha256').update(fs.readFileSync(fullPath)).digest('hex');
}

function assert(condition: boolean, description: string): void {
  assertionCount++;
  if (condition) {
    passCount++;
    console.log(`  ✓ [ASSERTION ${assertionCount}] ${description}`);
  } else {
    failCount++;
    console.log(`❌ [ASSERTION ${assertionCount} FAILED] ${description}`);
  }
}

async function runCoordinationEngineTestSuite(): Promise<void> {
  console.log('===============================================================================');
  console.log('🤝 CUBiO AI — PHASE 31 TASK 508: MULTI-SUBMOTHER COORDINATION ENGINE TEST');
  console.log('===============================================================================');
  console.log();

  // ── Section 1: Pre-Test Sovereign Asset Custody Check ──
  console.log('--- Section 1: Pre-Test Sovereign Asset Custody Check ---');
  for (const [assetPath, expectedHash] of Object.entries(SOVEREIGN_ASSETS)) {
    const actual = computeSha256(assetPath);
    assert(actual === expectedHash, `Pre-test verify ${assetPath} matches SHA-256 canonical baseline`);
  }
  console.log();

  // ── Initialize Engine ──
  Phase31MultiSubmotherCoordinationEngine.resetInstance();
  const engine = Phase31MultiSubmotherCoordinationEngine.getInstance();

  const TENANT_ID = 'TENANT_ORCHESTRA_CORP';

  // ── Section 2: Parallel Multi-Submother Coordinated Exploration ──
  console.log('--- Section 2: Parallel Multi-Submother Coordinated Exploration ---');
  const parallelPlans: SubmotherBranchPlan[] = [
    {
      branchId: 'BRANCH_SPATIAL',
      domain: 'MEMORY',
      formulaId: 'FORMULA_SPATIAL_PROJECTION',
      formulaParameters: { cellId: 49 },
      contextPayload: 'context:parallel_mem',
    },
    {
      branchId: 'BRANCH_MATH',
      domain: 'MATHEMATICS',
      formulaId: 'FORMULA_PHI_TRANSFORM',
      formulaParameters: { power: 3 },
      contextPayload: 'context:parallel_math',
    },
    {
      branchId: 'BRANCH_REASON',
      domain: 'REASONING',
      formulaId: 'FORMULA_DOMAIN_DELEGATION',
      formulaParameters: { domain: 'REASONING' },
      contextPayload: 'context:parallel_reason',
    },
  ];

  const reqParallel: CoordinatedTaskRequest = {
    tenantId: TENANT_ID,
    parentTaskId: 'TASK_COORD_PARALLEL',
    executionMode: 'PARALLEL',
    branchPlans: parallelPlans,
  };

  const repParallel = await engine.executeCoordinatedTask(reqParallel);
  assert(repParallel.status === 'SUCCESS', 'Parallel coordinated task executed with SUCCESS');
  assert(repParallel.branchCount === 3, 'Executed exactly 3 coordinated branches');
  assert(repParallel.trainableWeights === 0, 'Trainable weights strictly 0');
  assert(repParallel.independentWeightsCreated === false, 'independentWeightsCreated strictly false');
  assert(repParallel.delegatesToMotherCore === true, 'delegatesToMotherCore is true');
  assert(repParallel.parityHash.length === 64, 'Parity hash is valid 64-char SHA-256');
  console.log();

  // ── Section 3: Sequential Chained Multi-Submother Exploration ──
  console.log('--- Section 3: Sequential Chained Multi-Submother Exploration ---');
  const seqPlans: SubmotherBranchPlan[] = [
    {
      branchId: 'BRANCH_STEP_1',
      domain: 'CODING',
      formulaId: 'FORMULA_DOMAIN_DELEGATION',
      formulaParameters: { domain: 'CODING' },
      contextPayload: 'step1',
    },
    {
      branchId: 'BRANCH_STEP_2',
      domain: 'PROBLEM_SOLVING',
      formulaId: 'FORMULA_EPISTEMIC_BOUND',
      formulaParameters: { confidenceScore: 0.9 },
      contextPayload: 'step2',
      dependsOnBranchId: 'BRANCH_STEP_1',
    },
  ];

  const reqSeq: CoordinatedTaskRequest = {
    tenantId: TENANT_ID,
    parentTaskId: 'TASK_COORD_SEQ',
    executionMode: 'SEQUENTIAL',
    branchPlans: seqPlans,
  };

  const repSeq = await engine.executeCoordinatedTask(reqSeq);
  assert(repSeq.status === 'SUCCESS', 'Sequential chained task executed with SUCCESS');
  assert(repSeq.branchCount === 2, 'Executed exactly 2 chained branches in sequence');
  console.log();

  // ── Section 4: Non-Trainable & Zero-Weight Invariant Enforcement ──
  console.log('--- Section 4: Non-Trainable & Zero-Weight Invariant Enforcement ---');
  const metrics = engine.getMetrics();
  assert(metrics.totalCoordinations >= 2, 'Metrics track total coordinated executions');
  assert(repSeq.motherCoreParameters === TOTAL_NATIVE_PARAMETERS, `Parameters match native inventory (${TOTAL_NATIVE_PARAMETERS})`);
  assert(repSeq.motherCoreModelId === CUBIO_NATIVE_MODEL_ID, `Model ID matches native identifier (${CUBIO_NATIVE_MODEL_ID})`);
  console.log();

  // ── Section 5: Circular Delegation Trapping ──
  console.log('--- Section 5: Circular Delegation Trapping ---');
  const circularPlans: SubmotherBranchPlan[] = [
    {
      branchId: 'BRANCH_A',
      domain: 'REASONING',
      formulaId: 'FORMULA_DOMAIN_DELEGATION',
      formulaParameters: { domain: 'REASONING' },
      contextPayload: 'circ_a',
      dependsOnBranchId: 'BRANCH_B', // A depends on B
    },
    {
      branchId: 'BRANCH_B',
      domain: 'MATHEMATICS',
      formulaId: 'FORMULA_PHI_TRANSFORM',
      formulaParameters: { power: 1 },
      contextPayload: 'circ_b',
      dependsOnBranchId: 'BRANCH_A', // B depends on A (Cycle!)
    },
  ];

  const repCirc = await engine.executeCoordinatedTask({
    tenantId: TENANT_ID,
    parentTaskId: 'TASK_CIRCULAR_ATTACK',
    executionMode: 'SEQUENTIAL',
    branchPlans: circularPlans,
  });
  assert(repCirc.status === 'CIRCULAR_DELEGATION', 'Circular delegation trapped fail-closed (CIRCULAR_DELEGATION)');
  assert(repCirc.rejectionReason?.includes('CIRCULAR_DELEGATION_DETECTED') === true, 'Reason cites CIRCULAR_DELEGATION_DETECTED');
  console.log();

  // ── Section 6: Concurrency Ceiling Enforcement (>8 Branches Blocked) ──
  console.log('--- Section 6: Concurrency Ceiling Enforcement (>8 Branches Blocked) ---');
  const overflowPlans: SubmotherBranchPlan[] = [];
  for (let i = 0; i < MAX_COORDINATED_SUBMOTHERS + 2; i++) {
    overflowPlans.push({
      branchId: `BRANCH_OVERFLOW_${i}`,
      domain: 'MEMORY',
      formulaId: 'FORMULA_SPATIAL_PROJECTION',
      formulaParameters: { cellId: i },
      contextPayload: `overflow_${i}`,
    });
  }

  const repOverflow = await engine.executeCoordinatedTask({
    tenantId: TENANT_ID,
    parentTaskId: 'TASK_OVERFLOW',
    executionMode: 'PARALLEL',
    branchPlans: overflowPlans,
  });
  assert(repOverflow.status === 'REJECTED', 'More than 8 branches rejected fail-closed');
  assert(repOverflow.rejectionReason?.includes('CONCURRENCY_EXCEEDED') === true, 'Reason cites CONCURRENCY_EXCEEDED');
  console.log();

  // ── Section 7: Deduplication of Redundant Branch Tasks ──
  console.log('--- Section 7: Deduplication of Redundant Branch Tasks ---');
  const duplicatePlans: SubmotherBranchPlan[] = [
    {
      branchId: 'BRANCH_ORIG',
      domain: 'MATHEMATICS',
      formulaId: 'FORMULA_PHI_TRANSFORM',
      formulaParameters: { power: 2 },
      contextPayload: 'math',
    },
    {
      branchId: 'BRANCH_DUP',
      domain: 'MATHEMATICS',
      formulaId: 'FORMULA_PHI_TRANSFORM',
      formulaParameters: { power: 2 }, // Identical domain, formula, and parameters
      contextPayload: 'math',
    },
  ];

  const repDedup = await engine.executeCoordinatedTask({
    tenantId: TENANT_ID,
    parentTaskId: 'TASK_DEDUP',
    executionMode: 'PARALLEL',
    branchPlans: duplicatePlans,
  });
  assert(repDedup.branchCount === 1, 'Redundant identical branch deduplicated (1 executed)');
  console.log();

  // ── Section 8: Deterministic Parity Hash Reproduction Across Runs ──
  console.log('--- Section 8: Deterministic Parity Hash Reproduction Across Runs ---');
  const repDetA = await engine.executeCoordinatedTask(reqParallel);
  const repDetB = await engine.executeCoordinatedTask(reqParallel);

  assert(repDetA.parityHash === repDetB.parityHash, 'Deterministic composite parity hash (0 drift)');
  assert(repDetA.branchCount === repDetB.branchCount, 'Deterministic branch count parity (0 drift)');
  console.log();

  // ── Section 9: Cryptographic Audit Ledger Parity & Mother Core Provenance ──
  console.log('--- Section 9: Cryptographic Audit Ledger Parity & Provenance ---');
  const ledger = engine.getAuditLedger();
  assert(ledger.length >= 6, `Audit ledger records populated (${ledger.length} entries)`);
  const lastEntry = ledger[ledger.length - 1];
  assert(lastEntry.auditHash.length === 64, 'Audit ledger entry has valid 64-char SHA-256 hash');
  console.log();

  // ── Section 10: Post-Test Sovereign Asset Custody Check ──
  console.log('--- Section 10: Post-Test Sovereign Asset Custody Check ---');
  for (const [assetPath, expectedHash] of Object.entries(SOVEREIGN_ASSETS)) {
    const actual = computeSha256(assetPath);
    assert(actual === expectedHash, `Post-test verify ${assetPath} (0 bits drift)`);
  }
  const prodHash = computeSha256('data/checkpoints/phase16_production_final_sealed_1m.3dmemory');
  assert(prodHash === PRODUCTION_CHECKPOINT_EXPECTED_HASH, 'Sealed production checkpoint untouched (0 bits drift)');
  console.log();

  // ── Section 11: Permanent Actuation & Air-Gap Invariants ──
  console.log('--- Section 11: Permanent Invariants ---');
  assert(IS_ACTUATION_BLOCKED === true, 'IS_ACTUATION_BLOCKED === true (immutable)');
  assert(OFFLINE_ISOLATED === true, 'OFFLINE_ISOLATED === true (immutable)');
  console.log();

  // ── Final Verdict ──
  Phase31MultiSubmotherCoordinationEngine.resetInstance();
  console.log('===============================================================================');
  if (failCount === 0) {
    console.log(`🎉 ALL ${assertionCount} ASSERTIONS PASSED!`);
    console.log(`🤝 VERDICT: COORDINATION_ENGINE_PASS`);
    console.log(`🔒 Task 508 Multi-Submother Coordination Engine certified complete!`);
  } else {
    console.log(`❌ ${failCount}/${assertionCount} ASSERTIONS FAILED`);
    console.log(`🚫 VERDICT: COORDINATION_ENGINE_BLOCKED`);
  }
  console.log('===============================================================================');

  process.exit(failCount > 0 ? 1 : 0);
}

runCoordinationEngineTestSuite().catch((err) => {
  console.error(`❌ FATAL ERROR IN TEST SUITE: ${err.message}`);
  console.error(err.stack);
  process.exit(1);
});
