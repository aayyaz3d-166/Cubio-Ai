/**
 * CUBiO Network Protocol v1 — Canonical Message Model Test Suite
 * ============================================================
 *
 * Comprehensive tests for Task 03:
 *   1. Construction across message types and communication modes
 *   2. Validation constraints and malformed message rejection
 *   3. Lifecycle state machine transitions and timestamp integrity
 *   4. Determinism properties and key canonicalization
 *   5. Deterministic wire serialization & deserialization round-trip
 *   6. Bidirectional ProtocolEnvelope bridge (Task 03 <-> Task 01)
 *   7. Direct Packet Pipeline integration (Task 03 <-> Task 02: Message -> Envelope -> Packets -> Message)
 *
 * Run with:  npx tsx src/cubio/network/protocol/v1/messageEngine.test.ts
 */

import {
  createMessage,
  validateMessage,
  transitionMessageState,
  serializeMessage,
  deserializeMessage,
  messageToEnvelope,
  envelopeToMessage,
  messageToPackets,
  packetsToMessage,
  computeMessagePayloadHash,
  generateMessageId,
} from './messageEngine';
import {
  MAX_MESSAGE_PAYLOAD_BYTES,
  type CubiOMessage,
  type CreateMessageOptions,
} from './messageTypes';
import { validateEnvelope } from './protocolEngine';
import { validatePacket } from './packetEngine';
import { PROTOCOL_VERSION_STRING } from './types';

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

const SRC_CUB_ID = 'CUB-USER0001';
const DST_CUB_ID = 'CUB-AGNT0002';
const SRC_COORD = 'CUBIO://NETWORK/0/01/00001/TERMINAL';
const DST_COORD = 'CUBIO://NETWORK/0/01/00002/INTELLIGENCE';

function makeDefaultMessageOptions(overrides: Partial<CreateMessageOptions> = {}): CreateMessageOptions {
  return {
    type: 'DIRECT',
    communicationMode: 'USER_USER',
    source: {
      cubId: SRC_CUB_ID,
      coordinateUri: SRC_COORD,
      entityType: 'USER',
      displayName: 'Alice Sovereign',
    },
    destination: {
      coordinateUri: DST_COORD,
      recipientCubId: DST_CUB_ID,
    },
    body: { text: 'Hello CUBiO network', count: 42 },
    priority: 'NORMAL',
    subject: 'Greeting',
    metadata: { env: 'test', channel: 'primary' },
    nonce: 'NONCE_MSG_001',
    ...overrides,
  };
}

// ─── 1. Valid Message Construction Tests ─────────────────────────────────────

function testValidMessageConstruction(): void {
  console.log('\n─── 1. Valid Message Construction ───');

  const msg = createMessage(makeDefaultMessageOptions());

  assert(msg.protocolVersion === PROTOCOL_VERSION_STRING, 'Protocol version is CNP/1.0');
  assert(msg.messageId.startsWith('MSG_'), 'Message ID starts with MSG_');
  assert(msg.type === 'DIRECT', 'Message type is DIRECT');
  assert(msg.communicationMode === 'USER_USER', 'Communication mode is USER_USER');
  assert(msg.priority === 'NORMAL', 'Priority is NORMAL');
  assert(msg.state === 'DRAFT', 'Initial lifecycle state is DRAFT');
  assert(msg.source.cubId === SRC_CUB_ID, 'Source cubId correct');
  assert(msg.source.coordinateUri === SRC_COORD, 'Source coordinateUri correct');
  assert(msg.destination.coordinateUri === DST_COORD, 'Destination coordinateUri correct');
  assert(msg.destination.recipientCubId === DST_CUB_ID, 'Recipient cubId correct');
  assert(msg.subject === 'Greeting', 'Subject preserved');
  assert(msg.payload.contentType === 'application/json', 'Payload contentType is application/json');
  assert(msg.payload.contentHash.startsWith('0xMPL_'), 'Payload contentHash calculated');
  assert(msg.payload.byteLength > 0, 'Payload byteLength is positive');
  assert(msg.signature.startsWith('0xSIG_'), 'Signature generated');
  assert(msg.timestamps.createdAt > 0, 'Timestamp createdAt is positive');
  assert(msg.timestamps.expiresAt > msg.timestamps.createdAt, 'Timestamp expiresAt is after createdAt');
  assert(msg.traceRoute.length === 1, 'Trace route initialized with source coordinate');

  const valResult = validateMessage(msg);
  assert(valResult.valid === true, 'Valid message passes validation');
  assert(valResult.errors.length === 0, 'No validation errors on valid message');

  // Verify other message types
  const rpcMsg = createMessage(makeDefaultMessageOptions({
    type: 'RPC_REQUEST',
    communicationMode: 'USER_SERVICE',
    body: { method: 'getMemoryState', params: [369] },
  }));
  assert(validateMessage(rpcMsg).valid === true, 'RPC_REQUEST message passes validation');

  const agentMsg = createMessage(makeDefaultMessageOptions({
    type: 'AGENT_PROMPT',
    communicationMode: 'USER_AGENT',
    body: { prompt: 'Synthesize spatial vector', constraints: ['D3', 'HCP'] },
  }));
  assert(validateMessage(agentMsg).valid === true, 'AGENT_PROMPT message passes validation');

  const broadcastMsg = createMessage(makeDefaultMessageOptions({
    type: 'CHANNEL_BROADCAST',
    destination: {
      coordinateUri: 'CUBIO://NETWORK/0/01/00000/BROADCAST',
      channelId: 'CHAN_GLOBAL_ALERTS',
    },
    body: { alert: 'Mesh reconfiguration' },
  }));
  assert(validateMessage(broadcastMsg).valid === true, 'CHANNEL_BROADCAST message passes validation');
}

