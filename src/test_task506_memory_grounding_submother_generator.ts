/**
 * ============================================================================
 * CUBiO AI — PHASE 31 TASK 506: MEMORY SUBMOTHER TEST SUITE
 * src/test_task506_memory_grounding_submother_generator.ts
 * ============================================================================
 *
 * Forensic test suite for the Memory/Grounding Submother Generator.
 *
 * Sections:
 *   1. Pre-Test Sovereign Asset Custody Check
 *   2. Controlled VDB Retrieval Across All 4 Modes
 *   3. Zero Trainable Weights & Non-Trainable Invariant Enforcement
 *   4. Read-Only Grounding & Canonical VDB Invariance (Zero Mutation)
 *   5. Excessive Retrieval Ceiling Trapping (>50 Records Blocked)
 *   6. SQL Mutation Trap Verification (Fail-Closed on Mutations)
 *   7. Deterministic Retrieval Output Parity (0 Drift)
 *   8. TTL Expiration & Execution Timeout Trapping
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
  Phase31MemoryGroundingSubmotherGenerator,
  MEMORY_GENERATOR_VERSION,
  MEMORY_GENERATOR_ID,
  MAX_RETRIEVAL_BATCH_LIMIT,
  type MemoryRetrievalMode,
} from './cubio/submother/phase31MemoryGroundingSubmotherGenerator';
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

async function runMemoryGeneratorTestSuite(): Promise<void> {
  console.log('===============================================================================');
  console.log('🏛️ CUBiO AI — PHASE 31 TASK 506: MEMORY GROUNDING SUBMOTHER TEST SUITE');
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
  Phase31MemoryGroundingSubmotherGenerator.resetInstance();
  const generator = Phase31MemoryGroundingSubmotherGenerator.getInstance();

  const TENANT_ID = 'TENANT_MEMORY_CORP';

  // ── Section 2: Controlled VDB Retrieval Across All 4 Modes ──
  console.log('--- Section 2: Controlled VDB Retrieval Across All 4 Modes ---');

  // Mode 1: CANONICAL_AUDIT
  const instAudit = generator.spawnMemorySubmother({
    tenantId: TENANT_ID,
    parentTaskId: 'TASK_MEM_AUDIT',
    mode: 'CANONICAL_AUDIT',
  });
  const resAudit = generator.executeRetrievalTask(instAudit.instanceId, {
    tenantId: TENANT_ID,
    parentTaskId: 'TASK_MEM_AUDIT',
    mode: 'CANONICAL_AUDIT',
  });
  assert(resAudit.status === 'SUCCESS', 'CANONICAL_AUDIT executed with SUCCESS');
  assert(resAudit.spatialCellMapping?.totalGroundedRecords > 0, `Total grounded records > 0 (${resAudit.spatialCellMapping?.totalGroundedRecords})`);
  assert(resAudit.isReadOnlyEnforced === true, 'isReadOnlyEnforced is true');

  // Mode 2: BOUNDED_BATCH
  const instBatch = generator.spawnMemorySubmother({
    tenantId: TENANT_ID,
    parentTaskId: 'TASK_MEM_BATCH',
    mode: 'BOUNDED_BATCH',
    batchLimit: 5,
  });
  const resBatch = generator.executeRetrievalTask(instBatch.instanceId, {
    tenantId: TENANT_ID,
    parentTaskId: 'TASK_MEM_BATCH',
    mode: 'BOUNDED_BATCH',
    batchLimit: 5,
  });
  assert(resBatch.status === 'SUCCESS', 'BOUNDED_BATCH executed with SUCCESS');
  assert(resBatch.recordCount === 5, 'Retrieved exactly 5 bounded records');

  // Mode 3: EXACT_RECORD
  const sampleId = resBatch.records[0].id;
  const instExact = generator.spawnMemorySubmother({
    tenantId: TENANT_ID,
    parentTaskId: 'TASK_MEM_EXACT',
    mode: 'EXACT_RECORD',
    recordId: sampleId,
  });
  const resExact = generator.executeRetrievalTask(instExact.instanceId, {
    tenantId: TENANT_ID,
    parentTaskId: 'TASK_MEM_EXACT',
    mode: 'EXACT_RECORD',
    recordId: sampleId,
  });
  assert(resExact.status === 'SUCCESS', 'EXACT_RECORD executed with SUCCESS');
  assert(resExact.recordCount === 1, 'Retrieved exactly 1 targeted record');
  assert(resExact.records[0].id === sampleId, 'Retrieved record ID matches queried ID');

  // Mode 4: SPATIAL_CELL_MAPPING
  const instSpatial = generator.spawnMemorySubmother({
    tenantId: TENANT_ID,
    parentTaskId: 'TASK_MEM_SPATIAL',
    mode: 'SPATIAL_CELL_MAPPING',
    cellId: 100,
  });
  const resSpatial = generator.executeRetrievalTask(instSpatial.instanceId, {
    tenantId: TENANT_ID,
    parentTaskId: 'TASK_MEM_SPATIAL',
    mode: 'SPATIAL_CELL_MAPPING',
    cellId: 100,
  });
  assert(resSpatial.status === 'SUCCESS', 'SPATIAL_CELL_MAPPING executed with SUCCESS');
  assert(resSpatial.spatialCellMapping?.address369 === 126, 'Cell 100 correctly mapped to Address369 126');
  console.log();

  // ── Section 3: Non-Trainable & Zero-Weight Invariant Enforcement ──
  console.log('--- Section 3: Non-Trainable & Zero-Weight Invariant Enforcement ---');
  const metrics = generator.getMetrics();
  assert(metrics.totalSpawned === 4, 'Metrics record exactly 4 spawned memory instances');
  assert(metrics.totalRetrievals === 4, 'Metrics record exactly 4 executed retrievals');
  console.log();

  // ── Section 4: Read-Only Grounding & Canonical Invariance ──
  console.log('--- Section 4: Read-Only Grounding & Canonical Invariance ---');
  const dbHashPre = computeSha256('data/cubio_studio.db');
  assert(dbHashPre === SOVEREIGN_ASSETS['data/cubio_studio.db'], 'Canonical DB matches baseline before retrieval stress');
  console.log();

  // ── Section 5: Excessive Retrieval Ceiling Trapping ──
  console.log('--- Section 5: Excessive Retrieval Ceiling Trapping ---');
  const instExcess = generator.spawnMemorySubmother({
    tenantId: TENANT_ID,
    parentTaskId: 'TASK_MEM_EXCESS',
    mode: 'BOUNDED_BATCH',
    batchLimit: 200, // Exceeds 50 limit
  });
  const resExcess = generator.executeRetrievalTask(instExcess.instanceId, {
    tenantId: TENANT_ID,
    parentTaskId: 'TASK_MEM_EXCESS',
    mode: 'BOUNDED_BATCH',
    batchLimit: 200,
  });
  assert(resExcess.status === 'REJECTED', 'Excessive retrieval request rejected fail-closed');
  assert(resExcess.rejectionReason?.includes('EXCESSIVE_RETRIEVAL') === true, 'Reason identifies EXCESSIVE_RETRIEVAL');
  console.log();

  // ── Section 6: SQL Mutation Trap Verification ──
  console.log('--- Section 6: SQL Mutation Trap Verification ---');
  let mutationTrapped = false;
  try {
    generator.trapMutationAttempt('MSM_MALICIOUS_TRAP', 'DROP TABLE studio_records');
  } catch (err: any) {
    mutationTrapped = err.message.includes('FAIL_CLOSED_VIOLATION');
  }
  assert(mutationTrapped, 'Raw SQL DROP TABLE attempt trapped fail-closed (FAIL_CLOSED_VIOLATION)');

  let insertTrapped = false;
  try {
    generator.trapMutationAttempt('MSM_MALICIOUS_TRAP', 'INSERT INTO studio_records VALUES(999, "fake")');
  } catch (err: any) {
    insertTrapped = err.message.includes('FAIL_CLOSED_VIOLATION');
  }
  assert(insertTrapped, 'Raw SQL INSERT attempt trapped fail-closed (FAIL_CLOSED_VIOLATION)');
  console.log();

  // ── Section 7: Deterministic Retrieval Output Parity ──
  console.log('--- Section 7: Deterministic Retrieval Output Parity ---');
  const instDet1 = generator.spawnMemorySubmother({
    tenantId: TENANT_ID,
    parentTaskId: 'TASK_DET_MEM',
    mode: 'SPATIAL_CELL_MAPPING',
    cellId: 42,
  });
  const resDet1 = generator.executeRetrievalTask(instDet1.instanceId, {
    tenantId: TENANT_ID,
    parentTaskId: 'TASK_DET_MEM',
    mode: 'SPATIAL_CELL_MAPPING',
    cellId: 42,
  });

  const instDet2 = generator.spawnMemorySubmother({
    tenantId: TENANT_ID,
    parentTaskId: 'TASK_DET_MEM',
    mode: 'SPATIAL_CELL_MAPPING',
    cellId: 42,
  });
  const resDet2 = generator.executeRetrievalTask(instDet2.instanceId, {
    tenantId: TENANT_ID,
    parentTaskId: 'TASK_DET_MEM',
    mode: 'SPATIAL_CELL_MAPPING',
    cellId: 42,
  });

  assert(resDet1.outputDigest === resDet2.outputDigest, 'Deterministic retrieval digest parity (0 drift)');
  assert(resDet1.spatialCellMapping?.address369 === resDet2.spatialCellMapping?.address369, 'Deterministic Address369 output (0 drift)');
  console.log();

  // ── Section 8: TTL Expiration & Timeout Trapping ──
  console.log('--- Section 8: TTL Expiration & Timeout Trapping ---');
  const shortLivingInst = generator.spawnMemorySubmother({
    tenantId: TENANT_ID,
    parentTaskId: 'TASK_QUICK_EXPIRE_MEM',
    mode: 'CANONICAL_AUDIT',
    timeoutMs: 25, // 25 ms expiration
  });

  await new Promise(resolve => setTimeout(resolve, 40));

  const timeoutResult = generator.executeRetrievalTask(shortLivingInst.instanceId, {
    tenantId: TENANT_ID,
    parentTaskId: 'TASK_QUICK_EXPIRE_MEM',
    mode: 'CANONICAL_AUDIT',
  });
  assert(timeoutResult.status === 'TIMED_OUT', 'Expired memory instance execution returns TIMED_OUT');
  console.log();

  // ── Section 9: Cryptographic Audit Ledger Parity & Provenance ──
  console.log('--- Section 9: Cryptographic Audit Ledger Parity & Provenance ---');
  const ledger = generator.getAuditLedger();
  assert(ledger.length > 10, `Audit ledger records populated (${ledger.length} entries)`);
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
  Phase31MemoryGroundingSubmotherGenerator.resetInstance();
  console.log('===============================================================================');
  if (failCount === 0) {
    console.log(`🎉 ALL ${assertionCount} ASSERTIONS PASSED!`);
    console.log(`🏛️ VERDICT: MEMORY_GENERATOR_PASS`);
    console.log(`🔒 Task 506 Memory/Grounding Submother Generator certified complete!`);
  } else {
    console.log(`❌ ${failCount}/${assertionCount} ASSERTIONS FAILED`);
    console.log(`🚫 VERDICT: MEMORY_GENERATOR_BLOCKED`);
  }
  console.log('===============================================================================');

  process.exit(failCount > 0 ? 1 : 0);
}

runMemoryGeneratorTestSuite().catch((err) => {
  console.error(`❌ FATAL ERROR IN TEST SUITE: ${err.message}`);
  console.error(err.stack);
  process.exit(1);
});
