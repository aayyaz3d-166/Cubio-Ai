/**
 * CUBiO Network Protocol v1 — Central Protocol Validation Layer Test Suite
 * =========================================================================
 *
 * Verification suite for Phase 1 / Task 10:
 *   1. Positive Tests (all 7 canonical protocol objects pass validation)
 *   2. Negative Tests (fail-closed behavior on malformed, unknown, or illegal inputs)
 *   3. Boundary Tests (exact threshold testing: MTU, TTL, hops, payload limits)
 *   4. Corruption Tests (tampered payloads, modified checksums, forged IDs)
 *   5. Determinism & Invariance Tests (consistent outcomes and canonical checksums)
 *
 * Run with:  npx tsx src/cubio/network/protocol/v1/protocolValidator.test.ts
 */

import { CubiOProtocolValidator } from './protocolValidator';
import {
  createPacket,
  computePacketChecksum,
} from './packetEngine';
import {
  createMessage,
  generateMessageId,
} from './messageEngine';
import {
  createEnvelope,
  createProtocolAddress,
} from './protocolEngine';
import {
  createNodeIdentity,
  createDefaultNodeConfig,
} from './nodeArchitecture';
import { CanonicalNetworkStateModel } from './stateModel';
import {
  createSuccessResponse,
  createProtocolError,
} from './responseEngine';
import { serializeCanonical } from './canonicalSerializer';
import {
  CUBIO_NETWORK_CONSTANTS,
  PROTOCOL_LIMITS,
  COORDINATE_BOUNDS,
  PROTOCOL_VERSIONS,
} from './constants';
import { CubiOPacket } from './packetTypes';
import { CubiOMessage } from './messageTypes';
import { ProtocolEnvelope } from './types';
import { CanonicalNodeConfig } from './nodeTypes';
import { CanonicalProtocolVersion } from './versionTypes';
import { CanonicalNetworkStateSnapshot } from './stateTypes';
import { CubiOResponse } from './responseTypes';

// ─── Test Harness ─────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err: any) {
    failed++;
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
  }
}

function assert(condition: boolean, msg?: string) {
  if (!condition) throw new Error(msg ?? 'Assertion failed');
}

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- CUBiO Central Protocol Validation Layer Test Suite (Task 10) ---\n');

// ═════════════════════════════════════════════════════════════════════════════
// Fixture Generators
// ═════════════════════════════════════════════════════

function makeValidPacket(): CubiOPacket {
  return createPacket({
    envelopeId: 'ENV_0xTEST10',
    sourceUri: 'CUBIO://NETWORK/0/01/00001/TERMINAL',
    destinationUri: 'CUBIO://NETWORK/0/01/00002/ROUTER',
    payloadData: '{"action":"heartbeat"}',
    sequenceNumber: 1,
  });
}

function makeValidMessage(): CubiOMessage {
  return createMessage({
    type: 'DIRECT',
    communicationMode: 'USER_AGENT',
    source: {
      cubId: 'CUB-AAAA0001',
      entityType: 'USER',
      coordinateUri: 'CUBIO://NETWORK/0/01/00001/CORE',
    },
    destination: {
      coordinateUri: 'CUBIO://NETWORK/0/01/00002/AGENT',
    },
    body: {
      data: 'operational_status',
    },
  });
}

function makeValidEnvelope(): ProtocolEnvelope {
  return createEnvelope({
    kind: 'REQUEST',
    source: createProtocolAddress({ network: 'CUBIO', dimension: 0, zone: 1, node: 1, service: 'TERMINAL' }),
    destination: createProtocolAddress({ network: 'CUBIO', dimension: 0, zone: 1, node: 2, service: 'INTELLIGENCE' }),
    sender: { cubId: 'CUB-AAAA0001', entityType: 'USER', signature: '0xSIG_TEST' },
    payload: {
      category: 'DIRECT_MESSAGE',
      priority: 'NORMAL',
      contentType: 'application/json',
      body: { status: 'ready' },
      bodyBytes: 18,
    },
  });
}

