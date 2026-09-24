/**
 * CUBiO AI — Phase 2 / Task 01: Real Transport Layer Specification Test Suite
 * ============================================================================
 *
 * Validates the formal architectural contracts, endpoint validation,
 * lifecycle state machines, wire framing limits, error taxonomy,
 * and seamless non-breaking compatibility with the Phase 1 protocol foundation.
 *
 * Run with:  npx tsx src/cubio/network/transport/transportSpecification.test.ts
 */

import {
  TransportType,
  TransportLifecycleState,
  TransportEndpoint,
  PERMITTED_TRANSPORT_TRANSITIONS,
} from './types';
import {
  CUBIO_TRANSPORT_CONSTANTS,
  TRANSPORT_FRAME_CONSTANTS,
  TRANSPORT_PORTS,
  TRANSPORT_TIMEOUTS,
} from './constants';
import {
  validateTransportEndpoint,
  validateTransportTransition,
  assertTransportTransition,
  createTransportError,
  validateWireFrameHeader,
} from './transportSpecification';

// Phase 1 imports to prove zero-degradation compatibility
import { createPacket, validatePacket } from '../protocol/v1/packetEngine';
import { PROTOCOL_LIMITS, PROTOCOL_IDENTIFIERS } from '../protocol/v1/constants';
import { CubiOProtocolValidator } from '../protocol/v1/protocolValidator';

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err: any) {
    failed++;
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
  }
}

function assert(condition: boolean, msg?: string) {
  if (!condition) throw new Error(msg ?? 'Assertion failed');
}

console.log('\n══════════════════════════════════════════════════════════════════════════');
console.log('  CUBiO AI — Phase 2 / Task 01: Real Transport Layer Specification Tests   ');
console.log('══════════════════════════════════════════════════════════════════════════\n');

// ─── 1. Transport Types & Endpoint Validation ─────────────────────────────────

console.log('1. Transport Types & Endpoint Validation:');

test('Valid endpoints across all supported transport types pass validation', () => {
  const memoryEp: TransportEndpoint = {
    transportType: 'MEMORY',
    host: 'localhost',
    port: 0,
    coordinateUri: 'CUBIO://NETWORK/0/01/00001/CORE',
  };
  const udpEp: TransportEndpoint = {
    transportType: 'UDP',
    host: '127.0.0.1',
    port: TRANSPORT_PORTS.DEFAULT_UDP,
    coordinateUri: 'CUBIO://NETWORK/0/01/00002/RELAY',
  };
  const tcpEp: TransportEndpoint = {
    transportType: 'TCP',
    host: '192.168.1.100',
    port: TRANSPORT_PORTS.DEFAULT_TCP,
  };
  const wsEp: TransportEndpoint = {
    transportType: 'WEBSOCKET',
    host: 'gateway.cubio.network',
    port: TRANSPORT_PORTS.DEFAULT_WS,
    path: '/v1/transport',
  };
  const ipcEp: TransportEndpoint = {
    transportType: 'IPC_PIPE',
    host: 'localhost',
    port: 0,
    path: '\\\\.\\pipe\\cubio-node-01',
  };

  assert(validateTransportEndpoint(memoryEp).isValid, 'Memory endpoint valid');
  assert(validateTransportEndpoint(udpEp).isValid, 'UDP endpoint valid');
  assert(validateTransportEndpoint(tcpEp).isValid, 'TCP endpoint valid');
  assert(validateTransportEndpoint(wsEp).isValid, 'WebSocket endpoint valid');
  assert(validateTransportEndpoint(ipcEp).isValid, 'IPC pipe endpoint valid');
});

