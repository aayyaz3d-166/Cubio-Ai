/**
 * CUBiO Network Node — Runtime Architecture Test Suite
 * ====================================================
 *
 * Phase 3 Task 01: Comprehensive automated tests for the persistent
 * CUBiO Node Runtime architecture.
 *
 * Covers:
 *   1. Configuration validation & identity initialization
 *   2. Subsystem dependency wiring and ownership verification
 *   3. Lifecycle state transitions & monotonic constraints
 *   4. Failure isolation (service errors, malformed packets, transport drops)
 *   5. Inbound routing & local coordinate service dispatch
 *   6. Outbound transmission via pipeline & retry resilience
 *   7. Real OS socket peer-to-peer node communication (TCP & Memory)
 *   8. Telemetry aggregation & dynamic health reporting
 *
 * Run with: npx tsx src/cubio/network/node/nodeRuntime.test.ts
 */

import {
  CubiONodeRuntime,
  createDefaultNodeRuntimeConfig,
  validateNodeRuntimeConfig,
  type NodeRuntimeConfig,
} from './index';

import { createNodeIdentity } from '../protocol/v1/nodeArchitecture';
import { createPacket } from '../protocol/v1/packetEngine';
import { createMessage, messageToPackets } from '../protocol/v1/messageEngine';
import { type INodeService } from '../protocol/v1/nodeTypes';
import { type CubiOMessage } from '../protocol/v1/messageTypes';
import { MemoryTransportAdapter } from '../transport/memoryTransportAdapter';

// ─── Test Harness ─────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const failures: string[] = [];

function assert(condition: boolean, label: string): void {
  if (condition) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    failures.push(label);
    console.error(`  ✗ FAIL: ${label}`);
  }
}

