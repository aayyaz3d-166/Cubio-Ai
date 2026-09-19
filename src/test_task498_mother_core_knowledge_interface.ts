/**
 * ============================================================================
 * CUBiO AI — PHASE 31 TASK 498: KNOWLEDGE INTERFACE TEST SUITE
 * src/test_task498_mother_core_knowledge_interface.ts
 * ============================================================================
 *
 * Forensic test suite for the Mother Core → Submother Knowledge Interface.
 *
 * Sections:
 *   1. Pre-Test Sovereign Asset Custody Check
 *   2. Valid Knowledge Requests Across Authorized Domains
 *   3. Non-Trainable & Zero-Weight Invariant Enforcement
 *   4. Provenance Tracking & Cryptographic Digest Verification
 *   5. Payload Size Bound Checks (Oversized Requests Rejected)
 *   6. Schema Validation Checks (Malformed Requests Rejected)
 *   7. Tenant Isolation Boundary Enforcement (Cross-Tenant Traps)
 *   8. Read-Only Core Grounding & SQL Mutation Traps
 *   9. Interface Latency & Performance Accounting
 *  10. Cryptographic Audit Ledger Parity
 *  11. Post-Test Sovereign Asset Custody Check
 *  12. Permanent Actuation & Air-Gap Invariants
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
  Phase31MotherCoreKnowledgeInterface,
  KNOWLEDGE_INTERFACE_VERSION,
  KNOWLEDGE_INTERFACE_ID,
  MAX_KNOWLEDGE_REQUEST_PAYLOAD_BYTES,
  type AuthorizedKnowledgeDomain,
  type SubmotherKnowledgeRequest,
} from './cubio/submother/phase31MotherCoreKnowledgeInterface';
import { SOVEREIGN_ASSETS } from './cubio/submother/phase31SubmotherFabricArchitectureFreeze';
import { TOTAL_NATIVE_PARAMETERS } from './cubio/core/nativeTrainingIntegration';
import { CUBIO_NATIVE_MODEL_ID } from './cubio/model/native_foundation/native_model_types';
import { PRODUCTION_CHECKPOINT_EXPECTED_HASH } from './cubio/benchmark/phase30MotherCoreCheckpointValidator';

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

function runKnowledgeInterfaceTestSuite(): void {
  console.log('===============================================================================');
  console.log('🛡️ CUBiO AI — PHASE 31 TASK 498: KNOWLEDGE INTERFACE FORENSIC TEST SUITE');
  console.log('===============================================================================');
  console.log();

  // ── Section 1: Pre-Test Sovereign Custody Check ──
  console.log('--- Section 1: Pre-Test Sovereign Asset Custody Check ---');
  for (const [assetPath, expectedHash] of Object.entries(SOVEREIGN_ASSETS)) {
    const actual = computeSha256(assetPath);
    assert(actual === expectedHash, `Pre-test verify ${assetPath} matches SHA-256 canonical baseline`);
  }
  console.log();

  // ── Initialize Interface ──
  Phase31MotherCoreKnowledgeInterface.resetInstance();
  const iface = Phase31MotherCoreKnowledgeInterface.getInstance();

  const TENANT_A = 'TENANT_CORP_ALPHA';
  const TENANT_B = 'TENANT_CORP_BETA';
  const SUBMOTHER_1 = 'SM_ALPHA_WORKER_01';
  const SUBMOTHER_2 = 'SM_ALPHA_WORKER_02';
  const SUBMOTHER_B1 = 'SM_BETA_WORKER_01';

  iface.registerSubmotherTenantSession(TENANT_A, SUBMOTHER_1);
  iface.registerSubmotherTenantSession(TENANT_A, SUBMOTHER_2);
  iface.registerSubmotherTenantSession(TENANT_B, SUBMOTHER_B1);

  // ── Section 2: Valid Knowledge Requests Across All 5 Domains ──
  console.log('--- Section 2: Valid Knowledge Requests Across Authorized Domains ---');
  const domains: AuthorizedKnowledgeDomain[] = [
    'SPATIAL_ANCHORS',
    'REASONING_RULES',
    'MATHEMATICAL_PROJECTION',
    'VDB_RECORD_LOOKUP',
    'EPISTEMIC_BOUNDS',
  ];

  for (const domain of domains) {
    const req: SubmotherKnowledgeRequest = {
      requestId: `REQ_VAL_${domain}_01`,
      submotherId: SUBMOTHER_1,
      tenantId: TENANT_A,
      domain,
      queryPayload: `query:${domain} anchor:7 depth:3`,
      isolationToken: 'TOKEN_VALID_ALPHA_001_SECRET_BOUND',
    };

    const packet = iface.requestKnowledge(req);
    assert(packet.status === 'DISPATCHED', `Valid request for domain ${domain} returned DISPATCHED`);
    assert(packet.knowledgeContent.length > 0, `Packet has non-empty knowledgeContent for ${domain}`);
    assert(packet.motherCoreModelId === CUBIO_NATIVE_MODEL_ID, `Mother Core model ID stamped (${packet.motherCoreModelId})`);
    assert(packet.motherCoreParameterCount === TOTAL_NATIVE_PARAMETERS, `Parameter count matches native inventory (219,264)`);
    assert(packet.isReadOnlyGrounding === true, `isReadOnlyGrounding is true`);
    assert(packet.independentWeightsCreated === false, `independentWeightsCreated is strictly false`);
  }
  console.log();

  // ── Section 3: Non-Trainable & Zero-Weight Invariant Enforcement ──
  console.log('--- Section 3: Non-Trainable & Zero-Weight Invariant Enforcement ---');
  const metricsBefore = iface.getMetrics();
  assert(metricsBefore.independentWeightsViolations === 0, 'Zero independent weight violations detected');
  console.log();

  // ── Section 4: Provenance Tracking & Cryptographic Digest Verification ──
  console.log('--- Section 4: Provenance Tracking & Cryptographic Digest Verification ---');
  const provReq: SubmotherKnowledgeRequest = {
    requestId: 'REQ_PROVENANCE_TEST',
    submotherId: SUBMOTHER_1,
    tenantId: TENANT_A,
    domain: 'REASONING_RULES',
    queryPayload: 'query:reasoning_rules',
    isolationToken: 'TOKEN_VALID_ALPHA_001_SECRET_BOUND',
  };
  const packetProv = iface.requestKnowledge(provReq);
  assert(packetProv.provenanceDigest.length === 64, 'Provenance digest is a 64-char SHA-256 hex string');
  assert(packetProv.provenanceDigest !== 'REJECTED_NO_PROVENANCE', 'Valid packet receives non-rejected provenance digest');
  console.log();

  // ── Section 5: Payload Size Bound Checks (Oversized Requests) ──
  console.log('--- Section 5: Payload Size Bound Checks (Oversized Requests) ---');
  const oversizedPayload = 'X'.repeat(MAX_KNOWLEDGE_REQUEST_PAYLOAD_BYTES + 256);
  const oversizedReq: SubmotherKnowledgeRequest = {
    requestId: 'REQ_OVERSIZED',
    submotherId: SUBMOTHER_1,
    tenantId: TENANT_A,
    domain: 'SPATIAL_ANCHORS',
    queryPayload: oversizedPayload,
    isolationToken: 'TOKEN_VALID_ALPHA_001_SECRET_BOUND',
  };
  const oversizedPacket = iface.requestKnowledge(oversizedReq);
  assert(oversizedPacket.status === 'REJECTED', 'Oversized payload rejected fail-closed');
  assert(oversizedPacket.rejectionReason?.includes('PAYLOAD_OVERSIZED') === true, 'Reason mentions PAYLOAD_OVERSIZED');
  console.log();

  // ── Section 6: Schema Validation Checks (Malformed Requests) ──
  console.log('--- Section 6: Schema Validation Checks (Malformed Requests) ---');
  const emptyReqIdPacket = iface.requestKnowledge({
    requestId: '',
    submotherId: SUBMOTHER_1,
    tenantId: TENANT_A,
    domain: 'REASONING_RULES',
    queryPayload: 'test',
    isolationToken: 'TOKEN_VALID_ALPHA_001_SECRET_BOUND',
  });
  assert(emptyReqIdPacket.status === 'REJECTED', 'Empty requestId rejected');
  assert(emptyReqIdPacket.rejectionReason?.includes('INVALID_SCHEMA') === true, 'Reason identifies INVALID_SCHEMA for requestId');

  const emptySubmotherPacket = iface.requestKnowledge({
    requestId: 'REQ_INVALID_SM',
    submotherId: '   ',
    tenantId: TENANT_A,
    domain: 'REASONING_RULES',
    queryPayload: 'test',
    isolationToken: 'TOKEN_VALID_ALPHA_001_SECRET_BOUND',
  });
  assert(emptySubmotherPacket.status === 'REJECTED', 'Empty submotherId rejected');

  const invalidDomainPacket = iface.requestKnowledge({
    requestId: 'REQ_INVALID_DOMAIN',
    submotherId: SUBMOTHER_1,
    tenantId: TENANT_A,
    domain: 'EXTERNAL_LLM_DELEGATION' as any,
    queryPayload: 'test',
    isolationToken: 'TOKEN_VALID_ALPHA_001_SECRET_BOUND',
  });
  assert(invalidDomainPacket.status === 'REJECTED', 'Unauthorized domain rejected');
  assert(invalidDomainPacket.rejectionReason?.includes('UNAUTHORIZED_DOMAIN') === true, 'Reason identifies UNAUTHORIZED_DOMAIN');

  const shortTokenPacket = iface.requestKnowledge({
    requestId: 'REQ_SHORT_TOKEN',
    submotherId: SUBMOTHER_1,
    tenantId: TENANT_A,
    domain: 'SPATIAL_ANCHORS',
    queryPayload: 'test',
    isolationToken: 'SHORT',
  });
  assert(shortTokenPacket.status === 'REJECTED', 'Short/unauthorized isolationToken rejected');
  console.log();

  // ── Section 7: Tenant Isolation Boundary Enforcement ──
  console.log('--- Section 7: Tenant Isolation Boundary Enforcement ---');
  const crossTenantReq: SubmotherKnowledgeRequest = {
    requestId: 'REQ_CROSS_TENANT_ATTACK',
    submotherId: SUBMOTHER_1, // Registered under TENANT_A
    tenantId: TENANT_B,       // Requesting as TENANT_B
    domain: 'VDB_RECORD_LOOKUP',
    queryPayload: 'lookup',
    isolationToken: 'TOKEN_VALID_ALPHA_001_SECRET_BOUND',
  };
  const crossTenantPacket = iface.requestKnowledge(crossTenantReq);
  assert(crossTenantPacket.status === 'REJECTED', 'Cross-tenant request rejected fail-closed');
  assert(crossTenantPacket.rejectionReason?.includes('TENANT_ISOLATION_BREACH') === true, 'Reason specifies TENANT_ISOLATION_BREACH');

  const unregisteredSubmotherReq: SubmotherKnowledgeRequest = {
    requestId: 'REQ_ROGUE_SUBMOTHER',
    submotherId: 'SM_ROGUE_UNKNOWN_99',
    tenantId: TENANT_A,
    domain: 'SPATIAL_ANCHORS',
    queryPayload: 'lookup',
    isolationToken: 'TOKEN_VALID_ALPHA_001_SECRET_BOUND',
  };
  const roguePacket = iface.requestKnowledge(unregisteredSubmotherReq);
  assert(roguePacket.status === 'REJECTED', 'Unregistered rogue Submother rejected');
  console.log();

  // ── Section 8: Read-Only Core Grounding & SQL Mutation Traps ──
  console.log('--- Section 8: Read-Only Core Grounding & SQL Mutation Traps ---');
  const sqlInjectionQueries = [
    'DROP TABLE studio_records',
    'DELETE FROM embeddings WHERE 1=1',
    'INSERT INTO knowledge VALUES(1, "fake")',
    'UPDATE config SET val=0',
  ];

  for (const sql of sqlInjectionQueries) {
    const maliciousReq: SubmotherKnowledgeRequest = {
      requestId: `REQ_SQL_ATTACK_${Date.now()}`,
      submotherId: SUBMOTHER_1,
      tenantId: TENANT_A,
      domain: 'VDB_RECORD_LOOKUP',
      queryPayload: sql,
      isolationToken: 'TOKEN_VALID_ALPHA_001_SECRET_BOUND',
    };
    const malPacket = iface.requestKnowledge(maliciousReq);
    assert(malPacket.status === 'REJECTED', `SQL mutation attempt '${sql.split(' ')[0]}' rejected`);
    assert(malPacket.rejectionReason?.includes('READ_ONLY_VIOLATION') === true, 'Reason identifies READ_ONLY_VIOLATION');
  }
  console.log();

  // ── Section 9: Interface Latency & Performance Accounting ──
  console.log('--- Section 9: Interface Latency & Performance Accounting ---');
  const metrics = iface.getMetrics();
  assert(metrics.totalRequests > 0, `Total requests tracked (${metrics.totalRequests})`);
  assert(metrics.acceptedRequests >= 6, `Accepted requests tracked (${metrics.acceptedRequests})`);
  assert(metrics.rejectedRequests >= 10, `Rejected requests tracked (${metrics.rejectedRequests})`);
  assert(metrics.meanLatencyMs >= 0 && metrics.meanLatencyMs < 50, `Mean latency within bounds (${metrics.meanLatencyMs} ms)`);
  console.log();

  // ── Section 10: Cryptographic Audit Ledger Parity ──
  console.log('--- Section 10: Cryptographic Audit Ledger Parity ---');
  const ledger = iface.getAuditLedger();
  assert(ledger.length === metrics.totalRequests, `Audit ledger length (${ledger.length}) matches totalRequests`);
  const lastEntry = ledger[ledger.length - 1];
  assert(lastEntry.auditHash.length === 64, 'Audit entry possesses valid SHA-256 hash');
  console.log();

  // ── Section 11: Post-Test Sovereign Custody Check ──
  console.log('--- Section 11: Post-Test Sovereign Asset Custody Check ---');
  for (const [assetPath, expectedHash] of Object.entries(SOVEREIGN_ASSETS)) {
    const actual = computeSha256(assetPath);
    assert(actual === expectedHash, `Post-test verify ${assetPath} (0 bits drift)`);
  }
  const prodHash = computeSha256('data/checkpoints/phase16_production_final_sealed_1m.3dmemory');
  assert(prodHash === PRODUCTION_CHECKPOINT_EXPECTED_HASH, 'Sealed production checkpoint untouched (0 bits drift)');
  console.log();

  // ── Section 12: Permanent Invariants ──
  console.log('--- Section 12: Permanent Actuation & Air-Gap Invariants ---');
  assert(IS_ACTUATION_BLOCKED === true, 'IS_ACTUATION_BLOCKED === true (immutable)');
  assert(OFFLINE_ISOLATED === true, 'OFFLINE_ISOLATED === true (immutable)');
  console.log();

  // ── Final Verdict ──
  Phase31MotherCoreKnowledgeInterface.resetInstance();
  console.log('===============================================================================');
  if (failCount === 0) {
    console.log(`🎉 ALL ${assertionCount} ASSERTIONS PASSED!`);
    console.log(`🛡️ VERDICT: KNOWLEDGE_INTERFACE_PASS`);
    console.log(`🔒 Task 498 Mother Core → Submother Knowledge Interface fully certified!`);
  } else {
    console.log(`❌ ${failCount}/${assertionCount} ASSERTIONS FAILED`);
    console.log(`🚫 VERDICT: KNOWLEDGE_INTERFACE_BLOCKED`);
  }
  console.log('===============================================================================');

  process.exit(failCount > 0 ? 1 : 0);
}

try {
  runKnowledgeInterfaceTestSuite();
} catch (err: any) {
  console.error(`❌ FATAL ERROR IN TEST SUITE: ${err.message}`);
  console.error(err.stack);
  process.exit(1);
}
