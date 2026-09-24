/**
 * CUBiO Network Protocol v1 — Canonical Protocol Versioning Test Suite
 * ============================================================
 *
 * Comprehensive tests for Task 06:
 *   1. Version parsing and formatting across formats and pre-releases
 *   2. Invalid and malformed version string rejection
 *   3. Semantic version comparison, ordering, and range checking
 *   4. Compatibility rules (STRICT_MAJOR, EXACT, BOUNDED_RANGE)
 *   5. Feature mapping per protocol minor version
 *   6. Peer version negotiation (offer/response, highest common version, capability intersection)
 *   7. Incompatible version rejection and error taxonomy
 *   8. Determinism of negotiation outcomes
 *
 * Run with:  npx tsx src/cubio/network/protocol/v1/versionManager.test.ts
 */

import {
  parseVersion,
  formatVersion,
  compareVersions,
  isVersionEqual,
  isVersionGreaterThan,
  isVersionLessThan,
  isVersionInRange,
  checkVersionCompatibility,
  getFeaturesForVersion,
  ProtocolVersionManager,
} from './versionManager';
import {
  CURRENT_PROTOCOL_VERSION,
  MINIMUM_SUPPORTED_VERSION,
  MAXIMUM_SUPPORTED_VERSION,
  type CanonicalProtocolVersion,
} from './versionTypes';

// ─── Test Harness ─────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const failures: string[] = [];

function assert(condition: boolean, label: string): void {
  if (condition) {
    passed++;
  } else {
    failed++;
    failures.push(label);
    console.error(`  ✗ FAIL: ${label}`);
  }
}

// ─── 1. Version Parsing & Formatting ─────────────────────────────────────────

function testVersionParsingAndFormatting(): void {
  console.log('\n─── 1. Version Parsing & Formatting ───');

  // Standard CNP/1.0
  const v1 = parseVersion('CNP/1.0');
  assert(v1.valid === true, 'Parsed CNP/1.0');
  assert(v1.version?.major === 1 && v1.version?.minor === 0 && v1.version?.patch === 0, 'CNP/1.0 fields correct');

  // Standard CNP/1.0.0
  const v2 = parseVersion('CNP/1.0.0');
  assert(v2.valid === true, 'Parsed CNP/1.0.0');
  assert(v2.version?.major === 1 && v2.version?.minor === 0 && v2.version?.patch === 0, 'CNP/1.0.0 fields correct');

  // Multi-digit semver CNP/1.12.34
  const v3 = parseVersion('CNP/1.12.34');
  assert(v3.valid === true, 'Parsed CNP/1.12.34');
  assert(v3.version?.major === 1 && v3.version?.minor === 12 && v3.version?.patch === 34, 'Multi-digit semver correct');

  // Pre-release suffix
  const v4 = parseVersion('CNP/1.0.0-rc.1');
  assert(v4.valid === true, 'Parsed pre-release CNP/1.0.0-rc.1');
  assert(v4.version?.preRelease === 'rc.1', 'Pre-release suffix parsed');

  // Naked semver (without CNP/ prefix)
  const v5 = parseVersion('1.2.3');
  assert(v5.valid === true, 'Parsed naked semver 1.2.3');
  assert(v5.version?.major === 1 && v5.version?.minor === 2 && v5.version?.patch === 3, 'Naked semver fields correct');

  // Whitespace trimming
  const v6 = parseVersion('  CNP/1.5.0   ');
  assert(v6.valid === true, 'Trims surrounding whitespace');
  assert(v6.version?.minor === 5, 'Whitespace trimmed correctly');

  // Formatting
  const formatted = formatVersion({ major: 1, minor: 2, patch: 3 });
  assert(formatted === 'CNP/1.2.3', 'Formatted CNP/1.2.3');

  const formattedPre = formatVersion({ major: 2, minor: 0, patch: 0, preRelease: 'beta.2' });
  assert(formattedPre === 'CNP/2.0.0-beta.2', 'Formatted pre-release CNP/2.0.0-beta.2');

  const formattedNoPatch = formatVersion({ major: 1, minor: 0, patch: 0 }, false);
  assert(formattedNoPatch === 'CNP/1.0', 'Formatted without patch: CNP/1.0');
}

// ─── 2. Invalid Version String Rejection ─────────────────────────────────────