// ─── 2. Malformed & Invalid Message Rejection ────────────────────────────────

function testInvalidMessageDetection(): void {
  console.log('\n─── 2. Malformed & Invalid Message Rejection ───');

  const base = createMessage(makeDefaultMessageOptions());

  // Null input
  assert(validateMessage(null).valid === false, 'Null message fails validation');

  // Bad protocol version
  const badVer = { ...base, protocolVersion: 'CNP/2.0' };
  const rVer = validateMessage(badVer);
  assert(rVer.valid === false, 'Bad protocol version rejected');
  assert(rVer.errors.some(e => e.code === 'ERR_INVALID_VERSION'), 'ERR_INVALID_VERSION present');

  // Bad message ID
  const badId = { ...base, messageId: 'INVALID_ID' };
  assert(validateMessage(badId).valid === false, 'Invalid message ID rejected');

  // Invalid type
  const badType = { ...base, type: 'UNKNOWN_TYPE' as any };
  assert(validateMessage(badType).valid === false, 'Unknown message type rejected');

  // Invalid communication mode
  const badMode = { ...base, communicationMode: 'TELEPATHY' as any };
  assert(validateMessage(badMode).valid === false, 'Unknown communication mode rejected');

  // Invalid priority
  const badPriority = { ...base, priority: 'SUPER_URGENT' as any };
  assert(validateMessage(badPriority).valid === false, 'Unknown priority rejected');

  // Invalid state
  const badState = { ...base, state: 'FLOATING' as any };
  assert(validateMessage(badState).valid === false, 'Unknown lifecycle state rejected');

  // Invalid source cubId
  const badSrcCub = {
    ...base,
    source: { ...base.source, cubId: 'NOT-A-CUB-ID' },
  };
  const rSrcCub = validateMessage(badSrcCub);
  assert(rSrcCub.valid === false, 'Malformed source cubId rejected');
  assert(rSrcCub.errors.some(e => e.code === 'ERR_INVALID_SOURCE'), 'ERR_INVALID_SOURCE present');

  // Invalid source CNC coordinate
  const badSrcCoord = {
    ...base,
    source: { ...base.source, coordinateUri: 'CUBIO://NETWORK/999/01/00001/TEST' },
  };
  assert(validateMessage(badSrcCoord).valid === false, 'Out-of-range source coordinate rejected');

  // Invalid destination CNC coordinate
  const badDstCoord = {
    ...base,
    destination: { ...base.destination, coordinateUri: 'MALFORMED_URI' },
  };
  assert(validateMessage(badDstCoord).valid === false, 'Malformed destination coordinate rejected');

  // Invalid recipient cubId
  const badDstCub = {
    ...base,
    destination: { ...base.destination, recipientCubId: 'BAD-CUB' },
  };
  assert(validateMessage(badDstCub).valid === false, 'Malformed destination recipientCubId rejected');

  // Missing payload body
  const noBody = {
    ...base,
    payload: { ...base.payload, body: undefined },
  };
  assert(validateMessage(noBody).valid === false, 'Undefined payload body rejected');

  // Oversized payload
  const hugeBody = 'X'.repeat(MAX_MESSAGE_PAYLOAD_BYTES + 1);
  const oversizedMsg = createMessage(makeDefaultMessageOptions({ body: hugeBody }));
  const rOversize = validateMessage(oversizedMsg);
  assert(rOversize.valid === false, 'Oversized payload rejected');
  assert(rOversize.errors.some(e => e.code === 'ERR_PAYLOAD_TOO_LARGE'), 'ERR_PAYLOAD_TOO_LARGE present');

  // Tampered payload hash
  const tamperedPayload = {
    ...base,
    payload: { ...base.payload, contentHash: '0xMPL_CORRUPTED000000' },
  };
  const rTamper = validateMessage(tamperedPayload);
  assert(rTamper.valid === false, 'Tampered payload contentHash rejected');
  assert(rTamper.errors.some(e => e.code === 'ERR_PAYLOAD_HASH_MISMATCH'), 'ERR_PAYLOAD_HASH_MISMATCH present');

  // Inconsistent timestamps: sentAt < createdAt
  const badTimestamps = {
    ...base,
    timestamps: {
      ...base.timestamps,
      sentAt: base.timestamps.createdAt - 1000,
    },
  };
  const rTime = validateMessage(badTimestamps);
  assert(rTime.valid === false, 'Inconsistent sentAt < createdAt rejected');
  assert(rTime.errors.some(e => e.code === 'ERR_TIMESTAMPS_INCONSISTENT'), 'ERR_TIMESTAMPS_INCONSISTENT present');

  // Inconsistent timestamps: expiresAt <= createdAt
  const expiredCreation = {
    ...base,
    timestamps: {
      ...base.timestamps,
      expiresAt: base.timestamps.createdAt,
    },
  };
  assert(validateMessage(expiredCreation).valid === false, 'expiresAt <= createdAt rejected');
}