function makeValidNodeConfig(): CanonicalNodeConfig {
  const identity = createNodeIdentity({
    nodeName: 'RELAY_01',
    coordinateUri: 'CUBIO://NETWORK/0/01/00005/RELAY',
    ownerCubId: 'CUB-AAAA0001',
    role: 'RELAY',
    publicKey: '0xPUBKEY_TEST',
  });
  return createDefaultNodeConfig(identity);
}

function makeValidStateSnapshot(): CanonicalNetworkStateSnapshot {
  const model = new CanonicalNetworkStateModel('BOOTSTRAP');
  return model.getSnapshot();
}

function makeValidVersion(): CanonicalProtocolVersion {
  return { major: 1, minor: 0, patch: 0 };
}

function makeValidResponse(): CubiOResponse {
  return createSuccessResponse('MSG_CORR_1', { ack: true });
}

// ═════════════════════════════════════════════════════════════════════════════
// 1. Positive Tests (All Canonical Objects Pass)
// ═════════════════════════════════════════════════════

console.log('1. Positive Tests (All Canonical Protocol Objects):');

test('CubiOPacket passes packet validation and universal validator', () => {
  const pkt = makeValidPacket();
  const outcome1 = CubiOProtocolValidator.validatePacket(pkt);
  assert(outcome1.isValid, 'validatePacket must succeed');
  assert(outcome1.objectType === 'PACKET', 'ObjectType is PACKET');
  assert(typeof outcome1.canonicalChecksum === 'string' && outcome1.canonicalChecksum.startsWith('0x'), 'Checksum generated');

  const outcome2 = CubiOProtocolValidator.validateProtocolObject(pkt);
  assert(outcome2.isValid, 'Universal validator must succeed');
  assert(outcome2.objectType === 'PACKET', 'Universal detected PACKET');
});

test('CubiOMessage passes message validation and universal validator', () => {
  const msg = makeValidMessage();
  const outcome1 = CubiOProtocolValidator.validateMessage(msg);
  assert(outcome1.isValid, 'validateMessage must succeed');
  assert(outcome1.objectType === 'MESSAGE', 'ObjectType is MESSAGE');

  const outcome2 = CubiOProtocolValidator.validateProtocolObject(msg);
  assert(outcome2.isValid, 'Universal validator must succeed');
  assert(outcome2.objectType === 'MESSAGE', 'Universal detected MESSAGE');
});

test('ProtocolEnvelope passes envelope validation and universal validator', () => {
  const env = makeValidEnvelope();
  const outcome1 = CubiOProtocolValidator.validateEnvelope(env);
  assert(outcome1.isValid, 'validateEnvelope must succeed');
  assert(outcome1.objectType === 'ENVELOPE', 'ObjectType is ENVELOPE');

  const outcome2 = CubiOProtocolValidator.validateProtocolObject(env);
  assert(outcome2.isValid, 'Universal validator must succeed');
  assert(outcome2.objectType === 'ENVELOPE', 'Universal detected ENVELOPE');
});

test('CanonicalNodeConfig passes node metadata validation and universal validator', () => {
  const cfg = makeValidNodeConfig();
  const outcome1 = CubiOProtocolValidator.validateNodeMetadata(cfg);
  assert(outcome1.isValid, 'validateNodeMetadata must succeed');
  assert(outcome1.objectType === 'NODE_METADATA', 'ObjectType is NODE_METADATA');

  const outcome2 = CubiOProtocolValidator.validateProtocolObject(cfg);
  assert(outcome2.isValid, 'Universal validator must succeed');
  assert(outcome2.objectType === 'NODE_METADATA', 'Universal detected NODE_METADATA');
});

test('CanonicalProtocolVersion passes version validation and universal validator', () => {
  const v = makeValidVersion();
  const outcome1 = CubiOProtocolValidator.validateProtocolVersion(v);
  assert(outcome1.isValid, 'validateProtocolVersion must succeed');
  assert(outcome1.objectType === 'VERSION', 'ObjectType is VERSION');

  const outcome2 = CubiOProtocolValidator.validateProtocolObject(v);
  assert(outcome2.isValid, 'Universal validator must succeed');
  assert(outcome2.objectType === 'VERSION', 'Universal detected VERSION');
});

