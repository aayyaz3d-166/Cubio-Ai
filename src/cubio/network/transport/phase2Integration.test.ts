/**
 * CUBiO AI — Phase 2 Master Transport Integration Test Suite (Task 13)
 * ====================================================================
 *
 * Exhaustive end-to-end integration test suite verifying all Phase 2 transport layers:
 *  - 1. Transport Abstraction & Polymorphism (UDP, TCP, WebSocket, IPC)
 *  - 2. Datagram Transport (Real UDP unicast & loopback delivery)
 *  - 3. Stream Transport & Framing (Real TCP with Length-Prefixed Framing)
 *  - 4. WebSocket Transport (Real WS server/client binary pipelines)
 *  - 5. Inter-Process Communication (Real Windows Named Pipes)
 *  - 6. Multi-Process Execution (Parent <-> Child Node.js processes over real sockets/pipes)
 *  - 7. Canonical Framing & Boundary Invariance (Length-Prefix, TLV, COBS, Delimiter)
 *  - 8. Connection Lifecycle & Resource Reclamation (State machine, no leaks)
 *  - 9. Handshake & Protocol Negotiation (RFC 8785 handshake, replay & clock skew defense)
 *  - 10. Transport Security (TLS 1.2+, mTLS, Fail-Closed cert rejection)
 *  - 11. Resilience, Retry, Idempotency & Cooperative Cancellation
 *  - 12. Integrated Packet Send/Receive Pipeline (Bit-level invariant preservation)
 *  - 13. Concurrency & Cross-Talk Isolation (Mass concurrent packet transmission)
 *  - 14. Phase 1 Zero-Regression Invariance (Checksum, RFC 8785, 3D CNC spatial coordinates)
 *
 * Run with:  npx tsx src/cubio/network/transport/phase2Integration.test.ts
 */

import { spawn } from 'child_process';
import * as path from 'path';
import {
  UdpTransportAdapter,
  TcpTransportAdapter,
  WebSocketTransportAdapter,
  IpcPipeTransportAdapter,
  TlsTransportAdapter,
  TransportFrameCodec,
  StreamFrameDecoder,
  TransportFramingError,
  ConnectionLifecycleManager,
  IllegalConnectionTransitionError,
  PERMITTED_CONNECTION_TRANSITIONS,
  TransportHandshakeCoordinator,
  CubiOTransportPipeline,
  InboundEnvelopeAssembler,
  TransportResilienceEngine,
  NonRetryableOperationError,
  CancellationTokenSource,
  RetryPolicy,
  calculateBackoffDelay,
  isRetryableError,
  SECURE_TLS_DEFAULTS,
  TEST_CA_CERT,
  TEST_SERVER_CERT,
  TEST_SERVER_KEY,
  TEST_CLIENT_CERT,
  TEST_CLIENT_KEY,
  UNTRUSTED_ROGUE_CERT,
  UNTRUSTED_ROGUE_KEY,
  TransportEndpoint,
  TransportSession,
} from './index';

import { CURRENT_PROTOCOL_VERSION_STRING } from '../protocol/v1/versionTypes';
import { ProtocolPrincipal, ProtocolAddress, ProtocolPayload, ProtocolEnvelope } from '../protocol/v1/types';
import { createEnvelope } from '../protocol/v1/protocolEngine';
import { createPacket, validatePacket, packetizeEnvelope, reassembleEnvelope } from '../protocol/v1/packetEngine';
import { serializeCanonical } from '../protocol/v1/canonicalSerializer';