function testInvalidVersionRejection(): void {
  console.log('\n─── 2. Invalid Version Rejection ───');

  // Null & non-string
  assert(parseVersion(null as any).valid === false, 'Null rejected');
  assert(parseVersion(undefined as any).valid === false, 'Undefined rejected');
  assert(parseVersion('').valid === false, 'Empty string rejected');

  // Unknown scheme prefix
  const rHttp = parseVersion('HTTP/1.1');
  assert(rHttp.valid === false, 'HTTP scheme rejected');
  assert(rHttp.error?.code === 'ERR_INVALID_VERSION_FORMAT', 'ERR_INVALID_VERSION_FORMAT for unknown scheme');

  const rFtp = parseVersion('FTP/2.0');
  assert(rFtp.valid === false, 'FTP scheme rejected');

  // Single number (missing minor)
  const rSingle = parseVersion('CNP/1');
  assert(rSingle.valid === false, 'Single segment rejected');

  // Too many segments (4 numbers)
  const rQuad = parseVersion('CNP/1.2.3.4');
  assert(rQuad.valid === false, 'Four segments rejected');

  // Non-numeric components
  const rAlpha = parseVersion('CNP/1.x');
  assert(rAlpha.valid === false, 'Non-numeric segment rejected');

  const rWords = parseVersion('CNP/one.two.three');
  assert(rWords.valid === false, 'Word segments rejected');

  // Negative components
  const rNeg = parseVersion('CNP/1.-2.0');
  assert(rNeg.valid === false, 'Negative minor rejected');

  const rNegMaj = parseVersion('CNP/-1.0.0');
  assert(rNegMaj.valid === false, 'Negative major rejected');
}

// ─── 3. Comparison, Ordering & Range ─────────────────────────────────────────

function testComparisonAndOrdering(): void {
  console.log('\n─── 3. Comparison, Ordering & Range ───');

  const v100: CanonicalProtocolVersion = { major: 1, minor: 0, patch: 0 };
  const v101: CanonicalProtocolVersion = { major: 1, minor: 0, patch: 1 };
  const v110: CanonicalProtocolVersion = { major: 1, minor: 1, patch: 0 };
  const v200: CanonicalProtocolVersion = { major: 2, minor: 0, patch: 0 };

  // Equality
  assert(compareVersions(v100, v100) === 0, '1.0.0 == 1.0.0');
  assert(isVersionEqual(v100, { major: 1, minor: 0, patch: 0 }), 'isVersionEqual true');
  assert(!isVersionEqual(v100, v101), 'isVersionEqual false on different patch');

  // Ordering
  assert(compareVersions(v100, v101) === -1, '1.0.0 < 1.0.1');
  assert(compareVersions(v101, v100) === 1, '1.0.1 > 1.0.0');
  assert(compareVersions(v101, v110) === -1, '1.0.1 < 1.1.0');
  assert(compareVersions(v110, v200) === -1, '1.1.0 < 2.0.0');

  assert(isVersionGreaterThan(v200, v110), '2.0.0 is greater than 1.1.0');
  assert(isVersionLessThan(v100, v200), '1.0.0 is less than 2.0.0');

  // Range checking
  const range = { min: v100, max: v110 };
  assert(isVersionInRange(v100, range), 'Min boundary is in range');
  assert(isVersionInRange(v101, range), 'Interior version is in range');
  assert(isVersionInRange(v110, range), 'Max boundary is in range');
  assert(!isVersionInRange(v200, range), 'Version above max is not in range');
  assert(!isVersionInRange({ major: 0, minor: 9, patch: 0 }, range), 'Version below min is not in range');
}

// ─── 4. Compatibility Evaluation Policies ────────────────────────────────────

