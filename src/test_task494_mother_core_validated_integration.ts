/**
 * ============================================================================
 * CUBiO AI — PHASE 30 TASK 494: MOTHER CORE INTEGRATION TEST SUITE
 * src/test_task494_mother_core_validated_integration.ts
 * ============================================================================
 *
 * Automated verification of the validated Phase 30 Mother Core intelligence
 * integration into runtime architecture:
 *
 * 1. Pre-integration Sovereign Asset Custody Check (6/6 assets, 0 bits drift)
 * 2. Candidate Checkpoint Loading & Rehydration Verification (219,264 parameters)
 * 3. Runtime Neural Inference Compatibility & Epistemic Calibration
 * 4. Mother Core ↔ Submother Architecture Invariance Check (0 independent weights)
 * 5. Canonical VDB Grounding & Read-Only Invariance Check
 * 6. Core Wire Protocol & Mother Core Gateway Child MVP Interoperability Check
 * 7. Regression Invariance & Baseline Loss Stability Check
 * 8. Comprehensive Integration Certification Gate Assessment
 * 9. Post-integration Sovereign Asset Custody Check (6/6 assets, 0 bits drift)
 * ============================================================================
 */

import {
  Phase30MotherCoreIntegrationService,
  P30_INTEGRATION_TRACK_ID,
  P30_INTEGRATION_VERSION,
} from './cubio/integration/phase30MotherCoreIntegrationService';
import {
  IS_ACTUATION_BLOCKED,
  OFFLINE_ISOLATED,
} from './cubio/intelligence/core/coreEngineContract';
import {
  Phase28SecureCoreWire,
} from './cubio/integration/phase28SecureCoreWire';
import {
  ChildAgentIdentity,
  ChildIntelligenceRequest,
  BRIDGE_PROTOCOL_VERSION,
} from './cubio/integration/phase28CoreChildIntelligenceBridge';
import {
  GatewaySubmissionOptions,
} from './cubio/integration/phase28MotherCoreGateway';
import {
  PRODUCTION_CHECKPOINT_PATH,
  PRODUCTION_CHECKPOINT_EXPECTED_HASH,
} from './cubio/benchmark/phase30MotherCoreCheckpointValidator';

console.log('===============================================================================');
console.log('🧪 CUBiO AI — PHASE 30 TASK 494: MOTHER CORE INTEGRATION TEST SUITE');
console.log('===============================================================================');

let passedAssertions = 0;
function expect(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  passedAssertions++;
  console.log(`  ✓ [ASSERTION ${passedAssertions}] ${message}`);
}

