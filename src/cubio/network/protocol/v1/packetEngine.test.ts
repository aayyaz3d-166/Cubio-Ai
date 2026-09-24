/**
 * CUBiO Network Protocol v1 — Canonical Packet Model Test Suite
 * ============================================================
 *
 * Comprehensive tests for Task 02:
 *   1. Valid packet construction and field formatting
 *   2. Invalid packet detection (magic, version, ids, coordinates, checksum, flags)
 *   3. Boundary tests (sequence 0 & max, TTL 1 & 255, payload size 0 & 64KB)
 *   4. Determinism tests (identical inputs -> identical ID & checksum, canonical sorting)
 *   5. Wire serialization & deserialization round-trip integrity
 *   6. ProtocolEnvelope packetization (single & multi-fragment) and reassembly
 *
 * Run with:  npx tsx src/cubio/network/protocol/v1/packetEngine.test.ts
 */

import {
  createPacket,
  validatePacket,
  serializePacket,
  deserializePacket,
  packetizeEnvelope,
  reassembleEnvelope,
  computePacketChecksum,
  computePayloadHash,
  generatePacketId,
} from './packetEngine';
import {
  PACKET_MAGIC,
  PacketFlags,
  MAX_PACKET_BYTES,
  MAX_PACKET_TTL,
  MAX_SEQUENCE_NUMBER,
  type CubiOPacket,
} from './packetTypes';
import {
  createEnvelope,
  createProtocolAddress,
} from './protocolEngine';

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

const SRC_URI = 'CUBIO://NETWORK/0/01/00001/TERMINAL';
const DST_URI = 'CUBIO://NETWORK/0/01/00002/INTELLIGENCE';
const ENV_ID = 'ENV_0xTESTENVELOPE01';

function makeValidPacket(overrides: Partial<Parameters<typeof createPacket>[0]> = {}): CubiOPacket {
  return createPacket({
    envelopeId: ENV_ID,
    sourceUri: SRC_URI,
    destinationUri: DST_URI,
    payloadData: JSON.stringify({ message: 'test data' }),
    payloadType: 'JSON',
    sequenceNumber: 1,
    flags: PacketFlags.NONE,
    fragmentIndex: 0,
    totalFragments: 1,
    ttl: 64,
    timestamp: 1773724800000,
    nonce: 'NONCE_001',
    ...overrides,
  });
}

// ─── 1. Valid Packet Tests ───────────────────────────────────────────────────

function testValidPackets(): void {
  console.log('\n─── 1. Valid Packet Construction ───');

  const pkt = makeValidPacket();

  assert(pkt.header.magic === PACKET_MAGIC, 'Packet magic is CUB1');
  assert(pkt.header.version.major === 1, 'Version major is 1');
  assert(pkt.header.version.minor === 0, 'Version minor is 0');
  assert(pkt.header.packetId.startsWith('PKT_'), 'Packet ID format is valid');
  assert(pkt.header.envelopeId === ENV_ID, 'Envelope ID preserved');
  assert(pkt.header.sourceUri === SRC_URI, 'Source URI preserved');
  assert(pkt.header.destinationUri === DST_URI, 'Destination URI preserved');
  assert(pkt.header.sequenceNumber === 1, 'Sequence number correct');
  assert(pkt.header.flags === PacketFlags.NONE, 'Default flags are NONE');
  assert(pkt.header.fragmentIndex === 0, 'Fragment index is 0');
  assert(pkt.header.totalFragments === 1, 'Total fragments is 1');
  assert(pkt.header.ttl === 64, 'Default TTL is 64');
  assert(pkt.payload.type === 'JSON', 'Payload type is JSON');
  assert(pkt.payload.contentHash.startsWith('0xPLD_'), 'Payload hash calculated');
  assert(pkt.checksum.startsWith('0xCHK_'), 'Packet checksum calculated');

  const val = validatePacket(pkt);
  assert(val.valid === true, 'Valid packet passes validation');
  assert(val.errors.length === 0, 'No validation errors');

  // Packet with flags and metadata
  const pktFlags = makeValidPacket({
    flags: PacketFlags.ACK | PacketFlags.COMPRESSED,
    metadata: { route: 'edge-01', priority: 'high' },
  });
  assert((pktFlags.header.flags & PacketFlags.ACK) !== 0, 'ACK flag set');
  assert((pktFlags.header.flags & PacketFlags.COMPRESSED) !== 0, 'COMPRESSED flag set');
  assert(pktFlags.metadata.route === 'edge-01', 'Metadata preserved');
  const valFlags = validatePacket(pktFlags);
  assert(valFlags.valid === true, 'Packet with flags & metadata passes validation');
}

