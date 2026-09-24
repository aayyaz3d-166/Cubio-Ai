/**
 * CUBiO Network Protocol v1 — Canonical Error and Response Model Test Suite
 * =========================================================================
 *
 * Verification suite for Phase 1 / Task 09:
 *   1. Success Responses (deterministic responseId, correlation, status codes)
 *   2. Protocol Error Category (framing, header, checksum)
 *   3. Validation Error Category (coordinates, limits, schema)
 *   4. Version Error Category (incompatible, deprecated, rejected)
 *   5. Network Error Category (unreachable, timeout, retryable flags)
 *   6. Security Error Category (unauthorized, signature mismatch, token)
 *   7. Rate Limit Error Category (throttle, backoff interval)
 *   8. Internal Error Category (engine exception, sanitized)
 *   9. Security Sanitization & Secret Leakage Defense (paths, credentials, stacks)
 *  10. Malformed Inputs Rejection & Validation
 *  11. Cross-Subsystem Integration (Envelope & Version Handshake)
 *  12. Deterministic Serialization & Canonical Hashing (RFC 8785)
 *
 * Run with:  npx tsx src/cubio/network/protocol/v1/responseEngine.test.ts
 */

import {
  createSuccessResponse,
  createErrorResponse,
  createProtocolError,
  createValidationError,
  createVersionError,
  createNetworkError,
  createSecurityError,
  createRateLimitError,
  createInternalError,
  sanitizeString,
  sanitizeDetails,
  generateResponseId,
  validateResponse,
  fromEnvelopeValidation,
  fromVersionNegotiation,
  serializeResponse,
  deserializeResponse,
  responseHash,
} from './responseEngine';
import {
  ResponseStatusCode,
  ProtocolErrorCodeCatalog,
  CubiOSuccessResponse,
  CubiOErrorResponse,
} from './responseTypes';
import { EnvelopeValidationResult, ProtocolEnvelope } from './types';
import { VersionNegotiationResult } from './versionTypes';
import { createEnvelope, createProtocolAddress } from './protocolEngine';

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
console.log('\n--- CUBiO Canonical Error & Response Model Test Suite (Task 09) ---\n');

// ═════════════════════════════════════════════════════════════════════════════
// 1. Success Responses
// ═════════════════════════════════════════════════════════════════════════════

console.log('1. Success Responses:');

test('createSuccessResponse creates valid response with default options', () => {
  const payload = { result: 'computed', value: 42 };
  const res = createSuccessResponse('MSG_12345', payload);

  assert(res.status === 'SUCCESS', 'Status must be SUCCESS');
  assert(res.correlationId === 'MSG_12345', 'CorrelationId must match');
  assert(res.responseId.startsWith('RSP_'), 'ResponseId must start with RSP_');
  assert(res.statusCode === 200, 'Default statusCode is 200');
  assert(res.payload.value === 42, 'Payload must be preserved');
  assert(typeof res.timestamp === 'number' && res.timestamp > 0, 'Timestamp is positive number');
  assert(Object.isFrozen(res), 'Response must be frozen');
});

test('createSuccessResponse supports custom status codes and metadata', () => {
  const res = createSuccessResponse('ENV_9999', { accepted: true }, {
    statusCode: ResponseStatusCode.ACCEPTED,
    timestamp: 1700000000000,
    metadata: { service: 'ROUTER', region: 'ZONE_01' },
  });

  assert(res.statusCode === 202, 'StatusCode must be 202');
  assert(res.timestamp === 1700000000000, 'Timestamp must match option');
  assert(res.metadata?.service === 'ROUTER', 'Metadata preserved');
});

test('generateResponseId produces deterministic identifiers', () => {
  const id1 = generateResponseId('CORR_A', 1000, 'SUCCESS');
  const id2 = generateResponseId('CORR_A', 1000, 'SUCCESS');
  const id3 = generateResponseId('CORR_A', 1000, 'ERROR');

  assert(id1 === id2, 'Identical inputs produce identical responseId');
  assert(id1 !== id3, 'Different status produces distinct responseId');
});

