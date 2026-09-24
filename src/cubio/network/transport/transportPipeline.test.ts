/**
 * CUBiO AI — Phase 2 / Task 12: Integrated Packet Send/Receive Pipeline Tests
 * ==============================================================================
 *
 * Validates the complete integrated packet send/receive pipeline over real transport drivers:
 *   - Envelope creation ──▶ Packetization ──▶ Outbound Validation ──▶ Framing ──▶ Wire Send
 *   - Wire Receive ──▶ Deframing ──▶ Inbound Packet Validation ──▶ Reassembly ──▶ Reconstructed Envelope
 *   - Bit-for-bit checksum preservation and sequence ordering end-to-end.
 *   - Multi-packet fragmentation & reassembly across real TCP, WebSocket, IPC, and UDP.
 *   - Correlated request-response pipeline transaction.
 *   - Checksum corruption defense and fail-closed rejection.
 *   - Out-of-order and duplicate fragment defense.
 *   - Assembly buffer timeout eviction (zero memory leak on truncated streams).
 *   - High-throughput concurrent multi-envelope multiplexing without cross-contamination.
 *
 * Run with:  npx tsx src/cubio/network/transport/transportPipeline.test.ts
 */

import {
  TcpTransportAdapter,
  WebSocketTransportAdapter,
  IpcPipeTransportAdapter,
  UdpTransportAdapter,
  TransportEndpoint,
  CubiOTransportPipeline,
  InboundEnvelopeAssembler,
  PipelineCorruptionError,
} from './index';
import { createEnvelope } from '../protocol/v1/protocolEngine';
import { ProtocolEnvelope, ProtocolAddress, ProtocolPrincipal, ProtocolPayload } from '../protocol/v1/types';
import { createPacket, packetizeEnvelope } from '../protocol/v1/packetEngine';
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

// ─── Shared Protocol Fixtures ───────────────────────────────────────────────

const clientAddress: ProtocolAddress = Object.freeze({
  coordinate: { network: 'CUBIO' as const, dimension: 0, zone: 1, node: 1, service: 'CLIENT' },
  uri: 'CUBIO://NETWORK/0/01/00001/CLIENT',
});

const serverAddress: ProtocolAddress = Object.freeze({
  coordinate: { network: 'CUBIO' as const, dimension: 0, zone: 1, node: 2, service: 'SERVER' },
  uri: 'CUBIO://NETWORK/0/01/00002/SERVER',
});

const clientPrincipal: ProtocolPrincipal = Object.freeze({
  cubId: 'CUB-00000001',
  entityType: 'AGENT',
  signature: '0xSIG_CLIENT_PIPELINE',
});

const serverPrincipal: ProtocolPrincipal = Object.freeze({
  cubId: 'CUB-00000002',
  entityType: 'NODE',
  signature: '0xSIG_SERVER_PIPELINE',
});

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

function makeEnvelope(seq: number = 1, payloadText: string = 'Pipeline Payload Data'): ProtocolEnvelope {
  return createEnvelope({
    kind: 'REQUEST',
    source: clientAddress,
    destination: serverAddress,
    sender: clientPrincipal,
    payload: makePayload({ seq, text: payloadText, timestamp: Date.now() }, { pipelineTest: 'true', sequence: String(seq) }),
    nonce: `nonce_${seq}_${Math.random().toString(36).slice(2, 8)}`,
  });
}

