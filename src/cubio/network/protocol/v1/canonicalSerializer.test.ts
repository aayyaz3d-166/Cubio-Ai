/**
 * CUBiO Network Protocol v1 — Canonical Serializer Test Suite
 * ============================================================
 *
 * Comprehensive tests for Task 07:
 *   1. RFC 8785 Canonical JSON invariants (deep key sorting, zero whitespace, array preservation)
 *   2. Rejection of invalid inputs (circular references, NaN, Infinity, functions, symbols)
 *   3. Deterministic hash invariance across equivalent objects with randomized key insertion
 *   4. Full round-trip fidelity for all Phase 1 protocol objects:
 *      - CubiOPacket
 *      - CubiOMessage
 *      - ProtocolEnvelope
 *      - ProtocolAddress
 *      - CanonicalNodeConfig
 *      - CanonicalNetworkStateSnapshot
 *   5. Corruption detection (tampered payloads, altered checksums, malformed syntax)
 *   6. Boundary tests (empty objects/arrays/strings, Unicode keys, deep nesting)
 *   7. Full multi-tier protocol integration pipeline
 *
 * Run with:  npx tsx src/cubio/network/protocol/v1/canonicalSerializer.test.ts
 */

import {
  serializeCanonical,
  deserializeCanonical,
  isCanonical,
  canonicalHash,
  serializeCanonicalPacket,
  deserializeCanonicalPacket,
  serializeCanonicalMessage,
  deserializeCanonicalMessage,
  serializeCanonicalEnvelope,
  deserializeCanonicalEnvelope,
  serializeCanonicalAddress,
  deserializeCanonicalAddress,
  serializeCanonicalNodeConfig,
  deserializeCanonicalNodeConfig,
  serializeCanonicalStateSnapshot,
  deserializeCanonicalStateSnapshot,
} from './canonicalSerializer';
import { createPacket } from './packetEngine';
import { createMessage, messageToEnvelope } from './messageEngine';
import { createProtocolAddress } from './protocolEngine';
import { createNodeIdentity, createDefaultNodeConfig } from './nodeArchitecture';
import { CanonicalNetworkStateModel } from './stateModel';

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

function assertThrows(fn: () => void, label: string): void {
  try {
    fn();
    failed++;
    failures.push(label);
    console.error(`  ✗ FAIL (expected throw): ${label}`);
  } catch {
    passed++;
  }
}

// ─── 1. RFC 8785 Canonical JSON Invariants ───────────────────────────────────

function testCanonicalJsonInvariants(): void {
  console.log('\n─── 1. RFC 8785 Canonical JSON Invariants ───');

  // Deep recursive key sorting
  const objA = { z: 10, a: 20, m: { y: 30, b: 40 } };
  const objB = { a: 20, m: { b: 40, y: 30 }, z: 10 };

  const strA = serializeCanonical(objA);
  const strB = serializeCanonical(objB);

  assert(strA === strB, 'Equivalent objects with different key orders serialize to identical strings');
  assert(strA === '{"a":20,"m":{"b":40,"y":30},"z":10}', 'Output keys sorted lexicographically');

  // Minimal whitespace check
  assert(!strA.includes(' '), 'Output contains no space characters');
  assert(!strA.includes('\n'), 'Output contains no newlines');
  assert(!strA.includes('\t'), 'Output contains no tabs');

  // Array element ordering is strictly preserved
  const arr1 = [1, 2, 3];
  const arr2 = [3, 2, 1];
  assert(serializeCanonical(arr1) !== serializeCanonical(arr2), 'Array ordering preserved');

  // Number normalizations (-0 becomes 0)
  assert(serializeCanonical(-0) === '0', '-0 normalizes to 0');
  assert(serializeCanonical(0) === '0', '0 normalizes to 0');

  // isCanonical validator
  assert(isCanonical('{"a":1,"b":2}') === true, 'Strictly canonical string returns true');
  assert(isCanonical('{"b":2,"a":1}') === false, 'Unsorted keys return false');
  assert(isCanonical('{ "a": 1 }') === false, 'Whitespace returns false');
  assert(isCanonical('not json') === false, 'Invalid JSON returns false');
}