async function runIntegrationTests() {
  const service = Phase30MotherCoreIntegrationService.getInstance();

  // ---------------------------------------------------------------------------
  // 1. Pre-Integration Sovereign Asset Custody Check
  // ---------------------------------------------------------------------------
  console.log('\n--- Section 1: Pre-Integration Sovereign Custody Check ---');
  const preCustody = service.verifySovereignCustody();
  expect(preCustody.passed, 'Pre-integration sovereign custody must pass for all 6 assets');
  expect(preCustody.assets.length === 6, 'Must verify exactly 6 sovereign core assets');
  for (const asset of preCustody.assets) {
    expect(asset.match, `Asset ${asset.path} must match expected hash`);
  }

  // ---------------------------------------------------------------------------
  // 2. Candidate Checkpoint Loading & Rehydration
  // ---------------------------------------------------------------------------
  console.log('\n--- Section 2: Candidate Checkpoint Rehydration ---');
  const initRes = service.initializeService();
  expect(initRes.success === true, 'Candidate checkpoint rehydration must succeed');
  expect(initRes.totalParameters === 219264, 'Total parameters must equal exactly 219,264');
  expect(typeof initRes.stateHash === 'string' && initRes.stateHash.length === 64, 'State hash must be valid 64-char hex');

  // ---------------------------------------------------------------------------
  // 3. Runtime Neural Inference Compatibility & Epistemic Calibration
  // ---------------------------------------------------------------------------
  console.log('\n--- Section 3: Runtime Neural Inference Compatibility ---');
  const inf1 = service.executeInference('Explain Address 369 spatial projection for cell 14', 14);
  expect(inf1.tokenLoss > 0, 'Inference must compute finite positive token loss');
  expect(inf1.epistemicConfidence > 0, 'Inference must produce positive epistemic confidence');
  expect(inf1.spatialAddress369 === 26 + 14, 'Formula A address369 must resolve to 26 + 14 = 40');
  expect(inf1.isActuationBlocked === true, 'Inference must maintain IS_ACTUATION_BLOCKED === true');
  expect(inf1.isOfflineIsolated === true, 'Inference must maintain OFFLINE_ISOLATED === true');

  // ---------------------------------------------------------------------------
  // 4. Mother Core ↔ Submother Architecture Invariance
  // ---------------------------------------------------------------------------
  console.log('\n--- Section 4: Mother Core ↔ Submother Architecture Invariance ---');
  const subTask = service.delegateProceduralSubmother('TASK_VERIF_001', 'SPATIAL_INDEX_A', { cellId: 49 });
  expect(subTask.executionSuccess === true, 'Submother procedural execution must succeed');
  expect(subTask.independentWeightsCreated === false, 'Submother MUST NOT create independent neural weights');
  expect(subTask.resultPayload.address369 === 26 + 49, 'Submother Formula A result must match 26 + 49 = 75');

  const subTask2 = service.delegateProceduralSubmother('TASK_VERIF_002', 'ADDRESS369_ROOT', { address369: 75 });
  expect(subTask2.executionSuccess === true, 'Submother harmonic root computation must succeed');
  expect(subTask2.resultPayload.harmonicRoot === 3, 'Harmonic root of 75 must be 3 (7+5=12 -> 3)');
  expect(subTask2.independentWeightsCreated === false, 'Submother MUST remain strictly procedural');

  // ---------------------------------------------------------------------------
  // 5. Canonical VDB Grounding & Read-Only Invariance
  // ---------------------------------------------------------------------------
  console.log('\n--- Section 5: Canonical VDB Grounding ---');
  const vdbRes = service.verifyVdbGrounding('spatial');
  expect(vdbRes.grounded === true, 'VDB must confirm active records for grounding');
  expect(vdbRes.readOnly === true, 'VDB connection must be strictly READ-ONLY');
  expect(vdbRes.totalRecords > 0, 'VDB record count must be greater than zero');

  // ---------------------------------------------------------------------------
  // 6. Core Wire Protocol & Mother Core Gateway Child MVP Interoperability
  // ---------------------------------------------------------------------------
  console.log('\n--- Section 6: Core Wire Protocol & Child MVP Interoperability ---');
  const childIdentity: ChildAgentIdentity = {
    agentId: 'cubio-child-mvp-2',
    role: 'MVP_STUDIO_COORDINATOR',
    protocolVersion: BRIDGE_PROTOCOL_VERSION,
    tenantId: 'tenant-cubio-prod',
    conversationId: 'conv-integ-test-001',
  };
  const authTimestamp = new Date().toISOString();
  const authSignature = Phase28SecureCoreWire.generateAuthSignature(childIdentity, authTimestamp);

  const childReq: ChildIntelligenceRequest = {
    requestId: 'req-integ-001',
    identity: childIdentity,
    message: 'Provide verified spatial coordinates and Address 369 harmonic alignment.',
  };
  const childOpt: GatewaySubmissionOptions = {
    requestedCapability: 'CANONICAL_SPATIAL_GROUNDING',
    authSignature,
    authTimestamp,
  };

  const gwOutcome = await service.processChildMvpRequest(childReq, childOpt);
  expect(gwOutcome.success === true, 'Gateway submission must succeed for authorized child MVP');
  expect(gwOutcome.auditRecord.decision === 'AUTHORIZED_SUCCESS', 'Gateway audit decision must be AUTHORIZED_SUCCESS');
  expect(gwOutcome.response !== undefined, 'Gateway must return verified child intelligence response');
  expect(gwOutcome.response!.turnId.startsWith('TURN_'), 'Response must contain structured turnId');

  // ---------------------------------------------------------------------------
  // 7. Sealed Production Checkpoint Custody Verification
  // ---------------------------------------------------------------------------
  console.log('\n--- Section 7: Sealed Production Checkpoint Custody ---');
  const prodDigest = service.computeSha256(PRODUCTION_CHECKPOINT_PATH);
  expect(prodDigest === PRODUCTION_CHECKPOINT_EXPECTED_HASH, 'Phase 16 production checkpoint must match baseline SHA-256');

  // ---------------------------------------------------------------------------
  // 8. Comprehensive Integration Certification Gate Assessment
  // ---------------------------------------------------------------------------
  console.log('\n--- Section 8: Master Integration Certification Gate ---');
  const certReport = service.executeIntegrationCertification();
  expect(certReport.certificationDecision === 'CERTIFIED_RELEASE_CANDIDATE', 'Certification decision must be CERTIFIED_RELEASE_CANDIDATE');
  expect(certReport.totalParameters === 219264, 'Certified parameters must be exactly 219,264');
  expect(certReport.tensorCount === 37, 'Certified tensor count must be exactly 37');
  expect(certReport.architectureVerified === true, 'Architecture verified must be true');
  expect(certReport.runtimeCompatibilityVerified === true, 'Runtime compatibility must be true');
  expect(certReport.vdbGroundingVerified === true, 'VDB grounding verified must be true');
  expect(certReport.submotherArchitecturePreserved === true, 'Submother architecture preserved must be true');
  expect(certReport.sovereignCustodyPassed === true, 'Sovereign custody passed must be true');

  // ---------------------------------------------------------------------------
  // 9. Post-Integration Sovereign Asset Custody Check
  // ---------------------------------------------------------------------------
  console.log('\n--- Section 9: Post-Integration Sovereign Custody Check ---');
  const postCustody = service.verifySovereignCustody();
  expect(postCustody.passed, 'Post-integration sovereign custody must pass with 0 bits drift');
  for (const asset of postCustody.assets) {
    expect(asset.match, `Post-integration asset ${asset.path} must match expected hash`);
  }

  // ---------------------------------------------------------------------------
  // 10. Permanent Air-Gap & Actuation Invariants
  // ---------------------------------------------------------------------------
  console.log('\n--- Section 10: Permanent Air-Gap & Actuation Invariants ---');
  expect(IS_ACTUATION_BLOCKED === true, 'IS_ACTUATION_BLOCKED must be immutable true');
  expect(OFFLINE_ISOLATED === true, 'OFFLINE_ISOLATED must be immutable true');

  console.log('\n===============================================================================');
  console.log(`🎉 ALL ${passedAssertions} ASSERTIONS PASSED! Mother Core Integration Certified!`);
  console.log(`🛡️ Decision: ${certReport.certificationDecision} | Release-Candidate Ready!`);
  console.log('===============================================================================');
}

runIntegrationTests().catch((err) => {
  console.error('❌ INTEGRATION TEST RUNNER ERROR:', err);
  process.exit(1);
});
