/**
 * CUBiO Network Protocol v1 — Canonical Network Constants Registry Tests
 * ======================================================================
 *
 * Verification suite for Phase 1 / Task 08:
 *   1. Immutability & Deep-Freeze Protection (strict runtime mutation defense)
 *   2. Mathematical Validity & Boundary Consistency
 *   3. Cross-Module Reconciliation with Tasks 01–07
 *   4. Pattern & Regular Expression Validation
 *   5. Deterministic Serialization & Canonical Hash Invariance
 *
 * Run with:  npx tsx src/cubio/network/protocol/v1/constants.test.ts
 */

import {
  CUBIO_NETWORK_CONSTANTS,
  PROTOCOL_IDENTIFIERS,
  COORDINATE_BOUNDS,
  PROTOCOL_PATTERNS,
  PROTOCOL_LIMITS,
  PROTOCOL_VERSIONS,
  PACKET_FLAG_REGISTRY,
  NODE_DEFAULTS,
  NETWORK_STATE_ENUMS,
} from './constants';

// Reconciliation targets from Tasks 01–07
import {
  MAX_PAYLOAD_BYTES,
  MAX_TRACE_HOPS,
  MAX_ENVELOPE_TTL_MS,
  DEFAULT_ENVELOPE_TTL_MS,
  PROTOCOL_VERSION_STRING as PROTOCOL_VERSION_STR_T01,
} from './types';
import {
  PACKET_MAGIC as PACKET_MAGIC_T02,
  MAX_PACKET_BYTES as MAX_PACKET_BYTES_T02,
  DEFAULT_PACKET_MTU as DEFAULT_PACKET_MTU_T02,
  MIN_PACKET_MTU as MIN_PACKET_MTU_T02,
  MAX_PACKET_TTL as MAX_PACKET_TTL_T02,
  DEFAULT_PACKET_TTL as DEFAULT_PACKET_TTL_T02,
  MAX_SEQUENCE_NUMBER as MAX_SEQUENCE_NUMBER_T02,
  PacketFlags,
} from './packetTypes';
import {
  MAX_MESSAGE_PAYLOAD_BYTES as MAX_MSG_PAYLOAD_T03,
  DEFAULT_MESSAGE_TTL_MS as DEFAULT_MSG_TTL_T03,
} from './messageTypes';
import {
  CURRENT_PROTOCOL_VERSION,
  CURRENT_PROTOCOL_VERSION_STRING,
  MINIMUM_SUPPORTED_VERSION,
  MAXIMUM_SUPPORTED_VERSION,
} from './versionTypes';
import { CubiONetworkCoordinateEngine } from '../../coordinate/coordinate';
import { canonicalHash, serializeCanonical } from './canonicalSerializer';

// ─── Test Harness ─────────────────────────────────────────────────────────────

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

function assertThrows(fn: () => void, expectedMsgSubstr?: string) {
  let threw = false;
  try {
    fn();
  } catch (e: any) {
    threw = true;
    if (expectedMsgSubstr && !e.message.includes(expectedMsgSubstr)) {
      throw new Error(`Expected error containing "${expectedMsgSubstr}", got "${e.message}"`);
    }
  }
  if (!threw) throw new Error('Expected function to throw, but it succeeded');
}

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- CUBiO Protocol Constants Registry Test Suite (Task 08) ---\n');

// ═════════════════════════════════════════════════════════════════════════════
// 1. Immutability & Deep-Freeze Protection Tests
// ═════════════════════════════════════════════════════════════════════════════

console.log('1. Immutability & Deep-Freeze Protection:');

test('CUBIO_NETWORK_CONSTANTS root is frozen', () => {
  assert(Object.isFrozen(CUBIO_NETWORK_CONSTANTS), 'Root registry must be frozen');
});

