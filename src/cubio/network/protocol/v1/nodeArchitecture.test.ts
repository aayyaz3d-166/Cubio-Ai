/**
 * CUBiO Network Protocol v1 — Canonical Node Architecture Test Suite
 * ============================================================
 *
 * Comprehensive tests for Task 04:
 *   1. Node identity and configuration validation
 *   2. Node lifecycle state machine and transition constraints
 *   3. Role-based capabilities and service management
 *   4. Protocol responsibilities: inbound packet routing, local termination, forwarding, and drop rules
 *   5. Outbound message dispatching and packetization
 *   6. Operational telemetry and health status reporting
 *
 * Run with:  npx tsx src/cubio/network/protocol/v1/nodeArchitecture.test.ts
 */

import {
  createNodeIdentity,
  createDefaultNodeConfig,
  validateNodeConfig,
  CanonicalNetworkNode,
} from './nodeArchitecture';
import {
  type NodeRole,
  type CanonicalNodeIdentity,
  type CanonicalNodeConfig,
  type INodeService,
} from './nodeTypes';
import { createPacket } from './packetEngine';
import { createMessage } from './messageEngine';
import { PacketFlags } from './packetTypes';

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

const OWNER_CUB_ID = 'CUB-NODE0001';
const NODE_COORD = 'CUBIO://NETWORK/0/01/00001/CORE';
const REMOTE_COORD = 'CUBIO://NETWORK/0/02/00042/TERMINAL';

function makeValidNode(role: NodeRole = 'RELAY', overrides: Partial<CanonicalNodeConfig> = {}): CanonicalNetworkNode {
  const identity = createNodeIdentity({
    nodeName: 'Primary Relay Alpha',
    coordinateUri: NODE_COORD,
    ownerCubId: OWNER_CUB_ID,
    role,
  });
  const config = createDefaultNodeConfig(identity, overrides);
  return new CanonicalNetworkNode(config);
}

// ─── 1. Node Identity & Configuration Tests ──────────────────────────────────

function testNodeIdentityAndConfig(): void {
  console.log('\n─── 1. Node Identity & Configuration ───');

  const identity = createNodeIdentity({
    nodeName: 'Edge Terminal 1',
    coordinateUri: 'CUBIO://NETWORK/0/01/00005/TERMINAL',
    ownerCubId: 'CUB-USER0001',
    role: 'EDGE',
  });

  assert(identity.nodeId.startsWith('NODE_'), 'Node ID starts with NODE_');
  assert(identity.nodeName === 'Edge Terminal 1', 'Node name preserved');
  assert(identity.role === 'EDGE', 'Role is EDGE');
  assert(identity.publicKey.startsWith('0xPUB_'), 'Public key generated');

  const config = createDefaultNodeConfig(identity);
  const valResult = validateNodeConfig(config);
  assert(valResult.valid === true, 'Default node config passes validation');
  assert(valResult.errors.length === 0, 'No validation errors on default config');

  // Rejection of invalid configuration fields
  const badNodeIdConfig = { ...config, identity: { ...identity, nodeId: 'INVALID' } };
  assert(validateNodeConfig(badNodeIdConfig).valid === false, 'Invalid nodeId rejected');

  const badOwnerConfig = { ...config, identity: { ...identity, ownerCubId: 'BAD-OWNER' } };
  assert(validateNodeConfig(badOwnerConfig).valid === false, 'Invalid ownerCubId rejected');

  const badCoordConfig = { ...config, identity: { ...identity, coordinateUri: 'MALFORMED' } };
  assert(validateNodeConfig(badCoordConfig).valid === false, 'Invalid coordinateUri rejected');

  const badMtuConfig = { ...config, mtu: 64 };
  assert(validateNodeConfig(badMtuConfig).valid === false, 'MTU < 128 rejected');

  const zeroPeersConfig = { ...config, maxConcurrentPeers: 0 };
  assert(validateNodeConfig(zeroPeersConfig).valid === false, 'maxConcurrentPeers < 1 rejected');

  const emptyCapsConfig = { ...config, capabilities: [] };
  assert(validateNodeConfig(emptyCapsConfig).valid === false, 'Empty capabilities rejected');
}

// ─── 2. Node Lifecycle State Machine ─────────────────────────────────────────

