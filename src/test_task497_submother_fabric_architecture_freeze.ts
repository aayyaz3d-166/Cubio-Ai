/**
 * ============================================================================
 * CUBiO AI — PHASE 31 TASK 497: SUBMOTHER FABRIC ARCHITECTURE FREEZE TEST
 * src/test_task497_submother_fabric_architecture_freeze.ts
 * ============================================================================
 *
 * Forensic test suite validating the Phase 31 Submother Fabric Architecture Freeze.
 *
 * Sections:
 *   1. Pre-Freeze Sovereign Custody Check
 *   2. Frozen Specification Integrity
 *   3. Architecture Gate Execution
 *   4. Non-Trainable Invariant Verification
 *   5. Mother Core Authority Verification
 *   6. Lifecycle & Interface Compliance
 *   7. Isolation & Resource Limit Enforcement
 *   8. Dependency & External Intelligence Isolation
 *   9. Security & Adversarial Boundary Tests
 *  10. Regression & Deterministic Reproducibility
 *  11. Fabric Component Integrity
 *  12. Master Freeze Decision
 *  13. Post-Freeze Sovereign Custody Check
 *  14. Permanent Invariants
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
  Phase31SubmotherFabricArchitectureFreeze,
  FROZEN_FABRIC_SPEC,
  SOVEREIGN_ASSETS,
  PHASE31_SUBMOTHER_FABRIC_VERSION,
  PHASE31_FABRIC_FREEZE_ID,
  type FabricFreezeReport,
} from './cubio/submother/phase31SubmotherFabricArchitectureFreeze';
import {
  MAX_CONCURRENT_SUBMOTHERS,
  MAX_GENERATION_DEPTH,
  MAX_TOTAL_SPAWNED_PER_TASK,
  DEFAULT_EXECUTION_TIMEOUT_MS,
  DEFAULT_MEMORY_BUDGET_BYTES,
} from './cubio/submother/phase29SubmotherGenerationEngine';
import { DEFAULT_SCALING_CONSTRAINTS } from './cubio/submother/phase29SubmotherScalingController';
import { MAX_PARALLEL_BRANCHES } from './cubio/submother/phase29MultiSubmotherParallelEngine';
import { TOTAL_NATIVE_PARAMETERS } from './cubio/core/nativeTrainingIntegration';
import {
  PRODUCTION_CHECKPOINT_EXPECTED_HASH,
} from './cubio/benchmark/phase30MotherCoreCheckpointValidator';

// ============================================================================
// UTILITIES
// ============================================================================

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

// ============================================================================
// TEST SUITE
// ============================================================================

function runSubmotherFabricArchitectureFreezeTest(): void {
  console.log('===============================================================================');
  console.log('🏗️ CUBiO AI — PHASE 31 TASK 497: SUBMOTHER FABRIC ARCHITECTURE FREEZE TEST');
  console.log('===============================================================================');
  console.log();

  // ── Section 1: Pre-Freeze Sovereign Custody Check ──
  console.log('--- Section 1: Pre-Freeze Sovereign Custody Check ---');
  for (const [assetPath, expectedHash] of Object.entries(SOVEREIGN_ASSETS)) {
    const actual = computeSha256(assetPath);
    assert(actual === expectedHash, `Pre-freeze custody verify ${assetPath} matches SHA-256 baseline`);
  }
  console.log();

  // ── Section 2: Frozen Specification Integrity ──
  console.log('--- Section 2: Frozen Specification Integrity ---');
  assert(FROZEN_FABRIC_SPEC.fabricVersion === PHASE31_SUBMOTHER_FABRIC_VERSION, 'Fabric version matches constant');
  assert(FROZEN_FABRIC_SPEC.freezeId === PHASE31_FABRIC_FREEZE_ID, 'Freeze ID matches constant');
  assert(FROZEN_FABRIC_SPEC.soleIntelligenceSource === 'MOTHER_CORE', 'Sole intelligence source is MOTHER_CORE');
  assert(FROZEN_FABRIC_SPEC.motherCoreTotalParameters === TOTAL_NATIVE_PARAMETERS, `Mother Core parameters = ${TOTAL_NATIVE_PARAMETERS}`);
  assert(FROZEN_FABRIC_SPEC.motherCoreTensorCount === 37, 'Mother Core tensor count = 37');
  assert(FROZEN_FABRIC_SPEC.submotherTrainableWeights === 0, 'Submother trainable weights = 0');
  assert(FROZEN_FABRIC_SPEC.submotherIndependentParameters === 0, 'Submother independent parameters = 0');
  assert(FROZEN_FABRIC_SPEC.submotherCanTrain === false, 'Submother cannot train');
  assert(FROZEN_FABRIC_SPEC.submotherCanServeIndependentInference === false, 'Submother cannot serve independent inference');
  assert(FROZEN_FABRIC_SPEC.submotherCanClaimIntelligenceAuthority === false, 'Submother cannot claim intelligence authority');
  assert(FROZEN_FABRIC_SPEC.maxConcurrentSubmothers === MAX_CONCURRENT_SUBMOTHERS, `Max concurrent = ${MAX_CONCURRENT_SUBMOTHERS}`);
  assert(FROZEN_FABRIC_SPEC.maxGenerationDepth === MAX_GENERATION_DEPTH, `Max depth = ${MAX_GENERATION_DEPTH}`);
  assert(FROZEN_FABRIC_SPEC.maxTotalSpawnedPerTask === MAX_TOTAL_SPAWNED_PER_TASK, `Max spawned/task = ${MAX_TOTAL_SPAWNED_PER_TASK}`);
  assert(FROZEN_FABRIC_SPEC.defaultExecutionTimeoutMs === DEFAULT_EXECUTION_TIMEOUT_MS, `Default timeout = ${DEFAULT_EXECUTION_TIMEOUT_MS}ms`);
  assert(FROZEN_FABRIC_SPEC.defaultMemoryBudgetBytes === DEFAULT_MEMORY_BUDGET_BYTES, `Default memory = ${DEFAULT_MEMORY_BUDGET_BYTES} bytes`);
  assert(FROZEN_FABRIC_SPEC.maxParallelBranches === MAX_PARALLEL_BRANCHES, `Max parallel = ${MAX_PARALLEL_BRANCHES}`);
  assert(FROZEN_FABRIC_SPEC.isActuationBlocked === true, 'Actuation blocked in spec');
  assert(FROZEN_FABRIC_SPEC.offlineIsolated === true, 'Offline isolated in spec');
  assert(FROZEN_FABRIC_SPEC.externalModelDependencies === 0, 'External model dependencies = 0');
  assert(FROZEN_FABRIC_SPEC.cloudApiDependencies === 0, 'Cloud API dependencies = 0');
  assert(FROZEN_FABRIC_SPEC.directUserCommunication === false, 'Direct user communication = false');
  assert(FROZEN_FABRIC_SPEC.supportedFormulas.length === 4, 'Exactly 4 formula types');
  assert(FROZEN_FABRIC_SPEC.fabricComponents.length === 7, 'Exactly 7 fabric components');
  console.log();

  // ── Section 3: Execute Architecture Freeze ──
  console.log('--- Section 3: Execute Architecture Freeze ---');
  Phase31SubmotherFabricArchitectureFreeze.resetInstance();
  const freezeEngine = Phase31SubmotherFabricArchitectureFreeze.getInstance(projectRoot);
  const report: FabricFreezeReport = freezeEngine.executeArchitectureFreeze();

  assert(report.freezeId === PHASE31_FABRIC_FREEZE_ID, 'Report freeze ID matches');
  assert(report.fabricVersion === PHASE31_SUBMOTHER_FABRIC_VERSION, 'Report fabric version matches');
  assert(report.architectureGates.length === 8, 'Exactly 8 architecture gates evaluated');
  console.log();

  // ── Section 4–10: Individual Gate Results ──
  const gateNames = [
    ['GATE_01_NON_TRAINABLE', 'Section 4: Non-Trainable Invariant'],
    ['GATE_02_SOLE_INTELLIGENCE', 'Section 5: Mother Core Sole Intelligence'],
    ['GATE_03_LIFECYCLE', 'Section 6: Lifecycle & Interface Compliance'],
    ['GATE_04_ISOLATION_RESOURCES', 'Section 7: Isolation & Resource Limits'],
    ['GATE_05_DEPENDENCY', 'Section 8: Dependency & External Intelligence'],
    ['GATE_06_SECURITY', 'Section 9: Security & Adversarial Boundaries'],
    ['GATE_07_SOVEREIGN_CUSTODY', 'Section 10: Sovereign Custody'],
    ['GATE_08_REGRESSION', 'Section 11: Regression & Determinism'],
  ];

  for (const [gateId, sectionLabel] of gateNames) {
    console.log(`--- ${sectionLabel} ---`);
    const gate = report.architectureGates.find(g => g.gateId === gateId);
    assert(gate !== undefined, `${gateId} gate exists in report`);
    assert(gate?.status === 'PASS', `${gateId} (${gate?.gateName}) = PASS`);
    if (gate?.status === 'PASS') {
      console.log(`    Evidence: ${gate.evidence.slice(0, 120)}...`);
    } else if (gate) {
      console.log(`    BLOCKED Evidence: ${gate.evidence}`);
    }
    console.log();
  }

  // ── Section 12: Master Freeze Decision ──
  console.log('--- Section 12: Master Freeze Decision ---');
  assert(report.sovereignCustodyPassed === true, 'Sovereign custody passed');
  assert(report.allGatesPassed === true, 'All gates passed');
  assert(report.blockedGates.length === 0, 'Zero blocked gates');
  assert(report.decision === 'ARCHITECTURE_FREEZE_PASS', `Decision = ${report.decision}`);
  console.log();

  // ── Section 13: Fabric Component Integrity ──
  console.log('--- Section 13: Fabric Component Integrity ---');
  const integrity = freezeEngine.verifyFabricComponentIntegrity();
  assert(integrity.allExist === true, 'All 7 fabric components exist on disk');
  for (const component of FROZEN_FABRIC_SPEC.fabricComponents) {
    const hash = integrity.hashes[component];
    assert(hash !== 'FILE_NOT_FOUND' && typeof hash === 'string' && hash.length === 64, `${path.basename(component)} has valid SHA-256`);
  }
  console.log();

  // ── Section 14: Post-Freeze Sovereign Custody Check ──
  console.log('--- Section 14: Post-Freeze Sovereign Custody Check ---');
  for (const [assetPath, expectedHash] of Object.entries(SOVEREIGN_ASSETS)) {
    const actual = computeSha256(assetPath);
    assert(actual === expectedHash, `Post-freeze custody verify ${assetPath} (0 bits drift)`);
  }
  const prodHash = computeSha256('data/checkpoints/phase16_production_final_sealed_1m.3dmemory');
  assert(prodHash === PRODUCTION_CHECKPOINT_EXPECTED_HASH, 'Production checkpoint 100% untouched post-freeze');
  console.log();

  // ── Section 15: Permanent Invariants ──
  console.log('--- Section 15: Permanent Invariants ---');
  assert(IS_ACTUATION_BLOCKED === true, 'IS_ACTUATION_BLOCKED === true (immutable)');
  assert(OFFLINE_ISOLATED === true, 'OFFLINE_ISOLATED === true (immutable)');
  console.log();

  // ── Final Summary ──
  Phase31SubmotherFabricArchitectureFreeze.resetInstance();

  console.log('===============================================================================');
  if (failCount === 0) {
    console.log(`🎉 ALL ${assertionCount} ASSERTIONS PASSED!`);
    console.log(`🏗️ DECISION: ARCHITECTURE_FREEZE_PASS`);
    console.log(`🔒 Phase 31 Submother Fabric architecture frozen and certified!`);
  } else {
    console.log(`❌ ${failCount}/${assertionCount} ASSERTIONS FAILED`);
    console.log(`🚫 DECISION: ARCHITECTURE_FREEZE_BLOCKED`);
  }
  console.log('===============================================================================');

  process.exit(failCount > 0 ? 1 : 0);
}

// ============================================================================
// EXECUTE
// ============================================================================

try {
  runSubmotherFabricArchitectureFreezeTest();
} catch (err: any) {
  console.error(`❌ FATAL ERROR IN TEST SUITE: ${err.message}`);
  console.error(err.stack);
  process.exit(1);
}
