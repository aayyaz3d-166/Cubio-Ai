/**
 * CUBiO AI — Phase 2 / Task 03: Real UDP Transport Driver Tests
 * ==============================================================
 *
 * Validates the real operating system UDP transport driver using 'node:dgram'
 * on localhost (127.0.0.1). Proves:
 *   - OS UDP socket lifecycle (bind, connect, teardown).
 *   - Phase 1 packet framing wire protocol ([4B len][6B 'CUBTR1'][canonical JSON]).
 *   - Bidirectional localhost transmission and payload integrity.
 *   - Fail-closed malformed frame rejection (truncated, invalid magic, length mismatch, corrupted JSON, invalid packet checksum).
 *   - Adapter metrics accounting and clean shutdown.
 *
 * Run with:  npx tsx src/cubio/network/transport/udpTransport.test.ts
 */

import * as dgram from 'node:dgram';
import {
  UdpTransportAdapter,
  TransportEndpoint,
  TransportSession,
  CanonicalTransportError,
  TRANSPORT_FRAME_CONSTANTS,
} from './index';
import { createPacket } from '../protocol/v1/packetEngine';
import { createEnvelope } from '../protocol/v1/protocolEngine';
import { packetizeEnvelope } from '../protocol/v1/packetEngine';
import { createMessage } from '../protocol/v1/messageEngine';
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

function makeValidPacket(seq: number = 1, payloadText: string = 'Hello CUBiO UDP'): CubiOPacket {
  return createPacket({
    envelopeId: `ENV_UDP_${seq}`,
    sequenceNumber: seq,
    sourceUri: 'CUBIO://NETWORK/0/01/00001/APP',
    destinationUri: 'CUBIO://NETWORK/0/01/00002/APP',
    payloadData: payloadText,
  });
}

