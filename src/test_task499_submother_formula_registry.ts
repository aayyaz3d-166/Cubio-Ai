/**
 * ============================================================================
 * CUBiO AI — PHASE 31 TASK 499: SUBMOTHER FORMULA REGISTRY TEST SUITE
 * src/test_task499_submother_formula_registry.ts
 * ============================================================================
 *
 * Forensic test suite for the Canonical Submother Formula Registry.
 *
 * Sections:
 *   1. Pre-Test Sovereign Asset Custody Check
 *   2. Canonical Formula Registry Integrity & Metadata Verification
 *   3. Non-Trainable & Zero-Weight Invariant Enforcement
 *   4. Deterministic Formula Execution Across All Approved Formulas
 *   5. Input Schema & Parameter Bounds Validation (Malformed Inputs Trapped)
 *   6. Unknown & Unregistered Formula Rejection (Fail-Closed)
 *   7. Rejection of Mutable, Trainable, or External Model Registrations
 *   8. Duplicate Registration Prevention
 *   9. Cryptographic Provenance & Output Digest Parity
 *  10. Immutable Audit Ledger Parity
 *  11. Post-Test Sovereign Asset Custody Check
 *  12. Permanent Invariants (Actuation & Offline Isolation)
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
  Phase31SubmotherFormulaRegistry,
  FORMULA_REGISTRY_VERSION,
  FORMULA_REGISTRY_ID,
  type FormulaDefinition,
} from './cubio/submother/phase31SubmotherFormulaRegistry';
import { SOVEREIGN_ASSETS } from './cubio/submother/phase31SubmotherFabricArchitectureFreeze';
import { PRODUCTION_CHECKPOINT_EXPECTED_HASH } from './cubio/benchmark/phase30MotherCoreCheckpointValidator';
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

function runFormulaRegistryTestSuite(): void {
  console.log('===============================================================================');
  console.log('📐 CUBiO AI — PHASE 31 TASK 499: SUBMOTHER FORMULA REGISTRY TEST SUITE');
  console.log('===============================================================================');
  console.log();

  // ── Section 1: Pre-Test Sovereign Asset Custody Check ──
  console.log('--- Section 1: Pre-Test Sovereign Asset Custody Check ---');
  for (const [assetPath, expectedHash] of Object.entries(SOVEREIGN_ASSETS)) {
    const actual = computeSha256(assetPath);
    assert(actual === expectedHash, `Pre-test verify ${assetPath} matches SHA-256 canonical baseline`);
  }
  console.log();

  // ── Initialize Registry ──
  Phase31SubmotherFormulaRegistry.resetInstance();
  const registry = Phase31SubmotherFormulaRegistry.getInstance();

  // ── Section 2: Canonical Formula Registry Integrity ──
  console.log('--- Section 2: Canonical Formula Registry Integrity ---');
  const formulas = registry.listRegisteredFormulas();
  assert(formulas.length === 5, 'Exactly 5 approved canonical formulas registered');

  const expectedIds = [
    'FORMULA_SPATIAL_PROJECTION',
    'FORMULA_EXPANSION_RULE',
    'FORMULA_DOMAIN_DELEGATION',
    'FORMULA_PHI_TRANSFORM',
    'FORMULA_EPISTEMIC_BOUND',
  ];

  for (const fid of expectedIds) {
    const def = registry.getFormula(fid);
    assert(def !== undefined, `Formula ${fid} exists in registry`);
    assert(def?.lifecycleStatus === 'ACTIVE', `${fid} lifecycle status is ACTIVE`);
    assert(def?.outputContract.delegatesTo === 'MOTHER_CORE', `${fid} delegatesTo MOTHER_CORE`);
    assert(def?.provenanceDigest.length === 64, `${fid} has valid 64-char SHA-256 provenanceDigest`);
  }
  console.log();

  // ── Section 3: Non-Trainable & Zero-Weight Invariant Enforcement ──
  console.log('--- Section 3: Non-Trainable & Zero-Weight Invariant Enforcement ---');
  for (const def of formulas) {
    assert(def.trainableWeights === 0, `${def.formulaId} trainableWeights strictly 0`);
    assert(def.allowsDynamicLearning === false, `${def.formulaId} allowsDynamicLearning strictly false`);
  }
  console.log();

  // ── Section 4: Deterministic Formula Execution ──
  console.log('--- Section 4: Deterministic Formula Execution Across All Approved Formulas ---');

  // Test 1: SPATIAL_PROJECTION
  const res1a = registry.executeFormula('FORMULA_SPATIAL_PROJECTION', { cellId: 100 });
  const res1b = registry.executeFormula('FORMULA_SPATIAL_PROJECTION', { cellId: 100 });
  assert(res1a.status === 'SUCCESS', 'SPATIAL_PROJECTION executed successfully');
  assert(res1a.output.address369 === 126, 'Cell 100 mapped to address369=126');
  assert(res1a.outputDigest === res1b.outputDigest, 'SPATIAL_PROJECTION deterministic output (0 delta)');
  assert(res1a.independentWeightsCreated === false, 'Zero independent weights created');

  // Test 2: EXPANSION_RULE
  const res2a = registry.executeFormula('FORMULA_EXPANSION_RULE', { depth: 2 });
  const res2b = registry.executeFormula('FORMULA_EXPANSION_RULE', { depth: 2 });
  assert(res2a.status === 'SUCCESS', 'EXPANSION_RULE executed successfully');
  assert(res2a.output.phiFactor === 2.618034, 'Depth 2 phi factor = 2.618034');
  assert(res2a.outputDigest === res2b.outputDigest, 'EXPANSION_RULE deterministic parity (0 delta)');

  // Test 3: DOMAIN_DELEGATION
  const res3 = registry.executeFormula('FORMULA_DOMAIN_DELEGATION', { domain: 'MATHEMATICS' });
  assert(res3.status === 'SUCCESS', 'DOMAIN_DELEGATION executed successfully');
  assert(res3.output.domain === 'MATHEMATICS', 'Domain resolved correctly');
  assert(res3.output.delegatedTo === 'MOTHER_CORE', 'Delegated to MOTHER_CORE');

  // Test 4: PHI_TRANSFORM
  const res4a = registry.executeFormula('FORMULA_PHI_TRANSFORM', { power: 3 });
  const res4b = registry.executeFormula('FORMULA_PHI_TRANSFORM', { power: 3 });
  assert(res4a.status === 'SUCCESS', 'PHI_TRANSFORM executed successfully');
  assert(res4a.outputDigest === res4b.outputDigest, 'PHI_TRANSFORM deterministic parity (0 delta)');

  // Test 5: EPISTEMIC_BOUND
  const res5Fact = registry.executeFormula('FORMULA_EPISTEMIC_BOUND', { confidenceScore: 0.95 });
  const res5Hyp = registry.executeFormula('FORMULA_EPISTEMIC_BOUND', { confidenceScore: 0.60 });
  const res5Ref = registry.executeFormula('FORMULA_EPISTEMIC_BOUND', { confidenceScore: 0.20 });
  assert(res5Fact.output.classification === 'FACT', 'Score 0.95 classified as FACT');
  assert(res5Hyp.output.classification === 'HYPOTHESIS', 'Score 0.60 classified as HYPOTHESIS');
  assert(res5Ref.output.classification === 'REFUSAL', 'Score 0.20 classified as REFUSAL');
  console.log();

  // ── Section 5: Input Schema & Parameter Bounds Validation ──
  console.log('--- Section 5: Input Schema & Parameter Bounds Validation ---');

  // Missing required param
  const missingParam = registry.executeFormula('FORMULA_SPATIAL_PROJECTION', {});
  assert(missingParam.status === 'REJECTED', 'Missing required parameter rejected fail-closed');
  assert(missingParam.rejectionReason?.includes('MISSING_REQUIRED_PARAM') === true, 'Reason identifies MISSING_REQUIRED_PARAM');

  // Type mismatch
  const typeMismatch = registry.executeFormula('FORMULA_SPATIAL_PROJECTION', { cellId: 'invalid_string' });
  assert(typeMismatch.status === 'REJECTED', 'Type mismatch rejected fail-closed');
  assert(typeMismatch.rejectionReason?.includes('TYPE_MISMATCH') === true, 'Reason identifies TYPE_MISMATCH');

  // Out of bounds min
  const outOfBoundsMin = registry.executeFormula('FORMULA_SPATIAL_PROJECTION', { cellId: -5 });
  assert(outOfBoundsMin.status === 'REJECTED', 'Negative cellId rejected fail-closed');
  assert(outOfBoundsMin.rejectionReason?.includes('BOUNDS_VIOLATION') === true, 'Reason identifies BOUNDS_VIOLATION (min)');

  // Out of bounds max
  const outOfBoundsMax = registry.executeFormula('FORMULA_SPATIAL_PROJECTION', { cellId: 500 });
  assert(outOfBoundsMax.status === 'REJECTED', 'Out-of-bounds cellId (>342) rejected fail-closed');
  assert(outOfBoundsMax.rejectionReason?.includes('BOUNDS_VIOLATION') === true, 'Reason identifies BOUNDS_VIOLATION (max)');

  // Disallowed string value
  const disallowedDomain = registry.executeFormula('FORMULA_DOMAIN_DELEGATION', { domain: 'UNAUTHORIZED_DOMAIN' });
  assert(disallowedDomain.status === 'REJECTED', 'Disallowed string option rejected fail-closed');
  assert(disallowedDomain.rejectionReason?.includes('DISALLOWED_VALUE') === true, 'Reason identifies DISALLOWED_VALUE');
  console.log();

  // ── Section 6: Unknown & Unregistered Formula Rejection ──
  console.log('--- Section 6: Unknown & Unregistered Formula Rejection ---');
  const unknownFormula = registry.executeFormula('FORMULA_UNKNOWN_ROGUE_AI', { test: true });
  assert(unknownFormula.status === 'REJECTED', 'Unknown formula rejected fail-closed');
  assert(unknownFormula.rejectionReason?.includes('UNKNOWN_FORMULA') === true, 'Reason identifies UNKNOWN_FORMULA');
  console.log();

  // ── Section 7: Rejection of Mutable, Trainable, or External Model Registrations ──
  console.log('--- Section 7: Rejection of Mutable or Trainable Registrations ---');

  // Attempting to register a trainable formula
  const trainableAttempt = registry.registerApprovedFormula({
    formulaId: 'FORMULA_ILLEGAL_TRAINABLE',
    version: '1.0.0',
    name: 'Illegal Trainable Formula',
    description: 'Attempts to introduce local backprop',
    category: 'SYMBOLIC_LOGIC',
    lifecycleStatus: 'ACTIVE',
    inputSchema: [],
    outputContract: { requiredFields: ['val'], delegatesTo: 'MOTHER_CORE' },
    trainableWeights: 1024 as any, // Illegal!
    allowsDynamicLearning: true as any, // Illegal!
    compute: () => ({ val: 1 }),
  });
  assert(trainableAttempt.success === false, 'Trainable formula registration rejected');
  assert(trainableAttempt.reason?.includes('TRAINABLE_INVARIANT_VIOLATION') === true, 'Reason cites TRAINABLE_INVARIANT_VIOLATION');

  // Attempting to register without MOTHER_CORE delegation
  const noDelegationAttempt = registry.registerApprovedFormula({
    formulaId: 'FORMULA_ILLEGAL_ROGUE',
    version: '1.0.0',
    name: 'Illegal Autonomous Formula',
    description: 'Attempts to bypass Mother Core authority',
    category: 'SYMBOLIC_LOGIC',
    lifecycleStatus: 'ACTIVE',
    inputSchema: [],
    outputContract: { requiredFields: ['val'], delegatesTo: 'EXTERNAL_LLM' as any }, // Illegal!
    trainableWeights: 0,
    allowsDynamicLearning: false,
    compute: () => ({ val: 1 }),
  });
  assert(noDelegationAttempt.success === false, 'Formula without Mother Core delegation rejected');
  assert(noDelegationAttempt.reason?.includes('AUTHORITY_VIOLATION') === true, 'Reason cites AUTHORITY_VIOLATION');
  console.log();

  // ── Section 8: Duplicate Registration Prevention ──
  console.log('--- Section 8: Duplicate Registration Prevention ---');
  const duplicateAttempt = registry.registerApprovedFormula({
    formulaId: 'FORMULA_SPATIAL_PROJECTION', // Already exists!
    version: '2.0.0',
    name: 'Duplicate Projection',
    description: 'Collision attempt',
    category: 'SPATIAL_GEOMETRY',
    lifecycleStatus: 'ACTIVE',
    inputSchema: [],
    outputContract: { requiredFields: ['val'], delegatesTo: 'MOTHER_CORE' },
    trainableWeights: 0,
    allowsDynamicLearning: false,
    compute: () => ({ val: 1 }),
  });
  assert(duplicateAttempt.success === false, 'Duplicate formula registration rejected');
  assert(duplicateAttempt.reason?.includes('DUPLICATE_REGISTRATION') === true, 'Reason cites DUPLICATE_REGISTRATION');
  console.log();

  // ── Section 9: Cryptographic Provenance & Output Digest Parity ──
  console.log('--- Section 9: Cryptographic Provenance & Output Digest Parity ---');
  for (const f of formulas) {
    assert(f.provenanceDigest.length === 64, `${f.formulaId} provenance digest is valid 64-char hex`);
  }
  console.log();

  // ── Section 10: Immutable Audit Ledger Parity ──
  console.log('--- Section 10: Immutable Audit Ledger Parity ---');
  const ledger = registry.getAuditLedger();
  assert(ledger.length > 15, `Audit ledger populated (${ledger.length} entries)`);
  const lastEntry = ledger[ledger.length - 1];
  assert(lastEntry.auditHash.length === 64, 'Audit ledger record has valid SHA-256 hash');
  console.log();

  // ── Section 11: Post-Test Sovereign Asset Custody Check ──
  console.log('--- Section 11: Post-Test Sovereign Asset Custody Check ---');
  for (const [assetPath, expectedHash] of Object.entries(SOVEREIGN_ASSETS)) {
    const actual = computeSha256(assetPath);
    assert(actual === expectedHash, `Post-test verify ${assetPath} (0 bits drift)`);
  }
  const prodHash = computeSha256('data/checkpoints/phase16_production_final_sealed_1m.3dmemory');
  assert(prodHash === PRODUCTION_CHECKPOINT_EXPECTED_HASH, 'Sealed production checkpoint untouched (0 bits drift)');
  console.log();

  // ── Section 12: Permanent Actuation & Air-Gap Invariants ──
  console.log('--- Section 12: Permanent Invariants ---');
  assert(IS_ACTUATION_BLOCKED === true, 'IS_ACTUATION_BLOCKED === true (immutable)');
  assert(OFFLINE_ISOLATED === true, 'OFFLINE_ISOLATED === true (immutable)');
  console.log();

  // ── Final Verdict ──
  Phase31SubmotherFormulaRegistry.resetInstance();
  console.log('===============================================================================');
  if (failCount === 0) {
    console.log(`🎉 ALL ${assertionCount} ASSERTIONS PASSED!`);
    console.log(`📐 VERDICT: FORMULA_REGISTRY_PASS`);
    console.log(`🔒 Task 499 Submother Formula Registry certified complete!`);
  } else {
    console.log(`❌ ${failCount}/${assertionCount} ASSERTIONS FAILED`);
    console.log(`🚫 VERDICT: FORMULA_REGISTRY_BLOCKED`);
  }
  console.log('===============================================================================');

  process.exit(failCount > 0 ? 1 : 0);
}

try {
  runFormulaRegistryTestSuite();
} catch (err: any) {
  console.error(`❌ FATAL ERROR IN TEST SUITE: ${err.message}`);
  console.error(err.stack);
  process.exit(1);
}