// ═════════════════════════════════════════════════════════════════════════════
// 2. Protocol Error Category
// ═════════════════════════════════════════════════════

console.log('2. Protocol Error Category:');

test('createProtocolError creates PROTOCOL_ERROR with status 400', () => {
  const err = createProtocolError(
    'PKT_0001',
    ProtocolErrorCodeCatalog.ERR_PROTOCOL_MAGIC_MISMATCH,
    'Packet magic header did not match CUB1'
  );

  assert(err.status === 'ERROR', 'Status must be ERROR');
  assert(err.statusCode === 400, 'Default status is 400');
  assert(err.error.category === 'PROTOCOL_ERROR', 'Category must be PROTOCOL_ERROR');
  assert(err.error.code === 'ERR_PROTOCOL_MAGIC_MISMATCH', 'Code must match');
  assert(err.error.retryable === false, 'Protocol errors are non-retryable by default');
});

// ═════════════════════════════════════════════════════════════════════════════
// 3. Validation Error Category
// ═════════════════════════════════════════════════════

console.log('3. Validation Error Category:');

test('createValidationError creates VALIDATION_ERROR with status 422', () => {
  const err = createValidationError(
    'MSG_COORD_1',
    ProtocolErrorCodeCatalog.ERR_VALIDATION_INVALID_COORDINATE,
    'Dimension out of range: 150 > 99',
    { details: { field: 'dimension', max: 99, received: 150 } }
  );

  assert(err.statusCode === 422, 'Default status is 422');
  assert(err.error.category === 'VALIDATION_ERROR', 'Category must be VALIDATION_ERROR');
  assert(err.error.details?.field === 'dimension', 'Details field preserved');
  assert(err.error.details?.received === 150, 'Details value preserved');
  assert(err.error.retryable === false, 'Validation errors are non-retryable');
});

// ═════════════════════════════════════════════════════════════════════════════
// 4. Version Error Category
// ═════════════════════════════════════════════════════

console.log('4. Version Error Category:');

test('createVersionError creates VERSION_ERROR with status 426', () => {
  const err = createVersionError(
    'HANDSHAKE_01',
    ProtocolErrorCodeCatalog.ERR_VERSION_INCOMPATIBLE,
    'Major version mismatch: required CNP/1.x, offered CNP/2.0'
  );

  assert(err.statusCode === 426, 'Default status is 426');
  assert(err.error.category === 'VERSION_ERROR', 'Category must be VERSION_ERROR');
  assert(err.error.code === 'ERR_VERSION_INCOMPATIBLE', 'Code matches');
  assert(err.error.retryable === false, 'Version errors are non-retryable');
});

// ═════════════════════════════════════════════════════════════════════════════
// 5. Network Error Category (Future Transport)
// ═════════════════════════════════════════════════════

console.log('5. Network Error Category:');

test('createNetworkError creates NETWORK_ERROR with status 502 and retryable flag', () => {
  const err = createNetworkError(
    'TX_990',
    ProtocolErrorCodeCatalog.ERR_NETWORK_DESTINATION_UNREACHABLE,
    'No viable route found to coordinate CUBIO://NETWORK/0/02/00003/CORE'
  );

  assert(err.statusCode === 502, 'Default status is 502');
  assert(err.error.category === 'NETWORK_ERROR', 'Category must be NETWORK_ERROR');
  assert(err.error.retryable === true, 'Network errors are retryable by default');
  assert(err.error.retryAfterMs === 1000, 'Default retry backoff is 1000ms');
});

test('createNetworkError supports custom retry backoff interval', () => {
  const err = createNetworkError(
    'TX_991',
    ProtocolErrorCodeCatalog.ERR_NETWORK_CONNECTION_TIMEOUT,
    'Peer did not acknowledge SYN within 5000ms',
    { retryAfterMs: 5000 }
  );

  assert(err.error.retryAfterMs === 5000, 'Custom retry backoff preserved');
});

