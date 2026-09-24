/**
 * CUBiO Network Protocol v1 — Focused Test Suite
 * ============================================================
 *
 * Tests the canonical CNP/1 specification implementation:
 *   1. Address creation & validation
 *   2. Envelope factory & deterministic ID generation
 *   3. Full envelope validation (all invariants)
 *   4. Lifecycle state machine (valid transitions, terminal states, retries, expiry)
 *   5. Version negotiation
 *   6. Trace routing
 *   7. Error envelope generation (PONG, NACK)
 *   8. Edge cases / rejection scenarios
 *
 * Run with:  npx tsx src/cubio/network/protocol/v1/protocolEngine.test.ts
 */

import {
  createProtocolAddress,
  parseProtocolAddress,
  createEnvelope,
  createPong,
  createNack,
  validateEnvelope,
  parseVersionString,
  formatVersionString,
  checkVersionCompatibility,
  negotiateVersion,
  createLifecycle,
  transitionLifecycle,
  isTerminalState,
  appendTraceHop,
} from './protocolEngine';
import {
  PROTOCOL_VERSION_STRING,
  PROTOCOL_VERSION,
  MAX_PAYLOAD_BYTES,
  MAX_ENVELOPE_TTL_MS,
  DEFAULT_ENVELOPE_TTL_MS,
  MAX_TRACE_HOPS,
} from './types';
import type {
  ProtocolAddress,
  ProtocolPrincipal,
  ProtocolPayload,
  ProtocolEnvelope,
  EnvelopeLifecycleState,
} from './types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const failures: string[] = [];

function assert(condition: boolean, label: string): void {
  if (condition) {
    passed++;
  } else {
    failed++;
    failures.push(label);
    console.error(`  ✗ FAIL: ${label}`);
  }
}

function assertThrows(fn: () => void, label: string): void {
  try {
    fn();
    failed++;
    failures.push(label);
    console.error(`  ✗ FAIL (expected throw): ${label}`);
  } catch {
    passed++;
  }
}

function makeAddress(dim = 0, zone = 1, node = 1, service = 'TERMINAL'): ProtocolAddress {
  return createProtocolAddress({ network: 'CUBIO', dimension: dim, zone, node, service });
}

function makePrincipal(cubId = 'CUB-AAAA0001', entityType: 'USER' | 'SERVICE' = 'USER'): ProtocolPrincipal {
  return { cubId, entityType, signature: '0xSIG_test' };
}

function makePayload<T>(body: T, category: any = 'DIRECT_MESSAGE'): ProtocolPayload<T> {
  const serialized = JSON.stringify(body);
  return {
    category,
    priority: 'NORMAL',
    contentType: 'application/json',
    body,
    bodyBytes: serialized.length,
  };
}

function makeValidEnvelope(): ProtocolEnvelope {
  return createEnvelope({
    kind: 'REQUEST',
    source: makeAddress(0, 1, 1, 'TERMINAL'),
    destination: makeAddress(0, 1, 2, 'INTELLIGENCE'),
    sender: makePrincipal(),
    payload: makePayload({ text: 'hello' }),
  });
}

// ─── Test Suites ─────────────────────────────────────────────────────────────

function testAddressCreation(): void {
  console.log('\n─── Address Creation & Parsing ───');

  // Valid address via coordinate
  const addr = makeAddress(0, 1, 1, 'TERMINAL');
  assert(addr.uri === 'CUBIO://NETWORK/0/01/00001/TERMINAL', 'Address URI correctly formatted');
  assert(addr.coordinate.network === 'CUBIO', 'Address network is CUBIO');
  assert(addr.coordinate.dimension === 0, 'Address dimension is 0');
  assert(addr.coordinate.zone === 1, 'Address zone is 1');
  assert(addr.coordinate.node === 1, 'Address node is 1');
  assert(addr.coordinate.service === 'TERMINAL', 'Address service is TERMINAL');

  // Parse from URI
  const parsed = parseProtocolAddress('CUBIO://NETWORK/5/03/00042/STORAGE');
  assert(parsed.coordinate.dimension === 5, 'Parsed dimension correct');
  assert(parsed.coordinate.zone === 3, 'Parsed zone correct');
  assert(parsed.coordinate.node === 42, 'Parsed node correct');
  assert(parsed.coordinate.service === 'STORAGE', 'Parsed service correct');
  assert(parsed.uri === 'CUBIO://NETWORK/5/03/00042/STORAGE', 'Parsed URI matches');

  // Invalid coordinate throws
  assertThrows(
    () => createProtocolAddress({ network: 'CUBIO', dimension: -1, zone: 0, node: 0, service: 'X' }),
    'Negative dimension rejected'
  );
  assertThrows(
    () => createProtocolAddress({ network: 'CUBIO', dimension: 0, zone: 100, node: 0, service: 'X' }),
    'Zone out of range rejected'
  );
  assertThrows(
    () => parseProtocolAddress('HTTP://EXAMPLE.COM'),
    'Non-CUBIO URI rejected'
  );
}

