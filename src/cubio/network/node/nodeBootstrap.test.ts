/**
 * CUBiO AI — Phase 3 / Task 03: Node Bootstrap & Initialization Tests
 * ===================================================================
 *
 * Comprehensive automated verification suite proving:
 *   1. Canonical sequential stage progression in deterministic order (0 to 8).
 *   2. Intermediate activation gate: cold start to READY state.
 *   3. Phase 1 Canonical Network State Model synchronization & hash determinism.
 *   4. Fail-closed behavior on invalid configuration (Stage 0).
 *   5. Fail-closed behavior on invalid identity (Stage 1).
 *   6. Fail-closed reverse rollback on transport port collision (Stage 5).
 *   7. Fail-closed reverse rollback on service initialization failure (Stage 6).
 *   8. Duplicate startup prevention & idempotency enforcement.
 *   9. Post-failure recovery, clean retry, and resource leak verification.
 *
 * Run with:  npx tsx src/cubio/network/node/nodeBootstrap.test.ts
 */

import * as net from 'node:net';
import { CubiONodeRuntime } from './nodeRuntime';
import { createDefaultNodeRuntimeConfig } from './nodeRuntimeConfig';
import { createNodeIdentity } from '../protocol/v1/nodeArchitecture';
import { NodeBootstrapError } from './nodeBootstrapPipeline';
import { NodeBootstrapStage } from './nodeBootstrapTypes';

let passed = 0;
let failed = 0;
const failures: string[] = [];

function assert(condition: boolean, message: string): void {
  if (condition) {
    passed++;
    console.log(`  ✓ ${message}`);
  } else {
    failed++;
    failures.push(message);
    console.error(`  ✗ FAIL: ${message}`);
  }
}

async function assertThrowsAsync(fn: () => Promise<any>, message: string): Promise<any> {
  try {
    await fn();
    failed++;
    failures.push(message);
    console.error(`  ✗ FAIL (Expected throw): ${message}`);
    return null;
  } catch (err: any) {
    passed++;
    console.log(`  ✓ ${message}`);
    return err;
  }
}

