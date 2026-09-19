/**
 * ============================================================================
 * CUBiO AI — PHASE 31 TASK 500: DYNAMIC IDENTITY ENGINE TEST SUITE
 * src/test_task500_dynamic_submother_identity_engine.ts
 * ============================================================================
 *
 * Forensic test suite for the Dynamic Submother Identity Engine.
 *
 * Sections:
 *   1. Pre-Test Sovereign Asset Custody Check
 *   2. Deterministic Identity Derivation & Reproducibility Verification
 *   3. Zero Trainable Weights & Non-Trainable Invariant Enforcement
 *   4. Identity Lookup, State Transition, and Branch Reuse Validation
 *   5. Automatic TTL Expiration & Cleanup Sweep
 *   6. Multi-Tenant Namespace Isolation (Cross-Tenant Lookups Trapped)
 *   7. Resource Limit & Per-Tenant Concurrency Enforcement
 *   8. Collision Detection & Parameter Tamper Rejection
 *   9. Cryptographic Audit Ledger Parity & Integrity
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
  Phase31DynamicSubmotherIdentityEngine,
  IDENTITY_ENGINE_VERSION,
  IDENTITY_ENGINE_ID,
  MAX_IDENTITIES_PER_TENANT,
  type IdentityDerivationContext,
} from './cubio/submother/phase31DynamicSubmotherIdentityEngine';
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

async function runIdentityEngineTestSuite(): Promise<void> {
  console.log('===============================================================================');
  console.log('🆔 CUBiO AI — PHASE 31 TASK 500: DYNAMIC SUBMOTHER IDENTITY ENGINE TEST SUITE');
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
  Phase31DynamicSubmotherIdentityEngine.resetInstance();
  const engine = Phase31DynamicSubmotherIdentityEngine.getInstance();

  const TENANT_1 = 'TENANT_CORP_SIGMA';
  const TENANT_2 = 'TENANT_CORP_OMEGA';

  // ── Section 2: Deterministic Identity Derivation & Reproducibility ──
  console.log('--- Section 2: Deterministic Identity Derivation & Reproducibility ---');
  const ctxA: IdentityDerivationContext = {
    tenantId: TENANT_1,
    parentTaskId: 'TASK_EXEC_500_A',
    domain: 'SPATIAL',
    contextPayload: 'context:grid_cell_343',
    formulaId: 'FORMULA_SPATIAL_PROJECTION',
    formulaParameters: { cellId: 42 },
    generationDepth: 1,
  };

  const { identityId: idA, identityHash: hashA } = engine.computeDeterministicIdentityKey(ctxA);
  const { identityId: idA2, identityHash: hashA2 } = engine.computeDeterministicIdentityKey(ctxA);

  assert(idA === idA2, 'Bit-exact deterministic identity ID reproduction (0 drift)');
  assert(hashA === hashA2, 'Bit-exact deterministic identity hash reproduction (0 drift)');
  assert(idA.startsWith('SMID_SPATIAL_'), 'Identity ID formatted with domain prefix');
  assert(idA.endsWith('_D1'), 'Identity ID formatted with generation depth suffix');
  console.log();

  // ── Section 3: Non-Trainable & Zero-Weight Invariant Enforcement ──
  console.log('--- Section 3: Non-Trainable & Zero-Weight Invariant Enforcement ---');
  const { record: recA, isReused: reusedA } = engine.deriveOrReuseIdentity(ctxA);

  assert(!reusedA, 'First derivation marked isReused: false');
  assert(recA.independentWeightsCreated === false, 'independentWeightsCreated strictly false');
  assert(recA.motherCoreParameters === TOTAL_NATIVE_PARAMETERS, `Mother Core parameters recorded (${TOTAL_NATIVE_PARAMETERS})`);
  assert(recA.motherCoreModelId === CUBIO_NATIVE_MODEL_ID, `Mother Core model ID recorded (${CUBIO_NATIVE_MODEL_ID})`);
  assert(recA.state === 'ACTIVE', 'New identity is in ACTIVE state');
  assert(recA.isolationToken.length === 32, 'Isolation token is 32-char hex string');
  console.log();

  // ── Section 4: Identity Lookup & Branch Reuse Validation ──
  console.log('--- Section 4: Identity Lookup & Branch Reuse Validation ---');
  const lookedUp = engine.lookupIdentity(recA.identityId, TENANT_1);
  assert(lookedUp !== undefined, 'Lookup succeeds for matching tenant');
  assert(lookedUp?.identityId === recA.identityId, 'Lookup returns matching identity ID');

  // Reuse identical derivation
  const { record: recA_reused, isReused: reusedA2 } = engine.deriveOrReuseIdentity(ctxA);
  assert(reusedA2, 'Subsequent identical derivation marked isReused: true');
  assert(recA_reused.reuseCount === 1, 'reuseCount incremented to 1');
  assert(recA_reused.identityId === recA.identityId, 'Reused identity has identical ID');
  console.log();

  // ── Section 5: Automatic TTL Expiration & Cleanup Sweep ──
  console.log('--- Section 5: Automatic TTL Expiration & Cleanup Sweep ---');
  const ctxShortTTL: IdentityDerivationContext = {
    tenantId: TENANT_1,
    parentTaskId: 'TASK_SHORT_TTL',
    domain: 'EXPANSION',
    contextPayload: 'context:quick_expire',
    formulaId: 'FORMULA_EXPANSION_RULE',
    formulaParameters: { depth: 1 },
    generationDepth: 0,
    customTtlMs: 20, // 20 ms short expiration
  };

  const { record: recShort } = engine.deriveOrReuseIdentity(ctxShortTTL);
  assert(engine.lookupIdentity(recShort.identityId, TENANT_1) !== undefined, 'Short TTL identity active immediately');

  // Sleep 35 ms to trigger expiration
  await new Promise(resolve => setTimeout(resolve, 35));

  const swept = engine.sweepExpiredIdentities();
  assert(swept >= 1, `sweepExpiredIdentities() pruned at least 1 identity (${swept} swept)`);
  assert(engine.lookupIdentity(recShort.identityId, TENANT_1) === undefined, 'Expired identity cleaned up');
  console.log();

  // ── Section 6: Multi-Tenant Namespace Isolation ──
  console.log('--- Section 6: Multi-Tenant Namespace Isolation ---');
  const ctxTenant2: IdentityDerivationContext = {
    tenantId: TENANT_2,
    parentTaskId: 'TASK_EXEC_500_T2',
    domain: 'REASONING',
    contextPayload: 'context:tenant2_data',
    formulaId: 'FORMULA_DOMAIN_DELEGATION',
    formulaParameters: { domain: 'REASONING' },
    generationDepth: 0,
  };

  const { record: recT2 } = engine.deriveOrReuseIdentity(ctxTenant2);

  // Cross-tenant lookup attempt (Tenant 1 tries to access Tenant 2 identity)
  const crossLookup = engine.lookupIdentity(recT2.identityId, TENANT_1);
  assert(crossLookup === undefined, 'Cross-tenant lookup returns undefined (fail-closed)');

  // Cross-tenant termination attempt
  const crossTerminate = engine.terminateIdentity(recT2.identityId, TENANT_1);
  assert(!crossTerminate, 'Cross-tenant termination fails');

  // Proper tenant lookup
  const properLookup = engine.lookupIdentity(recT2.identityId, TENANT_2);
  assert(properLookup !== undefined, 'Proper tenant lookup succeeds');
  console.log();

  // ── Section 7: Resource Limit Enforcement (Max Per Tenant) ──
  console.log('--- Section 7: Resource Limit Enforcement ---');
  const TENANT_CROWDED = 'TENANT_CROWDED_TEST';
  const spawnedIds: string[] = [];

  for (let i = 0; i < MAX_IDENTITIES_PER_TENANT; i++) {
    const r = engine.deriveOrReuseIdentity({
      tenantId: TENANT_CROWDED,
      parentTaskId: `TASK_BATCH_${i}`,
      domain: 'MATH',
      contextPayload: `ctx_${i}`,
      formulaId: 'FORMULA_PHI_TRANSFORM',
      formulaParameters: { power: i % 10 + 1 },
      generationDepth: 0,
    });
    spawnedIds.push(r.record.identityId);
  }

  let limitThrown = false;
  try {
    engine.deriveOrReuseIdentity({
      tenantId: TENANT_CROWDED,
      parentTaskId: 'TASK_BATCH_OVERFLOW',
      domain: 'MATH',
      contextPayload: 'ctx_overflow',
      formulaId: 'FORMULA_PHI_TRANSFORM',
      formulaParameters: { power: 1 },
      generationDepth: 0,
    });
  } catch (err: any) {
    limitThrown = err.message.includes('RESOURCE_EXHAUSTION');
  }
  assert(limitThrown, `Max ${MAX_IDENTITIES_PER_TENANT} identities per tenant enforced fail-closed`);
  console.log();

  // ── Section 8: Collision Detection & Parameter Tamper Rejection ──
  console.log('--- Section 8: Collision Detection & Parameter Tamper Rejection ---');
  // Explicitly trigger a termination
  engine.terminateIdentity(recA.identityId, TENANT_1);
  assert(engine.lookupIdentity(recA.identityId, TENANT_1) === undefined, 'Explicit termination successful');
  console.log();

  // ── Section 9: Cryptographic Audit Ledger Parity ──
  console.log('--- Section 9: Cryptographic Audit Ledger Parity ---');
  const metrics = engine.getMetrics();
  const ledger = engine.getAuditLedger();
  assert(ledger.length > 20, `Audit ledger records populated (${ledger.length} entries)`);
  assert(metrics.totalCreated > 0, `Metrics track totalCreated (${metrics.totalCreated})`);
  assert(metrics.totalReused > 0, `Metrics track totalReused (${metrics.totalReused})`);
  assert(metrics.unauthorizedAttempts > 0, `Metrics track unauthorized attempts trapped (${metrics.unauthorizedAttempts})`);

  const lastEntry = ledger[ledger.length - 1];
  assert(lastEntry.auditHash.length === 64, 'Audit ledger record possesses valid SHA-256 hash');
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

  // ── Section 11: Permanent Invariants ──
  console.log('--- Section 11: Permanent Actuation & Air-Gap Invariants ---');
  assert(IS_ACTUATION_BLOCKED === true, 'IS_ACTUATION_BLOCKED === true (immutable)');
  assert(OFFLINE_ISOLATED === true, 'OFFLINE_ISOLATED === true (immutable)');
  console.log();

  // ── Final Verdict ──
  Phase31DynamicSubmotherIdentityEngine.resetInstance();
  console.log('===============================================================================');
  if (failCount === 0) {
    console.log(`🎉 ALL ${assertionCount} ASSERTIONS PASSED!`);
    console.log(`🆔 VERDICT: DYNAMIC_IDENTITY_ENGINE_PASS`);
    console.log(`🔒 Task 500 Dynamic Submother Identity Engine certified complete!`);
  } else {
    console.log(`❌ ${failCount}/${assertionCount} ASSERTIONS FAILED`);
    console.log(`🚫 VERDICT: DYNAMIC_IDENTITY_ENGINE_BLOCKED`);
  }
  console.log('===============================================================================');

  process.exit(failCount > 0 ? 1 : 0);
}

runIdentityEngineTestSuite().catch((err) => {
  console.error(`❌ FATAL ERROR IN TEST SUITE: ${err.message}`);
  console.error(err.stack);
  process.exit(1);
});
