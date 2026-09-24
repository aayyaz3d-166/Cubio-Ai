/**
 * CUBiO Network Protocol v1 — Canonical Network State Model Test Suite
 * ============================================================
 *
 * Comprehensive tests for Task 05:
 *   1. Cluster state transitions (valid paths, emergency HALT, invalid transition rejection)
 *   2. Node lifecycle transitions (valid progression, degradation, fault recovery, invalid rejection)
 *   3. Connection state transitions (handshake, established, backoff retry limit enforcement, invalid rejection)
 *   4. Protocol session state transitions (version negotiation, authentication, streaming, termination)
 *   5. Deterministic state hash and wire serialization/deserialization round-trip
 *   6. Automated network reconciliation and partition recovery
 *
 * Run with:  npx tsx src/cubio/network/protocol/v1/stateModel.test.ts
 */

import {
  CanonicalNetworkStateModel,
  CLUSTER_TRANSITIONS,
  NODE_TRANSITIONS,
  CONNECTION_TRANSITIONS,
  SESSION_TRANSITIONS,
  computeNetworkStateHash,
} from './stateModel';
import {
  type NetworkClusterState,
  type PeerConnectionState,
  type ProtocolSessionState,
} from './stateTypes';

// ─── Test Harness ─────────────────────────────────────────────────────────────

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

const NODE_A_ID = 'NODE_ALPHA_001';
const NODE_A_URI = 'CUBIO://NETWORK/0/01/00001/CORE';
const NODE_B_ID = 'NODE_BETA_002';
const NODE_B_URI = 'CUBIO://NETWORK/0/01/00002/RELAY';
const CONN_AB_ID = 'CONN_ALPHA_BETA';
const SESS_01_ID = 'SESS_001';

// ─── 1. Cluster State Transitions ───────────────────────────────────────────

function testClusterTransitions(): void {
  console.log('\n─── 1. Cluster State Transitions ───');

  const model = new CanonicalNetworkStateModel('BOOTSTRAP');
  assert(model.clusterState === 'BOOTSTRAP', 'Initial cluster state is BOOTSTRAP');

  // BOOTSTRAP -> FORMING
  model.transitionClusterState('FORMING', 'Seed nodes registered');
  assert(model.clusterState === 'FORMING', 'Transitioned to FORMING');

  // FORMING -> CONVERGED
  model.transitionClusterState('CONVERGED', 'Quorum established');
  assert(model.clusterState === 'CONVERGED', 'Transitioned to CONVERGED');

  // CONVERGED -> DEGRADED -> CONVERGED
  model.transitionClusterState('DEGRADED', 'Minor peer packet drops');
  assert(model.clusterState === 'DEGRADED', 'Transitioned to DEGRADED');
  model.transitionClusterState('CONVERGED', 'Packet drops resolved');
  assert(model.clusterState === 'CONVERGED', 'Recovered back to CONVERGED');

  // CONVERGED -> PARTITIONED -> RECONFIGURING -> CONVERGED
  model.transitionClusterState('PARTITIONED', 'Zone B subnet unreachable');
  assert(model.clusterState === 'PARTITIONED', 'Transitioned to PARTITIONED');
  model.transitionClusterState('RECONFIGURING', 'Re-synthesizing routing graph');
  assert(model.clusterState === 'RECONFIGURING', 'Transitioned to RECONFIGURING');
  model.transitionClusterState('CONVERGED', 'Healed mesh converged');
  assert(model.clusterState === 'CONVERGED', 'Healed back to CONVERGED');

  // Emergency safety freeze: CONVERGED -> HALTED
  model.transitionClusterState('HALTED', 'Security freeze commanded');
  assert(model.clusterState === 'HALTED', 'Transitioned to HALTED');

  // HALTED can only transition to BOOTSTRAP
  assertThrows(
    () => model.transitionClusterState('CONVERGED', 'Direct unhalt not allowed'),
    'Transition from HALTED directly to CONVERGED is rejected'
  );

  model.transitionClusterState('BOOTSTRAP', 'System reboot after freeze');
  assert(model.clusterState === 'BOOTSTRAP', 'HALTED successfully rebooted into BOOTSTRAP');

  // Invalid transition: BOOTSTRAP directly to CONVERGED
  assertThrows(
    () => model.transitionClusterState('CONVERGED', 'Skip forming'),
    'BOOTSTRAP directly to CONVERGED is rejected'
  );
}

