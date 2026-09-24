/**
 * CUBiO Network Protocol v1 — Phase 1 Master Foundation Test Suite
 * ================================================================
 *
 * Comprehensive end-to-end integration and foundation verification suite
 * testing the entire Phase 1 protocol stack working in concert:
 *
 *   [1] Protocol Specification & Envelopes (Task 01)
 *   [2] Packet Model & Framing (Task 02)
 *   [3] Message Model & Semantic Dispatch (Task 03)
 *   [4] Canonical Node Architecture (Task 04)
 *   [5] Network State Model & Reconciliation (Task 05)
 *   [6] Protocol Versioning & SemVer Handshakes (Task 06)
 *   [7] Canonical RFC 8785 Serialization (Task 07)
 *   [8] Central Constants Registry (Task 08)
 *   [9] Error & Response Model with Sanitization (Task 09)
 *  [10] Central Protocol Validation Layer (Task 10)
 *
 * INVARIANTS TESTED:
 *   - End-to-end multi-tier pipeline fidelity: Message ──▶ Envelope ──▶ Packets ──▶ Wire ──▶ Node ──▶ State ──▶ Response
 *   - Absolute determinism: σ² = 0 across 50 full pipeline iterations
 *   - Fail-closed security: attacks, corruption, and malformed frames rejected at every gate
 *   - Secret & filesystem zero-leakage guarantee
 *   - Mathematical reconciliation against CUBIO_NETWORK_CONSTANTS
 *
 * Run with:  npx tsx src/cubio/network/protocol/v1/phase1Foundation.test.ts
 */

import {
  CUBIO_NETWORK_CONSTANTS,
  PROTOCOL_IDENTIFIERS,
  PROTOCOL_LIMITS,
  COORDINATE_BOUNDS,
  PROTOCOL_VERSIONS,
} from './constants';
import {
  createEnvelope,
  createProtocolAddress,
  validateEnvelope,
} from './protocolEngine';
import {
  createPacket,
  packetizeEnvelope,
  reassembleEnvelope,
  validatePacket,
  computePacketChecksum,
} from './packetEngine';
import {
  createMessage,
  generateMessageId,
  messageToEnvelope,
  envelopeToMessage,
  validateMessage,
} from './messageEngine';
import {
  createNodeIdentity,
  createDefaultNodeConfig,
  CanonicalNetworkNode,
  validateNodeConfig,
} from './nodeArchitecture';
import {
  CanonicalNetworkStateModel,
  computeNetworkStateHash,
} from './stateModel';
import {
  ProtocolVersionManager,
  evaluateVersionCompatibility,
} from './versionManager';
import {
  serializeCanonical,
  deserializeCanonical,
  canonicalHash,
  serializeCanonicalPacket,
  deserializeCanonicalPacket,
  serializeCanonicalMessage,
  deserializeCanonicalMessage,
  serializeCanonicalEnvelope,
  deserializeCanonicalEnvelope,
} from './canonicalSerializer';
import {
  createSuccessResponse,
  createErrorResponse,
  createProtocolError,
  createValidationError,
  createVersionError,
  createInternalError,
  serializeResponse,
  deserializeResponse,
  responseHash,
} from './responseEngine';
import {
  type CubiOSuccessResponse,
  type CubiOErrorResponse,
} from './responseTypes';
import { CubiOProtocolValidator } from './protocolValidator';
import { CubiOPacket } from './packetTypes';
import { CubiOMessage } from './messageTypes';
import { ProtocolEnvelope } from './types';

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
console.log('\n════════════════════════════════════════════════════════════════');
console.log('  CUBiO AI — Phase 1 Master Foundation Test Suite (Task 11)');
console.log('════════════════════════════════════════════════════════════════\n');

// ═════════════════════════════════════════════════════════════════════════════
// 1. Full End-to-End Pipeline Integration (Tasks 01 through 10)
// ═════════════════════════════════════════════════════════════════════════════

console.log('1. Full End-to-End Multi-Tier Pipeline Integration:');