test('CanonicalNetworkStateSnapshot passes state validation and universal validator', () => {
  const snap = makeValidStateSnapshot();
  const outcome1 = CubiOProtocolValidator.validateNetworkState(snap);
  assert(outcome1.isValid, 'validateNetworkState must succeed');
  assert(outcome1.objectType === 'STATE_SNAPSHOT', 'ObjectType is STATE_SNAPSHOT');

  const outcome2 = CubiOProtocolValidator.validateProtocolObject(snap);
  assert(outcome2.isValid, 'Universal validator must succeed');
  assert(outcome2.objectType === 'STATE_SNAPSHOT', 'Universal detected STATE_SNAPSHOT');
});

test('CubiOResponse passes response validation and universal validator', () => {
  const res = makeValidResponse();
  const outcome1 = CubiOProtocolValidator.validateResponse(res);
  assert(outcome1.isValid, 'validateResponse must succeed');
  assert(outcome1.objectType === 'RESPONSE', 'ObjectType is RESPONSE');

  const outcome2 = CubiOProtocolValidator.validateProtocolObject(res);
  assert(outcome2.isValid, 'Universal validator must succeed');
  assert(outcome2.objectType === 'RESPONSE', 'Universal detected RESPONSE');
});

test('CubiOProtocolValidator.isValid() returns true for all valid objects', () => {
  assert(CubiOProtocolValidator.isValid(makeValidPacket()), 'isValid packet');
  assert(CubiOProtocolValidator.isValid(makeValidMessage()), 'isValid message');
  assert(CubiOProtocolValidator.isValid(makeValidEnvelope()), 'isValid envelope');
  assert(CubiOProtocolValidator.isValid(makeValidNodeConfig()), 'isValid node config');
  assert(CubiOProtocolValidator.isValid(makeValidVersion()), 'isValid version');
  assert(CubiOProtocolValidator.isValid(makeValidStateSnapshot()), 'isValid state snapshot');
  assert(CubiOProtocolValidator.isValid(makeValidResponse()), 'isValid response');
});

// ═════════════════════════════════════════════════════════════════════════════
// 2. Negative Tests (Fail-Closed Behavior)
// ═════════════════════════════════════════════════════

console.log('2. Negative Tests (Fail-Closed Behavior):');

test('Rejects null, undefined, primitives, and arrays fail-closed', () => {
  assert(!CubiOProtocolValidator.validateProtocolObject(null).isValid, 'Rejects null');
  assert(!CubiOProtocolValidator.validateProtocolObject(undefined).isValid, 'Rejects undefined');
  assert(!CubiOProtocolValidator.validateProtocolObject([]).isValid, 'Rejects array');
  assert(!CubiOProtocolValidator.validateProtocolObject(12345).isValid, 'Rejects number');
  assert(!CubiOProtocolValidator.validateProtocolObject('string').isValid, 'Rejects string');
});

test('Rejects unrecognized protocol objects fail-closed', () => {
  const unknownObj = { foo: 'bar', randomData: 999 };
  const outcome = CubiOProtocolValidator.validateProtocolObject(unknownObj);
  assert(!outcome.isValid, 'Must fail validation');
  assert(outcome.errors.some(e => e.code === 'ERR_UNRECOGNIZED_PROTOCOL_OBJECT'), 'Error code is ERR_UNRECOGNIZED_PROTOCOL_OBJECT');
});

test('Rejects packet with invalid magic token', () => {
  const pkt = makeValidPacket();
  const corrupted = { ...pkt, header: { ...pkt.header, magic: 'BAD1' } };
  const outcome = CubiOProtocolValidator.validatePacket(corrupted);
  assert(!outcome.isValid, 'Must fail on bad magic');
  assert(outcome.errors.some(e => e.code === 'ERR_INVALID_MAGIC'), 'Must report ERR_INVALID_MAGIC');
});

test('Rejects packet with illegal 16-bit flag values', () => {
  const pkt = makeValidPacket();
  const corrupted = { ...pkt, header: { ...pkt.header, flags: 0x100 } };
  const outcome = CubiOProtocolValidator.validatePacket(corrupted, { verifyChecksums: false });
  assert(!outcome.isValid, 'Must fail on 0x100 flag');
  assert(outcome.errors.some(e => e.code === 'ERR_INVALID_FLAGS'), 'Must report ERR_INVALID_FLAGS');
});