function testNodeLifecycle(): void {
  console.log('\n─── 2. Node Lifecycle State Machine ───');

  const node = makeValidNode();
  assert(node.lifecycleState === 'READY', 'Initial instantiated state is READY');

  // READY -> ONLINE
  node.start();
  assert(node.lifecycleState === 'ONLINE', 'Transitioned to ONLINE via start()');
  assert(node.telemetry.uptimeMs >= 0, 'Uptime counter active');

  // Cannot start an already ONLINE node
  assertThrows(() => node.start(), 'Starting an ONLINE node throws error');

  // ONLINE -> DEGRADED -> ONLINE
  node.transitionState('DEGRADED', 'High latency detected');
  assert(node.lifecycleState === 'DEGRADED', 'Transitioned to DEGRADED');
  node.transitionState('ONLINE', 'Latency recovered');
  assert(node.lifecycleState === 'ONLINE', 'Recovered back to ONLINE');

  // ONLINE -> DRAINING -> STOPPED (Graceful shutdown)
  node.stop(true);
  assert(node.lifecycleState === 'STOPPED', 'Graceful shutdown transitioned to STOPPED');

  // STOPPED -> READY -> ONLINE (Reboot cycle)
  node.transitionState('READY', 'Node reboot initiated');
  assert(node.lifecycleState === 'READY', 'Rebooted into READY');
  node.start();
  assert(node.lifecycleState === 'ONLINE', 'Re-started to ONLINE');

  // Immediate non-graceful stop
  node.stop(false);
  assert(node.lifecycleState === 'STOPPED', 'Immediate stop transitioned to STOPPED');

  // Invalid state transitions
  assertThrows(
    () => node.transitionState('ONLINE', 'Direct jump to online'),
    'Transition from STOPPED directly to ONLINE is invalid'
  );
}

// ─── 3. Capabilities & Service Management ────────────────────────────────────

function testCapabilitiesAndServices(): void {
  console.log('\n─── 3. Capabilities & Service Management ───');

  const relayNode = makeValidNode('RELAY');
  assert(relayNode.hasCapability('PACKET_ROUTING'), 'RELAY node has PACKET_ROUTING');
  assert(relayNode.hasCapability('ENVELOPE_FORWARDING'), 'RELAY node has ENVELOPE_FORWARDING');

  const edgeNode = makeValidNode('EDGE');
  assert(!edgeNode.hasCapability('PACKET_ROUTING'), 'EDGE node does NOT have PACKET_ROUTING');
  assert(edgeNode.hasCapability('MESSAGE_DISPATCH'), 'EDGE node has MESSAGE_DISPATCH');

  // Service registration
  const mockService: INodeService = {
    serviceId: 'SRV_MAIL_001',
    serviceType: 'MAIL',
    coordinateUri: 'CUBIO://NETWORK/0/01/00001/MAIL',
    handleMessage: (msg) => msg,
  };

  assert(relayNode.hasService('SRV_MAIL_001') === false, 'Service initially not present');
  relayNode.registerService(mockService);
  assert(relayNode.hasService('SRV_MAIL_001') === true, 'Service successfully registered');
  assert(relayNode.getServices().length === 1, 'Service appears in getServices()');

  // Unregister
  const removed = relayNode.unregisterService('SRV_MAIL_001');
  assert(removed === true, 'Service successfully unregistered');
  assert(relayNode.hasService('SRV_MAIL_001') === false, 'Service no longer present');
}

// ─── 4. Protocol Responsibilities: Inbound Packet Processing ─────────────────

