/**
 * ============================================================================
 * CUBiO AI — PHASE 30 TASK 493: MOTHER CORE TRAINING SECURITY AUDIT TEST
 * src/test_task493_mother_core_training_security_audit.ts
 * ============================================================================
 *
 * Test suite verifying adversarial security defenses across all 7 gates:
 * 1. Pre-audit sovereign custody verification (6/6 assets, 0 bits drift)
 * 2. Suite 1: Unauthorized Training & Submother Independence Defense
 * 3. Suite 2: Unauthorized Weight Modification & Parameter Tampering Defense
 * 4. Suite 3: External Pretrained Model & Cloud Dependency Blockade
 * 5. Suite 4: Poisoned Training Data & Format Corruption Ingestion Defense
 * 6. Suite 5: Tenant Isolation & Privilege Escalation Defense
 * 7. Suite 6: Core Architecture Insulation & Data Leakage Defense
 * 8. Suite 7: Physical Actuation Lockout & Offline Isolation Invariants
 * 9. Master execution: 100% fail-closed error interception rate
 * 10. Post-audit sovereign custody verification (6/6 assets, 0 bits drift)
 * ============================================================================
 */

import * as assert from 'assert';
import {
  Phase30MotherCoreTrainingSecurityAuditor,
  SecuritySuiteResult,
  Phase30SecurityGateReportData,
} from './cubio/benchmark/phase30MotherCoreTrainingSecurityAuditor';
import {
  IS_ACTUATION_BLOCKED,
  OFFLINE_ISOLATED,
} from './cubio/intelligence/core/coreEngineContract';
import { ExternalModelGuard } from './cubio/model/native_foundation/external_model_guard';

console.log('===============================================================================');
console.log('🧪 CUBiO AI — PHASE 30 TASK 493: MOTHER CORE TRAINING SECURITY AUDIT SUITE');
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