// ─── 2. Rejection of Invalid / Ambiguous Inputs ───────────────────────────────

function testInvalidInputRejection(): void {
  console.log('\n─── 2. Rejection of Invalid / Ambiguous Inputs ───');

  // Circular reference detection
  const circular: any = { prop: 'test' };
  circular.self = circular;
  assertThrows(
    () => serializeCanonical(circular),
    'Circular reference throws ERR_CIRCULAR_REFERENCE'
  );

  // Non-finite numbers
  assertThrows(() => serializeCanonical(NaN), 'NaN throws ERR_NON_FINITE_NUMBER');
  assertThrows(() => serializeCanonical(Infinity), 'Infinity throws ERR_NON_FINITE_NUMBER');
  assertThrows(() => serializeCanonical(-Infinity), '-Infinity throws ERR_NON_FINITE_NUMBER');
  assertThrows(() => serializeCanonical({ value: NaN }), 'Nested NaN throws ERR_NON_FINITE_NUMBER');

  // Unsupported types
  assertThrows(() => serializeCanonical(() => {}), 'Function throws ERR_UNSUPPORTED_TYPE');
  assertThrows(() => serializeCanonical(Symbol('test')), 'Symbol throws ERR_UNSUPPORTED_TYPE');
  assertThrows(() => serializeCanonical(BigInt(123)), 'BigInt throws ERR_UNSUPPORTED_TYPE');
}

// ─── 3. Deterministic Hashing ────────────────────────────────────────────────

function testDeterministicHashing(): void {
  console.log('\n─── 3. Deterministic Hashing ───');

  const input1 = { role: 'CORE', priority: 'HIGH', tags: ['a', 'b'], meta: { z: 9, a: 1 } };
  const input2 = { tags: ['a', 'b'], meta: { a: 1, z: 9 }, priority: 'HIGH', role: 'CORE' };

  const hash1 = canonicalHash(input1);
  const hash2 = canonicalHash(input2);

  assert(hash1.startsWith('0xCANON_'), 'Hash has 0xCANON_ prefix');
  assert(hash1 === hash2, 'Equivalent objects produce identical canonicalHash');
}

// ─── 4. Round-Trip Serialization across Protocol Objects ─────────────────────

