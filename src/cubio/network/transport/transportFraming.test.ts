/**
 * CUBiO AI — Phase 2 / Task 07: Transport Framing Adapter Tests
 * ===============================================================
 *
 * Validates the transport framing adapter independently (unit tests)
 * and end-to-end through real operating system transport drivers (TCP, WS, IPC).
 * Proves:
 *   - Deterministic 10-byte wire framing encode / decode.
 *   - Discrete boundary preservation and bounds checks.
 *   - Single-byte streaming fragmentation reassembly.
 *   - Multi-packet coalesced chunk parsing.
 *   - Fail-closed defense against corrupted magic, oversized length, and corrupted JSON.
 *   - Full round-trip envelope packetization -> transport framing -> network transfer -> defragmentation -> envelope reassembly.
 *
 * Run with:  npx tsx src/cubio/network/transport/transportFraming.test.ts
 */

import {
  TransportFrameCodec,
  StreamFrameDecoder,
  TransportFramingError,
  TcpTransportAdapter,
  WebSocketTransportAdapter,
  IpcPipeTransportAdapter,
  TRANSPORT_FRAME_CONSTANTS,
} from './index';
import { createPacket, packetizeEnvelope, reassembleEnvelope } from '../protocol/v1/packetEngine';
import { createEnvelope } from '../protocol/v1/protocolEngine';
import { CubiOPacket } from '../protocol/v1/packetTypes';

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void | Promise<void>) {
  const result = fn();
  if (result instanceof Promise) {
    return result
      .then(() => {
        passed++;
        console.log(`  ✓ ${name}`);
      })
      .catch((err: any) => {
        failed++;
        console.error(`  ✗ ${name}`);
        console.error(`    ${err.stack ?? err.message}`);
      });
  } else {
    try {
      passed++;
      console.log(`  ✓ ${name}`);
    } catch (err: any) {
      failed++;
      console.error(`  ✗ ${name}`);
      console.error(`    ${err.stack ?? err.message}`);
    }
  }
}

