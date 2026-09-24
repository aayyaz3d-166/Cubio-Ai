/**
 * CUBiO AI — Phase 2 / Task 06: Real Local IPC Transport Driver Tests
 * ====================================================================
 *
 * Validates the real operating system IPC transport driver using OS named pipes
 * on Windows ('\\\\.\\pipe\\...') and domain sockets on POSIX. Proves:
 *   - OS IPC socket lifecycle (listen, connect, session creation, teardown).
 *   - Phase 1 packet framing wire protocol ([4B len][6B 'CUBTR1'][canonical JSON]).
 *   - Bidirectional transmission and 100% payload integrity.
 *   - Stream fragmentation reassembly & packet coalescing over named pipe.
 *   - Fail-closed malformed frame defense (corrupted magic, length mismatch, corrupted JSON, invalid packet).
 *   - Remote disconnect detection and clean resource release.
 *   - REAL MULTI-PROCESS IPC: Spawns an external operating system child process
 *     and transmits Phase 1 packets back and forth across physical OS process boundaries.
 *
 * Run with:  npx tsx src/cubio/network/transport/ipcTransport.test.ts
 */

import * as net from 'node:net';
import * as path from 'node:path';
import { spawn } from 'node:child_process';
import {
  IpcPipeTransportAdapter,
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

function makeValidPacket(seq: number = 1, payloadText: string = 'Hello CUBiO IPC'): CubiOPacket {
  return createPacket({
    envelopeId: `ENV_IPC_${seq}`,
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
  console.log('  CUBiO AI — Phase 2 / Task 06: Real Local IPC Transport Tests            ');
  console.log('══════════════════════════════════════════════════════════════════════════\n');

  // ─── 1. Capabilities & Contract Conformance ─────────────────────────────────

  console.log('1. Capabilities & Interface Contract Conformance:');

  await test('IpcPipeTransportAdapter exposes real IPC capabilities', () => {
    const adapter = new IpcPipeTransportAdapter();
    assert(adapter.transportType === 'IPC_PIPE', 'Transport type is IPC_PIPE');
    assert(adapter.capabilities.connectionOriented === true, 'IPC is connection-oriented');
    assert(adapter.capabilities.reliable === true, 'IPC is reliable');
    assert(adapter.capabilities.ordered === true, 'IPC is ordered');
    assert(adapter.capabilities.messageOriented === false, 'IPC is stream-oriented');
    assert(adapter.capabilities.supportsBroadcast === false, 'IPC does not support broadcast');
    assert(adapter.capabilities.maxPayloadBytes === 65536, 'Max payload is 65,536 bytes');
    assert(adapter.capabilities.defaultMtu === 1400, 'Default MTU is 1400 bytes');
    assert(adapter.state === 'UNINITIALIZED', 'Initial state is UNINITIALIZED');
  });

  // ─── 2. OS Named Pipe Lifecycle & Address Handling ──────────────────────────

  console.log('\n2. OS Named Pipe Lifecycle & Address Handling:');

  await test('Server listener binds to real OS named pipe and transitions state', async () => {
    const server = new IpcPipeTransportAdapter();
    const transitions: string[] = [];

    server.onStateChange((prev, next) => {
      transitions.push(`${prev}->${next}`);
    });

    const pipeName = `cubio-lifecycle-${Date.now()}`;
    const ep: TransportEndpoint = {
      transportType: 'IPC_PIPE',
      host: 'localhost',
      port: 0,
      path: pipeName,
      coordinateUri: 'CUBIO://NETWORK/0/01/00001/SERVER',
    };

    await server.listen(ep);

    assert(server.state === 'CONNECTED', 'Server state is CONNECTED');
    assert(server.localEndpoint !== undefined, 'Local endpoint is set');
    assert(server.localEndpoint!.path !== undefined, 'Local pipe path is set');
    assert(server.localEndpoint!.path!.includes(pipeName), 'Pipe path contains pipeName');
    assert(transitions.includes('UNINITIALIZED->INITIALIZING'), 'Transitioned through INITIALIZING');
    assert(transitions.includes('INITIALIZING->CONNECTED'), 'Transitioned to CONNECTED');

    await server.close('Test complete');
    assert(server.state === 'DISCONNECTED', 'Server closed cleanly');
  });

  await test('Client establishes real OS IPC named pipe connection', async () => {
    const pipeName = `cubio-client-conn-${Date.now()}`;
    const server = new IpcPipeTransportAdapter();
    await server.listen({ transportType: 'IPC_PIPE', host: 'localhost', port: 0, path: pipeName });

    const client = new IpcPipeTransportAdapter();
    const session = await client.connect({
      transportType: 'IPC_PIPE',
      host: 'localhost',
      port: 0,
      path: server.localEndpoint!.path,
    });

    assert(client.state === 'CONNECTED', 'Client state is CONNECTED');
    assert(session.transportType === 'IPC_PIPE', 'Session transportType is IPC_PIPE');
    assert(session.remoteEndpoint.path === server.localEndpoint!.path, 'Remote path matches server pipe');

    await client.close();
    await server.close();
  });

  // ─── 3. Unicast Transmission & Wire Framing Integrity ────────────────────────

  console.log('\n3. Unicast Transmission & Wire Framing Integrity:');

  await test('Transmits Phase 1 packet over real OS IPC named pipe and verifies byte integrity', async () => {
    const pipeName = `cubio-unicast-${Date.now()}`;
    const server = new IpcPipeTransportAdapter();
    const client = new IpcPipeTransportAdapter();

    await server.listen({ transportType: 'IPC_PIPE', host: 'localhost', port: 0, path: pipeName });
    await client.connect({ transportType: 'IPC_PIPE', host: 'localhost', port: 0, path: server.localEndpoint!.path });

    const receivePromise = new Promise<{ packet: CubiOPacket; session: TransportSession }>((resolve) => {
      server.receive((pkt, sess) => {
        resolve({ packet: pkt, session: sess });
      });
    });

    const testPacket = makeValidPacket(1, 'Real OS IPC Named Pipe Transmission Verification');
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

  // ─── 4. Bidirectional In-Process Packet Exchange ─────────────────────────────

  console.log('\n4. Bidirectional In-Process Packet Exchange:');

  await test('Exchanges bidirectional packets between server and client via real IPC pipe', async () => {
    const pipeName = `cubio-bidi-${Date.now()}`;
    const server = new IpcPipeTransportAdapter();
    const client = new IpcPipeTransportAdapter();

    await server.listen({ transportType: 'IPC_PIPE', host: 'localhost', port: 0, path: pipeName });
    await client.connect({ transportType: 'IPC_PIPE', host: 'localhost', port: 0, path: server.localEndpoint!.path });

    let sendPromise: Promise<any> | undefined;
    const serverReceivedPromise = new Promise<CubiOPacket>((resolve) => {
      server.receive((pkt) => {
        resolve(pkt);
        const replyPacket = makeValidPacket(2, 'IPC Response from Server');
        sendPromise = server.send(replyPacket);
      });
    });

    const clientReceivedPromise = new Promise<CubiOPacket>((resolve) => {
      client.receive((pkt) => {
        resolve(pkt);
      });
    });

    const outboundPacket = makeValidPacket(1, 'IPC Query from Client');
    await client.send(outboundPacket);

    const srvPkt = await serverReceivedPromise;
    assert(srvPkt.header.packetId === outboundPacket.header.packetId, 'Server received client query');

    const cliPkt = await clientReceivedPromise;
    assert(cliPkt.payload.data.includes('IPC Response from Server'), 'Client received server reply');

    if (sendPromise) await sendPromise;
    await sleep(20);

    assert(client.metrics.packetsSent === 1, 'Client sent 1');
    assert(client.metrics.packetsReceived === 1, 'Client received 1');
    assert(server.metrics.packetsReceived === 1, 'Server received 1');
    assert(server.metrics.packetsSent === 1, 'Server sent 1');

    await client.close();
    await server.close();
  });

  // ─── 5. Stream Fragmentation and Coalescing ─────────────────────────────────

  console.log('\n5. Stream Fragmentation and Coalescing:');

  await test('Reassembles a single packet split across tiny arbitrary IPC stream fragments', async () => {
    const pipeName = `cubio-frag-${Date.now()}`;
    const server = new IpcPipeTransportAdapter();
    await server.listen({ transportType: 'IPC_PIPE', host: 'localhost', port: 0, path: pipeName });

    const receivedPromise = new Promise<CubiOPacket>((resolve) => {
      server.receive((pkt) => resolve(pkt));
    });

    const testPacket = makeValidPacket(77, 'IPC Fragmented Stream Read Reassembly Test payload with considerable length.');
    const fullFrame = encodeFrame(testPacket);

    const rawSock = net.createConnection(server.localEndpoint!.path!);
    await new Promise<void>((resolve) => rawSock.once('connect', resolve));

    const chunkSize = 13;
    for (let offset = 0; offset < fullFrame.length; offset += chunkSize) {
      const chunk = fullFrame.subarray(offset, Math.min(offset + chunkSize, fullFrame.length));
      rawSock.write(chunk);
      await sleep(5);
    }

    const reassembled = await receivedPromise;

    assert(reassembled.header.packetId === testPacket.header.packetId, 'Reassembled packet ID matches');
    assert(reassembled.header.sequenceNumber === 77, 'Reassembled sequence number matches');
    assert(reassembled.checksum === testPacket.checksum, 'Reassembled checksum matches');
    assert(reassembled.payload.data === testPacket.payload.data, 'Reassembled payload text matches');
    assert(server.metrics.packetsReceived === 1, 'Server received exactly 1 packet');

    rawSock.destroy();
    await server.close();
  });

  await test('Parses and dispatches multiple coalesced packets delivered in a single IPC chunk', async () => {
    const pipeName = `cubio-coalesced-${Date.now()}`;
    const server = new IpcPipeTransportAdapter();
    await server.listen({ transportType: 'IPC_PIPE', host: 'localhost', port: 0, path: pipeName });

    const receivedPackets: CubiOPacket[] = [];
    server.receive((pkt) => {
      receivedPackets.push(pkt);
    });

    const pkt1 = makeValidPacket(1, 'IPC Coalesced 1');
    const pkt2 = makeValidPacket(2, 'IPC Coalesced 2');
    const pkt3 = makeValidPacket(3, 'IPC Coalesced 3');

    const combined = Buffer.concat([encodeFrame(pkt1), encodeFrame(pkt2), encodeFrame(pkt3)]);

    const rawSock = net.createConnection(server.localEndpoint!.path!);
    await new Promise<void>((resolve) => rawSock.once('connect', resolve));
    rawSock.write(combined);

    await sleep(50);

    assert(receivedPackets.length === 3, `Received all 3 packets (got ${receivedPackets.length})`);
    assert(receivedPackets[0].payload.data.includes('IPC Coalesced 1'), 'Packet 1 matched');
    assert(receivedPackets[1].payload.data.includes('IPC Coalesced 2'), 'Packet 2 matched');
    assert(receivedPackets[2].payload.data.includes('IPC Coalesced 3'), 'Packet 3 matched');

    rawSock.destroy();
    await server.close();
  });

  // ─── 6. Malformed Wire Framing & Fail-Closed Defense ─────────────────────────

  console.log('\n6. Malformed Wire Framing & Fail-Closed Defense:');

  await test('Rejects IPC stream with invalid magic token and destroys socket', async () => {
    const pipeName = `cubio-badmagic-${Date.now()}`;
    const server = new IpcPipeTransportAdapter();
    await server.listen({ transportType: 'IPC_PIPE', host: 'localhost', port: 0, path: pipeName });

    const errors: CanonicalTransportError[] = [];
    server.onError((err) => {
      errors.push(err);
    });

    const badFrame = Buffer.alloc(20);
    badFrame.writeUInt32BE(10, 0);
    badFrame.write('BADMGC', 4, 6, 'ascii');
    badFrame.fill(0x58, 10);

    const rawSock = net.createConnection(server.localEndpoint!.path!);
    await new Promise<void>((resolve) => rawSock.once('connect', resolve));
    rawSock.write(badFrame);

    await sleep(50);

    assert(server.metrics.packetsDropped === 1, 'Server incremented packetsDropped');
    assert(errors.length === 1, 'Server emitted error');
    assert(errors[0].code === 'ERR_TRANSPORT_FRAME_CORRUPTED', 'Error is ERR_TRANSPORT_FRAME_CORRUPTED');
    assert(errors[0].message.includes('Invalid IPC wire frame magic'), 'Error mentions magic mismatch');

    rawSock.destroy();
    await server.close();
  });

  await test('Rejects IPC frame declaring length greater than maxPayloadBytes', async () => {
    const pipeName = `cubio-oversized-${Date.now()}`;
    const server = new IpcPipeTransportAdapter();
    await server.listen({ transportType: 'IPC_PIPE', host: 'localhost', port: 0, path: pipeName });

    const errors: CanonicalTransportError[] = [];
    server.onError((err) => {
      errors.push(err);
    });

    const oversizedHeader = Buffer.alloc(10);
    oversizedHeader.writeUInt32BE(100000, 0);
    oversizedHeader.write(TRANSPORT_FRAME_CONSTANTS.MAGIC, 4, 6, 'ascii');

    const rawSock = net.createConnection(server.localEndpoint!.path!);
    await new Promise<void>((resolve) => rawSock.once('connect', resolve));
    rawSock.write(oversizedHeader);

    await sleep(50);

    assert(server.metrics.packetsDropped === 1, 'Server incremented packetsDropped');
    assert(errors.length === 1, 'Server emitted error');
    assert(errors[0].code === 'ERR_TRANSPORT_FRAME_CORRUPTED', 'Error is ERR_TRANSPORT_FRAME_CORRUPTED');

    rawSock.destroy();
    await server.close();
  });

  await test('Rejects IPC frame containing corrupted JSON payload', async () => {
    const pipeName = `cubio-corruptjson-${Date.now()}`;
    const server = new IpcPipeTransportAdapter();
    await server.listen({ transportType: 'IPC_PIPE', host: 'localhost', port: 0, path: pipeName });

    const errors: CanonicalTransportError[] = [];
    server.onError((err) => {
      errors.push(err);
    });

    const corruptJson = Buffer.from('{ unparseable corrupted json ...', 'utf8');
    const frame = Buffer.allocUnsafe(10 + corruptJson.length);
    frame.writeUInt32BE(corruptJson.length, 0);
    frame.write(TRANSPORT_FRAME_CONSTANTS.MAGIC, 4, 6, 'ascii');
    corruptJson.copy(frame, 10);

    const rawSock = net.createConnection(server.localEndpoint!.path!);
    await new Promise<void>((resolve) => rawSock.once('connect', resolve));
    rawSock.write(frame);

    await sleep(50);

    assert(server.metrics.packetsDropped === 1, 'Server dropped corrupted JSON');
    assert(errors.length === 1, 'Server emitted error');
    assert(errors[0].code === 'ERR_TRANSPORT_FRAME_CORRUPTED', 'Error is ERR_TRANSPORT_FRAME_CORRUPTED');

    rawSock.destroy();
    await server.close();
  });

  await test('Rejects IPC frame containing structurally invalid Phase 1 packet fail-closed', async () => {
    const pipeName = `cubio-invalidpkt-${Date.now()}`;
    const server = new IpcPipeTransportAdapter();
    await server.listen({ transportType: 'IPC_PIPE', host: 'localhost', port: 0, path: pipeName });

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

    const rawSock = net.createConnection(server.localEndpoint!.path!);
    await new Promise<void>((resolve) => rawSock.once('connect', resolve));
    rawSock.write(frame);

    await sleep(50);

    assert(server.metrics.packetsDropped === 1, 'Server dropped invalid packet');
    assert(errors.length === 1, 'Server emitted error');
    assert(errors[0].code === 'ERR_TRANSPORT_FRAME_CORRUPTED', 'Error is ERR_TRANSPORT_FRAME_CORRUPTED');

    rawSock.destroy();
    await server.close();
  });

  // ─── 7. Disconnect & Remote Teardown Handling ────────────────────────────────

  console.log('\n7. Disconnect & Remote Teardown Handling:');

  await test('Detects remote peer close, transitions to DISCONNECTED, and emits error', async () => {
    const pipeName = `cubio-teardown-${Date.now()}`;
    const server = new IpcPipeTransportAdapter();
    await server.listen({ transportType: 'IPC_PIPE', host: 'localhost', port: 0, path: pipeName });

    const client = new IpcPipeTransportAdapter();
    await client.connect({ transportType: 'IPC_PIPE', host: 'localhost', port: 0, path: server.localEndpoint!.path });

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

  // ─── 8. REAL MULTI-PROCESS IPC VERIFICATION ─────────────────────────────────

  console.log('\n8. Real Multi-Process Cross-Process IPC Verification:');

  await test('Exchanges Phase 1 packets across separate OS processes via Windows Named Pipe', async () => {
    const pipeName = `cubio-multiprocess-${Date.now()}`;
    const server = new IpcPipeTransportAdapter();

    await server.listen({
      transportType: 'IPC_PIPE',
      host: 'localhost',
      port: 0,
      path: pipeName,
    });

    const boundPipePath = server.localEndpoint!.path!;

    // Promise for child process packet arrival
    const childReplyPromise = new Promise<CubiOPacket>((resolve) => {
      server.receive((pkt) => {
        resolve(pkt);
      });
    });

    // Spawn real separate child process executing worker directly via node and tsx cli
    const workerScript = path.resolve('src/cubio/network/transport/ipcChildProcessWorker.ts');
    const tsxCli = path.resolve('node_modules/tsx/dist/cli.mjs');
    const child = spawn(process.execPath, [tsxCli, workerScript, boundPipePath], {
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let childPid = child.pid;
    let childStdout = '';
    let childStderr = '';

    child.stdout?.on('data', (d) => { childStdout += d.toString(); });
    child.stderr?.on('data', (d) => { childStderr += d.toString(); });

    // Wait for child process to connect to the server (up to 4 seconds)
    const deadline = Date.now() + 4000;
    while (server.acceptedSessions.length === 0 && Date.now() < deadline) {
      await sleep(50);
    }

    assert(server.acceptedSessions.length > 0, `Child process did not connect within deadline. childStderr: ${childStderr}`);

    // Send packet from parent process to child process
    const parentPacket = makeValidPacket(1, 'Parent Process Instructions for Child');
    await server.send(parentPacket);

    // Await child reply
    const childReply = await childReplyPromise;

    // Await child process clean exit
    const exitCode = await new Promise<number | null>((resolve) => {
      child.on('close', resolve);
    });

    assert(exitCode === 0, `Child process exited cleanly with code 0 (got ${exitCode}, stderr: ${childStderr})`);
    assert(childReply.header.sourceUri === 'CUBIO://NETWORK/0/01/00003/CHILD_PROCESS', 'Source URI is child process');
    assert(childReply.payload.data.includes('Child Process (PID:'), 'Payload contains child PID acknowledgment');
    assert(childReply.payload.data.includes('Parent Process Instructions for Child'), 'Payload echoes parent instructions');

    await server.close();
  });

  // ─── 9. Clean Shutdown & Pipe Release ─────────────────────────────────────

  console.log('\n9. Clean Shutdown & Pipe Release:');

  await test('Adapter close is clean, releases OS pipe handle, and allows re-binding', async () => {
    const pipeName = `cubio-close-idempotent-${Date.now()}`;
    const server = new IpcPipeTransportAdapter();
    await server.listen({ transportType: 'IPC_PIPE', host: 'localhost', port: 0, path: pipeName });
    const boundPath = server.localEndpoint!.path!;

    await server.close('First close');
    assert(server.state === 'DISCONNECTED', 'State is DISCONNECTED');

    // Calling close again should be idempotent
    await server.close('Second close');
    assert(server.state === 'DISCONNECTED', 'Idempotent close succeeded');

    // Re-bind to the exact same pipe path
    const newServer = new IpcPipeTransportAdapter();
    await newServer.listen({ transportType: 'IPC_PIPE', host: 'localhost', port: 0, path: boundPath });
    assert(newServer.state === 'CONNECTED', 'Re-bound successfully to previously closed pipe');
    await newServer.close();
  });

  // ─── Summary ───────────────────────────────────────────────────────────────

  console.log('\n══════════════════════════════════════════════════════════════════════════');
  console.log(`  Phase 2 / Task 06 Test Results: ${passed} PASSED, ${failed} FAILED`);
  console.log('══════════════════════════════════════════════════════════════════════════\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
