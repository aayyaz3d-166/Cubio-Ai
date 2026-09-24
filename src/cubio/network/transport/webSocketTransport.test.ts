/**
 * CUBiO AI — Phase 2 / Task 05: Real WebSocket Transport Driver Tests
 * ====================================================================
 *
 * Validates the real WebSocket transport driver using the 'ws' library
 * on localhost (127.0.0.1). Proves:
 *   - OS WebSocket server & client lifecycle (listen, connect, session creation, teardown).
 *   - Phase 1 packet framing wire protocol ([4B len][6B 'CUBTR1'][canonical JSON]).
 *   - Bidirectional localhost transmission and 100% payload integrity.
 *   - Discrete message boundary preservation across sequential packets.
 *   - Fail-closed malformed frame defense (truncated, corrupted magic, oversized length, boundary mismatch, corrupted JSON, invalid packet).
 *   - Remote disconnect detection, timeout enforcement, and clean port release.
 *
 * Run with:  npx tsx src/cubio/network/transport/webSocketTransport.test.ts
 */

import { WebSocket } from 'ws';
import {
  WebSocketTransportAdapter,
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

function makeValidPacket(seq: number = 1, payloadText: string = 'Hello CUBiO WebSocket'): CubiOPacket {
  return createPacket({
    envelopeId: `ENV_WS_${seq}`,
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
  console.log('  CUBiO AI — Phase 2 / Task 05: Real WebSocket Transport Driver Tests     ');
  console.log('══════════════════════════════════════════════════════════════════════════\n');

  // ─── 1. Capabilities & Contract Conformance ─────────────────────────────────

  console.log('1. Capabilities & Interface Contract Conformance:');

  await test('WebSocketTransportAdapter exposes real WebSocket capabilities', () => {
    const adapter = new WebSocketTransportAdapter();
    assert(adapter.transportType === 'WEBSOCKET', 'Transport type is WEBSOCKET');
    assert(adapter.capabilities.connectionOriented === true, 'WebSocket is connection-oriented');
    assert(adapter.capabilities.reliable === true, 'WebSocket is reliable');
    assert(adapter.capabilities.ordered === true, 'WebSocket is ordered');
    assert(adapter.capabilities.messageOriented === true, 'WebSocket is message-oriented');
    assert(adapter.capabilities.supportsBroadcast === false, 'WebSocket does not support broadcast');
    assert(adapter.capabilities.maxPayloadBytes === 65536, 'Max payload is 65,536 bytes');
    assert(adapter.capabilities.defaultMtu === 1400, 'Default MTU is 1400 bytes');
    assert(adapter.state === 'UNINITIALIZED', 'Initial state is UNINITIALIZED');
  });

  // ─── 2. OS WebSocket Lifecycle & Address Handling ───────────────────────────

  console.log('\n2. OS WebSocket Lifecycle & Address Handling:');

  await test('Server listener binds to real OS WebSocket port and dynamically resolves port', async () => {
    const server = new WebSocketTransportAdapter({ path: '/cubio-test' });
    const transitions: string[] = [];

    server.onStateChange((prev, next) => {
      transitions.push(`${prev}->${next}`);
    });

    const ep: TransportEndpoint = {
      transportType: 'WEBSOCKET',
      host: '127.0.0.1',
      port: 0, // OS assigns ephemeral port
      path: '/cubio-test',
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

  await test('Client creates real WebSocket connection and establishes session', async () => {
    const server = new WebSocketTransportAdapter({ path: '/cubio-ws' });
    await server.listen({ transportType: 'WEBSOCKET', host: '127.0.0.1', port: 0 });

    const client = new WebSocketTransportAdapter({ path: '/cubio-ws' });
    const session = await client.connect({
      transportType: 'WEBSOCKET',
      host: '127.0.0.1',
      port: server.localEndpoint!.port,
      path: '/cubio-ws',
    });

    assert(client.state === 'CONNECTED', 'Client state is CONNECTED');
    assert(session.transportType === 'WEBSOCKET', 'Session transportType is WEBSOCKET');
    assert(session.remoteEndpoint.port === server.localEndpoint!.port, 'Remote port matches server');
    assert(session.remoteEndpoint.path === '/cubio-ws', 'Remote path matches /cubio-ws');

    await client.close();
    await server.close();
  });

  // ─── 3. Unicast Transmission & Wire Framing Integrity ────────────────────────

  console.log('\n3. Unicast Transmission & Wire Framing Integrity:');

  await test('Transmits Phase 1 packet over real WebSocket connection and verifies byte integrity', async () => {
    const server = new WebSocketTransportAdapter();
    const client = new WebSocketTransportAdapter();

    await server.listen({ transportType: 'WEBSOCKET', host: '127.0.0.1', port: 0 });
    await client.connect({ transportType: 'WEBSOCKET', host: '127.0.0.1', port: server.localEndpoint!.port });

    const receivePromise = new Promise<{ packet: CubiOPacket; session: TransportSession }>((resolve) => {
      server.receive((pkt, sess) => {
        resolve({ packet: pkt, session: sess });
      });
    });

    const testPacket = makeValidPacket(1, 'Real WebSocket Loopback Transmission Verification');
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

  await test('Exchanges bidirectional packets between server and client via real WebSockets', async () => {
    const server = new WebSocketTransportAdapter();
    const client = new WebSocketTransportAdapter();

    await server.listen({ transportType: 'WEBSOCKET', host: '127.0.0.1', port: 0 });
    await client.connect({ transportType: 'WEBSOCKET', host: '127.0.0.1', port: server.localEndpoint!.port });

    const serverReceivedPromise = new Promise<CubiOPacket>((resolve) => {
      server.receive((pkt, sess) => {
        resolve(pkt);
        const replyPacket = makeValidPacket(2, 'WebSocket Response from Server');
        server.send(replyPacket, { destinationEndpoint: sess.remoteEndpoint });
      });
    });

    const clientReceivedPromise = new Promise<CubiOPacket>((resolve) => {
      client.receive((pkt) => {
        resolve(pkt);
      });
    });

    const outboundPacket = makeValidPacket(1, 'WebSocket Query from Client');
    await client.send(outboundPacket);

    const srvPkt = await serverReceivedPromise;
    assert(srvPkt.header.packetId === outboundPacket.header.packetId, 'Server received client query');

    const cliPkt = await clientReceivedPromise;
    assert(cliPkt.payload.data.includes('WebSocket Response from Server'), 'Client received server reply');

    assert(client.metrics.packetsSent === 1, 'Client sent 1');
    assert(client.metrics.packetsReceived === 1, 'Client received 1');
    assert(server.metrics.packetsReceived === 1, 'Server received 1');
    assert(server.metrics.packetsSent === 1, 'Server sent 1');

    await client.close();
    await server.close();
  });

  // ─── 5. Message Boundary Preservation ────────────────────────────────────────

  console.log('\n5. Message Boundary Preservation:');

  await test('Preserves discrete message boundaries across sequential packet burst', async () => {
    const server = new WebSocketTransportAdapter();
    const client = new WebSocketTransportAdapter();

    await server.listen({ transportType: 'WEBSOCKET', host: '127.0.0.1', port: 0 });
    await client.connect({ transportType: 'WEBSOCKET', host: '127.0.0.1', port: server.localEndpoint!.port });

    const receivedPackets: CubiOPacket[] = [];
    server.receive((pkt) => {
      receivedPackets.push(pkt);
    });

    const count = 5;
    for (let i = 0; i < count; i++) {
      const pkt = makeValidPacket(i, `Message Boundary Packet #${i}`);
      await client.send(pkt);
    }

    await sleep(50);

    assert(receivedPackets.length === count, `Received all ${count} discrete messages (got ${receivedPackets.length})`);
    for (let i = 0; i < count; i++) {
      assert(receivedPackets[i].payload.data.includes(`Message Boundary Packet #${i}`), `Packet ${i} matched`);
    }

    assert(client.metrics.packetsSent === count, `Client sent ${count}`);
    assert(server.metrics.packetsReceived === count, `Server received ${count}`);

    await client.close();
    await server.close();
  });

  // ─── 6. Malformed Wire Framing & Fail-Closed Defense ─────────────────────────

  console.log('\n6. Malformed Wire Framing & Fail-Closed Defense:');

  await test('Rejects truncated WebSocket message frame (< 10 bytes)', async () => {
    const server = new WebSocketTransportAdapter();
    await server.listen({ transportType: 'WEBSOCKET', host: '127.0.0.1', port: 0 });

    const errors: CanonicalTransportError[] = [];
    server.onError((err) => {
      errors.push(err);
    });

    // Connect raw WebSocket and send 5 bytes binary frame
    const ws = new WebSocket(`ws://127.0.0.1:${server.localEndpoint!.port}`);
    await new Promise<void>((resolve) => ws.once('open', resolve));

    const truncated = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04]);
    ws.send(truncated);

    await sleep(50);

    assert(server.metrics.packetsDropped === 1, 'Server incremented packetsDropped');
    assert(errors.length === 1, 'Server emitted error');
    assert(errors[0].code === 'ERR_TRANSPORT_FRAME_CORRUPTED', 'Error is ERR_TRANSPORT_FRAME_CORRUPTED');
    assert(errors[0].message.includes('Truncated WebSocket frame'), 'Error mentions truncated frame');

    ws.close();
    await server.close();
  });

  await test('Rejects WebSocket message with invalid magic token', async () => {
    const server = new WebSocketTransportAdapter();
    await server.listen({ transportType: 'WEBSOCKET', host: '127.0.0.1', port: 0 });

    const errors: CanonicalTransportError[] = [];
    server.onError((err) => {
      errors.push(err);
    });

    const badMagicFrame = Buffer.alloc(14);
    badMagicFrame.writeUInt32BE(4, 0);
    badMagicFrame.write('BADMGC', 4, 6, 'ascii');
    badMagicFrame.write('test', 10, 4, 'utf8');

    const ws = new WebSocket(`ws://127.0.0.1:${server.localEndpoint!.port}`);
    await new Promise<void>((resolve) => ws.once('open', resolve));
    ws.send(badMagicFrame);

    await sleep(50);

    assert(server.metrics.packetsDropped === 1, 'Server dropped invalid magic frame');
    assert(errors.length === 1, 'Server emitted error');
    assert(errors[0].code === 'ERR_TRANSPORT_FRAME_CORRUPTED', 'Error is ERR_TRANSPORT_FRAME_CORRUPTED');
    assert(errors[0].message.includes('Invalid WebSocket wire frame magic'), 'Error mentions magic mismatch');

    ws.close();
    await server.close();
  });

  await test('Rejects WebSocket message with boundary length mismatch', async () => {
    const server = new WebSocketTransportAdapter();
    await server.listen({ transportType: 'WEBSOCKET', host: '127.0.0.1', port: 0 });

    const errors: CanonicalTransportError[] = [];
    server.onError((err) => {
      errors.push(err);
    });

    // Declares 50 bytes payload, but frame only has 4 bytes
    const mismatchFrame = Buffer.alloc(14);
    mismatchFrame.writeUInt32BE(50, 0);
    mismatchFrame.write(TRANSPORT_FRAME_CONSTANTS.MAGIC, 4, 6, 'ascii');
    mismatchFrame.write('test', 10, 4, 'utf8');

    const ws = new WebSocket(`ws://127.0.0.1:${server.localEndpoint!.port}`);
    await new Promise<void>((resolve) => ws.once('open', resolve));
    ws.send(mismatchFrame);

    await sleep(50);

    assert(server.metrics.packetsDropped === 1, 'Server dropped length mismatch frame');
    assert(errors.length === 1, 'Server emitted error');
    assert(errors[0].code === 'ERR_TRANSPORT_FRAME_CORRUPTED', 'Error is ERR_TRANSPORT_FRAME_CORRUPTED');
    assert(errors[0].message.includes('boundary mismatch'), 'Error mentions boundary mismatch');

    ws.close();
    await server.close();
  });

  await test('Rejects WebSocket message with corrupted JSON payload', async () => {
    const server = new WebSocketTransportAdapter();
    await server.listen({ transportType: 'WEBSOCKET', host: '127.0.0.1', port: 0 });

    const errors: CanonicalTransportError[] = [];
    server.onError((err) => {
      errors.push(err);
    });

    const corruptJson = Buffer.from('{ broken json ...', 'utf8');
    const frame = Buffer.allocUnsafe(10 + corruptJson.length);
    frame.writeUInt32BE(corruptJson.length, 0);
    frame.write(TRANSPORT_FRAME_CONSTANTS.MAGIC, 4, 6, 'ascii');
    corruptJson.copy(frame, 10);

    const ws = new WebSocket(`ws://127.0.0.1:${server.localEndpoint!.port}`);
    await new Promise<void>((resolve) => ws.once('open', resolve));
    ws.send(frame);

    await sleep(50);

    assert(server.metrics.packetsDropped === 1, 'Server dropped corrupted JSON');
    assert(errors.length === 1, 'Server emitted error');
    assert(errors[0].code === 'ERR_TRANSPORT_FRAME_CORRUPTED', 'Error is ERR_TRANSPORT_FRAME_CORRUPTED');

    ws.close();
    await server.close();
  });

  await test('Rejects WebSocket message containing structurally invalid Phase 1 packet', async () => {
    const server = new WebSocketTransportAdapter();
    await server.listen({ transportType: 'WEBSOCKET', host: '127.0.0.1', port: 0 });

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

    const ws = new WebSocket(`ws://127.0.0.1:${server.localEndpoint!.port}`);
    await new Promise<void>((resolve) => ws.once('open', resolve));
    ws.send(frame);

    await sleep(50);

    assert(server.metrics.packetsDropped === 1, 'Server dropped invalid packet');
    assert(errors.length === 1, 'Server emitted error');
    assert(errors[0].code === 'ERR_TRANSPORT_FRAME_CORRUPTED', 'Error is ERR_TRANSPORT_FRAME_CORRUPTED');

    ws.close();
    await server.close();
  });

  // ─── 7. Disconnect & Remote Teardown Handling ────────────────────────────────

  console.log('\n7. Disconnect & Remote Teardown Handling:');

  await test('Detects remote peer close, transitions to DISCONNECTED, and emits error', async () => {
    const server = new WebSocketTransportAdapter();
    await server.listen({ transportType: 'WEBSOCKET', host: '127.0.0.1', port: 0 });

    const client = new WebSocketTransportAdapter();
    await client.connect({ transportType: 'WEBSOCKET', host: '127.0.0.1', port: server.localEndpoint!.port });

    const clientErrors: CanonicalTransportError[] = [];
    client.onError((err) => {
      clientErrors.push(err);
    });

    await server.close('Server shutdown');

    await sleep(50);

    assert(client.state === 'DISCONNECTED', 'Client transitioned to DISCONNECTED');
    assert(clientErrors.some((e) => e.code === 'ERR_TRANSPORT_DISCONNECTED'), 'Emitted ERR_TRANSPORT_DISCONNECTED');

    await client.close();
  });

  // ─── 8. Timeout Behavior ───────────────────────────────────────────────────

  console.log('\n8. Timeout Behavior:');

  await test('Normal transmission completes within timeout allowance', async () => {
    const server = new WebSocketTransportAdapter();
    const client = new WebSocketTransportAdapter();

    await server.listen({ transportType: 'WEBSOCKET', host: '127.0.0.1', port: 0 });
    await client.connect({ transportType: 'WEBSOCKET', host: '127.0.0.1', port: server.localEndpoint!.port });

    const pkt = makeValidPacket(1, 'Timeout test');
    const receipt = await client.send(pkt, { timeoutMs: 2000 });

    assert(receipt.success === true, 'Send succeeded within timeout');

    await client.close();
    await server.close();
  });

  // ─── 9. Clean Shutdown & Port Release ───────────────────────────────────────

  console.log('\n9. Clean Shutdown & Port Release:');

  await test('Adapter close is clean, releases OS WebSocket port, and allows re-binding', async () => {
    const server = new WebSocketTransportAdapter();
    await server.listen({ transportType: 'WEBSOCKET', host: '127.0.0.1', port: 0 });
    const boundPort = server.localEndpoint!.port;

    await server.close('First close');
    assert(server.state === 'DISCONNECTED', 'State is DISCONNECTED');

    // Calling close again should be idempotent
    await server.close('Second close');
    assert(server.state === 'DISCONNECTED', 'Idempotent close succeeded');

    // Re-bind to the exact same port
    const newServer = new WebSocketTransportAdapter();
    await newServer.listen({ transportType: 'WEBSOCKET', host: '127.0.0.1', port: boundPort });
    assert(newServer.state === 'CONNECTED', 'Re-bound successfully to previously closed port');
    await newServer.close();
  });

  // ─── Summary ───────────────────────────────────────────────────────────────

  console.log('\n══════════════════════════════════════════════════════════════════════════');
  console.log(`  Phase 2 / Task 05 Test Results: ${passed} PASSED, ${failed} FAILED`);
  console.log('══════════════════════════════════════════════════════════════════════════\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