test('Rejects message with invalid sovereign ID format', () => {
  const msg = makeValidMessage();
  const corrupted = {
    ...msg,
    source: {
      ...msg.source,
      cubId: 'cub-invalid_id', // lowercase & bad format
    },
  };
  const outcome = CubiOProtocolValidator.validateMessage(corrupted);
  assert(!outcome.isValid, 'Must fail on invalid sovereign ID');
  assert(outcome.errors.some(e => e.code === 'ERR_INVALID_SENDER_ID' || e.code === 'ERR_INVALID_SOURCE'), 'Must report error');
});

test('Rejects message with malformed coordinate URI', () => {
  const msg = makeValidMessage();
  const corrupted = {
    ...msg,
    destination: {
      coordinateUri: 'INVALID_URI_NO_SCHEME',
    },
  };
  const outcome = CubiOProtocolValidator.validateMessage(corrupted);
  assert(!outcome.isValid, 'Must fail on malformed coordinate');
  assert(outcome.errors.some(e => e.code === 'ERR_INVALID_COORDINATE_URI' || e.code === 'ERR_INVALID_DESTINATION'), 'Must report error');
});

test('Rejects version outside supported runtime range', () => {
  const vTooNew = { major: 2, minor: 0, patch: 0 };
  const outcome = CubiOProtocolValidator.validateProtocolVersion(vTooNew);
  assert(!outcome.isValid, 'Must reject v2.0.0');
  assert(outcome.errors.some(e => e.code === 'ERR_VERSION_OUT_OF_SUPPORTED_RANGE'), 'Reports out of range');

  const vNegative = { major: -1, minor: 0, patch: 0 };
  const outcomeNeg = CubiOProtocolValidator.validateProtocolVersion(vNegative);
  assert(!outcomeNeg.isValid, 'Must reject negative major version');
});

test('Rejects state snapshot with unrecognized cluster state', () => {
  const snap = makeValidStateSnapshot();
  const corrupted = { ...snap, clusterState: 'FABRICATED_STATE' as any };
  const outcome = CubiOProtocolValidator.validateNetworkState(corrupted);
  assert(!outcome.isValid, 'Must reject unknown cluster state');
  assert(outcome.errors.some(e => e.code === 'ERR_INVALID_CLUSTER_STATE'), 'Reports ERR_INVALID_CLUSTER_STATE');
});

// ═════════════════════════════════════════════════════════════════════════════
// 3. Boundary Tests (Limits and Thresholds)
// ═════════════════════════════════════════════════════

console.log('3. Boundary Tests (Limits and Thresholds):');

test('Packet payload at exactly MAX_PACKET_BYTES passes; exceeding fails', () => {
  const pkt = makeValidPacket();
  const atLimit = { ...pkt, payload: { ...pkt.payload, length: 65_536 } };
  const outcomeAt = CubiOProtocolValidator.validatePacket(atLimit, { verifyChecksums: false });
  assert(outcomeAt.isValid, '65,536 bytes must pass');

  const overLimit = { ...pkt, payload: { ...pkt.payload, length: 65_537 } };
  const outcomeOver = CubiOProtocolValidator.validatePacket(overLimit, { verifyChecksums: false });
  assert(!outcomeOver.isValid, '65,537 bytes must fail');
  assert(outcomeOver.errors.some(e => e.code === 'ERR_PACKET_PAYLOAD_TOO_LARGE'), 'Reports payload too large');
});

test('Packet TTL boundary: 255 passes; 256 fails', () => {
  const atMax = createPacket({
    envelopeId: 'ENV_0xTEST10',
    sourceUri: 'CUBIO://NETWORK/0/01/00001/TERMINAL',
    destinationUri: 'CUBIO://NETWORK/0/01/00002/ROUTER',
    payloadData: '{"action":"heartbeat"}',
    sequenceNumber: 1,
    ttl: 255,
  });
  const outcomeMax = CubiOProtocolValidator.validatePacket(atMax);
  assert(outcomeMax.isValid, 'TTL 255 must pass');

  const overMax = { ...atMax, header: { ...atMax.header, ttl: 256 } };
  const outcomeOver = CubiOProtocolValidator.validatePacket(overMax, { verifyChecksums: false });
  assert(!outcomeOver.isValid, 'TTL 256 must fail');
  assert(outcomeOver.errors.some(e => e.code === 'ERR_INVALID_TTL' || e.code === 'ERR_TTL_OUT_OF_RANGE'), 'Reports invalid TTL');
});