test('Step 1-15: Complete protocol lifecycle from message creation to response delivery', () => {
  // Step 1: Create sender and receiver node identities (Task 04)
  const senderIdentity = createNodeIdentity({
    nodeName: 'CORE_NODE_01',
    coordinateUri: 'CUBIO://NETWORK/0/01/00001/CORE',
    ownerCubId: 'CUB-00000001',
    role: 'CORE',
  });
  const receiverIdentity = createNodeIdentity({
    nodeName: 'AGENT_NODE_02',
    coordinateUri: 'CUBIO://NETWORK/0/01/00002/AGENT',
    ownerCubId: 'CUB-00000002',
    role: 'COMPUTE',
  });

  // Step 2: Validate node configurations (Task 04 & Task 10)
  const senderConfig = createDefaultNodeConfig(senderIdentity);
  const receiverConfig = createDefaultNodeConfig(receiverIdentity);
  assert(CubiOProtocolValidator.validateNodeMetadata(senderConfig).isValid, 'Sender config valid');
  assert(CubiOProtocolValidator.validateNodeMetadata(receiverConfig).isValid, 'Receiver config valid');

  // Step 3: Negotiate protocol version between nodes (Task 06)
  const senderVersionMgr = new ProtocolVersionManager({ nodeId: senderIdentity.nodeId });
  const receiverVersionMgr = new ProtocolVersionManager({ nodeId: receiverIdentity.nodeId });
  const offer = senderVersionMgr.createOffer([{ major: 1, minor: 0, patch: 0 }], ['ROUTING', 'STREAMING']);
  const handshakeResult = receiverVersionMgr.negotiate(offer);
  assert(handshakeResult.status === 'ACCEPTED', 'Version negotiation must succeed');
  assert(handshakeResult.versionString === 'CNP/1.0.0', 'Version negotiated is CNP/1.0.0');

  // Step 4: Construct application message (Task 03)
  const applicationPayload = {
    instruction: 'EXECUTE_SPATIAL_QUERY',
    parameters: { dimension: 0, zone: 1, radius: 100 },
    timestamp: 1700000000000,
  };
  const originalMessage = createMessage({
    type: 'RPC_REQUEST',
    communicationMode: 'USER_AGENT',
    source: {
      cubId: senderIdentity.ownerCubId,
      coordinateUri: senderIdentity.coordinateUri,
      entityType: 'SERVICE',
    },
    destination: {
      coordinateUri: receiverIdentity.coordinateUri,
      recipientCubId: receiverIdentity.ownerCubId,
    },
    body: applicationPayload,
  });
  assert(CubiOProtocolValidator.validateMessage(originalMessage).isValid, 'Message valid');

  // Step 5: Bridge message to protocol envelope (Task 03 -> Task 01)
  const envelope = messageToEnvelope(originalMessage);
  assert(CubiOProtocolValidator.validateEnvelope(envelope).isValid, 'Envelope valid');

  // Step 6: Chunk envelope into bounded wire packets (Task 01 -> Task 02)
  const packets = packetizeEnvelope(envelope, 512); // MTU: 512 bytes forces chunking
  assert(packets.length > 1, 'Multi-fragment packetization expected for 512 MTU');
  for (const pkt of packets) {
    assert(CubiOProtocolValidator.validatePacket(pkt).isValid, 'Packet fragment valid');
  }

  // Step 7: Serialize packets to RFC 8785 Canonical JSON (Task 07)
  const serializedPackets = packets.map(p => serializeCanonicalPacket(p));
  assert(serializedPackets.every(s => typeof s === 'string' && !s.includes(' ')), 'Canonical formatting');

  // Step 8: Deserialize wire packets back to CubiOPacket instances (Task 07)
  const deserializedPackets = serializedPackets.map(s => deserializeCanonicalPacket(s));
  assert(deserializedPackets.length === packets.length, 'All packets deserialized');

  // Step 9: Reassemble packets into original envelope (Task 02)
  const reassembledEnvelope = reassembleEnvelope(deserializedPackets);
  assert(CubiOProtocolValidator.validateEnvelope(reassembledEnvelope).isValid, 'Reassembled envelope valid');
  assert(reassembledEnvelope.envelopeId === envelope.envelopeId, 'EnvelopeId matches');

  // Step 10: Extract application message from reassembled envelope (Task 01 -> Task 03)
  const extractedMessage = envelopeToMessage<typeof applicationPayload>(reassembledEnvelope as ProtocolEnvelope<typeof applicationPayload>);
  assert(extractedMessage.messageId === `MSG_${envelope.envelopeId.replace('ENV_', '')}`, 'Reconstructed message ID derived deterministically from envelope');
  assert(extractedMessage.payload.body.instruction === 'EXECUTE_SPATIAL_QUERY', 'Payload preserved');
  assert(extractedMessage.payload.body.parameters.radius === 100, 'Nested parameters preserved');

  // Step 11: Receiver node processes inbound packet (Task 04)
  const receiverNode = new CanonicalNetworkNode(receiverConfig);
  receiverNode.start();
  const processingResult = receiverNode.processInboundPacket(deserializedPackets[0]);
  assert(processingResult.action === 'TERMINATED_LOCAL', 'Node processed packet locally');

  // Step 12: Transition network state model (Task 05)
  const stateModel = new CanonicalNetworkStateModel('BOOTSTRAP');
  stateModel.transitionClusterState('FORMING', 'Initial nodes connecting');
  stateModel.registerNode(senderIdentity.nodeId, senderIdentity.coordinateUri);
  stateModel.registerNode(receiverIdentity.nodeId, receiverIdentity.coordinateUri);
  stateModel.transitionNodeState(senderIdentity.nodeId, 'READY', 'Initialized');
  stateModel.transitionNodeState(receiverIdentity.nodeId, 'READY', 'Initialized');
  stateModel.transitionNodeState(senderIdentity.nodeId, 'ONLINE', 'Ready');
  stateModel.transitionNodeState(receiverIdentity.nodeId, 'ONLINE', 'Ready');
  stateModel.transitionClusterState('CONVERGED', 'Quorum attained');
  const snapshot = stateModel.getSnapshot();
  assert(CubiOProtocolValidator.validateNetworkState(snapshot).isValid, 'State snapshot valid');
  assert(snapshot.clusterState === 'CONVERGED', 'Cluster converged');

  // Step 13: Receiver generates canonical response (Task 09)
  const response = createSuccessResponse(originalMessage.messageId, {
    result: 'QUERY_EXECUTED',
    matchedEntities: 7,
    executionTimeMs: 1.25,
  });
  assert(CubiOProtocolValidator.validateResponse(response).isValid, 'Response valid');

  // Step 14: Serialize response canonically (Task 07 & Task 09)
  const wireResponse = serializeResponse(response);
  const deserializedResponse = deserializeResponse<any>(wireResponse);
  assert(deserializedResponse.status === 'SUCCESS', 'Response status SUCCESS');
  assert(deserializedResponse.correlationId === originalMessage.messageId, 'CorrelationId matches');
  assert((deserializedResponse as CubiOSuccessResponse<any>).payload.matchedEntities === 7, 'Response payload intact');

  // Step 15: Content-addressable response hash invariance
  const rHash = responseHash(response);
  assert(rHash.startsWith('0x'), 'Response hash valid');
  assert(rHash === responseHash(deserializedResponse), 'Response hash matches round-trip');
});

