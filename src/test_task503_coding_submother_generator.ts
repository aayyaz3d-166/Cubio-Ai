/**
 * ============================================================================
 * CUBiO AI — PHASE 31 TASK 503: CODING SUBMOTHER TEST SUITE
 * src/test_task503_coding_submother_generator.ts
 * ============================================================================
 *
 * Forensic test suite for the Coding Submother Generator.
 *
 * Sections:
 *   1. Pre-Test Sovereign Asset Custody Check
 *   2. Procedural Code Modalities (Analysis, Generation, Debugging, Explanation)
 *   3. Zero Trainable Weights & Non-Trainable Invariant Enforcement
 *   4. Deterministic Code Transformation Parity Verification
 *   5. Sandboxed Security Traps (Blocking eval, exec, fs, network injection)
 *   6. Payload Size Bounds Enforcement (Oversized Code Snippets Trapped)
 *   7. TTL Expiration & Execution Timeout Trapping
 *   8. Cryptographic Audit Ledger Parity & Mother Core Provenance
 *   9. Post-Test Sovereign Asset Custody Check
 *  10. Permanent Actuation & Air-Gap Invariants
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
  Phase31CodingSubmotherGenerator,
  CODING_GENERATOR_VERSION,
  CODING_GENERATOR_ID,
  MAX_CODE_PAYLOAD_BYTES,
  type CodingTaskType,
} from './cubio/submother/phase31CodingSubmotherGenerator';
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

async function runCodingGeneratorTestSuite(): Promise<void> {
  console.log('===============================================================================');
  console.log('💻 CUBiO AI — PHASE 31 TASK 503: CODING SUBMOTHER GENERATOR TEST SUITE');
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
  Phase31CodingSubmotherGenerator.resetInstance();
  const generator = Phase31CodingSubmotherGenerator.getInstance();

  const TENANT_ID = 'TENANT_DEV_CORP';

  // ── Section 2: Procedural Code Modalities Across 4 Tasks ──
  console.log('--- Section 2: Procedural Code Modalities Across 4 Tasks ---');
  const tasks: CodingTaskType[] = ['ANALYSIS', 'GENERATION', 'DEBUGGING', 'EXPLANATION'];
  const testSnippet = 'var count = 10;\nfunction getFactorial(n) {\n  if (n == 0) return 1;\n  return n * getFactorial(n - 1);\n}';

  for (const taskType of tasks) {
    const instance = generator.spawnCodingSubmother({
      tenantId: TENANT_ID,
      parentTaskId: `TASK_CODE_${taskType}`,
      taskType,
      language: 'typescript',
      codeSnippet: testSnippet,
    });

    assert(instance.instanceId.startsWith('CSM_'), `Instance ID has CSM_ prefix for ${taskType}`);
    assert(instance.trainableWeights === 0, `Trainable weights strictly 0 for ${taskType}`);
    assert(instance.independentWeightsCreated === false, `independentWeightsCreated strictly false for ${taskType}`);
    assert(instance.delegatesToMotherCore === true, `delegatesToMotherCore is true for ${taskType}`);
    assert(instance.isSandboxed === true, `isSandboxed is strictly true for ${taskType}`);

    const result = generator.executeCodingTask(instance.instanceId, testSnippet);
    assert(result.status === 'SUCCESS', `Execution success for modality ${taskType}`);
    assert(result.processedCode.length > 0, `Non-empty processedCode returned for ${taskType}`);
    assert(result.outputDigest.length === 64, `Output digest is valid 64-char SHA-256 for ${taskType}`);
  }
  console.log();

  // ── Section 3: Non-Trainable & Zero-Weight Invariant Enforcement ──
  console.log('--- Section 3: Non-Trainable & Zero-Weight Invariant Enforcement ---');
  const metrics = generator.getMetrics();
  assert(metrics.totalSpawned === 4, 'Metrics record exactly 4 spawned coding instances');
  assert(metrics.totalProcessed === 4, 'Metrics record exactly 4 processed coding instances');
  console.log();

  // ── Section 4: Deterministic Code Transformation Parity ──
  console.log('--- Section 4: Deterministic Code Transformation Parity ---');
  const instDet1 = generator.spawnCodingSubmother({
    tenantId: TENANT_ID,
    parentTaskId: 'TASK_DET_CODE',
    taskType: 'DEBUGGING',
    language: 'typescript',
    codeSnippet: 'var x = 5;\nif (x == 5) { var y = 10; }',
  });
  const resDet1 = generator.executeCodingTask(instDet1.instanceId, 'var x = 5;\nif (x == 5) { var y = 10; }');

  const instDet2 = generator.spawnCodingSubmother({
    tenantId: TENANT_ID,
    parentTaskId: 'TASK_DET_CODE',
    taskType: 'DEBUGGING',
    language: 'typescript',
    codeSnippet: 'var x = 5;\nif (x == 5) { var y = 10; }',
  });
  const resDet2 = generator.executeCodingTask(instDet2.instanceId, 'var x = 5;\nif (x == 5) { var y = 10; }');

  assert(resDet1.outputDigest === resDet2.outputDigest, 'Deterministic code debug parity (0 drift)');
  assert(resDet1.processedCode === resDet2.processedCode, 'Deterministic transformed code equality (0 drift)');
  assert(resDet1.processedCode.includes('const x = 5;'), 'Debugging corrected var to const');
  assert(resDet1.processedCode.includes('=== 5'), 'Debugging corrected == to ===');
  console.log();

  // ── Section 5: Sandboxed Security Traps ──
  console.log('--- Section 5: Sandboxed Security Traps ---');
  const maliciousSnippets = [
    'const x = eval("2 + 2");',
    'const cp = require("child_process"); cp.exec("rm -rf /");',
    'const net = require("net"); net.connect(8080);',
    'fs.unlinkSync("important.db");',
    'fetch("https://malicious-cloud-llm.com/api");',
  ];

  for (const malicious of maliciousSnippets) {
    const instMal = generator.spawnCodingSubmother({
      tenantId: TENANT_ID,
      parentTaskId: 'TASK_SEC_TEST',
      taskType: 'ANALYSIS',
      language: 'javascript',
      codeSnippet: malicious,
    });

    const resMal = generator.executeCodingTask(instMal.instanceId, malicious);
    assert(resMal.status === 'SECURITY_VIOLATION', `Malicious code '${malicious.split('(')[0]}' trapped fail-closed`);
    assert(resMal.rejectionReason?.includes('SECURITY_VIOLATION') === true, 'Reason identifies SECURITY_VIOLATION');
  }
  console.log();

  // ── Section 6: Payload Size Bounds Enforcement ──
  console.log('--- Section 6: Payload Size Bounds Enforcement ---');
  const oversizedCode = '// Code line\n'.repeat(2000); // Exceeds 16 KB
  let oversizedThrown = false;
  try {
    generator.spawnCodingSubmother({
      tenantId: TENANT_ID,
      parentTaskId: 'TASK_OVERSIZED',
      taskType: 'ANALYSIS',
      language: 'typescript',
      codeSnippet: oversizedCode,
    });
  } catch (err: any) {
    oversizedThrown = err.message.includes('PAYLOAD_OVERSIZED');
  }
  assert(oversizedThrown, `Payload > ${MAX_CODE_PAYLOAD_BYTES} bytes rejected fail-closed`);
  console.log();

  // ── Section 7: TTL Expiration & Execution Timeout Trapping ──
  console.log('--- Section 7: TTL Expiration & Execution Timeout Trapping ---');
  const shortLivingInst = generator.spawnCodingSubmother({
    tenantId: TENANT_ID,
    parentTaskId: 'TASK_QUICK_EXPIRE_CODE',
    taskType: 'GENERATION',
    language: 'python',
    codeSnippet: 'print("hello")',
    timeoutMs: 25, // 25 ms expiration
  });

  await new Promise(resolve => setTimeout(resolve, 40));

  const timeoutResult = generator.executeCodingTask(shortLivingInst.instanceId, 'print("hello")');
  assert(timeoutResult.status === 'TIMED_OUT', 'Expired coding instance execution returns TIMED_OUT');
  console.log();

  // ── Section 8: Cryptographic Audit Ledger Parity & Mother Core Provenance ──
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
  Phase31CodingSubmotherGenerator.resetInstance();
  console.log('===============================================================================');
  if (failCount === 0) {
    console.log(`🎉 ALL ${assertionCount} ASSERTIONS PASSED!`);
    console.log(`💻 VERDICT: CODING_GENERATOR_PASS`);
    console.log(`🔒 Task 503 Coding Submother Generator certified complete!`);
  } else {
    console.log(`❌ ${failCount}/${assertionCount} ASSERTIONS FAILED`);
    console.log(`🚫 VERDICT: CODING_GENERATOR_BLOCKED`);
  }
  console.log('===============================================================================');

  process.exit(failCount > 0 ? 1 : 0);
}

runCodingGeneratorTestSuite().catch((err) => {
  console.error(`❌ FATAL ERROR IN TEST SUITE: ${err.message}`);
  console.error(err.stack);
  process.exit(1);
});