// ─── 2. Invalid Packet Tests ─────────────────────────────────────────────────

function testInvalidPackets(): void {
  console.log('\n─── 2. Invalid Packet Detection ───');

  const base = makeValidPacket();

  // Null / non-object
  assert(validatePacket(null).valid === false, 'Null packet fails validation');
  assert(validatePacket('string').valid === false, 'String fails validation');

  // Bad magic
  const badMagic = { ...base, header: { ...base.header, magic: 'BAD1' } };
  const rMagic = validatePacket(badMagic);
  assert(rMagic.valid === false, 'Bad magic rejected');
  assert(rMagic.errors.some(e => e.code === 'ERR_INVALID_MAGIC'), 'ERR_INVALID_MAGIC present');

  // Incompatible version
  const badVer = { ...base, header: { ...base.header, version: { major: 2, minor: 0 } } };
  const rVer = validatePacket(badVer);
  assert(rVer.valid === false, 'Incompatible major version rejected');
  assert(rVer.errors.some(e => e.code === 'ERR_INVALID_VERSION'), 'ERR_INVALID_VERSION present');

  // Bad packetId
  const badPktId = { ...base, header: { ...base.header, packetId: 'INVALID' } };
  assert(validatePacket(badPktId).valid === false, 'Invalid packetId rejected');

  // Bad envelopeId
  const badEnvId = { ...base, header: { ...base.header, envelopeId: 'INVALID' } };
  assert(validatePacket(badEnvId).valid === false, 'Invalid envelopeId rejected');

  // Invalid source CNC address
  const badSrc = { ...base, header: { ...base.header, sourceUri: 'HTTP://MALFORMED' } };
  const rSrc = validatePacket(badSrc);
  assert(rSrc.valid === false, 'Invalid source CNC coordinate rejected');
  assert(rSrc.errors.some(e => e.code === 'ERR_INVALID_SOURCE'), 'ERR_INVALID_SOURCE present');

  // Invalid destination CNC address
  const badDst = { ...base, header: { ...base.header, destinationUri: 'CUBIO://NETWORK/999/99/00001/TEST' } };
  const rDst = validatePacket(badDst);
  assert(rDst.valid === false, 'Out-of-range destination coordinate rejected');
  assert(rDst.errors.some(e => e.code === 'ERR_INVALID_DESTINATION'), 'ERR_INVALID_DESTINATION present');

  // Sequence out of range
  const negSeq = { ...base, header: { ...base.header, sequenceNumber: -1 } };
  assert(validatePacket(negSeq).valid === false, 'Negative sequence rejected');

  const floatSeq = { ...base, header: { ...base.header, sequenceNumber: 1.5 } };
  assert(validatePacket(floatSeq).valid === false, 'Float sequence rejected');

  // Flags out of range (>255)
  const badFlags = { ...base, header: { ...base.header, flags: 256 } };
  assert(validatePacket(badFlags).valid === false, 'Flags > 255 rejected');

  // Fragment index exceeds total fragments
  const badFragIdx = {
    ...base,
    header: {
      ...base.header,
      flags: PacketFlags.FRAG,
      fragmentIndex: 3,
      totalFragments: 2,
    },
  };
  const rFragIdx = validatePacket(badFragIdx);
  assert(rFragIdx.valid === false, 'fragmentIndex >= totalFragments rejected');
  assert(rFragIdx.errors.some(e => e.code === 'ERR_FRAGMENT_INDEX_EXCEEDS_TOTAL'), 'ERR_FRAGMENT_INDEX_EXCEEDS_TOTAL present');

  // Multi-fragment missing FRAG flag
  const missingFragFlag = {
    ...base,
    header: {
      ...base.header,
      flags: PacketFlags.NONE,
      fragmentIndex: 0,
      totalFragments: 2,
    },
  };
  const rFragFlag = validatePacket(missingFragFlag);
  assert(rFragFlag.valid === false, 'totalFragments > 1 without FRAG flag rejected');
  assert(rFragFlag.errors.some(e => e.code === 'ERR_FRAG_FLAG_MISMATCH'), 'ERR_FRAG_FLAG_MISMATCH present');

  // Final fragment missing LAST_FRAG flag
  const missingLastFrag = {
    ...base,
    header: {
      ...base.header,
      flags: PacketFlags.FRAG,
      fragmentIndex: 1,
      totalFragments: 2,
    },
  };
  const rLastFrag = validatePacket(missingLastFrag);
  assert(rLastFrag.valid === false, 'Last fragment without LAST_FRAG rejected');
  assert(rLastFrag.errors.some(e => e.code === 'ERR_LAST_FRAG_FLAG_MISMATCH'), 'ERR_LAST_FRAG_FLAG_MISMATCH present');

  // Checksum corruption
  const badChk = { ...base, checksum: '0xCHK_CORRUPTED00000' };
  const rChk = validatePacket(badChk);
  assert(rChk.valid === false, 'Corrupted checksum rejected');
  assert(rChk.errors.some(e => e.code === 'ERR_CHECKSUM_MISMATCH'), 'ERR_CHECKSUM_MISMATCH present');

  // Payload content hash mismatch (tampered payload)
  const tamperedPayload = {
    ...base,
    payload: { ...base.payload, data: '{"tampered": true}' },
  };
  const rTamper = validatePacket(tamperedPayload);
  assert(rTamper.valid === false, 'Tampered payload data rejected');
  assert(rTamper.errors.some(e => e.code === 'ERR_PAYLOAD_HASH_MISMATCH'), 'ERR_PAYLOAD_HASH_MISMATCH present');
}