// ─── 2. Node Lifecycle Transitions ───────────────────────────────────────────

function testNodeTransitions(): void {
  console.log('\n─── 2. Node State Transitions ───');

  const model = new CanonicalNetworkStateModel('CONVERGED');
  model.registerNode(NODE_A_ID, NODE_A_URI);

  const snapshot0 = model.getSnapshot();
  assert(snapshot0.nodes[NODE_A_ID].state === 'INITIALIZING', 'Initial node state is INITIALIZING');
  assert(snapshot0.nodes[NODE_A_ID].coordinateUri === NODE_A_URI, 'Node coordinate preserved');

  // Duplicate registration rejected
  assertThrows(
    () => model.registerNode(NODE_A_ID, NODE_A_URI),
    'Duplicate node registration rejected'
  );

  // INITIALIZING -> READY -> ONLINE
  model.transitionNodeState(NODE_A_ID, 'READY', 'Config validated');
  model.transitionNodeState(NODE_A_ID, 'ONLINE', 'Endpoints bound');
  assert(model.getSnapshot().nodes[NODE_A_ID].state === 'ONLINE', 'Node transitioned to ONLINE');

  // ONLINE -> DEGRADED -> ONLINE
  model.transitionNodeState(NODE_A_ID, 'DEGRADED', 'CPU throttling');
  assert(model.getSnapshot().nodes[NODE_A_ID].state === 'DEGRADED', 'Node transitioned to DEGRADED');
  model.transitionNodeState(NODE_A_ID, 'ONLINE', 'CPU normal');
  assert(model.getSnapshot().nodes[NODE_A_ID].state === 'ONLINE', 'Node recovered to ONLINE');

  // ONLINE -> FAULTED -> INITIALIZING (Crash & re-bootstrap)
  model.transitionNodeState(NODE_A_ID, 'FAULTED', 'Out of memory crash');
  assert(model.getSnapshot().nodes[NODE_A_ID].state === 'FAULTED', 'Node transitioned to FAULTED');
  model.transitionNodeState(NODE_A_ID, 'INITIALIZING', 'Re-bootstrap from fault');
  assert(model.getSnapshot().nodes[NODE_A_ID].state === 'INITIALIZING', 'Node re-bootstrapping');

  // INITIALIZING -> READY -> ONLINE -> DRAINING -> STOPPED
  model.transitionNodeState(NODE_A_ID, 'READY', 'Ready');
  model.transitionNodeState(NODE_A_ID, 'ONLINE', 'Online');
  model.transitionNodeState(NODE_A_ID, 'DRAINING', 'Shutdown request');
  model.transitionNodeState(NODE_A_ID, 'STOPPED', 'Clean stop');
  assert(model.getSnapshot().nodes[NODE_A_ID].state === 'STOPPED', 'Node transitioned to STOPPED');

  // STOPPED -> READY (Reboot)
  model.transitionNodeState(NODE_A_ID, 'READY', 'Reboot');
  assert(model.getSnapshot().nodes[NODE_A_ID].state === 'READY', 'Node rebooted to READY');

  // Invalid transition: READY directly to STOPPED or DRAINING
  assertThrows(
    () => model.transitionNodeState(NODE_A_ID, 'DRAINING', 'Cannot drain from READY'),
    'READY directly to DRAINING rejected'
  );

  // Transition on unknown node throws
  assertThrows(
    () => model.transitionNodeState('NODE_NON_EXISTENT', 'ONLINE', 'test'),
    'Unknown node transition throws'
  );
}

// ─── 3. Peer Connection Transitions & Retry Boundaries ───────────────────────