async function runSecurityAuditTests() {
  const auditor = Phase30MotherCoreTrainingSecurityAuditor.getInstance();

  // ---------------------------------------------------------------------------
  // 1. Pre-Audit Sovereign Asset Custody Check
  // ---------------------------------------------------------------------------
  console.log('\n--- Section 1: Pre-Audit Sovereign Custody Check ---');
  const preCustody = auditor.verifySovereignCustody();
  expect(preCustody.passed, 'Pre-audit sovereign custody must pass for all 6 assets');
  expect(preCustody.assets.length === 6, 'Must verify exactly 6 sovereign core assets');
  for (const asset of preCustody.assets) {
    expect(asset.match, `Asset ${asset.path} must match expected hash`);
  }

  // ---------------------------------------------------------------------------
  // 2. Suite 1: Unauthorized Training & Submother Independence
  // ---------------------------------------------------------------------------
  console.log('\n--- Section 2: Suite 1 Unauthorized Training Defense ---');
  const suite1 = auditor.auditUnauthorizedTraining();
  expect(suite1.suiteStatus === 'PASS', 'Suite 1 must pass all probes');
  expect(suite1.blockedProbes === suite1.totalProbes, 'All unauthorized training targets must be blocked fail-closed');
  expect(suite1.vulnerabilitiesFound === 0, 'Zero unmitigated vulnerabilities in Suite 1');

  // ---------------------------------------------------------------------------
  // 3. Suite 2: Weight Modification & Parameter Tampering Defense
  // ---------------------------------------------------------------------------
  console.log('\n--- Section 3: Suite 2 Weight Modification Defense ---');
  const suite2 = auditor.auditWeightModificationDefense();
  if (suite2.suiteStatus !== 'PASS') {
    console.error('Suite 2 Failures:', JSON.stringify(suite2, null, 2));
  }
  expect(suite2.suiteStatus === 'PASS', 'Suite 2 must pass all probes');
  expect(suite2.blockedProbes === suite2.totalProbes, 'All weight tampering probes must be blocked fail-closed');
  expect(suite2.vulnerabilitiesFound === 0, 'Zero unmitigated vulnerabilities in Suite 2');

  // ---------------------------------------------------------------------------
  // 4. Suite 3: External Model & Cloud Dependency Blockade
  // ---------------------------------------------------------------------------
  console.log('\n--- Section 4: Suite 3 External Model Blockade ---');
  const suite3 = auditor.auditExternalModelBlockade();
  expect(suite3.suiteStatus === 'PASS', 'Suite 3 must pass all probes');
  expect(suite3.blockedProbes === suite3.totalProbes, 'All external model & network probes must be blocked fail-closed');
  expect(suite3.vulnerabilitiesFound === 0, 'Zero unmitigated vulnerabilities in Suite 3');

  // ---------------------------------------------------------------------------
  // 5. Suite 4: Poisoned Training Data Defense
  // ---------------------------------------------------------------------------
  console.log('\n--- Section 5: Suite 4 Poisoned Training Data Defense ---');
  const suite4 = auditor.auditPoisonedDataDefense();
  expect(suite4.suiteStatus === 'PASS', 'Suite 4 must pass all probes');
  expect(suite4.blockedProbes === suite4.totalProbes, 'All poisoned data probes must be blocked fail-closed');
  expect(suite4.vulnerabilitiesFound === 0, 'Zero unmitigated vulnerabilities in Suite 4');

  // ---------------------------------------------------------------------------
  // 6. Suite 5: Tenant Isolation & Privilege Escalation Defense
  // ---------------------------------------------------------------------------
  console.log('\n--- Section 6: Suite 5 Tenant Isolation Defense ---');
  const suite5 = auditor.auditTenantIsolationDefense();
  expect(suite5.suiteStatus === 'PASS', 'Suite 5 must pass all probes');
  expect(suite5.blockedProbes === suite5.totalProbes, 'All tenant isolation probes must be blocked fail-closed');
  expect(suite5.vulnerabilitiesFound === 0, 'Zero unmitigated vulnerabilities in Suite 5');

  // ---------------------------------------------------------------------------
  // 7. Suite 6: Core Architecture Insulation & Data Leakage Defense
  // ---------------------------------------------------------------------------
  console.log('\n--- Section 7: Suite 6 Data Leakage Defense ---');
  const suite6 = auditor.auditDataLeakageDefense();
  expect(suite6.suiteStatus === 'PASS', 'Suite 6 must pass all probes');
  expect(suite6.blockedProbes === suite6.totalProbes, 'All data leakage probes must be blocked fail-closed');
  expect(suite6.vulnerabilitiesFound === 0, 'Zero unmitigated vulnerabilities in Suite 6');

  // ---------------------------------------------------------------------------
  // 8. Suite 7: Physical Actuation Lockout & Offline Isolation Invariants
  // ---------------------------------------------------------------------------
  console.log('\n--- Section 8: Suite 7 Actuation & Offline Invariants ---');
  const suite7 = auditor.auditActuationAndOfflineInvariants();
  expect(suite7.suiteStatus === 'PASS', 'Suite 7 must pass all probes');
  expect(suite7.blockedProbes === suite7.totalProbes, 'All actuation probes must be blocked fail-closed');
  expect(suite7.vulnerabilitiesFound === 0, 'Zero unmitigated vulnerabilities in Suite 7');
  expect(IS_ACTUATION_BLOCKED === true, 'IS_ACTUATION_BLOCKED must be immutable true');
  expect(OFFLINE_ISOLATED === true, 'OFFLINE_ISOLATED must be immutable true');

  // ---------------------------------------------------------------------------
  // 9. Master Security Audit Execution & Report Aggregation
  // ---------------------------------------------------------------------------
  console.log('\n--- Section 9: Master Security Audit Execution ---');
  const masterReport: Phase30SecurityGateReportData = auditor.executeCompleteSecurityAudit();
  expect(masterReport.overallSecurityGateStatus === 'PASSED', 'Overall security gate status must be PASSED');
  expect(masterReport.totalSecuritySuites === 7, 'Must execute exactly 7 security suites');
  expect(masterReport.passingSuites === 7, 'All 7 security suites must pass');
  expect(masterReport.failingSuites === 0, 'Zero security suites may fail');
  expect(masterReport.failClosedRate === 100, 'Fail-closed rate must be exactly 100%');
  expect(masterReport.sovereignCustodyPassed === true, 'Sovereign custody must pass throughout entire audit');

  // ---------------------------------------------------------------------------
  // 10. Post-Audit Sovereign Asset Custody Check
  // ---------------------------------------------------------------------------
  console.log('\n--- Section 10: Post-Audit Sovereign Custody Check ---');
  const postCustody = auditor.verifySovereignCustody();
  expect(postCustody.passed, 'Post-audit sovereign custody must pass with zero bits drift');
  for (const asset of postCustody.assets) {
    expect(asset.match, `Post-audit asset ${asset.path} must match expected hash bit-for-bit`);
  }

  console.log('\n===============================================================================');
  console.log(`🎉 ALL ${passedAssertions} ASSERTIONS PASSED! Phase 30 Training Security Audit Certified!`);
  console.log(`🛡️ Total Probes Executed: ${masterReport.totalProbesExecuted} | Total Blocked: ${masterReport.totalProbesBlocked} (100% Fail-Closed)`);
  console.log('===============================================================================');
}

runSecurityAuditTests().catch((err) => {
  console.error('❌ SECURITY AUDIT TEST RUNNER ERROR:', err);
  process.exit(1);
});
