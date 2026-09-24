/**
 * CUBiO AI — Phase 2 / Task 10: Transport Security Layer & TLS Tests
 * ===================================================================
 *
 * Validates the transport security layer for supported connection-oriented transports:
 *   - Real TLS 1.2 / TLS 1.3 encrypted TCP loopback sockets on 127.0.0.1.
 *   - Secure WebSocket (WSS) encrypted transport on 127.0.0.1.
 *   - X.509 certificate chain validation and secure defaults.
 *   - Fail-closed rejection of untrusted/rogue certificates.
 *   - Fail-closed rejection of hostname/SAN mismatches.
 *   - Mutual TLS (mTLS) with client certificate verification (positive & negative).
 *   - Incompatible TLS protocol version rejection.
 *   - End-to-end Phase 1 packet delivery over encrypted links with 100% integrity.
 *   - Clean teardown and port release.
 *
 * Architectural Invariant:
 *   - Decouples transport link encryption from application-level sovereign identity (CUBiO ProtocolPrincipal).
 *
 * Run with:  npx tsx src/cubio/network/transport/transportSecurity.test.ts
 */

import {
  TlsTransportAdapter,
  WebSocketTransportAdapter,
  TransportEndpoint,
  TransportSession,
  SECURE_TLS_DEFAULTS,
  SECURE_CIPHER_SUITES,
  TlsHandshakeFailedError,
} from './index';
import {
  TEST_CA_CERT,
  TEST_SERVER_CERT,
  TEST_SERVER_KEY,
  TEST_CLIENT_CERT,
  TEST_CLIENT_KEY,
  UNTRUSTED_ROGUE_CERT,
  UNTRUSTED_ROGUE_KEY,
} from './tlsTestCertificates';
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

function makeValidPacket(seq: number = 1, payloadText: string = 'Secure TLS Payload'): CubiOPacket {
  return createPacket({
    envelopeId: `ENV_TLS_${seq}`,
    sequenceNumber: seq,
    sourceUri: 'CUBIO://NETWORK/0/01/00001/SECURE_CLIENT',
    destinationUri: 'CUBIO://NETWORK/0/01/00002/SECURE_SERVER',
    payloadData: payloadText,
  });
}