// ─── 3. Boundary Tests ───────────────────────────────────────────────────────

function testBoundaryPackets(): void {
  console.log('\n─── 3. Boundary Tests ───');

  // Sequence number boundaries: 0 and MAX_SEQUENCE_NUMBER (4294967295)
  const minSeqPkt = makeValidPacket({ sequenceNumber: 0 });
  assert(validatePacket(minSeqPkt).valid === true, 'Sequence number 0 is valid');

  const maxSeqPkt = makeValidPacket({ sequenceNumber: MAX_SEQUENCE_NUMBER });
  assert(validatePacket(maxSeqPkt).valid === true, 'Sequence number 4294967295 is valid');

  const overSeqPkt = { ...minSeqPkt, header: { ...minSeqPkt.header, sequenceNumber: MAX_SEQUENCE_NUMBER + 1 } };
  assert(validatePacket(overSeqPkt).valid === false, 'Sequence number > 4294967295 rejected');

  // TTL boundaries: 1 and 255
  const minTtlPkt = makeValidPacket({ ttl: 1 });
  assert(validatePacket(minTtlPkt).valid === true, 'TTL 1 is valid');

  const maxTtlPkt = makeValidPacket({ ttl: MAX_PACKET_TTL });
  assert(validatePacket(maxTtlPkt).valid === true, 'TTL 255 is valid');

  const zeroTtlPkt = { ...minTtlPkt, header: { ...minTtlPkt.header, ttl: 0 } };
  assert(validatePacket(zeroTtlPkt).valid === false, 'TTL 0 rejected');

  const overTtlPkt = { ...minTtlPkt, header: { ...minTtlPkt.header, ttl: 256 } };
  assert(validatePacket(overTtlPkt).valid === false, 'TTL 256 rejected');

  // Empty payload data (0 bytes)
  const emptyPldPkt = makeValidPacket({ payloadData: '' });
  assert(emptyPldPkt.payload.byteLength === 0, 'Empty payload byteLength is 0');
  assert(validatePacket(emptyPldPkt).valid === true, 'Empty payload data is valid');

  // Payload exceeding MAX_PACKET_BYTES
  const oversizedData = 'X'.repeat(MAX_PACKET_BYTES + 1);
  const oversizedPkt = makeValidPacket({ payloadData: oversizedData });
  const rOver = validatePacket(oversizedPkt);
  assert(rOver.valid === false, 'Payload exceeding MAX_PACKET_BYTES rejected');
  assert(rOver.errors.some(e => e.code === 'ERR_PAYLOAD_TOO_LARGE'), 'ERR_PAYLOAD_TOO_LARGE present');

  // Flags: boundary 0x00 and 0xFF
  const minFlagsPkt = makeValidPacket({ flags: 0x00 });
  assert(validatePacket(minFlagsPkt).valid === true, 'Flags 0x00 valid');

  const maxFlagsPkt = makeValidPacket({ flags: 0xFF, fragmentIndex: 0, totalFragments: 1 });
  assert(validatePacket(maxFlagsPkt).valid === true, 'Flags 0xFF valid');
}

