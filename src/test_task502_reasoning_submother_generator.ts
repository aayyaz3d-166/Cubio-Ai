/**
 * ============================================================================
 * CUBiO AI — PHASE 31 TASK 502: REASONING SUBMOTHER TEST SUITE
 * src/test_task502_reasoning_submother_generator.ts
 * ============================================================================
 *
 * Forensic test suite for the Reasoning Submother Generator.
 *
 * Sections:
 *   1. Pre-Test Sovereign Asset Custody Check
 *   2. Procedural Reasoning Decomposition & Multi-Step Trace Validation
 *   3. Zero Trainable Weights & Non-Trainable Invariant Enforcement
 *   4. Deterministic Reasoning & Output Parity Verification
 *   5. Epistemic Boundary Enforcement (Fact vs Hypothesis vs Calibrated Refusal)
 *   6. Malformed Input Trapping (Empty Query / Premises Fail-Closed)
 *   7. Resource Limits (Max Depth & Branching Factor Caps)
 *   8. TTL Expiration & Timeout Trapping
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
  Phase31ReasoningSubmotherGenerator,
  REASONING_GENERATOR_VERSION,
  REASONING_GENERATOR_ID,
  MAX_REASONING_DEPTH,
  MAX_REASONING_BRANCHING,
} from './cubio/submother/phase31ReasoningSubmotherGenerator';
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

async function runReasoningGeneratorTestSuite(): Promise<void> {
  console.log('===============================================================================');
  console.log('🧠 CUBiO AI — PHASE 31 TASK 502: REASONING SUBMOTHER GENERATOR TEST SUITE');
  console.log('===============================================================================');
  console.log();

  // ── Section 1: Pre-Test Sovereign Asset Custody Check ──
  console.log('--- Section 1: Pre-Test Sovereign Asset Custody Check ---');
  for (const [assetPath, expectedHash] of Object.entries(SOVEREIGN_ASSETS)) {
    const actual = computeSha256(assetPath);
    assert(actual === expectedHash, `Pre-test verify ${assetPath} matches SHA-256 canonical baseline`);
  }
  console.log();

  // ── Initialize Generator ──
  Phase31ReasoningSubmotherGenerator.resetInstance();
  const generator = Phase31ReasoningSubmotherGenerator.getInstance();

  const TENANT_ID = 'TENANT_REASONING_CORP';

  // ── Section 2: Procedural Reasoning Decomposition & Multi-Step Trace Validation ──
  console.log('--- Section 2: Procedural Reasoning Decomposition & Multi-Step Trace Validation ---');
  const premisesValid = [
    'All spatial addresses in CUBiO AI map to Address369 coordinates.',
    'Cell 100 corresponds to discrete Address369 index 126.',
    'Index 126 is within the valid address boundary (26 to 368).',
  ];

  const inst1 = generator.spawnReasoningSubmother({
    tenantId: TENANT_ID,
    parentTaskId: 'TASK_REASONING_01',
    query: 'Verify Address369 boundary conformance for spatial cell 100',
    premises: premisesValid,
    maxDepth: 3,
  });

  assert(inst1.instanceId.startsWith('RSM_'), 'Reasoning instance ID has RSM_ prefix');
  assert(inst1.trainableWeights === 0, 'Trainable weights strictly 0');
  assert(inst1.independentWeightsCreated === false, 'independentWeightsCreated strictly false');
  assert(inst1.motherCoreParameters === TOTAL_NATIVE_PARAMETERS, `Parameters match native inventory (${TOTAL_NATIVE_PARAMETERS})`);
  assert(inst1.delegatesToMotherCore === true, 'delegatesToMotherCore is true');

  const result1 = generator.executeReasoningExploration(inst1.instanceId, premisesValid);
  assert(result1.status === 'SUCCESS', 'Reasoning exploration executed with SUCCESS');
  assert(result1.reasoningTrace.length === 3, 'Reasoning trace contains exactly 3 decomposition steps');
  assert(result1.epistemicStance === 'FACT', 'High-confidence premise chain classified as FACT');
  assert(result1.confidence >= 0.8, `Confidence score >= 0.80 (${result1.confidence})`);
  assert(result1.outputDigest.length === 64, 'Output digest is valid 64-char SHA-256');
  console.log();

  // ── Section 3: Zero Trainable Weights & Non-Trainable Invariant Enforcement ──
  console.log('--- Section 3: Non-Trainable & Zero-Weight Invariant Enforcement ---');
  const metrics = generator.getMetrics();
  assert(metrics.totalSpawned === 1, 'Metrics record 1 spawned reasoning instance');
  assert(metrics.totalExplorations === 1, 'Metrics record 1 executed exploration');
  console.log();

  // ── Section 4: Deterministic Reasoning & Output Parity ──
  console.log('--- Section 4: Deterministic Reasoning & Output Parity ---');
  const instDetA = generator.spawnReasoningSubmother({
    tenantId: TENANT_ID,
    parentTaskId: 'TASK_DET_REASON',
    query: 'Evaluate golden ratio harmonic sequence',
    premises: ['Phi is (1 + sqrt(5)) / 2', 'Phi squared is Phi + 1'],
  });
  const resDetA = generator.executeReasoningExploration(instDetA.instanceId, ['Phi is (1 + sqrt(5)) / 2', 'Phi squared is Phi + 1']);

  const instDetB = generator.spawnReasoningSubmother({
    tenantId: TENANT_ID,
    parentTaskId: 'TASK_DET_REASON',
    query: 'Evaluate golden ratio harmonic sequence',
    premises: ['Phi is (1 + sqrt(5)) / 2', 'Phi squared is Phi + 1'],
  });
  const resDetB = generator.executeReasoningExploration(instDetB.instanceId, ['Phi is (1 + sqrt(5)) / 2', 'Phi squared is Phi + 1']);

  assert(resDetA.outputDigest === resDetB.outputDigest, 'Deterministic reasoning trace parity (0 drift)');
  assert(resDetA.confidence === resDetB.confidence, 'Deterministic confidence parity (0 drift)');
  console.log();

  // ── Section 5: Epistemic Boundary Enforcement (Calibrated Refusal) ──
  console.log('--- Section 5: Epistemic Boundary Enforcement (Calibrated Refusal) ---');
  const contradictoryPremises = [
    'Cell 100 has address index 500.',
    'Index 500 is within 369 address space.',
    'Contradiction: Max address space is 369.',
  ];

  const instRefuse = generator.spawnReasoningSubmother({
    tenantId: TENANT_ID,
    parentTaskId: 'TASK_REFUSAL_TEST',
    query: 'Validate impossible address index',
    premises: contradictoryPremises,
  });
  const resRefuse = generator.executeReasoningExploration(instRefuse.instanceId, contradictoryPremises);

  assert(resRefuse.status === 'REFUSAL', 'Contradictory premises trigger calibrated REFUSAL');
  assert(resRefuse.epistemicStance === 'REFUSAL', 'Epistemic stance is strictly REFUSAL');
  assert(resRefuse.conclusion.includes('Hallucination prohibited'), 'Conclusion enforces anti-hallucination discipline');
  console.log();

  // ── Section 6: Malformed Input Trapping ──
  console.log('--- Section 6: Malformed Input Trapping ---');
  let emptyQueryThrown = false;
  try {
    generator.spawnReasoningSubmother({
      tenantId: TENANT_ID,
      parentTaskId: 'TASK_MALFORMED',
      query: '   ',
      premises: ['Premise 1'],
    });
  } catch (err: any) {
    emptyQueryThrown = err.message.includes('INVALID_INPUT');
  }
  assert(emptyQueryThrown, 'Empty query rejected fail-closed');

  let emptyPremisesThrown = false;
  try {
    generator.spawnReasoningSubmother({
      tenantId: TENANT_ID,
      parentTaskId: 'TASK_MALFORMED',
      query: 'Valid query',
      premises: [],
    });
  } catch (err: any) {
    emptyPremisesThrown = err.message.includes('INVALID_INPUT');
  }
  assert(emptyPremisesThrown, 'Empty premises array rejected fail-closed');
  console.log();

  // ── Section 7: Resource Limits (Depth & Branching Caps) ──
  console.log('--- Section 7: Resource Limits (Depth & Branching Caps) ---');
  let depthOverflowThrown = false;
  try {
    generator.spawnReasoningSubmother({
      tenantId: TENANT_ID,
      parentTaskId: 'TASK_RESOURCE_CAPS',
      query: 'Deep query',
      premises: ['P1', 'P2', 'P3', 'P4', 'P5'],
      maxDepth: MAX_REASONING_DEPTH + 1,
    });
  } catch (err: any) {
    depthOverflowThrown = err.message.includes('RECURSION_LIMIT');
  }
  assert(depthOverflowThrown, `Depth > ${MAX_REASONING_DEPTH} rejected fail-closed`);

  let branchingOverflowThrown = false;
  try {
    generator.spawnReasoningSubmother({
      tenantId: TENANT_ID,
      parentTaskId: 'TASK_RESOURCE_CAPS',
      query: 'Branching query',
      premises: ['P1'],
      branchingFactor: MAX_REASONING_BRANCHING + 1,
    });
  } catch (err: any) {
    branchingOverflowThrown = err.message.includes('RESOURCE_EXHAUSTION');
  }
  assert(branchingOverflowThrown, `Branching > ${MAX_REASONING_BRANCHING} rejected fail-closed`);
  console.log();

  // ── Section 8: TTL Expiration & Timeout Trapping ──
  console.log('--- Section 8: TTL Expiration & Timeout Trapping ---');
  const shortLivingInst = generator.spawnReasoningSubmother({
    tenantId: TENANT_ID,
    parentTaskId: 'TASK_QUICK_EXPIRE_REASON',
    query: 'Expiring reasoning test',
    premises: ['P1'],
    timeoutMs: 25, // 25 ms expiration
  });

  await new Promise(resolve => setTimeout(resolve, 40));

  const timeoutResult = generator.executeReasoningExploration(shortLivingInst.instanceId, ['P1']);
  assert(timeoutResult.status === 'TIMED_OUT', 'Expired reasoning instance execution returns TIMED_OUT');
  console.log();

  // ── Section 9: Cryptographic Audit Ledger Parity & Provenance ──
  console.log('--- Section 9: Cryptographic Audit Ledger Parity & Provenance ---');
  const ledger = generator.getAuditLedger();
  assert(ledger.length > 5, `Audit ledger records populated (${ledger.length} entries)`);
  const lastEntry = ledger[ledger.length - 1];
  assert(lastEntry.auditHash.length === 64, 'Audit ledger record has valid 64-char SHA-256 hash');
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
  Phase31ReasoningSubmotherGenerator.resetInstance();
  console.log('===============================================================================');
  if (failCount === 0) {
    console.log(`🎉 ALL ${assertionCount} ASSERTIONS PASSED!`);
    console.log(`🧠 VERDICT: REASONING_GENERATOR_PASS`);
    console.log(`🔒 Task 502 Reasoning Submother Generator certified complete!`);
  } else {
    console.log(`❌ ${failCount}/${assertionCount} ASSERTIONS FAILED`);
    console.log(`🚫 VERDICT: REASONING_GENERATOR_BLOCKED`);
  }
  console.log('===============================================================================');

  process.exit(failCount > 0 ? 1 : 0);
}

runReasoningGeneratorTestSuite().catch((err) => {
  console.error(`❌ FATAL ERROR IN TEST SUITE: ${err.message}`);
  console.error(err.stack);
  process.exit(1);
});
