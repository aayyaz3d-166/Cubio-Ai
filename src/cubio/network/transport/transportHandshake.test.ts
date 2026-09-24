/**
 * CUBiO AI — Phase 2 / Task 09: Transport Handshake & Version Negotiation Tests
 * ===============================================================================
 *
 * Validates the real CUBiO transport handshake and protocol-version negotiation:
 *   - Uses certified Phase 1 version manager and ProtocolEnvelope models.
 *   - Exchanges identity, version, capabilities, and compatibility over real OS sockets.
 *   - Verifies compatible negotiation across TCP, WebSocket, IPC, and UDP.
 *   - Proves fail-closed rejection for incompatible major versions and deprecated versions.
 *   - Proves fail-closed rejection for corrupted and malformed handshake packets.
 *   - Validates anti-replay defense (reused nonces and clock-skewed timestamps).
 *   - Validates timeout defense and clean resource cleanup on unfulfilled handshakes.
 *
 * Run with:  npx tsx src/cubio/network/transport/transportHandshake.test.ts
 */

import {
  TransportHandshakeCoordinator,
  TransportHandshakeOffer,
  TransportHandshakeResult,
  HandshakeRejectedError,
  HandshakeTimeoutError,
  TcpTransportAdapter,
  WebSocketTransportAdapter,
  IpcPipeTransportAdapter,
  UdpTransportAdapter,
} from './index';
import { ProtocolPrincipal, ProtocolAddress } from '../protocol/v1/types';
import {
  CURRENT_PROTOCOL_VERSION,
  CURRENT_PROTOCOL_VERSION_STRING,
  CanonicalProtocolVersion,
} from '../protocol/v1/versionTypes';
import { ProtocolVersionManager } from '../protocol/v1/versionManager';
import { createPacket } from '../protocol/v1/packetEngine';
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

// ─── Test Identities & Addresses ─────────────────────────────────────────────

const clientPrincipal: ProtocolPrincipal = Object.freeze({
  cubId: 'CUB-00000001',
  entityType: 'AGENT',
  signature: '0xSIG_CLIENT',
});

const clientAddress: ProtocolAddress = Object.freeze({
  coordinate: { network: 'CUBIO' as const, dimension: 0, zone: 1, node: 1, service: 'CLIENT' },
  uri: 'CUBIO://NETWORK/0/01/00001/CLIENT',
});

const serverPrincipal: ProtocolPrincipal = Object.freeze({
  cubId: 'CUB-00000002',
  entityType: 'NODE',
  signature: '0xSIG_SERVER',
});

const serverAddress: ProtocolAddress = Object.freeze({
  coordinate: { network: 'CUBIO' as const, dimension: 0, zone: 1, node: 2, service: 'SERVER' },
  uri: 'CUBIO://NETWORK/0/01/00002/SERVER',
});

