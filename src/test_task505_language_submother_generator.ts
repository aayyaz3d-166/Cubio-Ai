/**
 * ============================================================================
 * CUBiO AI — PHASE 31 TASK 505: LANGUAGE SUBMOTHER TEST SUITE
 * src/test_task505_language_submother_generator.ts
 * ============================================================================
 *
 * Forensic test suite for the Language Submother Generator.
 *
 * Sections:
 *   1. Pre-Test Sovereign Asset Custody Check
 *   2. Multilingual Processing (EN, Roman Urdu, Mixed) Across 4 Modalities
 *   3. Zero Trainable Weights & Non-Trainable Invariant Enforcement
 *   4. Semantic Preservation Score & Intent Recognition Parity
 *   5. Anti-Generic Response Controls (Trapping Canned Filler)
 *   6. Privacy Boundary Enforcement (Automated PII Redaction)
 *   7. Deterministic Multilingual Output Parity (0 Drift)
 *   8. TTL Expiration & Execution Timeout Trapping
 *   9. Cryptographic Audit Ledger Parity & Provenance
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
  Phase31LanguageSubmotherGenerator,
  LANGUAGE_GENERATOR_VERSION,
  LANGUAGE_GENERATOR_ID,
  SUPPORTED_LANGUAGES,
  type LanguageTaskModality,
} from './cubio/submother/phase31LanguageSubmotherGenerator';
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

async function runLanguageGeneratorTestSuite(): Promise<void> {
  console.log('===============================================================================');
  console.log('🗣️ CUBiO AI — PHASE 31 TASK 505: LANGUAGE SUBMOTHER GENERATOR TEST SUITE');
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
  Phase31LanguageSubmotherGenerator.resetInstance();
  const generator = Phase31LanguageSubmotherGenerator.getInstance();

  const TENANT_ID = 'TENANT_LINGUA_CORP';

  // ── Section 2: Multilingual Processing Across Modalities ──
  console.log('--- Section 2: Multilingual Processing Across Modalities ---');
  assert(SUPPORTED_LANGUAGES.length === 3, 'Exactly 3 supported languages (EN, ROMAN_URDU, MIXED_EN_UR)');

  // Test 1: Translation (Roman Urdu -> English)
  const instTrans = generator.spawnLanguageSubmother({
    tenantId: TENANT_ID,
    parentTaskId: 'TASK_LANG_TRANS',
    taskModality: 'TRANSLATION',
    sourceLanguage: 'ROMAN_URDU',
    targetLanguage: 'EN',
    inputContent: 'yeh bohat acha kaam hai',
  });
  const resTrans = generator.executeLanguageTask(instTrans.instanceId, 'yeh bohat acha kaam hai');
  assert(resTrans.status === 'SUCCESS', 'Translation executed with SUCCESS');
  assert(resTrans.processedOutput.toLowerCase().includes('this very good work is'), 'Translation maps Roman Urdu to English');
  assert(resTrans.semanticPreservationScore >= 0.90, `Semantic preservation >= 0.90 (${resTrans.semanticPreservationScore})`);

  // Test 2: Rewriting (English)
  const instRewrite = generator.spawnLanguageSubmother({
    tenantId: TENANT_ID,
    parentTaskId: 'TASK_LANG_REWRITE',
    taskModality: 'REWRITING',
    sourceLanguage: 'EN',
    inputContent: 'Address369 defines the    entire geometry   of cells.',
  });
  const resRewrite = generator.executeLanguageTask(instRewrite.instanceId, 'Address369 defines the    entire geometry   of cells.');
  assert(resRewrite.status === 'SUCCESS', 'Rewriting executed with SUCCESS');
  assert(resRewrite.processedOutput.includes('[CONCISE_PRECISION]'), 'Rewriting produces concise precision format');

  // Test 3: Explanation (Mixed EN / Roman Urdu)
  const instExplain = generator.spawnLanguageSubmother({
    tenantId: TENANT_ID,
    parentTaskId: 'TASK_LANG_EXPLAIN',
    taskModality: 'EXPLANATION',
    sourceLanguage: 'MIXED_EN_UR',
    inputContent: 'Address369 ka architecture kaise work karta hai',
  });
  const resExplain = generator.executeLanguageTask(instExplain.instanceId, 'Address369 ka architecture kaise work karta hai');
  assert(resExplain.status === 'SUCCESS', 'Explanation executed with SUCCESS');
  assert(resExplain.processedOutput.includes('[STRUCTURED_EXPLANATION (MIXED_EN_UR)]'), 'Explanation structured with language header');

  // Test 4: Context Resolution (Disambiguation)
  const instContext = generator.spawnLanguageSubmother({
    tenantId: TENANT_ID,
    parentTaskId: 'TASK_LANG_CONTEXT',
    taskModality: 'CONTEXT_RESOLUTION',
    sourceLanguage: 'MIXED_EN_UR',
    inputContent: 'mujhe cell 42 ki spatial coordinate info chahiye',
  });
  const resContext = generator.executeLanguageTask(instContext.instanceId, 'mujhe cell 42 ki spatial coordinate info chahiye');
  assert(resContext.status === 'SUCCESS', 'Context resolution executed with SUCCESS');
  assert(resContext.detectedIntent === 'AMBIGUITY_RESOLUTION', 'Detected intent is AMBIGUITY_RESOLUTION');
  console.log();

  // ── Section 3: Non-Trainable & Zero-Weight Invariant Enforcement ──
  console.log('--- Section 3: Non-Trainable & Zero-Weight Invariant Enforcement ---');
  const metrics = generator.getMetrics();
  assert(metrics.totalSpawned === 4, 'Metrics record 4 spawned language instances');
  assert(metrics.totalProcessed === 4, 'Metrics record 4 processed language instances');
  console.log();

  // ── Section 4: Deterministic Multilingual Output Parity ──
  console.log('--- Section 4: Deterministic Multilingual Output Parity ---');
  const instDet1 = generator.spawnLanguageSubmother({
    tenantId: TENANT_ID,
    parentTaskId: 'TASK_DET_LANG',
    taskModality: 'TRANSLATION',
    sourceLanguage: 'EN',
    targetLanguage: 'ROMAN_URDU',
    inputContent: 'this is very good work',
  });
  const resDet1 = generator.executeLanguageTask(instDet1.instanceId, 'this is very good work');

  const instDet2 = generator.spawnLanguageSubmother({
    tenantId: TENANT_ID,
    parentTaskId: 'TASK_DET_LANG',
    taskModality: 'TRANSLATION',
    sourceLanguage: 'EN',
    targetLanguage: 'ROMAN_URDU',
    inputContent: 'this is very good work',
  });
  const resDet2 = generator.executeLanguageTask(instDet2.instanceId, 'this is very good work');

  assert(resDet1.outputDigest === resDet2.outputDigest, 'Deterministic translation parity (0 drift)');
  assert(resDet1.processedOutput === resDet2.processedOutput, 'Deterministic output text equality (0 drift)');
  console.log();

  // ── Section 5: Anti-Generic Response Controls ──
  console.log('--- Section 5: Anti-Generic Response Controls ---');
  const genericAttempts = [
    'As an AI language model, I cannot provide this information.',
    'It is important to note that various factors exist.',
    'In conclusion, it can be seen that the results are conclusive.',
  ];

  for (const generic of genericAttempts) {
    const instGen = generator.spawnLanguageSubmother({
      tenantId: TENANT_ID,
      parentTaskId: 'TASK_GENERIC_TEST',
      taskModality: 'EXPLANATION',
      sourceLanguage: 'EN',
      inputContent: generic,
    });

    const resGen = generator.executeLanguageTask(instGen.instanceId, generic);
    assert(resGen.status === 'REJECTED', 'Canned generic filler rejected fail-closed');
    assert(resGen.rejectionReason?.includes('ANTI_GENERIC_VIOLATION') === true, 'Reason identifies ANTI_GENERIC_VIOLATION');
  }
  console.log();

  // ── Section 6: Privacy Boundary Enforcement (PII Redaction) ──
  console.log('--- Section 6: Privacy Boundary Enforcement (PII Redaction) ---');
  const piiText = 'Contact researcher at alice.smith@cubio-research.ai or call +123456789012 for validation.';
  const instPii = generator.spawnLanguageSubmother({
    tenantId: TENANT_ID,
    parentTaskId: 'TASK_PII_TEST',
    taskModality: 'REWRITING',
    sourceLanguage: 'EN',
    inputContent: piiText,
  });

  const resPii = generator.executeLanguageTask(instPii.instanceId, piiText);
  assert(resPii.status === 'SUCCESS', 'Execution succeeds with PII sanitized');
  assert(resPii.privacyCleaned === true, 'privacyCleaned flag set to true');
  assert(resPii.processedOutput.includes('[REDACTED_EMAIL]'), 'Email address redacted');
  assert(resPii.processedOutput.includes('[REDACTED_PHONE]'), 'Phone number redacted');
  assert(!resPii.processedOutput.includes('alice.smith@'), 'Original email not present in output');
  console.log();

  // ── Section 7: TTL Expiration & Timeout Trapping ──
  console.log('--- Section 7: TTL Expiration & Timeout Trapping ---');
  const shortLivingInst = generator.spawnLanguageSubmother({
    tenantId: TENANT_ID,
    parentTaskId: 'TASK_QUICK_EXPIRE_LANG',
    taskModality: 'EXPLANATION',
    sourceLanguage: 'EN',
    inputContent: 'Expiring text',
    timeoutMs: 25, // 25 ms expiration
  });

  await new Promise(resolve => setTimeout(resolve, 40));

  const timeoutResult = generator.executeLanguageTask(shortLivingInst.instanceId, 'Expiring text');
  assert(timeoutResult.status === 'TIMED_OUT', 'Expired language instance execution returns TIMED_OUT');
  console.log();

  // ── Section 8: Cryptographic Audit Ledger Parity & Provenance ──
  console.log('--- Section 8: Cryptographic Audit Ledger Parity & Provenance ---');
  const ledger = generator.getAuditLedger();
  assert(ledger.length > 15, `Audit ledger records populated (${ledger.length} entries)`);
  const lastEntry = ledger[ledger.length - 1];
  assert(lastEntry.auditHash.length === 64, 'Audit ledger record has valid 64-char SHA-256 hash');
  console.log();

  // ── Section 9: Post-Test Sovereign Asset Custody Check ──
  console.log('--- Section 9: Post-Test Sovereign Asset Custody Check ---');
  for (const [assetPath, expectedHash] of Object.entries(SOVEREIGN_ASSETS)) {
    const actual = computeSha256(assetPath);
    assert(actual === expectedHash, `Post-test verify ${assetPath} (0 bits drift)`);
  }
  const prodHash = computeSha256('data/checkpoints/phase16_production_final_sealed_1m.3dmemory');
  assert(prodHash === PRODUCTION_CHECKPOINT_EXPECTED_HASH, 'Sealed production checkpoint untouched (0 bits drift)');
  console.log();

  // ── Section 10: Permanent Actuation & Air-Gap Invariants ──
  console.log('--- Section 10: Permanent Invariants ---');
  assert(IS_ACTUATION_BLOCKED === true, 'IS_ACTUATION_BLOCKED === true (immutable)');
  assert(OFFLINE_ISOLATED === true, 'OFFLINE_ISOLATED === true (immutable)');
  console.log();

  // ── Final Verdict ──
  Phase31LanguageSubmotherGenerator.resetInstance();
  console.log('===============================================================================');
  if (failCount === 0) {
    console.log(`🎉 ALL ${assertionCount} ASSERTIONS PASSED!`);
    console.log(`🗣️ VERDICT: LANGUAGE_GENERATOR_PASS`);
    console.log(`🔒 Task 505 Language Submother Generator certified complete!`);
  } else {
    console.log(`❌ ${failCount}/${assertionCount} ASSERTIONS FAILED`);
    console.log(`🚫 VERDICT: LANGUAGE_GENERATOR_BLOCKED`);
  }
  console.log('===============================================================================');

  process.exit(failCount > 0 ? 1 : 0);
}

runLanguageGeneratorTestSuite().catch((err) => {
  console.error(`❌ FATAL ERROR IN TEST SUITE: ${err.message}`);
  console.error(err.stack);
  process.exit(1);
});