function testInboundPacketProcessing(): void {
  console.log('\n─── 4. Protocol Responsibilities: Inbound Packets ───');

  const relayNode = makeValidNode('RELAY');
  relayNode.start();

  // 4a. Packet addressed to node coordinate -> TERMINATED_LOCAL
  const localPkt = createPacket({
    envelopeId: 'ENV_0xTEST001',
    sourceUri: REMOTE_COORD,
    destinationUri: NODE_COORD,
    payloadData: '{"action":"PING"}',
    sequenceNumber: 1,
    flags: PacketFlags.NONE,
    ttl: 10,
  });

  const resLocal = relayNode.processInboundPacket(localPkt);
  assert(resLocal.action === 'TERMINATED_LOCAL', 'Local destination packet terminated locally');
  assert(resLocal.targetService === 'NODE_CONTROL', 'Target service is NODE_CONTROL');
  assert(relayNode.telemetry.packetsReceived === 1, 'packetsReceived incremented');

  // 4b. Packet addressed to registered service on node -> TERMINATED_LOCAL
  const serviceCoord = 'CUBIO://NETWORK/0/01/00001/STORAGE';
  relayNode.registerService({
    serviceId: 'SRV_STORAGE',
    serviceType: 'STORAGE',
    coordinateUri: serviceCoord,
    handleMessage: () => {},
  });

  const servicePkt = createPacket({
    envelopeId: 'ENV_0xTEST002',
    sourceUri: REMOTE_COORD,
    destinationUri: serviceCoord,
    payloadData: '{"action":"STORE"}',
    sequenceNumber: 2,
    flags: PacketFlags.NONE,
    ttl: 10,
  });

  const resService = relayNode.processInboundPacket(servicePkt);
  assert(resService.action === 'TERMINATED_LOCAL', 'Service packet terminated locally');
  assert(resService.targetService === 'SRV_STORAGE', 'Target service identified correctly');

  // 4c. Packet addressed to remote coordinate on RELAY node -> FORWARDED
  const remotePkt = createPacket({
    envelopeId: 'ENV_0xTEST003',
    sourceUri: 'CUBIO://NETWORK/0/01/00003/TERMINAL',
    destinationUri: REMOTE_COORD,
    payloadData: '{"action":"FORWARD"}',
    sequenceNumber: 3,
    flags: PacketFlags.NONE,
    ttl: 10,
  });

  const resRemote = relayNode.processInboundPacket(remotePkt);
  assert(resRemote.action === 'FORWARDED', 'Remote packet forwarded by relay');
  assert(resRemote.nextHopUri === REMOTE_COORD, 'Next hop URI matches destination');
  assert(relayNode.telemetry.packetsForwarded === 1, 'packetsForwarded incremented');

  // 4d. Packet addressed to remote coordinate on EDGE node (no routing capability) -> REJECTED
  const edgeNode = makeValidNode('EDGE');
  edgeNode.start();
  const resEdgeRemote = edgeNode.processInboundPacket(remotePkt);
  assert(resEdgeRemote.action === 'REJECTED', 'Remote packet rejected by non-routing EDGE node');

  // 4e. Corrupted packet -> DROPPED
  const corruptedPkt = { ...remotePkt, checksum: '0xCHK_CORRUPTED' };
  const resCorrupted = relayNode.processInboundPacket(corruptedPkt as any);
  assert(resCorrupted.action === 'DROPPED', 'Corrupted packet dropped');
  assert(relayNode.telemetry.packetsDropped >= 1, 'packetsDropped incremented');

  // 4f. Expired TTL (ttl <= 1) -> DROPPED
  const expiredTtlPkt = createPacket({
    envelopeId: 'ENV_0xTEST004',
    sourceUri: REMOTE_COORD,
    destinationUri: NODE_COORD,
    payloadData: '{}',
    sequenceNumber: 4,
    ttl: 1, // Will expire in transit
  });
  const resExpiredTtl = relayNode.processInboundPacket(expiredTtlPkt);
  assert(resExpiredTtl.action === 'DROPPED', 'Packet with TTL <= 1 dropped');

  // 4g. Traffic when node is STOPPED -> REJECTED
  relayNode.stop(false);
  const resStopped = relayNode.processInboundPacket(localPkt);
  assert(resStopped.action === 'REJECTED', 'Traffic rejected when node is STOPPED');
}

// ─── 5. Outbound Message Dispatching ─────────────────────────────────────────

function testOutboundMessageDispatch(): void {
  console.log('\n─── 5. Outbound Message Dispatching ───');

  const node = makeValidNode();
  node.start();

  const msg = createMessage({
    type: 'DIRECT',
    communicationMode: 'USER_USER',
    source: {
      cubId: OWNER_CUB_ID,
      coordinateUri: NODE_COORD,
      entityType: 'NODE',
    },
    destination: {
      coordinateUri: REMOTE_COORD,
    },
    body: { command: 'DISPATCH_TEST', payload: 'XYZ' },
  });

  const packets = node.dispatchOutboundMessage(msg);
  assert(packets.length >= 1, 'Outbound message produced at least 1 packet');
  assert(node.telemetry.packetsSent === packets.length, 'telemetry.packetsSent tracked');
  assert(node.telemetry.bytesSent > 0, 'telemetry.bytesSent tracked');

  // Cannot dispatch when node is STOPPED
  node.stop(false);
  assertThrows(
    () => node.dispatchOutboundMessage(msg),
    'Cannot dispatch outbound message while node is STOPPED'
  );
}

// ─── 6. Telemetry & Health Reporting ─────────────────────────────────────────

function testTelemetryAndHealth(): void {
  console.log('\n─── 6. Telemetry & Health Reporting ───');

  const node = makeValidNode();
  assert(node.telemetry.healthStatus === 'HEALTHY', 'Initial health is HEALTHY');

  node.start();
  assert(node.telemetry.healthStatus === 'HEALTHY', 'Online health is HEALTHY');

  // Transition to DEGRADED
  node.transitionState('DEGRADED', 'High resource consumption');
  assert(node.telemetry.healthStatus === 'DEGRADED', 'Telemetry reports DEGRADED health');

  // Transition to FAULTED
  node.transitionState('FAULTED', 'Critical internal fault');
  assert(node.telemetry.healthStatus === 'CRITICAL', 'Telemetry reports CRITICAL health on FAULTED');
}

// ─── Execution ───────────────────────────────────────────────────────────────

console.log('═══════════════════════════════════════════════════════════');
console.log('  CUBiO Node Architecture — Canonical Test Suite');
console.log('  Specification Target: Phase 1 / Task 04');
console.log('═══════════════════════════════════════════════════════════');

testNodeIdentityAndConfig();
testNodeLifecycle();
testCapabilitiesAndServices();
testInboundPacketProcessing();
testOutboundMessageDispatch();
testTelemetryAndHealth();

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