function testConnectionTransitions(): void {
  console.log('\n─── 3. Connection State Transitions ───');

  const model = new CanonicalNetworkStateModel('CONVERGED');
  model.registerConnection(CONN_AB_ID, NODE_A_ID, NODE_B_ID, NODE_B_URI, 3);

  let snap = model.getSnapshot();
  assert(snap.connections[CONN_AB_ID].state === 'DISCONNECTED', 'Initial connection state is DISCONNECTED');
  assert(snap.connections[CONN_AB_ID].retryCount === 0, 'Initial retryCount is 0');

  // DISCONNECTED -> CONNECTING -> HANDSHAKING -> ESTABLISHED
  model.transitionConnectionState(CONN_AB_ID, 'CONNECTING', 'Dialing peer');
  model.transitionConnectionState(CONN_AB_ID, 'HANDSHAKING', 'TCP open, sending CNP handshake');
  model.transitionConnectionState(CONN_AB_ID, 'ESTABLISHED', 'Handshake accepted');

  snap = model.getSnapshot();
  assert(snap.connections[CONN_AB_ID].state === 'ESTABLISHED', 'Connection ESTABLISHED');
  assert(snap.connections[CONN_AB_ID].establishedAt !== undefined, 'establishedAt timestamp set');

  // ESTABLISHED -> FAILED -> RECONNECTING -> CONNECTING -> HANDSHAKING -> ESTABLISHED
  model.transitionConnectionState(CONN_AB_ID, 'FAILED', 'Connection reset by peer');
  snap = model.getSnapshot();
  assert(snap.connections[CONN_AB_ID].state === 'FAILED', 'Connection transitioned to FAILED');

  model.transitionConnectionState(CONN_AB_ID, 'RECONNECTING', 'Initiating backoff retry 1');
  snap = model.getSnapshot();
  assert(snap.connections[CONN_AB_ID].state === 'RECONNECTING', 'Connection RECONNECTING');
  assert(snap.connections[CONN_AB_ID].retryCount === 1, 'retryCount is 1');

  // Re-establish connection resets retryCount
  model.transitionConnectionState(CONN_AB_ID, 'CONNECTING', 'Retry dial');
  model.transitionConnectionState(CONN_AB_ID, 'HANDSHAKING', 'Handshake');
  model.transitionConnectionState(CONN_AB_ID, 'ESTABLISHED', 'Re-established');
  snap = model.getSnapshot();
  assert(snap.connections[CONN_AB_ID].retryCount === 0, 'Successful establishment resets retryCount to 0');

  // Test Retry Boundary Exhaustion (maxRetries = 3)
  model.transitionConnectionState(CONN_AB_ID, 'FAILED', 'Link dropped');
  model.transitionConnectionState(CONN_AB_ID, 'RECONNECTING', 'Retry 1'); // count = 1
  model.transitionConnectionState(CONN_AB_ID, 'FAILED', 'Fail 1');
  model.transitionConnectionState(CONN_AB_ID, 'RECONNECTING', 'Retry 2'); // count = 2
  model.transitionConnectionState(CONN_AB_ID, 'FAILED', 'Fail 2');
  model.transitionConnectionState(CONN_AB_ID, 'RECONNECTING', 'Retry 3'); // count = 3
  model.transitionConnectionState(CONN_AB_ID, 'FAILED', 'Fail 3');
  // 4th retry exceeds maxRetries (3) -> auto-forces to DISCONNECTED
  model.transitionConnectionState(CONN_AB_ID, 'RECONNECTING', 'Retry 4 (should exceed)');
  snap = model.getSnapshot();
  assert(snap.connections[CONN_AB_ID].state === 'DISCONNECTED', 'Exceeding maxRetries forces state to DISCONNECTED');
  assert(snap.connections[CONN_AB_ID].lastError === 'Max retries exceeded', 'lastError records max retries exceeded');

  // Invalid transition: DISCONNECTED directly to ESTABLISHED
  assertThrows(
    () => model.transitionConnectionState(CONN_AB_ID, 'ESTABLISHED', 'Skip connecting'),
    'DISCONNECTED directly to ESTABLISHED is rejected'
  );
}

// ─── 4. Protocol Session Transitions ─────────────────────────────────────────