test('Malformed endpoints fail validation fail-closed', () => {
  // Empty object
  assert(!validateTransportEndpoint({}).isValid, 'Empty object must fail');

  // Unsupported transport type
  assert(!validateTransportEndpoint({ transportType: 'SATELLITE', host: '127.0.0.1', port: 1000 }).isValid, 'Invalid type must fail');

  // Port out of range
  assert(!validateTransportEndpoint({ transportType: 'TCP', host: '127.0.0.1', port: 70000 }).isValid, 'Port > 65535 must fail');
  assert(!validateTransportEndpoint({ transportType: 'TCP', host: '127.0.0.1', port: -1 }).isValid, 'Port < 0 must fail');
  assert(!validateTransportEndpoint({ transportType: 'TCP', host: '127.0.0.1', port: 80.5 }).isValid, 'Non-integer port must fail');

  // Invalid coordinate URI
  assert(!validateTransportEndpoint({
    transportType: 'UDP',
    host: '127.0.0.1',
    port: 3690,
    coordinateUri: 'INVALID_URI_SCHEME',
  }).isValid, 'Malformed coordinate URI must fail');
});

// ─── 2. Transport Lifecycle State Machine ─────────────────────────────────────

console.log('2. Transport Lifecycle State Machine:');

test('Permitted lifecycle paths succeed deterministically', () => {
  // Happy path: UNINITIALIZED -> INITIALIZING -> CONNECTING -> CONNECTED
  assert(validateTransportTransition('UNINITIALIZED', 'INITIALIZING'), 'UNINITIALIZED -> INITIALIZING');
  assert(validateTransportTransition('INITIALIZING', 'CONNECTING'), 'INITIALIZING -> CONNECTING');
  assert(validateTransportTransition('CONNECTING', 'CONNECTED'), 'CONNECTING -> CONNECTED');

  // Degradation and recovery: CONNECTED -> DEGRADED -> CONNECTED
  assert(validateTransportTransition('CONNECTED', 'DEGRADED'), 'CONNECTED -> DEGRADED');
  assert(validateTransportTransition('DEGRADED', 'CONNECTED'), 'DEGRADED -> CONNECTED');

  // Clean teardown: CONNECTED -> DISCONNECTING -> DISCONNECTED
  assert(validateTransportTransition('CONNECTED', 'DISCONNECTING'), 'CONNECTED -> DISCONNECTING');
  assert(validateTransportTransition('DISCONNECTING', 'DISCONNECTED'), 'DISCONNECTING -> DISCONNECTED');

  // Fault path: CONNECTED -> FAULTED -> DISCONNECTED
  assert(validateTransportTransition('CONNECTED', 'FAULTED'), 'CONNECTED -> FAULTED');
  assert(validateTransportTransition('FAULTED', 'DISCONNECTED'), 'FAULTED -> DISCONNECTED');
});

test('Illegal lifecycle skips throw deterministically', () => {
  // Direct jump from UNINITIALIZED to CONNECTED
  let threw = false;
  try {
    assertTransportTransition('UNINITIALIZED', 'CONNECTED');
  } catch {
    threw = true;
  }
  assert(threw, 'Direct jump UNINITIALIZED -> CONNECTED must throw');

  // Direct jump from DISCONNECTED to DEGRADED
  threw = false;
  try {
    assertTransportTransition('DISCONNECTED', 'DEGRADED');
  } catch {
    threw = true;
  }
  assert(threw, 'Direct jump DISCONNECTED -> DEGRADED must throw');
});

// ─── 3. Wire Framing Constraints ─────────────────────────────────────────────

console.log('3. Wire Framing Constraints:');

test('Valid wire frame header passes bounds verification', () => {
  const result = validateWireFrameHeader(TRANSPORT_FRAME_CONSTANTS.MAGIC, 1400);
  assert(result.isValid, 'Standard 1400 MTU frame header is valid');
});