// ─── 3. Lifecycle State Machine Tests ────────────────────────────────────────

function testLifecycleTransitions(): void {
  console.log('\n─── 3. Lifecycle State Machine ───');

  const msg0 = createMessage(makeDefaultMessageOptions());
  assert(msg0.state === 'DRAFT', 'Initial state is DRAFT');

  // DRAFT -> QUEUED
  const msg1 = transitionMessageState(msg0, 'QUEUED');
  assert(msg1.state === 'QUEUED', 'Transitioned to QUEUED');

  // QUEUED -> IN_TRANSIT
  const tSend = Date.now();
  const msg2 = transitionMessageState(msg1, 'IN_TRANSIT', tSend);
  assert(msg2.state === 'IN_TRANSIT', 'Transitioned to IN_TRANSIT');
  assert(msg2.timestamps.sentAt === tSend, 'sentAt timestamp recorded');

  // IN_TRANSIT -> DELIVERED
  const tDelivered = tSend + 50;
  const msg3 = transitionMessageState(msg2, 'DELIVERED', tDelivered);
  assert(msg3.state === 'DELIVERED', 'Transitioned to DELIVERED');
  assert(msg3.timestamps.deliveredAt === tDelivered, 'deliveredAt timestamp recorded');

  // DELIVERED -> READ
  const tRead = tDelivered + 200;
  const msg4 = transitionMessageState(msg3, 'READ', tRead);
  assert(msg4.state === 'READ', 'Transitioned to READ');
  assert(msg4.timestamps.readAt === tRead, 'readAt timestamp recorded');

  // Terminal state: READ has no outgoing transitions
  assertThrows(
    () => transitionMessageState(msg4, 'QUEUED'),
    'Transition from terminal READ state throws'
  );

  // Failure paths: DRAFT -> REJECTED
  const rejectedMsg = transitionMessageState(msg0, 'REJECTED');
  assert(rejectedMsg.state === 'REJECTED', 'DRAFT -> REJECTED valid');
  assertThrows(
    () => transitionMessageState(rejectedMsg, 'QUEUED'),
    'Transition from terminal REJECTED state throws'
  );

  // Failure path: IN_TRANSIT -> FAILED
  const failedMsg = transitionMessageState(msg2, 'FAILED');
  assert(failedMsg.state === 'FAILED', 'IN_TRANSIT -> FAILED valid');

  // Expiration path: DELIVERED -> EXPIRED
  const expiredMsg = transitionMessageState(msg3, 'EXPIRED');
  assert(expiredMsg.state === 'EXPIRED', 'DELIVERED -> EXPIRED valid');

  // Out-of-order transition rejection (e.g. DRAFT -> DELIVERED)
  assertThrows(
    () => transitionMessageState(msg0, 'DELIVERED'),
    'Invalid direct DRAFT -> DELIVERED transition rejected'
  );
}