function testEnvelopeFactory(): void {
  console.log('\n─── Envelope Factory ───');

  const env = makeValidEnvelope();
  assert(env.protocolVersion === PROTOCOL_VERSION_STRING, 'Envelope has correct protocol version');
  assert(env.envelopeId.startsWith('ENV_'), 'Envelope ID starts with ENV_');
  assert(env.kind === 'REQUEST', 'Envelope kind is REQUEST');
  assert(env.ttlMs === DEFAULT_ENVELOPE_TTL_MS, 'Default TTL applied');
  assert(env.traceRoute.length === 1, 'Initial trace has one hop (source)');
  assert(env.traceRoute[0] === env.source.uri, 'First trace hop is source URI');
  assert(env.timestamp > 0, 'Timestamp is positive');
  assert(env.payload.category === 'DIRECT_MESSAGE', 'Payload category correct');
  assert(env.payload.priority === 'NORMAL', 'Payload priority correct');
  assert(env.payload.contentType === 'application/json', 'Content type correct');

  // Determinism — same inputs within the same millisecond still produce unique IDs
  // (because timestamp is part of the hash; if called fast enough the nonce varies)
  const env2 = createEnvelope({
    kind: 'REQUEST',
    source: makeAddress(0, 1, 1, 'TERMINAL'),
    destination: makeAddress(0, 1, 2, 'INTELLIGENCE'),
    sender: makePrincipal(),
    payload: makePayload({ text: 'hello' }),
    nonce: 'UNIQUE_NONCE_A',
  });
  const env3 = createEnvelope({
    kind: 'REQUEST',
    source: makeAddress(0, 1, 1, 'TERMINAL'),
    destination: makeAddress(0, 1, 2, 'INTELLIGENCE'),
    sender: makePrincipal(),
    payload: makePayload({ text: 'hello' }),
    nonce: 'UNIQUE_NONCE_B',
  });
  assert(env2.envelopeId !== env3.envelopeId, 'Different nonces produce different IDs');

  // Custom TTL
  const env4 = createEnvelope({
    kind: 'EVENT',
    source: makeAddress(),
    destination: makeAddress(0, 2, 5, 'MAIL'),
    sender: makePrincipal(),
    payload: makePayload({ event: 'test' }, 'SYSTEM_NOTIFICATION'),
    ttlMs: 5000,
  });
  assert(env4.ttlMs === 5000, 'Custom TTL applied');
  assert(env4.kind === 'EVENT', 'Kind EVENT preserved');
}