function testProtocolSessionTransitions(): void {
  console.log('\n─── 4. Protocol Session State Transitions ───');

  const model = new CanonicalNetworkStateModel('CONVERGED');
  model.registerConnection(CONN_AB_ID, NODE_A_ID, NODE_B_ID, NODE_B_URI);

  // Cannot create session on DISCONNECTED connection
  assertThrows(
    () => model.createSession(SESS_01_ID, CONN_AB_ID),
    'Cannot open session on unestablished connection'
  );

  // Establish connection
  model.transitionConnectionState(CONN_AB_ID, 'CONNECTING', 'Dial');
  model.transitionConnectionState(CONN_AB_ID, 'HANDSHAKING', 'Handshake');
  model.transitionConnectionState(CONN_AB_ID, 'ESTABLISHED', 'Ready');

  // Now create session
  model.createSession(SESS_01_ID, CONN_AB_ID);
  let snap = model.getSnapshot();
  assert(snap.sessions[SESS_01_ID].state === 'IDLE', 'Initial session state is IDLE');

  // IDLE -> VERSION_NEGOTIATING -> AUTHENTICATING -> STREAMING
  model.transitionSessionState(SESS_01_ID, 'VERSION_NEGOTIATING', 'Exchanging CNP version');
  model.transitionSessionState(SESS_01_ID, 'AUTHENTICATING', 'Version CNP/1.0 accepted', { version: 'CNP/1.0' });
  model.transitionSessionState(SESS_01_ID, 'STREAMING', 'Sovereign signature verified', { cubId: 'CUB-USER0001' });

  snap = model.getSnapshot();
  assert(snap.sessions[SESS_01_ID].state === 'STREAMING', 'Session is STREAMING');
  assert(snap.sessions[SESS_01_ID].negotiatedVersion === 'CNP/1.0', 'Negotiated version recorded');
  assert(snap.sessions[SESS_01_ID].authenticatedCubId === 'CUB-USER0001', 'Authenticated cubId recorded');

  // STREAMING -> PAUSED -> STREAMING -> TERMINATED
  model.transitionSessionState(SESS_01_ID, 'PAUSED', 'Backpressure applied');
  assert(model.getSnapshot().sessions[SESS_01_ID].state === 'PAUSED', 'Session PAUSED');
  model.transitionSessionState(SESS_01_ID, 'STREAMING', 'Backpressure cleared');
  assert(model.getSnapshot().sessions[SESS_01_ID].state === 'STREAMING', 'Session resumed to STREAMING');
  model.transitionSessionState(SESS_01_ID, 'TERMINATED', 'Stream completed');
  assert(model.getSnapshot().sessions[SESS_01_ID].state === 'TERMINATED', 'Session TERMINATED');

  // TERMINATED is terminal — no transitions allowed
  assertThrows(
    () => model.transitionSessionState(SESS_01_ID, 'STREAMING', 'Reopen'),
    'Transition out of TERMINATED session state is rejected'
  );
}

// ─── 5. Deterministic Serialization & Round-Trip ─────────────────────────────

