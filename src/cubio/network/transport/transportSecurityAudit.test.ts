/**
 * CUBiO AI — Phase 2 / Task 17: Forensic Transport Security Audit Suite
 * =====================================================================
 *
 * Implements strict, executable forensic security validation across all
 * Phase 2 transport components:
 *   - Sockets & lifecycle management
 *   - TLS/mTLS cryptographic configuration & certificate verification
 *   - Handshake negotiation, version bounds & replay defense
 *   - Framing & stream deframing bounds checking
 *   - Integrity validation & payload tampering defense
 *   - Timeouts, retries & resource cleanup
 *   - Input handling, oversized payloads & prototype pollution defense
 *
 * Run with:  npx tsx src/cubio/network/transport/transportSecurityAudit.test.ts
 */

import * as net from 'node:net';
import * as dgram from 'node:dgram';
import {
  TcpTransportAdapter,
  WebSocketTransportAdapter,
  UdpTransportAdapter,
  IpcPipeTransportAdapter,
  TlsTransportAdapter,
  TransportEndpoint,
  TransportSession,
  TRANSPORT_FRAME_CONSTANTS,
} from './index';
import {
  TransportFrameCodec,
  StreamFrameDecoder,
  TransportFramingError,
} from './transportFramingAdapter';
import { TransportHandshakeCoordinator } from './transportHandshake';
import { ConnectionLifecycleManager } from './connectionLifecycleManager';
import { TransportResilienceEngine } from './transportRetryEngine';
import {
  TransportRetryExhaustedError,
  NonRetryableOperationError,
} from './transportRetryTypes';
import {
  TEST_CA_CERT,
  TEST_SERVER_CERT,
  TEST_SERVER_KEY,
  TEST_CLIENT_CERT,
  TEST_CLIENT_KEY,
  UNTRUSTED_ROGUE_CERT,
  UNTRUSTED_ROGUE_KEY,
} from './tlsTestCertificates';
import {
  SECURE_TLS_DEFAULTS,
  TlsHandshakeFailedError,
} from './transportSecurityTypes';
import { createEnvelope } from '../protocol/v1/protocolEngine';
import { createPacket, packetizeEnvelope, reassembleEnvelope } from '../protocol/v1/packetEngine';
import {
  serializeCanonicalPacket,
  deserializeCanonicalPacket,
} from '../protocol/v1/canonicalSerializer';
import { CubiOProtocolValidator } from '../protocol/v1/protocolValidator';
import { ProtocolAddress, ProtocolPrincipal } from '../protocol/v1/types';
import { CURRENT_PROTOCOL_VERSION } from '../protocol/v1/versionTypes';
import { CubiOTransportPipeline } from './transportPipeline';
import { PROTOCOL_LIMITS } from '../protocol/v1/constants';

let passed = 0;
let failed = 0;