function testProtocolObjectRoundTrips(): void {
  console.log('\n─── 4. Protocol Object Round-Trips ───');

  // 4a. Address Round-Trip
  const address = createProtocolAddress({
    network: 'CUBIO',
    dimension: 0,
    zone: 1,
    node: 42,
    service: 'TERMINAL',
  });
  const wireAddr = serializeCanonicalAddress(address);
  assert(typeof wireAddr === 'string', 'Address serialized');
  const restoredAddr = deserializeCanonicalAddress(wireAddr);
  assert(restoredAddr.uri === address.uri, 'Address round-trip URI matches');
  assert(restoredAddr.coordinate.node === 42, 'Address round-trip coordinate matches');

  // 4b. Packet Round-Trip
  const packet = createPacket({
    envelopeId: 'ENV_0xTESTROUNDTRIP',
    sourceUri: 'CUBIO://NETWORK/0/01/00001/CORE',
    destinationUri: 'CUBIO://NETWORK/0/01/00002/RELAY',
    payloadData: '{"action":"SYNC_STATE","payload":[1,2,3]}',
    sequenceNumber: 100,
    ttl: 32,
    metadata: { route: 'fast', zone: 'primary' },
  });
  const wirePkt = serializeCanonicalPacket(packet);
  assert(isCanonical(wirePkt), 'Packet wire format is strictly canonical');
  const restoredPkt = deserializeCanonicalPacket(wirePkt);
  assert(restoredPkt.header.packetId === packet.header.packetId, 'Packet ID matches after round-trip');
  assert(restoredPkt.checksum === packet.checksum, 'Packet checksum matches after round-trip');
  assert(restoredPkt.payload.data === packet.payload.data, 'Packet payload matches after round-trip');

  // 4c. Message Round-Trip
  const message = createMessage({
    type: 'RPC_REQUEST',
    communicationMode: 'USER_SERVICE',
    source: {
      cubId: 'CUB-USER0001',
      coordinateUri: 'CUBIO://NETWORK/0/01/00001/TERMINAL',
      entityType: 'USER',
    },
    destination: {
      coordinateUri: 'CUBIO://NETWORK/0/01/00002/INTELLIGENCE',
    },
    body: { query: 'harmonicDeduction', depth: 7 },
    metadata: { client: 'cubio-studio' },
  });
  const wireMsg = serializeCanonicalMessage(message);
  assert(isCanonical(wireMsg), 'Message wire format is strictly canonical');
  const restoredMsg = deserializeCanonicalMessage(wireMsg);
  assert(restoredMsg.messageId === message.messageId, 'Message ID matches after round-trip');
  assert(restoredMsg.payload.contentHash === message.payload.contentHash, 'Message payload contentHash matches');

  // 4d. Envelope Round-Trip
  const envelope = messageToEnvelope(message);
  const wireEnv = serializeCanonicalEnvelope(envelope);
  assert(isCanonical(wireEnv), 'Envelope wire format is strictly canonical');
  const restoredEnv = deserializeCanonicalEnvelope(wireEnv);
  assert(restoredEnv.envelopeId === envelope.envelopeId, 'Envelope ID matches after round-trip');

  // 4e. Node Config Round-Trip
  const identity = createNodeIdentity({
    nodeName: 'Relay Delta',
    coordinateUri: 'CUBIO://NETWORK/0/01/00004/RELAY',
    ownerCubId: 'CUB-ADMIN001',
    role: 'RELAY',
  });
  const config = createDefaultNodeConfig(identity);
  const wireConfig = serializeCanonicalNodeConfig(config);
  assert(isCanonical(wireConfig), 'Node config wire format is canonical');
  const restoredConfig = deserializeCanonicalNodeConfig(wireConfig);
  assert(restoredConfig.identity.nodeId === config.identity.nodeId, 'Node config identity matches after round-trip');

  // 4f. State Snapshot Round-Trip
  const stateModel = new CanonicalNetworkStateModel('CONVERGED');
  stateModel.registerNode('N1', 'CUBIO://NETWORK/0/01/00001/RELAY');
  stateModel.transitionNodeState('N1', 'READY', 'Ready');
  stateModel.transitionNodeState('N1', 'ONLINE', 'Online');
  const snapshot = stateModel.getSnapshot();

  const wireState = serializeCanonicalStateSnapshot(snapshot);
  assert(isCanonical(wireState), 'State snapshot wire format is canonical');
  const restoredSnapshot = deserializeCanonicalStateSnapshot(wireState);
  assert(restoredSnapshot.stateHash === snapshot.stateHash, 'State snapshot stateHash matches after round-trip');
  assert(restoredSnapshot.epoch === snapshot.epoch, 'State snapshot epoch matches');
}

// ─── 5. Corruption & Tampering Detection ─────────────────────────────────────

function testCorruptionDetection(): void {
  console.log('\n─── 5. Corruption & Tampering Detection ───');

  const packet = createPacket({
    envelopeId: 'ENV_0xTESTCORRUPTION',
    sourceUri: 'CUBIO://NETWORK/0/01/00001/CORE',
    destinationUri: 'CUBIO://NETWORK/0/01/00002/RELAY',
    payloadData: '{"intact":true}',
    sequenceNumber: 1,
  });
  const wirePacket = serializeCanonicalPacket(packet);

  // Tamper payload data in wire string
  const tamperedWire = wirePacket.replace('intact', 'tampered');
  assertThrows(
    () => deserializeCanonicalPacket(tamperedWire),
    'Tampered payload fails deserialization with corruption error'
  );

  // Malformed JSON syntax
  assertThrows(
    () => deserializeCanonicalPacket('{"incomplete":'),
    'Malformed JSON syntax rejected on deserialization'
  );

  // Empty string
  assertThrows(
    () => deserializeCanonical(''),
    'Empty wire string rejected'
  );

  // State snapshot hash tampering
  const stateModel = new CanonicalNetworkStateModel('CONVERGED');
  const snap = stateModel.getSnapshot();
  const wireSnap = serializeCanonicalStateSnapshot(snap);
  const tamperedSnap = wireSnap.replace('"clusterState":"CONVERGED"', '"clusterState":"HALTED"');
  assertThrows(
    () => deserializeCanonicalStateSnapshot(tamperedSnap),
    'Tampered state snapshot fails checksum verification'
  );
}