function testEnvelopeValidation(): void {
  console.log('\n─── Envelope Validation ───');

  // Valid envelope passes
  const env = makeValidEnvelope();
  const result = validateEnvelope(env);
  assert(result.valid === true, 'Valid envelope passes validation');
  assert(result.errors.length === 0, 'No errors on valid envelope');

  // Missing protocolVersion
  const noVersion = { ...env, protocolVersion: '' };
  const r1 = validateEnvelope(noVersion);
  assert(r1.valid === false, 'Missing version fails');
  assert(r1.errors.some(e => e.code === 'ERR_INVALID_VERSION'), 'ERR_INVALID_VERSION code present');

  // Incompatible version
  const badVersion = { ...env, protocolVersion: 'CNP/2.0' };
  const r2 = validateEnvelope(badVersion);
  assert(r2.valid === false, 'Incompatible major version fails');
  assert(r2.errors.some(e => e.code === 'ERR_VERSION_INCOMPATIBLE'), 'ERR_VERSION_INCOMPATIBLE code present');

  // Missing envelope ID
  const noId = { ...env, envelopeId: '' };
  const r3 = validateEnvelope(noId);
  assert(r3.valid === false, 'Missing envelope ID fails');

  // Missing source
  const noSrc = { ...env, source: null };
  const r4 = validateEnvelope(noSrc);
  assert(r4.valid === false, 'Missing source fails');

  // Missing destination
  const noDest = { ...env, destination: null };
  const r5 = validateEnvelope(noDest);
  assert(r5.valid === false, 'Missing destination fails');

  // Invalid sender cubId
  const badSender = { ...env, sender: { cubId: 'INVALID', entityType: 'USER', signature: '0x' } };
  const r6 = validateEnvelope(badSender);
  assert(r6.valid === false, 'Invalid sender cubId fails');
  assert(r6.errors.some(e => e.code === 'ERR_INVALID_SENDER_ID'), 'ERR_INVALID_SENDER_ID code present');

  // TTL too large
  const bigTtl = { ...env, ttlMs: MAX_ENVELOPE_TTL_MS + 1 };
  const r7 = validateEnvelope(bigTtl);
  assert(r7.valid === false, 'Oversized TTL fails');
  assert(r7.errors.some(e => e.code === 'ERR_INVALID_TTL'), 'ERR_INVALID_TTL code present');

  // Expired envelope
  const expired = { ...env, timestamp: Date.now() - 60_000, ttlMs: 1 };
  const r8 = validateEnvelope(expired);
  assert(r8.valid === false, 'Expired envelope fails');
  assert(r8.errors.some(e => e.code === 'ERR_ENVELOPE_EXPIRED'), 'ERR_ENVELOPE_EXPIRED code present');

  // Payload too large
  const bigPayload = {
    ...env,
    payload: { ...env.payload, bodyBytes: MAX_PAYLOAD_BYTES + 1 },
  };
  const r9 = validateEnvelope(bigPayload);
  assert(r9.valid === false, 'Oversized payload fails');
  assert(r9.errors.some(e => e.code === 'ERR_PAYLOAD_TOO_LARGE'), 'ERR_PAYLOAD_TOO_LARGE code present');

  // Invalid payload category
  const badCat = {
    ...env,
    payload: { ...env.payload, category: 'INVALID_CATEGORY' },
  };
  const r10 = validateEnvelope(badCat);
  assert(r10.valid === false, 'Invalid payload category fails');

  // Null input
  const rNull = validateEnvelope(null);
  assert(rNull.valid === false, 'Null envelope fails');

  // Trace route too long
  const longTrace = {
    ...env,
    traceRoute: Array.from({ length: MAX_TRACE_HOPS + 1 }, (_, i) => `CUBIO://NETWORK/0/01/0000${i}/TEST`),
  };
  const r11 = validateEnvelope(longTrace);
  assert(r11.valid === false, 'Trace route exceeding max hops fails');
}