// ─── 4. Determinism Tests ────────────────────────────────────────────────────

function testDeterminism(): void {
  console.log('\n─── 4. Deterministic Properties ───');

  const options = {
    envelopeId: ENV_ID,
    sourceUri: SRC_URI,
    destinationUri: DST_URI,
    payloadData: '{"action":"compute","value":42}',
    sequenceNumber: 10,
    timestamp: 1773724800000,
    nonce: 'STABLE_NONCE',
    metadata: { b: '2', a: '1' },
  };

  const pktA = createPacket(options);
  const pktB = createPacket(options);

  assert(pktA.header.packetId === pktB.header.packetId, 'Deterministic packetId across identical runs');
  assert(pktA.checksum === pktB.checksum, 'Deterministic checksum across identical runs');
  assert(pktA.payload.contentHash === pktB.payload.contentHash, 'Deterministic payloadHash across identical runs');

  // Metadata ordering invariance: { a: '1', b: '2' } vs { b: '2', a: '1' }
  const pktC = createPacket({ ...options, metadata: { a: '1', b: '2' } });
  assert(pktA.checksum === pktC.checksum, 'Checksum is invariant to metadata key insertion order');
  assert(serializePacket(pktA) === serializePacket(pktC), 'Serialization output is invariant to metadata key insertion order');
}

// ─── 5. Wire Serialization & Deserialization Round-Trip ──────────────────────

function testSerializationRoundTrip(): void {
  console.log('\n─── 5. Wire Serialization Round-Trip ───');

  const original = makeValidPacket({
    sequenceNumber: 42,
    metadata: { keyA: 'valA', keyB: 'valB' },
  });

  const wireString = serializePacket(original);
  assert(typeof wireString === 'string', 'Serialized output is string');
  assert(wireString.includes(PACKET_MAGIC), 'Wire string contains magic');

  const deserialized = deserializePacket(wireString);

  assert(deserialized.header.magic === original.header.magic, 'Round-trip magic matches');
  assert(deserialized.header.packetId === original.header.packetId, 'Round-trip packetId matches');
  assert(deserialized.header.envelopeId === original.header.envelopeId, 'Round-trip envelopeId matches');
  assert(deserialized.header.sourceUri === original.header.sourceUri, 'Round-trip sourceUri matches');
  assert(deserialized.header.destinationUri === original.header.destinationUri, 'Round-trip destinationUri matches');
  assert(deserialized.header.sequenceNumber === original.header.sequenceNumber, 'Round-trip sequenceNumber matches');
  assert(deserialized.header.ttl === original.header.ttl, 'Round-trip ttl matches');
  assert(deserialized.payload.data === original.payload.data, 'Round-trip payload data matches');
  assert(deserialized.checksum === original.checksum, 'Round-trip checksum matches');

  // Tampered wire string fails deserialization
  const tamperedWire = wireString.replace('test data', 'tampered data');
  assertThrows(
    () => deserializePacket(tamperedWire),
    'Deserializing tampered wire string throws checksum mismatch'
  );

  // Malformed JSON wire string fails deserialization
  assertThrows(
    () => deserializePacket('{ bad json'),
    'Deserializing malformed JSON wire string throws'
  );
}

// ─── 6. Envelope Packetization & Reassembly ──────────────────────────────────