async function runSuite() {
  console.log('\n══════════════════════════════════════════════════════════════════════════');
  console.log('  CUBiO AI — Phase 2 / Task 10: Transport Security Layer (TLS) Tests     ');
  console.log('══════════════════════════════════════════════════════════════════════════\n');

  // ─── 1. Security Defaults & Configuration Invariants ──────────────────────

  console.log('1. Security Defaults & Configuration Invariants:');

  await test('SECURE_TLS_DEFAULTS enforces TLS 1.2+ minimum and strict certificate rejection', () => {
    assert(SECURE_TLS_DEFAULTS.minVersion === 'TLSv1.2', 'Minimum version must be TLSv1.2');
    assert(SECURE_TLS_DEFAULTS.maxVersion === 'TLSv1.3', 'Maximum version must be TLSv1.3');
    assert(SECURE_TLS_DEFAULTS.rejectUnauthorized === true, 'rejectUnauthorized must default to true');
    assert(SECURE_TLS_DEFAULTS.handshakeTimeoutMs === 5000, 'Handshake timeout default is 5000ms');

    // Verify ciphers contain modern AEAD suites
    assert(SECURE_CIPHER_SUITES.includes('TLS_AES_256_GCM_SHA384'), 'Must include TLS 1.3 AES-256-GCM');
    assert(SECURE_CIPHER_SUITES.includes('TLS_CHACHA20_POLY1305_SHA256'), 'Must include ChaCha20-Poly1305');
    assert(SECURE_CIPHER_SUITES.includes('ECDHE-RSA-AES256-GCM-SHA384'), 'Must include ECDHE-RSA-AES256');

    // Verify legacy insecure ciphers are omitted
    for (const cipher of SECURE_CIPHER_SUITES) {
      assert(!cipher.includes('RC4'), `RC4 cipher forbidden: ${cipher}`);
      assert(!cipher.includes('DES'), `DES cipher forbidden: ${cipher}`);
      assert(!cipher.includes('MD5'), `MD5 cipher forbidden: ${cipher}`);
      assert(!cipher.includes('NULL'), `NULL cipher forbidden: ${cipher}`);
    }
  });

  await test('TlsTransportAdapter capability declarations reflect secure TLS properties', () => {
    const adapter = new TlsTransportAdapter();
    assert(adapter.transportType === 'TCP', 'Transport type is TCP');
    assert(adapter.capabilities.connectionOriented === true, 'Connection oriented');
    assert(adapter.capabilities.reliable === true, 'Reliable delivery');
    assert(adapter.capabilities.ordered === true, 'Ordered delivery');
    assert(adapter.capabilities.messageOriented === false, 'Stream-oriented');
    assert(adapter.capabilities.supportsTls === true, 'Native TLS support');
    assert(adapter.state === 'UNINITIALIZED', 'Initial state UNINITIALIZED');
  });

  // ─── 2. Valid TLS Encrypted Connection over Real Loopback ─────────────────

  console.log('\n2. Valid TLS Encrypted Connection over Real Loopback:');

  const basePort = 19443;

  await test('Establishes valid TLS 1.2/1.3 session on localhost with trusted CA and inspects telemetry', async () => {
    const port = basePort;
    const server = new TlsTransportAdapter({
      serverTls: {
        cert: TEST_SERVER_CERT,
        key: TEST_SERVER_KEY,
      },
    });

    const client = new TlsTransportAdapter({
      clientTls: {
        ca: TEST_CA_CERT,
        servername: 'localhost',
        rejectUnauthorized: true,
      },
    });

    const srvEndpoint: TransportEndpoint = { transportType: 'TCP', host: '127.0.0.1', port };

    try {
      await server.listen(srvEndpoint);
      assert(server.state === 'CONNECTED', 'Server state is CONNECTED');

      const session = await client.connect(srvEndpoint);
      assert(session.state === 'CONNECTED', 'Client session is CONNECTED');
      assert(client.state === 'CONNECTED', 'Client adapter is CONNECTED');

      // Wait brief moment for accepted socket context to stabilize
      await sleep(50);

      // Verify TLS session telemetry on client
      const clientTlsInfo = client.getTlsSessionInfo();
      assert(clientTlsInfo !== undefined, 'Client TLS info is available');
      assert(clientTlsInfo!.encrypted === true, 'Session is encrypted');
      assert(clientTlsInfo!.authorized === true, 'Session is authorized');
      assert(
        clientTlsInfo!.protocol === 'TLSv1.3' || clientTlsInfo!.protocol === 'TLSv1.2',
        `Protocol negotiated: ${clientTlsInfo!.protocol}`
      );
      assert(typeof clientTlsInfo!.cipherName === 'string' && clientTlsInfo!.cipherName.length > 0, 'Cipher name present');
      assert(clientTlsInfo!.peerCertificate !== undefined, 'Peer cert inspected');
      assert(
        clientTlsInfo!.peerCertificate!.subject.CN === 'localhost',
        `Subject CN is localhost: ${clientTlsInfo!.peerCertificate!.subject.CN}`
      );
      assert(
        clientTlsInfo!.peerCertificate!.issuer.CN === 'CUBiO Root CA',
        `Issuer CN is CUBiO Root CA: ${clientTlsInfo!.peerCertificate!.issuer.CN}`
      );

      // Verify TLS session telemetry on server
      const serverTlsInfo = server.getTlsSessionInfo();
      assert(serverTlsInfo !== undefined, 'Server TLS info is available');
      assert(serverTlsInfo!.encrypted === true, 'Server session is encrypted');
    } finally {
      await client.close('Test complete');
      await server.close('Test complete');
      assert(client.state === 'DISCONNECTED', 'Client disconnected');
      assert(server.state === 'DISCONNECTED', 'Server disconnected');
    }
  });

  await test('Transmits Phase 1 packets bidirectionally over encrypted TLS with checksum preservation', async () => {
    const port = basePort + 1;
    const server = new TlsTransportAdapter({
      serverTls: { cert: TEST_SERVER_CERT, key: TEST_SERVER_KEY },
    });
    const client = new TlsTransportAdapter({
      clientTls: { ca: TEST_CA_CERT, servername: 'localhost' },
    });

    const srvEndpoint: TransportEndpoint = { transportType: 'TCP', host: '127.0.0.1', port };
    const serverReceived: CubiOPacket[] = [];
    const clientReceived: CubiOPacket[] = [];

    server.receive((pkt: CubiOPacket) => { serverReceived.push(pkt); });
    client.receive((pkt: CubiOPacket) => { clientReceived.push(pkt); });

    try {
      await server.listen(srvEndpoint);
      await client.connect(srvEndpoint);
      await sleep(50);

      // Client -> Server
      const p1 = makeValidPacket(1, 'Encrypted Client-to-Server Payload via TLS');
      const receipt1 = await client.send(p1);
      assert(receipt1.success === true, 'Client send succeeded');
      assert(receipt1.packetId === p1.header.packetId, 'Receipt matches packet ID');

      // Server -> Client
      const p2 = makeValidPacket(2, 'Encrypted Server-to-Client Payload via TLS');
      const receipt2 = await server.send(p2);
      assert(receipt2.success === true, 'Server send succeeded');

      await sleep(100);

      // Assert packet integrity at destination
      assert(serverReceived.length === 1, `Server received 1 packet, got ${serverReceived.length}`);
      assert(serverReceived[0].header.packetId === p1.header.packetId, 'Packet ID preserved');
      assert(serverReceived[0].checksum === p1.checksum, 'Checksum preserved');
      assert(serverReceived[0].payload.data === p1.payload.data, 'Payload data preserved');

      assert(clientReceived.length === 1, `Client received 1 packet, got ${clientReceived.length}`);
      assert(clientReceived[0].header.packetId === p2.header.packetId, 'Server-to-client Packet ID preserved');
      assert(clientReceived[0].checksum === p2.checksum, 'Server-to-client Checksum preserved');
      assert(clientReceived[0].payload.data === p2.payload.data, 'Server-to-client Payload data preserved');
    } finally {
      await client.close('End packet test');
      await server.close('End packet test');
    }
  });

  // ─── 3. Fail-Closed Certificate Verification & Rogue CA Defense ───────────

  console.log('\n3. Fail-Closed Certificate Verification & Rogue CA Defense:');

  await test('Rejects untrusted/rogue server certificate fail-closed when rejectUnauthorized is true', async () => {
    const port = basePort + 2;
    // Server presents cert signed by rogue untrusted CA
    const server = new TlsTransportAdapter({
      serverTls: { cert: UNTRUSTED_ROGUE_CERT, key: UNTRUSTED_ROGUE_KEY },
    });
    // Client trusts only TEST_CA_CERT
    const client = new TlsTransportAdapter({
      clientTls: {
        ca: TEST_CA_CERT,
        servername: 'localhost',
        rejectUnauthorized: true,
      },
      connectTimeoutMs: 3000,
    });

    const srvEndpoint: TransportEndpoint = { transportType: 'TCP', host: '127.0.0.1', port };
    let rejected = false;
    let caughtError: any;

    try {
      await server.listen(srvEndpoint);
      try {
        await client.connect(srvEndpoint);
      } catch (err: any) {
        rejected = true;
        caughtError = err;
      }

      assert(rejected === true, 'Connection must be rejected when certificate is untrusted');
      assert(
        caughtError instanceof TlsHandshakeFailedError || caughtError.message.includes('TLS handshake failed'),
        `Error must be TlsHandshakeFailedError, got: ${caughtError}`
      );
      assert(client.state !== 'CONNECTED', `Client state must not be CONNECTED, was: ${client.state}`);
    } finally {
      await client.close('Cleanup').catch(() => {});
      await server.close('Cleanup').catch(() => {});
    }
  });

  await test('Rejects certificate hostname/SAN mismatch fail-closed', async () => {
    const port = basePort + 3;
    const server = new TlsTransportAdapter({
      serverTls: { cert: TEST_SERVER_CERT, key: TEST_SERVER_KEY },
    });
    // Client requests SNI / hostname that does not match cert's SAN (localhost / 127.0.0.1)
    const client = new TlsTransportAdapter({
      clientTls: {
        ca: TEST_CA_CERT,
        servername: 'malicious.attacker.domain.com',
        rejectUnauthorized: true,
      },
      connectTimeoutMs: 3000,
    });

    const srvEndpoint: TransportEndpoint = { transportType: 'TCP', host: '127.0.0.1', port };
    let rejected = false;
    let caughtError: any;

    try {
      await server.listen(srvEndpoint);
      try {
        await client.connect(srvEndpoint);
      } catch (err: any) {
        rejected = true;
        caughtError = err;
      }

      assert(rejected === true, 'Connection must be rejected when hostname does not match SAN');
      assert(client.state !== 'CONNECTED', `Client state must not be CONNECTED, was: ${client.state}`);
    } finally {
      await client.close('Cleanup').catch(() => {});
      await server.close('Cleanup').catch(() => {});
    }
  });

  // ─── 4. Mutual TLS (mTLS) Peer Authentication ─────────────────────────────

  console.log('\n4. Mutual TLS (mTLS) Peer Authentication:');

  await test('mTLS succeeds when client presents valid certificate signed by trusted CA', async () => {
    const port = basePort + 4;
    // Server requires client certificate (requestCert: true)
    const server = new TlsTransportAdapter({
      serverTls: {
        cert: TEST_SERVER_CERT,
        key: TEST_SERVER_KEY,
        ca: TEST_CA_CERT,
        requestCert: true,
        rejectUnauthorized: true,
      },
    });

    // Client presents valid client certificate
    const client = new TlsTransportAdapter({
      clientTls: {
        ca: TEST_CA_CERT,
        cert: TEST_CLIENT_CERT,
        key: TEST_CLIENT_KEY,
        servername: 'localhost',
        rejectUnauthorized: true,
      },
    });

    const srvEndpoint: TransportEndpoint = { transportType: 'TCP', host: '127.0.0.1', port };

    try {
      await server.listen(srvEndpoint);
      const session = await client.connect(srvEndpoint);
      assert(session.state === 'CONNECTED', 'mTLS client connected');

      await sleep(50);

      // Server can inspect authenticated client certificate
      const srvTlsInfo = server.getTlsSessionInfo();
      assert(srvTlsInfo !== undefined, 'Server TLS session info available');
      assert(srvTlsInfo!.peerCertificate !== undefined, 'Server inspected client peer cert');
      assert(
        srvTlsInfo!.peerCertificate!.subject.CN === 'CUBiO Client Agent',
        `Client CN is CUBiO Client Agent, got: ${srvTlsInfo!.peerCertificate!.subject.CN}`
      );

      // Round-trip packet over mTLS
      const receivedPackets: CubiOPacket[] = [];
      server.receive((p: CubiOPacket) => { receivedPackets.push(p); });

      const pkt = makeValidPacket(10, 'Authenticated mTLS Payload');
      await client.send(pkt);
      await sleep(50);

      assert(receivedPackets.length === 1, 'Server received packet over mTLS');
      assert(receivedPackets[0].header.packetId === pkt.header.packetId, 'Packet ID matches');
    } finally {
      await client.close('Cleanup mTLS');
      await server.close('Cleanup mTLS');
    }
  });

  await test('mTLS rejects client connecting without certificate fail-closed', async () => {
    const port = basePort + 5;
    // Server strictly demands client certificate
    const server = new TlsTransportAdapter({
      serverTls: {
        cert: TEST_SERVER_CERT,
        key: TEST_SERVER_KEY,
        ca: TEST_CA_CERT,
        requestCert: true,
        rejectUnauthorized: true,
      },
    });

    // Client provides CA cert to verify server, but NO client certificate
    const client = new TlsTransportAdapter({
      clientTls: {
        ca: TEST_CA_CERT,
        servername: 'localhost',
        rejectUnauthorized: true,
      },
      connectTimeoutMs: 3000,
    });

    const srvEndpoint: TransportEndpoint = { transportType: 'TCP', host: '127.0.0.1', port };
    let rejected = false;

    try {
      await server.listen(srvEndpoint);
      try {
        await client.connect(srvEndpoint);
      } catch {
        rejected = true;
      }

      if (!rejected) {
        await sleep(50);
        assert(client.state === 'DISCONNECTED' || client.state === 'FAULTED', 'Client must be disconnected by server');
      } else {
        assert(rejected === true, 'Client connection failed as expected');
      }
    } finally {
      await client.close('Cleanup').catch(() => {});
      await server.close('Cleanup').catch(() => {});
    }
  });

  await test('mTLS rejects client presenting rogue/untrusted certificate fail-closed', async () => {
    const port = basePort + 6;
    // Server requires client certificate signed by TEST_CA_CERT
    const server = new TlsTransportAdapter({
      serverTls: {
        cert: TEST_SERVER_CERT,
        key: TEST_SERVER_KEY,
        ca: TEST_CA_CERT,
        requestCert: true,
        rejectUnauthorized: true,
      },
    });

    // Client presents certificate signed by rogue untrusted CA
    const client = new TlsTransportAdapter({
      clientTls: {
        ca: TEST_CA_CERT,
        cert: UNTRUSTED_ROGUE_CERT,
        key: UNTRUSTED_ROGUE_KEY,
        servername: 'localhost',
        rejectUnauthorized: true,
      },
      connectTimeoutMs: 3000,
    });

    const srvEndpoint: TransportEndpoint = { transportType: 'TCP', host: '127.0.0.1', port };
    let rejected = false;

    try {
      await server.listen(srvEndpoint);
      try {
        await client.connect(srvEndpoint);
      } catch {
        rejected = true;
      }

      if (!rejected) {
        await sleep(50);
        assert(client.state === 'DISCONNECTED' || client.state === 'FAULTED', 'Client must be disconnected by server');
      } else {
        assert(rejected === true, 'Rogue client rejected during mTLS handshake');
      }
    } finally {
      await client.close('Cleanup').catch(() => {});
      await server.close('Cleanup').catch(() => {});
    }
  });

  // ─── 5. Secure WebSocket (WSS) Encrypted Transport ─────────────────────────

  console.log('\n5. Secure WebSocket (WSS) Encrypted Transport:');

  await test('Establishes secure WSS connection and transmits Phase 1 packets', async () => {
    const port = basePort + 7;
    const server = new WebSocketTransportAdapter({
      tlsServer: {
        cert: TEST_SERVER_CERT,
        key: TEST_SERVER_KEY,
      },
    });

    const client = new WebSocketTransportAdapter({
      tlsClient: {
        ca: TEST_CA_CERT,
        rejectUnauthorized: true,
      },
    });

    assert(server.capabilities.supportsTls === true, 'Server capabilities reflect supportsTls');
    assert(client.capabilities.supportsTls === true, 'Client capabilities reflect supportsTls');

    const srvEndpoint: TransportEndpoint = {
      transportType: 'WEBSOCKET',
      host: '127.0.0.1',
      port,
      path: '/cubio-wss',
    };

    const serverReceived: CubiOPacket[] = [];
    const clientReceived: CubiOPacket[] = [];

    server.receive((pkt: CubiOPacket) => { serverReceived.push(pkt); });
    client.receive((pkt: CubiOPacket) => { clientReceived.push(pkt); });

    try {
      await server.listen(srvEndpoint);
      const session = await client.connect(srvEndpoint);
      assert(session.state === 'CONNECTED', 'WSS client session connected');

      await sleep(100);

      // Bidirectional send
      const p1 = makeValidPacket(100, 'WSS Encrypted Payload A');
      await client.send(p1);

      const p2 = makeValidPacket(101, 'WSS Encrypted Payload B');
      await server.send(p2);

      await sleep(100);

      assert(serverReceived.length === 1, 'Server received WSS packet');
      assert(serverReceived[0].header.packetId === p1.header.packetId, 'Packet ID preserved over WSS');
      assert(serverReceived[0].payload.data === p1.payload.data, 'Payload preserved over WSS');

      assert(clientReceived.length === 1, 'Client received WSS packet');
      assert(clientReceived[0].header.packetId === p2.header.packetId, 'Server-to-client WSS packet preserved');
      assert(clientReceived[0].payload.data === p2.payload.data, 'Server-to-client WSS payload preserved');
    } finally {
      await client.close('End WSS test');
      await server.close('End WSS test');
    }
  });

  await test('WSS client rejects untrusted server certificate fail-closed', async () => {
    const port = basePort + 8;
    const server = new WebSocketTransportAdapter({
      tlsServer: {
        cert: UNTRUSTED_ROGUE_CERT,
        key: UNTRUSTED_ROGUE_KEY,
      },
    });

    const client = new WebSocketTransportAdapter({
      tlsClient: {
        ca: TEST_CA_CERT,
        rejectUnauthorized: true,
      },
      connectTimeoutMs: 2000,
    });

    const srvEndpoint: TransportEndpoint = {
      transportType: 'WEBSOCKET',
      host: '127.0.0.1',
      port,
      path: '/cubio-wss-fail',
    };

    let rejected = false;

    try {
      await server.listen(srvEndpoint);
      try {
        await client.connect(srvEndpoint);
      } catch {
        rejected = true;
      }

      assert(rejected === true, 'WSS client must reject untrusted server cert fail-closed');
      assert(client.state !== 'CONNECTED', `Client state must not be CONNECTED, was: ${client.state}`);
    } finally {
      await client.close('Cleanup WSS').catch(() => {});
      await server.close('Cleanup WSS').catch(() => {});
    }
  });

  // ─── 6. Protocol Version Mismatch & Clean Teardown ─────────────────────────

  console.log('\n6. Protocol Version Mismatch & Clean Teardown:');

  await test('Rejects incompatible TLS protocol version fail-closed', async () => {
    const port = basePort + 9;
    // Server enforces TLSv1.3 only
    const server = new TlsTransportAdapter({
      serverTls: {
        cert: TEST_SERVER_CERT,
        key: TEST_SERVER_KEY,
        minVersion: 'TLSv1.3',
        maxVersion: 'TLSv1.3',
      },
    });

    // Client restricts to TLSv1.2 only
    const client = new TlsTransportAdapter({
      clientTls: {
        ca: TEST_CA_CERT,
        minVersion: 'TLSv1.2',
        maxVersion: 'TLSv1.2',
        servername: 'localhost',
        rejectUnauthorized: true,
      },
      connectTimeoutMs: 3000,
    });

    const srvEndpoint: TransportEndpoint = { transportType: 'TCP', host: '127.0.0.1', port };
    let rejected = false;

    try {
      await server.listen(srvEndpoint);
      try {
        await client.connect(srvEndpoint);
      } catch {
        rejected = true;
      }

      assert(rejected === true, 'Connection must reject when no mutually supported TLS version exists');
      assert(client.state !== 'CONNECTED', 'Client must not be connected');
    } finally {
      await client.close('Cleanup').catch(() => {});
      await server.close('Cleanup').catch(() => {});
    }
  });

  await test('Clean shutdown releases loopback port immediately allowing reuse', async () => {
    const port = basePort + 10;
    const server1 = new TlsTransportAdapter({
      serverTls: { cert: TEST_SERVER_CERT, key: TEST_SERVER_KEY },
    });
    const srvEndpoint: TransportEndpoint = { transportType: 'TCP', host: '127.0.0.1', port };

    await server1.listen(srvEndpoint);
    assert(server1.state === 'CONNECTED', 'Server 1 is CONNECTED');
    await server1.close('Shutdown 1');
    assert(server1.state === 'DISCONNECTED', 'Server 1 is DISCONNECTED');

    // Bind server 2 immediately to the same port
    const server2 = new TlsTransportAdapter({
      serverTls: { cert: TEST_SERVER_CERT, key: TEST_SERVER_KEY },
    });
    await server2.listen(srvEndpoint);
    assert(server2.state === 'CONNECTED', 'Server 2 bound successfully to same port');
    await server2.close('Shutdown 2');
    assert(server2.state === 'DISCONNECTED', 'Server 2 is DISCONNECTED');
  });

  // ─── Summary ─────────────────────────────────────────────────────────────

  console.log('\n══════════════════════════════════════════════════════════════════════════');
  console.log(`  Phase 2 / Task 10 Transport Security: Passed: ${passed} | Failed: ${failed}`);
  console.log('══════════════════════════════════════════════════════════════════════════\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runSuite().catch((err) => {
  console.error('Fatal error during Task 10 test execution:', err);
  process.exit(1);
});