test('Node MTU boundary: [128..65536] passes; 127 fails', () => {
  const cfg = makeValidNodeConfig();
  const atMin = { ...cfg, mtu: PROTOCOL_LIMITS.MIN_PACKET_MTU };
  assert(CubiOProtocolValidator.validateNodeMetadata(atMin).isValid, 'MTU 128 must pass');

  const atMax = { ...cfg, mtu: PROTOCOL_LIMITS.MAX_PACKET_BYTES };
  assert(CubiOProtocolValidator.validateNodeMetadata(atMax).isValid, 'MTU 65536 must pass');

  const underMin = { ...cfg, mtu: 127 };
  const outcomeUnder = CubiOProtocolValidator.validateNodeMetadata(underMin);
  assert(!outcomeUnder.isValid, 'MTU 127 must fail');
  assert(outcomeUnder.errors.some(e => e.code === 'ERR_INVALID_MTU'), 'Reports invalid MTU');
});

test('Envelope trace hops boundary: 16 passes; 17 fails', () => {
  const env = makeValidEnvelope();
  const path16 = Array.from({ length: 16 }, (_, i) => `NODE_${i}`);
  const atLimit = { ...env, trace: { hops: 16, path: path16 } };
  assert(CubiOProtocolValidator.validateEnvelope(atLimit).isValid, '16 trace hops must pass');

  const path17 = Array.from({ length: 17 }, (_, i) => `NODE_${i}`);
  const overLimit = { ...env, trace: { hops: 17, path: path17 } };
  const outcomeOver = CubiOProtocolValidator.validateEnvelope(overLimit);
  assert(!outcomeOver.isValid, '17 trace hops must fail');
  assert(outcomeOver.errors.some(e => e.code === 'ERR_TRACE_TOO_LONG'), 'Reports trace too long');
});

test('Protocol version boundaries: 1.0.0 and 1.99.999 pass; 0.9.9 fails', () => {
  assert(CubiOProtocolValidator.validateProtocolVersion({ major: 1, minor: 0, patch: 0 }).isValid, '1.0.0 passes');
  assert(CubiOProtocolValidator.validateProtocolVersion({ major: 1, minor: 99, patch: 999 }).isValid, '1.99.999 passes');
  assert(!CubiOProtocolValidator.validateProtocolVersion({ major: 0, minor: 9, patch: 9 }).isValid, '0.9.9 fails');
});

// ═════════════════════════════════════════════════════════════════════════════
// 4. Corruption Tests (Tampering & Integrity Violations)
// ═════════════════════════════════════════════════════

console.log('4. Corruption Tests (Tampering & Integrity):');

test('Packet payload tampering fails checksum verification', () => {
  const pkt = makeValidPacket();
  // Tamper with payload string without recalculating checksum
  const tampered = {
    ...pkt,
    payload: {
      ...pkt.payload,
      data: '{"action":"tampered_payload_data"}',
    },
  };

  const outcome = CubiOProtocolValidator.validatePacket(tampered);
  assert(!outcome.isValid, 'Tampered packet must fail validation');
  assert(outcome.errors.some(e => e.code === 'ERR_PAYLOAD_HASH_MISMATCH' || e.code === 'ERR_CHECKSUM_MISMATCH'), 'Must report checksum or hash tampering');
});

test('Packet sequence number tampering fails checksum verification', () => {
  const pkt = makeValidPacket();
  // Tamper with header sequence number
  const tampered = {
    ...pkt,
    header: {
      ...pkt.header,
      sequenceNumber: 99999,
    },
  };

  const outcome = CubiOProtocolValidator.validatePacket(tampered);
  assert(!outcome.isValid, 'Tampered sequence number must fail');
  assert(outcome.errors.some(e => e.code === 'ERR_CHECKSUM_MISMATCH'), 'Must report ERR_CHECKSUM_MISMATCH');
});

