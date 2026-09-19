/**
 * ============================================================================
 * CUBiO AI — PHASE 31 TASK 510 TEST SUITE
 * src/test_task510_submother_result_normalization.ts
 * ============================================================================
 *
 * Comprehensive validation of Submother Result Normalization Layer:
 *   1. Singleton pattern and initialization guards.
 *   2. Schema and canonical structure enforcement (`CANDIDATE_NORMALIZED`, `authoritativeEvaluationPending`).
 *   3. Rejection of malformed, non-object, and empty raw outputs.
 *   4. Rejection of unauthorized outputs (tenant / task ID mismatch).
 *   5. Rejection of provenance-free outputs (missing submotherId, formulaId, originatingStateHash).
 *   6. Rejection of oversized payloads (> 64 KB).
 *   7. Rejection of contradictory epistemic states (FACT without evidence / low confidence, high confidence REFUSAL).
 *   8. Automatic sanitization of internal diagnostic wiring and memory pointers.
 *   9. Duplicate candidate payload rejection within batch.
 *  10. Bit-exact determinism across duplicate normalization batches (0 drift).
 *  11. Non-trainability verification (`trainableWeights: 0`, `independentWeightsCreated: false`).
 *  12. Pre/Post sovereign asset custody checks & permanent safety invariants.
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
  Phase31SubmotherResultNormalizationLayer,
  NORMALIZATION_LAYER_ID,
  NORMALIZATION_LAYER_VERSION,
  MAX_RESULT_PAYLOAD_BYTES,
  MAX_NORMALIZATION_BATCH_SIZE,
  RawSubmotherOutput
} from './cubio/submother/phase31SubmotherResultNormalizationLayer';
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
  console.log('RUNNING TASK 510 TEST SUITE: SUBMOTHER RESULT NORMALIZATION');
  console.log('================================================================');

  // Pre-Execution Sovereign Verification
  verifySovereignAssets('PRE-EXEC');

  // Test 1: Invariant Verification
  assert(IS_ACTUATION_BLOCKED === true, 'TEST 1: Actuation Blocked', 'IS_ACTUATION_BLOCKED must be true');
  assert(OFFLINE_ISOLATED === true, 'TEST 1: Offline Isolated', 'OFFLINE_ISOLATED must be true');

  // Test 2: Singleton Lifecycle & Layer Properties
  Phase31SubmotherResultNormalizationLayer.resetInstance();
  const layer1 = Phase31SubmotherResultNormalizationLayer.getInstance();
  const layer2 = Phase31SubmotherResultNormalizationLayer.getInstance();
  assert(layer1 === layer2, 'TEST 2: Singleton Instance Consistency', 'Must return identical singleton instance');
  assert(NORMALIZATION_LAYER_ID === 'CUBIO_SUBMOTHER_RESULT_NORMALIZATION_LAYER', 'TEST 2: Layer ID Correct');
  assert(NORMALIZATION_LAYER_VERSION === '31.510.0', 'TEST 2: Layer Version Correct');

  // Test 3: Canonical Candidate Normalization (Valid outputs across diverse epistemic states)
  const validOutputs: RawSubmotherOutput[] = [
    {
      tenantId: 'tenant_alpha',
      parentTaskId: 'task_001',
      submotherId: 'submother_reasoning_1',
      formulaId: 'FORMULA_DOMAIN_DELEGATION',
      domain: 'REASONING',
      originatingStateHash: 'hash_state_001',
      epistemicStatus: 'FACT',
      confidenceScore: 0.95,
      payload: JSON.stringify({ result: 'Verified topological sort order', items: [1, 2, 3] }),
      evidenceReferences: ['ev_proof_001', 'ev_source_db_record']
    },
    {
      tenantId: 'tenant_alpha',
      parentTaskId: 'task_001',
      submotherId: 'submother_coding_2',
      formulaId: 'FORMULA_DOMAIN_DELEGATION',
      domain: 'CODING',
      originatingStateHash: 'hash_state_002',
      epistemicStatus: 'DERIVATION',
      confidenceScore: 0.88,
      payload: 'function binarySearch(arr, target) { return -1; }',
      evidenceReferences: ['ev_ast_node_54']
    },
    {
      tenantId: 'tenant_alpha',
      parentTaskId: 'task_001',
      submotherId: 'submother_epistemic_3',
      formulaId: 'FORMULA_DOMAIN_DELEGATION',
      domain: 'LANGUAGE',
      originatingStateHash: 'hash_state_003',
      epistemicStatus: 'HYPOTHESIS',
      confidenceScore: 0.65,
      payload: 'Possible user intent relates to high concurrency event streaming.',
    },
    {
      tenantId: 'tenant_alpha',
      parentTaskId: 'task_001',
      submotherId: 'submother_epistemic_4',
      formulaId: 'FORMULA_DOMAIN_DELEGATION',
      domain: 'LANGUAGE',
      originatingStateHash: 'hash_state_004',
      epistemicStatus: 'REFUSAL',
      confidenceScore: 0.15,
      payload: 'Refused: Zero evidence available for ungrounded speculation.',
    }
  ];

  const batchSummary1 = layer1.normalizeBatch('tenant_alpha', 'task_001', validOutputs);
  assert(batchSummary1.totalSubmitted === 4, 'TEST 3: Total submitted matches', `Expected 4, got ${batchSummary1.totalSubmitted}`);
  assert(batchSummary1.totalAccepted === 4, 'TEST 3: Total accepted matches', `Expected 4, got ${batchSummary1.totalAccepted}`);
  assert(batchSummary1.totalRejected === 0, 'TEST 3: Total rejected is 0', `Expected 0, got ${batchSummary1.totalRejected}`);
  assert(batchSummary1.motherCoreModelId === CUBIO_NATIVE_MODEL_ID, 'TEST 3: Mother Core model ID bound');
  assert(batchSummary1.motherCoreParameters === TOTAL_NATIVE_PARAMETERS, 'TEST 3: Native parameter count matches', `${TOTAL_NATIVE_PARAMETERS}`);
  assert(batchSummary1.nonTrainableInvariantEnforced === true, 'TEST 3: Non-trainable invariant enforced');

  for (const cand of batchSummary1.normalizedCandidates) {
    assert(cand.candidateStatus === 'CANDIDATE_NORMALIZED', 'TEST 3: Status is strictly CANDIDATE_NORMALIZED', cand.candidateStatus);
    assert(cand.authoritativeEvaluationPending === true, 'TEST 3: authoritativeEvaluationPending is true');
    assert(cand.candidateId.startsWith('cand_norm_'), 'TEST 3: Canonical candidateId format', cand.candidateId);
    assert(cand.provenanceDigest.length === 64, 'TEST 3: SHA256 provenance digest valid');
    assert(cand.evidenceDigest.length === 64, 'TEST 3: SHA256 evidence digest valid');
  }

  // Test 4: Determinism Across Duplicate Normalization Invocations
  const batchSummary2 = layer1.normalizeBatch('tenant_alpha', 'task_001', validOutputs);
  assert(batchSummary1.batchParityDigest === batchSummary2.batchParityDigest, 'TEST 4: Batch parity digest matches across runs (0 drift)');
  assert(batchSummary1.normalizedCandidates[0].candidateId === batchSummary2.normalizedCandidates[0].candidateId, 'TEST 4: Candidate IDs identical across runs');
  assert(batchSummary1.normalizedCandidates[0].provenanceDigest === batchSummary2.normalizedCandidates[0].provenanceDigest, 'TEST 4: Provenance digests identical across runs');

  // Test 5: Rejection of Malformed / Non-Object Inputs
  const malformedOutputs: any[] = [
    null,
    'not an object',
    { tenantId: 'tenant_alpha', parentTaskId: 'task_001', payload: '' } // empty payload & missing provenance
  ];
  const malformedSummary = layer1.normalizeBatch('tenant_alpha', 'task_001', malformedOutputs);
  assert(malformedSummary.totalAccepted === 0, 'TEST 5: Zero accepted for malformed outputs');
  assert(malformedSummary.totalRejected === 3, 'TEST 5: All 3 malformed outputs rejected');
  assert(malformedSummary.rejections[0].reasonCode === 'MALFORMED_STRUCTURE', 'TEST 5: Reason code MALFORMED_STRUCTURE');

  // Test 6: Rejection of Unauthorized Outputs (Tenant/Task mismatch)
  const unauthorizedOutputs: RawSubmotherOutput[] = [
    {
      tenantId: 'tenant_ROGUE',
      parentTaskId: 'task_001',
      submotherId: 'submother_rogue_1',
      formulaId: 'FORMULA_DOMAIN_DELEGATION',
      originatingStateHash: 'state_001',
      epistemicStatus: 'DERIVATION',
      confidenceScore: 0.80,
      payload: 'Unauthorized cross-tenant candidate payload'
    }
  ];
  const unauthSummary = layer1.normalizeBatch('tenant_alpha', 'task_001', unauthorizedOutputs);
  assert(unauthSummary.totalAccepted === 0, 'TEST 6: Zero accepted for unauthorized output');
  assert(unauthSummary.rejections[0].reasonCode === 'UNAUTHORIZED_TENANT_OR_TASK', 'TEST 6: Rejected with UNAUTHORIZED_TENANT_OR_TASK');

  // Test 7: Rejection of Provenance-Free Outputs
  const noProvenanceOutputs: RawSubmotherOutput[] = [
    {
      tenantId: 'tenant_alpha',
      parentTaskId: 'task_001',
      submotherId: '', // Empty submotherId
      formulaId: 'FORMULA_DOMAIN_DELEGATION',
      originatingStateHash: 'hash_state_001',
      epistemicStatus: 'DERIVATION',
      confidenceScore: 0.80,
      payload: 'Valid payload text'
    }
  ];
  const noProvSummary = layer1.normalizeBatch('tenant_alpha', 'task_001', noProvenanceOutputs);
  assert(noProvSummary.totalAccepted === 0, 'TEST 7: Zero accepted for missing submotherId');
  assert(noProvSummary.rejections[0].reasonCode === 'MISSING_PROVENANCE', 'TEST 7: Rejected with MISSING_PROVENANCE');

  // Test 8: Rejection of Oversized Payloads (> 64 KB)
  const oversizedPayload = 'X'.repeat(MAX_RESULT_PAYLOAD_BYTES + 100);
  const oversizedOutputs: RawSubmotherOutput[] = [
    {
      tenantId: 'tenant_alpha',
      parentTaskId: 'task_001',
      submotherId: 'submother_oversized',
      formulaId: 'FORMULA_DOMAIN_DELEGATION',
      originatingStateHash: 'hash_state_001',
      epistemicStatus: 'DERIVATION',
      confidenceScore: 0.80,
      payload: oversizedPayload
    }
  ];
  const oversizedSummary = layer1.normalizeBatch('tenant_alpha', 'task_001', oversizedOutputs);
  assert(oversizedSummary.totalAccepted === 0, 'TEST 8: Oversized payload rejected');
  assert(oversizedSummary.rejections[0].reasonCode === 'OVERSIZED_PAYLOAD', 'TEST 8: Rejected with OVERSIZED_PAYLOAD');

  // Test 9: Rejection of Contradictory Epistemic States
  const contradictoryOutputs: RawSubmotherOutput[] = [
    // FACT without evidence
    {
      tenantId: 'tenant_alpha',
      parentTaskId: 'task_001',
      submotherId: 'submother_contradiction_1',
      formulaId: 'FORMULA_DOMAIN_DELEGATION',
      originatingStateHash: 'hash_state_001',
      epistemicStatus: 'FACT',
      confidenceScore: 0.95,
      payload: 'Unsubstantiated factual claim',
      evidenceReferences: [] // Empty evidence!
    },
    // FACT with low confidence
    {
      tenantId: 'tenant_alpha',
      parentTaskId: 'task_001',
      submotherId: 'submother_contradiction_2',
      formulaId: 'FORMULA_DOMAIN_DELEGATION',
      originatingStateHash: 'hash_state_001',
      epistemicStatus: 'FACT',
      confidenceScore: 0.50, // Insufficient confidence for FACT!
      payload: 'Low confidence fact',
      evidenceReferences: ['ev_001']
    },
    // REFUSAL with high confidence
    {
      tenantId: 'tenant_alpha',
      parentTaskId: 'task_001',
      submotherId: 'submother_contradiction_3',
      formulaId: 'FORMULA_DOMAIN_DELEGATION',
      originatingStateHash: 'hash_state_001',
      epistemicStatus: 'REFUSAL',
      confidenceScore: 0.95, // High confidence refusal is contradictory
      payload: 'Refused query'
    }
  ];
  const contSummary = layer1.normalizeBatch('tenant_alpha', 'task_001', contradictoryOutputs);
  assert(contSummary.totalAccepted === 0, 'TEST 9: Contradictory epistemic outputs rejected');
  assert(contSummary.totalRejected === 3, 'TEST 9: All 3 contradictory outputs rejected');
  assert(contSummary.rejections.every(r => r.reasonCode === 'CONTRADICTORY_EPISTEMIC_STATE'), 'TEST 9: All rejections have reason CONTRADICTORY_EPISTEMIC_STATE');

  // Test 10: Payload Sanitization (Stripping internal secrets, memory pointers, diagnostic wiring)
  const dirtyOutputs: RawSubmotherOutput[] = [
    {
      tenantId: 'tenant_alpha',
      parentTaskId: 'task_001',
      submotherId: 'submother_dirty_json',
      formulaId: 'FORMULA_DOMAIN_DELEGATION',
      originatingStateHash: 'hash_state_001',
      epistemicStatus: 'DERIVATION',
      confidenceScore: 0.80,
      payload: {
        cleanKey: 'Valid algorithmic outcome',
        internalExecutionMetadata: { trace: '0xDEADBEEF', cpu: 4 },
        rawStack: 'Error: at Phase31Internal()',
        memoryPointers: [0x1234, 0x5678],
        coreSecret: 'SOVEREIGN_KEY_ABC123'
      }
    },
    {
      tenantId: 'tenant_alpha',
      parentTaskId: 'task_001',
      submotherId: 'submother_dirty_text',
      formulaId: 'FORMULA_DOMAIN_DELEGATION',
      originatingStateHash: 'hash_state_002',
      epistemicStatus: 'DERIVATION',
      confidenceScore: 0.80,
      payload: 'Derived result with leak INTERNAL_ADDR:0xABCDEF and CORE_SECRET:SUPER_SECRET_VALUE'
    }
  ];

  const dirtySummary = layer1.normalizeBatch('tenant_alpha', 'task_001', dirtyOutputs);
  assert(dirtySummary.totalAccepted === 2, 'TEST 10: Both dirty outputs sanitized and accepted');
  const jsonCand = dirtySummary.normalizedCandidates[0];
  const textCand = dirtySummary.normalizedCandidates[1];

  assert(!jsonCand.normalizedPayload.includes('0xDEADBEEF'), 'TEST 10: internalExecutionMetadata stripped from JSON');
  assert(!jsonCand.normalizedPayload.includes('SOVEREIGN_KEY_ABC123'), 'TEST 10: coreSecret stripped from JSON');
  assert(jsonCand.normalizedPayload.includes('Valid algorithmic outcome'), 'TEST 10: Clean payload content preserved');

  assert(textCand.normalizedPayload.includes('[REDACTED]'), 'TEST 10: Sensitive tokens redacted in text payload');
  assert(!textCand.normalizedPayload.includes('0xABCDEF'), 'TEST 10: Raw address stripped from text');

  // Test 11: Duplicate Candidate Payload Rejection within Batch
  const duplicateOutputs: RawSubmotherOutput[] = [
    {
      tenantId: 'tenant_alpha',
      parentTaskId: 'task_001',
      submotherId: 'submother_1',
      formulaId: 'FORMULA_DOMAIN_DELEGATION',
      originatingStateHash: 'hash_state_001',
      epistemicStatus: 'DERIVATION',
      confidenceScore: 0.80,
      payload: 'Identical payload result string'
    },
    {
      tenantId: 'tenant_alpha',
      parentTaskId: 'task_001',
      submotherId: 'submother_2',
      formulaId: 'FORMULA_DOMAIN_DELEGATION',
      originatingStateHash: 'hash_state_002',
      epistemicStatus: 'DERIVATION',
      confidenceScore: 0.80,
      payload: 'Identical payload result string'
    }
  ];
  const dupSummary = layer1.normalizeBatch('tenant_alpha', 'task_001', duplicateOutputs);
  assert(dupSummary.totalAccepted === 1, 'TEST 11: Only first of duplicate payloads accepted');
  assert(dupSummary.duplicatesRejected === 1, 'TEST 11: Second duplicate rejected');
  assert(dupSummary.rejections[0].reasonCode === 'DUPLICATE_CANDIDATE_PAYLOAD', 'TEST 11: Reason DUPLICATE_CANDIDATE_PAYLOAD recorded');

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