// ─── 4. Determinism Tests ────────────────────────────────────────────────────

function testMessageDeterminism(): void {
  console.log('\n─── 4. Deterministic Properties ───');

  const baseOpts = makeDefaultMessageOptions({
    nonce: 'DETERMINISTIC_NONCE_369',
    metadata: { b: 'two', a: 'one' },
  });

  // Construct message twice with same inputs
  const msgA = createMessage(baseOpts);
  const msgB = createMessage(baseOpts);

  assert(msgA.payload.contentHash === msgB.payload.contentHash, 'Deterministic payload contentHash');

  // Metadata key sorting invariance in serialization
  const msgKeyOrder1 = createMessage(makeDefaultMessageOptions({ metadata: { x: '1', y: '2' } }));
  const msgKeyOrder2 = createMessage(makeDefaultMessageOptions({ metadata: { y: '2', x: '1' } }));
  assert(
    serializeMessage(msgKeyOrder1).includes('"x":"1","y":"2"'),
    'Metadata serialized with keys sorted alphabetically'
  );
}

// ─── 5. Wire Serialization & Deserialization ─────────────────────────────────

function testMessageSerializationRoundTrip(): void {
  console.log('\n─── 5. Wire Serialization Round-Trip ───');

  const original = createMessage(makeDefaultMessageOptions({
    conversationId: 'CONV_ALPHA_001',
    correlationId: 'MSG_PREV_000',
    subject: 'Synchronize spatial block',
    body: { blockId: 369, coordinates: [0, 1, 2], status: 'ACTIVE' },
    metadata: { client: 'cubio-studio', tier: 'sovereign' },
  }));

  const wireString = serializeMessage(original);
  assert(typeof wireString === 'string', 'Serialized output is string');
  assert(wireString.includes(original.messageId), 'Wire string contains messageId');
  assert(wireString.includes(SRC_CUB_ID), 'Wire string contains sender cubId');

  const deserialized = deserializeMessage(wireString);

  assert(deserialized.messageId === original.messageId, 'Deserialized messageId matches');
  assert(deserialized.conversationId === original.conversationId, 'Deserialized conversationId matches');
  assert(deserialized.type === original.type, 'Deserialized type matches');
  assert(deserialized.source.cubId === original.source.cubId, 'Deserialized source cubId matches');
  assert(deserialized.destination.coordinateUri === original.destination.coordinateUri, 'Deserialized destination matches');
  assert(deserialized.payload.contentHash === original.payload.contentHash, 'Deserialized payload contentHash matches');
  assert(deserialized.signature === original.signature, 'Deserialized signature matches');

  // Tampered wire string fails deserialization
  const tamperedWire = wireString.replace('"blockId":369', '"blockId":999');
  assertThrows(
    () => deserializeMessage(tamperedWire),
    'Deserializing tampered wire string throws payload contentHash mismatch'
  );

  // Invalid JSON wire string fails deserialization
  assertThrows(
    () => deserializeMessage('not valid json'),
    'Deserializing malformed JSON string throws'
  );
}

// ─── 6. Bidirectional ProtocolEnvelope Bridge (Task 03 <-> Task 01) ──────────

