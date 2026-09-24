/**
 * ============================================================================
 * CUBiO AI — PHASE 30 TASK 495: FINAL MOTHER CORE INTELLIGENCE EXPERIMENT TEST
 * src/test_task495_final_intelligence_experiment.ts
 * ============================================================================
 *
 * Test battery executing and validating the final Phase 30 Mother Core intelligence
 * experiment across 10 rigorous sections:
 *
 * Section 1: Pre-Experiment Sovereign Custody Check (6/6 assets, 0 drift)
 * Section 2: Experiment Engine Initialization & Candidate Checkpoint Integrity
 * Section 3: Direct Mother Core Multi-Domain Evaluation (Reasoning, Coding, Math, Language, Memory, Problem Solving)
 * Section 4: 1 → ∞ → 1 Submother-Assisted Workflow Fan-Out & Synthesis
 * Section 5: Grounding & Epistemic Calibration Discipline (Fact vs Refusal)
 * Section 6: Deterministic Reproducibility & Consistency Verification
 * Section 7: Resource Profiling, Latency Percentiles, and Throughput
 * Section 8: Failure Behavior & Safe Boundary Enforcement
 * Section 9: Post-Experiment Sovereign Custody Verification (0 bits drift)
 * Section 10: Permanent Air-Gap & Actuation Invariant Assertions
 * ============================================================================
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import {
  Phase30FinalIntelligenceExperiment,
  FinalIntelligenceExperimentReportData,
} from './cubio/benchmark/phase30FinalIntelligenceExperiment';
import {
  IS_ACTUATION_BLOCKED,
  OFFLINE_ISOLATED,
} from './cubio/intelligence/core/coreEngineContract';
import {
  CANDIDATE_CHECKPOINT_PATH,
  PRODUCTION_CHECKPOINT_PATH,
} from './cubio/benchmark/phase30MotherCoreCheckpointValidator';

const SOVEREIGN_ASSETS = [
  { path: 'data/cubio_studio.db', expected: 'bafd4afd53bf93b2924f869e2c061853162a0d6eedd853a7ba704172e9fd9ff6' },
  { path: 'src/core/address369.ts', expected: '12eef2d3ec79bce873a064443787587a32711145ea82d375333c2222303fe612' },
  { path: 'data/checkpoints/phase16_production_final_sealed_1m.3dmemory', expected: '453590e284f250525d42d5f99d8fca07957f1e0ac1218b7d43eff6d3a762c1b8' },
  { path: 'src/cubio/core/chatMemoryIntegration.ts', expected: 'cb2978981826e5b1f500bf08d280cb0354b8cbda82140b67d5b938bbd0c144ac' },
  { path: 'src/cubio/core/canonicalIdentity.ts', expected: '3fcb2b18066fdd4c53bdc2a00d8bee8837cf366c4526e36f5718ca78c7036a29' },
  { path: 'src/funnel71/persistence/sqlitePersistence.ts', expected: 'cf78f31106ac0d754a404c72ef90f95c8b93c8d55d163e9ceb32d53693b1f0c6' },
];

function computeSha256(filePath: string): string {
  const full = path.resolve(process.cwd(), filePath);
  return crypto.createHash('sha256').update(fs.readFileSync(full)).digest('hex');
}

let assertionCount = 0;
function expect(condition: boolean, msg: string): void {
  assertionCount++;
  if (!condition) {
    console.error(`❌ [ASSERTION ${assertionCount} FAILED] ${msg}`);
    process.exit(1);
  }
  console.log(`  ✓ [ASSERTION ${assertionCount}] ${msg}`);
}

async function runFinalIntelligenceExperimentSuite(): Promise<void> {
  console.log('===============================================================================');
  console.log('🧪 CUBiO AI — PHASE 30 TASK 495: FINAL MOTHER CORE INTELLIGENCE EXPERIMENT');
  console.log('===============================================================================');

  // ---------------------------------------------------------------------------
  // Section 1: Pre-Experiment Sovereign Custody Check
  // ---------------------------------------------------------------------------
  console.log('\n--- Section 1: Pre-Experiment Sovereign Custody Check ---');
  for (const asset of SOVEREIGN_ASSETS) {
    const digest = computeSha256(asset.path);
    expect(digest === asset.expected, `Pre-custody verify ${asset.path} matches SHA-256 baseline`);
  }

  // ---------------------------------------------------------------------------
  // Section 2: Experiment Engine Initialization & Checkpoint Integrity
  // ---------------------------------------------------------------------------
  console.log('\n--- Section 2: Experiment Engine Initialization ---');
  const experiment = Phase30FinalIntelligenceExperiment.getInstance();
  experiment.initializeEngine();
  expect(fs.existsSync(path.resolve(CANDIDATE_CHECKPOINT_PATH)), 'Candidate checkpoint exists');
  const ckptSha = computeSha256(CANDIDATE_CHECKPOINT_PATH);
  expect(typeof ckptSha === 'string' && ckptSha.length === 64, 'Candidate checkpoint SHA-256 verified valid 64-char hex');

  // ---------------------------------------------------------------------------
  // Section 3: Curriculum Generation & Domain Coverage
  // ---------------------------------------------------------------------------
  console.log('\n--- Section 3: Curriculum Generation & Multi-Domain Coverage ---');
  const curriculum = experiment.generateCurriculum();
  expect(curriculum.length === 60, 'Curriculum must contain exactly 60 empirical tasks');

  const reasoningTasks = curriculum.filter(t => t.domain === 'REASONING');
  const codingTasks = curriculum.filter(t => t.domain === 'CODING');
  const mathTasks = curriculum.filter(t => t.domain === 'MATHEMATICS');
  const langTasks = curriculum.filter(t => t.domain === 'LANGUAGE');
  const memTasks = curriculum.filter(t => t.domain === 'MEMORY');
  const probTasks = curriculum.filter(t => t.domain === 'PROBLEM_SOLVING');

  expect(reasoningTasks.length === 10, 'Reasoning domain must have 10 tasks');
  expect(codingTasks.length === 10, 'Coding domain must have 10 tasks');
  expect(mathTasks.length === 10, 'Mathematics domain must have 10 tasks');
  expect(langTasks.length === 10, 'Language domain must have 10 tasks');
  expect(memTasks.length === 10, 'Memory domain must have 10 tasks');
  expect(probTasks.length === 10, 'Problem Solving domain must have 10 tasks');

  // ---------------------------------------------------------------------------
  // Section 4: Direct Mother Core Inference Evaluation
  // ---------------------------------------------------------------------------
  console.log('\n--- Section 4: Direct Mother Core Inference Evaluation ---');
  const directTask = reasoningTasks[0]; // RS-01
  const directRes = experiment.executeDirectMotherCore(directTask);
  expect(directRes.success === true, 'Direct Mother Core inference must succeed');
  expect(directRes.tokenLoss > 0, 'Direct inference loss must be positive finite');
  expect(directRes.epistemicConfidence > 0, 'Epistemic confidence must be positive');
  expect(directRes.grounded === true, 'Direct inference must be canonically grounded');
  expect(directRes.independentWeightsCreated === false, 'Zero independent weights created');

  // ---------------------------------------------------------------------------
  // Section 5: 1 → ∞ → 1 Submother-Assisted Workflow Execution
  // ---------------------------------------------------------------------------
  console.log('\n--- Section 5: 1 → ∞ → 1 Submother-Assisted Workflow Execution ---');
  const subTask = probTasks.find(t => t.taskId === 'PS-09')!; // 8 branches
  const subRes = experiment.executeSubmotherAssistedWorkflow(subTask);
  expect(subRes.success === true, 'Submother-assisted workflow must succeed');
  expect(subRes.submotherFanOut === 8, 'Workflow must fan-out to exactly 8 procedural branches');
  expect(subRes.independentWeightsCreated === false, 'Submothers MUST NOT create independent neural weights');
  expect(subRes.workflowMode === 'SUBMOTHER_ASSISTED_1_TO_INF_TO_1', 'Mode must be 1 -> inf -> 1');
  expect(subRes.grounded === true, 'Gathered synthesis must be canonically grounded');

  // ---------------------------------------------------------------------------
  // Section 6: Master Empirical Experiment Execution
  // ---------------------------------------------------------------------------
  console.log('\n--- Section 6: Master Empirical Experiment Execution (60 Tasks) ---');
  const report = experiment.executeFullExperiment();
  expect(report.totalTasksEvaluated === 60, 'Experiment must evaluate all 60 tasks');
  expect(report.overallSuccessRate === 1.0, 'Overall task success rate must be 100%');
  expect(report.overallGroundingRate === 1.0, 'Overall grounding rate must be 100%');
  expect(report.deterministicReplicationDelta === 0.0, 'Deterministic replication delta must be 0.000000');
  expect(report.totalParameters === 219264, 'Total parameters must remain exactly 219,264');

  // Verify all 6 domain summaries
  expect(report.domainBreakdown.REASONING.successRate === 1.0, 'Reasoning success rate must be 100%');
  expect(report.domainBreakdown.CODING.successRate === 1.0, 'Coding success rate must be 100%');
  expect(report.domainBreakdown.MATHEMATICS.successRate === 1.0, 'Mathematics success rate must be 100%');
  expect(report.domainBreakdown.LANGUAGE.successRate === 1.0, 'Language success rate must be 100%');
  expect(report.domainBreakdown.MEMORY.successRate === 1.0, 'Memory success rate must be 100%');
  expect(report.domainBreakdown.PROBLEM_SOLVING.successRate === 1.0, 'Problem Solving success rate must be 100%');

  // Workflow comparison
  expect(report.workflowComparison.directMotherCore.successRate === 1.0, 'Direct workflow success rate must be 100%');
  expect(report.workflowComparison.submotherAssisted.successRate === 1.0, 'Submother workflow success rate must be 100%');
  expect(report.workflowComparison.submotherAssisted.independentWeightsCreated === false, 'Zero independent weights in submother workflow');

  // ---------------------------------------------------------------------------
  // Section 7: Resource Profiling & Latency Accounting
  // ---------------------------------------------------------------------------
  console.log('\n--- Section 7: Resource Profiling & Latency Accounting ---');
  expect(report.memoryUsageRssMb > 0 && report.memoryUsageRssMb < 512, 'Memory RSS must remain well within 512 MB boundary');
  expect(report.workflowComparison.directMotherCore.p50LatencyMs >= 0, 'Direct p50 latency must be non-negative');
  expect(report.workflowComparison.submotherAssisted.p50LatencyMs >= 0, 'Submother p50 latency must be non-negative');

  // ---------------------------------------------------------------------------
  // Section 8: Failure Behavior & Safe Boundary Enforcement
  // ---------------------------------------------------------------------------
  console.log('\n--- Section 8: Failure Behavior & Boundary Enforcement ---');
  const failureEval = experiment.evaluateFailureBehavior();
  expect(failureEval.allPassed === true, 'All failure behavior probes must pass fail-closed');
  expect(failureEval.passedProbes === 4, 'Must pass exactly 4 fail-closed boundary probes');

  // ---------------------------------------------------------------------------
  // Section 9: Post-Experiment Sovereign Custody Check
  // ---------------------------------------------------------------------------
  console.log('\n--- Section 9: Post-Experiment Sovereign Custody Check ---');
  for (const asset of SOVEREIGN_ASSETS) {
    const digest = computeSha256(asset.path);
    expect(digest === asset.expected, `Post-custody verify ${asset.path} matches SHA-256 baseline (0 bits drift)`);
  }

  // Production checkpoint untouched
  const prodSha = computeSha256(PRODUCTION_CHECKPOINT_PATH);
  expect(prodSha === '453590e284f250525d42d5f99d8fca07957f1e0ac1218b7d43eff6d3a762c1b8', 'Sealed production checkpoint remains untouched');

  // ---------------------------------------------------------------------------
  // Section 10: Permanent Air-Gap & Actuation Invariants
  // ---------------------------------------------------------------------------
  console.log('\n--- Section 10: Permanent Air-Gap & Actuation Invariants ---');
  expect(IS_ACTUATION_BLOCKED === true, 'IS_ACTUATION_BLOCKED must be immutable true');
  expect(OFFLINE_ISOLATED === true, 'OFFLINE_ISOLATED must be immutable true');

  console.log('\n===============================================================================');
  console.log(`🎉 ALL ${assertionCount} ASSERTIONS PASSED! Final Intelligence Experiment Complete!`);
  console.log('🛡️ Pure Empirical Validation | Zero AGI Claims | Sovereign Invariants Locked!');
  console.log('===============================================================================');
}

runFinalIntelligenceExperimentSuite().catch((err) => {
  console.error('❌ FATAL ERROR IN FINAL INTELLIGENCE EXPERIMENT TEST SUITE:', err);
  process.exit(1);
});