test('All top-level registry sections are frozen', () => {
  assert(Object.isFrozen(PROTOCOL_IDENTIFIERS), 'PROTOCOL_IDENTIFIERS must be frozen');
  assert(Object.isFrozen(COORDINATE_BOUNDS), 'COORDINATE_BOUNDS must be frozen');
  assert(Object.isFrozen(PROTOCOL_PATTERNS), 'PROTOCOL_PATTERNS must be frozen');
  assert(Object.isFrozen(PROTOCOL_LIMITS), 'PROTOCOL_LIMITS must be frozen');
  assert(Object.isFrozen(PROTOCOL_VERSIONS), 'PROTOCOL_VERSIONS must be frozen');
  assert(Object.isFrozen(PACKET_FLAG_REGISTRY), 'PACKET_FLAG_REGISTRY must be frozen');
  assert(Object.isFrozen(NODE_DEFAULTS), 'NODE_DEFAULTS must be frozen');
  assert(Object.isFrozen(NETWORK_STATE_ENUMS), 'NETWORK_STATE_ENUMS must be frozen');
});

test('Nested structures within registry are deeply frozen', () => {
  assert(Object.isFrozen(PROTOCOL_VERSIONS.CURRENT), 'CURRENT version tuple must be frozen');
  assert(Object.isFrozen(PROTOCOL_VERSIONS.MINIMUM_SUPPORTED), 'MINIMUM_SUPPORTED version tuple must be frozen');
  assert(Object.isFrozen(PROTOCOL_VERSIONS.MAXIMUM_SUPPORTED), 'MAXIMUM_SUPPORTED version tuple must be frozen');
  assert(Object.isFrozen(NETWORK_STATE_ENUMS.CLUSTER_STATES), 'CLUSTER_STATES array must be frozen');
  assert(Object.isFrozen(NETWORK_STATE_ENUMS.NODE_STATES), 'NODE_STATES array must be frozen');
  assert(Object.isFrozen(NETWORK_STATE_ENUMS.CONNECTION_STATES), 'CONNECTION_STATES array must be frozen');
  assert(Object.isFrozen(NETWORK_STATE_ENUMS.SESSION_STATES), 'SESSION_STATES array must be frozen');
  assert(Object.isFrozen(NETWORK_STATE_ENUMS.MESSAGE_STATES), 'MESSAGE_STATES array must be frozen');
});

test('Mutation attempt on limits throws or fails in strict mode', () => {
  assertThrows(() => {
    'use strict';
    (CUBIO_NETWORK_CONSTANTS.LIMITS as any).MAX_PACKET_BYTES = 999_999;
  });
  assert(CUBIO_NETWORK_CONSTANTS.LIMITS.MAX_PACKET_BYTES === 65_536, 'Limit must remain unaltered');
});

test('Mutation attempt on nested version tuple throws or fails in strict mode', () => {
  assertThrows(() => {
    'use strict';
    (CUBIO_NETWORK_CONSTANTS.VERSIONS.CURRENT as any).major = 2;
  });
  assert(CUBIO_NETWORK_CONSTANTS.VERSIONS.CURRENT.major === 1, 'Version major must remain unaltered');
});

test('Addition of invented property throws or fails in strict mode', () => {
  assertThrows(() => {
    'use strict';
    (CUBIO_NETWORK_CONSTANTS as any).INVENTED_KEY = 'illegal';
  });
  assert((CUBIO_NETWORK_CONSTANTS as any).INVENTED_KEY === undefined, 'Invented property must not exist');
});

test('Deletion of constant property throws or fails in strict mode', () => {
  assertThrows(() => {
    'use strict';
    delete (CUBIO_NETWORK_CONSTANTS.IDENTIFIERS as any).PACKET_MAGIC;
  });
  assert(CUBIO_NETWORK_CONSTANTS.IDENTIFIERS.PACKET_MAGIC === 'CUB1', 'Constant must not be deleted');
});

