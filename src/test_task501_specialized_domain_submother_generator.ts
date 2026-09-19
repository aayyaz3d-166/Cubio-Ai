/**
 * ============================================================================
 * CUBiO AI — PHASE 31 TASK 501: DOMAIN GENERATOR TEST SUITE
 * src/test_task501_specialized_domain_submother_generator.ts
 * ============================================================================
 *
 * Forensic test suite for the Specialized Domain Submother Generator.
 *
 * Sections:
 *   1. Pre-Test Sovereign Asset Custody Check
 *   2. Multi-Domain Generation Across All 6 Authorized Domains
 *   3. Zero Independent Weights & Non-Trainable Invariant Enforcement
 *   4. Deterministic Execution & Output Parity Verification
 *   5. Unsupported Domain & Unauthorized Capability Rejection (Fail-Closed)
 *   6. Concurrency Ceiling & Recursion Depth Limit Enforcement
 *   7. TTL Expiration & Automatic Cleanup Sweep
 *   8. Cryptographic Provenance & Digest Integrity
 *   9. Immutable Audit Ledger Parity
 *  10. Post-Test Sovereign Asset Custody Check
 *  11. Permanent Invariants (Actuation & Offline Isolation)
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
  Phase31SpecializedDomainSubmotherGenerator,
  DOMAIN_GENERATOR_VERSION,
  DOMAIN_GENERATOR_ID,
  AUTHORIZED_DOMAINS,
  MAX_CONCURRENT_DOMAIN_SUBMOTHERS,
  MAX_DOMAIN_GENERATION_DEPTH,
  type SpecializedDomain,
} from './cubio/submother/phase31SpecializedDomainSubmotherGenerator';
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

async function runDomainGeneratorTestSuite(): Promise<void> {
  console.log('===============================================================================');
  console.log('🔬 CUBiO AI — PHASE 31 TASK 501: DOMAIN SUBMOTHER GENERATOR TEST SUITE');
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
  Phase31SpecializedDomainSubmotherGenerator.resetInstance();
  const generator = Phase31SpecializedDomainSubmotherGenerator.getInstance();

  const TENANT_ID = 'TENANT_DOMAIN_CORP';

  // ── Section 2: Multi-Domain Generation Across All 6 Authorized Domains ──
  console.log('--- Section 2: Multi-Domain Generation Across All 6 Authorized Domains ---');
  assert(AUTHORIZED_DOMAINS.length === 6, 'Exactly 6 authorized domains defined');

  const domainConfigurations: Array<{ domain: SpecializedDomain; formulaId: string; params: Record<string, any> }> = [
    { domain: 'REASONING', formulaId: 'FORMULA_DOMAIN_DELEGATION', params: { domain: 'REASONING' } },
    { domain: 'CODING', formulaId: 'FORMULA_DOMAIN_DELEGATION', params: { domain: 'CODING' } },
    { domain: 'MATHEMATICS', formulaId: 'FORMULA_PHI_TRANSFORM', params: { power: 4 } },
    { domain: 'LANGUAGE', formulaId: 'FORMULA_DOMAIN_DELEGATION', params: { domain: 'LANGUAGE' } },
    { domain: 'MEMORY', formulaId: 'FORMULA_SPATIAL_PROJECTION', params: { cellId: 64 } },
    { domain: 'PROBLEM_SOLVING', formulaId: 'FORMULA_EPISTEMIC_BOUND', params: { confidenceScore: 0.88 } },
  ];

  for (const cfg of domainConfigurations) {
    const instance = generator.generateDomainSubmother({
      tenantId: TENANT_ID,
      parentTaskId: `TASK_DOM_${cfg.domain}`,
      domain: cfg.domain,
      formulaId: cfg.formulaId,
      formulaParameters: cfg.params,
      contextPayload: `context:${cfg.domain}`,
      generationDepth: 1,
    });

    assert(instance.domain === cfg.domain, `Generated domain matches ${cfg.domain}`);
    assert(instance.trainableWeights === 0, `Trainable weights strictly 0 for ${cfg.domain}`);
    assert(instance.independentWeightsCreated === false, `independentWeightsCreated is false for ${cfg.domain}`);
    assert(instance.delegatesToMotherCore === true, `delegatesToMotherCore is true for ${cfg.domain}`);
    assert(instance.motherCoreParameters === TOTAL_NATIVE_PARAMETERS, `Parameters match native inventory (${TOTAL_NATIVE_PARAMETERS})`);

    // Execute instance
    const execRes = generator.executeDomainSubmother(instance.instanceId, cfg.params);
    assert(execRes.status === 'SUCCESS', `Execution success for domain ${cfg.domain}`);
    assert(execRes.output.domain === cfg.domain, `Execution output retains domain ${cfg.domain}`);
    assert(execRes.outputDigest.length === 64, `Output digest is valid 64-char SHA-256`);
  }
  console.log();

  // ── Section 3: Non-Trainable & Zero-Weight Invariant Enforcement ──
  console.log('--- Section 3: Non-Trainable & Zero-Weight Invariant Enforcement ---');
  const metrics = generator.getMetrics();
  assert(metrics.totalSpawned === 6, 'Exactly 6 domain submother instances spawned');
  assert(metrics.totalExecuted === 6, 'Exactly 6 domain submother instances executed');
  console.log();

  // ── Section 4: Deterministic Execution & Output Parity ──
  console.log('--- Section 4: Deterministic Execution & Output Parity ---');
  const instDet1 = generator.generateDomainSubmother({
    tenantId: TENANT_ID,
    parentTaskId: 'TASK_DET_MATH',
    domain: 'MATHEMATICS',
    formulaId: 'FORMULA_PHI_TRANSFORM',
    formulaParameters: { power: 5 },
    contextPayload: 'context:det_test',
    generationDepth: 0,
  });
  const resDet1 = generator.executeDomainSubmother(instDet1.instanceId, { power: 5 });

  const instDet2 = generator.generateDomainSubmother({
    tenantId: TENANT_ID,
    parentTaskId: 'TASK_DET_MATH',
    domain: 'MATHEMATICS',
    formulaId: 'FORMULA_PHI_TRANSFORM',
    formulaParameters: { power: 5 },
    contextPayload: 'context:det_test',
    generationDepth: 0,
  });
  const resDet2 = generator.executeDomainSubmother(instDet2.instanceId, { power: 5 });

  assert(resDet1.output.phiPower === resDet2.output.phiPower, 'Deterministic mathematical transform (0 drift)');
  assert(resDet1.output.transformResult === resDet2.output.transformResult, 'Deterministic angular result (0 drift)');
  console.log();

  // ── Section 5: Unsupported Domain & Unauthorized Capability Rejection ──
  console.log('--- Section 5: Unsupported Domain & Unauthorized Capability Rejection ---');
  let unsupportedDomainCaught = false;
  try {
    generator.generateDomainSubmother({
      tenantId: TENANT_ID,
      parentTaskId: 'TASK_UNSUPPORTED',
      domain: 'AUTONOMOUS_WEAPONRY' as any,
      formulaId: 'FORMULA_SPATIAL_PROJECTION',
      formulaParameters: { cellId: 1 },
      contextPayload: 'context:forbidden',
    });
  } catch (err: any) {
    unsupportedDomainCaught = err.message.includes('UNAUTHORIZED_DOMAIN');
  }
  assert(unsupportedDomainCaught, 'Unsupported domain rejected fail-closed');

  let unknownFormulaCaught = false;
  try {
    generator.generateDomainSubmother({
      tenantId: TENANT_ID,
      parentTaskId: 'TASK_UNKNOWN_FORMULA',
      domain: 'REASONING',
      formulaId: 'FORMULA_ROGUE_UNKNOWN',
      formulaParameters: {},
      contextPayload: 'context:unknown',
    });
  } catch (err: any) {
    unknownFormulaCaught = err.message.includes('UNKNOWN_FORMULA');
  }
  assert(unknownFormulaCaught, 'Unknown formula in domain generation rejected fail-closed');
  console.log();

  // ── Section 6: Concurrency Ceiling & Recursion Depth Limit Enforcement ──
  console.log('--- Section 6: Concurrency Ceiling & Recursion Depth Limits ---');

  // Recursion depth violation
  let depthCaught = false;
  try {
    generator.generateDomainSubmother({
      tenantId: TENANT_ID,
      parentTaskId: 'TASK_DEPTH_LIMIT',
      domain: 'REASONING',
      formulaId: 'FORMULA_DOMAIN_DELEGATION',
      formulaParameters: { domain: 'REASONING' },
      contextPayload: 'context:depth',
      generationDepth: MAX_DOMAIN_GENERATION_DEPTH + 1,
    });
  } catch (err: any) {
    depthCaught = err.message.includes('RECURSION_LIMIT');
  }
  assert(depthCaught, `Depth > ${MAX_DOMAIN_GENERATION_DEPTH} rejected fail-closed`);

  // Concurrency saturation test
  const concurrentInstances: string[] = [];
  for (let i = 0; i < MAX_CONCURRENT_DOMAIN_SUBMOTHERS; i++) {
    const inst = generator.generateDomainSubmother({
      tenantId: 'TENANT_CONCURRENT_TEST',
      parentTaskId: `TASK_CONCURRENT_${i}`,
      domain: 'REASONING',
      formulaId: 'FORMULA_DOMAIN_DELEGATION',
      formulaParameters: { domain: 'REASONING' },
      contextPayload: `context:${i}`,
      generationDepth: 0,
    });
    concurrentInstances.push(inst.instanceId);
  }

  let concurrencyCaught = false;
  try {
    generator.generateDomainSubmother({
      tenantId: 'TENANT_CONCURRENT_TEST',
      parentTaskId: 'TASK_CONCURRENT_OVERFLOW',
      domain: 'REASONING',
      formulaId: 'FORMULA_DOMAIN_DELEGATION',
      formulaParameters: { domain: 'REASONING' },
      contextPayload: 'context:overflow',
      generationDepth: 0,
    });
  } catch (err: any) {
    concurrencyCaught = err.message.includes('RESOURCE_EXHAUSTION');
  }
  assert(concurrencyCaught, `Concurrency limit (${MAX_CONCURRENT_DOMAIN_SUBMOTHERS}) enforced fail-closed`);

  // Prune concurrent instances
  for (const cid of concurrentInstances) {
    generator.terminateDomainSubmother(cid);
  }
  assert(generator.getActiveCount() === 0, 'All concurrent instances terminated cleanly');
  console.log();

  // ── Section 7: TTL Expiration & Automatic Cleanup Sweep ──
  console.log('--- Section 7: TTL Expiration & Automatic Cleanup Sweep ---');
  const shortLivingInst = generator.generateDomainSubmother({
    tenantId: TENANT_ID,
    parentTaskId: 'TASK_QUICK_EXPIRE',
    domain: 'MEMORY',
    formulaId: 'FORMULA_SPATIAL_PROJECTION',
    formulaParameters: { cellId: 10 },
    contextPayload: 'context:quick_expire',
    timeoutMs: 25, // 25 ms expiration
  });

  await new Promise(resolve => setTimeout(resolve, 40));

  const timeoutResult = generator.executeDomainSubmother(shortLivingInst.instanceId, { cellId: 10 });
  assert(timeoutResult.status === 'TIMED_OUT', 'Expired instance execution returns TIMED_OUT');
  console.log();

  // ── Section 8: Cryptographic Provenance & Digest Integrity ──
  console.log('--- Section 8: Cryptographic Provenance & Digest Integrity ---');
  const provInst = generator.generateDomainSubmother({
    tenantId: TENANT_ID,
    parentTaskId: 'TASK_PROV',
    domain: 'PROBLEM_SOLVING',
    formulaId: 'FORMULA_EPISTEMIC_BOUND',
    formulaParameters: { confidenceScore: 0.9 },
    contextPayload: 'context:prov',
  });
  assert(provInst.provenanceDigest.length === 64, 'Domain instance stamped with 64-char SHA-256 provenanceDigest');
  generator.terminateDomainSubmother(provInst.instanceId);
  console.log();

  // ── Section 9: Immutable Audit Ledger Parity ──
  console.log('--- Section 9: Immutable Audit Ledger Parity ---');
  const ledger = generator.getAuditLedger();
  assert(ledger.length > 20, `Audit ledger records populated (${ledger.length} entries)`);
  const lastEntry = ledger[ledger.length - 1];
  assert(lastEntry.auditHash.length === 64, 'Audit ledger entry has valid SHA-256 hash');
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
  Phase31SpecializedDomainSubmotherGenerator.resetInstance();
  console.log('===============================================================================');
  if (failCount === 0) {
    console.log(`🎉 ALL ${assertionCount} ASSERTIONS PASSED!`);
    console.log(`🔬 VERDICT: DOMAIN_GENERATOR_PASS`);
    console.log(`🔒 Task 501 Specialized Domain Submother Generator certified complete!`);
  } else {
    console.log(`❌ ${failCount}/${assertionCount} ASSERTIONS FAILED`);
    console.log(`🚫 VERDICT: DOMAIN_GENERATOR_BLOCKED`);
  }
  console.log('===============================================================================');

  process.exit(failCount > 0 ? 1 : 0);
}

runDomainGeneratorTestSuite().catch((err) => {
  console.error(`❌ FATAL ERROR IN TEST SUITE: ${err.message}`);
  console.error(err.stack);
  process.exit(1);
});