async function runSuite() {
  console.log('\n══════════════════════════════════════════════════════════════════════════');
  console.log('  CUBiO AI — Phase 2 / Task 12: Integrated Packet Pipeline Tests          ');
  console.log('══════════════════════════════════════════════════════════════════════════\n');

  const basePort = 22000;

  // ─── 1. End-to-End Single Packet Pipeline over Real TCP ───────────────────

  console.log('1. End-to-End Single Packet Pipeline over Real TCP:');

  await test('Transmits and reconstructs single-packet envelope over real TCP with 100% fidelity', async () => {
    const port = basePort;
    const endpoint: TransportEndpoint = { transportType: 'TCP', host: '127.0.0.1', port };

    const serverAdapter = new TcpTransportAdapter();
    const clientAdapter = new TcpTransportAdapter();

    const serverPipeline = new CubiOTransportPipeline(serverAdapter);
    const clientPipeline = new CubiOTransportPipeline(clientAdapter);

    const receivedEnvelopes: ProtocolEnvelope[] = [];
    serverPipeline.onEnvelope((env) => {
      receivedEnvelopes.push(env);
    });

    try {
      await serverAdapter.listen(endpoint);
      await clientAdapter.connect(endpoint);
      await sleep(40);

      const originalEnv = makeEnvelope(100, 'Single Packet Pipeline Test');
      const report = await clientPipeline.sendEnvelope(originalEnv);

      assert(report.totalPackets === 1, `Expected 1 packet, got ${report.totalPackets}`);
      assert(report.envelopeId === originalEnv.envelopeId, 'Report envelopeId matches');
      assert(report.checksums.length === 1, 'Report contains 1 checksum');

      await sleep(80);

      assert(receivedEnvelopes.length === 1, `Server received 1 envelope, got ${receivedEnvelopes.length}`);
      const reconstructed = receivedEnvelopes[0];

      // Verify 100% bit-for-bit fidelity
      assert(reconstructed.envelopeId === originalEnv.envelopeId, 'Envelope ID matches');
      assert(reconstructed.kind === originalEnv.kind, 'Kind matches');
      assert(reconstructed.source.uri === originalEnv.source.uri, 'Source URI matches');
      assert(reconstructed.destination.uri === originalEnv.destination.uri, 'Destination URI matches');
      assert(reconstructed.sender.cubId === originalEnv.sender.cubId, 'Sender cubId matches');
      assert((reconstructed.payload.body as any).text === 'Single Packet Pipeline Test', 'Payload text preserved');
      assert(reconstructed.payload.metadata?.['pipelineTest'] === 'true', 'Metadata preserved');

      // Verify pipeline metrics
      const clientMetrics = clientPipeline.getMetrics();
      assert(clientMetrics.envelopesSent === 1, 'Client envelopesSent === 1');
      assert(clientMetrics.packetsSent === 1, 'Client packetsSent === 1');

      const serverMetrics = serverPipeline.getMetrics();
      assert(serverMetrics.envelopesReceived === 1, 'Server envelopesReceived === 1');
      assert(serverMetrics.packetsReceived === 1, 'Server packetsReceived === 1');
    } finally {
      clientPipeline.dispose();
      serverPipeline.dispose();
      await clientAdapter.close('End test');
      await serverAdapter.close('End test');
    }
  });

  // ─── 2. Multi-Packet Fragmentation & Reassembly over Real TCP ─────────────

  console.log('\n2. Multi-Packet Fragmentation & Reassembly over Real TCP:');

  await test('Fragments oversized envelope into 20+ packets and reconstructs cleanly over TCP', async () => {
    const port = basePort + 1;
    const endpoint: TransportEndpoint = { transportType: 'TCP', host: '127.0.0.1', port };

    const serverAdapter = new TcpTransportAdapter();
    const clientAdapter = new TcpTransportAdapter();

    const serverPipeline = new CubiOTransportPipeline(serverAdapter);
    const clientPipeline = new CubiOTransportPipeline(clientAdapter);

    const receivedEnvelopes: ProtocolEnvelope[] = [];
    serverPipeline.onEnvelope((env) => {
      receivedEnvelopes.push(env);
    });

    try {
      await serverAdapter.listen(endpoint);
      await clientAdapter.connect(endpoint);
      await sleep(40);

      // Construct a large payload (8 KB of structured text)
      const largeText = 'A'.repeat(8_192);
      const originalEnv = makeEnvelope(200, largeText);

      // Force tiny MTU of 400 bytes to generate ~22 fragments
      const report = await clientPipeline.sendEnvelope(originalEnv, { mtu: 400 });

      assert(report.totalPackets >= 20, `Expected >= 20 fragments, got ${report.totalPackets}`);
      assert(report.receipts.length === report.totalPackets, 'Receipts count matches packets');

      await sleep(150);

      assert(receivedEnvelopes.length === 1, `Server received 1 envelope, got ${receivedEnvelopes.length}`);
      const reconstructed = receivedEnvelopes[0];

      assert(reconstructed.envelopeId === originalEnv.envelopeId, 'Envelope ID matches');
      assert((reconstructed.payload.body as any).text.length === 8_192, 'Full 8KB payload preserved');
      assert((reconstructed.payload.body as any).text === largeText, 'Reconstructed text is bit-for-bit identical');

      const serverMetrics = serverPipeline.getMetrics();
      assert(serverMetrics.envelopesReceived === 1, 'Server envelopesReceived is 1');
      assert(serverMetrics.fragmentsAssembled === report.totalPackets, 'All fragments assembled');
    } finally {
      clientPipeline.dispose();
      serverPipeline.dispose();
      await clientAdapter.close('End fragmentation test');
      await serverAdapter.close('End fragmentation test');
    }
  });

  // ─── 3. Multi-Packet Pipeline over Real WebSocket ─────────────────────────

  console.log('\n3. Multi-Packet Pipeline over Real WebSocket:');

  await test('Fragments and reconstructs multi-packet envelope over real WebSocket transport', async () => {
    const port = basePort + 2;
    const endpoint: TransportEndpoint = {
      transportType: 'WEBSOCKET',
      host: '127.0.0.1',
      port,
      path: '/pipeline-ws',
    };

    const serverAdapter = new WebSocketTransportAdapter();
    const clientAdapter = new WebSocketTransportAdapter();

    const serverPipeline = new CubiOTransportPipeline(serverAdapter);
    const clientPipeline = new CubiOTransportPipeline(clientAdapter);

    const receivedEnvelopes: ProtocolEnvelope[] = [];
    serverPipeline.onEnvelope((env) => {
      receivedEnvelopes.push(env);
    });

    try {
      await serverAdapter.listen(endpoint);
      await clientAdapter.connect(endpoint);
      await sleep(50);

      const largeText = 'WS_DATA_CHUNK_'.repeat(250); // ~3.5 KB
      const originalEnv = makeEnvelope(300, largeText);

      // MTU 350 bytes -> ~12 fragments
      const report = await clientPipeline.sendEnvelope(originalEnv, { mtu: 350 });
      assert(report.totalPackets >= 10, `Expected >= 10 fragments over WS, got ${report.totalPackets}`);

      await sleep(150);

      assert(receivedEnvelopes.length === 1, `Server received 1 envelope, got ${receivedEnvelopes.length}`);
      const reconstructed = receivedEnvelopes[0];
      assert(reconstructed.envelopeId === originalEnv.envelopeId, 'Envelope ID matches over WS');
      assert((reconstructed.payload.body as any).text === largeText, 'WebSocket payload reconstructed perfectly');
    } finally {
      clientPipeline.dispose();
      serverPipeline.dispose();
      await clientAdapter.close('End WS test');
      await serverAdapter.close('End WS test');
    }
  });

  // ─── 4. Multi-Packet Pipeline over Real Windows Named Pipe (IPC) ──────────

  console.log('\n4. Multi-Packet Pipeline over Real Windows Named Pipe (IPC):');

  await test('Fragments and reconstructs multi-packet envelope over real Windows Named Pipe', async () => {
    const pipeName = `cubio_pipe_pipe_${Date.now()}`;
    const endpoint: TransportEndpoint = {
      transportType: 'IPC_PIPE',
      host: 'localhost',
      port: 0,
      path: pipeName,
    };

    const serverAdapter = new IpcPipeTransportAdapter();
    const clientAdapter = new IpcPipeTransportAdapter();

    const serverPipeline = new CubiOTransportPipeline(serverAdapter);
    const clientPipeline = new CubiOTransportPipeline(clientAdapter);

    const receivedEnvelopes: ProtocolEnvelope[] = [];
    serverPipeline.onEnvelope((env) => {
      receivedEnvelopes.push(env);
    });

    try {
      await serverAdapter.listen(endpoint);
      await clientAdapter.connect(endpoint);
      await sleep(50);

      const largeText = 'IPC_PIPE_FRAGMENT_'.repeat(200); // ~3.6 KB
      const originalEnv = makeEnvelope(400, largeText);

      const report = await clientPipeline.sendEnvelope(originalEnv, { mtu: 400 });
      assert(report.totalPackets >= 8, `Expected >= 8 fragments over IPC, got ${report.totalPackets}`);

      await sleep(150);

      assert(receivedEnvelopes.length === 1, `Server received 1 envelope, got ${receivedEnvelopes.length}`);
      const reconstructed = receivedEnvelopes[0];
      assert(reconstructed.envelopeId === originalEnv.envelopeId, 'Envelope ID matches over IPC');
      assert((reconstructed.payload.body as any).text === largeText, 'IPC payload reconstructed perfectly');
    } finally {
      clientPipeline.dispose();
      serverPipeline.dispose();
      await clientAdapter.close('End IPC test');
      await serverAdapter.close('End IPC test');
    }
  });

  // ─── 5. Multi-Packet Pipeline over Real UDP Driver ────────────────────────

  console.log('\n5. Multi-Packet Pipeline over Real UDP Driver:');

  await test('Transmits and reconstructs envelope over real loopback UDP sockets', async () => {
    const srvPort = basePort + 5;
    const cliPort = basePort + 6;

    const srvEndpoint: TransportEndpoint = { transportType: 'UDP', host: '127.0.0.1', port: srvPort };
    const cliEndpoint: TransportEndpoint = { transportType: 'UDP', host: '127.0.0.1', port: cliPort };

    const serverAdapter = new UdpTransportAdapter();
    const clientAdapter = new UdpTransportAdapter();

    const serverPipeline = new CubiOTransportPipeline(serverAdapter);
    const clientPipeline = new CubiOTransportPipeline(clientAdapter);

    const receivedEnvelopes: ProtocolEnvelope[] = [];
    serverPipeline.onEnvelope((env) => {
      receivedEnvelopes.push(env);
    });

    try {
      await serverAdapter.listen(srvEndpoint);
      await clientAdapter.connect(srvEndpoint);
      await sleep(30);

      const originalEnv = makeEnvelope(500, 'UDP Transport Pipeline Message');
      const report = await clientPipeline.sendEnvelope(originalEnv);

      assert(report.totalPackets === 1, 'UDP single packet envelope sent');

      await sleep(60);

      assert(receivedEnvelopes.length === 1, `Server received 1 envelope over UDP, got ${receivedEnvelopes.length}`);
      assert(receivedEnvelopes[0].envelopeId === originalEnv.envelopeId, 'UDP envelopeId preserved');
      assert((receivedEnvelopes[0].payload.body as any).text === 'UDP Transport Pipeline Message', 'UDP payload preserved');
    } finally {
      clientPipeline.dispose();
      serverPipeline.dispose();
      await clientAdapter.close('End UDP test');
      await serverAdapter.close('End UDP test');
    }
  });

  // ─── 6. Correlated Request/Response over Real TCP ─────────────────────────

  console.log('\n6. Correlated Request/Response over Real TCP:');

  await test('Executes correlated request/response round-trip across real TCP stream', async () => {
    const port = basePort + 7;
    const endpoint: TransportEndpoint = { transportType: 'TCP', host: '127.0.0.1', port };

    const serverAdapter = new TcpTransportAdapter();
    const clientAdapter = new TcpTransportAdapter();

    const serverPipeline = new CubiOTransportPipeline(serverAdapter);
    const clientPipeline = new CubiOTransportPipeline(clientAdapter);

    // Server echoes back response envelope
    serverPipeline.onEnvelope(async (reqEnv) => {
      const respEnv = createEnvelope({
        kind: 'RESPONSE',
        source: serverAddress,
        destination: clientAddress,
        sender: serverPrincipal,
        payload: makePayload({ responseTo: reqEnv.envelopeId, data: 'OK_SUCCESS' }),
        correlationId: reqEnv.envelopeId,
      });
      await serverPipeline.sendEnvelope(respEnv);
    });

    try {
      await serverAdapter.listen(endpoint);
      await clientAdapter.connect(endpoint);
      await sleep(40);

      const reqEnv = makeEnvelope(600, 'Client Requesting Response');
      const respEnv = await clientPipeline.requestEnvelope(
        reqEnv,
        (incoming) => incoming.correlationId === reqEnv.envelopeId,
        { timeoutMs: 2000 }
      );

      assert(respEnv !== undefined, 'Received correlated response');
      assert(respEnv.correlationId === reqEnv.envelopeId, 'Correlation ID matches request envelopeId');
      assert((respEnv.payload.body as any).data === 'OK_SUCCESS', 'Response payload verified');
    } finally {
      clientPipeline.dispose();
      serverPipeline.dispose();
      await clientAdapter.close('End request/response test');
      await serverAdapter.close('End request/response test');
    }
  });

  // ─── 7. Cryptographic Checksum Corruption Defense ─────────────────────────

  console.log('\n7. Cryptographic Checksum Corruption Defense:');

  await test('Rejects corrupted checksum fail-closed and drops packet from pipeline', async () => {
    const assembler = new InboundEnvelopeAssembler({ validateInbound: true });
    const dummySession = {} as any;

    const validPkt = createPacket({
      envelopeId: 'ENV_TEST_CORRUPT',
      sequenceNumber: 1,
      sourceUri: clientAddress.uri,
      destinationUri: serverAddress.uri,
      payloadData: 'Original Untampered Data',
    });

    // Tamper with checksum by flipping the trailing character
    const tamperedPkt: CubiOPacket = {
      ...validPkt,
      checksum: validPkt.checksum.slice(0, -1) + (validPkt.checksum.endsWith('0') ? '1' : '0'),
    };

    let caughtErr: any;
    try {
      assembler.processPacket(tamperedPkt, dummySession);
    } catch (err) {
      caughtErr = err;
    }

    assert(caughtErr instanceof PipelineCorruptionError, `Expected PipelineCorruptionError, got: ${caughtErr}`);
    assert(assembler.corruptedPacketsDropped === 1, 'corruptedPacketsDropped incremented to 1');
    assert(assembler.envelopesReceived === 0, 'No corrupted envelopes received');

    assembler.dispose();
  });

  // ─── 8. Out-of-Order & Duplicate Fragment Defense ──────────────────────────

  console.log('\n8. Out-of-Order & Duplicate Fragment Defense:');

  await test('Ignores duplicate fragments and reassembles out-of-order deliveries safely', async () => {
    const assembler = new InboundEnvelopeAssembler();
    const dummySession = {} as any;

    const originalEnv = makeEnvelope(800, 'X'.repeat(600));
    // Packetize into multiple fragments
    const packets = packetizeEnvelope(originalEnv, 250);
    const totalFrags = packets.length;
    assert(totalFrags >= 2, `Expected >= 2 fragments, got ${totalFrags}`);

    // Deliver Fragment 1 first, then Fragment 0, then Duplicate Fragment 0, then remaining fragments
    const res1 = assembler.processPacket(packets[1], dummySession);
    assert(res1 === null, 'Fragment 1 alone does not complete assembly');

    const res2 = assembler.processPacket(packets[0], dummySession);
    // If totalFrags > 2, res2 is null; if totalFrags === 2, res2 is complete
    if (totalFrags > 2) {
      assert(res2 === null, 'Fragments 0 and 1 do not complete assembly');
    }

    // Deliver duplicate fragment 0
    const resDup = assembler.processPacket(packets[0], dummySession);
    assert(resDup === null, 'Duplicate fragment returns null');
    assert(assembler.duplicateFragmentsIgnored === 1, 'duplicateFragmentsIgnored incremented to 1');

    // Deliver remaining fragments
    let lastResult = res2;
    for (let i = 2; i < totalFrags; i++) {
      lastResult = assembler.processPacket(packets[i], dummySession);
    }
    assert(lastResult !== null, 'All fragments complete assembly');
    assert(lastResult!.envelope.envelopeId === originalEnv.envelopeId, 'Reconstructed envelopeId matches');
    assert((lastResult!.envelope.payload.body as any).text === 'X'.repeat(600), 'Reconstructed payload matches');
    assert(assembler.fragmentsAssembled === totalFrags, `fragmentsAssembled === ${totalFrags}`);

    assembler.dispose();
  });

  // ─── 9. Assembly Sequence Expiration Timeout ──────────────────────────────

  console.log('\n9. Assembly Sequence Expiration Timeout:');

  await test('Purges incomplete assembly sequences after retention timeout with zero leaks', async () => {
    const assembler = new InboundEnvelopeAssembler({ assemblyTimeoutMs: 50 });
    const dummySession = {} as any;

    const originalEnv = makeEnvelope(900, 'Y'.repeat(600));
    const packets = packetizeEnvelope(originalEnv, 250);

    // Deliver only fragment 0 (out of 3)
    assembler.processPacket(packets[0], dummySession);
    assert(assembler.pendingCount === 1, 'Assembler has 1 pending sequence');

    // Wait for timeout
    await sleep(70);

    const purged = assembler.purgeExpired();
    assert(purged === 1, `Purged 1 incomplete sequence, got ${purged}`);
    assert(assembler.pendingCount === 0, 'Pending assemblies map is now empty');
    assert(assembler.assemblyTimeouts === 1, 'assemblyTimeouts incremented to 1');

    assembler.dispose();
  });

  // ─── 10. High-Throughput Concurrent Multi-Envelope Stream ─────────────────

  console.log('\n10. High-Throughput Concurrent Multi-Envelope Stream:');

  await test('Transmits 40 concurrent multi-fragment envelopes over real TCP with zero cross-talk', async () => {
    const port = basePort + 8;
    const endpoint: TransportEndpoint = { transportType: 'TCP', host: '127.0.0.1', port };

    const serverAdapter = new TcpTransportAdapter();
    const clientAdapter = new TcpTransportAdapter();

    const serverPipeline = new CubiOTransportPipeline(serverAdapter);
    const clientPipeline = new CubiOTransportPipeline(clientAdapter);

    const totalEnvelopes = 40;
    const receivedMap: Map<string, ProtocolEnvelope> = new Map();

    serverPipeline.onEnvelope((env) => {
      receivedMap.set(env.envelopeId, env);
    });

    try {
      await serverAdapter.listen(endpoint);
      await clientAdapter.connect(endpoint);
      await sleep(50);

      const sendPromises: Promise<any>[] = [];
      const originalEnvelopes: ProtocolEnvelope[] = [];

      for (let i = 0; i < totalEnvelopes; i++) {
        const env = makeEnvelope(1000 + i, `Concurrent Payload Data #${i} - ` + 'Z'.repeat(400));
        originalEnvelopes.push(env);
        // MTU 250 -> generates 2-3 fragments per envelope
        sendPromises.push(clientPipeline.sendEnvelope(env, { mtu: 250, startingSequence: i * 10 }));
      }

      await Promise.all(sendPromises);

      // Allow pipeline reassembly to finalize across TCP stream
      let waited = 0;
      while (receivedMap.size < totalEnvelopes && waited < 3000) {
        await sleep(50);
        waited += 50;
      }

      assert(
        receivedMap.size === totalEnvelopes,
        `Expected ${totalEnvelopes} envelopes, received ${receivedMap.size}`
      );

      // Verify each reconstructed envelope against its original
      for (const orig of originalEnvelopes) {
        const rec = receivedMap.get(orig.envelopeId);
        assert(rec !== undefined, `Missing envelope ${orig.envelopeId}`);
        assert(rec!.envelopeId === orig.envelopeId, 'ID matches');
        assert((rec!.payload.body as any).seq === (orig.payload.body as any).seq, 'Sequence number matches');
        assert((rec!.payload.body as any).text === (orig.payload.body as any).text, 'Payload matches exactly');
      }

      const serverMetrics = serverPipeline.getMetrics();
      assert(serverMetrics.envelopesReceived === totalEnvelopes, 'Server recorded all envelopes');
    } finally {
      clientPipeline.dispose();
      serverPipeline.dispose();
      await clientAdapter.close('End concurrency test');
      await serverAdapter.close('End concurrency test');
    }
  });

  // ─── Summary ─────────────────────────────────────────────────────────────

  console.log('\n══════════════════════════════════════════════════════════════════════════');
  console.log(`  Phase 2 / Task 12 Packet Pipeline: Passed: ${passed} | Failed: ${failed}`);
  console.log('══════════════════════════════════════════════════════════════════════════\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runSuite().catch((err) => {
  console.error('Fatal error during Task 12 test execution:', err);
  process.exit(1);
});