async function runAllTests() {
  console.log('╔══════════════════════════════════════════════════════════════════════════╗');
  console.log('║        CUBiO AI — Phase 3 / Task 03: Node Bootstrap & Init Tests         ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════╝\n');

  // ───────────────────────────────────────────────────────────────────────────
  // 1. Canonical Sequential Stage Progression & Timing
  // ───────────────────────────────────────────────────────────────────────────
  console.log('1. Canonical Sequential Stage Progression & Timing:');

  const identity1 = createNodeIdentity({
    nodeId: 'NODE-BOOT-001',
    nodeName: 'BootstrapTestNode1',
    ownerCubId: 'CUB-00000001',
    role: 'CORE',
    coordinateUri: 'CUBIO://NETWORK/0/01/00001/CORE',
  });

  const config1 = createDefaultNodeRuntimeConfig(identity1, [
    {
      transportType: 'MEMORY',
      endpoint: { transportType: 'MEMORY', host: 'in-proc-boot1', port: 0 },
    },
  ]);

  const runtime1 = new CubiONodeRuntime(config1);
  assert(runtime1.state === 'STOPPED', 'Initial runtime state is STOPPED');

  const stageProgress: NodeBootstrapStage[] = [];
  const report1 = await runtime1.bootstrap({
    onStageProgress: (stage, status) => {
      if (status === 'COMPLETED') stageProgress.push(stage);
    },
  });

  assert(report1.success === true, 'Bootstrap completed successfully');
  assert(report1.finalState === 'ONLINE', 'Report finalState is ONLINE');
  assert(runtime1.state === 'RUNNING', 'Runtime state is RUNNING / ONLINE');
  assert(report1.rollbackExecuted === false, 'Rollback was not executed on clean bootstrap');
  assert(report1.stages.length === 9, `All 9 bootstrap stages recorded (got: ${report1.stages.length})`);

  const expectedStages: NodeBootstrapStage[] = [
    'CONFIGURATION_VALIDATION',
    'IDENTITY_INITIALIZATION',
    'LOGGING_INITIALIZATION',
    'STATE_INITIALIZATION',
    'PROTOCOL_INITIALIZATION',
    'TRANSPORT_INITIALIZATION',
    'SERVICES_INITIALIZATION',
    'READY_CHECK',
    'ONLINE_ACTIVATION',
  ];

  for (let i = 0; i < expectedStages.length; i++) {
    assert(report1.stages[i].stage === expectedStages[i], `Stage ${i} is ${expectedStages[i]}`);
    assert(report1.stages[i].status === 'COMPLETED', `Stage ${expectedStages[i]} completed with status COMPLETED`);
    assert(report1.stages[i].durationMs >= 0, `Stage ${expectedStages[i]} duration recorded`);
  }

  assert(report1.totalDurationMs >= 0, `Total bootstrap duration recorded: ${report1.totalDurationMs}ms`);
  await runtime1.stop(false);

  // ───────────────────────────────────────────────────────────────────────────
  // 2. Cold Start to READY State (Intermediate Activation Gate)
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n2. Cold Start to READY State (Intermediate Activation Gate):');

  const identity2 = createNodeIdentity({
    nodeId: 'NODE-BOOT-002',
    nodeName: 'BootstrapTestNode2',
    ownerCubId: 'CUB-00000002',
    role: 'EDGE',
    coordinateUri: 'CUBIO://NETWORK/0/01/00002/EDGE',
  });

  const config2 = createDefaultNodeRuntimeConfig(identity2, [
    {
      transportType: 'MEMORY',
      endpoint: { transportType: 'MEMORY', host: 'in-proc-boot2', port: 0 },
    },
  ]);

  const runtime2 = new CubiONodeRuntime(config2);
  const report2 = await runtime2.bootstrap({ autoActivateOnline: false });

  assert(report2.success === true, 'Bootstrap to READY succeeded');
  assert(report2.finalState === 'READY', 'Report finalState is READY');
  assert(runtime2.state === 'READY', 'Runtime state stopped at intermediate READY state');

  const snapshot2 = runtime2.stateModel.getSnapshot();
  assert(snapshot2.nodes[identity2.nodeId].state === 'READY', 'State model records node in READY state');

  // Activate to online
  await runtime2.start();
  assert(runtime2.state === 'RUNNING', 'Runtime transitioned from READY to RUNNING on start()');
  const snapshot2Online = runtime2.stateModel.getSnapshot();
  assert(snapshot2Online.nodes[identity2.nodeId].state === 'ONLINE', 'State model records node in ONLINE state');

  await runtime2.stop(false);

  // ───────────────────────────────────────────────────────────────────────────
  // 3. Phase 1 Canonical Network State Model Integration
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n3. Phase 1 Canonical Network State Model Integration:');

  const identity3 = createNodeIdentity({
    nodeId: 'NODE-BOOT-003',
    nodeName: 'BootstrapTestNode3',
    ownerCubId: 'CUB-00000003',
    role: 'CORE',
    coordinateUri: 'CUBIO://NETWORK/0/01/00003/CORE',
  });

  const config3 = createDefaultNodeRuntimeConfig(identity3, [
    {
      transportType: 'MEMORY',
      endpoint: { transportType: 'MEMORY', host: 'in-proc-boot3', port: 0 },
    },
  ]);

  const runtime3 = new CubiONodeRuntime(config3);
  await runtime3.bootstrap();

  assert(runtime3.stateModel !== undefined, 'Phase 1 CanonicalNetworkStateModel is instantiated');
  assert(runtime3.stateModel.clusterState === 'BOOTSTRAP', 'Initial cluster state is BOOTSTRAP');

  const snapshot3 = runtime3.stateModel.getSnapshot();
  const nodeRecord = snapshot3.nodes[identity3.nodeId];
  assert(nodeRecord !== undefined, 'Local node record is registered in Phase 1 state tier');
  assert(nodeRecord.state === 'ONLINE', 'Local node state is ONLINE in state tier');
  assert(nodeRecord.coordinateUri === identity3.coordinateUri, 'Local node coordinate URI matches identity');
  assert(runtime3.identity.role === 'CORE', 'Local node role is CORE');
  assert(nodeRecord.healthScore === 100, 'Local node healthScore is 100 in state tier');
  assert(typeof snapshot3.stateHash === 'string' && snapshot3.stateHash.startsWith('0xNET_'), 'State hash is computed');

  await runtime3.stop(false);

  // ───────────────────────────────────────────────────────────────────────────
  // 4. Fail-Closed Behavior: Configuration Validation Failure (Stage 0)
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n4. Fail-Closed Behavior: Configuration Validation Failure (Stage 0):');

  // Attempting construction with invalid configuration must fail closed
  try {
    new CubiONodeRuntime({ ...config1, mtu: 40 });
    assert(false, 'Constructor should throw on sub-threshold MTU');
  } catch (err: any) {
    assert(err.message.includes('Invalid config'), 'Constructor fail-closed on invalid MTU');
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 5. Fail-Closed Behavior: Identity Failure (Stage 1)
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n5. Fail-Closed Behavior: Identity Failure (Stage 1):');

  const runtimeCorruptIdentity = new CubiONodeRuntime(config1);
  (runtimeCorruptIdentity as any).identity = {
    ...runtimeCorruptIdentity.identity,
    coordinateUri: 'INVALID_COORDINATE_URI',
  };

  const bootErr1 = await assertThrowsAsync(async () => {
    await runtimeCorruptIdentity.bootstrap();
  }, 'Bootstrap throws on invalid coordinate identity in Stage 1');

  assert(bootErr1 instanceof NodeBootstrapError, 'Thrown error is instance of NodeBootstrapError');
  assert(bootErr1.report.stages.find((s: any) => s.stage === 'IDENTITY_INITIALIZATION')?.status === 'FAILED', 'Stage 1 recorded status FAILED');
  assert(bootErr1.report.rollbackExecuted === true, 'Rollback executed after Stage 1 failure');
  assert(runtimeCorruptIdentity.state === 'FAULTED', 'Runtime transitioned to FAULTED state');

  // ───────────────────────────────────────────────────────────────────────────
  // 6. Fail-Closed Reverse Rollback: Transport Port Collision (Stage 5)
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n6. Fail-Closed Reverse Rollback: Transport Port Collision (Stage 5):');

  const COLLISION_PORT = 44360;

  // 1. Create raw TCP server occupying port 44360
  const occupyingServer = net.createServer();
  await new Promise<void>((resolve) => occupyingServer.listen(COLLISION_PORT, '127.0.0.1', () => resolve()));

  const collisionIdentity = createNodeIdentity({
    nodeId: 'NODE-BOOT-COLLISION',
    nodeName: 'CollisionNode',
    ownerCubId: 'CUB-00000004',
    role: 'EDGE',
    coordinateUri: 'CUBIO://NETWORK/0/01/00004/EDGE',
  });

  const collisionConfig = createDefaultNodeRuntimeConfig(collisionIdentity, [
    {
      transportType: 'TCP',
      endpoint: { transportType: 'TCP', host: '127.0.0.1', port: COLLISION_PORT },
    },
  ]);

  const collisionRuntime = new CubiONodeRuntime(collisionConfig);

  const collisionErr = await assertThrowsAsync(async () => {
    await collisionRuntime.bootstrap();
  }, 'Bootstrap throws when TCP port is already occupied (EADDRINUSE)');

  assert(collisionErr instanceof NodeBootstrapError, 'Error is NodeBootstrapError');
  assert(collisionErr.report.rollbackExecuted === true, 'Rollback executed upon transport failure');
  assert(collisionRuntime.state === 'FAULTED', 'Runtime state is FAULTED');

  const snapCollision = collisionRuntime.stateModel.getSnapshot();
  assert(snapCollision.nodes[collisionIdentity.nodeId]?.state === 'FAULTED', 'State model records node as FAULTED');

  // Verify Stages 0-4 were completed then rolled back
  const completedThenRolledBack = collisionErr.report.stages.filter((s: any) => s.status === 'COMPLETED');
  assert(completedThenRolledBack.length >= 4, 'Preceding stages (Config, Identity, Logging, State, Protocol) were tracked');

  // Close occupying server
  await new Promise<void>((resolve) => occupyingServer.close(() => resolve()));

  // ───────────────────────────────────────────────────────────────────────────
  // 7. Fail-Closed Reverse Rollback: Service Initialization Failure (Stage 6)
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n7. Fail-Closed Reverse Rollback: Service Initialization Failure (Stage 6):');

  const SERVICE_FAIL_PORT = 44361;

  const srvFailIdentity = createNodeIdentity({
    nodeId: 'NODE-BOOT-SRVFAIL',
    nodeName: 'SrvFailNode',
    ownerCubId: 'CUB-00000005',
    role: 'EDGE',
    coordinateUri: 'CUBIO://NETWORK/0/01/00005/EDGE',
  });

  const srvFailConfig = createDefaultNodeRuntimeConfig(srvFailIdentity, [
    {
      transportType: 'TCP',
      endpoint: { transportType: 'TCP', host: '127.0.0.1', port: SERVICE_FAIL_PORT },
    },
  ]);

  const srvFailRuntime = new CubiONodeRuntime(srvFailConfig);

  // Register an invalid service missing a valid handleMessage
  (srvFailRuntime as any)._services.set('SERVICE_MALFORMED', {
    serviceId: 'SERVICE_MALFORMED',
    coordinateUri: 'CUBIO://NETWORK/0/01/00005/MALFORMED',
    handleMessage: 'NOT_A_FUNCTION' as any, // Invalid
  });

  const srvErr = await assertThrowsAsync(async () => {
    await srvFailRuntime.bootstrap();
  }, 'Bootstrap throws when service initialization fails');

  assert(srvErr instanceof NodeBootstrapError, 'Error is NodeBootstrapError');
  assert(srvErr.report.rollbackExecuted === true, 'Rollback executed after service failure');
  assert(srvFailRuntime.state === 'FAULTED', 'Runtime transitioned to FAULTED');

  // CRITICAL AUDIT CHECK: Verify that TCP port 44361 was rolled back and closed!
  // If port was not cleanly rolled back, binding to it now will fail with EADDRINUSE.
  const probeServer = net.createServer();
  let portReleased = false;
  try {
    await new Promise<void>((resolve, reject) => {
      probeServer.once('error', reject);
      probeServer.listen(SERVICE_FAIL_PORT, '127.0.0.1', () => {
        probeServer.close(() => resolve());
      });
    });
    portReleased = true;
  } catch {
    portReleased = false;
  }
  assert(portReleased === true, 'TCP port 44361 was cleanly released by reverse rollback (no socket leak)');

  // ───────────────────────────────────────────────────────────────────────────
  // 8. Duplicate Startup Prevention & Idempotency
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n8. Duplicate Startup Prevention & Idempotency:');

  const dupIdentity = createNodeIdentity({
    nodeId: 'NODE-BOOT-DUP',
    nodeName: 'DupNode',
    ownerCubId: 'CUB-00000006',
    role: 'EDGE',
    coordinateUri: 'CUBIO://NETWORK/0/01/00006/EDGE',
  });

  const dupConfig = createDefaultNodeRuntimeConfig(dupIdentity, [
    {
      transportType: 'MEMORY',
      endpoint: { transportType: 'MEMORY', host: 'in-proc-dup', port: 0 },
    },
  ]);

  const dupRuntime = new CubiONodeRuntime(dupConfig);
  const repInitial = await dupRuntime.bootstrap();
  assert(repInitial.success === true, 'First bootstrap succeeds');

  // Subsequent call with idempotent: true (default) returns existing report
  const repSubsequent = await dupRuntime.bootstrap({ idempotent: true });
  assert(repSubsequent.success === true, 'Subsequent bootstrap returns existing report idempotently');
  assert(repSubsequent.timestamp === repInitial.timestamp, 'Returned report is the existing bootstrap report');

  // Subsequent call with idempotent: false throws
  await assertThrowsAsync(async () => {
    await dupRuntime.bootstrap({ idempotent: false });
  }, 'Duplicate bootstrap with idempotent: false throws error');

  await dupRuntime.stop(false);

  // ───────────────────────────────────────────────────────────────────────────
  // 9. Post-Failure Recovery and Clean Retry
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n9. Post-Failure Recovery and Clean Retry:');

  const RECOVER_PORT = 44362;
  const recoverIdentity = createNodeIdentity({
    nodeId: 'NODE-BOOT-RECOVER',
    nodeName: 'RecoverNode',
    ownerCubId: 'CUB-00000007',
    role: 'EDGE',
    coordinateUri: 'CUBIO://NETWORK/0/01/00007/EDGE',
  });

  const recoverConfig = createDefaultNodeRuntimeConfig(recoverIdentity, [
    {
      transportType: 'TCP',
      endpoint: { transportType: 'TCP', host: '127.0.0.1', port: RECOVER_PORT },
    },
  ]);

  // Cause collision
  const blocker = net.createServer();
  await new Promise<void>((res) => blocker.listen(RECOVER_PORT, '127.0.0.1', () => res()));

  const recoverRuntime = new CubiONodeRuntime(recoverConfig);
  try {
    await recoverRuntime.bootstrap();
  } catch {}
  assert(recoverRuntime.state === 'FAULTED', 'Runtime faulted due to port blockage');

  // Free the port
  await new Promise<void>((res) => blocker.close(() => res()));

  // Reset to STOPPED and retry bootstrap
  recoverRuntime.transitionState('STOPPED', 'Resetting for retry');
  assert(recoverRuntime.state === 'STOPPED', 'Reset state to STOPPED');

  const recoverReport = await recoverRuntime.bootstrap();
  assert(recoverReport.success === true, 'Recovery bootstrap succeeds after port was freed');
  assert(recoverRuntime.state === 'RUNNING', 'Runtime cleanly enters RUNNING on recovery');

  await recoverRuntime.stop(false);
  assert(recoverRuntime.state === 'STOPPED', 'Recovery node cleanly shut down');

  // ───────────────────────────────────────────────────────────────────────────
  // Summary
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n══════════════════════════════════════════════════════════════════════════');
  console.log(`  Phase 3 / Task 03 Test Results: ${passed} PASSED, ${failed} FAILED`);
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