async function runSuite() {
  console.log('\n══════════════════════════════════════════════════════════════════════════');
  console.log('  CUBiO AI — Phase 2 / Task 09: Transport Handshake & Negotiation Tests    ');
  console.log('══════════════════════════════════════════════════════════════════════════\n');

  // ─── 1. Compatible Handshake over Real TCP Socket ─────────────────────────

  console.log('1. Compatible Handshake over Real Operating System Sockets:');

  await test('Compatible handshake negotiation over real loopback TCP', async () => {
    const serverAdapter = new TcpTransportAdapter();
    const clientAdapter = new TcpTransportAdapter();

    await serverAdapter.listen({ transportType: 'TCP', host: '127.0.0.1', port: 0 });
    const serverPort = serverAdapter.localEndpoint!.port;

    const serverCoordinator = new TransportHandshakeCoordinator({
      principal: serverPrincipal,
      address: serverAddress,
      capabilities: serverAdapter.capabilities,
    });

    const clientCoordinator = new TransportHandshakeCoordinator({
      principal: clientPrincipal,
      address: clientAddress,
      capabilities: clientAdapter.capabilities,
    });

    // Server automatically responds to handshake offers
    serverAdapter.receive((packet) => {
      const { responsePacket } = serverCoordinator.processHandshakeOffer(packet, clientAddress);
      serverAdapter.send(responsePacket).catch(() => {});
    });

    await clientAdapter.connect({ transportType: 'TCP', host: '127.0.0.1', port: serverPort });

    const result = await clientCoordinator.performClientHandshake(clientAdapter, serverAddress);

    assert(result.status === 'ACCEPTED', 'Handshake status is ACCEPTED');
    assert(result.versionString === CURRENT_PROTOCOL_VERSION_STRING, 'Negotiated CNP/1.0.0');
    assert(result.responderPrincipal.cubId === serverPrincipal.cubId, 'Authenticated server identity');
    assert(result.negotiatedMaxPayloadBytes! <= 65536, 'Agreed mutual payload limit');
    assert(result.agreedCapabilities!.includes('BASE_FRAMING'), 'Agreed on BASE_FRAMING');

    await clientAdapter.close();
    await serverAdapter.close();
  });

  await test('Compatible handshake negotiation over real WebSocket', async () => {
    const serverAdapter = new WebSocketTransportAdapter();
    const clientAdapter = new WebSocketTransportAdapter();

    await serverAdapter.listen({ transportType: 'WEBSOCKET', host: '127.0.0.1', port: 0 });
    const serverPort = serverAdapter.localEndpoint!.port;

    const serverCoordinator = new TransportHandshakeCoordinator({
      principal: serverPrincipal,
      address: serverAddress,
      capabilities: serverAdapter.capabilities,
    });

    const clientCoordinator = new TransportHandshakeCoordinator({
      principal: clientPrincipal,
      address: clientAddress,
      capabilities: clientAdapter.capabilities,
    });

    serverAdapter.receive((packet) => {
      const { responsePacket } = serverCoordinator.processHandshakeOffer(packet, clientAddress);
      serverAdapter.send(responsePacket).catch(() => {});
    });

    await clientAdapter.connect({ transportType: 'WEBSOCKET', host: '127.0.0.1', port: serverPort });

    const result = await clientCoordinator.performClientHandshake(clientAdapter, serverAddress);

    assert(result.status === 'ACCEPTED', 'WS Handshake status is ACCEPTED');
    assert(result.versionString === 'CNP/1.0.0', 'WS negotiated CNP/1.0.0');

    await clientAdapter.close();
    await serverAdapter.close();
  });

  await test('Compatible handshake negotiation over real Windows Named Pipe', async () => {
    const pipeName = `cubio-hs-pipe-${Date.now()}`;
    const serverAdapter = new IpcPipeTransportAdapter();
    const clientAdapter = new IpcPipeTransportAdapter();

    await serverAdapter.listen({ transportType: 'IPC_PIPE', host: 'localhost', port: 0, path: pipeName });

    const serverCoordinator = new TransportHandshakeCoordinator({
      principal: serverPrincipal,
      address: serverAddress,
      capabilities: serverAdapter.capabilities,
    });

    const clientCoordinator = new TransportHandshakeCoordinator({
      principal: clientPrincipal,
      address: clientAddress,
      capabilities: clientAdapter.capabilities,
    });

    serverAdapter.receive((packet) => {
      const { responsePacket } = serverCoordinator.processHandshakeOffer(packet, clientAddress);
      serverAdapter.send(responsePacket).catch(() => {});
    });

    await clientAdapter.connect({
      transportType: 'IPC_PIPE',
      host: 'localhost',
      port: 0,
      path: serverAdapter.localEndpoint!.path,
    });

    const result = await clientCoordinator.performClientHandshake(clientAdapter, serverAddress);

    assert(result.status === 'ACCEPTED', 'IPC Handshake status is ACCEPTED');
    assert(result.versionString === 'CNP/1.0.0', 'IPC negotiated CNP/1.0.0');

    await clientAdapter.close();
    await serverAdapter.close();
  });

  await test('Compatible handshake negotiation over real UDP', async () => {
    const serverAdapter = new UdpTransportAdapter();
    const clientAdapter = new UdpTransportAdapter();

    await serverAdapter.listen({ transportType: 'UDP', host: '127.0.0.1', port: 0 });
    const serverPort = serverAdapter.localEndpoint!.port;

    const serverCoordinator = new TransportHandshakeCoordinator({
      principal: serverPrincipal,
      address: serverAddress,
      capabilities: serverAdapter.capabilities,
    });

    const clientCoordinator = new TransportHandshakeCoordinator({
      principal: clientPrincipal,
      address: clientAddress,
      capabilities: clientAdapter.capabilities,
    });

    await clientAdapter.connect({ transportType: 'UDP', host: '127.0.0.1', port: serverPort });
    const clientPort = clientAdapter.localEndpoint!.port;

    serverAdapter.receive((packet) => {
      const { responsePacket } = serverCoordinator.processHandshakeOffer(packet, clientAddress);
      // UDP responder sends back to client port
      serverAdapter.send(responsePacket, {
        destinationEndpoint: { transportType: 'UDP', host: '127.0.0.1', port: clientPort },
      }).catch(() => {});
    });

    const result = await clientCoordinator.performClientHandshake(clientAdapter, serverAddress);

    assert(result.status === 'ACCEPTED', 'UDP Handshake status is ACCEPTED');
    assert(result.versionString === 'CNP/1.0.0', 'UDP negotiated CNP/1.0.0');

    await clientAdapter.close();
    await serverAdapter.close();
  });

  // ─── 2. Incompatible Version Scenarios (Fail-Closed) ──────────────────────

  console.log('\n2. Incompatible Version Scenarios (Fail-Closed):');

  await test('Rejects incompatible major version offer fail-closed', async () => {
    const serverAdapter = new TcpTransportAdapter();
    const clientAdapter = new TcpTransportAdapter();

    await serverAdapter.listen({ transportType: 'TCP', host: '127.0.0.1', port: 0 });
    const serverPort = serverAdapter.localEndpoint!.port;

    const serverCoordinator = new TransportHandshakeCoordinator({
      principal: serverPrincipal,
      address: serverAddress,
      capabilities: serverAdapter.capabilities,
    });

    const clientCoordinator = new TransportHandshakeCoordinator({
      principal: clientPrincipal,
      address: clientAddress,
      capabilities: clientAdapter.capabilities,
    });

    serverAdapter.receive((packet) => {
      const { responsePacket } = serverCoordinator.processHandshakeOffer(packet, clientAddress);
      serverAdapter.send(responsePacket).catch(() => {});
    });

    await clientAdapter.connect({ transportType: 'TCP', host: '127.0.0.1', port: serverPort });

    // Client offers incompatible major version CNP/2.0.0
    const incompatibleMajor: CanonicalProtocolVersion = { major: 2, minor: 0, patch: 0 };

    let thrownError: any;
    try {
      await clientCoordinator.performClientHandshake(clientAdapter, serverAddress, {
        offeredVersions: [incompatibleMajor],
      });
    } catch (err: any) {
      thrownError = err;
    }

    assert(thrownError instanceof HandshakeRejectedError, 'Throws HandshakeRejectedError');
    assert(
      thrownError.rejectionCode === 'ERR_VERSION_INCOMPATIBLE' || thrownError.rejectionCode === 'ERR_NO_COMPATIBLE_VERSION',
      `Rejection code matches version incompatibility: ${thrownError.rejectionCode}`
    );

    await clientAdapter.close();
    await serverAdapter.close();
  });

  await test('Rejects deprecated / out-of-bounds protocol version', () => {
    const dummyAdapter = new TcpTransportAdapter();
    const serverCoordinator = new TransportHandshakeCoordinator({
      principal: serverPrincipal,
      address: serverAddress,
      capabilities: dummyAdapter.capabilities,
      versionManager: new ProtocolVersionManager({
        supportedRange: {
          min: { major: 1, minor: 0, patch: 0 },
          max: { major: 1, minor: 5, patch: 0 },
        },
      }),
    });

    const clientCoordinator = new TransportHandshakeCoordinator({
      principal: clientPrincipal,
      address: clientAddress,
      capabilities: dummyAdapter.capabilities,
    });

    // Client offers version 0.8.0 (below min 1.0.0)
    const deprecatedVersion: CanonicalProtocolVersion = { major: 0, minor: 8, patch: 0 };
    const { packet } = clientCoordinator.createOfferPacket(serverAddress, {
      offeredVersions: [deprecatedVersion],
    });

    const { result } = serverCoordinator.processHandshakeOffer(packet, clientAddress);

    assert(result.status === 'REJECTED', 'Status is REJECTED');
    assert(
      result.rejectionCode === 'ERR_VERSION_DEPRECATED' || result.rejectionCode === 'ERR_VERSION_INCOMPATIBLE',
      'Rejection code is ERR_VERSION_DEPRECATED or INCOMPATIBLE'
    );
  });

  // ─── 3. Malformed & Corrupted Handshake Defense ────────────────────────────

  console.log('\n3. Malformed & Corrupted Handshake Defense:');

  await test('Rejects malformed handshake envelope with missing required fields', () => {
    const dummyAdapter = new TcpTransportAdapter();
    const serverCoordinator = new TransportHandshakeCoordinator({
      principal: serverPrincipal,
      address: serverAddress,
      capabilities: dummyAdapter.capabilities,
    });

    // Create packet with invalid/empty payload data
    const malformedPacket = createPacket({
      envelopeId: 'ENV_MALFORMED_HS',
      sequenceNumber: 1,
      sourceUri: clientAddress.uri,
      destinationUri: serverAddress.uri,
      payloadData: 'NOT_VALID_ENVELOPE_JSON',
    });

    const { result } = serverCoordinator.processHandshakeOffer(malformedPacket, clientAddress);

    assert(result.status === 'REJECTED', 'Server rejects malformed handshake');
    assert(result.rejectionCode === 'ERR_MALFORMED_HANDSHAKE', 'Rejection code is ERR_MALFORMED_HANDSHAKE');
  });

  // ─── 4. Replay Attack Defense & Clock Skew Detection ──────────────────────

  console.log('\n4. Replay Attack Defense & Clock Skew Detection:');

  await test('Rejects duplicate / replayed handshake offer with identical nonce', () => {
    const dummyAdapter = new TcpTransportAdapter();
    const serverCoordinator = new TransportHandshakeCoordinator({
      principal: serverPrincipal,
      address: serverAddress,
      capabilities: dummyAdapter.capabilities,
    });

    const clientCoordinator = new TransportHandshakeCoordinator({
      principal: clientPrincipal,
      address: clientAddress,
      capabilities: dummyAdapter.capabilities,
    });

    const fixedNonce = 'REPLAY_NONCE_ABC_123';
    const { packet } = clientCoordinator.createOfferPacket(serverAddress, {
      customNonce: fixedNonce,
    });

    // First presentation: Accepted
    const res1 = serverCoordinator.processHandshakeOffer(packet, clientAddress);
    assert(res1.result.status === 'ACCEPTED', 'First presentation is ACCEPTED');

    // Second presentation (Replay attack): Rejected fail-closed
    const res2 = serverCoordinator.processHandshakeOffer(packet, clientAddress);
    assert(res2.result.status === 'REJECTED', 'Second presentation is REJECTED');
    assert(res2.result.rejectionCode === 'ERR_HANDSHAKE_REPLAYED', 'Rejection code is ERR_HANDSHAKE_REPLAYED');
  });

  await test('Rejects handshake offer with expired / skewed timestamp', () => {
    const dummyAdapter = new TcpTransportAdapter();
    const serverCoordinator = new TransportHandshakeCoordinator({
      principal: serverPrincipal,
      address: serverAddress,
      capabilities: dummyAdapter.capabilities,
      options: { maxClockSkewMs: 10_000 },
    });

    const clientCoordinator = new TransportHandshakeCoordinator({
      principal: clientPrincipal,
      address: clientAddress,
      capabilities: dummyAdapter.capabilities,
    });

    // Timestamp 60 seconds in the past (> 10s skew limit)
    const expiredTimestamp = Date.now() - 60_000;
    const { packet } = clientCoordinator.createOfferPacket(serverAddress, {
      customTimestamp: expiredTimestamp,
    });

    const { result } = serverCoordinator.processHandshakeOffer(packet, clientAddress);

    assert(result.status === 'REJECTED', 'Expired offer is REJECTED');
    assert(result.rejectionCode === 'ERR_HANDSHAKE_REPLAYED', 'Rejection code flags replay/expiry');
  });

  // ─── 5. Timeout Handling & Clean Abort ─────────────────────────────────────

  console.log('\n5. Timeout Handling & Clean Abort:');

  await test('Client handshake times out and aborts cleanly when server does not respond', async () => {
    const serverAdapter = new TcpTransportAdapter();
    const clientAdapter = new TcpTransportAdapter();

    await serverAdapter.listen({ transportType: 'TCP', host: '127.0.0.1', port: 0 });
    const serverPort = serverAdapter.localEndpoint!.port;

    // Server deliberately drops incoming handshake packets (silent)
    serverAdapter.receive(() => {
      // Do not respond
    });

    const clientCoordinator = new TransportHandshakeCoordinator({
      principal: clientPrincipal,
      address: clientAddress,
      capabilities: clientAdapter.capabilities,
    });

    await clientAdapter.connect({ transportType: 'TCP', host: '127.0.0.1', port: serverPort });

    let caughtError: any;
    try {
      // Set short 100ms timeout budget
      await clientCoordinator.performClientHandshake(clientAdapter, serverAddress, {
        timeoutMs: 100,
      });
    } catch (err: any) {
      caughtError = err;
    }

    assert(caughtError instanceof HandshakeTimeoutError, 'Throws HandshakeTimeoutError');
    assert(caughtError.timeoutMs === 100, 'Records timeoutMs: 100');

    await clientAdapter.close();
    await serverAdapter.close();
  });

  // ─── Summary ──────────────────────────────────────────────────────────────

  console.log('\n══════════════════════════════════════════════════════════════════════════');
  console.log(`  Phase 2 / Task 09 Test Results: ${passed} PASSED, ${failed} FAILED`);
  console.log('══════════════════════════════════════════════════════════════════════════\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runSuite().catch((err) => {
  console.error('Fatal error running Task 09 test suite:', err);
  process.exit(1);
});