// ─── 6. Boundary Tests ───────────────────────────────────────────────────────

function testBoundaryCases(): void {
  console.log('\n─── 6. Boundary Tests ───');

  // Empty object
  assert(serializeCanonical({}) === '{}', 'Empty object serializes to {}');

  // Empty array
  assert(serializeCanonical([]) === '[]', 'Empty array serializes to []');

  // Empty string
  assert(serializeCanonical('') === '""', 'Empty string serializes to ""');

  // Deeply nested objects
  const deep = { l1: { l2: { l3: { l4: { l5: 'deepValue' } } } } };
  assert(isCanonical(serializeCanonical(deep)), 'Deeply nested object is canonical');

  // Unicode key sorting
  const unicodeKeys = { "é": 1, "e": 2, "a": 3 };
  const strUnicode = serializeCanonical(unicodeKeys);
  assert(strUnicode === '{"a":3,"e":2,"é":1}', 'Unicode keys sorted by UTF-16 code units');
}

// ─── 7. Full Protocol Pipeline Round-Trip ────────────────────────────────────

function testFullProtocolPipeline(): void {
  console.log('\n─── 7. Full Protocol Pipeline Round-Trip ───');

  // Message -> Envelope -> Packet -> Canonical Wire -> Packet -> Envelope -> Message
  const originalMessage = createMessage({
    type: 'DIRECT',
    communicationMode: 'USER_USER',
    source: {
      cubId: 'CUB-USER0001',
      coordinateUri: 'CUBIO://NETWORK/0/01/00001/TERMINAL',
      entityType: 'USER',
    },
    destination: {
      coordinateUri: 'CUBIO://NETWORK/0/01/00002/TERMINAL',
    },
    body: { memo: 'End-to-end canonical serialization test', timestamp: 123456 },
  });

  // 1. Message -> Canonical Wire
  const wireMsg = serializeCanonicalMessage(originalMessage);

  // 2. Decode wire to Message
  const restoredMsg = deserializeCanonicalMessage(wireMsg);
  assert(restoredMsg.messageId === originalMessage.messageId, 'Pipeline step 1: Message intact');

  // 3. Message -> Envelope
  const envelope = messageToEnvelope(restoredMsg);
  const wireEnv = serializeCanonicalEnvelope(envelope);
  const restoredEnv = deserializeCanonicalEnvelope(wireEnv);
  assert(restoredEnv.envelopeId === envelope.envelopeId, 'Pipeline step 2: Envelope intact');

  // 4. Create Packet from Envelope
  const packet = createPacket({
    envelopeId: restoredEnv.envelopeId,
    sourceUri: restoredEnv.source.uri,
    destinationUri: restoredEnv.destination.uri,
    payloadData: JSON.stringify(restoredEnv),
  });
  const wirePkt = serializeCanonicalPacket(packet);
  const restoredPkt = deserializeCanonicalPacket(wirePkt);
  assert(restoredPkt.header.packetId === packet.header.packetId, 'Pipeline step 3: Packet intact');

  assert(
    canonicalHash(originalMessage).startsWith('0xCANON_'),
    'Pipeline complete: canonicalHash verified'
  );
}

// ─── Execution ───────────────────────────────────────────────────────────────

console.log('═══════════════════════════════════════════════════════════');
console.log('  CUBiO Protocol Serialization — Canonical Test Suite');
console.log('  Specification Target: Phase 1 / Task 07');
console.log('═══════════════════════════════════════════════════════════');

testCanonicalJsonInvariants();
testInvalidInputRejection();
testDeterministicHashing();
testProtocolObjectRoundTrips();
testCorruptionDetection();
testBoundaryCases();
testFullProtocolPipeline();

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