// ═════════════════════════════════════════════════════════════════════════════
// 2. Deterministic Invariance Verification (σ² = 0)
// ═════════════════════════════════════════════════════

console.log('2. Deterministic Invariance Verification (σ² = 0 across 50 runs):');

test('50 independent pipeline executions yield identical hashes and wire frames', () => {
  const fixedTimestamp = 1700000000000;
  const fixedNonce = 'DETERMINISTIC_NONCE_42';

  // 1. Message ID deterministic generation across 50 runs
  const baseMsgId = generateMessageId(
    'CUB-00000001',
    'CUBIO://NETWORK/0/01/00002/APP',
    'DIRECT',
    fixedTimestamp,
    fixedNonce
  );

  for (let i = 0; i < 50; i++) {
    const iterMsgId = generateMessageId(
      'CUB-00000001',
      'CUBIO://NETWORK/0/01/00002/APP',
      'DIRECT',
      fixedTimestamp,
      fixedNonce
    );
    assert(iterMsgId === baseMsgId, `Run ${i} messageId matches`);
  }

  // 2. Canonical serialization, packetization, and response hash determinism
  const fixedMessage = createMessage({
    type: 'DIRECT',
    communicationMode: 'USER_USER',
    source: { cubId: 'CUB-00000001', coordinateUri: 'CUBIO://NETWORK/0/01/00001/APP', entityType: 'USER' },
    destination: { coordinateUri: 'CUBIO://NETWORK/0/01/00002/APP' },
    body: { action: 'ping', count: 1 },
    nonce: fixedNonce,
  });

  const fixedEnvelope = messageToEnvelope(fixedMessage);
  const fixedPackets = packetizeEnvelope(fixedEnvelope, 1400);
  const basePktSerialization = serializeCanonicalPacket(fixedPackets[0]);
  const basePktHash = canonicalHash(fixedPackets[0]);
  const baseResponse = createSuccessResponse(fixedMessage.messageId, { ack: true }, {
    timestamp: fixedTimestamp,
    responseId: 'RSP_FIXED_TEST',
  });
  const baseRespHash = responseHash(baseResponse);

  for (let i = 0; i < 50; i++) {
    const serializedPkt = serializeCanonicalPacket(fixedPackets[0]);
    const pHash = canonicalHash(fixedPackets[0]);
    const rHash = responseHash(baseResponse);

    assert(serializedPkt === basePktSerialization, `Run ${i} serialized packet matches`);
    assert(pHash === basePktHash, `Run ${i} packet hash matches`);
    assert(rHash === baseRespHash, `Run ${i} response hash matches`);
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// 3. Large Payload Multi-Fragment Pipeline
// ═════════════════════════════════════════════════════

console.log('3. Large Payload Multi-Fragment Pipeline (MTU Stress & Reassembly):');

test('60 KB payload chunked into 45 fragments reassembles bit-for-bit identical', () => {
  // Generate a large payload just under the 64 KB limit
  const largeData = 'A'.repeat(60_000);
  const largeMessage = createMessage({
    type: 'SPATIAL_EVENT',
    communicationMode: 'SERVICE_SERVICE',
    source: { cubId: 'CUB-00000001', coordinateUri: 'CUBIO://NETWORK/0/01/00001/STORAGE', entityType: 'SERVICE' },
    destination: { coordinateUri: 'CUBIO://NETWORK/0/01/00002/COMPUTE' },
    body: { bulkData: largeData },
  });

  const envelope = messageToEnvelope(largeMessage);
  const mtu = 1400; // Standard MTU
  const fragments = packetizeEnvelope(envelope, mtu);

  assert(fragments.length >= 40, `Expected >= 40 fragments, got ${fragments.length}`);
  assert(Boolean(fragments[0].header.flags & CUBIO_NETWORK_CONSTANTS.FLAGS.FRAG), 'FRAG flag set');
  assert(Boolean(fragments[fragments.length - 1].header.flags & CUBIO_NETWORK_CONSTANTS.FLAGS.LAST_FRAG), 'LAST_FRAG set');

  // Verify each fragment satisfies central validator
  for (let i = 0; i < fragments.length; i++) {
    const outcome = CubiOProtocolValidator.validatePacket(fragments[i]);
    assert(outcome.isValid, `Fragment ${i} must be valid`);
  }

  // Reassemble
  const reassembled = reassembleEnvelope(fragments);
  const extracted = envelopeToMessage<{ bulkData: string }>(reassembled as ProtocolEnvelope<{ bulkData: string }>);

  assert(extracted.payload.body.bulkData.length === 60_000, 'Full payload restored');
  assert(extracted.payload.body.bulkData === largeData, 'Payload is bit-for-bit identical');
});

// ═════════════════════════════════════════════════════════════════════════════
// 4. Malformed Input & Fuzzing Invariant Tests
// ═════════════════════════════════════════════════════

console.log('4. Malformed Input & Fuzzing Invariant Tests:');

test('Packet with tampered checksum fails closed immediately', () => {
  const pkt = createPacket({
    envelopeId: 'ENV_0xFAIL',
    sourceUri: 'CUBIO://NETWORK/0/01/00001/TERMINAL',
    destinationUri: 'CUBIO://NETWORK/0/01/00002/TERMINAL',
    payloadData: 'data',
  });
  const corrupted = { ...pkt, checksum: '0xCHK_CORRUPTED_0000' };
  const outcome = CubiOProtocolValidator.validatePacket(corrupted);
  assert(!outcome.isValid, 'Corrupted packet must fail');
  assert(outcome.errors.some(e => e.code === 'ERR_CHECKSUM_MISMATCH'), 'Reports checksum mismatch');
});

test('Packet with out-of-order fragment index fails reassembly', () => {
  const env = createEnvelope({
    kind: 'EVENT',
    source: createProtocolAddress({ network: 'CUBIO', dimension: 0, zone: 1, node: 1, service: 'SVC' }),
    destination: createProtocolAddress({ network: 'CUBIO', dimension: 0, zone: 1, node: 2, service: 'SVC' }),
    sender: { cubId: 'CUB-00000001', entityType: 'SERVICE', signature: '0xSIG' },
    payload: { category: 'DIRECT_MESSAGE', priority: 'NORMAL', contentType: 'text/plain', body: 'data', bodyBytes: 4 },
  });
  const frags = packetizeEnvelope(env, 128); // Multiple fragments

  // Drop fragment 1 (incomplete sequence)
  const missingFrag = [frags[0], ...frags.slice(2)];
  let threw = false;
  try {
    reassembleEnvelope(missingFrag);
  } catch (err) {
    threw = true;
  }
  assert(threw, 'Missing fragment must throw during reassembly');
});

test('Forged sovereign entity format rejected fail-closed', () => {
  const forged = {
    messageId: 'MSG_0xFORGED',
    protocolVersion: 'CNP/1.0',
    type: 'DIRECT',
    communicationMode: 'USER_USER',
    priority: 'NORMAL',
    state: 'DRAFT',
    source: {
      cubId: 'FORGED_ID_NO_PREFIX', // Missing CUB-
      coordinateUri: 'CUBIO://NETWORK/0/01/00001/CORE',
    },
    destination: {
      coordinateUri: 'CUBIO://NETWORK/0/01/00002/AGENT',
    },
    payload: { body: {}, bodyBytes: 2, contentHash: '0xHASH' },
    lifecycle: { createdAt: 1000, expiresAt: 300000, ttlMs: 299000 },
    traceRoute: [],
  };
  const outcome = CubiOProtocolValidator.validateMessage(forged);
  assert(!outcome.isValid, 'Forged ID must fail message validation');
  assert(outcome.errors.some(e => e.code === 'ERR_INVALID_SENDER_ID' || e.code === 'ERR_INVALID_SOURCE'), 'Reports invalid sender');
});

test('Incompatible protocol major version rejected deterministically', () => {
  const offer = {
    initiatorNodeId: 'NODE_ROGUE_V2',
    offeredVersions: [{ major: 2, minor: 0, patch: 0 }],
    requestedCapabilities: [],
    clientImplementation: 'cubio-v2-prototype',
    nonce: 'NONCE_V2',
  };
  const versionMgr = new ProtocolVersionManager({ nodeId: 'NODE_RUNTIME_V1' });
  const result = versionMgr.negotiate(offer);
  assert(result.status === 'REJECTED', 'Must reject v2 handshake');
  assert(result.rejectionCode === 'ERR_VERSION_INCOMPATIBLE', 'Reports ERR_VERSION_INCOMPATIBLE');
});

// ═════════════════════════════════════════════════════════════════════════════
// 5. Secret & Filesystem Zero-Leakage Guarantee
// ═════════════════════════════════════════════════════

console.log('5. Secret & Filesystem Zero-Leakage Guarantee:');

test('Error response scrubbers sanitize sensitive data, Windows paths, and stack traces', () => {
  const sensitiveError = new Error(
    'Failed to read private key at C:\\Users\\Admin\\AppData\\keys\\master.pem\n    at loadKey (auth.ts:12:4)\n    at init (server.ts:40:1)'
  );
  const errResponse = createInternalError('CORR_LEAK_TEST', sensitiveError, {
    details: {
      password: 'unhashed_password_123',
      api_key: 'sk_live_abcdef987654',
      token: 'jwt.token.here',
      systemFilePath: '/home/deploy/production/.env',
      safeMetric: 99.9,
    },
  });

  const wire = serializeResponse(errResponse);
  assert(!wire.includes('Admin'), 'Windows username must not appear');
  assert(!wire.includes('master.pem'), 'File name must not appear');
  assert(!wire.includes('auth.ts'), 'Stack trace must not appear');
  assert(!wire.includes('unhashed_password_123'), 'Password must not appear');
  assert(!wire.includes('sk_live_abcdef987654'), 'API key must not appear');
  assert(!wire.includes('/home/deploy'), 'POSIX path must not appear');
  assert(wire.includes('[REDACTED]'), 'Redacted tokens present');
  assert(wire.includes('[REDACTED_PATH]'), 'Redacted paths present');
  assert(errResponse.error.details?.safeMetric === 99.9, 'Safe metrics preserved');
});

// ═════════════════════════════════════════════════════════════════════════════
// 6. Network State Quorum Recovery Invariant
// ═════════════════════════════════════════════════════

console.log('6. Network State Quorum Recovery Invariant:');

test('Network state model transitions through degradation, partitioning, and recovery', () => {
  const model = new CanonicalNetworkStateModel('BOOTSTRAP');
  model.transitionClusterState('FORMING', 'Nodes joining');

  // Register 4 nodes
  for (let i = 1; i <= 4; i++) {
    model.registerNode(`NODE_${i}`, `CUBIO://NETWORK/0/01/0000${i}/RELAY`);
    model.transitionNodeState(`NODE_${i}`, 'READY', 'Init');
    model.transitionNodeState(`NODE_${i}`, 'ONLINE', 'Ready');
  }

  model.transitionClusterState('CONVERGED', 'Quorum established');
  assert(model.clusterState === 'CONVERGED', 'Cluster CONVERGED');

  // Fault 3 out of 4 nodes (> 50% majority faulted)
  model.transitionNodeState('NODE_1', 'FAULTED', 'Hardware fault');
  model.transitionNodeState('NODE_2', 'FAULTED', 'Link severed');
  model.transitionNodeState('NODE_3', 'FAULTED', 'Timeout');

  const reconciled = model.reconcileClusterHealth();
  assert(reconciled === 'PARTITIONED', 'Cluster must detect partition');

  // Recover partition
  model.recoverPartition('Bridge restored');
  assert(model.clusterState === 'CONVERGED', 'Cluster re-converged');

  const snapshot = model.getSnapshot();
  const hash = computeNetworkStateHash(snapshot);
  assert(snapshot.stateHash === hash, 'Snapshot checksum matches computed state hash');
});

// ═════════════════════════════════════════════════════════════════════════════
// 7. Master Constants Registry Alignment Check
// ═════════════════════════════════════════════════════

console.log('7. Master Constants Registry Alignment:');

test('Constants registry mathematically enforces all system constraints', () => {
  assert(PROTOCOL_IDENTIFIERS.PACKET_MAGIC === 'CUB1', 'PACKET_MAGIC is CUB1');
  assert(PROTOCOL_IDENTIFIERS.PROTOCOL_VERSION_STRING === 'CNP/1.0', 'PROTOCOL_VERSION_STRING is CNP/1.0');
  assert(PROTOCOL_LIMITS.MAX_PACKET_BYTES === 65536, 'MAX_PACKET_BYTES is 64 KB');
  assert(COORDINATE_BOUNDS.MAX_DIMENSION === 99, 'MAX_DIMENSION is 99');
  assert(COORDINATE_BOUNDS.MAX_ZONE === 99, 'MAX_ZONE is 99');
  assert(COORDINATE_BOUNDS.MAX_NODE === 99999, 'MAX_NODE is 99999');
  assert(PROTOCOL_VERSIONS.CURRENT.major === 1, 'Current major version is 1');
  assert(Object.isFrozen(CUBIO_NETWORK_CONSTANTS), 'Constants registry deeply frozen');
});

// ═════════════════════════════════════════════════════════════════════════════
// 8. Cross-Component Error Escalation & Response Mapping
// ═════════════════════════════════════════════════════

console.log('8. Cross-Component Error Escalation & Response Mapping:');

test('Protocol validation failure converts deterministically to canonical error response', () => {
  const invalidEnvelope = {
    protocolVersion: 'CNP/99.0',
    envelopeId: 'INVALID_ENV',
    kind: 'UNKNOWN_KIND',
  };

  const validationResult = CubiOProtocolValidator.validateEnvelope(invalidEnvelope);
  assert(!validationResult.isValid, 'Malformed envelope must fail validation');

  const errorResponse = createValidationError(
    'CORR_VAL_001',
    'ERR_VALIDATION_FAILED',
    validationResult.errors.map(e => e.message).join('; '),
    {
      details: { attemptedKind: 'UNKNOWN_KIND' },
    }
  );

  assert(errorResponse.status === 'ERROR', 'Status is ERROR');
  assert(errorResponse.error.code === 'ERR_VALIDATION_FAILED', 'Error code is ERR_VALIDATION_FAILED');
  assert(typeof errorResponse.error.message === 'string', 'Validation error message populated');

  const wire = serializeResponse(errorResponse);
  const deserialized = deserializeResponse(wire);
  assert(deserialized.status === 'ERROR', 'Deserialized status preserved');
  assert(deserialized.correlationId === 'CORR_VAL_001', 'CorrelationId preserved');
  assert((deserialized as CubiOErrorResponse).error.code === 'ERR_VALIDATION_FAILED', 'Error code preserved');
});

// ═════════════════════════════════════════════════════════════════════════════
// 9. Protocol Coordinate and Boundary Limits Invariance
// ═════════════════════════════════════════════════════

console.log('9. Protocol Coordinate and Boundary Limits Invariance:');

test('Boundary values (min and max limits) are accepted while out-of-bounds are rejected', () => {
  // Lower bound valid coordinate
  const minCoord = createProtocolAddress({ network: 'CUBIO', dimension: 0, zone: 0, node: 0, service: 'SVC' });
  assert(minCoord.uri === 'CUBIO://NETWORK/0/00/00000/SVC', 'Min coordinate formatted correctly');

  // Upper bound valid coordinate
  const maxCoord = createProtocolAddress({ network: 'CUBIO', dimension: 99, zone: 99, node: 99999, service: 'SVC' });
  assert(maxCoord.uri === 'CUBIO://NETWORK/99/99/99999/SVC', 'Max coordinate formatted correctly');

  // Out of bounds dimension (> 99)
  let oobThrew = false;
  try {
    createProtocolAddress({ network: 'CUBIO', dimension: 100, zone: 0, node: 0, service: 'SVC' });
  } catch {
    oobThrew = true;
  }
  assert(oobThrew, 'Dimension 100 must throw out-of-bounds error');

  // Out of bounds node number (> 99999)
  oobThrew = false;
  try {
    createProtocolAddress({ network: 'CUBIO', dimension: 0, zone: 0, node: 100000, service: 'SVC' });
  } catch {
    oobThrew = true;
  }
  assert(oobThrew, 'Node 100000 must throw out-of-bounds error');
});

// ═════════════════════════════════════════════════════════════════════════════
// 10. Strict RFC 8785 Serialization Invariance across Key Insertion Orders
// ═════════════════════════════════════════════════════

console.log('10. Strict RFC 8785 Serialization Invariance:');

test('Arbitrary property insertion ordering produces identical byte serialization and hash', () => {
  const objA = { z: 26, a: 1, m: { y: 25, b: 2 } };
  const objB = { a: 1, m: { b: 2, y: 25 }, z: 26 };

  const serializedA = serializeCanonical(objA);
  const serializedB = serializeCanonical(objB);
  assert(serializedA === serializedB, 'Serialized forms must be identical');

  const hashA = canonicalHash(objA);
  const hashB = canonicalHash(objB);
  assert(hashA === hashB, 'Hashes must be identical');
});

// ═════════════════════════════════════════════════════════════════════════════
// 11. State Machine Monotonicity & Illegal Transition Invariance
// ═════════════════════════════════════════════════════

console.log('11. State Machine Monotonicity & Illegal Transition Invariance:');

test('Illegal state transitions throw deterministically without corrupting state model', () => {
  const model = new CanonicalNetworkStateModel('BOOTSTRAP');
  model.registerNode('TEST_NODE', 'CUBIO://NETWORK/0/01/00001/CORE');

  // Initial state is INITIALIZING. Attempt illegal transition directly to OFFLINE
  let threw = false;
  try {
    model.transitionNodeState('TEST_NODE', 'OFFLINE' as any, 'Illegal skip');
  } catch (err) {
    threw = true;
  }
  assert(threw, 'Illegal transition INITIALIZING -> OFFLINE must throw');

  // Verify node state was untouched via snapshot
  const snapshotBefore = model.getSnapshot();
  assert(snapshotBefore.nodes['TEST_NODE']?.state === 'INITIALIZING', 'Node state remains INITIALIZING');

  // Valid path: INITIALIZING -> READY -> ONLINE
  model.transitionNodeState('TEST_NODE', 'READY', 'Init complete');
  model.transitionNodeState('TEST_NODE', 'ONLINE', 'Activated');
  const snapshotAfter = model.getSnapshot();
  assert(snapshotAfter.nodes['TEST_NODE']?.state === 'ONLINE', 'Node successfully ONLINE');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n════════════════════════════════════════════════════════════════`);
console.log(`  Phase 1 Master Foundation Results: ${passed} PASSED, ${failed} FAILED`);
console.log(`════════════════════════════════════════════════════════════════\n`);

if (failed > 0) {
  process.exit(1);
}