function testCompatibilityPolicies(): void {
  console.log('\n─── 4. Compatibility Evaluation Policies ───');

  const base: CanonicalProtocolVersion = { major: 1, minor: 0, patch: 0 };

  // STRICT_MAJOR: Same major, minor >= min
  const compSame = checkVersionCompatibility({ major: 1, minor: 0, patch: 0 }, base, 'STRICT_MAJOR');
  assert(compSame.compatible === true, 'Same version is compatible under STRICT_MAJOR');

  const compHigherMinor = checkVersionCompatibility({ major: 1, minor: 2, patch: 0 }, base, 'STRICT_MAJOR');
  assert(compHigherMinor.compatible === true, 'Higher minor is compatible (backward compatible)');

  // Different major rejected
  const compDiffMajor = checkVersionCompatibility({ major: 2, minor: 0, patch: 0 }, base, 'STRICT_MAJOR');
  assert(compDiffMajor.compatible === false, 'Different major is incompatible');
  assert(compDiffMajor.code === 'ERR_VERSION_INCOMPATIBLE', 'ERR_VERSION_INCOMPATIBLE returned');

  // EXACT mode
  const exactPass = checkVersionCompatibility({ major: 1, minor: 0, patch: 0 }, base, 'EXACT');
  assert(exactPass.compatible === true, 'Exact match passes EXACT mode');

  const exactFail = checkVersionCompatibility({ major: 1, minor: 1, patch: 0 }, base, 'EXACT');
  assert(exactFail.compatible === false, 'Different minor fails EXACT mode');

  // Deprecated check (below minimum supported)
  const range = { min: { major: 1, minor: 1, patch: 0 }, max: { major: 1, minor: 9, patch: 0 } };
  const compDep = checkVersionCompatibility({ major: 1, minor: 0, patch: 0 }, base, 'STRICT_MAJOR', range);
  assert(compDep.compatible === false, 'Version below minimum is rejected as deprecated');
  assert(compDep.code === 'ERR_VERSION_DEPRECATED', 'ERR_VERSION_DEPRECATED returned');

  // Exceeds maximum check
  const compTooNew = checkVersionCompatibility({ major: 1, minor: 10, patch: 0 }, base, 'STRICT_MAJOR', range);
  assert(compTooNew.compatible === false, 'Version exceeding maximum is rejected');
  assert(compTooNew.code === 'ERR_VERSION_TOO_NEW', 'ERR_VERSION_TOO_NEW returned');
}

// ─── 5. Feature Discovery Per Version ────────────────────────────────────────

function testFeatureDiscovery(): void {
  console.log('\n─── 5. Feature Discovery ───');

  const f10 = getFeaturesForVersion({ major: 1, minor: 0, patch: 0 });
  assert(f10.includes('BASE_FRAMING'), 'v1.0 includes BASE_FRAMING');
  assert(f10.includes('CNC_ADDRESSING'), 'v1.0 includes CNC_ADDRESSING');
  assert(f10.includes('SOVEREIGN_AUTH'), 'v1.0 includes SOVEREIGN_AUTH');
  assert(!f10.includes('PAYLOAD_COMPRESSION'), 'v1.0 does NOT include PAYLOAD_COMPRESSION');

  const f11 = getFeaturesForVersion({ major: 1, minor: 1, patch: 0 });
  assert(f11.includes('PAYLOAD_COMPRESSION'), 'v1.1 includes PAYLOAD_COMPRESSION');
  assert(f11.includes('STREAM_FLOW_CONTROL'), 'v1.1 includes STREAM_FLOW_CONTROL');
  assert(f11.includes('BASE_FRAMING'), 'v1.1 inherits v1.0 features');

  const f12 = getFeaturesForVersion({ major: 1, minor: 2, patch: 0 });
  assert(f12.includes('PRIORITY_PREEMPTION'), 'v1.2 includes PRIORITY_PREEMPTION');
  assert(f12.includes('DYNAMIC_RECONNECT'), 'v1.2 includes DYNAMIC_RECONNECT');
  assert(f12.includes('PAYLOAD_COMPRESSION'), 'v1.2 inherits v1.1 features');
}

// ─── 6. Negotiation Semantics & Rejection Behavior ───────────────────────────