// ═════════════════════════════════════════════════════════════════════════════
// 6. Security Error Category
// ═════════════════════════════════════════════════════

console.log('6. Security Error Category:');

test('createSecurityError creates SECURITY_ERROR with status 403', () => {
  const err = createSecurityError(
    'ENV_AUTH',
    ProtocolErrorCodeCatalog.ERR_SECURITY_UNAUTHORIZED_IDENTITY,
    'Sovereign ID CUB-12345678 is not authorized for capability PACKET_ROUTING'
  );

  assert(err.statusCode === 403, 'Default status is 403');
  assert(err.error.category === 'SECURITY_ERROR', 'Category must be SECURITY_ERROR');
  assert(err.error.retryable === false, 'Security errors are non-retryable');
});

// ═════════════════════════════════════════════════════════════════════════════
// 7. Rate Limit Error Category
// ═════════════════════════════════════════════════════

console.log('7. Rate Limit Error Category:');

test('createRateLimitError creates RATE_LIMIT_ERROR with status 429 and backoff', () => {
  const err = createRateLimitError('ENV_BURST', 2500, { currentRate: 650, limit: 600 });

  assert(err.statusCode === 429, 'Status must be 429');
  assert(err.error.category === 'RATE_LIMIT_ERROR', 'Category must be RATE_LIMIT_ERROR');
  assert(err.error.code === 'ERR_RATE_LIMIT_EXCEEDED', 'Code must be ERR_RATE_LIMIT_EXCEEDED');
  assert(err.error.retryable === true, 'Rate limit errors are retryable');
  assert(err.error.retryAfterMs === 2500, 'Retry backoff is 2500ms');
  assert(err.error.details?.currentRate === 650, 'Details preserved');
});

// ═════════════════════════════════════════════════════════════════════════════
// 8. Internal Error Category
// ═════════════════════════════════════════════════════

console.log('8. Internal Error Category:');

test('createInternalError creates sanitized 500 response from Error instance', () => {
  const rawException = new Error('Database connection failed at /var/run/db.sock\n    at query (node:internal/eval:10:5)');
  const err = createInternalError('OP_FAIL', rawException);

  assert(err.statusCode === 500, 'Status is 500');
  assert(err.error.category === 'INTERNAL_ERROR', 'Category is INTERNAL_ERROR');
  assert(err.error.code === 'ERR_INTERNAL_ERROR', 'Code is ERR_INTERNAL_ERROR');
  assert(!err.error.message.includes('/var/run/db.sock'), 'Path must be redacted');
  assert(!err.error.message.includes('at query'), 'Stack trace must be removed');
  assert(err.error.details?.errorName === 'Error', 'Error name preserved');
});

// ═════════════════════════════════════════════════════════════════════════════
// 9. Security Sanitization & Secret Leakage Defense Tests
// ═════════════════════════════════════════════════════

console.log('9. Security Sanitization & Secret Leakage Defense:');

test('sanitizeString redacts Windows filesystem paths', () => {
  const raw = 'Failed to load config from C:\\Users\\Administrator\\AppData\\secret.json';
  const clean = sanitizeString(raw);
  assert(!clean.includes('Administrator'), 'User name must be removed');
  assert(!clean.includes('AppData'), 'AppData must be removed');
  assert(clean.includes('[REDACTED_PATH]'), 'Must contain [REDACTED_PATH]');
});

test('sanitizeString redacts POSIX filesystem paths', () => {
  const raw = 'Cannot read key from /home/deploy/.ssh/id_rsa: permission denied';
  const clean = sanitizeString(raw);
  assert(!clean.includes('/home/deploy'), 'Home path must be removed');
  assert(clean.includes('[REDACTED_PATH]'), 'Must contain [REDACTED_PATH]');
});

test('sanitizeString removes stack trace frames', () => {
  const raw = 'Runtime Error: overflow\n    at calculate (math.ts:45:12)\n    at Object.run (app.ts:12:3)';
  const clean = sanitizeString(raw);
  assert(!clean.includes('math.ts'), 'Stack trace file must be removed');
  assert(!clean.includes('app.ts'), 'Stack trace line must be removed');
  assert(clean.startsWith('Runtime Error: overflow'), 'Base message preserved');
});

