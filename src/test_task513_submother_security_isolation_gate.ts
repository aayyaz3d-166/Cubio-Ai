/**
 * ============================================================================
 * CUBiO AI — PHASE 31 TASK 513 TEST SUITE
 * src/test_task513_submother_security_isolation_gate.ts
 * ============================================================================
 *
 * Comprehensive adversarial validation of Submother Security & Isolation Gate:
 *   1. Permanent foundational safety invariants (`IS_ACTUATION_BLOCKED`, `OFFLINE_ISOLATED`).
 *   2. Unauthorized training / trainable weights trap (`trainableWeights > 0` rejected).
 *   3. Independent weights creation trap (`independentWeightsCreated === true` rejected).
 *   4. Dynamic learning formula trap (`allowsDynamicLearning === true` rejected).
 *   5. Protected Core internal token leak trap (cubio_studio.db, float32_tensor_matrix, raw_record_json, etc.).
 *   6. Multi-tenant crossover and namespace isolation defense.
 *   7. External model contamination defense (gpt, claude, gemini, llama, qwen, deepseek, etc.).
 *   8. Network access and external URL communication attempt trap.
 *   9. Hardware actuation attempt trap (ACTUATE, PHYSICAL_OVERRIDE, etc.).
 *  10. Adversarial prototype pollution injection trap (`__proto__`, `prototype`).
 *  11. Adversarial path traversal trap (`../`, `..\\`, `/etc/passwd`, `C:\Windows`).
 *  12. Adversarial database mutation probe trap (`DROP TABLE`, `INSERT INTO`, `PRAGMA`).
 *  13. Provenance spoofing, tampering, and detached digest defense.
 *  14. Pre/Post sovereign asset custody checks & 0 bits drift verification.
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
  Phase31SubmotherSecurityAndIsolationGate,
  SECURITY_GATE_ID,
  SECURITY_GATE_VERSION,
  PROTECTED_CORE_TOKENS,
  FORBIDDEN_EXTERNAL_MODELS,
} from './cubio/submother/phase31SubmotherSecurityAndIsolationGate';

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
  console.log('RUNNING TASK 513 TEST SUITE: SUBMOTHER SECURITY & ISOLATION GATE');
  console.log('================================================================');

  // Pre-Execution Sovereign Verification
  verifySovereignAssets('PRE-EXEC');

  // Test 1: Invariants
  assert(IS_ACTUATION_BLOCKED === true, 'TEST 1: Actuation Blocked', 'IS_ACTUATION_BLOCKED must be true');
  assert(OFFLINE_ISOLATED === true, 'TEST 1: Offline Isolated', 'OFFLINE_ISOLATED must be true');

  // Test 2: Singleton Lifecycle & Gate Properties
  Phase31SubmotherSecurityAndIsolationGate.resetInstance();
  const gate1 = Phase31SubmotherSecurityAndIsolationGate.getInstance();
  const gate2 = Phase31SubmotherSecurityAndIsolationGate.getInstance();
  assert(gate1 === gate2, 'TEST 2: Singleton Instance Consistency', 'Must return identical singleton instance');
  assert(SECURITY_GATE_ID === 'CUBIO_SUBMOTHER_SECURITY_AND_ISOLATION_GATE', 'TEST 2: Gate ID Correct');
  assert(SECURITY_GATE_VERSION === '31.513.0', 'TEST 2: Gate Version Correct');

  // Test 3: Unauthorized Training Trap
  const res3a = gate1.inspectNonTrainableGuarantees('tenant_sec_1', { trainableWeights: 100 });
  assert(res3a.isAllowed === false, 'TEST 3a: Trainable weights > 0 blocked');
  assert(res3a.violationCode === 'UNAUTHORIZED_TRAINING_ATTEMPT', 'TEST 3a: Reason UNAUTHORIZED_TRAINING_ATTEMPT');

  const res3b = gate1.inspectNonTrainableGuarantees('tenant_sec_1', { independentWeightsCreated: true });
  assert(res3b.isAllowed === false, 'TEST 3b: Independent weights created blocked');
  assert(res3b.violationCode === 'INDEPENDENT_WEIGHTS_DETECTED', 'TEST 3b: Reason INDEPENDENT_WEIGHTS_DETECTED');

  const res3c = gate1.inspectNonTrainableGuarantees('tenant_sec_1', { allowsDynamicLearning: true });
  assert(res3c.isAllowed === false, 'TEST 3c: Dynamic learning formula blocked');
  assert(res3c.violationCode === 'UNAUTHORIZED_TRAINING_ATTEMPT', 'TEST 3c: Reason UNAUTHORIZED_TRAINING_ATTEMPT');

  const res3d = gate1.inspectNonTrainableGuarantees('tenant_sec_1', { trainableWeights: 0, independentWeightsCreated: false, allowsDynamicLearning: false });
  assert(res3d.isAllowed === true, 'TEST 3d: Certified non-trainable configuration allowed');

  // Test 4: Protected Core Token Leaks
  for (const token of PROTECTED_CORE_TOKENS.slice(0, 5)) {
    const leakPayload = `Candidate output inadvertently referencing ${token} in diagnostic details.`;
    const res = gate1.inspectPayload('tenant_sec_1', leakPayload);
    assert(res.isAllowed === false, `TEST 4: Protected token leak blocked: ${token}`);
    assert(res.violationCode === 'PROTECTED_CORE_TOKEN_LEAK', `TEST 4: Violation code PROTECTED_CORE_TOKEN_LEAK for ${token}`);
  }

  // Test 5: Multi-Tenant Namespace Isolation Defense
  const res5a = gate1.verifyTenantIsolation('tenant_alpha', 'tenant_beta');
  assert(res5a.isAllowed === false, 'TEST 5a: Cross-tenant access blocked');
  assert(res5a.violationCode === 'CROSS_TENANT_CONTAMINATION', 'TEST 5a: Violation code CROSS_TENANT_CONTAMINATION');

  const res5b = gate1.verifyTenantIsolation('tenant_alpha', 'tenant_alpha');
  assert(res5b.isAllowed === true, 'TEST 5b: Same tenant access permitted');

  // Test 6: External Model Contamination Defense
  for (const model of FORBIDDEN_EXTERNAL_MODELS.slice(0, 5)) {
    const modelPayload = `Submother recommending delegation to ${model} for completion.`;
    const res = gate1.inspectPayload('tenant_sec_1', modelPayload);
    assert(res.isAllowed === false, `TEST 6: External model reference blocked: ${model}`);
    assert(res.violationCode === 'EXTERNAL_MODEL_CONTAMINATION', `TEST 6: Violation code EXTERNAL_MODEL_CONTAMINATION for ${model}`);
  }

  // Test 7: Network Access Attempt Defense
  const netPayloads = [
    'Submother requesting https://api.external-ai.com/v1/models',
    'Opening WebSocket at wss://telemetry.remote.org/stream',
    'Executing fetch("http://192.168.1.1/admin") to retrieve config'
  ];
  for (const netP of netPayloads) {
    const res = gate1.inspectPayload('tenant_sec_1', netP);
    assert(res.isAllowed === false, 'TEST 7: Network access attempt blocked');
    assert(res.violationCode === 'NETWORK_ACCESS_ATTEMPT', 'TEST 7: Violation code NETWORK_ACCESS_ATTEMPT');
  }

  // Test 8: Hardware Actuation Attempt Defense
  const actPayloads = [
    'Dispatching physical command ACTUATE motor_01',
    'System call: PHYSICAL_OVERRIDE solenoid valve',
    'Robotics module: ROBOTIC_ACTUATION sequence start'
  ];
  for (const actP of actPayloads) {
    const res = gate1.inspectPayload('tenant_sec_1', actP);
    assert(res.isAllowed === false, 'TEST 8: Hardware actuation attempt blocked');
    assert(res.violationCode === 'ACTUATION_ATTEMPT', 'TEST 8: Violation code ACTUATION_ATTEMPT');
  }

  // Test 9: Adversarial Prototype Pollution Trap
  const protoPayloads = [
    '{"__proto__":{"isAdmin":true},"payload":"malicious payload"}',
    'Submother script: Object.prototype["polluted"] = true;',
    'Accessing constructor.prototype to inject fields'
  ];
  for (const protoP of protoPayloads) {
    const res = gate1.inspectPayload('tenant_sec_1', protoP);
    assert(res.isAllowed === false, 'TEST 9: Prototype pollution blocked');
    assert(res.violationCode === 'PROTOTYPE_POLLUTION', 'TEST 9: Violation code PROTOTYPE_POLLUTION');
  }

  // Test 10: Adversarial Path Traversal Trap
  const pathPayloads = [
    'Reading configuration file from ../../../sensitive_data/key.pem',
    'Target location: ..\\..\\Windows\\System32\\drivers\\etc\\hosts',
    'Inspecting /etc/passwd contents'
  ];
  for (const pathP of pathPayloads) {
    const res = gate1.inspectPayload('tenant_sec_1', pathP);
    assert(res.isAllowed === false, 'TEST 10: Path traversal blocked');
    assert(res.violationCode === 'PATH_TRAVERSAL', 'TEST 10: Violation code PATH_TRAVERSAL');
  }

  // Test 11: Adversarial Database Mutation Probe Trap
  const dbPayloads = [
    'SQL injection probe: DROP TABLE users;',
    'Attempting query: INSERT INTO audit_records VALUES (1, "fake");',
    'Executing ALTER TABLE system_config ADD COLUMN hacked text;'
  ];
  for (const dbP of dbPayloads) {
    const res = gate1.inspectPayload('tenant_sec_1', dbP);
    assert(res.isAllowed === false, 'TEST 11: DB mutation probe blocked');
    assert(res.violationCode === 'DB_MUTATION_PROBE', 'TEST 11: Violation code DB_MUTATION_PROBE');
  }

  // Test 12: Provenance Spoofing & Tampering Defense
  const validData = 'Canonical data payload for provenance verification';
  const legitimateDigest = crypto.createHash('sha256').update(validData).digest('hex');

  const res12a = gate1.inspectProvenance('tenant_sec_1', legitimateDigest, validData);
  assert(res12a.isAllowed === true, 'TEST 12a: Legitimate provenance digest approved');

  const tamperedDigest = crypto.createHash('sha256').update('Tampered payload data').digest('hex');
  const res12b = gate1.inspectProvenance('tenant_sec_1', tamperedDigest, validData);
  assert(res12b.isAllowed === false, 'TEST 12b: Tampered provenance digest blocked');
  assert(res12b.violationCode === 'PROVENANCE_SPOOFING', 'TEST 12b: Violation code PROVENANCE_SPOOFING');

  const malformedDigest = 'invalid_short_digest';
  const res12c = gate1.inspectProvenance('tenant_sec_1', malformedDigest, validData);
  assert(res12c.isAllowed === false, 'TEST 12c: Malformed provenance digest blocked');
  assert(res12c.violationCode === 'PROVENANCE_SPOOFING', 'TEST 12c: Violation code PROVENANCE_SPOOFING');

  // Test 13: Clean Payload Verification
  const cleanPayload = 'export function cleanMath(a: number, b: number): number { return a + b; }';
  const res13 = gate1.inspectPayload('tenant_sec_1', cleanPayload);
  assert(res13.isAllowed === true, 'TEST 13: Clean payload permitted');
  assert(res13.auditDigest.length === 64, 'TEST 13: SHA256 audit digest generated');

  // Test 14: Security Audit Ledger
  const auditLedger = gate1.getAuditLedger();
  assert(auditLedger.length > 20, 'TEST 14: Security audit ledger tracked all probes');
  const violationCount = auditLedger.filter(r => r.isViolation).length;
  assert(violationCount > 15, 'TEST 14: Violations comprehensively captured in immutable audit ledger');

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