test('Tampered or out-of-bound wire frame headers fail closed', () => {
  // Wrong magic
  const wrongMagic = validateWireFrameHeader('BADMAG', 1400);
  assert(!wrongMagic.isValid, 'Wrong magic must fail');
  assert(Boolean(wrongMagic.error?.includes('Invalid wire frame magic')), 'Reports magic mismatch');

  // Undersized (< 32 bytes)
  const tooSmall = validateWireFrameHeader(TRANSPORT_FRAME_CONSTANTS.MAGIC, 16);
  assert(!tooSmall.isValid, 'Too small frame must fail');

  // Oversized (> 65536 bytes)
  const tooLarge = validateWireFrameHeader(TRANSPORT_FRAME_CONSTANTS.MAGIC, 70_000);
  assert(!tooLarge.isValid, 'Frame > 64 KB must fail');
});

// ─── 4. Error Taxonomy & Construction ────────────────────────────────────────

console.log('4. Error Taxonomy & Construction:');

test('Transport error factory creates immutable structured errors', () => {
  const err = createTransportError(
    'ERR_TRANSPORT_CONNECT_TIMEOUT',
    'Connection to peer timed out after 5000ms',
    'TCP',
    {
      endpoint: { transportType: 'TCP', host: '10.0.0.1', port: 3691 },
      fatal: false,
      cause: 'ETIMEDOUT',
    }
  );

  assert(err.code === 'ERR_TRANSPORT_CONNECT_TIMEOUT', 'Error code matches');
  assert(err.transportType === 'TCP', 'Transport type matches');
  assert(err.endpoint?.port === 3691, 'Endpoint preserved');
  assert(err.fatal === false, 'Fatal flag preserved');
  assert(Object.isFrozen(err), 'Error object is frozen');
});

// ─── 5. Constants Registry Integrity ─────────────────────────────────────────

console.log('5. Constants Registry Integrity:');

test('Transport constants registry is deeply frozen and mathematically aligned', () => {
  assert(TRANSPORT_FRAME_CONSTANTS.MAGIC === 'CUBTR1', 'Wire frame magic is CUBTR1');
  assert(TRANSPORT_FRAME_CONSTANTS.MAX_FRAME_BYTES === PROTOCOL_LIMITS.MAX_PACKET_BYTES, 'Aligned with Phase 1 64 KB limit');
  assert(TRANSPORT_PORTS.DEFAULT_UDP === 3690, 'Default UDP port is 3690');
  assert(TRANSPORT_PORTS.DEFAULT_TCP === 3691, 'Default TCP port is 3691');
  assert(TRANSPORT_PORTS.DEFAULT_WS === 3692, 'Default WebSocket port is 3692');
  assert(Object.isFrozen(CUBIO_TRANSPORT_CONSTANTS), 'Constants registry is frozen');
});

// ─── 6. Non-Breaking Phase 1 Compatibility ───────────────────────────────────

console.log('6. Non-Breaking Phase 1 Compatibility:');

test('Phase 1 protocol objects seamlessly interface with Phase 2 transport specification', () => {
  // Construct a canonical Phase 1 packet
  const packet = createPacket({
    envelopeId: 'ENV_0xP2TEST',
    sourceUri: 'CUBIO://NETWORK/0/01/00001/APP',
    destinationUri: 'CUBIO://NETWORK/0/01/00002/APP',
    payloadData: JSON.stringify({ message: 'Transport Handshake Ready' }),
  });

  // Verify it passes Phase 1 universal validation
  const valResult = CubiOProtocolValidator.validatePacket(packet);
  assert(valResult.isValid, 'Packet valid under Phase 1 validator');

  // Verify size is within Phase 2 transport frame limits
  assert(packet.payload.byteLength <= TRANSPORT_FRAME_CONSTANTS.MAX_FRAME_BYTES, 'Packet within transport limits');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n══════════════════════════════════════════════════════════════════════════');
console.log(`  Phase 2 / Task 01 Specification Test Results: ${passed} PASSED, ${failed} FAILED`);
console.log('══════════════════════════════════════════════════════════════════════════\n');

if (failed > 0) {
  process.exit(1);
}