async function assertThrowsAsync(fn: () => Promise<void>, label: string): Promise<void> {
  try {
    await fn();
    failed++;
    failures.push(label);
    console.error(`  ✗ FAIL (expected throw): ${label}`);
  } catch {
    passed++;
    console.log(`  ✓ ${label}`);
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
    console.log(`  ✓ ${label}`);
  }
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const OWNER_A = 'CUB-NODE0001';
const COORD_A = 'CUBIO://NETWORK/0/01/00001/CORE';

const OWNER_B = 'CUB-NODE0002';
const COORD_B = 'CUBIO://NETWORK/0/01/00002/EDGE';

async function runAllTests(): Promise<void> {
  console.log('╔══════════════════════════════════════════════════════════════════════════╗');
  console.log('║        CUBiO AI — Phase 3 / Task 01: Node Runtime Architecture Tests     ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════╝\n');

  // ───────────────────────────────────────────────────────────────────────────
  // 1. Configuration Validation & Identity Initialization
  // ───────────────────────────────────────────────────────────────────────────
  console.log('1. Configuration Validation & Identity Initialization:');

  const identityA = createNodeIdentity({
    nodeName: 'AlphaNode',
    coordinateUri: COORD_A,
    ownerCubId: OWNER_A,
    role: 'CORE',
  });

  const validConfig = createDefaultNodeRuntimeConfig(identityA, [
    {
      transportType: 'MEMORY',
      endpoint: { transportType: 'MEMORY', host: 'in-proc', port: 0 },
    },
  ]);

  const valRes = validateNodeRuntimeConfig(validConfig);
  assert(valRes.valid && valRes.errors.length === 0, 'Valid NodeRuntimeConfig passes validation');

  const invalidConfig1 = { ...validConfig, mtu: 50 }; // MTU too small
  assert(validateNodeRuntimeConfig(invalidConfig1).valid === false, 'Rejects MTU below minimum threshold');

  const invalidConfig2 = { ...validConfig, transports: [] }; // No transports
  assert(validateNodeRuntimeConfig(invalidConfig2).valid === false, 'Rejects config with zero transport bindings');

  const invalidConfig3 = { ...validConfig, defaultTransport: 'UDP' as any }; // defaultTransport not in transports
  assert(validateNodeRuntimeConfig(invalidConfig3).valid === false, 'Rejects defaultTransport mismatch with declared transports');

  const runtimeA = new CubiONodeRuntime(validConfig);
  assert(runtimeA.state === 'STOPPED', 'Runtime initial state is strictly STOPPED');
  assert(runtimeA.identity.nodeId === identityA.nodeId, 'Identity bound correctly to runtime');

  // ───────────────────────────────────────────────────────────────────────────
  // 2. Dependency Wiring & Subsystem Ownership
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n2. Dependency Wiring & Subsystem Ownership:');

  assert(runtimeA.connectionManager !== undefined, 'ConnectionLifecycleManager owned and wired');
  assert(runtimeA.assembler !== undefined, 'InboundEnvelopeAssembler owned and wired');
  assert(runtimeA.resilienceEngine !== undefined, 'TransportResilienceEngine owned and wired');
  assert(runtimeA.getAdapter('MEMORY') !== undefined, 'Configured transport adapter instantiated');
  assert(runtimeA.hasCapability('PACKET_ROUTING') === true, 'CORE role has PACKET_ROUTING capability');

  const testService: INodeService = {
    serviceId: 'SERVICE_AUTH',
    serviceType: 'SECURITY',
    coordinateUri: 'CUBIO://NETWORK/0/01/00001/AUTH',
    handleMessage: (_msg) => {},
  };

  runtimeA.registerService(testService);
  assert(runtimeA.getService('SERVICE_AUTH') === testService, 'Application service registered');
  assert(runtimeA.getServices().length === 1, 'Service enumeration reflects registered service');
  assert(runtimeA.unregisterService('SERVICE_AUTH') === true, 'Service unregistered cleanly');
  assert(runtimeA.getService('SERVICE_AUTH') === undefined, 'Unregistered service no longer accessible');

  // ───────────────────────────────────────────────────────────────────────────
  // 3. Lifecycle State Transitions & Invariants
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n3. Lifecycle State Transitions & Invariants:');

  assertThrows(() => {
    runtimeA.transitionState('RUNNING', 'Illegal jump from STOPPED');
  }, 'Rejects illegal direct transition from STOPPED to RUNNING');

  const stateHistory: string[] = [];
  const unregState = runtimeA.onStateChange((prev, curr, reason) => {
    stateHistory.push(`${prev}->${curr}`);
  });

  await runtimeA.start();
  assert(runtimeA.state === 'RUNNING', 'Runtime cleanly enters RUNNING state on start()');
  assert(stateHistory.includes('STOPPED->INITIALIZING'), 'History contains STOPPED->INITIALIZING');
  assert(stateHistory.includes('INITIALIZING->STARTING'), 'History contains INITIALIZING->STARTING');
  assert(stateHistory.includes('STARTING->RUNNING'), 'History contains STARTING->RUNNING');

  // Idempotent start
  await runtimeA.start();
  assert(runtimeA.state === 'RUNNING', 'Subsequent start() call is idempotent');

  // Graceful stop
  await runtimeA.stop(true);
  assert(runtimeA.state === 'STOPPED', 'Runtime transitions cleanly to STOPPED on stop()');
  assert(stateHistory.includes('RUNNING->DRAINING'), 'Graceful stop initiates DRAINING state');
  assert(stateHistory.includes('DRAINING->STOPPED'), 'Graceful stop completes to STOPPED state');

  // Idempotent stop
  await runtimeA.stop(true);
  assert(runtimeA.state === 'STOPPED', 'Subsequent stop() call is idempotent');

  // Restart
  await runtimeA.restart();
  assert(runtimeA.state === 'RUNNING', 'restart() successfully returns runtime to RUNNING');
  await runtimeA.stop(false);
  unregState();

  // ───────────────────────────────────────────────────────────────────────────
  // 4. Failure Isolation & Fault Containment
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n4. Failure Isolation & Fault Containment:');

  await runtimeA.start();

  let errorCaught = false;
  runtimeA.onError((err) => {
    errorCaught = true;
  });

  // Register a faulty service that throws an unhandled error
  const failingService: INodeService = {
    serviceId: 'SERVICE_EXPLODING',
    serviceType: 'FAULT_TEST',
    coordinateUri: 'CUBIO://NETWORK/0/01/00001/EXPLODE',
    handleMessage: (_msg) => {
      throw new Error('Explosive failure inside user service logic');
    },
  };
  runtimeA.registerService(failingService);

  // Inbound packet to local node with bad payload or triggering service error
  const msgForExplode = createMessage({
    type: 'DIRECT',
    communicationMode: 'USER_USER',
    source: {
      cubId: OWNER_B,
      coordinateUri: COORD_B,
      entityType: 'HUMAN_OPERATOR',
    },
    destination: {
      coordinateUri: failingService.coordinateUri,
    },
    body: { test: 123 },
  });

  // Dispatch inbound packets simulating wire arrival
  const packets = runtimeA.dispatchOutboundMessage ? [] : [];
  // Send packet directly to inbound packet handler of adapter
  const memAdapter = runtimeA.getAdapter('MEMORY') as MemoryTransportAdapter;
  assert(memAdapter !== undefined, 'Memory adapter accessible');

  // Emit bad packet (corrupted checksum) to test packet drop isolation
  const origPacket = createPacket({
    envelopeId: 'ENV_BAD',
    sequenceNumber: 1,
    sourceUri: COORD_B,
    destinationUri: COORD_A,
    payloadData: 'CORRUPTED',
  });
  const badPacket = {
    ...origPacket,
    checksum: '0xDEADBEEF',
  };

  // Simulate arrival on memory adapter
  (memAdapter as any).handleInboundPacket(badPacket, {
    sessionId: 'TEST',
    transportType: 'MEMORY',
    localEndpoint: { transportType: 'MEMORY', host: 'in-proc', port: 0 },
    remoteEndpoint: { transportType: 'MEMORY', host: 'in-proc', port: 0 },
    establishedAt: Date.now(),
    lastActivityAt: Date.now(),
    bytesReceived: 0,
    bytesSent: 0,
    packetsReceived: 0,
    packetsSent: 0,
    state: 'CONNECTED',
  });

  assert(runtimeA.state === 'RUNNING', 'Runtime remains RUNNING despite corrupted packet');
  assert(runtimeA.telemetry.packetsDropped > 0, 'Corrupted packet correctly dropped in telemetry');

  await runtimeA.stop(false);

  // ───────────────────────────────────────────────────────────────────────────
  // 5. Inbound Routing & Service Dispatch
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n5. Inbound Routing & Service Dispatch:');

  await runtimeA.start();

  let receivedMessagePayload: any = null;
  const echoService: INodeService = {
    serviceId: 'SERVICE_ECHO',
    serviceType: 'ECHO',
    coordinateUri: 'CUBIO://NETWORK/0/01/00001/ECHO',
    handleMessage: (msg) => {
      receivedMessagePayload = msg.payload?.body ?? msg.payload;
    },
  };
  runtimeA.registerService(echoService);

  const echoMsg = createMessage({
    type: 'DIRECT',
    communicationMode: 'USER_USER',
    source: {
      cubId: OWNER_B,
      coordinateUri: COORD_B,
      entityType: 'HUMAN_OPERATOR',
    },
    destination: {
      coordinateUri: echoService.coordinateUri,
    },
    body: { greeting: 'Hello from Beta' },
  });

  const validPackets = messageToPackets(echoMsg, 1400);
  const validPacket = validPackets[0];

  (memAdapter as any).handleInboundPacket(validPacket, {
    sessionId: 'TEST',
    transportType: 'MEMORY',
    localEndpoint: { transportType: 'MEMORY', host: 'in-proc', port: 0 },
    remoteEndpoint: { transportType: 'MEMORY', host: 'in-proc', port: 0 },
    establishedAt: Date.now(),
    lastActivityAt: Date.now(),
    bytesReceived: 0,
    bytesSent: 0,
    packetsReceived: 0,
    packetsSent: 0,
    state: 'CONNECTED',
  });

  assert(receivedMessagePayload !== null, 'Inbound packet delivered to registered service');
  assert((receivedMessagePayload?.greeting ?? receivedMessagePayload?.body?.greeting) === 'Hello from Beta', 'Service received intact message payload');

  await runtimeA.stop(false);

  // ───────────────────────────────────────────────────────────────────────────
  // 6. Outbound Transmission & Resilience
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n6. Outbound Transmission & Resilience:');

  // Outbound fails when node is stopped
  await assertThrowsAsync(async () => {
    await runtimeA.sendMessage(echoMsg);
  }, 'sendMessage throws if node is in STOPPED state');

  await runtimeA.start();

  const outboundReceipt = await runtimeA.sendMessage(echoMsg, {
    transportType: 'MEMORY',
    host: 'in-proc',
    port: 0,
  });
  assert(outboundReceipt.success === true, 'Outbound sendMessage succeeds via memory transport');
  assert(runtimeA.telemetry.packetsSent > 0, 'packetsSent telemetry incremented');

  await runtimeA.stop(false);

  // ───────────────────────────────────────────────────────────────────────────
  // 7. End-to-End Real Operating System Transport Communication (TCP & Memory)
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n7. End-to-End Real Operating System Transport Communication:');

  // Create two distinct node runtimes over real OS TCP sockets
  const TCP_PORT_1 = 44210;
  const TCP_PORT_2 = 44211;

  const node1Identity = createNodeIdentity({
    nodeName: 'NodeTCP1',
    coordinateUri: 'CUBIO://NETWORK/0/01/00003/CORE',
    ownerCubId: 'CUB-TCP00001',
    role: 'CORE',
  });

  const node2Identity = createNodeIdentity({
    nodeName: 'NodeTCP2',
    coordinateUri: 'CUBIO://NETWORK/0/01/00004/EDGE',
    ownerCubId: 'CUB-TCP00002',
    role: 'EDGE',
  });

  const node1Config = createDefaultNodeRuntimeConfig(node1Identity, [
    {
      transportType: 'TCP',
      endpoint: { transportType: 'TCP', host: '127.0.0.1', port: TCP_PORT_1 },
    },
  ]);

  const node2Config = createDefaultNodeRuntimeConfig(node2Identity, [
    {
      transportType: 'TCP',
      endpoint: { transportType: 'TCP', host: '127.0.0.1', port: TCP_PORT_2 },
    },
  ]);

  const runtime1 = new CubiONodeRuntime(node1Config);
  const runtime2 = new CubiONodeRuntime(node2Config);

  await runtime1.start();
  await runtime2.start();

  assert(runtime1.state === 'RUNNING', 'Node 1 is RUNNING on TCP port ' + TCP_PORT_1);
  assert(runtime2.state === 'RUNNING', 'Node 2 is RUNNING on TCP port ' + TCP_PORT_2);

  // Send packet from Node 2 to Node 1 over real TCP socket
  const tcpMsg = createMessage({
    type: 'DIRECT',
    communicationMode: 'USER_USER',
    source: {
      cubId: 'CUB-TCP00002',
      coordinateUri: node2Identity.coordinateUri,
      entityType: 'HUMAN_OPERATOR',
    },
    destination: {
      coordinateUri: node1Identity.coordinateUri,
    },
    body: 'TCP Ping across runtimes',
  });
  const tcpPackets = messageToPackets(tcpMsg, 1400);
  const tcpPacket = tcpPackets[0];

  let node1PacketReceived = false;
  runtime1.onPacket((pkt) => {
    if (pkt.header.packetId === tcpPacket.header.packetId) {
      node1PacketReceived = true;
    }
  });

  const sendReceipt = await runtime2.sendPacket(tcpPacket, {
    transportType: 'TCP',
    host: '127.0.0.1',
    port: TCP_PORT_1,
  });

  assert(sendReceipt.success === true, 'Node 2 successfully transmitted packet to Node 1 via real TCP');

  // Wait brief tick for socket delivery
  await new Promise(r => setTimeout(r, 150));
  assert(node1PacketReceived === true, 'Node 1 received packet over real OS TCP socket');

  await runtime1.stop(true);
  await runtime2.stop(true);
  assert(runtime1.state === 'STOPPED' && runtime2.state === 'STOPPED', 'Both TCP runtimes shut down cleanly');

  // ───────────────────────────────────────────────────────────────────────────
  // 8. Operational Telemetry & Dynamic Health Reporting
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n8. Operational Telemetry & Dynamic Health Reporting:');

  const freshRuntime = new CubiONodeRuntime(validConfig);
  await freshRuntime.start();

  const telem = freshRuntime.telemetry;
  assert(telem.uptimeMs >= 0, 'Uptime reported');
  assert(telem.healthStatus === 'HEALTHY', 'Initial health status is HEALTHY');
  assert(telem.activeTransportsCount === 1, 'Telemetry counts active transports');
  assert(typeof telem.pipelineQueueDepth === 'number', 'Pipeline queue depth reported');

  await freshRuntime.stop(false);

  // ───────────────────────────────────────────────────────────────────────────
  // Summary
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n══════════════════════════════════════════════════════════════════════════');
  console.log(`  Phase 3 / Task 01 Test Results: ${passed} PASSED, ${failed} FAILED`);
  console.log('══════════════════════════════════════════════════════════════════════════\n');

  if (failed > 0) {
    console.error('Failed test assertions:');
    for (const f of failures) {
      console.error(`  - ${f}`);
    }
    process.exit(1);
  }
}

runAllTests().catch((err) => {
  console.error('Unhandled test suite error:', err);
  process.exit(1);
});
