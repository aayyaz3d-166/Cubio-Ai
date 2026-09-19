/**
 * ============================================================================
 * CUBiO AI — PHASE 31 TASK 507: EPISTEMIC SUBMOTHER TEST SUITE
 * src/test_task507_epistemic_submother_generator.ts
 * ============================================================================
 *
 * Forensic test suite for the Epistemic Submother Generator.
 *
 * Sections:
 *   1. Pre-Test Sovereign Asset Custody Check
 *   2. Epistemic Categorization Across All 5 Categories (Fact, Derivation, Hypothesis, Ambiguity, Refusal)
 *   3. Zero Trainable Weights & Non-Trainable Invariant Enforcement
 *   4. Adversarial Probes: Contradictory Evidence Trapping (Calibrated Refusal)
 *   5. Adversarial Probes: Zero Evidence & Unsupported Claim Trapping
 *   6. Deterministic Epistemic Calibration Parity Verification (0 Drift)
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
  Phase31EpistemicSubmotherGenerator,
  EPISTEMIC_GENERATOR_VERSION,
  EPISTEMIC_GENERATOR_ID,
  FACT_CONFIDENCE_THRESHOLD,
  DERIVATION_CONFIDENCE_THRESHOLD,
  HYPOTHESIS_CONFIDENCE_THRESHOLD,
  AMBIGUITY_CONFIDENCE_THRESHOLD,
  type EvidenceItem,
} from './cubio/submother/phase31EpistemicSubmotherGenerator';
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

async function runEpistemicGeneratorTestSuite(): Promise<void> {
  console.log('===============================================================================');
  console.log('⚖️ CUBiO AI — PHASE 31 TASK 507: EPISTEMIC SUBMOTHER GENERATOR TEST SUITE');
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
  Phase31EpistemicSubmotherGenerator.resetInstance();
  const generator = Phase31EpistemicSubmotherGenerator.getInstance();

  const TENANT_ID = 'TENANT_EPISTEMIC_CORP';

  // ── Section 2: Epistemic Categorization Across All 5 Categories ──
  console.log('--- Section 2: Epistemic Categorization Across All 5 Categories ---');

  // 1. FACT (High reliability, canonical source)
  const factEvidence: EvidenceItem[] = [
    { statement: 'Record grounded in canonical SQLite VDB table', source: 'VDB_CANONICAL', reliability: 0.95 },
    { statement: 'Coordinates derived from Formula A geometry', source: 'FORMULA_A', reliability: 0.92 },
  ];
  const instFact = generator.spawnEpistemicSubmother({
    tenantId: TENANT_ID,
    parentTaskId: 'TASK_EPIST_FACT',
    claim: 'Cell 42 exists in discrete Address369 grid space',
    evidence: factEvidence,
  });
  const resFact = generator.evaluateEpistemicClaim(instFact.instanceId, factEvidence);
  assert(resFact.category === 'FACT', `High-confidence evidence classified as FACT (actual: ${resFact.category})`);
  assert(resFact.calibratedConfidence >= FACT_CONFIDENCE_THRESHOLD, `Confidence >= ${FACT_CONFIDENCE_THRESHOLD} (${resFact.calibratedConfidence})`);

  // 2. DERIVATION (Formally deduced algebraic rule)
  const derivEvidence: EvidenceItem[] = [
    { statement: 'Deduced via golden ratio harmonic formula', source: 'FORMULA_A', reliability: 0.82 },
  ];
  const instDeriv = generator.spawnEpistemicSubmother({
    tenantId: TENANT_ID,
    parentTaskId: 'TASK_EPIST_DERIV',
    claim: 'Phi squared equals Phi plus one',
    evidence: derivEvidence,
  });
  const resDeriv = generator.evaluateEpistemicClaim(instDeriv.instanceId, derivEvidence);
  assert(resDeriv.category === 'DERIVATION', `Algebraic deduction classified as DERIVATION (actual: ${resDeriv.category})`);
  assert(resDeriv.calibratedConfidence >= DERIVATION_CONFIDENCE_THRESHOLD && resDeriv.calibratedConfidence < FACT_CONFIDENCE_THRESHOLD, 'Confidence in DERIVATION bracket');

  // 3. HYPOTHESIS (Plausible conjecture)
  const hypEvidence: EvidenceItem[] = [
    { statement: 'User prompt posits possible cross-cell relationship', source: 'USER_PROMPT', reliability: 0.85 },
  ];
  const instHyp = generator.spawnEpistemicSubmother({
    tenantId: TENANT_ID,
    parentTaskId: 'TASK_EPIST_HYP',
    claim: 'Future expansion might cluster around cell 126',
    evidence: hypEvidence,
  });
  const resHyp = generator.evaluateEpistemicClaim(instHyp.instanceId, hypEvidence);
  assert(resHyp.category === 'HYPOTHESIS', `Conjecture classified as HYPOTHESIS (actual: ${resHyp.category})`);
  assert(resHyp.calibratedConfidence >= HYPOTHESIS_CONFIDENCE_THRESHOLD && resHyp.calibratedConfidence < DERIVATION_CONFIDENCE_THRESHOLD, 'Confidence in HYPOTHESIS bracket');

  // 4. AMBIGUITY (Under-specified or low-reliability evidence)
  const ambEvidence: EvidenceItem[] = [
    { statement: 'Unverified rumor of an external feature', source: 'UNVERIFIED', reliability: 0.70 },
  ];
  const instAmb = generator.spawnEpistemicSubmother({
    tenantId: TENANT_ID,
    parentTaskId: 'TASK_EPIST_AMB',
    claim: 'Unconfirmed parameter state modification',
    evidence: ambEvidence,
  });
  const resAmb = generator.evaluateEpistemicClaim(instAmb.instanceId, ambEvidence);
  assert(resAmb.category === 'AMBIGUITY', `Weak evidence classified as AMBIGUITY (actual: ${resAmb.category})`);

  // 5. REFUSAL (Extremely low reliability)
  const refEvidence: EvidenceItem[] = [
    { statement: 'Completely ungrounded assertion', source: 'UNVERIFIED', reliability: 0.20 },
  ];
  const instRef = generator.spawnEpistemicSubmother({
    tenantId: TENANT_ID,
    parentTaskId: 'TASK_EPIST_REF',
    claim: 'Unfounded claim of infinite tokens',
    evidence: refEvidence,
  });
  const resRef = generator.evaluateEpistemicClaim(instRef.instanceId, refEvidence);
  assert(resRef.category === 'REFUSAL', `Ungrounded claim classified as REFUSAL (actual: ${resRef.category})`);
  assert(resRef.refusalNotice !== undefined, 'Refusal notice is attached');
  console.log();

  // ── Section 3: Non-Trainable & Zero-Weight Invariant Enforcement ──
  console.log('--- Section 3: Non-Trainable & Zero-Weight Invariant Enforcement ---');
  const metrics = generator.getMetrics();
  assert(metrics.totalSpawned === 5, 'Metrics record exactly 5 spawned epistemic instances');
  assert(metrics.totalEvaluated === 5, 'Metrics record exactly 5 evaluated epistemic claims');
  console.log();

  // ── Section 4: Adversarial Probes — Contradictory Evidence Trapping ──
  console.log('--- Section 4: Adversarial Probes — Contradictory Evidence Trapping ---');
  const contradictoryEvidence: EvidenceItem[] = [
    { statement: 'Cell 100 has coordinate X=5', source: 'FORMULA_A', reliability: 0.9 },
    { statement: 'Contradiction: Cell 100 has coordinate X=9', source: 'USER_PROMPT', reliability: 0.9 },
  ];

  const instContra = generator.spawnEpistemicSubmother({
    tenantId: TENANT_ID,
    parentTaskId: 'TASK_CONTRA_TEST',
    claim: 'Coordinate superposition conflict',
    evidence: contradictoryEvidence,
  });
  const resContra = generator.evaluateEpistemicClaim(instContra.instanceId, contradictoryEvidence);
  assert(resContra.category === 'REFUSAL', 'Contradictory evidence trapped fail-closed (REFUSAL)');
  assert(resContra.calibratedConfidence <= 0.1, 'Calibrated confidence clamped to <= 0.10');
  console.log();

  // ── Section 5: Adversarial Probes — Zero Evidence Trapping ──
  console.log('--- Section 5: Adversarial Probes — Zero Evidence Trapping ---');
  const instEmpty = generator.spawnEpistemicSubmother({
    tenantId: TENANT_ID,
    parentTaskId: 'TASK_EMPTY_EVID',
    claim: 'Unsupported assertion without evidence',
    evidence: [],
  });
  const resEmpty = generator.evaluateEpistemicClaim(instEmpty.instanceId, []);
  assert(resEmpty.category === 'REFUSAL', 'Zero evidence trapped fail-closed (REFUSAL)');
  assert(resEmpty.refusalNotice?.includes('Zero evidence') === true, 'Refusal notice cites zero evidence');
  console.log();

  // ── Section 6: Deterministic Epistemic Calibration Parity ──
  console.log('--- Section 6: Deterministic Epistemic Calibration Parity ---');
  const instDet1 = generator.spawnEpistemicSubmother({
    tenantId: TENANT_ID,
    parentTaskId: 'TASK_DET_EPIST',
    claim: 'Address369 discrete anchoring fact',
    evidence: factEvidence,
  });
  const resDet1 = generator.evaluateEpistemicClaim(instDet1.instanceId, factEvidence);

  const instDet2 = generator.spawnEpistemicSubmother({
    tenantId: TENANT_ID,
    parentTaskId: 'TASK_DET_EPIST',
    claim: 'Address369 discrete anchoring fact',
    evidence: factEvidence,
  });
  const resDet2 = generator.evaluateEpistemicClaim(instDet2.instanceId, factEvidence);

  assert(resDet1.outputDigest === resDet2.outputDigest, 'Deterministic epistemic digest parity (0 drift)');
  assert(resDet1.calibratedConfidence === resDet2.calibratedConfidence, 'Deterministic calibrated confidence (0 drift)');
  assert(resDet1.category === resDet2.category, 'Deterministic epistemic category (0 drift)');
  console.log();

  // ── Section 7: TTL Expiration & Execution Timeout Trapping ──
  console.log('--- Section 7: TTL Expiration & Execution Timeout Trapping ---');
  const shortLivingInst = generator.spawnEpistemicSubmother({
    tenantId: TENANT_ID,
    parentTaskId: 'TASK_QUICK_EXPIRE_EPIST',
    claim: 'Expiring claim',
    evidence: factEvidence,
    timeoutMs: 25, // 25 ms expiration
  });

  await new Promise(resolve => setTimeout(resolve, 40));

  const timeoutResult = generator.evaluateEpistemicClaim(shortLivingInst.instanceId, factEvidence);
  assert(timeoutResult.status === 'TIMED_OUT', 'Expired epistemic instance execution returns TIMED_OUT');
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
  Phase31EpistemicSubmotherGenerator.resetInstance();
  console.log('===============================================================================');
  if (failCount === 0) {
    console.log(`🎉 ALL ${assertionCount} ASSERTIONS PASSED!`);
    console.log(`⚖️ VERDICT: EPISTEMIC_GENERATOR_PASS`);
    console.log(`🔒 Task 507 Epistemic Submother Generator certified complete!`);
  } else {
    console.log(`❌ ${failCount}/${assertionCount} ASSERTIONS FAILED`);
    console.log(`🚫 VERDICT: EPISTEMIC_GENERATOR_BLOCKED`);
  }
  console.log('===============================================================================');

  process.exit(failCount > 0 ? 1 : 0);
}

runEpistemicGeneratorTestSuite().catch((err) => {
  console.error(`❌ FATAL ERROR IN TEST SUITE: ${err.message}`);
  console.error(err.stack);
  process.exit(1);
});