function testNegotiationSemantics(): void {
  console.log('\n─── 6. Negotiation Semantics & Rejection ───');

  const serverManager = new ProtocolVersionManager({
    nodeId: 'NODE_SRV_001',
    capabilities: ['BASE_FRAMING', 'CNC_ADDRESSING', 'SOVEREIGN_AUTH', 'PAYLOAD_COMPRESSION'],
  });

  // 6a. Standard negotiation: Client offers [1.0, 1.1] -> Server selects highest (1.1)
  const offerA = serverManager.createOffer(
    [{ major: 1, minor: 0, patch: 0 }, { major: 1, minor: 1, patch: 0 }],
    ['BASE_FRAMING', 'PAYLOAD_COMPRESSION', 'UNKNOWN_CUSTOM_CAP']
  );

  const resA = serverManager.negotiate(offerA);
  assert(resA.status === 'ACCEPTED', 'Negotiation accepted');
  assert(resA.selectedVersion?.major === 1 && resA.selectedVersion?.minor === 1, 'Highest mutual version 1.1 selected');
  assert(resA.versionString === 'CNP/1.1.0', 'Version string is CNP/1.1.0');
  assert(resA.agreedCapabilities?.includes('BASE_FRAMING'), 'Agreed capabilities include BASE_FRAMING');
  assert(resA.agreedCapabilities?.includes('PAYLOAD_COMPRESSION'), 'Agreed capabilities include PAYLOAD_COMPRESSION');
  assert(!resA.agreedCapabilities?.includes('UNKNOWN_CUSTOM_CAP'), 'Unshared capabilities filtered out');

  // 6b. Backward compatibility: Client offers ONLY 1.0 -> Server still accepts 1.0
  const offerOlder = serverManager.createOffer([{ major: 1, minor: 0, patch: 0 }]);
  const resOlder = serverManager.negotiate(offerOlder);
  assert(resOlder.status === 'ACCEPTED', 'Older compatible version accepted');
  assert(resOlder.selectedVersion?.minor === 0, 'Selected version is 1.0.0');

  // 6c. Incompatible major rejection: Client offers [2.0.0]
  const offerMajorMismatch = serverManager.createOffer([{ major: 2, minor: 0, patch: 0 }]);
  const resMismatch = serverManager.negotiate(offerMajorMismatch);
  assert(resMismatch.status === 'REJECTED', 'Major version mismatch rejected');
  assert(resMismatch.rejectionCode === 'ERR_VERSION_INCOMPATIBLE', 'ERR_VERSION_INCOMPATIBLE code returned');
  assert(resMismatch.supportedRange !== undefined, 'Server includes supported range in rejection');

  // 6d. Empty offer rejected
  const emptyOffer = { ...offerA, offeredVersions: [] };
  const resEmpty = serverManager.negotiate(emptyOffer);
  assert(resEmpty.status === 'REJECTED', 'Empty offer rejected');
  assert(resEmpty.rejectionCode === 'ERR_NO_COMPATIBLE_VERSION', 'ERR_NO_COMPATIBLE_VERSION for empty offer');

  // 6e. Deprecated version rejection
  const strictServer = new ProtocolVersionManager({
    supportedRange: {
      min: { major: 1, minor: 5, patch: 0 },
      max: { major: 1, minor: 9, patch: 0 },
    },
  });
  const offerDeprecated = strictServer.createOffer([{ major: 1, minor: 1, patch: 0 }]);
  const resDep = strictServer.negotiate(offerDeprecated);
  assert(resDep.status === 'REJECTED', 'Deprecated version rejected');
  assert(resDep.rejectionCode === 'ERR_VERSION_DEPRECATED', 'ERR_VERSION_DEPRECATED returned');
}

// ─── 7. Determinism of Negotiation Outcomes ──────────────────────────────────

function testNegotiationDeterminism(): void {
  console.log('\n─── 7. Determinism of Negotiation ───');

  const server = new ProtocolVersionManager({ nodeId: 'SERVER_NODE' });
  const client = new ProtocolVersionManager({ nodeId: 'CLIENT_NODE' });

  const offer1 = client.createOffer(
    [{ major: 1, minor: 0, patch: 0 }, { major: 1, minor: 1, patch: 0 }],
    ['BASE_FRAMING', 'CNC_ADDRESSING']
  );
  const offer2 = client.createOffer(
    [{ major: 1, minor: 0, patch: 0 }, { major: 1, minor: 1, patch: 0 }],
    ['BASE_FRAMING', 'CNC_ADDRESSING']
  );

  const res1 = server.negotiate(offer1);
  const res2 = server.negotiate(offer2);

  assert(res1.status === res2.status, 'Status is deterministic');
  assert(res1.versionString === res2.versionString, 'Selected version is deterministic');
  assert(
    JSON.stringify(res1.agreedCapabilities) === JSON.stringify(res2.agreedCapabilities),
    'Agreed capabilities are deterministic'
  );
}

// ─── Execution ───────────────────────────────────────────────────────────────

console.log('═══════════════════════════════════════════════════════════');
console.log('  CUBiO Protocol Versioning — Canonical Test Suite');
console.log('  Specification Target: Phase 1 / Task 06');
console.log('═══════════════════════════════════════════════════════════');

testVersionParsingAndFormatting();
testInvalidVersionRejection();
testComparisonAndOrdering();
testCompatibilityPolicies();
testFeatureDiscovery();
testNegotiationSemantics();
testNegotiationDeterminism();

console.log('\n═══════════════════════════════════════════════════════════');
console.log(`  Results: ${passed} PASSED, ${failed} FAILED (${passed + failed} total)`);
if (failures.length > 0) {
  console.log('  Failures:');
  failures.forEach(f => console.log(`    • ${f}`));
}
console.log('═══════════════════════════════════════════════════════════');

if (failed > 0) {
  process.exit(1);
}