function testLifecycleStateMachine(): void {
  console.log('\n─── Lifecycle State Machine ───');

  const lc = createLifecycle('ENV_TEST001', Date.now(), 30_000, 3);
  assert(lc.currentState === 'CREATED', 'Initial state is CREATED');
  assert(lc.retryCount === 0, 'Initial retry count is 0');
  assert(lc.transitions.length === 0, 'No initial transitions');

  // CREATED → VALIDATED
  const lc1 = transitionLifecycle(lc, 'VALIDATED', 'Passed all checks');
  assert(lc1.currentState === 'VALIDATED', 'Transitioned to VALIDATED');
  assert(lc1.transitions.length === 1, 'One transition recorded');
  assert(lc1.transitions[0].from === 'CREATED', 'Transition from CREATED');
  assert(lc1.transitions[0].to === 'VALIDATED', 'Transition to VALIDATED');

  // VALIDATED → ROUTED
  const lc2 = transitionLifecycle(lc1, 'ROUTED', 'Destination resolved');
  assert(lc2.currentState === 'ROUTED', 'Transitioned to ROUTED');

  // ROUTED → DELIVERED
  const lc3 = transitionLifecycle(lc2, 'DELIVERED', 'Payload delivered');
  assert(lc3.currentState === 'DELIVERED', 'Transitioned to DELIVERED');

  // DELIVERED → ACKNOWLEDGED
  const lc4 = transitionLifecycle(lc3, 'ACKNOWLEDGED', 'ACK received');
  assert(lc4.currentState === 'ACKNOWLEDGED', 'Transitioned to ACKNOWLEDGED');
  assert(isTerminalState('ACKNOWLEDGED'), 'ACKNOWLEDGED is terminal');
  assert(lc4.transitions.length === 4, 'Four transitions total');

  // Terminal states
  assert(isTerminalState('REJECTED'), 'REJECTED is terminal');
  assert(isTerminalState('UNROUTABLE'), 'UNROUTABLE is terminal');
  assert(isTerminalState('EXPIRED'), 'EXPIRED is terminal');
  assert(!isTerminalState('CREATED'), 'CREATED is not terminal');
  assert(!isTerminalState('ROUTED'), 'ROUTED is not terminal');

  // Invalid transition throws
  assertThrows(
    () => transitionLifecycle(lc, 'DELIVERED', 'Skip ahead'),
    'CREATED → DELIVERED is invalid'
  );
  assertThrows(
    () => transitionLifecycle(lc4, 'ROUTED', 'From terminal'),
    'Cannot transition from ACKNOWLEDGED (terminal)'
  );

  // CREATED → REJECTED
  const lcRejected = transitionLifecycle(lc, 'REJECTED', 'Validation failed');
  assert(lcRejected.currentState === 'REJECTED', 'CREATED → REJECTED valid');

  // RETRY mechanics
  const lcRouted = transitionLifecycle(
    transitionLifecycle(lc, 'VALIDATED', 'ok'),
    'ROUTED', 'ok'
  );
  const lcRetry1 = transitionLifecycle(lcRouted, 'RETRY', 'Timeout');
  assert(lcRetry1.currentState === 'RETRY', 'Transitioned to RETRY');
  assert(lcRetry1.retryCount === 1, 'Retry count incremented');

  // RETRY → ROUTED → RETRY → ROUTED → RETRY (max = 3, so 3 retries allowed)
  let lcR = lcRetry1;
  lcR = transitionLifecycle(lcR, 'ROUTED', 'Rerouted');
  lcR = transitionLifecycle(lcR, 'RETRY', 'Timeout 2');
  assert(lcR.retryCount === 2, 'Retry count is 2');
  lcR = transitionLifecycle(lcR, 'ROUTED', 'Rerouted');
  lcR = transitionLifecycle(lcR, 'RETRY', 'Timeout 3');
  assert(lcR.retryCount === 3, 'Retry count is 3');
  // 4th retry should force EXPIRED
  lcR = transitionLifecycle(lcR, 'ROUTED', 'Rerouted');
  const lcExhausted = transitionLifecycle(lcR, 'RETRY', 'Timeout 4');
  assert(lcExhausted.currentState === 'EXPIRED', 'Exceeding max retries forces EXPIRED');
}

function testVersionNegotiation(): void {
  console.log('\n─── Version Negotiation ───');

  // Parse valid version string
  const v1 = parseVersionString('CNP/1.0');
  assert(v1 !== null, 'Parsed CNP/1.0');
  assert(v1!.major === 1 && v1!.minor === 0, 'Version 1.0 parsed correctly');

  const v2 = parseVersionString('CNP/2.3');
  assert(v2 !== null && v2.major === 2 && v2.minor === 3, 'Version 2.3 parsed correctly');

  // Invalid strings
  assert(parseVersionString('HTTP/1.1') === null, 'Non-CNP prefix rejected');
  assert(parseVersionString('CNP/abc') === null, 'Non-numeric version rejected');
  assert(parseVersionString('') === null, 'Empty string rejected');

  // Format version
  assert(formatVersionString({ major: 1, minor: 0 }) === 'CNP/1.0', 'Format produces CNP/1.0');
  assert(formatVersionString({ major: 3, minor: 7 }) === 'CNP/3.7', 'Format produces CNP/3.7');

  // Compatibility check
  const c1 = checkVersionCompatibility('CNP/1.0');
  assert(c1.accepted === true, 'CNP/1.0 is compatible');

  const c2 = checkVersionCompatibility('CNP/2.0');
  assert(c2.accepted === false, 'CNP/2.0 is incompatible (major mismatch)');

  const c3 = checkVersionCompatibility('GARBAGE');
  assert(c3.accepted === false, 'Unparseable version rejected');

  // Negotiate from offered list
  const n1 = negotiateVersion({
    offeredVersions: [{ major: 1, minor: 0 }, { major: 1, minor: 1 }],
    preferredVersion: { major: 1, minor: 1 },
    implementationId: 'test-client',
  });
  assert(n1.accepted === true, 'Negotiation accepted');
  assert(n1.negotiatedVersion?.minor === 1, 'Highest compatible minor selected');

  // No compatible version
  const n2 = negotiateVersion({
    offeredVersions: [{ major: 2, minor: 0 }, { major: 3, minor: 0 }],
    preferredVersion: { major: 2, minor: 0 },
    implementationId: 'test-client',
  });
  assert(n2.accepted === false, 'No compatible version → rejected');
}