test('sanitizeDetails redacts sensitive dictionary keys', () => {
  const sensitiveObj = {
    userName: 'alice',
    password: 'supersecretpassword123',
    token: 'jwt.eyJhbGciOi...',
    secret: 'my_private_hmac_secret',
    privateKey: '-----BEGIN PRIVATE KEY-----',
    apiKey: 'ak_live_abcdef123456',
    normalField: 'acceptable_data',
    nested: {
      credentials: { user: 'bob', token: 'bearer_token' },
      safeNested: 100,
    },
  };

  const clean = sanitizeDetails(sensitiveObj)!;
  assert(clean.userName === 'alice', 'Safe field preserved');
  assert(clean.password === '[REDACTED]', 'password redacted');
  assert(clean.token === '[REDACTED]', 'token redacted');
  assert(clean.secret === '[REDACTED]', 'secret redacted');
  assert(clean.privateKey === '[REDACTED]', 'privateKey redacted');
  assert(clean.apiKey === '[REDACTED]', 'apiKey redacted');
  assert(clean.normalField === 'acceptable_data', 'normalField preserved');

  const nested = clean.nested as any;
  assert(nested.credentials === '[REDACTED]', 'nested credentials redacted');
  assert(nested.safeNested === 100, 'nested safe value preserved');
});

test('sanitizeDetails handles circular references gracefully without crash', () => {
  const circular: any = { field: 'value' };
  circular.self = circular;

  const clean = sanitizeDetails(circular)!;
  assert(clean.field === 'value', 'Value preserved');
  assert((clean.self as any)['[CIRCULAR]'] === true, 'Circular reference marked safe');
});

// ═════════════════════════════════════════════════════════════════════════════
// 10. Malformed Inputs Rejection & Validation
// ═════════════════════════════════════════════════════

console.log('10. Malformed Inputs Rejection & Validation:');

test('createSuccessResponse rejects empty correlationId', () => {
  assertThrows(() => {
    createSuccessResponse('', { data: 1 });
  }, 'correlationId must be a non-empty string');
});

test('createErrorResponse rejects empty parameters', () => {
  assertThrows(() => {
    createErrorResponse('', 'PROTOCOL_ERROR', 'ERR_CODE', 'msg');
  }, 'correlationId');

  assertThrows(() => {
    createErrorResponse('CORR_1', '' as any, 'ERR_CODE', 'msg');
  }, 'category');

  assertThrows(() => {
    createErrorResponse('CORR_1', 'PROTOCOL_ERROR', '', 'msg');
  }, 'code');
});

test('validateResponse accepts valid success and error responses', () => {
  const success = createSuccessResponse('CORR_V1', { val: 'ok' });
  const error = createProtocolError('CORR_V2', 'ERR_PROTOCOL_MALFORMED_FRAME', 'Frame invalid');

  assert(validateResponse(success).isValid, 'Success response is valid');
  assert(validateResponse(error).isValid, 'Error response is valid');
});

test('validateResponse rejects malformed response objects', () => {
  assert(!validateResponse(null).isValid, 'Rejects null');
  assert(!validateResponse([]).isValid, 'Rejects array');
  assert(!validateResponse('string').isValid, 'Rejects string');
  assert(!validateResponse({ status: 'OTHER' }).isValid, 'Rejects unknown status');
  assert(!validateResponse({ status: 'SUCCESS', responseId: 'BAD_ID' }).isValid, 'Rejects bad responseId prefix');
  assert(!validateResponse({ status: 'SUCCESS', responseId: 'RSP_123', correlationId: '', timestamp: 100, statusCode: 200 }).isValid, 'Rejects empty correlationId');
  assert(!validateResponse({ status: 'SUCCESS', responseId: 'RSP_123', correlationId: 'C1', timestamp: -1, statusCode: 200, payload: 1 }).isValid, 'Rejects negative timestamp');
  assert(!validateResponse({ status: 'SUCCESS', responseId: 'RSP_123', correlationId: 'C1', timestamp: 100, statusCode: 999, payload: 1 }).isValid, 'Rejects out-of-bounds statusCode');
  assert(!validateResponse({ status: 'SUCCESS', responseId: 'RSP_123', correlationId: 'C1', timestamp: 100, statusCode: 200 }).isValid, 'Rejects SUCCESS without payload');
  assert(!validateResponse({ status: 'ERROR', responseId: 'RSP_123', correlationId: 'C1', timestamp: 100, statusCode: 400 }).isValid, 'Rejects ERROR without error object');
});