test('Serialized payload validation rejects non-canonical encoding', () => {
  const validPkt = makeValidPacket();
  const standardJsonWithSpaces = JSON.stringify(validPkt, null, 2); // formatted with spaces

  const outcome = CubiOProtocolValidator.validateSerializedPayload(
    standardJsonWithSpaces,
    'PACKET',
    { enforceCanonicalEncoding: true }
  );

  assert(!outcome.isValid, 'Non-canonical serialization must fail when enforceCanonicalEncoding is enabled');
  assert(outcome.errors.some(e => e.code === 'ERR_NON_CANONICAL_ENCODING'), 'Reports ERR_NON_CANONICAL_ENCODING');
});

test('Serialized payload validation succeeds on canonical RFC 8785 JSON', () => {
  const validPkt = makeValidPacket();
  const canonicalJson = serializeCanonical(validPkt);

  const outcome = CubiOProtocolValidator.validateSerializedPayload(
    canonicalJson,
    'PACKET',
    { enforceCanonicalEncoding: true }
  );

  assert(outcome.isValid, 'Canonical JSON must pass serialization validation');
  assert(outcome.objectType === 'PACKET', 'ObjectType is PACKET');
});

test('Serialized payload validation fails closed on corrupted JSON syntax', () => {
  const corruptedSyntax = '{"header":{"magic":"CUB1",BROKEN_JSON';
  const outcome = CubiOProtocolValidator.validateSerializedPayload(corruptedSyntax, 'PACKET');
  assert(!outcome.isValid, 'Broken JSON must fail');
  assert(outcome.errors.some(e => e.code === 'ERR_DESERIALIZATION_FAILED'), 'Reports ERR_DESERIALIZATION_FAILED');
});

// ═════════════════════════════════════════════════════════════════════════════
// 5. Determinism & Invariance Tests (σ² = 0)
// ═════════════════════════════════════════════════════

console.log('5. Determinism & Invariance Tests:');

test('Validation outcome and checksum are invariant across 100 consecutive runs', () => {
  const pkt = makeValidPacket();
  const baseline = CubiOProtocolValidator.validatePacket(pkt);

  assert(baseline.isValid, 'Baseline must be valid');
  assert(baseline.canonicalChecksum !== undefined, 'Baseline has checksum');

  for (let i = 0; i < 100; i++) {
    const outcome = CubiOProtocolValidator.validatePacket(pkt);
    assert(outcome.isValid === baseline.isValid, `Run ${i} validity matches`);
    assert(outcome.canonicalChecksum === baseline.canonicalChecksum, `Run ${i} checksum matches`);
  }
});

test('Invalid object yields identical structured errors in exact order across runs', () => {
  const corruptedPkt = {
    header: { magic: 'BAD1', ttl: 999, flags: 0x200 },
  };

  const baseline = CubiOProtocolValidator.validatePacket(corruptedPkt);
  assert(!baseline.isValid, 'Must fail');
  const baselineErrCodes = baseline.errors.map(e => e.code);

  for (let i = 0; i < 50; i++) {
    const outcome = CubiOProtocolValidator.validatePacket(corruptedPkt);
    const outcomeErrCodes = outcome.errors.map(e => e.code);
    assert(
      JSON.stringify(outcomeErrCodes) === JSON.stringify(baselineErrCodes),
      `Run ${i} errors must match baseline order`
    );
  }
});

test('Objects with shuffled key order yield identical validation and checksum', () => {
  const v1 = { major: 1, minor: 0, patch: 0 };
  const v2 = { patch: 0, major: 1, minor: 0 }; // inverted key order

  const outcome1 = CubiOProtocolValidator.validateProtocolVersion(v1);
  const outcome2 = CubiOProtocolValidator.validateProtocolVersion(v2);

  assert(outcome1.isValid && outcome2.isValid, 'Both must pass');
  assert(outcome1.canonicalChecksum === outcome2.canonicalChecksum, 'Checksums must match regardless of key order');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log(`\nResults: ${passed} passed, ${failed} failed\n`);

if (failed > 0) {
  process.exit(1);
}