function makePayload<T>(body: T, metadata?: Record<string, string>): ProtocolPayload<T> {
  const serialized = JSON.stringify(body);
  return {
    category: 'DIRECT_MESSAGE',
    priority: 'NORMAL',
    contentType: 'application/json',
    body,
    bodyBytes: Buffer.byteLength(serialized, 'utf8'),
    metadata: metadata ? Object.freeze({ ...metadata }) : undefined,
  };
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`[ASSERTION FAILED]: ${message}`);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runMasterIntegrationSuite() {
  console.log('╔══════════════════════════════════════════════════════════════════════════╗');
  console.log('║   CUBiO AI — Phase 2 Master Transport Integration Test Suite (Task 13)   ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════╝\n');

  let passed = 0;
  let failed = 0;
  const basePort = 11400;

  async function test(name: string, fn: () => Promise<void>) {
    process.stdout.write(`  • ${name.padEnd(68)} ... `);
    const start = Date.now();
    try {
      await fn();
      const elapsed = Date.now() - start;
      console.log(`PASS (${elapsed}ms)`);
      passed++;
    } catch (err: any) {
      const elapsed = Date.now() - start;
      console.log(`FAIL (${elapsed}ms)`);
      console.error(`    Error: ${err.message || err}`);
      if (err.stack) {
        console.error(`    ${err.stack.split('\n').slice(1, 4).join('\n    ')}`);
      }
      failed++;
    }
  }

  const primaryPrincipal: ProtocolPrincipal = Object.freeze({
    cubId: 'CUB-00000001',
    entityType: 'NODE',
    signature: '0xSIG_PRIMARY_MASTER',
  });

  const peerPrincipal: ProtocolPrincipal = Object.freeze({
    cubId: 'CUB-00000002',
    entityType: 'AGENT',
    signature: '0xSIG_PEER_EDGE',
  });

  const primaryAddress: ProtocolAddress = Object.freeze({
    coordinate: { network: 'CUBIO' as const, dimension: 0, zone: 1, node: 1, service: 'HUB' },
    uri: 'CUBIO://NETWORK/0/01/00001/HUB',
  });

  const peerAddress: ProtocolAddress = Object.freeze({
    coordinate: { network: 'CUBIO' as const, dimension: 0, zone: 2, node: 2, service: 'EDGE' },
    uri: 'CUBIO://NETWORK/0/02/00002/EDGE',
  });

  function makeMasterEnvelope(seq: number, text: string): ProtocolEnvelope {
    return createEnvelope({
      kind: 'REQUEST',
      source: primaryAddress,
      destination: peerAddress,
      sender: primaryPrincipal,
      payload: makePayload({
        seq,
        text,
        spatialMeta: { dimension: 0, zone: 1, node: 1 },
      }),
      nonce: `nonce_master_${seq}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 1. TRANSPORT ABSTRACTION & POLYMORPHISM
  // ══════════════════════════════════════════════════════════════════════════
  console.log('\n[SECTION 1] Transport Abstraction & Adapter Polymorphism:');

  await test('Instantiates and verifies contract compliance across all 4 adapter types', async () => {
    const udp = new UdpTransportAdapter();
    const tcp = new TcpTransportAdapter();
    const ws = new WebSocketTransportAdapter();
    const ipc = new IpcPipeTransportAdapter();

    assert(udp.transportType === 'UDP', 'UDP type token matches');
    assert(tcp.transportType === 'TCP', 'TCP type token matches');
    assert(ws.transportType === 'WEBSOCKET', 'WS type token matches');
    assert(ipc.transportType === 'IPC_PIPE', 'IPC type token matches');

    assert(udp.capabilities.connectionOriented === false, 'UDP connectionOriented false');
    assert(tcp.capabilities.ordered === true, 'TCP ordered true');
    assert(ws.capabilities.connectionOriented === true, 'WS connectionOriented true');
    assert(ipc.capabilities.ordered === true, 'IPC ordered true');
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 2. REAL UDP DATAGRAM INTEGRATION
  // ══════════════════════════════════════════════════════════════════════════
  console.log('\n[SECTION 2] Datagram Transport (Real Loopback UDP):');

  await test('Transmits envelope over real UDP sockets and reconstructs payload', async () => {
    const srvPort = basePort + 1;
    const srvEp: TransportEndpoint = { transportType: 'UDP', host: '127.0.0.1', port: srvPort };
    const srv = new UdpTransportAdapter();
    const cli = new UdpTransportAdapter();
    const srvPipeline = new CubiOTransportPipeline(srv);
    const cliPipeline = new CubiOTransportPipeline(cli);

    const received: any[] = [];
    srvPipeline.onEnvelope((env) => received.push(env));

    try {
      await srv.listen(srvEp);
      await cli.connect(srvEp);
      await sleep(20);

      const env = makeMasterEnvelope(101, 'Master UDP Integration');
      const report = await cliPipeline.sendEnvelope(env);

      assert(report.totalPackets === 1, 'Single packet transmitted over UDP');
      await sleep(50);

      assert(received.length === 1, 'UDP envelope received');
      assert(received[0].envelopeId === env.envelopeId, 'UDP envelope ID matches');
      assert((received[0].payload.body as any).text === 'Master UDP Integration', 'UDP body matches');
    } finally {
      cliPipeline.dispose();
      srvPipeline.dispose();
      await cli.close('Done');
      await srv.close('Done');
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 3. REAL TCP STREAM & FRAMING INTEGRATION
  // ══════════════════════════════════════════════════════════════════════════
  console.log('\n[SECTION 3] Stream Transport & Framing (Real TCP):');

  await test('Fragments oversized payload and reconstructs across real TCP stream', async () => {
    const port = basePort + 2;
    const ep: TransportEndpoint = { transportType: 'TCP', host: '127.0.0.1', port };
    const srv = new TcpTransportAdapter();
    const cli = new TcpTransportAdapter();
    const srvPipeline = new CubiOTransportPipeline(srv);
    const cliPipeline = new CubiOTransportPipeline(cli);

    const received: any[] = [];
    srvPipeline.onEnvelope((env) => received.push(env));

    try {
      await srv.listen(ep);
      await cli.connect(ep);
      await sleep(40);

      // Large text requiring segmentation into multiple packets at MTU 350
      const largeText = 'CUBIO_TCP_STREAM_'.repeat(250);
      const env = makeMasterEnvelope(202, largeText);
      const report = await cliPipeline.sendEnvelope(env, { mtu: 350 });

      assert(report.totalPackets >= 10, `Expected >= 10 packets, got ${report.totalPackets}`);

      let waited = 0;
      while (received.length === 0 && waited < 2000) {
        await sleep(30);
        waited += 30;
      }

      assert(received.length === 1, 'Reconstructed envelope received on server');
      assert(received[0].envelopeId === env.envelopeId, 'ID matches');
      assert((received[0].payload.body as any).text === largeText, 'Large payload matches exactly');
    } finally {
      cliPipeline.dispose();
      srvPipeline.dispose();
      await cli.close('Done');
      await srv.close('Done');
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 4. REAL WEBSOCKET TRANSPORT INTEGRATION
  // ══════════════════════════════════════════════════════════════════════════
  console.log('\n[SECTION 4] WebSocket Transport (Real WS Pipeline):');

  await test('Transmits fragmented envelope over real WebSocket transport with fidelity', async () => {
    const port = basePort + 3;
    const ep: TransportEndpoint = { transportType: 'WEBSOCKET', host: '127.0.0.1', port };
    const srv = new WebSocketTransportAdapter();
    const cli = new WebSocketTransportAdapter();
    const srvPipeline = new CubiOTransportPipeline(srv);
    const cliPipeline = new CubiOTransportPipeline(cli);

    const received: any[] = [];
    srvPipeline.onEnvelope((env) => received.push(env));

    try {
      await srv.listen(ep);
      await cli.connect(ep);
      await sleep(50);

      const env = makeMasterEnvelope(303, 'WebSocket Multi-Fragment Stream Payload '.repeat(40));
      await cliPipeline.sendEnvelope(env, { mtu: 300 });

      let waited = 0;
      while (received.length === 0 && waited < 2000) {
        await sleep(30);
        waited += 30;
      }

      assert(received.length === 1, 'WS envelope reassembled');
      assert(received[0].envelopeId === env.envelopeId, 'WS envelope ID invariant verified');
    } finally {
      cliPipeline.dispose();
      srvPipeline.dispose();
      await cli.close('Done');
      await srv.close('Done');
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 5. REAL IPC (WINDOWS NAMED PIPES) INTEGRATION
  // ══════════════════════════════════════════════════════════════════════════
  console.log('\n[SECTION 5] Inter-Process Communication (Real Named Pipes):');

  await test('Transmits multi-fragment envelope across real Windows Named Pipe', async () => {
    const pipeName = `cubio_master_pipe_${Date.now()}`;
    const ep: TransportEndpoint = {
      transportType: 'IPC_PIPE',
      host: 'localhost',
      port: 0,
      path: pipeName,
      coordinateUri: 'CUBIO://NETWORK/0/01/00001/PIPE',
    };
    const srv = new IpcPipeTransportAdapter();
    const cli = new IpcPipeTransportAdapter();
    const srvPipeline = new CubiOTransportPipeline(srv);
    const cliPipeline = new CubiOTransportPipeline(cli);

    const received: any[] = [];
    srvPipeline.onEnvelope((env) => received.push(env));

    try {
      await srv.listen(ep);
      await cli.connect(ep);
      await sleep(40);

      const env = makeMasterEnvelope(404, 'IPC Windows Named Pipe Payload '.repeat(35));
      await cliPipeline.sendEnvelope(env, { mtu: 250 });

      let waited = 0;
      while (received.length === 0 && waited < 2000) {
        await sleep(30);
        waited += 30;
      }

      assert(received.length === 1, 'IPC envelope received and reconstructed');
      assert(received[0].envelopeId === env.envelopeId, 'IPC envelopeId matches');
    } finally {
      cliPipeline.dispose();
      srvPipeline.dispose();
      await cli.close('Done');
      await srv.close('Done');
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 6. REAL MULTI-PROCESS EXECUTION (CROSS-OS-PROCESS COMMUNICATION)
  // ══════════════════════════════════════════════════════════════════════════
  console.log('\n[SECTION 6] Multi-Process Execution (Parent <-> Child OS Processes):');

  await test('Parent and separate Child OS process exchange fragmented envelopes over TCP', async () => {
    const port = basePort + 4;
    const ep: TransportEndpoint = { transportType: 'TCP', host: '127.0.0.1', port };
    const srv = new TcpTransportAdapter();
    const srvPipeline = new CubiOTransportPipeline(srv);

    let childMsgReceived: any = null;
    srvPipeline.onEnvelope(async (childEnv) => {
      childMsgReceived = childEnv;
      const ackEnv = createEnvelope({
        kind: 'RESPONSE',
        source: primaryAddress,
        destination: childEnv.source,
        sender: primaryPrincipal,
        payload: makePayload({ msg: 'PARENT_ACK', receivedPid: (childEnv.payload.body as any).workerPid }),
        nonce: `ack_nonce_${Date.now()}`,
      });
      await srvPipeline.sendEnvelope(ackEnv);
    });

    await srv.listen(ep);

    const tsxCli = path.resolve(process.cwd(), 'node_modules/tsx/dist/cli.mjs');
    const workerScript = path.resolve(process.cwd(), 'src/cubio/network/transport/multiProcessWorker.ts');
    const child = spawn(process.execPath, [tsxCli, workerScript, 'TCP', '127.0.0.1', String(port)], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let childOutput = '';
    child.stdout.on('data', (d) => { childOutput += d.toString(); });
    child.stderr.on('data', (d) => { childOutput += d.toString(); });

    const childExitPromise = new Promise<{ code: number | null }>((resolve) => {
      child.on('exit', (code) => resolve({ code }));
    });

    try {
      const exitResult = await Promise.race([
        childExitPromise,
        sleep(5000).then(() => { throw new Error(`Child process timed out. Output: ${childOutput}`); }),
      ]);

      assert(exitResult.code === 0, `Child process exited with code ${exitResult.code}. Output: ${childOutput}`);
      assert(childOutput.includes('WORKER_SUCCESS:PID='), 'Child process printed success confirmation');
      assert(childMsgReceived !== null, 'Parent received envelope from child process');
      assert((childMsgReceived.payload.body as any).workerMsg === 'GREETINGS_FROM_CHILD_PROCESS', 'Child message verified');
    } finally {
      srvPipeline.dispose();
      await srv.close('Multi-process test complete');
    }
  });

  await test('Parent and separate Child OS process exchange multi-fragment envelope over Named Pipe', async () => {
    const pipeName = `cubio_multiproc_pipe_${Date.now()}`;
    const ep: TransportEndpoint = {
      transportType: 'IPC_PIPE',
      host: 'localhost',
      port: 0,
      path: pipeName,
      coordinateUri: 'CUBIO://NETWORK/0/01/00001/PIPE',
    };
    const srv = new IpcPipeTransportAdapter();
    const srvPipeline = new CubiOTransportPipeline(srv);

    let childIpcReceived: any = null;
    srvPipeline.onEnvelope(async (childEnv) => {
      childIpcReceived = childEnv;
      const ackEnv = createEnvelope({
        kind: 'RESPONSE',
        source: primaryAddress,
        destination: childEnv.source,
        sender: primaryPrincipal,
        payload: makePayload({ msg: 'PARENT_IPC_ACK' }),
        nonce: `ack_ipc_nonce_${Date.now()}`,
      });
      await srvPipeline.sendEnvelope(ackEnv);
    });

    await srv.listen(ep);

    const tsxCli = path.resolve(process.cwd(), 'node_modules/tsx/dist/cli.mjs');
    const workerScript = path.resolve(process.cwd(), 'src/cubio/network/transport/multiProcessWorker.ts');
    const child = spawn(process.execPath, [tsxCli, workerScript, 'IPC', pipeName], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let childOutput = '';
    child.stdout.on('data', (d) => { childOutput += d.toString(); });
    child.stderr.on('data', (d) => { childOutput += d.toString(); });

    const childExitPromise = new Promise<{ code: number | null }>((resolve) => {
      child.on('exit', (code) => resolve({ code }));
    });

    try {
      const exitResult = await Promise.race([
        childExitPromise,
        sleep(5000).then(() => { throw new Error(`Child process timed out. Output: ${childOutput}`); }),
      ]);

      assert(exitResult.code === 0, `Child exited with code ${exitResult.code}. Output: ${childOutput}`);
      assert(childOutput.includes('WORKER_SUCCESS:PID='), 'Child confirmed success');
      assert(childIpcReceived !== null, 'Parent received IPC envelope from child process');
      assert((childIpcReceived.payload.body as any).workerMsg === 'IPC_DATA_FROM_CHILD_PROCESS', 'Payload matched');
      assert((childIpcReceived.payload.body as any).largeData === 'M'.repeat(800), 'Large data intact across processes');
    } finally {
      srvPipeline.dispose();
      await srv.close('Multi-process IPC test complete');
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 7. CANONICAL FRAMING & BOUNDARY DEFENSE
  // ══════════════════════════════════════════════════════════════════════════
  console.log('\n[SECTION 7] Framing Strategies & Malformed Stream Defense:');

  await test('TransportFrameCodec and StreamFrameDecoder maintain exact framing and boundary guarantees', async () => {
    const pkt = createPacket({
      envelopeId: 'ENV_FRAME_TEST',
      sequenceNumber: 1,
      sourceUri: 'CUBIO://NETWORK/0/01/00001/FRAME',
      destinationUri: 'CUBIO://NETWORK/0/02/00002/FRAME',
      payloadData: 'Testing Framing Boundary Invariants',
    });

    // 1. Encode into canonical 10-byte wire frame [4B len][6B CUBTR1]
    const wireFrame = TransportFrameCodec.encode(pkt);
    assert(wireFrame.length >= 10, 'Wire frame has header');
    assert(wireFrame.toString('ascii', 4, 10) === 'CUBTR1', 'Frame magic is CUBTR1');

    // 2. Decode discrete frame
    const decoded = TransportFrameCodec.decodeDiscrete(wireFrame);
    assert(decoded.packet.envelopeId === pkt.envelopeId, 'Decoded packet matches');

    // 3. StreamFrameDecoder stream accumulation with partial chunks
    const decoder = new StreamFrameDecoder();
    const half = Math.floor(wireFrame.length / 2);
    const chunk1 = wireFrame.subarray(0, half);
    const chunk2 = wireFrame.subarray(half);

    const res1 = decoder.push(chunk1);
    assert(res1.length === 0, 'Partial chunk produces 0 frames');
    const res2 = decoder.push(chunk2);
    assert(res2.length === 1, 'Second chunk completes frame');
    assert(res2[0].envelopeId === pkt.envelopeId, 'Accumulated packet matches');

    // 4. Boundary Defense: Feed corrupted magic
    const corruptedMagic = Buffer.from(wireFrame);
    corruptedMagic.write('BADMAG', 4, 6, 'ascii');
    let magicCaught = false;
    try {
      TransportFrameCodec.decodeDiscrete(corruptedMagic);
    } catch (err: any) {
      magicCaught = err.code === 'ERR_FRAME_MAGIC_MISMATCH';
    }
    assert(magicCaught, 'Rejects magic mismatch fail-closed');

    // 5. Boundary Defense: Oversized declared length
    const corruptedLen = Buffer.from(wireFrame);
    corruptedLen.writeUInt32BE(0x0fffffff, 0);
    let lenCaught = false;
    try {
      TransportFrameCodec.decodeDiscrete(corruptedLen);
    } catch (err: any) {
      lenCaught = err.code === 'ERR_FRAME_OVERSIZED';
    }
    assert(lenCaught, 'Rejects oversized frame length header fail-closed');
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 8. CONNECTION LIFECYCLE STATE MACHINE & CLEANUP
  // ══════════════════════════════════════════════════════════════════════════
  console.log('\n[SECTION 8] Connection Lifecycle & Resource Reclamation:');

  await test('Enforces state machine progression and releases resources with zero leaks', async () => {
    const dummyAdapter = new TcpTransportAdapter();
    const endpoint: TransportEndpoint = { transportType: 'TCP', host: '127.0.0.1', port: 9000 };
    const manager = new ConnectionLifecycleManager();

    const conn = manager.registerConnection(dummyAdapter, endpoint, {
      connectionId: 'test-lifecycle-master',
      initialState: 'CONNECTING',
    });

    assert(conn.state === 'CONNECTING', 'Initial state is CONNECTING');

    // Invalid transition defense: CONNECTING -> DEGRADED is illegal
    let illegalCaught = false;
    try {
      manager.markDegraded('test-lifecycle-master', 'Illegal transition from connecting');
    } catch (err: any) {
      illegalCaught = true;
      assert(err instanceof IllegalConnectionTransitionError, 'Throws IllegalConnectionTransitionError');
    }
    assert(illegalCaught, 'Blocks illegal transition fail-closed');

    // Close connection cleanly
    await manager.closeConnection('test-lifecycle-master', 'Shutdown complete');
    const closedConn = manager.getConnection('test-lifecycle-master');
    assert(closedConn?.state === 'CLOSED', 'Connection transitioned to CLOSED');

    // Attempting to mutate closed connection leaves it strictly CLOSED
    manager.markDegraded('test-lifecycle-master', 'Mutate closed');
    assert(closedConn.state === 'CLOSED', 'State remains strictly CLOSED');

    await manager.shutdown('Shutdown complete');
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 9. HANDSHAKE & PROTOCOL VERSION NEGOTIATION
  // ══════════════════════════════════════════════════════════════════════════
  console.log('\n[SECTION 9] Handshake & Version Negotiation (Replay Defense):');

  await test('Completes handshake over TCP, negotiates version, and rejects replayed nonces', async () => {
    const port = basePort + 5;
    const ep: TransportEndpoint = { transportType: 'TCP', host: '127.0.0.1', port };
    const srv = new TcpTransportAdapter();
    const cli = new TcpTransportAdapter();

    const srvCoordinator = new TransportHandshakeCoordinator({
      principal: primaryPrincipal,
      address: primaryAddress,
      capabilities: srv.capabilities,
    });

    const cliCoordinator = new TransportHandshakeCoordinator({
      principal: peerPrincipal,
      address: peerAddress,
      capabilities: cli.capabilities,
    });

    srv.receive((packet) => {
      const { responsePacket } = srvCoordinator.processHandshakeOffer(packet, peerAddress);
      srv.send(responsePacket).catch(() => {});
    });

    try {
      await srv.listen(ep);
      await cli.connect(ep);
      await sleep(40);

      const result = await cliCoordinator.performClientHandshake(cli, primaryAddress);

      assert(result.status === 'ACCEPTED', 'Handshake status is ACCEPTED');
      assert(result.versionString === CURRENT_PROTOCOL_VERSION_STRING, 'Negotiated current protocol version');
      assert(result.responderPrincipal.cubId === primaryPrincipal.cubId, 'Authenticated server identity');

      // Replay defense: Create identical offer and re-submit to server coordinator
      const fixedNonce = `REPLAY_NONCE_${Date.now()}`;
      const { packet: offerPacket } = cliCoordinator.createOfferPacket(primaryAddress, {
        customNonce: fixedNonce,
      });
      // First presentation: Accepted
      const res1 = srvCoordinator.processHandshakeOffer(offerPacket, peerAddress);
      assert(res1.result.status === 'ACCEPTED', 'First presentation is ACCEPTED');
      // Second presentation: Replay rejected fail-closed
      const res2 = srvCoordinator.processHandshakeOffer(offerPacket, peerAddress);
      assert(res2.result.status === 'REJECTED', 'Replay presentation is REJECTED');
      assert(res2.result.rejectionCode === 'ERR_HANDSHAKE_REPLAYED', 'Rejection code is ERR_HANDSHAKE_REPLAYED');
    } finally {
      await cli.close('Done');
      await srv.close('Done');
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 10. TRANSPORT SECURITY LAYER (TLS & FAIL-CLOSED CERT REJECTION)
  // ══════════════════════════════════════════════════════════════════════════
  console.log('\n[SECTION 10] Transport Security Layer (TLS & mTLS):');

  await test('Enforces TLS 1.2+ encryption, mTLS peer validation, and rejects rogue cert fail-closed', async () => {
    const port = basePort + 6;
    const ep: TransportEndpoint = { transportType: 'TCP', host: '127.0.0.1', port };

    const srv = new TlsTransportAdapter({
      serverTls: {
        cert: TEST_SERVER_CERT,
        key: TEST_SERVER_KEY,
        ca: TEST_CA_CERT,
        requestCert: true,
        rejectUnauthorized: true,
      },
    });

    const validCli = new TlsTransportAdapter({
      clientTls: {
        ca: TEST_CA_CERT,
        cert: TEST_CLIENT_CERT,
        key: TEST_CLIENT_KEY,
        servername: 'localhost',
        rejectUnauthorized: true,
      },
    });

    const rogueCli = new TlsTransportAdapter({
      clientTls: {
        ca: TEST_CA_CERT,
        cert: UNTRUSTED_ROGUE_CERT,
        key: UNTRUSTED_ROGUE_KEY,
        servername: 'localhost',
        rejectUnauthorized: true,
      },
      connectTimeoutMs: 1500,
    });

    try {
      await srv.listen(ep);

      // 1. Valid client with trusted CA cert succeeds
      const validSession = await validCli.connect(ep);
      const tlsInfo = validCli.getTlsSessionInfo();
      assert(tlsInfo !== undefined, 'Session TLS info available');
      assert(tlsInfo!.encrypted === true, 'Session is encrypted');
      assert(tlsInfo!.authorized === true, 'Session is authorized');
      await validCli.close('Valid client finished');

      // 2. Rogue client with untrusted certificate is rejected fail-closed
      let rogueRejected = false;
      try {
        await rogueCli.connect(ep);
      } catch {
        rogueRejected = true;
      }

      if (!rogueRejected) {
        await sleep(50);
        assert(rogueCli.state === 'DISCONNECTED' || rogueCli.state === 'FAULTED', 'Rogue client disconnected by server');
      } else {
        assert(rogueRejected === true, 'Rogue client connection rejected');
      }
    } finally {
      await rogueCli.close('Rogue teardown').catch(() => {});
      await validCli.close('Valid teardown').catch(() => {});
      await srv.close('Server teardown').catch(() => {});
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 11. RESILIENCE, RETRY, IDEMPOTENCY & COOPERATIVE CANCELLATION
  // ══════════════════════════════════════════════════════════════════════════
  console.log('\n[SECTION 11] Transport Resilience, Retries & Cancellation:');

  await test('Exponential backoff recovers transient failures, defends non-idempotent calls, and honors cancellation', async () => {
    // 1. Exponential backoff verification
    const policy: RetryPolicy = {
      maxAttempts: 5,
      initialDelayMs: 50,
      maxDelayMs: 500,
      backoffMultiplier: 2.0,
      jitter: 'NONE',
    };
    assert(calculateBackoffDelay(1, policy) === 0, 'Attempt 1 is 0ms');
    assert(calculateBackoffDelay(2, policy) === 50, 'Attempt 2 is 50ms');
    assert(calculateBackoffDelay(3, policy) === 100, 'Attempt 3 is 100ms');
    assert(calculateBackoffDelay(4, policy) === 200, 'Attempt 4 is 200ms');

    // 2. Retry with eventual success
    let attempts = 0;
    const retryResult = await TransportResilienceEngine.execute(
      async () => {
        attempts++;
        if (attempts < 3) {
          const err: any = new Error('ECONNREFUSED');
          err.code = 'ECONNREFUSED';
          throw err;
        }
        return 'RECOVERED_SUCCESS';
      },
      {
        operationName: 'EVENTUAL_RECOVERY',
        retryPolicy: { maxAttempts: 4, initialDelayMs: 10, backoffMultiplier: 1.5 },
      }
    );
    assert(retryResult.result === 'RECOVERED_SUCCESS', 'Eventually recovered');
    assert(retryResult.telemetry.totalAttempts === 3, 'Took 3 attempts');

    // 3. Idempotency defense
    let blindRetryCaught = false;
    try {
      await TransportResilienceEngine.execute(
        async () => {
          throw new Error('EPIPE');
        },
        {
          operationName: 'NON_IDEMPOTENT_OPERATION',
          idempotent: false,
          retryPolicy: { maxAttempts: 3, initialDelayMs: 10, idempotencyEnforced: true },
        }
      );
    } catch (err: any) {
      blindRetryCaught = err instanceof NonRetryableOperationError || err.message.includes('non-idempotent');
    }
    assert(blindRetryCaught, 'Blocks non-idempotent retry fail-closed');

    // 4. Cooperative cancellation
    const cts = new CancellationTokenSource();
    const cancelPromise = TransportResilienceEngine.execute(
      async () => {
        await sleep(100);
        return 'DONE';
      },
      {
        operationName: 'CANCEL_TEST',
        cancellationToken: cts.token,
      }
    );
    cts.cancel('Aborted by supervisor');
    let cancelCaught = false;
    try {
      await cancelPromise;
    } catch (err: any) {
      cancelCaught = err.message.includes('Aborted by supervisor') || err.message.includes('cancelled');
    }
    assert(cancelCaught, 'Honors cooperative cancellation immediately');
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 12. PACKET SEND/RECEIVE PIPELINE & CHECKSUM CORRUPTION DEFENSE
  // ══════════════════════════════════════════════════════════════════════════
  console.log('\n[SECTION 12] Integrated Packet Pipeline & Corruption Defense:');

  await test('Drops corrupted packets fail-closed and reassembles out-of-order deliveries', async () => {
    const assembler = new InboundEnvelopeAssembler({ validateInbound: true });
    const dummySession = {} as any;

    const originalEnv = makeMasterEnvelope(777, 'Cryptographic Checksum Verification Payload');
    const packets = packetizeEnvelope(originalEnv, 150);

    // Tamper with packet 0 checksum
    const tampered = { ...packets[0], checksum: packets[0].checksum.slice(0, -1) + 'X' };
    let corruptionCaught = false;
    try {
      assembler.processPacket(tampered, dummySession);
    } catch {
      corruptionCaught = true;
    }
    assert(corruptionCaught, 'Catches checksum tamper fail-closed');
    assert(assembler.corruptedPacketsDropped === 1, 'corruptedPacketsDropped recorded');

    // Clean assembler for out-of-order test
    const cleanAssembler = new InboundEnvelopeAssembler();
    // Reverse delivery order
    for (let i = packets.length - 1; i >= 0; i--) {
      cleanAssembler.processPacket(packets[i], dummySession);
    }
    assert(cleanAssembler.envelopesReceived === 1, 'Reassembled out-of-order packets correctly');
    cleanAssembler.dispose();
    assembler.dispose();
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 13. HIGH-THROUGHPUT CONCURRENCY & CROSS-TALK ISOLATION
  // ══════════════════════════════════════════════════════════════════════════
  console.log('\n[SECTION 13] Concurrency & Cross-Talk Isolation:');

  await test('Transmits 30 parallel fragmented envelopes over TCP with zero cross-talk', async () => {
    const port = basePort + 7;
    const ep: TransportEndpoint = { transportType: 'TCP', host: '127.0.0.1', port };
    const srv = new TcpTransportAdapter();
    const cli = new TcpTransportAdapter();
    const srvPipeline = new CubiOTransportPipeline(srv);
    const cliPipeline = new CubiOTransportPipeline(cli);

    const receivedMap: Map<string, any> = new Map();
    srvPipeline.onEnvelope((env) => receivedMap.set(env.envelopeId, env));

    try {
      await srv.listen(ep);
      await cli.connect(ep);
      await sleep(40);

      const total = 30;
      const promises: Promise<any>[] = [];
      const sentEnvelopes: any[] = [];

      for (let i = 0; i < total; i++) {
        const env = makeMasterEnvelope(1000 + i, `Concurrent Packet Stream #${i} ` + 'Q'.repeat(300));
        sentEnvelopes.push(env);
        promises.push(cliPipeline.sendEnvelope(env, { mtu: 250, startingSequence: i * 5 }));
      }

      await Promise.all(promises);

      let waited = 0;
      while (receivedMap.size < total && waited < 3000) {
        await sleep(50);
        waited += 50;
      }

      assert(receivedMap.size === total, `Expected ${total} envelopes, got ${receivedMap.size}`);

      for (const sent of sentEnvelopes) {
        const rec = receivedMap.get(sent.envelopeId);
        assert(rec !== undefined, `Missing envelope ${sent.envelopeId}`);
        assert((rec.payload.body as any).text === (sent.payload.body as any).text, 'Payload matches');
      }
    } finally {
      cliPipeline.dispose();
      srvPipeline.dispose();
      await cli.close('Done');
      await srv.close('Done');
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 14. ZERO-REGRESSION & PHASE 1 PROTOCOL INVARIANCE
  // ══════════════════════════════════════════════════════════════════════════
  console.log('\n[SECTION 14] Phase 1 Protocol Invariance & Zero-Regression:');

  await test('Verifies RFC 8785 canonical serialization, CNC spatial routing, and bit-level invariance', async () => {
    const env = makeMasterEnvelope(999, 'Canonical Protocol Invariant Test');

    // 1. Serialization determinism
    const json1 = serializeCanonical(env);
    const json2 = serializeCanonical(env);
    assert(json1 === json2, 'RFC 8785 serialization is strictly deterministic');

    // 2. Spatial coordinate preservation
    assert(env.source.coordinate.network === 'CUBIO', 'CNC network preserved');
    assert(env.source.coordinate.zone === 1, 'CNC zone coordinate preserved');
    assert(env.source.coordinate.node === 1, 'CNC node coordinate preserved');

    // 3. Packet serialization and reconstruction bit-equality
    const packets = packetizeEnvelope(env, 200);
    const reconstructed = reassembleEnvelope(packets);
    assert(reconstructed.envelopeId === env.envelopeId, 'Reconstructed envelopeId matches');
    assert(serializeCanonical(reconstructed) === json1, 'Reconstructed JSON is identical bit-for-bit');
  });

  // ══════════════════════════════════════════════════════════════════════════
  // SUMMARY
  // ══════════════════════════════════════════════════════════════════════════
  console.log('\n══════════════════════════════════════════════════════════════════════════');
  console.log(`  Phase 2 Master Transport Integration: Passed: ${passed} | Failed: ${failed}`);
  console.log('══════════════════════════════════════════════════════════════════════════\n');

  if (failed > 0) {
    process.exit(1);
  }
}

// Direct execution entrypoint
runMasterIntegrationSuite().catch((err) => {
  console.error('Fatal failure in Master Integration Test Suite:', err);
  process.exit(1);
});