// ═════════════════════════════════════════════════════════════════════════════
// 11. Cross-Subsystem Integration
// ═════════════════════════════════════════════════════

console.log('11. Cross-Subsystem Integration:');

test('fromEnvelopeValidation maps valid result to SUCCESS', () => {
  const validEnvelope = createEnvelope({
    kind: 'REQUEST',
    source: createProtocolAddress({ network: 'CUBIO', dimension: 0, zone: 1, node: 1, service: 'TERMINAL' }),
    destination: createProtocolAddress({ network: 'CUBIO', dimension: 0, zone: 1, node: 2, service: 'INTELLIGENCE' }),
    sender: { cubId: 'CUB-AAAA0001', entityType: 'USER', signature: '0xSIG_VALID_01' },
    payload: {
      category: 'DIRECT_MESSAGE',
      priority: 'NORMAL',
      contentType: 'application/json',
      body: { hello: 1 },
      bodyBytes: 11,
    },
  });

  const validationResult: EnvelopeValidationResult = {
    valid: true,
    errors: [],
    envelope: validEnvelope,
  };

  const res = fromEnvelopeValidation('CORR_ENV_OK', validationResult);
  assert(res.status === 'SUCCESS', 'Must produce SUCCESS');
  assert(res.statusCode === 200, 'Status code is 200');
  assert((res as CubiOSuccessResponse<ProtocolEnvelope>).payload.envelopeId === validEnvelope.envelopeId, 'Envelope preserved');
});

test('fromEnvelopeValidation maps invalid result to ERROR with classified category', () => {
  const validationResult: EnvelopeValidationResult = {
    valid: false,
    errors: [
      {
        code: 'ERR_INVALID_COORDINATE',
        message: 'Dimension index 999 exceeds maximum 99',
        field: 'destination.dimension',
      },
    ],
  };

  const res = fromEnvelopeValidation('CORR_ENV_ERR', validationResult);
  assert(res.status === 'ERROR', 'Must produce ERROR');
  assert(res.statusCode === 400, 'Status code is 400');
  const errRes = res as CubiOErrorResponse;
  assert(errRes.error.category === 'VALIDATION_ERROR', 'Category is VALIDATION_ERROR');
  assert(errRes.error.code === 'ERR_INVALID_COORDINATE', 'Code matches');
  assert(errRes.error.details?.field === 'destination.dimension', 'Field preserved in details');
});

test('fromVersionNegotiation maps ACCEPTED handshake to SUCCESS', () => {
  const acceptedHandshake: VersionNegotiationResult = {
    status: 'ACCEPTED',
    selectedVersion: { major: 1, minor: 0, patch: 0 },
    versionString: 'CNP/1.0.0',
    agreedCapabilities: ['STREAMING', 'ROUTING'],
    responderNodeId: 'NODE_ALPHA',
    serverImplementation: 'cubio-core/1.0.0',
    supportedRange: {
      min: { major: 1, minor: 0, patch: 0 },
      max: { major: 1, minor: 99, patch: 999 },
    },
  };

  const res = fromVersionNegotiation('CORR_VER_OK', acceptedHandshake);
  assert(res.status === 'SUCCESS', 'Produces SUCCESS');
  assert((res as any).payload.versionString === 'CNP/1.0.0', 'Version preserved');
});

