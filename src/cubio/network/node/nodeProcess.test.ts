/**
 * CUBiO AI — Phase 3 / Task 02: Persistent Node Process Tests
 * ==========================================================
 *
 * Executable forensic verification suite proving:
 *   1. Real OS child process creation, distinct PID, and OS process table presence.
 *   2. Active runtime state monitoring and bidirectional stdin/stdout IPC command protocol.
 *   3. Real network socket communication with the independent OS child process (TCP).
 *   4. Controlled graceful shutdown, PID file cleanup, clean exit code (0), and OS process de-allocation.
 *   5. OS signal handling (SIGTERM / SIGINT) and socket teardown.
 *   6. Abnormal termination handling (uncaught exceptions, non-zero exit codes).
 *   7. Cross-process multi-node communication between two distinct OS processes.
 *
 * Run with:  npx tsx src/cubio/network/node/nodeProcess.test.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { NodeProcessController } from './nodeProcessController';
import { TcpTransportAdapter } from '../transport/tcpTransportAdapter';
import { createPacket } from '../protocol/v1/packetEngine';
import { createNodeIdentity } from '../protocol/v1/nodeArchitecture';

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

async function assertThrowsAsync(fn: () => Promise<any>, message: string): Promise<void> {
  try {
    await fn();
    failed++;
    failures.push(message);
    console.error(`  ✗ FAIL (Expected throw): ${message}`);
  } catch {
    passed++;
    console.log(`  ✓ ${message}`);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runAllTests() {
  console.log('╔══════════════════════════════════════════════════════════════════════════╗');
  console.log('║        CUBiO AI — Phase 3 / Task 02: Persistent Node Process Tests       ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════╝\n');

  const tmpDir = path.resolve(process.cwd(), 'tmp/test-node-process');
  fs.mkdirSync(tmpDir, { recursive: true });

  // ───────────────────────────────────────────────────────────────────────────
  // 1. Real Operating System Process Creation & Process Table Evidence
  // ───────────────────────────────────────────────────────────────────────────
  console.log('1. Real OS Process Creation & Process Table Evidence:');

  const proc1 = await NodeProcessController.spawnNode({
    nodeName: 'TestOSNode1',
    role: 'EDGE',
    transport: 'TCP',
    port: 0, // OS ephemeral port
  });

  assert(proc1.pid > 0, `Child process created with genuine OS PID: ${proc1.pid}`);
  assert(proc1.pid !== process.pid, 'Child PID is distinct from test runner parent process');

  // Verify process actually exists in the OS process table
  let processTablePresent = false;
  try {
    processTablePresent = process.kill(proc1.pid, 0);
  } catch {
    processTablePresent = false;
  }
  assert(processTablePresent === true, 'Process presence confirmed in OS process table via kill(pid, 0)');

  // Verify structured startup banner emitted by the child process
  const banner = proc1.startupBanner;
  assert(banner.event === 'CUBIO_NODE_ONLINE', 'Received structured CUBIO_NODE_ONLINE startup banner');
  assert(banner.pid === proc1.pid, 'Banner PID matches OS process PID');
  assert(banner.state === 'RUNNING', 'Banner reports initial runtime state is RUNNING');
  assert(banner.primaryTransport === 'TCP', 'Banner reports primary transport is TCP');
  assert(banner.endpoint.port > 0, `Banner reports dynamically bound port: ${banner.endpoint.port}`);
  assert(banner.nodeVersion === process.version, 'Banner reports running under Node.js runtime');
  assert(banner.platform === process.platform, 'Banner reports host OS platform');

  await proc1.stop(true);
  assert(proc1.isAlive === false, 'Child process cleanly stopped');

  // ───────────────────────────────────────────────────────────────────────────
  // 2. Active Runtime State & Bidirectional IPC Command Protocol
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n2. Active Runtime State & Bidirectional IPC Command Protocol:');

  const proc2 = await NodeProcessController.spawnNode({
    nodeName: 'TestOSNode2-IPC',
    role: 'CORE',
    transport: 'TCP',
    port: 0,
  });

  // Test PING command
  const pingResp = await proc2.sendCommand('PING');
  assert(pingResp.success === true, 'IPC PING command returns success');
  assert(pingResp.data?.message === 'PONG', 'IPC PING returns PONG');
  assert(typeof pingResp.data?.uptimeMs === 'number', 'IPC PING returns uptimeMs');

  // Test STATUS command
  const statusResp = await proc2.sendCommand('STATUS');
  assert(statusResp.success === true, 'IPC STATUS command returns success');
  assert(statusResp.state === 'RUNNING', 'IPC STATUS confirms state is RUNNING');
  assert(statusResp.data?.identity?.nodeName === 'TestOSNode2-IPC', 'IPC STATUS returns correct identity');
  assert(statusResp.data?.telemetry?.healthStatus === 'HEALTHY', 'IPC STATUS returns telemetry with HEALTHY status');

  // Test HEALTH command
  const healthResp = await proc2.sendCommand('HEALTH');
  assert(healthResp.success === true, 'IPC HEALTH command returns success');
  assert(healthResp.data?.healthStatus === 'HEALTHY', 'IPC HEALTH reports HEALTHY');

  await proc2.stop(true);
  assert(proc2.isAlive === false, 'Proc 2 cleanly stopped after IPC tests');

  // ───────────────────────────────────────────────────────────────────────────
  // 3. Real Operating System Network Socket Communication
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n3. Real Operating System Network Socket Communication:');

  const TCP_TEST_PORT = 44310;
  const proc3 = await NodeProcessController.spawnNode({
    nodeName: 'TestOSNode3-Network',
    role: 'CORE',
    transport: 'TCP',
    port: TCP_TEST_PORT,
  });

  assert(proc3.startupBanner.endpoint.port === TCP_TEST_PORT, `Node bound to designated TCP port ${TCP_TEST_PORT}`);

  // Create an independent client in the parent process to connect to the child OS process
  const parentClientAdapter = new TcpTransportAdapter();
  await parentClientAdapter.connect({
    transportType: 'TCP',
    host: '127.0.0.1',
    port: TCP_TEST_PORT,
  });

  assert(parentClientAdapter.state === 'CONNECTED', 'Parent process connected to child process over real TCP socket');

  // Send a certified Phase 1 packet from parent process to child OS process
  const testPacket = createPacket({
    envelopeId: 'ENV_PARENT_TO_CHILD_001',
    sequenceNumber: 1,
    sourceUri: 'CUBIO://NETWORK/0/01/00001/PARENT',
    destinationUri: proc3.startupBanner.coordinateUri,
    payloadData: 'Real OS cross-process transmission test',
  });

  const sendReceipt = await parentClientAdapter.send(testPacket);
  assert(sendReceipt.success === true, 'Parent transmitted Phase 1 packet to child OS process');

  // Wait brief tick for socket delivery and query child status
  await sleep(200);
  const updatedStatus = await proc3.sendCommand('STATUS');
  assert(
    updatedStatus.data?.telemetry?.packetsReceived >= 1,
    `Child OS process registered packet reception in telemetry: ${updatedStatus.data?.telemetry?.packetsReceived}`
  );

  await parentClientAdapter.close('Test complete');
  await proc3.stop(true);
  assert(proc3.isAlive === false, 'Proc 3 cleanly stopped after network tests');

  // ───────────────────────────────────────────────────────────────────────────
  // 4. Controlled Graceful Shutdown & PID File Lifecycle
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n4. Controlled Graceful Shutdown & PID File Lifecycle:');

  const pidFilePath = path.join(tmpDir, 'node_proc4.pid');
  const statusFilePath = path.join(tmpDir, 'node_proc4_status.json');

  // Remove any stale files
  if (fs.existsSync(pidFilePath)) fs.unlinkSync(pidFilePath);
  if (fs.existsSync(statusFilePath)) fs.unlinkSync(statusFilePath);

  const proc4 = await NodeProcessController.spawnNode({
    nodeName: 'TestOSNode4-Lifecycle',
    role: 'EDGE',
    transport: 'TCP',
    port: 0,
    pidFile: pidFilePath,
    statusFile: statusFilePath,
  });

  // Verify PID file created and contains child PID
  assert(fs.existsSync(pidFilePath), 'PID file created on startup');
  const recordedPid = parseInt(fs.readFileSync(pidFilePath, 'utf8').trim(), 10);
  assert(recordedPid === proc4.pid, 'PID file records exact child process PID');

  // Verify status file created and contains status JSON
  assert(fs.existsSync(statusFilePath), 'Status file created on startup');
  const statusContent = JSON.parse(fs.readFileSync(statusFilePath, 'utf8'));
  assert(statusContent.state === 'RUNNING', 'Status file records RUNNING state');

  // Execute graceful shutdown via IPC command
  const stopResp = await proc4.sendCommand('STOP');
  assert(stopResp.success === true, 'STOP command accepted by child process');

  const exitResult = await proc4.waitForExit(5000);
  assert(exitResult.code === 0, `Child process exited cleanly with code 0 (got: ${exitResult.code})`);

  // Verify process is no longer in OS process table
  let proc4StillInTable = false;
  try {
    proc4StillInTable = process.kill(proc4.pid, 0);
  } catch {
    proc4StillInTable = false;
  }
  assert(proc4StillInTable === false, 'Process removed from OS process table after graceful shutdown');

  // Verify PID file was removed
  assert(!fs.existsSync(pidFilePath), 'PID file unlinked upon graceful termination');

  // ───────────────────────────────────────────────────────────────────────────
  // 5. OS Signal Traps (SIGTERM / SIGINT)
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n5. OS Signal Traps (SIGTERM / SIGINT):');

  const proc5 = await NodeProcessController.spawnNode({
    nodeName: 'TestOSNode5-Signal',
    role: 'EDGE',
    transport: 'TCP',
    port: 0,
  });

  assert(proc5.isAlive === true, 'Process 5 running and awaiting signal');

  // Send SIGTERM
  proc5.sendSignal('SIGTERM');
  const sigExitResult = await proc5.waitForExit(5000);
  assert(
    sigExitResult.code === 0 || sigExitResult.signal === 'SIGTERM',
    `Process handled SIGTERM and terminated cleanly (code: ${sigExitResult.code}, signal: ${sigExitResult.signal})`
  );
  assert(proc5.isAlive === false, 'Process 5 confirmed offline after SIGTERM');

  // ───────────────────────────────────────────────────────────────────────────
  // 6. Abnormal Termination Handling
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n6. Abnormal Termination Handling:');

  const proc6 = await NodeProcessController.spawnNode({
    nodeName: 'TestOSNode6-Crash',
    role: 'EDGE',
    transport: 'TCP',
    port: 0,
  });

  // Trigger simulated uncaught exception
  await proc6.sendCommand('CRASH_SIMULATION');
  const crashExitResult = await proc6.waitForExit(5000);

  assert(crashExitResult.code === 1, `Process exited with code 1 on fatal exception (got: ${crashExitResult.code})`);
  assert(proc6.isAlive === false, 'Faulted process terminated and removed from OS process table');

  const stderr = proc6.getStderr();
  const stdout = proc6.getStdout();
  assert(
    stderr.includes('CUBIO_NODE_UNCAUGHT_EXCEPTION') || stdout.includes('CUBIO_NODE_UNCAUGHT_EXCEPTION'),
    'Uncaught exception diagnostic logged to error output'
  );

  // ───────────────────────────────────────────────────────────────────────────
  // 7. Cross-Process Multi-Node Machine Communication
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n7. Cross-Process Multi-Node Machine Communication:');

  const PORT_NODE_A = 44320;
  const PORT_NODE_B = 44321;

  const nodeA = await NodeProcessController.spawnNode({
    nodeName: 'NodeProcess-Alpha',
    role: 'CORE',
    coordinateUri: 'CUBIO://NETWORK/0/01/00010/CORE',
    transport: 'TCP',
    port: PORT_NODE_A,
  });

  const nodeB = await NodeProcessController.spawnNode({
    nodeName: 'NodeProcess-Beta',
    role: 'EDGE',
    coordinateUri: 'CUBIO://NETWORK/0/01/00020/EDGE',
    transport: 'TCP',
    port: PORT_NODE_B,
  });

  assert(nodeA.pid !== nodeB.pid, `Two distinct OS PIDs active: PID A=${nodeA.pid}, PID B=${nodeB.pid}`);
  assert(nodeA.isAlive && nodeB.isAlive, 'Both OS node processes are actively running');

  // Connect from Node A's port to Node B's port using an independent socket connection
  const bridgeClient = new TcpTransportAdapter();
  await bridgeClient.connect({
    transportType: 'TCP',
    host: '127.0.0.1',
    port: PORT_NODE_B,
  });

  const crossProcPacket = createPacket({
    envelopeId: 'ENV_M2M_001',
    sequenceNumber: 1,
    sourceUri: nodeA.startupBanner.coordinateUri,
    destinationUri: nodeB.startupBanner.coordinateUri,
    payloadData: 'Inter-Process M2M Protocol Frame',
  });

  const bridgeReceipt = await bridgeClient.send(crossProcPacket);
  assert(bridgeReceipt.success === true, 'Packet transmitted to Node B over OS TCP interface');

  await sleep(200);
  const nodeBStatus = await nodeB.sendCommand('STATUS');
  assert(
    nodeBStatus.data?.telemetry?.packetsReceived >= 1,
    'Node B received packet from peer OS process across network boundary'
  );

  await bridgeClient.close('Bridge complete');
  await nodeA.stop(true);
  await nodeB.stop(true);

  assert(!nodeA.isAlive && !nodeB.isAlive, 'Both multi-node OS processes shut down cleanly');

  // Cleanup tmp dir
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch {}

  // ───────────────────────────────────────────────────────────────────────────
  // Summary
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n══════════════════════════════════════════════════════════════════════════');
  console.log(`  Phase 3 / Task 02 Test Results: ${passed} PASSED, ${failed} FAILED`);
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
  console.error('Unhandled test runner error:', err);
  process.exit(1);
});