function testEnvelopePacketizationAndReassembly(): void {
  console.log('\n─── 6. Envelope Packetization & Reassembly ───');

  const envelope = createEnvelope({
    kind: 'REQUEST',
    source: createProtocolAddress({ network: 'CUBIO', dimension: 0, zone: 1, node: 1, service: 'TERMINAL' }),
    destination: createProtocolAddress({ network: 'CUBIO', dimension: 0, zone: 1, node: 2, service: 'INTELLIGENCE' }),
    sender: { cubId: 'CUB-AAAA0001', entityType: 'USER', signature: '0xSIG_001' },
    payload: {
      category: 'DIRECT_MESSAGE',
      priority: 'NORMAL',
      contentType: 'application/json',
      body: { query: 'calculate harmonic vector', details: 'A'.repeat(500) },
      bodyBytes: 600,
    },
  });

  // Single packet (MTU large enough)
  const singlePackets = packetizeEnvelope(envelope, 5000);
  assert(singlePackets.length === 1, 'Envelope fits in 1 packet when MTU is large');
  assert(singlePackets[0].header.totalFragments === 1, 'Single packet totalFragments is 1');
  assert(singlePackets[0].header.fragmentIndex === 0, 'Single packet fragmentIndex is 0');
  assert((singlePackets[0].header.flags & PacketFlags.FRAG) === 0, 'Single packet has no FRAG flag');

  const reassembledSingle = reassembleEnvelope(singlePackets);
  assert(reassembledSingle.envelopeId === envelope.envelopeId, 'Reassembled single-packet envelopeId matches');
  assert(reassembledSingle.payload.category === envelope.payload.category, 'Reassembled payload category matches');

  // Fragmented packets (small MTU = 200 bytes)
  const multiPackets = packetizeEnvelope(envelope, 200);
  assert(multiPackets.length > 1, `Envelope fragmented into ${multiPackets.length} packets`);

  // Verify fragment flags
  for (let i = 0; i < multiPackets.length; i++) {
    const p = multiPackets[i];
    assert(p.header.fragmentIndex === i, `Fragment ${i} has correct fragmentIndex`);
    assert(p.header.totalFragments === multiPackets.length, `Fragment ${i} has correct totalFragments`);
    assert((p.header.flags & PacketFlags.FRAG) !== 0, `Fragment ${i} has FRAG flag`);
    if (i === multiPackets.length - 1) {
      assert((p.header.flags & PacketFlags.LAST_FRAG) !== 0, 'Final fragment has LAST_FRAG flag');
    } else {
      assert((p.header.flags & PacketFlags.LAST_FRAG) === 0, `Non-final fragment ${i} lacks LAST_FRAG flag`);
    }
    // Each fragment must be valid on its own
    assert(validatePacket(p).valid === true, `Fragment ${i} passes individual packet validation`);
  }

  // Full reassembly
  const reassembledMulti = reassembleEnvelope(multiPackets);
  assert(reassembledMulti.envelopeId === envelope.envelopeId, 'Reassembled multi-packet envelopeId matches');
  assert(reassembledMulti.source.uri === envelope.source.uri, 'Reassembled source URI matches');
  assert(reassembledMulti.destination.uri === envelope.destination.uri, 'Reassembled destination URI matches');
  assert(JSON.stringify(reassembledMulti.payload.body) === JSON.stringify(envelope.payload.body), 'Reassembled body matches exactly');

  // Reassembly with missing fragment throws
  const missingOne = multiPackets.slice(0, -1);
  assertThrows(
    () => reassembleEnvelope(missingOne),
    'Reassembling incomplete fragment sequence throws'
  );

  // Out of order fragments are sorted correctly
  const shuffled = [multiPackets[1], multiPackets[0], ...multiPackets.slice(2)];
  const reassembledShuffled = reassembleEnvelope(shuffled);
  assert(reassembledShuffled.envelopeId === envelope.envelopeId, 'Out-of-order fragments reassemble correctly');
}

// ─── Execution ───────────────────────────────────────────────────────────────

console.log('═══════════════════════════════════════════════════════════');
console.log('  CUBiO Packet Model — Canonical Test Suite');
console.log('  Specification Target: Phase 1 / Task 02');
console.log('═══════════════════════════════════════════════════════════');

testValidPackets();
testInvalidPackets();
testBoundaryPackets();
testDeterminism();
testSerializationRoundTrip();
testEnvelopePacketizationAndReassembly();

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