test('Array mutation on state enums throws or fails in strict mode', () => {
  assertThrows(() => {
    'use strict';
    (CUBIO_NETWORK_CONSTANTS.STATES.CLUSTER_STATES as any).push('FABRICATED_STATE');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 2. Mathematical Validity & Boundary Consistency Tests
// ═════════════════════════════════════════════════════

console.log('2. Mathematical Validity & Boundary Consistency:');

test('Coordinate system bounds are valid and well-ordered', () => {
  assert(COORDINATE_BOUNDS.MIN_DIMENSION <= COORDINATE_BOUNDS.MAX_DIMENSION, 'Dimension min <= max');
  assert(COORDINATE_BOUNDS.MIN_ZONE <= COORDINATE_BOUNDS.MAX_ZONE, 'Zone min <= max');
  assert(COORDINATE_BOUNDS.MIN_NODE <= COORDINATE_BOUNDS.MAX_NODE, 'Node min <= max');
  assert(COORDINATE_BOUNDS.MIN_DIMENSION === 0, 'Dimension min must be 0');
  assert(COORDINATE_BOUNDS.MIN_ZONE === 0, 'Zone min must be 0');
  assert(COORDINATE_BOUNDS.MIN_NODE === 0, 'Node min must be 0');
});

test('Coordinate padding accommodates maximum values', () => {
  assert(Math.pow(10, COORDINATE_BOUNDS.ZONE_PADDING) > COORDINATE_BOUNDS.MAX_ZONE, 'Zone padding covers MAX_ZONE');
  assert(Math.pow(10, COORDINATE_BOUNDS.NODE_PADDING) > COORDINATE_BOUNDS.MAX_NODE, 'Node padding covers MAX_NODE');
  assert(COORDINATE_BOUNDS.SEGMENT_COUNT === 4, 'CNC URI must have exactly 4 segments');
});

test('Transmission limits satisfy strict hierarchy: MIN_MTU < DEFAULT_MTU <= MAX_PACKET_BYTES', () => {
  assert(PROTOCOL_LIMITS.MIN_PACKET_MTU < PROTOCOL_LIMITS.DEFAULT_PACKET_MTU, 'MIN_MTU < DEFAULT_MTU');
  assert(PROTOCOL_LIMITS.DEFAULT_PACKET_MTU <= PROTOCOL_LIMITS.MAX_PACKET_BYTES, 'DEFAULT_MTU <= MAX_PACKET');
  assert(PROTOCOL_LIMITS.MAX_PACKET_BYTES === 65_536, 'MAX_PACKET_BYTES is exactly 64 KB');
  assert(PROTOCOL_LIMITS.MAX_ENVELOPE_PAYLOAD_BYTES === 65_536, 'MAX_ENVELOPE_PAYLOAD_BYTES is 64 KB');
  assert(PROTOCOL_LIMITS.MAX_MESSAGE_PAYLOAD_BYTES === 65_536, 'MAX_MESSAGE_PAYLOAD_BYTES is 64 KB');
});

test('TTL bounds are positive and logically ordered', () => {
  assert(PROTOCOL_LIMITS.DEFAULT_ENVELOPE_TTL_MS > 0, 'Default envelope TTL must be > 0');
  assert(PROTOCOL_LIMITS.MAX_ENVELOPE_TTL_MS >= PROTOCOL_LIMITS.DEFAULT_ENVELOPE_TTL_MS, 'MAX_TTL >= DEFAULT_TTL');
  assert(PROTOCOL_LIMITS.DEFAULT_PACKET_TTL > 0, 'Default packet TTL must be > 0');
  assert(PROTOCOL_LIMITS.MAX_PACKET_TTL >= PROTOCOL_LIMITS.DEFAULT_PACKET_TTL, 'MAX_PACKET_TTL >= DEFAULT');
  assert(PROTOCOL_LIMITS.MAX_PACKET_TTL <= 255, 'Packet TTL fits in 8-bit uint8');
  assert(PROTOCOL_LIMITS.MAX_TRACE_HOPS > 0 && PROTOCOL_LIMITS.MAX_TRACE_HOPS <= 64, 'Trace hops bounded');
});

test('Packet control flags are distinct non-zero powers of 2', () => {
  assert(PACKET_FLAG_REGISTRY.NONE === 0, 'NONE flag is 0');
  const flags = [
    PACKET_FLAG_REGISTRY.ACK,
    PACKET_FLAG_REGISTRY.SYN,
    PACKET_FLAG_REGISTRY.FIN,
    PACKET_FLAG_REGISTRY.RST,
    PACKET_FLAG_REGISTRY.FRAG,
    PACKET_FLAG_REGISTRY.LAST_FRAG,
    PACKET_FLAG_REGISTRY.COMPRESSED,
    PACKET_FLAG_REGISTRY.ENCRYPTED,
  ];

  for (const flag of flags) {
    assert(flag > 0 && (flag & (flag - 1)) === 0, `Flag 0x${flag.toString(16)} must be power of 2`);
  }

  let combined = 0;
  for (const flag of flags) {
    assert((combined & flag) === 0, `Flag 0x${flag.toString(16)} collides with existing flags`);
    combined |= flag;
  }
  assert(combined === 0xff, 'Flags must fully cover 8-bit bitmask 0xFF');
});

test('Node operational defaults are within standard network constraints', () => {
  assert(NODE_DEFAULTS.DEFAULT_PORT > 1024 && NODE_DEFAULTS.DEFAULT_PORT <= 65535, 'Port is valid user port');
  assert(NODE_DEFAULTS.DEFAULT_HOST === '127.0.0.1', 'Default host is local loopback');
  assert(NODE_DEFAULTS.DEFAULT_MAX_PEERS > 0, 'Max peers must be positive');
  assert(NODE_DEFAULTS.DEFAULT_HEARTBEAT_MS > 0, 'Heartbeat interval must be positive');
  assert(NODE_DEFAULTS.DEFAULT_STORAGE_QUOTA_BYTES > 0, 'Storage quota must be positive');
  assert(NODE_DEFAULTS.DEFAULT_RATE_LIMIT_PER_MIN > 0, 'Rate limit must be positive');
  assert(NODE_DEFAULTS.DEGRADED_HEALTH_THRESHOLD > 0 && NODE_DEFAULTS.DEGRADED_HEALTH_THRESHOLD <= 100, 'Health score valid');
});

// ═════════════════════════════════════════════════════════════════════════════
// 3. Cross-Module Reconciliation Tests
// ═════════════════════════════════════════════════════════════════════════════

console.log('3. Cross-Module Reconciliation:');

test('Reconciles coordinate bounds with CubiONetworkCoordinateEngine', () => {
  assert(COORDINATE_BOUNDS.MIN_DIMENSION === CubiONetworkCoordinateEngine.MIN_DIMENSION, 'MIN_DIMENSION matches');
  assert(COORDINATE_BOUNDS.MAX_DIMENSION === CubiONetworkCoordinateEngine.MAX_DIMENSION, 'MAX_DIMENSION matches');
  assert(COORDINATE_BOUNDS.MIN_ZONE === CubiONetworkCoordinateEngine.MIN_ZONE, 'MIN_ZONE matches');
  assert(COORDINATE_BOUNDS.MAX_ZONE === CubiONetworkCoordinateEngine.MAX_ZONE, 'MAX_ZONE matches');
  assert(COORDINATE_BOUNDS.MIN_NODE === CubiONetworkCoordinateEngine.MIN_NODE, 'MIN_NODE matches');
  assert(COORDINATE_BOUNDS.MAX_NODE === CubiONetworkCoordinateEngine.MAX_NODE, 'MAX_NODE matches');
  assert(PROTOCOL_IDENTIFIERS.CNC_SCHEME_PREFIX === CubiONetworkCoordinateEngine.SCHEME_PREFIX, 'SCHEME_PREFIX matches');
});

test('Reconciles envelope limits with Task 01 (types.ts)', () => {
  assert(PROTOCOL_LIMITS.MAX_ENVELOPE_PAYLOAD_BYTES === MAX_PAYLOAD_BYTES, 'MAX_PAYLOAD_BYTES matches');
  assert(PROTOCOL_LIMITS.MAX_TRACE_HOPS === MAX_TRACE_HOPS, 'MAX_TRACE_HOPS matches');
  assert(PROTOCOL_LIMITS.MAX_ENVELOPE_TTL_MS === MAX_ENVELOPE_TTL_MS, 'MAX_ENVELOPE_TTL_MS matches');
  assert(PROTOCOL_LIMITS.DEFAULT_ENVELOPE_TTL_MS === DEFAULT_ENVELOPE_TTL_MS, 'DEFAULT_ENVELOPE_TTL_MS matches');
  assert(PROTOCOL_IDENTIFIERS.PROTOCOL_VERSION_STRING === PROTOCOL_VERSION_STR_T01, 'PROTOCOL_VERSION_STRING matches');
});

test('Reconciles packet framing and limits with Task 02 (packetTypes.ts)', () => {
  assert(PROTOCOL_IDENTIFIERS.PACKET_MAGIC === PACKET_MAGIC_T02, 'PACKET_MAGIC matches');
  assert(PROTOCOL_LIMITS.MAX_PACKET_BYTES === MAX_PACKET_BYTES_T02, 'MAX_PACKET_BYTES matches');
  assert(PROTOCOL_LIMITS.DEFAULT_PACKET_MTU === DEFAULT_PACKET_MTU_T02, 'DEFAULT_PACKET_MTU matches');
  assert(PROTOCOL_LIMITS.MIN_PACKET_MTU === MIN_PACKET_MTU_T02, 'MIN_PACKET_MTU matches');
  assert(PROTOCOL_LIMITS.MAX_PACKET_TTL === MAX_PACKET_TTL_T02, 'MAX_PACKET_TTL matches');
  assert(PROTOCOL_LIMITS.DEFAULT_PACKET_TTL === DEFAULT_PACKET_TTL_T02, 'DEFAULT_PACKET_TTL matches');
  assert(PROTOCOL_LIMITS.MAX_SEQUENCE_NUMBER === MAX_SEQUENCE_NUMBER_T02, 'MAX_SEQUENCE_NUMBER matches');

  assert(PACKET_FLAG_REGISTRY.NONE === PacketFlags.NONE, 'NONE flag matches');
  assert(PACKET_FLAG_REGISTRY.ACK === PacketFlags.ACK, 'ACK flag matches');
  assert(PACKET_FLAG_REGISTRY.SYN === PacketFlags.SYN, 'SYN flag matches');
  assert(PACKET_FLAG_REGISTRY.FIN === PacketFlags.FIN, 'FIN flag matches');
  assert(PACKET_FLAG_REGISTRY.RST === PacketFlags.RST, 'RST flag matches');
  assert(PACKET_FLAG_REGISTRY.FRAG === PacketFlags.FRAG, 'FRAG flag matches');
  assert(PACKET_FLAG_REGISTRY.LAST_FRAG === PacketFlags.LAST_FRAG, 'LAST_FRAG flag matches');
  assert(PACKET_FLAG_REGISTRY.COMPRESSED === PacketFlags.COMPRESSED, 'COMPRESSED flag matches');
  assert(PACKET_FLAG_REGISTRY.ENCRYPTED === PacketFlags.ENCRYPTED, 'ENCRYPTED flag matches');
});

test('Reconciles message constraints with Task 03 (messageTypes.ts)', () => {
  assert(PROTOCOL_LIMITS.MAX_MESSAGE_PAYLOAD_BYTES === MAX_MSG_PAYLOAD_T03, 'MAX_MESSAGE_PAYLOAD_BYTES matches');
  assert(PROTOCOL_LIMITS.DEFAULT_MESSAGE_TTL_MS === DEFAULT_MSG_TTL_T03, 'DEFAULT_MESSAGE_TTL_MS matches');
});

test('Reconciles protocol version tuples with Task 06 (versionTypes.ts)', () => {
  assert(PROTOCOL_VERSIONS.CURRENT.major === CURRENT_PROTOCOL_VERSION.major, 'CURRENT.major matches');
  assert(PROTOCOL_VERSIONS.CURRENT.minor === CURRENT_PROTOCOL_VERSION.minor, 'CURRENT.minor matches');
  assert(PROTOCOL_VERSIONS.CURRENT.patch === CURRENT_PROTOCOL_VERSION.patch, 'CURRENT.patch matches');
  assert(PROTOCOL_VERSIONS.MINIMUM_SUPPORTED.major === MINIMUM_SUPPORTED_VERSION.major, 'MINIMUM_SUPPORTED matches');
  assert(PROTOCOL_VERSIONS.MAXIMUM_SUPPORTED.major === MAXIMUM_SUPPORTED_VERSION.major, 'MAXIMUM_SUPPORTED matches');
  assert(PROTOCOL_IDENTIFIERS.CANONICAL_SEMVER_STRING === CURRENT_PROTOCOL_VERSION_STRING, 'CANONICAL_SEMVER_STRING matches');
});

test('Reconciles state enums across state model and message model', () => {
  assert(NETWORK_STATE_ENUMS.CLUSTER_STATES.includes('CONVERGED'), 'CLUSTER_STATES includes CONVERGED');
  assert(NETWORK_STATE_ENUMS.NODE_STATES.includes('ONLINE'), 'NODE_STATES includes ONLINE');
  assert(NETWORK_STATE_ENUMS.CONNECTION_STATES.includes('ESTABLISHED'), 'CONNECTION_STATES includes ESTABLISHED');
  assert(NETWORK_STATE_ENUMS.SESSION_STATES.includes('STREAMING'), 'SESSION_STATES includes STREAMING');
  assert(NETWORK_STATE_ENUMS.MESSAGE_STATES.includes('DELIVERED'), 'MESSAGE_STATES includes DELIVERED');
});

// ═════════════════════════════════════════════════════════════════════════════
// 4. Pattern & Regular Expression Validation Tests
// ═════════════════════════════════════════════════════

console.log('4. Pattern & Regular Expression Validation:');

test('SOVEREIGN_CUB_ID pattern matches valid sovereign IDs', () => {
  const valid = [
    'CUB-A1B2C3D4',
    'CUB-00000000',
    'CUB-FFFFFFFF',
    'CUB-12345678',
    'CUB-ABCDEFGH',
  ];
  for (const id of valid) {
    assert(PROTOCOL_PATTERNS.SOVEREIGN_CUB_ID.test(id), `Expected "${id}" to match SOVEREIGN_CUB_ID`);
  }
});

test('SOVEREIGN_CUB_ID pattern rejects invalid IDs', () => {
  const invalid = [
    'cub-a1b2c3d4',
    'CUB-1234567',
    'CUB-123456789',
    'A1B2C3D4',
    'CUB_A1B2C3D4',
    'CUB-A1B2-C3D4',
    'CUB-A1B2C3D!',
    '',
  ];
  for (const id of invalid) {
    assert(!PROTOCOL_PATTERNS.SOVEREIGN_CUB_ID.test(id), `Expected "${id}" to fail SOVEREIGN_CUB_ID`);
  }
});

test('SERVICE_IDENTIFIER pattern matches valid services and rejects malformed', () => {
  const valid = ['CORE', 'ROUTER', 'AI-AGENT', 'SERVICE_01', 'NODE_MGR'];
  for (const svc of valid) {
    assert(PROTOCOL_PATTERNS.SERVICE_IDENTIFIER.test(svc), `Expected "${svc}" to match SERVICE_IDENTIFIER`);
  }

  const invalid = ['core', 'ROUTER/01', 'AI AGENT', 'SVC.01', ''];
  for (const svc of invalid) {
    assert(!PROTOCOL_PATTERNS.SERVICE_IDENTIFIER.test(svc), `Expected "${svc}" to fail SERVICE_IDENTIFIER`);
  }
});

test('SEMVER_PATTERN correctly parses semver strings', () => {
  const m1 = PROTOCOL_PATTERNS.SEMVER_PATTERN.exec('1.0');
  assert(m1 !== null && m1[1] === '1' && m1[2] === '0', 'Parses 1.0');

  const m2 = PROTOCOL_PATTERNS.SEMVER_PATTERN.exec('1.2.3');
  assert(m2 !== null && m2[1] === '1' && m2[2] === '2' && m2[3] === '3', 'Parses 1.2.3');

  const m3 = PROTOCOL_PATTERNS.SEMVER_PATTERN.exec('2.0.0-beta.1');
  assert(m3 !== null && m3[1] === '2' && m3[4] === 'beta.1', 'Parses 2.0.0-beta.1');

  assert(PROTOCOL_PATTERNS.SEMVER_PATTERN.exec('v1.0') === null, 'Rejects "v" prefix');
  assert(PROTOCOL_PATTERNS.SEMVER_PATTERN.exec('invalid') === null, 'Rejects non-semver');
});

test('CNC_URI_PATTERN matches canonical CNC URIs', () => {
  const valid = [
    'CUBIO://NETWORK/0/01/00001/CORE',
    'CUBIO://NETWORK/1/00/00005/AI-AGENT',
    'cubio://network/99/99/99999/SYSTEM_BUS',
  ];
  for (const uri of valid) {
    assert(PROTOCOL_PATTERNS.CNC_URI_PATTERN.test(uri), `Expected "${uri}" to match CNC_URI_PATTERN`);
  }

  const invalid = [
    'CUBIO://NETWORK/0/1/00001/CORE',
    'CUBIO://NETWORK/0/01/1/CORE',
    'HTTP://NETWORK/0/01/00001/CORE',
    'CUBIO://NETWORK/0/01/00001',
    'CUBIO://NETWORK/0/01/00001/CORE/EXTRA',
  ];
  for (const uri of invalid) {
    assert(!PROTOCOL_PATTERNS.CNC_URI_PATTERN.test(uri), `Expected "${uri}" to fail CNC_URI_PATTERN`);
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// 5. Deterministic Serialization & Canonical Hash Invariance Tests
// ═════════════════════════════════════════════════════

console.log('5. Deterministic Serialization & Canonical Hash Invariance:');

test('CUBIO_NETWORK_CONSTANTS serializes canonically without error', () => {
  const serializable = {
    IDENTIFIERS: PROTOCOL_IDENTIFIERS,
    COORDINATES: COORDINATE_BOUNDS,
    LIMITS: PROTOCOL_LIMITS,
    VERSIONS: PROTOCOL_VERSIONS,
    FLAGS: PACKET_FLAG_REGISTRY,
    NODE: NODE_DEFAULTS,
    STATES: NETWORK_STATE_ENUMS,
  };

  const serialized = serializeCanonical(serializable);
  assert(typeof serialized === 'string', 'Serialization produces string');
  assert(serialized.length > 0, 'Serialization string is non-empty');
  assert(!serialized.includes('undefined'), 'No undefined in serialization');
});

test('Canonical hash of constants is invariant across 100 iterations', () => {
  const serializable = {
    IDENTIFIERS: PROTOCOL_IDENTIFIERS,
    COORDINATES: COORDINATE_BOUNDS,
    LIMITS: PROTOCOL_LIMITS,
    VERSIONS: PROTOCOL_VERSIONS,
    FLAGS: PACKET_FLAG_REGISTRY,
    NODE: NODE_DEFAULTS,
    STATES: NETWORK_STATE_ENUMS,
  };

  const baselineHash = canonicalHash(serializable);
  assert(baselineHash.startsWith('0x'), 'Hash begins with 0x');

  for (let i = 0; i < 100; i++) {
    const iterHash = canonicalHash(serializable);
    assert(iterHash === baselineHash, `Iteration ${i} hash ${iterHash} must equal baseline ${baselineHash}`);
  }
});

test('Independent object construction with shuffled keys yields identical canonical hash', () => {
  const serializableA = {
    IDENTIFIERS: PROTOCOL_IDENTIFIERS,
    COORDINATES: COORDINATE_BOUNDS,
    LIMITS: PROTOCOL_LIMITS,
    VERSIONS: PROTOCOL_VERSIONS,
    FLAGS: PACKET_FLAG_REGISTRY,
    NODE: NODE_DEFAULTS,
    STATES: NETWORK_STATE_ENUMS,
  };

  const serializableB = {
    STATES: NETWORK_STATE_ENUMS,
    NODE: NODE_DEFAULTS,
    FLAGS: PACKET_FLAG_REGISTRY,
    VERSIONS: PROTOCOL_VERSIONS,
    LIMITS: PROTOCOL_LIMITS,
    COORDINATES: COORDINATE_BOUNDS,
    IDENTIFIERS: PROTOCOL_IDENTIFIERS,
  };

  const hashA = canonicalHash(serializableA);
  const hashB = canonicalHash(serializableB);
  assert(hashA === hashB, `Hashes must be identical regardless of key order: ${hashA} vs ${hashB}`);
});

// ─────────────────────────────────────────────────────────────────────────────
console.log(`\nResults: ${passed} passed, ${failed} failed\n`);

if (failed > 0) {
  process.exit(1);
}
