/**
 * CUBiO AI — Phase 2 / Task 04: Real TCP Transport Driver Tests
 * ==============================================================
 *
 * Validates the real operating system TCP transport driver using 'node:net'
 * on localhost (127.0.0.1). Proves:
 *   - OS TCP socket lifecycle (listen, connect, session creation, teardown).
 *   - Phase 1 packet framing wire protocol ([4B len][6B 'CUBTR1'][canonical JSON]).
 *   - Bidirectional localhost transmission and 100% payload integrity.
 *   - Coalesced stream chunk parsing (multiple packets in a single TCP chunk).
 *   - Fragmented stream read reassembly (single packet split into multiple tiny chunks).
 *   - Fail-closed malformed frame defense (corrupted magic, oversized length, corrupted JSON).
 *   - Remote disconnect detection, timeout enforcement, and clean port release.
 *
 * Run with:  npx tsx src/cubio/network/transport/tcpTransport.test.ts
 */

import * as net from 'node:net';
import {
  TcpTransportAdapter,
  TransportEndpoint,
  TransportSession,
  CanonicalTransportError,
  TRANSPORT_FRAME_CONSTANTS,
} from './index';
import { createPacket } from '../protocol/v1/packetEngine';
import { serializeCanonicalPacket } from '../protocol/v1/canonicalSerializer';
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

function makeValidPacket(seq: number = 1, payloadText: string = 'Hello CUBiO TCP'): CubiOPacket {
  return createPacket({
    envelopeId: `ENV_TCP_${seq}`,
    sequenceNumber: seq,
    sourceUri: 'CUBIO://NETWORK/0/01/00001/APP',
    destinationUri: 'CUBIO://NETWORK/0/01/00002/APP',
    payloadData: payloadText,
  });
}

function encodeFrame(packet: CubiOPacket): Buffer {
  const serialized = serializeCanonicalPacket(packet);
  const payloadBuf = Buffer.from(serialized, 'utf8');
  const frameBuf = Buffer.allocUnsafe(TRANSPORT_FRAME_CONSTANTS.HEADER_SIZE_BYTES + payloadBuf.length);
  frameBuf.writeUInt32BE(payloadBuf.length, 0);
  frameBuf.write(TRANSPORT_FRAME_CONSTANTS.MAGIC, 4, 6, 'ascii');
  payloadBuf.copy(frameBuf, TRANSPORT_FRAME_CONSTANTS.HEADER_SIZE_BYTES);
  return frameBuf;
}