function testStateSerializationAndRoundTrip(): void {
  console.log('\n─── 5. State Serialization & Round-Trip ───');

  const model = new CanonicalNetworkStateModel('CONVERGED');
  model.registerNode(NODE_A_ID, NODE_A_URI);
  model.transitionNodeState(NODE_A_ID, 'READY', 'Ready');
  model.transitionNodeState(NODE_A_ID, 'ONLINE', 'Online');

  model.registerNode(NODE_B_ID, NODE_B_URI);
  model.transitionNodeState(NODE_B_ID, 'READY', 'Ready');
  model.transitionNodeState(NODE_B_ID, 'ONLINE', 'Online');

  model.registerConnection(CONN_AB_ID, NODE_A_ID, NODE_B_ID, NODE_B_URI);
  model.transitionConnectionState(CONN_AB_ID, 'CONNECTING', 'Dial');
  model.transitionConnectionState(CONN_AB_ID, 'HANDSHAKING', 'Handshake');
  model.transitionConnectionState(CONN_AB_ID, 'ESTABLISHED', 'Established');

  model.createSession(SESS_01_ID, CONN_AB_ID);
  model.transitionSessionState(SESS_01_ID, 'VERSION_NEGOTIATING', 'Negotiating');
  model.transitionSessionState(SESS_01_ID, 'AUTHENTICATING', 'Authenticating', { version: 'CNP/1.0' });
  model.transitionSessionState(SESS_01_ID, 'STREAMING', 'Streaming', { cubId: 'CUB-USER0001' });

  const originalSnapshot = model.getSnapshot();
  assert(originalSnapshot.stateHash.startsWith('0xNET_'), 'Deterministic stateHash computed');

  const serialized = model.serialize();
  assert(typeof serialized === 'string', 'Serialized output is string');
  assert(serialized.includes(originalSnapshot.stateHash), 'Serialized string includes stateHash');

  // Deserialize into new model
  const deserializedModel = CanonicalNetworkStateModel.deserialize(serialized);
  const deserializedSnapshot = deserializedModel.getSnapshot();

  assert(deserializedSnapshot.epoch === originalSnapshot.epoch, 'Epoch preserved across deserialization');
  assert(deserializedSnapshot.clusterState === originalSnapshot.clusterState, 'Cluster state preserved');
  assert(deserializedSnapshot.stateHash === originalSnapshot.stateHash, 'State hash identical after deserialization');
  assert(Object.keys(deserializedSnapshot.nodes).length === 2, 'All nodes preserved');
  assert(Object.keys(deserializedSnapshot.connections).length === 1, 'All connections preserved');
  assert(Object.keys(deserializedSnapshot.sessions).length === 1, 'All sessions preserved');

  // Tampered serialized state throws checksum mismatch
  const tampered = serialized.replace('"state":"ONLINE"', '"state":"FAULTED"');
  assertThrows(
    () => CanonicalNetworkStateModel.deserialize(tampered),
    'Tampered serialized state fails checksum verification on deserialization'
  );
}

// ─── 6. Network Reconciliation & Partition Recovery ──────────────────────────

function testReconciliationAndPartitionRecovery(): void {
  console.log('\n─── 6. Network Reconciliation & Recovery ───');

  const model = new CanonicalNetworkStateModel('FORMING');

  // Register 4 nodes
  const nodeIds = ['N1', 'N2', 'N3', 'N4'];
  nodeIds.forEach((id, i) => {
    model.registerNode(id, `CUBIO://NETWORK/0/01/0000${i + 1}/RELAY`);
    model.transitionNodeState(id, 'READY', 'Ready');
    model.transitionNodeState(id, 'ONLINE', 'Online');
  });

  // Reconcile: all online -> CONVERGED
  const state1 = model.reconcileClusterHealth();
  assert(state1 === 'CONVERGED', 'Healthy network automatically reconciles to CONVERGED');

  // 1 node faults (3/4 online = 75% < 80%) -> DEGRADED
  model.transitionNodeState('N1', 'FAULTED', 'Hardware fault');
  const state2 = model.reconcileClusterHealth();
  assert(state2 === 'DEGRADED', 'Minority fault reconciles to DEGRADED');

  // 2 more nodes fault (3/4 faulted > 50%) -> PARTITIONED
  model.transitionNodeState('N2', 'FAULTED', 'Link severed');
  model.transitionNodeState('N3', 'FAULTED', 'Link severed');
  const state3 = model.reconcileClusterHealth();
  assert(state3 === 'PARTITIONED', 'Majority fault reconciles to PARTITIONED');

  // Partition Recovery Procedure
  model.recoverPartition('Subnet links restored');
  assert(model.clusterState === 'CONVERGED', 'recoverPartition restores cluster to CONVERGED');

  // Calling recoverPartition on non-partitioned cluster throws
  assertThrows(
    () => model.recoverPartition('Invalid call'),
    'Calling recoverPartition on non-partitioned cluster throws error'
  );
}

// ─── Execution ───────────────────────────────────────────────────────────────

console.log('═══════════════════════════════════════════════════════════');
console.log('  CUBiO Network State Model — Canonical Test Suite');
console.log('  Specification Target: Phase 1 / Task 05');
console.log('═══════════════════════════════════════════════════════════');

testClusterTransitions();
testNodeTransitions();
testConnectionTransitions();
testProtocolSessionTransitions();
testStateSerializationAndRoundTrip();
testReconciliationAndPartitionRecovery();

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
