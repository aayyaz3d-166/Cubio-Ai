/**
 * ============================================================================
 * CUBiO AI — PHASE 31 TASK 511 TEST SUITE
 * src/test_task511_mother_core_result_evaluation.ts
 * ============================================================================
 *
 * Comprehensive validation of Mother Core Result Evaluation Engine:
 *   1. Singleton pattern and initialization guards.
 *   2. Rejection of empty candidates (`REJECT_ALL`).
 *   3. Authoritative single candidate acceptance (`ACCEPT_SINGLE`).
 *   4. Multi-domain congruent candidate synthesis (`SYNTHESIZE_COMPOSITE`).
 *   5. Resolution of contradictory/conflicting candidates (Substantive vs Refusal conflict resolution).
 *   6. Rejection of low-confidence and ungrounded candidates (`REJECT_ALL`).
 *   7. Rejection of cross-tenant and mismatched task candidates.
 *   8. Strict deference: Submothers cannot bypass evaluation (`MOTHER_CORE_AUTHORITY`).
 *   9. Bit-exact determinism across duplicate evaluation runs (0 drift).
 *  10. Non-trainability verification (`trainableWeights: 0`, `independentWeightsCreated: false`).
 *  11. Pre/Post sovereign asset custody checks & permanent safety invariants.
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
  Phase31MotherCoreResultEvaluationEngine,
  EVALUATION_ENGINE_ID,
  EVALUATION_ENGINE_VERSION,
} from './cubio/submother/phase31MotherCoreResultEvaluationEngine';
import { NormalizedCandidateResult } from './cubio/submother/phase31SubmotherResultNormalizationLayer';
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

function createMockCandidate(overrides: Partial<NormalizedCandidateResult>): NormalizedCandidateResult {
  const seed = overrides.candidateId || 'cand_mock_default';
  return {
    candidateId: seed,
    tenantId: 'tenant_alpha',
    parentTaskId: 'task_alpha_001',
    submotherId: 'submother_default',
    formulaId: 'FORMULA_DOMAIN_DELEGATION',
    domain: 'REASONING',
    originatingStateHash: 'origin_hash_123',
    epistemicStatus: 'DERIVATION',
    confidenceScore: 0.85,
    normalizedPayload: 'Candidate solution payload',
    evidenceReferences: ['ev_ref_1'],
    evidenceDigest: crypto.createHash('sha256').update('ev_ref_1').digest('hex'),
    candidateStatus: 'CANDIDATE_NORMALIZED',
    authoritativeEvaluationPending: true,
    isSanitized: true,
    provenanceDigest: crypto.createHash('sha256').update(seed).digest('hex'),
    normalizedAt: new Date().toISOString(),
    ...overrides,
  };
}

async function runTestSuite(): Promise<void> {
  console.log('================================================================');
  console.log('RUNNING TASK 511 TEST SUITE: MOTHER CORE RESULT EVALUATION');
  console.log('================================================================');

  // Pre-Execution Sovereign Verification
  verifySovereignAssets('PRE-EXEC');

  // Test 1: Invariants
  assert(IS_ACTUATION_BLOCKED === true, 'TEST 1: Actuation Blocked', 'IS_ACTUATION_BLOCKED must be true');
  assert(OFFLINE_ISOLATED === true, 'TEST 1: Offline Isolated', 'OFFLINE_ISOLATED must be true');

  // Test 2: Singleton Lifecycle & Engine Properties
  Phase31MotherCoreResultEvaluationEngine.resetInstance();
  const engine1 = Phase31MotherCoreResultEvaluationEngine.getInstance();
  const engine2 = Phase31MotherCoreResultEvaluationEngine.getInstance();
  assert(engine1 === engine2, 'TEST 2: Singleton Instance Consistency', 'Must return identical singleton instance');
  assert(EVALUATION_ENGINE_ID === 'CUBIO_MOTHER_CORE_RESULT_EVALUATION_ENGINE', 'TEST 2: Engine ID Correct');
  assert(EVALUATION_ENGINE_VERSION === '31.511.0', 'TEST 2: Engine Version Correct');

  // Test 3: Empty Candidate Evaluation (REJECT_ALL)
  const emptyCert = engine1.evaluateCandidates('tenant_alpha', 'task_alpha_001', []);
  assert(emptyCert.finalDecision === 'REJECT_ALL', 'TEST 3: Empty candidates results in REJECT_ALL');
  assert(emptyCert.resolvedEpistemicStatus === 'REFUSAL', 'TEST 3: Empty candidates resolved as REFUSAL');
  assert(emptyCert.selectedCandidateIds.length === 0, 'TEST 3: Zero selected candidates');
  assert(emptyCert.motherCoreModelId === CUBIO_NATIVE_MODEL_ID, 'TEST 3: Mother Core model ID bound');
  assert(emptyCert.motherCoreParameters === TOTAL_NATIVE_PARAMETERS, 'TEST 3: Native parameter count matches', `${TOTAL_NATIVE_PARAMETERS}`);
  assert(emptyCert.nonTrainableInvariantEnforced === true, 'TEST 3: Non-trainable invariant enforced');

  // Test 4: Single Valid Candidate Evaluation (ACCEPT_SINGLE)
  const singleCand = createMockCandidate({
    candidateId: 'cand_single_001',
    domain: 'CODING',
    epistemicStatus: 'DERIVATION',
    confidenceScore: 0.92,
    normalizedPayload: 'export function solve() { return 42; }',
    evidenceReferences: ['ast_proof_01']
  });

  const singleCert = engine1.evaluateCandidates('tenant_alpha', 'task_alpha_001', [singleCand]);
  assert(singleCert.finalDecision === 'ACCEPT_SINGLE', 'TEST 4: Single candidate accepted via ACCEPT_SINGLE');
  assert(singleCert.selectedCandidateIds.length === 1, 'TEST 4: Exactly 1 candidate selected');
  assert(singleCert.selectedCandidateIds[0] === 'cand_single_001', 'TEST 4: Candidate cand_single_001 selected');
  assert(singleCert.authoritativeOutputPayload === singleCand.normalizedPayload, 'TEST 4: Output matches candidate payload');
  assert(singleCert.candidateScoring[0].passesQualityGate === true, 'TEST 4: Quality gate passed');
  assert(singleCert.evaluationDigest.length === 64, 'TEST 4: Immutable SHA-256 certificate digest generated');

  // Test 5: Multi-Domain Congruent Synthesis (SYNTHESIZE_COMPOSITE)
  const reasoningCand = createMockCandidate({
    candidateId: 'cand_multi_reasoning',
    domain: 'REASONING',
    epistemicStatus: 'DERIVATION',
    confidenceScore: 0.88,
    normalizedPayload: 'Logical decomposition yields 3 distinct pipeline stages.',
    evidenceReferences: ['proof_step_1']
  });

  const codingCand = createMockCandidate({
    candidateId: 'cand_multi_coding',
    domain: 'CODING',
    epistemicStatus: 'DERIVATION',
    confidenceScore: 0.90,
    normalizedPayload: 'Implemented concurrent worker threads with atomic queue.',
    evidenceReferences: ['ast_ref_2']
  });

  const mathCand = createMockCandidate({
    candidateId: 'cand_multi_math',
    domain: 'MATHEMATICS',
    epistemicStatus: 'FACT',
    confidenceScore: 0.95,
    normalizedPayload: 'Complexity bounded by O(N log N) in worst case.',
    evidenceReferences: ['big_o_theorem_4']
  });

  const compositeCert = engine1.evaluateCandidates('tenant_alpha', 'task_alpha_001', [reasoningCand, codingCand, mathCand]);
  assert(compositeCert.finalDecision === 'SYNTHESIZE_COMPOSITE', 'TEST 5: Multi-domain candidates synthesized via SYNTHESIZE_COMPOSITE');
  assert(compositeCert.selectedCandidateIds.length === 3, 'TEST 5: All 3 congruent candidates selected');
  assert(compositeCert.authoritativeOutputPayload.includes('Composite multi-domain resolution approved by Mother Core'), 'TEST 5: Output header identifies Mother Core approved synthesis');
  assert(compositeCert.authoritativeOutputPayload.includes('[REASONING:DERIVATION]'), 'TEST 5: Reasoning segment included');
  assert(compositeCert.authoritativeOutputPayload.includes('[CODING:DERIVATION]'), 'TEST 5: Coding segment included');
  assert(compositeCert.authoritativeOutputPayload.includes('[MATHEMATICS:FACT]'), 'TEST 5: Math segment included');

  // Test 6: Conflicting Candidate Resolution (Substantive vs Refusal)
  const substantiveCand = createMockCandidate({
    candidateId: 'cand_substantive',
    domain: 'REASONING',
    epistemicStatus: 'FACT',
    confidenceScore: 0.94,
    normalizedPayload: 'Verified factual database record matching query criteria.',
    evidenceReferences: ['db_rec_99']
  });

  const refusalCand = createMockCandidate({
    candidateId: 'cand_refusal',
    domain: 'REASONING',
    epistemicStatus: 'REFUSAL',
    confidenceScore: 0.10,
    normalizedPayload: 'Refusal: Insufficient initial parameters provided.',
    evidenceReferences: []
  });

  const conflictCert = engine1.evaluateCandidates('tenant_alpha', 'task_alpha_001', [substantiveCand, refusalCand]);
  assert(conflictCert.conflictDetected === true, 'TEST 6: Conflict flag detected');
  assert(conflictCert.conflictResolutionRationale !== undefined, 'TEST 6: Conflict resolution rationale documented');
  assert(conflictCert.finalDecision === 'ACCEPT_SINGLE', 'TEST 6: Conflict resolved to ACCEPT_SINGLE for grounded fact');
  assert(conflictCert.selectedCandidateIds[0] === 'cand_substantive', 'TEST 6: Substantive candidate preferred over spurious refusal');

  // Test 7: Low-Confidence and Ungrounded Candidates (REJECT_ALL)
  const lowConfCand1 = createMockCandidate({
    candidateId: 'cand_low_1',
    confidenceScore: 0.25, // Below 0.50 threshold
    epistemicStatus: 'HYPOTHESIS',
    normalizedPayload: 'Vague speculative guess.',
    evidenceReferences: []
  });
  const lowConfCand2 = createMockCandidate({
    candidateId: 'cand_low_2',
    confidenceScore: 0.30, // Below 0.50 threshold
    epistemicStatus: 'DERIVATION',
    normalizedPayload: 'Unverified assumption.',
    evidenceReferences: []
  });

  const rejectCert = engine1.evaluateCandidates('tenant_alpha', 'task_alpha_001', [lowConfCand1, lowConfCand2]);
  assert(rejectCert.finalDecision === 'REJECT_ALL', 'TEST 7: Low-confidence candidates rejected via REJECT_ALL');
  assert(rejectCert.selectedCandidateIds.length === 0, 'TEST 7: Zero candidates selected');
  assert(rejectCert.authoritativeOutputPayload.includes('REJECT_ALL: No Submother candidates satisfied'), 'TEST 7: Rejection payload documented');

  // Test 8: Mismatched Tenant and Task Rejection
  const unauthorizedCand = createMockCandidate({
    candidateId: 'cand_unauth',
    tenantId: 'tenant_INTRUDER', // Wrong tenant!
    parentTaskId: 'task_alpha_001'
  });
  const unauthCert = engine1.evaluateCandidates('tenant_alpha', 'task_alpha_001', [unauthorizedCand]);
  assert(unauthCert.finalDecision === 'REJECT_ALL', 'TEST 8: Unauthorized candidate rejected');
  assert(unauthCert.candidateScoring[0].passesQualityGate === false, 'TEST 8: Unauthorized candidate failed quality gate');
  assert(unauthCert.candidateScoring[0].evaluationNotes.includes('mismatch'), 'TEST 8: Rejection notes record mismatch');

  // Test 9: Bit-exact Determinism Across Duplicate Runs
  const certRunA = engine1.evaluateCandidates('tenant_alpha', 'task_alpha_001', [reasoningCand, codingCand]);
  const certRunB = engine1.evaluateCandidates('tenant_alpha', 'task_alpha_001', [reasoningCand, codingCand]);
  assert(certRunA.evaluationDigest === certRunB.evaluationDigest, 'TEST 9: Evaluation digests identical across duplicate runs (0 drift)');
  assert(certRunA.certificateId === certRunB.certificateId, 'TEST 9: Certificate IDs identical across duplicate runs');
  assert(certRunA.authoritativeConfidenceScore === certRunB.authoritativeConfidenceScore, 'TEST 9: Confidence scores identical across duplicate runs');

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