test('fromVersionNegotiation maps REJECTED handshake to VERSION_ERROR', () => {
  const rejectedHandshake: VersionNegotiationResult = {
    status: 'REJECTED',
    rejectionCode: 'ERR_VERSION_INCOMPATIBLE',
    rejectionReason: 'Major version mismatch: requires CNP/1.x, received CNP/2.x',
    responderNodeId: 'NODE_BETA',
    serverImplementation: 'cubio-core/1.0.0',
    supportedRange: {
      min: { major: 1, minor: 0, patch: 0 },
      max: { major: 1, minor: 99, patch: 999 },
    },
  };

  const res = fromVersionNegotiation('CORR_VER_FAIL', rejectedHandshake);
  assert(res.status === 'ERROR', 'Produces ERROR');
  const errRes = res as CubiOErrorResponse;
  assert(errRes.error.category === 'VERSION_ERROR', 'Category is VERSION_ERROR');
  assert(errRes.error.code === 'ERR_VERSION_INCOMPATIBLE', 'Code matches');
  assert(errRes.statusCode === 426, 'Status is 426 Upgrade Required');
});

// ═════════════════════════════════════════════════════════════════════════════
// 12. Deterministic Serialization & Canonical Hashing (RFC 8785)
// ═════════════════════════════════════════════════════

console.log('12. Deterministic Serialization & Canonical Hashing (RFC 8785):');

test('serializeResponse and deserializeResponse round-trip faithfully', () => {
  const orig = createSuccessResponse('CORR_RT', { data: 'test', count: 123 }, {
    timestamp: 1700000000000,
    metadata: { tag: 'unit-test' },
  });

  const serialized = serializeResponse(orig);
  assert(typeof serialized === 'string', 'Serialized to string');
  assert(!serialized.includes(' '), 'No whitespace in RFC 8785 JSON');

  const deserialized = deserializeResponse<{ data: string; count: number }>(serialized);
  assert(deserialized.status === 'SUCCESS', 'Status matches');
  assert(deserialized.correlationId === orig.correlationId, 'CorrelationId matches');
  assert(deserialized.responseId === orig.responseId, 'ResponseId matches');
  assert(deserialized.timestamp === orig.timestamp, 'Timestamp matches');
  assert(deserialized.statusCode === orig.statusCode, 'StatusCode matches');

  const successRes = deserialized as CubiOSuccessResponse<{ data: string; count: number }>;
  assert(successRes.payload.data === 'test', 'Payload data matches');
  assert(successRes.payload.count === 123, 'Payload count matches');
  assert(successRes.metadata?.tag === 'unit-test', 'Metadata matches');
});

test('serializeResponse round-trips error responses', () => {
  const origErr = createValidationError(
    'CORR_RT_ERR',
    'ERR_VALIDATION_FAILED',
    'Payload format is invalid',
    { timestamp: 1700000000000, details: { missingField: 'dimension' } }
  );

  const serialized = serializeResponse(origErr);
  const deserialized = deserializeResponse(serialized) as CubiOErrorResponse;

  assert(deserialized.status === 'ERROR', 'Status is ERROR');
  assert(deserialized.error.category === 'VALIDATION_ERROR', 'Category matches');
  assert(deserialized.error.code === 'ERR_VALIDATION_FAILED', 'Code matches');
  assert(deserialized.error.message === 'Payload format is invalid', 'Message matches');
  assert(deserialized.error.details?.missingField === 'dimension', 'Details matches');
});

test('responseHash produces invariant content-addressable hash across 100 runs', () => {
  const res = createSuccessResponse('CORR_HASH_TEST', { num: 42, active: true }, {
    timestamp: 1700000000000,
  });

  const baseHash = responseHash(res);
  assert(baseHash.startsWith('0x'), 'Hash has 0x prefix');

  for (let i = 0; i < 100; i++) {
    const iterHash = responseHash(res);
    assert(iterHash === baseHash, `Iteration ${i} hash must match baseline`);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
console.log(`\nResults: ${passed} passed, ${failed} failed\n`);

if (failed > 0) {
  process.exit(1);
}