function assert(condition: boolean, msg?: string) {
  if (!condition) throw new Error(msg ?? 'Assertion failed');
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function makeValidPacket(seq: number = 1, payloadText: string = 'Hello Framing Adapter'): CubiOPacket {
  return createPacket({
    envelopeId: `ENV_FRAME_${seq}`,
    sequenceNumber: seq,
    sourceUri: 'CUBIO://NETWORK/0/01/00001/APP',
    destinationUri: 'CUBIO://NETWORK/0/01/00002/APP',
    payloadData: payloadText,
  });
}

async function runSuite() {
  console.log('\n══════════════════════════════════════════════════════════════════════════');
  console.log('  CUBiO AI — Phase 2 / Task 07: Transport Framing Adapter Tests           ');
  console.log('══════════════════════════════════════════════════════════════════════════\n');

  // ─── 1. Deterministic Encoding & Discrete Decoding ──────────────────────────

  console.log('1. Deterministic Encoding & Discrete Decoding:');

  await test('Encodes Phase 1 packet into exact canonical wire frame', () => {
    const packet = makeValidPacket(1, 'Canonical Wire Framing Test');
    const frame = TransportFrameCodec.encode(packet);

    assert(frame.length > 10, 'Frame length > 10 bytes');
    const payloadLength = frame.readUInt32BE(0);
    const magic = frame.toString('ascii', 4, 10);

    assert(magic === TRANSPORT_FRAME_CONSTANTS.MAGIC, `Magic matches '${TRANSPORT_FRAME_CONSTANTS.MAGIC}'`);
    assert(payloadLength === frame.length - 10, 'Declared payload length matches exact remaining bytes');
  });

  await test('Decodes discrete frame with 100% bit-for-bit roundtrip fidelity', () => {
    const packet = makeValidPacket(42, 'Roundtrip Discrete Decode Verification');
    const frame = TransportFrameCodec.encode(packet);
    const decoded = TransportFrameCodec.decodeDiscrete(frame);

    assert(decoded.packet.header.packetId === packet.header.packetId, 'Packet ID matches');
    assert(decoded.packet.header.sequenceNumber === 42, 'Sequence number matches');
    assert(decoded.packet.checksum === packet.checksum, 'Checksum matches bit-for-bit');
    assert(decoded.packet.payload.data === packet.payload.data, 'Payload data matches');
    assert(decoded.totalFrameLength === frame.length, 'Total length matches buffer length');
  });

  await test('Rejects encoding of invalid Phase 1 packet fail-closed', () => {
    const invalidPacket: any = {
      header: { packetId: 'INVALID' },
      payload: { data: 'test' },
    };

    let thrown = false;
    try {
      TransportFrameCodec.encode(invalidPacket);
    } catch (err: any) {
      thrown = true;
      assert(err instanceof TransportFramingError, 'Error is TransportFramingError');
      assert(err.code === 'ERR_FRAME_VALIDATION_FAILED', 'Code is ERR_FRAME_VALIDATION_FAILED');
    }
    assert(thrown, 'Encoding invalid packet must throw');
  });

  // ─── 2. Discrete Mode Bounds & Corruption Checks ───────────────────────────

  console.log('\n2. Discrete Mode Bounds & Corruption Checks:');

  await test('Rejects truncated buffer (< 10 bytes)', () => {
    const shortBuf = Buffer.from([0x00, 0x01, 0x02, 0x03]);
    let thrown = false;
    try {
      TransportFrameCodec.decodeDiscrete(shortBuf);
    } catch (err: any) {
      thrown = true;
      assert(err.code === 'ERR_FRAME_TRUNCATED', 'Throws ERR_FRAME_TRUNCATED');
    }
    assert(thrown, 'Truncated buffer threw');
  });

  await test('Rejects discrete frame with corrupted magic token', () => {
    const frame = Buffer.alloc(20);
    frame.writeUInt32BE(10, 0);
    frame.write('BADMGC', 4, 6, 'ascii');
    frame.fill(0x55, 10);

    let thrown = false;
    try {
      TransportFrameCodec.decodeDiscrete(frame);
    } catch (err: any) {
      thrown = true;
      assert(err.code === 'ERR_FRAME_MAGIC_MISMATCH', 'Throws ERR_FRAME_MAGIC_MISMATCH');
    }
    assert(thrown, 'Bad magic threw');
  });

  await test('Rejects discrete frame with boundary length mismatch', () => {
    const frame = Buffer.alloc(20);
    frame.writeUInt32BE(50, 0); // Declares 50 bytes, but buffer only has 10 bytes payload
    frame.write(TRANSPORT_FRAME_CONSTANTS.MAGIC, 4, 6, 'ascii');
    frame.fill(0x55, 10);

    let thrown = false;
    try {
      TransportFrameCodec.decodeDiscrete(frame);
    } catch (err: any) {
      thrown = true;
      assert(err.code === 'ERR_FRAME_BOUNDARY_MISMATCH', 'Throws ERR_FRAME_BOUNDARY_MISMATCH');
    }
    assert(thrown, 'Boundary mismatch threw');
  });

  await test('Rejects discrete frame exceeding maxPayloadBytes', () => {
    const frame = Buffer.alloc(10);
    frame.writeUInt32BE(100000, 0); // Declares 100,000 bytes
    frame.write(TRANSPORT_FRAME_CONSTANTS.MAGIC, 4, 6, 'ascii');

    let thrown = false;
    try {
      TransportFrameCodec.decodeDiscrete(frame, 65536);
    } catch (err: any) {
      thrown = true;
      assert(err.code === 'ERR_FRAME_OVERSIZED', 'Throws ERR_FRAME_OVERSIZED');
    }
    assert(thrown, 'Oversized payload threw');
  });

  // ─── 3. Stateful Stream Fragmentation & Reassembly ──────────────────────────

  console.log('\n3. Stateful Stream Fragmentation & Reassembly:');

  await test('Reassembles framed packet fed into decoder 1 byte at a time', () => {
    const decoder = new StreamFrameDecoder();
    const packet = makeValidPacket(10, 'Single Byte Fragmentation Stress Test with substantial payload length.');
    const frame = TransportFrameCodec.encode(packet);

    let emittedPackets: CubiOPacket[] = [];

    // Feed byte by byte
    for (let i = 0; i < frame.length; i++) {
      const singleByte = frame.subarray(i, i + 1);
      const res = decoder.push(singleByte);
      if (res.length > 0) {
        emittedPackets.push(...res);
      }
    }

    assert(emittedPackets.length === 1, `Exactly 1 packet emitted on last byte (got ${emittedPackets.length})`);
    assert(emittedPackets[0].header.packetId === packet.header.packetId, 'Reassembled packet ID matches');
    assert(emittedPackets[0].checksum === packet.checksum, 'Reassembled checksum matches');
    assert(emittedPackets[0].payload.data === packet.payload.data, 'Reassembled payload matches');
    assert(decoder.pendingBytes === 0, 'Decoder pending buffer is 0 after full extraction');
  });

  await test('Reassembles framed packet split across arbitrary prime-sized chunks', () => {
    const decoder = new StreamFrameDecoder();
    const packet = makeValidPacket(11, 'Prime Chunks Split Test');
    const frame = TransportFrameCodec.encode(packet);

    const chunkSizes = [3, 7, 13, 5, 11, 17, 23];
    let offset = 0;
    let emittedPackets: CubiOPacket[] = [];
    let sizeIndex = 0;

    while (offset < frame.length) {
      const size = chunkSizes[sizeIndex % chunkSizes.length];
      const chunk = frame.subarray(offset, Math.min(offset + size, frame.length));
      offset += chunk.length;
      sizeIndex++;

      const res = decoder.push(chunk);
      if (res.length > 0) emittedPackets.push(...res);
    }

    assert(emittedPackets.length === 1, 'Packet reassembled cleanly from prime chunks');
    assert(emittedPackets[0].checksum === packet.checksum, 'Checksum matches');
    assert(decoder.pendingBytes === 0, 'Pending bytes is 0');
  });

  await test('Decodes multiple coalesced frames delivered in a single buffer chunk', () => {
    const decoder = new StreamFrameDecoder();
    const p1 = makeValidPacket(1, 'Coalesced 1');
    const p2 = makeValidPacket(2, 'Coalesced 2');
    const p3 = makeValidPacket(3, 'Coalesced 3');
    const p4 = makeValidPacket(4, 'Coalesced 4');

    const f1 = TransportFrameCodec.encode(p1);
    const f2 = TransportFrameCodec.encode(p2);
    const f3 = TransportFrameCodec.encode(p3);
    const f4 = TransportFrameCodec.encode(p4);

    const megaChunk = Buffer.concat([f1, f2, f3, f4]);
    const extracted = decoder.push(megaChunk);

    assert(extracted.length === 4, `Extracted all 4 packets in a single tick (got ${extracted.length})`);
    assert(extracted[0].header.sequenceNumber === 1, 'Packet 1 in order');
    assert(extracted[1].header.sequenceNumber === 2, 'Packet 2 in order');
    assert(extracted[2].header.sequenceNumber === 3, 'Packet 3 in order');
    assert(extracted[3].header.sequenceNumber === 4, 'Packet 4 in order');
    assert(decoder.pendingBytes === 0, 'Buffer fully consumed');
  });

  // ─── 4. Stream Corruption Defense ───────────────────────────────────────────

  console.log('\n4. Stream Corruption Defense:');

  await test('Stream decoder throws and resets on invalid magic token', () => {
    const decoder = new StreamFrameDecoder();
    const badChunk = Buffer.alloc(20);
    badChunk.writeUInt32BE(10, 0);
    badChunk.write('NOTMAG', 4, 6, 'ascii');

    let thrown = false;
    try {
      decoder.push(badChunk);
    } catch (err: any) {
      thrown = true;
      assert(err.code === 'ERR_FRAME_MAGIC_MISMATCH', 'Throws ERR_FRAME_MAGIC_MISMATCH');
    }
    assert(thrown, 'Corrupted stream threw');
    assert(decoder.pendingBytes === 0, 'Buffer was cleared fail-closed');
  });

  await test('Stream decoder throws and resets on oversized payload length', () => {
    const decoder = new StreamFrameDecoder(65536);
    const oversizedChunk = Buffer.alloc(10);
    oversizedChunk.writeUInt32BE(99999, 0);
    oversizedChunk.write(TRANSPORT_FRAME_CONSTANTS.MAGIC, 4, 6, 'ascii');

    let thrown = false;
    try {
      decoder.push(oversizedChunk);
    } catch (err: any) {
      thrown = true;
      assert(err.code === 'ERR_FRAME_OVERSIZED', 'Throws ERR_FRAME_OVERSIZED');
    }
    assert(thrown, 'Oversized chunk threw');
    assert(decoder.pendingBytes === 0, 'Buffer was cleared');
  });

  // ─── 5. End-to-End Round-Trip with Real Transport Drivers ───────────────────

  console.log('\n5. End-to-End Round-Trip with Real Transport Drivers:');

  await test('Complete multi-fragment Envelope round-trip over real TCP socket', async () => {
    const server = new TcpTransportAdapter();
    const client = new TcpTransportAdapter();

    await server.listen({ transportType: 'TCP', host: '127.0.0.1', port: 0 });
    await client.connect({ transportType: 'TCP', host: '127.0.0.1', port: server.localEndpoint!.port });

    // 1. Create large Phase 1 envelope that requires multi-packet fragmentation
    const bigData = 'TCP_STREAM_ROUNDTRIP_DATA_'.repeat(100); // 2,600 bytes
    const envelope = createEnvelope({
      kind: 'EVENT',
      source: { coordinate: { network: 'CUBIO', dimension: 0, zone: 1, node: 1, service: 'SRC' }, uri: 'CUBIO://NETWORK/0/01/00001/SRC' },
      destination: { coordinate: { network: 'CUBIO', dimension: 0, zone: 1, node: 2, service: 'DST' }, uri: 'CUBIO://NETWORK/0/01/00002/DST' },
      sender: { cubId: 'CUB-00000001', entityType: 'SERVICE', signature: '0xSIG' },
      payload: { category: 'STATE_DELTA', priority: 'NORMAL', contentType: 'text/plain', body: bigData, bodyBytes: bigData.length },
    });

    // 2. Packetize envelope (produces sequence of CubiOPackets with MTU bounding)
    const packets = packetizeEnvelope(envelope, 500); // 500-byte small MTU forces multiple fragments
    assert(packets.length > 1, `Envelope was split into ${packets.length} fragments`);

    // 3. Server collects inbound packets
    const receivedPackets: CubiOPacket[] = [];
    const allPacketsPromise = new Promise<void>((resolve) => {
      server.receive((pkt) => {
        receivedPackets.push(pkt);
        if (receivedPackets.length === packets.length) {
          resolve();
        }
      });
    });

    // 4. Send all packet fragments over real TCP stream
    for (const pkt of packets) {
      await client.send(pkt);
    }

    await allPacketsPromise;

    // 5. Reassemble envelope from received fragments
    const reassembledEnvelope = reassembleEnvelope(receivedPackets);
    assert(reassembledEnvelope.envelopeId === envelope.envelopeId, 'Reassembled envelope ID matches');
    assert(reassembledEnvelope.payload.body === bigData, 'Reassembled payload matches bit-for-bit');

    await client.close();
    await server.close();
  });

  await test('Complete multi-fragment Envelope round-trip over real WebSocket', async () => {
    const server = new WebSocketTransportAdapter();
    const client = new WebSocketTransportAdapter();

    await server.listen({ transportType: 'WEBSOCKET', host: '127.0.0.1', port: 0 });
    await client.connect({ transportType: 'WEBSOCKET', host: '127.0.0.1', port: server.localEndpoint!.port });

    const wsData = 'WS_ROUNDTRIP_PAYLOAD_'.repeat(80);
    const envelope = createEnvelope({
      kind: 'EVENT',
      source: { coordinate: { network: 'CUBIO', dimension: 0, zone: 1, node: 1, service: 'SRC' }, uri: 'CUBIO://NETWORK/0/01/00001/SRC' },
      destination: { coordinate: { network: 'CUBIO', dimension: 0, zone: 1, node: 2, service: 'DST' }, uri: 'CUBIO://NETWORK/0/01/00002/DST' },
      sender: { cubId: 'CUB-00000001', entityType: 'AGENT', signature: '0xSIG' },
      payload: { category: 'STATE_DELTA', priority: 'HIGH', contentType: 'application/json', body: wsData, bodyBytes: wsData.length },
    });

    const packets = packetizeEnvelope(envelope, 400);
    const receivedPackets: CubiOPacket[] = [];

    const donePromise = new Promise<void>((resolve) => {
      server.receive((pkt) => {
        receivedPackets.push(pkt);
        if (receivedPackets.length === packets.length) resolve();
      });
    });

    for (const pkt of packets) {
      await client.send(pkt);
    }

    await donePromise;

    const reassembled = reassembleEnvelope(receivedPackets);
    assert(reassembled.envelopeId === envelope.envelopeId, 'Envelope ID matches');
    assert(reassembled.payload.body === wsData, 'Payload matches bit-for-bit');

    await client.close();
    await server.close();
  });

  await test('Complete multi-fragment Envelope round-trip over real IPC Named Pipe', async () => {
    const pipeName = `cubio-framing-ipc-${Date.now()}`;
    const server = new IpcPipeTransportAdapter();
    const client = new IpcPipeTransportAdapter();

    await server.listen({ transportType: 'IPC_PIPE', host: 'localhost', port: 0, path: pipeName });
    await client.connect({ transportType: 'IPC_PIPE', host: 'localhost', port: 0, path: server.localEndpoint!.path });

    const ipcData = 'IPC_ROUNDTRIP_PAYLOAD_'.repeat(60);
    const envelope = createEnvelope({
      kind: 'REQUEST',
      source: { coordinate: { network: 'CUBIO', dimension: 0, zone: 1, node: 1, service: 'SRC' }, uri: 'CUBIO://NETWORK/0/01/00001/SRC' },
      destination: { coordinate: { network: 'CUBIO', dimension: 0, zone: 1, node: 2, service: 'DST' }, uri: 'CUBIO://NETWORK/0/01/00002/DST' },
      sender: { cubId: 'CUB-00000001', entityType: 'SERVICE', signature: '0xSIG' },
      payload: { category: 'RPC_REQUEST', priority: 'URGENT', contentType: 'text/plain', body: ipcData, bodyBytes: ipcData.length },
    });

    const packets = packetizeEnvelope(envelope, 300);
    const receivedPackets: CubiOPacket[] = [];

    const donePromise = new Promise<void>((resolve) => {
      server.receive((pkt) => {
        receivedPackets.push(pkt);
        if (receivedPackets.length === packets.length) resolve();
      });
    });

    for (const pkt of packets) {
      await client.send(pkt);
    }

    await donePromise;

    const reassembled = reassembleEnvelope(receivedPackets);
    assert(reassembled.envelopeId === envelope.envelopeId, 'Envelope ID matches');
    assert(reassembled.payload.body === ipcData, 'Payload matches bit-for-bit');

    await client.close();
    await server.close();
  });

  // ─── Summary ───────────────────────────────────────────────────────────────

  console.log('\n══════════════════════════════════════════════════════════════════════════');
  console.log(`  Phase 2 / Task 07 Test Results: ${passed} PASSED, ${failed} FAILED`);
  console.log('══════════════════════════════════════════════════════════════════════════\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