function testTraceRouting(): void {
  console.log('\n─── Trace Routing ───');

  const env = makeValidEnvelope();
  assert(env.traceRoute.length === 1, 'Initial trace has 1 hop');

  const env2 = appendTraceHop(env, 'CUBIO://NETWORK/0/01/00003/ROUTER');
  assert(env2.traceRoute.length === 2, 'Trace extended to 2 hops');
  assert(env2.traceRoute[1] === 'CUBIO://NETWORK/0/01/00003/ROUTER', 'Second hop correct');
  // Original unchanged (immutability)
  assert(env.traceRoute.length === 1, 'Original envelope unchanged');

  // Max hops enforcement
  let envFull = env;
  for (let i = 1; i < MAX_TRACE_HOPS; i++) {
    envFull = appendTraceHop(envFull, `CUBIO://NETWORK/0/01/${String(i).padStart(5, '0')}/ROUTER`);
  }
  assert(envFull.traceRoute.length === MAX_TRACE_HOPS, `Trace filled to ${MAX_TRACE_HOPS} hops`);
  assertThrows(
    () => appendTraceHop(envFull, 'CUBIO://NETWORK/0/01/99999/OVERFLOW'),
    'Exceeding max trace hops throws'
  );
}

function testControlEnvelopes(): void {
  console.log('\n─── PONG & NACK Control Envelopes ───');

  const ping = createEnvelope({
    kind: 'PING',
    source: makeAddress(0, 1, 1, 'TERMINAL'),
    destination: makeAddress(0, 1, 2, 'INTELLIGENCE'),
    sender: makePrincipal('CUB-AAAA0001'),
    payload: makePayload({ pingTimestamp: Date.now() }, 'HEALTH_CHECK'),
  });

  // PONG
  const pong = createPong(
    ping,
    makeAddress(0, 1, 2, 'INTELLIGENCE'),
    makePrincipal('CUB-BBBB0002', 'SERVICE'),
  );
  assert(pong.kind === 'PONG', 'PONG kind correct');
  assert(pong.correlationId === ping.envelopeId, 'PONG correlates to PING');
  assert(pong.destination.uri === ping.source.uri, 'PONG destination is PING source');
  assert(pong.payload.category === 'HEALTH_CHECK', 'PONG category is HEALTH_CHECK');
  const pongVal = validateEnvelope(pong);
  assert(pongVal.valid === true, 'PONG passes validation');

  // NACK
  const badEnv = makeValidEnvelope();
  const nack = createNack(
    badEnv,
    makeAddress(0, 1, 2, 'INTELLIGENCE'),
    makePrincipal('CUB-BBBB0002', 'SERVICE'),
    [{ code: 'ERR_PAYLOAD_TOO_LARGE', message: 'Payload exceeds limit' }],
  );
  assert(nack.kind === 'NACK', 'NACK kind correct');
  assert(nack.correlationId === badEnv.envelopeId, 'NACK correlates to rejected envelope');
  assert(nack.payload.category === 'SYSTEM_NOTIFICATION', 'NACK category is SYSTEM_NOTIFICATION');
  assert(nack.payload.priority === 'HIGH', 'NACK priority is HIGH');
}

// ─── Runner ──────────────────────────────────────────────────────────────────

console.log('═══════════════════════════════════════════════════════════');
console.log('  CUBiO Network Protocol v1 — Test Suite');
console.log(`  Protocol Version: ${PROTOCOL_VERSION_STRING}`);
console.log('═══════════════════════════════════════════════════════════');

testAddressCreation();
testEnvelopeFactory();
testEnvelopeValidation();
testLifecycleStateMachine();
testVersionNegotiation();
testTraceRouting();
testControlEnvelopes();

console.log('\n═══════════════════════════════════════════════════════════');
console.log(`  Results: ${passed} PASSED, ${failed} FAILED (${passed + failed} total)`);
if (failures.length > 0) {
  console.log('  Failures:');
  failures.forEach(f => console.log(`    • ${f}`));
}
console.log('═══════════════════════════════════════════════════════════');

if (failed > 0) {
  process.exit(1);
}