async function runSuite() {
  console.log('\n══════════════════════════════════════════════════════════════════════════');
  console.log('  CUBiO AI — Phase 2 / Task 04: Real TCP Transport Driver Tests           ');
  console.log('══════════════════════════════════════════════════════════════════════════\n');

  // ─── 1. Capabilities & Contract Conformance ─────────────────────────────────

  console.log('1. Capabilities & Interface Contract Conformance:');

  await test('TcpTransportAdapter exposes real TCP capabilities', () => {
    const adapter = new TcpTransportAdapter();
    assert(adapter.transportType === 'TCP', 'Transport type is TCP');
    assert(adapter.capabilities.connectionOriented === true, 'TCP is connection-oriented');
    assert(adapter.capabilities.reliable === true, 'TCP is reliable');
    assert(adapter.capabilities.ordered === true, 'TCP is ordered');
    assert(adapter.capabilities.messageOriented === false, 'TCP is stream-oriented');
    assert(adapter.capabilities.supportsBroadcast === false, 'TCP does not support broadcast');
    assert(adapter.capabilities.maxPayloadBytes === 65536, 'Max payload is 65,536 bytes');
    assert(adapter.capabilities.defaultMtu === 1400, 'Default MTU is 1400 bytes');
    assert(adapter.state === 'UNINITIALIZED', 'Initial state is UNINITIALIZED');
  });

  // ─── 2. OS Socket Lifecycle & Address Handling ─────────────────────────────

  console.log('\n2. OS Socket Lifecycle & Address Handling:');

  await test('Server listener binds to real OS TCP socket and dynamically resolves port', async () => {
    const server = new TcpTransportAdapter();
    const transitions: string[] = [];

    server.onStateChange((prev, next) => {
      transitions.push(`${prev}->${next}`);
    });

    const ep: TransportEndpoint = {
      transportType: 'TCP',
      host: '127.0.0.1',
      port: 0, // OS assigns ephemeral port
      coordinateUri: 'CUBIO://NETWORK/0/01/00001/SERVER',
    };

    await server.listen(ep);

    assert(server.state === 'CONNECTED', 'Server state is CONNECTED');
    assert(server.localEndpoint !== undefined, 'Local endpoint is set');
    assert(server.localEndpoint!.port > 0, `Ephemeral port dynamically assigned: ${server.localEndpoint!.port}`);
    assert(server.localEndpoint!.host === '127.0.0.1', 'Bound to 127.0.0.1');
    assert(transitions.includes('UNINITIALIZED->INITIALIZING'), 'Transitioned through INITIALIZING');
    assert(transitions.includes('INITIALIZING->CONNECTED'), 'Transitioned to CONNECTED');

    await server.close('Test complete');
    assert(server.state === 'DISCONNECTED', 'Server closed cleanly');
  });

  await test('Client creates real OS TCP connection and establishes session', async () => {
    const server = new TcpTransportAdapter();
    await server.listen({ transportType: 'TCP', host: '127.0.0.1', port: 0 });

    const client = new TcpTransportAdapter();
    const session = await client.connect({
      transportType: 'TCP',
      host: '127.0.0.1',
      port: server.localEndpoint!.port,
    });

    assert(client.state === 'CONNECTED', 'Client state is CONNECTED');
    assert(session.transportType === 'TCP', 'Session transportType is TCP');
    assert(session.remoteEndpoint.port === server.localEndpoint!.port, 'Remote port matches server');
    assert(client.localEndpoint !== undefined, 'Client local endpoint recorded');
    assert(client.localEndpoint!.port > 0, `Client local port: ${client.localEndpoint!.port}`);

    await client.close();
    await server.close();
  });

  // ─── 3. Unicast Transmission & Wire Framing Integrity ────────────────────────

  console.log('\n3. Unicast Transmission & Wire Framing Integrity:');

  await test('Transmits Phase 1 packet over real OS TCP socket and verifies byte integrity', async () => {
    const server = new TcpTransportAdapter();
    const client = new TcpTransportAdapter();

    await server.listen({ transportType: 'TCP', host: '127.0.0.1', port: 0 });
    await client.connect({ transportType: 'TCP', host: '127.0.0.1', port: server.localEndpoint!.port });

    const receivePromise = new Promise<{ packet: CubiOPacket; session: TransportSession }>((resolve) => {
      server.receive((pkt, sess) => {
        resolve({ packet: pkt, session: sess });
      });
    });

    const testPacket = makeValidPacket(1, 'Real TCP Stream Transmission Verification');
    const receipt = await client.send(testPacket);

    assert(receipt.success === true, 'Receipt reports success');
    assert(receipt.packetId === testPacket.header.packetId, 'Receipt packetId matches');
    assert(receipt.bytesTransmitted > 0, 'Bytes transmitted > 0');

    const received = await receivePromise;

    assert(received.packet.header.packetId === testPacket.header.packetId, 'Packet ID matches');
    assert(received.packet.header.sequenceNumber === testPacket.header.sequenceNumber, 'Sequence number matches');
    assert(received.packet.checksum === testPacket.checksum, 'Checksum matches');
    assert(received.packet.payload.data === testPacket.payload.data, 'Payload data matches');

    assert(client.metrics.packetsSent === 1, 'Client packetsSent is 1');
    assert(client.metrics.bytesSent === receipt.bytesTransmitted, 'Client bytesSent matches receipt');
    assert(server.metrics.packetsReceived === 1, 'Server packetsReceived is 1');
    assert(server.metrics.bytesReceived === testPacket.payload.byteLength, 'Server bytesReceived matches packet payload');

    await client.close();
    await server.close();
  });

  // ─── 4. Bidirectional Packet Exchange ────────────────────────────────────────

  console.log('\n4. Bidirectional Packet Exchange:');

  await test('Exchanges bidirectional packets between server and client via real TCP sockets', async () => {
    const server = new TcpTransportAdapter();
    const client = new TcpTransportAdapter();

    await server.listen({ transportType: 'TCP', host: '127.0.0.1', port: 0 });
    await client.connect({ transportType: 'TCP', host: '127.0.0.1', port: server.localEndpoint!.port });

    const serverReceivedPromise = new Promise<CubiOPacket>((resolve) => {
      server.receive((pkt, sess) => {
        resolve(pkt);
        const replyPacket = makeValidPacket(2, 'TCP Response from Server');
        server.send(replyPacket, { destinationEndpoint: sess.remoteEndpoint });
      });
    });

    const clientReceivedPromise = new Promise<CubiOPacket>((resolve) => {
      client.receive((pkt) => {
        resolve(pkt);
      });
    });

    const outboundPacket = makeValidPacket(1, 'TCP Query from Client');
    await client.send(outboundPacket);

    const srvPkt = await serverReceivedPromise;
    assert(srvPkt.header.packetId === outboundPacket.header.packetId, 'Server received client query');

    const cliPkt = await clientReceivedPromise;
    assert(cliPkt.payload.data.includes('TCP Response from Server'), 'Client received server reply');

    assert(client.metrics.packetsSent === 1, 'Client sent 1');
    assert(client.metrics.packetsReceived === 1, 'Client received 1');
    assert(server.metrics.packetsReceived === 1, 'Server received 1');
    assert(server.metrics.packetsSent === 1, 'Server sent 1');

    await client.close();
    await server.close();
  });

  // ─── 5. Coalesced Stream Delivery (Multiple Packets in Single Chunk) ─────────

  console.log('\n5. Coalesced Stream Delivery (Multiple Packets in Single Chunk):');

  await test('Parses and dispatches multiple coalesced packets delivered in a single TCP chunk', async () => {
    const server = new TcpTransportAdapter();
    await server.listen({ transportType: 'TCP', host: '127.0.0.1', port: 0 });

    const receivedPackets: CubiOPacket[] = [];
    server.receive((pkt) => {
      receivedPackets.push(pkt);
    });

    // Create 3 separate frames
    const pkt1 = makeValidPacket(1, 'Coalesced Packet 1');
    const pkt2 = makeValidPacket(2, 'Coalesced Packet 2');
    const pkt3 = makeValidPacket(3, 'Coalesced Packet 3');

    const frame1 = encodeFrame(pkt1);
    const frame2 = encodeFrame(pkt2);
    const frame3 = encodeFrame(pkt3);

    // Concatenate all 3 frames into a single buffer
    const combinedChunk = Buffer.concat([frame1, frame2, frame3]);

    // Connect raw socket and write everything in one single chunk
    const rawSock = net.createConnection(server.localEndpoint!.port, '127.0.0.1');
    await new Promise<void>((resolve) => rawSock.once('connect', resolve));
    rawSock.write(combinedChunk);

    await sleep(50);

    assert(receivedPackets.length === 3, `Received all 3 coalesced packets (got ${receivedPackets.length})`);
    assert(receivedPackets[0].payload.data.includes('Coalesced Packet 1'), 'Packet 1 matched');
    assert(receivedPackets[1].payload.data.includes('Coalesced Packet 2'), 'Packet 2 matched');
    assert(receivedPackets[2].payload.data.includes('Coalesced Packet 3'), 'Packet 3 matched');
    assert(server.metrics.packetsReceived === 3, 'Server recorded 3 packetsReceived');

    rawSock.destroy();
    await server.close();
  });

  // ─── 6. Fragmented Stream Reads (Chunk-by-Chunk Assembly) ────────────────────

  console.log('\n6. Fragmented Stream Reads (Chunk-by-Chunk Assembly):');

  await test('Reassembles a single packet split into tiny arbitrary stream fragments', async () => {
    const server = new TcpTransportAdapter();
    await server.listen({ transportType: 'TCP', host: '127.0.0.1', port: 0 });

    const receivedPromise = new Promise<CubiOPacket>((resolve) => {
      server.receive((pkt) => resolve(pkt));
    });

    const testPacket = makeValidPacket(42, 'Fragmented Stream Read Reassembly Test with substantial payload length to ensure multi-chunk fragmentation behavior.');
    const fullFrame = encodeFrame(testPacket);

    // Send the frame in tiny 11-byte fragments with small delays
    const rawSock = net.createConnection(server.localEndpoint!.port, '127.0.0.1');
    await new Promise<void>((resolve) => rawSock.once('connect', resolve));

    const chunkSize = 11;
    for (let offset = 0; offset < fullFrame.length; offset += chunkSize) {
      const chunk = fullFrame.subarray(offset, Math.min(offset + chunkSize, fullFrame.length));
      rawSock.write(chunk);
      await sleep(5); // Simulate network packet fragmentation jitter
    }

    const reassembled = await receivedPromise;

    assert(reassembled.header.packetId === testPacket.header.packetId, 'Reassembled packet ID matches');
    assert(reassembled.header.sequenceNumber === 42, 'Reassembled sequence number matches');
    assert(reassembled.checksum === testPacket.checksum, 'Reassembled checksum matches');
    assert(reassembled.payload.data === testPacket.payload.data, 'Reassembled payload text matches');
    assert(server.metrics.packetsReceived === 1, 'Server received exactly 1 packet');

    rawSock.destroy();
    await server.close();
  });

  // ─── 7. Malformed Wire Framing & Fail-Closed Defense ─────────────────────────

  console.log('\n7. Malformed Wire Framing & Fail-Closed Defense:');

  await test('Rejects stream with invalid magic token and destroys desynchronized socket', async () => {
    const server = new TcpTransportAdapter();
    await server.listen({ transportType: 'TCP', host: '127.0.0.1', port: 0 });

    const errors: CanonicalTransportError[] = [];
    server.onError((err) => {
      errors.push(err);
    });

    // Send 10-byte header with invalid magic 'BADMGC'
    const badFrame = Buffer.alloc(20);
    badFrame.writeUInt32BE(10, 0);
    badFrame.write('BADMGC', 4, 6, 'ascii');
    badFrame.fill(0x58, 10);

    const rawSock = net.createConnection(server.localEndpoint!.port, '127.0.0.1');
    await new Promise<void>((resolve) => rawSock.once('connect', resolve));
    rawSock.write(badFrame);

    await sleep(50);

    assert(server.metrics.packetsDropped === 1, 'Server incremented packetsDropped');
    assert(errors.length === 1, 'Server emitted error');
    assert(errors[0].code === 'ERR_TRANSPORT_FRAME_CORRUPTED', 'Error is ERR_TRANSPORT_FRAME_CORRUPTED');
    assert(errors[0].message.includes('Invalid TCP wire frame magic'), 'Error mentions magic mismatch');

    rawSock.destroy();
    await server.close();
  });

  await test('Rejects frame declaring length greater than maxPayloadBytes', async () => {
    const server = new TcpTransportAdapter();
    await server.listen({ transportType: 'TCP', host: '127.0.0.1', port: 0 });

    const errors: CanonicalTransportError[] = [];
    server.onError((err) => {
      errors.push(err);
    });

    // Send header claiming 100,000 bytes payload (exceeds default 65,536 limit)
    const oversizedHeader = Buffer.alloc(10);
    oversizedHeader.writeUInt32BE(100000, 0);
    oversizedHeader.write(TRANSPORT_FRAME_CONSTANTS.MAGIC, 4, 6, 'ascii');

    const rawSock = net.createConnection(server.localEndpoint!.port, '127.0.0.1');
    await new Promise<void>((resolve) => rawSock.once('connect', resolve));
    rawSock.write(oversizedHeader);

    await sleep(50);

    assert(server.metrics.packetsDropped === 1, 'Server incremented packetsDropped');
    assert(errors.length === 1, 'Server emitted error');
    assert(errors[0].code === 'ERR_TRANSPORT_FRAME_CORRUPTED', 'Error is ERR_TRANSPORT_FRAME_CORRUPTED');
    assert(errors[0].message.includes('exceeds adapter maxPayloadBytes'), 'Error mentions maxPayloadBytes');

    rawSock.destroy();
    await server.close();
  });

  await test('Rejects frame containing corrupted JSON payload', async () => {
    const server = new TcpTransportAdapter();
    await server.listen({ transportType: 'TCP', host: '127.0.0.1', port: 0 });

    const errors: CanonicalTransportError[] = [];
    server.onError((err) => {
      errors.push(err);
    });

    const corruptJson = Buffer.from('{ unparseable corrupted json ...', 'utf8');
    const frame = Buffer.allocUnsafe(10 + corruptJson.length);
    frame.writeUInt32BE(corruptJson.length, 0);
    frame.write(TRANSPORT_FRAME_CONSTANTS.MAGIC, 4, 6, 'ascii');
    corruptJson.copy(frame, 10);

    const rawSock = net.createConnection(server.localEndpoint!.port, '127.0.0.1');
    await new Promise<void>((resolve) => rawSock.once('connect', resolve));
    rawSock.write(frame);

    await sleep(50);

    assert(server.metrics.packetsDropped === 1, 'Server dropped corrupted JSON');
    assert(errors.length === 1, 'Server emitted error');
    assert(errors[0].code === 'ERR_TRANSPORT_FRAME_CORRUPTED', 'Error is ERR_TRANSPORT_FRAME_CORRUPTED');

    rawSock.destroy();
    await server.close();
  });

  await test('Rejects frame containing structurally invalid Phase 1 packet fail-closed', async () => {
    const server = new TcpTransportAdapter();
    await server.listen({ transportType: 'TCP', host: '127.0.0.1', port: 0 });

    const errors: CanonicalTransportError[] = [];
    server.onError((err) => {
      errors.push(err);
    });

    const invalidPacketJson = JSON.stringify({
      header: { packetId: 'PKT_INVALID', packetType: 'UNKNOWN_TYPE' },
      payload: { data: 'test' },
    });
    const payloadBuf = Buffer.from(invalidPacketJson, 'utf8');
    const frame = Buffer.allocUnsafe(10 + payloadBuf.length);
    frame.writeUInt32BE(payloadBuf.length, 0);
    frame.write(TRANSPORT_FRAME_CONSTANTS.MAGIC, 4, 6, 'ascii');
    payloadBuf.copy(frame, 10);

    const rawSock = net.createConnection(server.localEndpoint!.port, '127.0.0.1');
    await new Promise<void>((resolve) => rawSock.once('connect', resolve));
    rawSock.write(frame);

    await sleep(50);

    assert(server.metrics.packetsDropped === 1, 'Server dropped invalid packet');
    assert(errors.length === 1, 'Server emitted error');
    assert(errors[0].code === 'ERR_TRANSPORT_FRAME_CORRUPTED', 'Error is ERR_TRANSPORT_FRAME_CORRUPTED');

    rawSock.destroy();
    await server.close();
  });

  // ─── 8. Disconnect & Remote Teardown Handling ────────────────────────────────

  console.log('\n8. Disconnect & Remote Teardown Handling:');

  await test('Detects remote peer close, transitions to DISCONNECTED, and emits error', async () => {
    const server = new TcpTransportAdapter();
    await server.listen({ transportType: 'TCP', host: '127.0.0.1', port: 0 });

    const client = new TcpTransportAdapter();
    await client.connect({ transportType: 'TCP', host: '127.0.0.1', port: server.localEndpoint!.port });

    const clientErrors: CanonicalTransportError[] = [];
    client.onError((err) => {
      clientErrors.push(err);
    });

    // Close server listener and tear down accepted connections
    await server.close('Server shutdown');

    await sleep(50);

    assert(client.state === 'DISCONNECTED', 'Client transitioned to DISCONNECTED');
    assert(clientErrors.some((e) => e.code === 'ERR_TRANSPORT_DISCONNECTED'), 'Emitted ERR_TRANSPORT_DISCONNECTED');

    await client.close();
  });

  // ─── 9. Timeout Behavior ───────────────────────────────────────────────────

  console.log('\n9. Timeout Behavior:');

  await test('Normal transmission completes within timeout allowance', async () => {
    const server = new TcpTransportAdapter();
    const client = new TcpTransportAdapter();

    await server.listen({ transportType: 'TCP', host: '127.0.0.1', port: 0 });
    await client.connect({ transportType: 'TCP', host: '127.0.0.1', port: server.localEndpoint!.port });

    const pkt = makeValidPacket(1, 'Timeout test');
    const receipt = await client.send(pkt, { timeoutMs: 2000 });

    assert(receipt.success === true, 'Send succeeded within timeout');

    await client.close();
    await server.close();
  });

  // ─── 10. Clean Shutdown & Port Release ───────────────────────────────────────

  console.log('\n10. Clean Shutdown & Port Release:');

  await test('Adapter close is clean, releases OS socket, and allows re-binding', async () => {
    const server = new TcpTransportAdapter();
    await server.listen({ transportType: 'TCP', host: '127.0.0.1', port: 0 });
    const boundPort = server.localEndpoint!.port;

    await server.close('First close');
    assert(server.state === 'DISCONNECTED', 'State is DISCONNECTED');

    // Calling close again should be idempotent
    await server.close('Second close');
    assert(server.state === 'DISCONNECTED', 'Idempotent close succeeded');

    // Re-bind to the exact same port to prove OS socket release
    const newServer = new TcpTransportAdapter();
    await newServer.listen({ transportType: 'TCP', host: '127.0.0.1', port: boundPort });
    assert(newServer.state === 'CONNECTED', 'Re-bound successfully to previously closed port');
    await newServer.close();
  });

  // ─── Summary ───────────────────────────────────────────────────────────────

  console.log('\n══════════════════════════════════════════════════════════════════════════');
  console.log(`  Phase 2 / Task 04 Test Results: ${passed} PASSED, ${failed} FAILED`);
  console.log('══════════════════════════════════════════════════════════════════════════\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