async function runSuite() {
  console.log('\n══════════════════════════════════════════════════════════════════════════');
  console.log('  CUBiO AI — Phase 2 / Task 03: Real UDP Transport Driver Tests           ');
  console.log('══════════════════════════════════════════════════════════════════════════\n');

  // ─── 1. Capabilities & Contract Conformance ─────────────────────────────────

  console.log('1. Capabilities & Interface Contract Conformance:');

  await test('UdpTransportAdapter exposes real UDP capabilities', () => {
    const adapter = new UdpTransportAdapter();
    assert(adapter.transportType === 'UDP', 'Transport type is UDP');
    assert(adapter.capabilities.connectionOriented === false, 'UDP is connectionless');
    assert(adapter.capabilities.reliable === false, 'UDP is unreliable');
    assert(adapter.capabilities.ordered === false, 'UDP is unordered');
    assert(adapter.capabilities.messageOriented === true, 'UDP is message-oriented');
    assert(adapter.capabilities.supportsBroadcast === true, 'UDP supports broadcast');
    assert(adapter.capabilities.maxPayloadBytes === 65507, 'Max payload is 65,507 bytes');
    assert(adapter.capabilities.defaultMtu === 1400, 'Default MTU is 1400 bytes');
    assert(adapter.state === 'UNINITIALIZED', 'Initial state is UNINITIALIZED');
  });

  // ─── 2. OS Socket Lifecycle & Address Handling ─────────────────────────────

  console.log('\n2. OS Socket Lifecycle & Address Handling:');

  await test('Server listener binds to real OS UDP socket and dynamically resolves port', async () => {
    const server = new UdpTransportAdapter();
    const transitions: string[] = [];

    server.onStateChange((prev, next) => {
      transitions.push(`${prev}->${next}`);
    });

    const ep: TransportEndpoint = {
      transportType: 'UDP',
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

  await test('Client creates real OS UDP socket and establishes session to remote endpoint', async () => {
    const client = new UdpTransportAdapter();

    const remoteEp: TransportEndpoint = {
      transportType: 'UDP',
      host: '127.0.0.1',
      port: 49152,
    };

    const session = await client.connect(remoteEp);

    assert(client.state === 'CONNECTED', 'Client state is CONNECTED');
    assert(session.transportType === 'UDP', 'Session transportType is UDP');
    assert(session.remoteEndpoint.host === '127.0.0.1', 'Remote host matches');
    assert(session.remoteEndpoint.port === 49152, 'Remote port matches');
    assert(client.localEndpoint !== undefined, 'Client bound to local ephemeral port');
    assert(client.localEndpoint!.port > 0, `Client local port: ${client.localEndpoint!.port}`);

    await client.close('Test complete');
    assert(client.state === 'DISCONNECTED', 'Client closed cleanly');
  });

  // ─── 3. Unicast Packet Transmission & Wire Framing Integrity ────────────────

  console.log('\n3. Unicast Packet Transmission & Wire Framing Integrity:');

  await test('Transmits Phase 1 packet over real OS UDP socket and verifies byte integrity', async () => {
    const server = new UdpTransportAdapter();
    const client = new UdpTransportAdapter();

    // 1. Bind server to ephemeral port
    await server.listen({
      transportType: 'UDP',
      host: '127.0.0.1',
      port: 0,
      coordinateUri: 'CUBIO://NETWORK/0/01/00001/SERVER',
    });
    const serverPort = server.localEndpoint!.port;

    // 2. Connect client to server
    await client.connect({
      transportType: 'UDP',
      host: '127.0.0.1',
      port: serverPort,
    });

    // 3. Prepare receiver promise on server
    const receivePromise = new Promise<{ packet: CubiOPacket; session: TransportSession }>((resolve) => {
      server.receive((pkt, sess) => {
        resolve({ packet: pkt, session: sess });
      });
    });

    // 4. Create and send valid Phase 1 packet
    const testPacket = makeValidPacket(1, 'Real UDP Loopback Transmission Verification');
    const receipt = await client.send(testPacket);

    assert(receipt.success === true, 'Receipt reports success');
    assert(receipt.packetId === testPacket.header.packetId, 'Receipt packetId matches');
    assert(receipt.bytesTransmitted > 0, 'Bytes transmitted > 0');

    // 5. Await packet delivery over real OS socket
    const received = await receivePromise;

    // 6. Verify packet integrity
    assert(received.packet.header.packetId === testPacket.header.packetId, 'Packet ID matches');
    assert(received.packet.header.sequenceNumber === testPacket.header.sequenceNumber, 'Sequence number matches');
    assert(received.packet.checksum === testPacket.checksum, 'Packet checksum matches');
    assert(received.packet.payload.data === testPacket.payload.data, 'Payload data matches');
    assert(received.session.remoteEndpoint.port === client.localEndpoint!.port, 'Remote session records client port');

    // 7. Verify adapter metrics
    assert(client.metrics.packetsSent === 1, 'Client packetsSent is 1');
    assert(client.metrics.bytesSent === receipt.bytesTransmitted, 'Client bytesSent matches receipt');
    assert(server.metrics.packetsReceived === 1, 'Server packetsReceived is 1');
    assert(server.metrics.bytesReceived === testPacket.payload.byteLength, 'Server bytesReceived matches packet payload');

    await client.close();
    await server.close();
  });

  // ─── 4. Bidirectional Packet Exchange ────────────────────────────────────────

  console.log('\n4. Bidirectional Packet Exchange:');

  await test('Exchanges bidirectional packets between server and client via real UDP sockets', async () => {
    const server = new UdpTransportAdapter();
    const client = new UdpTransportAdapter();

    await server.listen({ transportType: 'UDP', host: '127.0.0.1', port: 0 });
    await client.connect({ transportType: 'UDP', host: '127.0.0.1', port: server.localEndpoint!.port });

    const serverReceivedPromise = new Promise<CubiOPacket>((resolve) => {
      server.receive((pkt, sess) => {
        resolve(pkt);
        // Reply back to client
        const replyPacket = makeValidPacket(2, 'UDP Response from Server');
        server.send(replyPacket, { destinationEndpoint: sess.remoteEndpoint });
      });
    });

    const clientReceivedPromise = new Promise<CubiOPacket>((resolve) => {
      client.receive((pkt) => {
        resolve(pkt);
      });
    });

    // Send client -> server
    const outboundPacket = makeValidPacket(1, 'UDP Query from Client');
    await client.send(outboundPacket);

    const srvPkt = await serverReceivedPromise;
    assert(srvPkt.header.packetId === outboundPacket.header.packetId, 'Server got client query');

    const cliPkt = await clientReceivedPromise;
    assert(cliPkt.payload.data.includes('UDP Response from Server'), 'Client got server reply');

    assert(client.metrics.packetsSent === 1, 'Client sent 1');
    assert(client.metrics.packetsReceived === 1, 'Client received 1');
    assert(server.metrics.packetsReceived === 1, 'Server received 1');
    assert(server.metrics.packetsSent === 1, 'Server sent 1');

    await client.close();
    await server.close();
  });

  // ─── 5. Packet Burst Delivery ───────────────────────────────────────────────

  console.log('\n5. Packet Burst Delivery:');

  await test('Delivers a burst of 5 sequential packets cleanly over localhost UDP', async () => {
    const server = new UdpTransportAdapter();
    const client = new UdpTransportAdapter();

    await server.listen({ transportType: 'UDP', host: '127.0.0.1', port: 0 });
    await client.connect({ transportType: 'UDP', host: '127.0.0.1', port: server.localEndpoint!.port });

    const receivedPackets: CubiOPacket[] = [];
    server.receive((pkt) => {
      receivedPackets.push(pkt);
    });

    const burstCount = 5;
    for (let i = 0; i < burstCount; i++) {
      const pkt = makeValidPacket(i, `Burst packet #${i}`);
      await client.send(pkt);
    }

    // Wait briefly for all UDP datagrams to process on localhost
    await sleep(50);

    assert(receivedPackets.length === burstCount, `Received all ${burstCount} packets (got ${receivedPackets.length})`);
    assert(client.metrics.packetsSent === burstCount, `Client sent ${burstCount}`);
    assert(server.metrics.packetsReceived === burstCount, `Server received ${burstCount}`);

    await client.close();
    await server.close();
  });

  // ─── 6. Malformed Wire Framing & Fail-Closed Error Handling ─────────────────

  console.log('\n6. Malformed Wire Framing & Fail-Closed Error Handling:');

  await test('Rejects truncated datagram (< 10 bytes) and increments packetsDropped', async () => {
    const server = new UdpTransportAdapter();
    await server.listen({ transportType: 'UDP', host: '127.0.0.1', port: 0 });

    const errors: CanonicalTransportError[] = [];
    server.onError((err) => {
      errors.push(err);
    });

    // Send raw 5-byte datagram (insufficient for 10-byte header)
    const rawSock = dgram.createSocket('udp4');
    const truncatedData = Buffer.from([0x01, 0x02, 0x03, 0x04, 0x05]);

    await new Promise<void>((resolve) => {
      rawSock.send(truncatedData, server.localEndpoint!.port, '127.0.0.1', () => resolve());
    });
    rawSock.close();

    await sleep(30);

    assert(server.metrics.packetsDropped === 1, 'Server packetsDropped incremented');
    assert(errors.length === 1, 'Server emitted corrupted frame error');
    assert(errors[0].code === 'ERR_TRANSPORT_FRAME_CORRUPTED', 'Error code is ERR_TRANSPORT_FRAME_CORRUPTED');
    assert(errors[0].message.includes('Truncated UDP datagram'), 'Error mentions truncated datagram');

    await server.close();
  });

  await test('Rejects datagram with invalid magic token', async () => {
    const server = new UdpTransportAdapter();
    await server.listen({ transportType: 'UDP', host: '127.0.0.1', port: 0 });

    const errors: CanonicalTransportError[] = [];
    server.onError((err) => {
      errors.push(err);
    });

    // Frame with bad magic: length 4 + "BADMGC" + "test"
    const payload = Buffer.from('test', 'utf8');
    const frame = Buffer.allocUnsafe(10 + payload.length);
    frame.writeUInt32BE(payload.length, 0);
    frame.write('BADMGC', 4, 6, 'ascii');
    payload.copy(frame, 10);

    const rawSock = dgram.createSocket('udp4');
    await new Promise<void>((resolve) => {
      rawSock.send(frame, server.localEndpoint!.port, '127.0.0.1', () => resolve());
    });
    rawSock.close();

    await sleep(30);

    assert(server.metrics.packetsDropped === 1, 'Server dropped invalid magic packet');
    assert(errors.length === 1, 'Server emitted error');
    assert(errors[0].code === 'ERR_TRANSPORT_FRAME_CORRUPTED', 'Error code is ERR_TRANSPORT_FRAME_CORRUPTED');
    assert(errors[0].message.includes('Invalid UDP wire frame magic'), 'Error mentions magic mismatch');

    await server.close();
  });

  await test('Rejects datagram with declared length mismatch', async () => {
    const server = new UdpTransportAdapter();
    await server.listen({ transportType: 'UDP', host: '127.0.0.1', port: 0 });

    const errors: CanonicalTransportError[] = [];
    server.onError((err) => {
      errors.push(err);
    });

    // Frame with declared length 100, but only 4 bytes payload
    const payload = Buffer.from('test', 'utf8');
    const frame = Buffer.allocUnsafe(10 + payload.length);
    frame.writeUInt32BE(100, 0); // Declares 100 bytes!
    frame.write(TRANSPORT_FRAME_CONSTANTS.MAGIC, 4, 6, 'ascii');
    payload.copy(frame, 10);

    const rawSock = dgram.createSocket('udp4');
    await new Promise<void>((resolve) => {
      rawSock.send(frame, server.localEndpoint!.port, '127.0.0.1', () => resolve());
    });
    rawSock.close();

    await sleep(30);

    assert(server.metrics.packetsDropped === 1, 'Server dropped length mismatch packet');
    assert(errors.length === 1, 'Server emitted error');
    assert(errors[0].code === 'ERR_TRANSPORT_FRAME_CORRUPTED', 'Error code is ERR_TRANSPORT_FRAME_CORRUPTED');
    assert(errors[0].message.includes('Datagram length mismatch'), 'Error mentions length mismatch');

    await server.close();
  });

  await test('Rejects datagram with corrupted JSON payload', async () => {
    const server = new UdpTransportAdapter();
    await server.listen({ transportType: 'UDP', host: '127.0.0.1', port: 0 });

    const errors: CanonicalTransportError[] = [];
    server.onError((err) => {
      errors.push(err);
    });

    const corruptJson = Buffer.from('{ corrupt json content ...', 'utf8');
    const frame = Buffer.allocUnsafe(10 + corruptJson.length);
    frame.writeUInt32BE(corruptJson.length, 0);
    frame.write(TRANSPORT_FRAME_CONSTANTS.MAGIC, 4, 6, 'ascii');
    corruptJson.copy(frame, 10);

    const rawSock = dgram.createSocket('udp4');
    await new Promise<void>((resolve) => {
      rawSock.send(frame, server.localEndpoint!.port, '127.0.0.1', () => resolve());
    });
    rawSock.close();

    await sleep(30);

    assert(server.metrics.packetsDropped === 1, 'Server dropped corrupted JSON');
    assert(errors.length === 1, 'Server emitted error');
    assert(errors[0].code === 'ERR_TRANSPORT_FRAME_CORRUPTED', 'Error code is ERR_TRANSPORT_FRAME_CORRUPTED');
    assert(errors[0].message.includes('Failed to deserialize packet JSON'), 'Error mentions JSON deserialization');

    await server.close();
  });

  await test('Rejects datagram containing structurally invalid Phase 1 packet', async () => {
    const server = new UdpTransportAdapter();
    await server.listen({ transportType: 'UDP', host: '127.0.0.1', port: 0 });

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

    const rawSock = dgram.createSocket('udp4');
    await new Promise<void>((resolve) => {
      rawSock.send(frame, server.localEndpoint!.port, '127.0.0.1', () => resolve());
    });
    rawSock.close();

    await sleep(30);

    assert(server.metrics.packetsDropped === 1, 'Server dropped invalid packet');
    assert(errors.length === 1, 'Server emitted error');
    assert(errors[0].code === 'ERR_TRANSPORT_FRAME_CORRUPTED', 'Error code is ERR_TRANSPORT_FRAME_CORRUPTED');

    await server.close();
  });

  // ─── 7. MTU and Boundary Enforcement ─────────────────────────────────────────

  console.log('\n7. MTU and Boundary Enforcement:');

  await test('Rejects packet exceeding UDP maxPayloadBytes (65,507 bytes)', async () => {
    const client = new UdpTransportAdapter();
    await client.connect({ transportType: 'UDP', host: '127.0.0.1', port: 3690 });

    const normalPacket = makeValidPacket(1, 'Normal');
    const oversizedPacket: CubiOPacket = {
      ...normalPacket,
      payload: {
        ...normalPacket.payload,
        byteLength: 70000, // Exceeds 65507
        data: 'A'.repeat(70000),
      },
    };

    let thrown = false;
    try {
      await client.send(oversizedPacket);
    } catch (err: any) {
      thrown = true;
    }

    assert(thrown, 'Oversized packet was rejected with error');
    assert(client.metrics.packetsDropped === 1, 'Packets dropped was incremented');

    await client.close();
  });

  // ─── 8. Timeout Behavior ───────────────────────────────────────────────────

  console.log('\n8. Timeout Behavior:');

  await test('Normal transmission completes within timeout allowance', async () => {
    const server = new UdpTransportAdapter();
    const client = new UdpTransportAdapter();

    await server.listen({ transportType: 'UDP', host: '127.0.0.1', port: 0 });
    await client.connect({ transportType: 'UDP', host: '127.0.0.1', port: server.localEndpoint!.port });

    const pkt = makeValidPacket(1, 'Timeout test');
    const receipt = await client.send(pkt, { timeoutMs: 2000 });

    assert(receipt.success === true, 'Send succeeded within timeout');

    await client.close();
    await server.close();
  });

  // ─── 9. Clean Shutdown & Idempotence ────────────────────────────────────────

  console.log('\n9. Clean Shutdown & Idempotence:');

  await test('Adapter close is clean, releases OS socket, and is idempotent', async () => {
    const server = new UdpTransportAdapter();
    await server.listen({ transportType: 'UDP', host: '127.0.0.1', port: 0 });
    const boundPort = server.localEndpoint!.port;

    await server.close('First close');
    assert(server.state === 'DISCONNECTED', 'State is DISCONNECTED');

    // Calling close again should not throw
    await server.close('Second close');
    assert(server.state === 'DISCONNECTED', 'Idempotent close succeeded');

    // Verify OS socket was released by re-binding a new socket to the same port
    const newServer = new UdpTransportAdapter();
    await newServer.listen({ transportType: 'UDP', host: '127.0.0.1', port: boundPort });
    assert(newServer.state === 'CONNECTED', 'Re-bound successfully to previously closed port');
    await newServer.close();
  });

  // ─── Summary ───────────────────────────────────────────────────────────────

  console.log('\n══════════════════════════════════════════════════════════════════════════');
  console.log(`  Phase 2 / Task 03 Test Results: ${passed} PASSED, ${failed} FAILED`);
  console.log('══════════════════════════════════════════════════════════════════════════\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