function testEnvelopeBridge(): void {
  console.log('\n─── 6. Bidirectional ProtocolEnvelope Bridge ───');

  const message = createMessage(makeDefaultMessageOptions({
    type: 'RPC_REQUEST',
    communicationMode: 'USER_SERVICE',
    body: { query: 'fetchHarmonicMatrix', root: 9 },
  }));

  // Convert Message -> Envelope (Task 01)
  const envelope = messageToEnvelope(message);

  assert(envelope.protocolVersion === PROTOCOL_VERSION_STRING, 'Envelope version matches');
  assert(envelope.kind === 'REQUEST', 'RPC_REQUEST maps to EnvelopeKind REQUEST');
  assert(envelope.payload.category === 'RPC_REQUEST', 'Payload category maps to RPC_REQUEST');
  assert(envelope.source.uri === message.source.coordinateUri, 'Source coordinate matches');
  assert(envelope.destination.uri === message.destination.coordinateUri, 'Destination coordinate matches');
  assert(envelope.sender.cubId === message.source.cubId, 'Sender cubId matches');

  // Validate envelope against Task 01 validator
  const envValResult = validateEnvelope(envelope);
  assert(envValResult.valid === true, 'Converted envelope passes Task 01 validateEnvelope');

  // Convert Envelope -> Message
  const reconstructedMsg = envelopeToMessage(envelope);
  assert(reconstructedMsg.source.cubId === message.source.cubId, 'Reconstructed message sender cubId matches');
  assert(reconstructedMsg.source.coordinateUri === message.source.coordinateUri, 'Reconstructed source coordinate matches');
  assert(reconstructedMsg.destination.coordinateUri === message.destination.coordinateUri, 'Reconstructed dest coordinate matches');
  assert(reconstructedMsg.type === 'RPC_REQUEST', 'Reconstructed type matches');
  assert(
    JSON.stringify(reconstructedMsg.payload.body) === JSON.stringify(message.payload.body),
    'Reconstructed message body matches original exactly'
  );
}

// ─── 7. Direct Packet Pipeline Bridge (Task 03 <-> Task 02) ──────────────────

function testPacketPipelineBridge(): void {
  console.log('\n─── 7. Direct Packet Pipeline Bridge (Task 03 <-> Task 02) ───');

  // 7a. Small message -> single packet pipeline
  const smallMsg = createMessage(makeDefaultMessageOptions({
    body: { command: 'STATUS_QUERY' },
  }));

  const singlePackets = messageToPackets(smallMsg, 5000);
  assert(singlePackets.length === 1, 'Small message encodes into 1 packet');
  assert(validatePacket(singlePackets[0]).valid === true, 'Packet passes Task 02 validatePacket');

  const reassembledSmallMsg = packetsToMessage(singlePackets);
  assert(reassembledSmallMsg.source.coordinateUri === smallMsg.source.coordinateUri, 'Reassembled small message source matches');
  assert(
    JSON.stringify(reassembledSmallMsg.payload.body) === JSON.stringify(smallMsg.payload.body),
    'Reassembled small message body matches'
  );

  // 7b. Large message exceeding MTU -> fragmented packets pipeline
  const largeData = 'SPATIAL_VECTOR_DATA_'.repeat(100); // ~2KB
  const largeMsg = createMessage(makeDefaultMessageOptions({
    body: { data: largeData },
  }));

  // Chunk with MTU = 300 bytes
  const fragmentPackets = messageToPackets(largeMsg, 300);
  assert(fragmentPackets.length > 1, `Large message fragmented into ${fragmentPackets.length} packets`);

  // Each packet must validate individually
  for (let i = 0; i < fragmentPackets.length; i++) {
    assert(validatePacket(fragmentPackets[i]).valid === true, `Fragment packet ${i} is valid`);
  }

  // Direct reassembly from packets back to application message
  const reassembledLargeMsg = packetsToMessage(fragmentPackets);
  assert(reassembledLargeMsg.source.cubId === largeMsg.source.cubId, 'Reassembled large message sender cubId matches');
  assert(reassembledLargeMsg.source.coordinateUri === largeMsg.source.coordinateUri, 'Reassembled large message source coordinate matches');
  assert(
    JSON.stringify(reassembledLargeMsg.payload.body) === JSON.stringify(largeMsg.payload.body),
    'Full 3-tier round-trip (Message -> Envelope -> Packets -> Reassembled Envelope -> Message) body matches bit-for-bit!'
  );
}

// ─── Execution ───────────────────────────────────────────────────────────────

console.log('═══════════════════════════════════════════════════════════');
console.log('  CUBiO Message Model — Canonical Test Suite');
console.log('  Specification Target: Phase 1 / Task 03');
console.log('═══════════════════════════════════════════════════════════');

testValidMessageConstruction();
testInvalidMessageDetection();
testLifecycleTransitions();
testMessageDeterminism();
testMessageSerializationRoundTrip();
testEnvelopeBridge();
testPacketPipelineBridge();

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