async function test(name: string, fn: () => Promise<void> | void) {
  try {
    await fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err: any) {
    failed++;
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.stack ?? err.message}`);
  }
}

function assert(condition: boolean, msg?: string) {
  if (!condition) throw new Error(msg ?? 'Assertion failed');
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const clientAddress: ProtocolAddress = Object.freeze({
  coordinate: { network: 'CUBIO', dimension: 0, zone: 1, node: 10, service: 'SEC_AUDIT_CLI' },
  uri: 'CUBIO://NETWORK/0/01/00010/SEC_AUDIT_CLI',
});

const serverAddress: ProtocolAddress = Object.freeze({
  coordinate: { network: 'CUBIO', dimension: 0, zone: 1, node: 20, service: 'SEC_AUDIT_SRV' },
  uri: 'CUBIO://NETWORK/0/01/00020/SEC_AUDIT_SRV',
});

const clientPrincipal: ProtocolPrincipal = Object.freeze({
  cubId: 'CUB-SEC-000010',
  entityType: 'AGENT',
  signature: '0xSIG_SEC_CLI_2026',
});

const serverPrincipal: ProtocolPrincipal = Object.freeze({
  cubId: 'CUB-SEC-000020',
  entityType: 'NODE',
  signature: '0xSIG_SEC_SRV_2026',
});

async function runSecurityAudit() {
  console.log('╔══════════════════════════════════════════════════════════════════════════╗');
  console.log('║       CUBiO AI — Phase 2 / Task 17: Forensic Security Audit Suite        ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════╝\n');

  const basePort = 12900;

  // ═════════════════════════════════════════════════════════════════════════
  // SECTION 1: Framing, Parsing & Wire Abuse Defenses
  // ═════════════════════════════════════════════════════════════════════════
  console.log('--- SECTION 1: Framing, Parsing & Wire Abuse Defenses ---');

  await test('1.1 Malformed wire frame magic token injection fails closed', () => {
    const validPacket = createPacket({
      envelopeId: 'ENV_SEC_01',
      sourceUri: clientAddress.uri,
      destinationUri: serverAddress.uri,
      payloadData: 'SEC_TEST_PAYLOAD',
      sequenceNumber: 1,
    });
    const validBuffer = TransportFrameCodec.encode(validPacket);

    // Corrupt the 6-byte magic token from 'CUBTR1' to 'BADMAG'
    const corruptBuffer = Buffer.from(validBuffer);
    corruptBuffer.write('BADMAG', 4, 6, 'ascii');

    let discreteFailed = false;
    try {
      TransportFrameCodec.decodeDiscrete(corruptBuffer);
    } catch (err: any) {
      discreteFailed = true;
      assert(err instanceof TransportFramingError, 'Throws TransportFramingError');
      assert(err.code === 'ERR_FRAME_MAGIC_MISMATCH', 'Error code is ERR_FRAME_MAGIC_MISMATCH');
    }
    assert(discreteFailed, 'decodeDiscrete rejected corrupt magic');

    // Test streaming accumulator behavior: must reset and throw fail-closed
    const streamDecoder = new StreamFrameDecoder();
    let streamFailed = false;
    try {
      streamDecoder.push(corruptBuffer);
    } catch (err: any) {
      streamFailed = true;
      assert(err.code === 'ERR_FRAME_MAGIC_MISMATCH', 'Stream error code is ERR_FRAME_MAGIC_MISMATCH');
      assert(streamDecoder.pendingBytes === 0, 'Stream accumulator flushed on corrupt magic');
    }
    assert(streamFailed, 'StreamFrameDecoder rejected corrupt magic and flushed buffer');
  });

  await test('1.2 Truncated wire frame header (< 10 bytes) fails closed', () => {
    const truncatedHeader = Buffer.from([0x00, 0x00, 0x00, 0x05, 0x43, 0x55]); // 6 bytes instead of 10

    let caught = false;
    try {
      TransportFrameCodec.decodeDiscrete(truncatedHeader);
    } catch (err: any) {
      caught = true;
      assert(err.code === 'ERR_FRAME_TRUNCATED', 'Error code is ERR_FRAME_TRUNCATED');
    }
    assert(caught, 'Truncated header rejected');
  });

  await test('1.3 Declared payload length boundary mismatch fails closed', () => {
    const validPacket = createPacket({
      envelopeId: 'ENV_SEC_03',
      sourceUri: clientAddress.uri,
      destinationUri: serverAddress.uri,
      payloadData: 'BOUNDARY_TEST',
      sequenceNumber: 1,
    });
    const frame = TransportFrameCodec.encode(validPacket);

    // Tamper with declared length: claim 500 bytes when actual payload is much smaller
    const tampered = Buffer.from(frame);
    tampered.writeUInt32BE(500, 0);

    let caught = false;
    try {
      TransportFrameCodec.decodeDiscrete(tampered);
    } catch (err: any) {
      caught = true;
      assert(err.code === 'ERR_FRAME_BOUNDARY_MISMATCH', 'Error code is ERR_FRAME_BOUNDARY_MISMATCH');
    }
    assert(caught, 'Declared length mismatch rejected');
  });

  await test('1.4 Oversized payload length header claim (> MAX_PACKET_BYTES) flushes buffer fail-closed', () => {
    const fakeHeader = Buffer.alloc(10);
    // Claim 10MB payload (well over MAX_PACKET_BYTES 1MB limit)
    fakeHeader.writeUInt32BE(10 * 1024 * 1024, 0);
    fakeHeader.write(TRANSPORT_FRAME_CONSTANTS.MAGIC, 4, 6, 'ascii');

    const streamDecoder = new StreamFrameDecoder();
    let caught = false;
    try {
      streamDecoder.push(fakeHeader);
    } catch (err: any) {
      caught = true;
      assert(err.code === 'ERR_FRAME_OVERSIZED', 'Error code is ERR_FRAME_OVERSIZED');
      assert(streamDecoder.pendingBytes === 0, 'Buffer fully flushed to prevent DoS memory buildup');
    }
    assert(caught, 'Oversized payload length rejected fail-closed');
  });

  await test('1.5 Prototype pollution payload injection is neutralized and does not pollute Object.prototype', () => {
    const pollutionJson = JSON.stringify({
      header: {
        packetId: 'PKT-POLLUTE-001',
        version: { major: 1, minor: 0, patch: 0 },
        sourceUri: clientAddress.uri,
        destinationUri: serverAddress.uri,
        sequenceNumber: 1,
        totalPackets: 1,
        flags: ['CANONICAL'],
      },
      payload: {
        type: 'JSON',
        byteLength: 60,
        data: '{"__proto__":{"polluted":true},"constructor":{"prototype":{"admin":true}}}',
      },
      envelopeId: 'ENV_POLLUTION_TEST',
      checksum: '0x00000000_TAMPERED',
    });

    let caught = false;
    try {
      deserializeCanonicalPacket(pollutionJson);
    } catch (err: any) {
      caught = true; // Expected: checksum will not match
    }
    assert(caught, 'Tampered packet rejected by validator');

    // Assert global prototype was NEVER modified
    assert((Object.prototype as any).polluted === undefined, 'Object.prototype.polluted is undefined');
    assert((Object.prototype as any).admin === undefined, 'Object.prototype.admin is undefined');
  });

  // ═════════════════════════════════════════════════════════════════════════
  // SECTION 2: Integrity Validation & Tampering Defenses
  // ═════════════════════════════════════════════════════════════════════════
  console.log('\n--- SECTION 2: Integrity Validation & Tampering Defenses ---');

  await test('2.1 Tampered payload body with stale checksum is trapped fail-closed', () => {
    const validPacket = createPacket({
      envelopeId: 'ENV_SEC_04',
      sourceUri: clientAddress.uri,
      destinationUri: serverAddress.uri,
      payloadData: 'GENUINE_CRITICAL_TRANSACTION',
      sequenceNumber: 1,
    });

    // Directly tamper payload data while preserving original checksum
    const tamperedPacket = {
      ...validPacket,
      payload: {
        ...validPacket.payload,
        data: 'TAMPERED_FORGED_TRANSACTION',
      },
    };

    const valResult = CubiOProtocolValidator.validatePacket(tamperedPacket as any);
    assert(!valResult.isValid, 'Validation result is invalid');
    assert(
      valResult.errors.some((e) => e.code === 'ERR_PAYLOAD_HASH_MISMATCH'),
      'Trapped by ERR_PAYLOAD_HASH_MISMATCH'
    );

    // Also test direct checksum tampering
    const tamperedChecksumPacket = { ...validPacket, checksum: '0xCHK_BAD_FORGED' };
    const valResult2 = CubiOProtocolValidator.validatePacket(tamperedChecksumPacket as any);
    assert(!valResult2.isValid, 'Checksum tampering invalid');
    assert(
      valResult2.errors.some((e) => e.code === 'ERR_CHECKSUM_MISMATCH'),
      'Trapped by ERR_CHECKSUM_MISMATCH'
    );
  });

  await test('2.2 Corrupted sequence number (negative or non-integer) is rejected', () => {
    const validPkt = createPacket({
      envelopeId: 'ENV_SEC_05',
      sourceUri: clientAddress.uri,
      destinationUri: serverAddress.uri,
      payloadData: 'SEQ_TEST',
      sequenceNumber: 1,
    });
    const badSeqPacket = {
      ...validPkt,
      header: {
        ...validPkt.header,
        sequenceNumber: -5, // Illegal negative sequence number
      },
    };

    const valResult = CubiOProtocolValidator.validatePacket(badSeqPacket as any);
    assert(!valResult.isValid, 'Negative sequence rejected');
    assert(
      valResult.errors.some((e) => e.code === 'ERR_SEQUENCE_OUT_OF_RANGE'),
      'Trapped by ERR_SEQUENCE_OUT_OF_RANGE'
    );
  });

  await test('2.3 Deserialized packets are immutable and Object.freeze protected', () => {
    const validPacket = createPacket({
      envelopeId: 'ENV_SEC_06',
      sourceUri: clientAddress.uri,
      destinationUri: serverAddress.uri,
      payloadData: 'IMMUTABLE_TEST',
      sequenceNumber: 1,
    });
    const serialized = serializeCanonicalPacket(validPacket);
    const deserialized = deserializeCanonicalPacket(serialized);

    assert(Object.isFrozen(deserialized), 'Deserialized packet is frozen');
    assert(Object.isFrozen(deserialized.header), 'Header is frozen');
    assert(Object.isFrozen(deserialized.payload), 'Payload is frozen');
  });

  // ═════════════════════════════════════════════════════════════════════════
  // SECTION 3: Handshake Protocol Abuse, Versioning & Replay Defenses
  // ═════════════════════════════════════════════════════════════════════════
  console.log('\n--- SECTION 3: Handshake Protocol Abuse, Versioning & Replay Defenses ---');

  await test('3.1 Handshake replay attack with duplicate nonce is rejected fail-closed', () => {
    const coordinator = new TransportHandshakeCoordinator({
      principal: serverPrincipal,
      address: serverAddress,
      capabilities: {
        connectionOriented: true,
        reliable: true,
        ordered: true,
        messageOriented: false,
        supportsBroadcast: false,
        supportsTls: true,
        maxPayloadBytes: 65536,
        defaultMtu: 1400,
      },
    });

    const clientCoord = new TransportHandshakeCoordinator({
      principal: clientPrincipal,
      address: clientAddress,
      capabilities: coordinator.capabilities,
    });

    const { packet: offerPacket } = clientCoord.createOfferPacket(serverAddress);

    // First arrival: valid
    const firstResult = coordinator.processHandshakeOffer(offerPacket);
    assert(firstResult.result.status === 'ACCEPTED', 'First handshake offer accepted');

    // Replay arrival: identical packet and nonce
    const replayResult = coordinator.processHandshakeOffer(offerPacket);
    assert(replayResult.result.status === 'REJECTED', 'Replay attempt rejected');
    assert(replayResult.result.rejectionCode === 'ERR_HANDSHAKE_REPLAYED', 'Rejection code is ERR_HANDSHAKE_REPLAYED');
  });

  await test('3.2 Handshake timestamp skewed beyond maxClockSkewMs is rejected', () => {
    const coordinator = new TransportHandshakeCoordinator({
      principal: serverPrincipal,
      address: serverAddress,
      capabilities: {
        connectionOriented: true,
        reliable: true,
        ordered: true,
        messageOriented: false,
        supportsBroadcast: false,
        supportsTls: true,
        maxPayloadBytes: 65536,
        defaultMtu: 1400,
      },
      options: { maxClockSkewMs: 10_000 },
    });

    const clientCoord = new TransportHandshakeCoordinator({
      principal: clientPrincipal,
      address: clientAddress,
      capabilities: coordinator.capabilities,
    });

    // Forge timestamp 50 seconds in the past
    const expiredTimestamp = Date.now() - 50_000;
    const { packet: expiredOfferPacket } = clientCoord.createOfferPacket(serverAddress, {
      customTimestamp: expiredTimestamp,
    });

    const result = coordinator.processHandshakeOffer(expiredOfferPacket);
    assert(result.result.status === 'REJECTED', 'Expired handshake offer rejected');
    assert(result.result.rejectionCode === 'ERR_HANDSHAKE_REPLAYED', 'Rejection code indicates timestamp skew');
  });

  await test('3.3 Incompatible major protocol version offer fails closed with ERR_NO_COMPATIBLE_VERSION', () => {
    const coordinator = new TransportHandshakeCoordinator({
      principal: serverPrincipal,
      address: serverAddress,
      capabilities: {
        connectionOriented: true,
        reliable: true,
        ordered: true,
        messageOriented: false,
        supportsBroadcast: false,
        supportsTls: true,
        maxPayloadBytes: 65536,
        defaultMtu: 1400,
      },
    });

    const clientCoord = new TransportHandshakeCoordinator({
      principal: clientPrincipal,
      address: clientAddress,
      capabilities: coordinator.capabilities,
    });

    // Offer incompatible v2.0.0 protocol version to a v1.0.0 server
    const incompatibleVersion = Object.freeze({ major: 2, minor: 0, patch: 0 });
    const { packet: offerPacket } = clientCoord.createOfferPacket(serverAddress, {
      offeredVersions: [incompatibleVersion],
      preferredVersion: incompatibleVersion,
    });

    const result = coordinator.processHandshakeOffer(offerPacket);
    assert(result.result.status === 'REJECTED', 'Incompatible version rejected');
    assert(
      result.result.rejectionCode === 'ERR_VERSION_INCOMPATIBLE' ||
        result.result.rejectionCode === 'ERR_VERSION_TOO_NEW' ||
        result.result.rejectionCode === 'ERR_NO_COMPATIBLE_VERSION',
      'Code indicates version incompatibility'
    );
  });

  // ═════════════════════════════════════════════════════════════════════════
  // SECTION 4: TLS / mTLS Security Invariants & Certificate Rejection
  // ═════════════════════════════════════════════════════════════════════════
  console.log('\n--- SECTION 4: TLS / mTLS Security Invariants & Certificate Rejection ---');

  await test('4.1 SECURE_TLS_DEFAULTS enforces minimum TLS 1.2 and AEAD cipher suites', () => {
    assert(SECURE_TLS_DEFAULTS.minVersion === 'TLSv1.2', 'Minimum version is TLS 1.2');
    assert(SECURE_TLS_DEFAULTS.rejectUnauthorized === true, 'rejectUnauthorized is true');
    assert(SECURE_TLS_DEFAULTS.ciphers.includes('TLS_AES_256_GCM_SHA384'), 'Modern TLS 1.3 AES-256-GCM included');
    assert(SECURE_TLS_DEFAULTS.ciphers.includes('ECDHE-RSA-AES256-GCM-SHA384'), 'PFS ECDHE cipher suite included');
    assert(!SECURE_TLS_DEFAULTS.ciphers.includes('RC4'), 'Insecure RC4 disallowed');
    assert(!SECURE_TLS_DEFAULTS.ciphers.includes('DES'), 'Insecure DES disallowed');
  });

  await test('4.2 Rejects rogue self-signed CA certificate fail-closed with TlsHandshakeFailedError', async () => {
    const serverTls = new TlsTransportAdapter({
      serverTls: {
        ca: TEST_CA_CERT,
        cert: TEST_SERVER_CERT,
        key: TEST_SERVER_KEY,
      },
    });

    // Client only trusts a rogue CA; should reject server signed by genuine CA
    const clientTls = new TlsTransportAdapter({
      clientTls: {
        ca: UNTRUSTED_ROGUE_CERT,
      },
    });

    const endpoint: TransportEndpoint = {
      transportType: 'TCP',
      host: '127.0.0.1',
      port: basePort + 10,
    };

    await serverTls.listen(endpoint);

    let rejected = false;
    try {
      await clientTls.connect(endpoint);
    } catch (err: any) {
      rejected = true;
      assert(err instanceof TlsHandshakeFailedError, 'Throws TlsHandshakeFailedError');
      assert(
        err.causeError === 'SELF_SIGNED_CERT_IN_CHAIN' || err.message.includes('certificate'),
        'Identified certificate rejection error'
      );
    }

    assert(rejected, 'Connection using untrusted CA was rejected');
    await serverTls.close('Test complete');
  });

  await test('4.3 mTLS server demands client certificate and rejects client presenting rogue/untrusted cert', async () => {
    const serverMtls = new TlsTransportAdapter({
      serverTls: {
        ca: TEST_CA_CERT,
        cert: TEST_SERVER_CERT,
        key: TEST_SERVER_KEY,
        requestCert: true,
        rejectUnauthorized: true,
      },
    });

    // Client presents rogue cert signed by untrusted CA
    const clientRogue = new TlsTransportAdapter({
      clientTls: {
        ca: TEST_CA_CERT,
        cert: UNTRUSTED_ROGUE_CERT,
        key: UNTRUSTED_ROGUE_KEY,
        servername: 'localhost',
        rejectUnauthorized: true,
      },
      connectTimeoutMs: 3000,
    });

    const endpoint: TransportEndpoint = {
      transportType: 'TCP',
      host: '127.0.0.1',
      port: basePort + 11,
    };

    await serverMtls.listen(endpoint);

    let rejected = false;
    try {
      await clientRogue.connect(endpoint);
    } catch (err: any) {
      rejected = true;
    }

    if (!rejected) {
      await sleep(50);
      assert(clientRogue.state === 'DISCONNECTED' || clientRogue.state === 'FAULTED', 'Client disconnected by mTLS server');
    } else {
      assert(rejected, 'mTLS server rejected connection presenting untrusted certificate');
    }

    await serverMtls.close('Test complete');
    await clientRogue.close('Test complete').catch(() => {});
  });

  // ═════════════════════════════════════════════════════════════════════════
  // SECTION 5: Timeout, Retry Bounding & Connection Exhaustion
  // ═════════════════════════════════════════════════════════════════════════
  console.log('\n--- SECTION 5: Timeout, Retry Bounding & Connection Exhaustion ---');

  await test('5.1 Non-retryable error aborts immediately without wasteful retry attempts', async () => {
    let attemptCount = 0;
    let caught = false;

    try {
      await TransportResilienceEngine.execute(
        async () => {
          attemptCount++;
          // Non-retryable fatal error (e.g. fatal validation failure)
          throw new NonRetryableOperationError('FATAL_PROTOCOL_VIOLATION', 'Operation is fatally malformed');
        },
        {
          operationName: 'AuditNonRetryableTest',
          retryPolicy: {
            maxAttempts: 5,
            initialDelayMs: 10,
            maxDelayMs: 50,
          },
        }
      );
    } catch (err: any) {
      caught = true;
      assert(err instanceof NonRetryableOperationError, 'Throws NonRetryableOperationError');
    }

    assert(caught, 'Non-retryable error caught');
    assert(attemptCount === 1, `Exactly 1 attempt executed (no blind retry), actual: ${attemptCount}`);
  });

  await test('5.2 Retry exhaustion halts strictly after maxAttempts without infinite recursion', async () => {
    let attemptCount = 0;
    let caught = false;

    try {
      await TransportResilienceEngine.execute(
        async () => {
          attemptCount++;
          // Retryable error: ECONNREFUSED
          const err: any = new Error('connect ECONNREFUSED 127.0.0.1:9999');
          err.code = 'ECONNREFUSED';
          throw err;
        },
        {
          operationName: 'AuditRetryExhaustionTest',
          retryPolicy: {
            maxAttempts: 3,
            initialDelayMs: 5,
            maxDelayMs: 20,
            jitter: 'NONE',
          },
        }
      );
    } catch (err: any) {
      caught = true;
      assert(err instanceof TransportRetryExhaustedError, 'Throws TransportRetryExhaustedError');
      assert(err.telemetry.attemptHistory.length === 3, 'Recorded exactly 3 attempts in telemetry');
    }

    assert(caught, 'Retry exhaustion error caught');
    assert(attemptCount === 3, `Strictly bounded at 3 attempts, actual: ${attemptCount}`);
  });

  await test('5.3 ConnectionLifecycleManager enforces maxConnections limit fail-closed', async () => {
    const mgr = new ConnectionLifecycleManager({
      maxConnections: 2, // Hard limit of 2 active connections
    });

    const dummyAdapter1 = new TcpTransportAdapter();
    const dummyAdapter2 = new TcpTransportAdapter();
    const dummyAdapter3 = new TcpTransportAdapter();

    const targetEp: TransportEndpoint = { transportType: 'TCP', host: '127.0.0.1', port: 12999 };

    // Fake connection registration by hooking adapter internals
    (dummyAdapter1 as any).connect = async () => {};
    (dummyAdapter2 as any).connect = async () => {};
    (dummyAdapter3 as any).connect = async () => {};

    await mgr.connect(dummyAdapter1, targetEp, { connectionId: 'conn-1' });
    await mgr.connect(dummyAdapter2, targetEp, { connectionId: 'conn-2' });

    let limitTriggered = false;
    try {
      await mgr.connect(dummyAdapter3, targetEp, { connectionId: 'conn-3' });
    } catch (err: any) {
      limitTriggered = true;
      assert(err.message.includes('Connection limit reached: 2'), 'Throws Connection limit reached error');
    }

    assert(limitTriggered, 'Connection limit successfully enforced fail-closed');
  });

  await test('5.4 Orderly socket disconnect and event listener detachment under unexpected drop', async () => {
    const server = new TcpTransportAdapter();
    const client = new TcpTransportAdapter();
    const endpoint: TransportEndpoint = { transportType: 'TCP', host: '127.0.0.1', port: basePort + 20 };

    await server.listen(endpoint);
    await client.connect(endpoint);
    await sleep(25);

    assert(client.state === 'CONNECTED', 'Client connected');
    assert(server.state === 'CONNECTED', 'Server connected');

    // Simulate unexpected server socket termination
    await server.close('Abrupt server termination');
    await sleep(40);

    // Client should cleanly detect disconnect without unhandled exception or hung socket
    assert(client.state === 'DISCONNECTED', 'Client transitioned to DISCONNECTED on socket close');
    await client.close('Cleanup');
  });

  // ═════════════════════════════════════════════════════════════════════════
  // RESULTS SUMMARY
  // ═════════════════════════════════════════════════════════════════════════
  console.log('\n══════════════════════════════════════════════════════════════════════════');
  console.log(`  Phase 2 Task 17 Results: ${passed} PASSED, ${failed} FAILED`);
  console.log('══════════════════════════════════════════════════════════════════════════\n');

  if (failed > 0) {
    throw new Error(`Task 17 Security Audit suite failed: ${failed} failed tests.`);
  }
}

runSecurityAudit().catch((err) => {
  console.error('Master security audit execution error:', err);
  process.exit(1);
});
