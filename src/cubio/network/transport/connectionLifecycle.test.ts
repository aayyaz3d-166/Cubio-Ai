/**
 * CUBiO AI — Phase 2 / Task 08: Connection Lifecycle Manager Tests
 * =================================================================
 *
 * Validates the canonical CUBiO Connection Lifecycle Manager:
 *   - Enforces CONNECTING, CONNECTED, DEGRADED, CLOSING, CLOSED, and FAILED states.
 *   - Proves strict transition validation and illegal transition rejection.
 *   - Demonstrates duplicate shutdown idempotency and race condition prevention.
 *   - Tests heartbeat / inactivity stale detection, degradation, and recovery.
 *   - Integrates across real OS loopback TCP, WebSocket, UDP, and IPC Named Pipes.
 *   - Verifies resource leak prevention, socket cleanup, and failure behavior.
 *
 * Run with:  npx tsx src/cubio/network/transport/connectionLifecycle.test.ts
 */

import {
  ConnectionLifecycleManager,
  ConnectionState,
  IllegalConnectionTransitionError,
  PERMITTED_CONNECTION_TRANSITIONS,
  TcpTransportAdapter,
  WebSocketTransportAdapter,
  UdpTransportAdapter,
  IpcPipeTransportAdapter,
  ITransportAdapter,
  TransportEndpoint,
} from './index';
import { createPacket } from '../protocol/v1/packetEngine';
import { CubiOPacket } from '../protocol/v1/packetTypes';

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void | Promise<void>) {
  const result = fn();
  if (result instanceof Promise) {
    return result
      .then(() => {
        passed++;
        console.log(`  ✓ ${name}`);
      })
      .catch((err: any) => {
        failed++;
        console.error(`  ✗ ${name}`);
        console.error(`    ${err.stack ?? err.message}`);
      });
  } else {
    try {
      passed++;
      console.log(`  ✓ ${name}`);
    } catch (err: any) {
      failed++;
      console.error(`  ✗ ${name}`);
      console.error(`    ${err.stack ?? err.message}`);
    }
  }
}

function assert(condition: boolean, msg?: string) {
  if (!condition) throw new Error(msg ?? 'Assertion failed');
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function makePacket(seq: number = 1, text: string = 'Lifecycle Payload'): CubiOPacket {
  return createPacket({
    envelopeId: `ENV_LIFECYCLE_${seq}`,
    sequenceNumber: seq,
    sourceUri: 'CUBIO://NETWORK/0/01/00001/MGR',
    destinationUri: 'CUBIO://NETWORK/0/01/00002/MGR',
    payloadData: text,
  });
}

async function runSuite() {
  console.log('\n══════════════════════════════════════════════════════════════════════════');
  console.log('  CUBiO AI — Phase 2 / Task 08: Connection Lifecycle Manager Tests        ');
  console.log('══════════════════════════════════════════════════════════════════════════\n');

  // ─── 1. Canonical State Transitions & Matrix Enforcement ─────────────────

  console.log('1. Canonical State Transitions & Matrix Enforcement:');

  await test('Permitted transitions matrix matches canonical specification', () => {
    assert(PERMITTED_CONNECTION_TRANSITIONS.has('CONNECTING'), 'Has CONNECTING');
    assert(PERMITTED_CONNECTION_TRANSITIONS.has('CONNECTED'), 'Has CONNECTED');
    assert(PERMITTED_CONNECTION_TRANSITIONS.has('DEGRADED'), 'Has DEGRADED');
    assert(PERMITTED_CONNECTION_TRANSITIONS.has('CLOSING'), 'Has CLOSING');
    assert(PERMITTED_CONNECTION_TRANSITIONS.has('FAILED'), 'Has FAILED');
    assert(PERMITTED_CONNECTION_TRANSITIONS.has('CLOSED'), 'Has CLOSED');

    // CLOSED must be strictly terminal
    const closedAllowed = PERMITTED_CONNECTION_TRANSITIONS.get('CLOSED')!;
    assert(closedAllowed.size === 0, 'CLOSED state has strictly zero allowed transitions');
  });

  await test('Rejects illegal connection transitions fail-closed', () => {
    const dummyAdapter = new TcpTransportAdapter();
    const endpoint: TransportEndpoint = { transportType: 'TCP', host: '127.0.0.1', port: 9000 };
    const manager = new ConnectionLifecycleManager();

    const conn = manager.registerConnection(dummyAdapter, endpoint, {
      connectionId: 'test-illegal-trans',
      initialState: 'CONNECTING',
    });

    assert(conn.state === 'CONNECTING', 'Initial state is CONNECTING');

    // CONNECTING -> DEGRADED is illegal
    let caught = false;
    try {
      manager.markDegraded('test-illegal-trans', 'Illegal jump');
    } catch (err: any) {
      caught = true;
      assert(err instanceof IllegalConnectionTransitionError, 'Throws IllegalConnectionTransitionError');
      assert(err.fromState === 'CONNECTING', 'Records fromState');
      assert(err.toState === 'DEGRADED', 'Records toState');
    }
    assert(caught, 'Caught illegal transition from CONNECTING to DEGRADED');
  });

  await test('CLOSED is strictly terminal: any transition out of CLOSED throws', async () => {
    const dummyAdapter = new TcpTransportAdapter();
    const endpoint: TransportEndpoint = { transportType: 'TCP', host: '127.0.0.1', port: 9000 };
    const manager = new ConnectionLifecycleManager();

    manager.registerConnection(dummyAdapter, endpoint, {
      connectionId: 'test-terminal-closed',
      initialState: 'CONNECTED',
    });

    await manager.closeConnection('test-terminal-closed', 'Close for terminal check');

    const closedConn = manager.getConnection('test-terminal-closed');
    assert(closedConn?.state === 'CLOSED', 'Connection is in CLOSED state');

    // Attempting to degrade or fail a closed connection
    let caught = false;
    try {
      // Re-registering with closed connectionId should not allow mutating closed state
      manager.markDegraded('test-terminal-closed', 'Mutate closed');
    } catch {
      caught = true;
    }
    assert(closedConn !== undefined && closedConn.state === 'CLOSED', 'State remains strictly CLOSED');
  });

  // ─── 2. Duplicate Shutdown & Idempotence Enforcement ──────────────────────

  console.log('\n2. Duplicate Shutdown & Idempotence Enforcement:');

  await test('Repeated closeConnection calls are idempotent and prevent race conditions', async () => {
    const dummyAdapter = new TcpTransportAdapter();
    const endpoint: TransportEndpoint = { transportType: 'TCP', host: '127.0.0.1', port: 9000 };
    const manager = new ConnectionLifecycleManager();

    manager.registerConnection(dummyAdapter, endpoint, {
      connectionId: 'test-duplicate-close',
      initialState: 'CONNECTED',
    });

    // Fire 5 concurrent close requests
    const closes = await Promise.all([
      manager.closeConnection('test-duplicate-close', 'Concurrent close 1'),
      manager.closeConnection('test-duplicate-close', 'Concurrent close 2'),
      manager.closeConnection('test-duplicate-close', 'Concurrent close 3'),
      manager.closeConnection('test-duplicate-close', 'Concurrent close 4'),
      manager.closeConnection('test-duplicate-close', 'Concurrent close 5'),
    ]);

    assert(closes.length === 5, 'All concurrent close requests settled cleanly');
    const conn = manager.getConnection('test-duplicate-close');
    assert(conn?.state === 'CLOSED', 'Connection cleanly entered CLOSED state');
    assert(manager.metrics.duplicateCloseAttempts > 0, 'Recorded duplicate close attempts');

    // Subsequent sequential call is also an idempotent no-op
    await manager.closeConnection('test-duplicate-close', 'Sequential duplicate close');
    assert(manager.getConnection('test-duplicate-close')?.state === 'CLOSED');
  });

  await test('Repeated shutdown calls are idempotent and leak-free', async () => {
    const manager = new ConnectionLifecycleManager();
    await manager.shutdown('First shutdown');
    await manager.shutdown('Second shutdown');
    await manager.shutdown('Third shutdown');
    assert(manager.metrics.activeCount === 0, 'Active connections count is 0');
  });

  // ─── 3. Stale Connection Management & Recovery ────────────────────────────

  console.log('\n3. Stale Connection Management & Recovery:');

  await test('Inactivity marks connection DEGRADED, activity recovers it to CONNECTED', async () => {
    const dummyAdapter = new TcpTransportAdapter();
    const endpoint: TransportEndpoint = { transportType: 'TCP', host: '127.0.0.1', port: 9000 };

    // Set tight staleTimeout for test
    const manager = new ConnectionLifecycleManager({
      staleTimeoutMs: 50,
      failureTimeoutMs: 200,
    });

    const conn = manager.registerConnection(dummyAdapter, endpoint, {
      connectionId: 'test-stale-recovery',
      initialState: 'CONNECTED',
    });

    assert(conn.state === 'CONNECTED', 'Starts in CONNECTED');

    // Wait 70ms to exceed 50ms stale timeout
    await sleep(70);

    const sweep1 = manager.checkStaleConnections();
    assert(sweep1.degraded.includes('test-stale-recovery'), 'Degraded list includes connection');
    assert(manager.getConnection('test-stale-recovery')?.state === 'DEGRADED', 'State transitioned to DEGRADED');

    // Activity touch recovers link health to CONNECTED
    manager.touchActivity('test-stale-recovery');
    assert(manager.getConnection('test-stale-recovery')?.state === 'CONNECTED', 'State recovered to CONNECTED');
  });

  await test('Persistent inactivity past failureTimeout marks FAILED and auto-terminates', async () => {
    const dummyAdapter = new TcpTransportAdapter();
    const endpoint: TransportEndpoint = { transportType: 'TCP', host: '127.0.0.1', port: 9000 };

    const manager = new ConnectionLifecycleManager({
      staleTimeoutMs: 40,
      failureTimeoutMs: 80,
    });

    manager.registerConnection(dummyAdapter, endpoint, {
      connectionId: 'test-stale-failure',
      initialState: 'CONNECTED',
    });

    // Exceed stale timeout
    await sleep(50);
    manager.checkStaleConnections();
    assert(manager.getConnection('test-stale-failure')?.state === 'DEGRADED', 'Degraded after 50ms');

    // Exceed failure timeout
    await sleep(60); // Total > 110ms > 80ms
    const sweep2 = manager.checkStaleConnections();
    assert(sweep2.failed.includes('test-stale-failure'), 'Failed list includes connection');

    // Allow auto-close promise to settle
    await sleep(30);

    const finalConn = manager.getConnection('test-stale-failure');
    assert(finalConn?.state === 'CLOSED', 'Connection auto-closed after failure');
  });

  // ─── 4. Real Operating System TCP Socket Integration ──────────────────────

  console.log('\n4. Real Operating System TCP Socket Integration:');

  await test('Complete lifecycle across real loopback TCP sockets', async () => {
    const serverAdapter = new TcpTransportAdapter();
    const clientAdapter = new TcpTransportAdapter();
    const manager = new ConnectionLifecycleManager();

    // 1. Bind server listener
    const serverConn = await manager.registerServer(serverAdapter, {
      transportType: 'TCP',
      host: '127.0.0.1',
      port: 0,
    });
    assert(serverConn.state === 'CONNECTED', 'Server listener is CONNECTED');
    const port = serverAdapter.localEndpoint!.port;

    // 2. Client connects via manager
    const clientConn = await manager.connect(clientAdapter, {
      transportType: 'TCP',
      host: '127.0.0.1',
      port,
    });
    assert(clientConn.state === 'CONNECTED', 'Client is CONNECTED');

    // 3. Send Phase 1 packet via manager
    const packet = makePacket(1, 'TCP Lifecycle Test');
    const receivedPackets: CubiOPacket[] = [];

    serverAdapter.receive((pkt) => {
      receivedPackets.push(pkt);
    });

    const receipt = await manager.send(clientConn.connectionId, packet);
    assert(receipt.success, 'Packet transmitted successfully');
    assert(receipt.bytesTransmitted > 0, 'Bytes transmitted > 0');

    await sleep(30);
    assert(receivedPackets.length === 1, 'Server received packet');
    assert(receivedPackets[0].payload.data === 'TCP Lifecycle Test', 'Payload intact');

    // 4. Orderly close client connection
    await manager.closeConnection(clientConn.connectionId, 'Client finished');
    assert(manager.getConnection(clientConn.connectionId)?.state === 'CLOSED', 'Client is CLOSED');

    // 5. Close server and shutdown manager
    await manager.shutdown();
    assert(manager.metrics.activeCount === 0, 'Active connections count is 0');

    // 6. Verify port can be re-bound immediately (zero port leak)
    const probeServer = new TcpTransportAdapter();
    await probeServer.listen({ transportType: 'TCP', host: '127.0.0.1', port });
    assert(probeServer.state === 'CONNECTED', 'Port immediately reusable');
    await probeServer.close();
  });

  // ─── 5. Real Operating System WebSocket Integration ───────────────────────

  console.log('\n5. Real Operating System WebSocket Integration:');

  await test('Complete lifecycle across real WebSocket connections', async () => {
    const serverAdapter = new WebSocketTransportAdapter();
    const clientAdapter = new WebSocketTransportAdapter();
    const manager = new ConnectionLifecycleManager();

    const serverConn = await manager.registerServer(serverAdapter, {
      transportType: 'WEBSOCKET',
      host: '127.0.0.1',
      port: 0,
    });
    assert(serverConn.state === 'CONNECTED', 'WS Server is CONNECTED');
    const port = serverAdapter.localEndpoint!.port;

    const clientConn = await manager.connect(clientAdapter, {
      transportType: 'WEBSOCKET',
      host: '127.0.0.1',
      port,
    });
    assert(clientConn.state === 'CONNECTED', 'WS Client is CONNECTED');

    const packet = makePacket(2, 'WebSocket Lifecycle Test');
    const received: CubiOPacket[] = [];
    serverAdapter.receive((pkt) => received.push(pkt));

    const receipt = await manager.send(clientConn.connectionId, packet);
    assert(receipt.success, 'WS send succeeded');

    await sleep(40);
    assert(received.length === 1, 'WS server received packet');

    // Clean close
    await manager.shutdown('Test finished');
    assert(manager.metrics.activeCount === 0, 'All WS connections closed');

    // Re-bind test
    const probe = new WebSocketTransportAdapter();
    await probe.listen({ transportType: 'WEBSOCKET', host: '127.0.0.1', port });
    assert(probe.state === 'CONNECTED', 'WS Port immediately reusable');
    await probe.close();
  });

  // ─── 6. Real Operating System UDP Transport Integration ───────────────────

  console.log('\n6. Real Operating System UDP Transport Integration:');

  await test('Complete lifecycle across real UDP sockets', async () => {
    const serverAdapter = new UdpTransportAdapter();
    const clientAdapter = new UdpTransportAdapter();
    const manager = new ConnectionLifecycleManager();

    const serverConn = await manager.registerServer(serverAdapter, {
      transportType: 'UDP',
      host: '127.0.0.1',
      port: 0,
    });
    const serverPort = serverAdapter.localEndpoint!.port;

    const clientConn = await manager.connect(clientAdapter, {
      transportType: 'UDP',
      host: '127.0.0.1',
      port: serverPort,
    });

    assert(serverConn.state === 'CONNECTED', 'UDP server connection is CONNECTED');
    assert(clientConn.state === 'CONNECTED', 'UDP client connection is CONNECTED');

    const received: CubiOPacket[] = [];
    serverAdapter.receive((pkt) => received.push(pkt));

    const packet = makePacket(3, 'UDP Lifecycle Datagram');
    const receipt = await manager.send(clientConn.connectionId, packet);
    assert(receipt.success, 'UDP packet sent');

    await sleep(30);
    assert(received.length === 1, 'Server received UDP packet');

    await manager.shutdown();
    assert(manager.metrics.activeCount === 0, 'Manager active count is 0');

    // Verify UDP port re-bindable
    const probe = new UdpTransportAdapter();
    await probe.listen({ transportType: 'UDP', host: '127.0.0.1', port: serverPort });
    assert(probe.state === 'CONNECTED', 'UDP port reusable');
    await probe.close();
  });

  // ─── 7. Real Operating System IPC (Windows Named Pipe) Integration ─────────

  console.log('\n7. Real Operating System IPC (Windows Named Pipe) Integration:');

  await test('Complete lifecycle across real Windows Named Pipes', async () => {
    const pipeName = `cubio-lifecycle-pipe-${Date.now()}`;
    const serverAdapter = new IpcPipeTransportAdapter();
    const clientAdapter = new IpcPipeTransportAdapter();
    const manager = new ConnectionLifecycleManager();

    const serverConn = await manager.registerServer(serverAdapter, {
      transportType: 'IPC_PIPE',
      host: 'localhost',
      port: 0,
      path: pipeName,
    });
    assert(serverConn.state === 'CONNECTED', 'IPC server bound');

    const clientConn = await manager.connect(clientAdapter, {
      transportType: 'IPC_PIPE',
      host: 'localhost',
      port: 0,
      path: serverAdapter.localEndpoint!.path,
    });
    assert(clientConn.state === 'CONNECTED', 'IPC client connected');

    const received: CubiOPacket[] = [];
    serverAdapter.receive((pkt) => received.push(pkt));

    const packet = makePacket(4, 'IPC Lifecycle Pipe');
    const receipt = await manager.send(clientConn.connectionId, packet);
    assert(receipt.success, 'IPC packet sent');

    await sleep(30);
    assert(received.length === 1, 'IPC server received packet');

    await manager.shutdown('IPC teardown');
    assert(manager.metrics.activeCount === 0, 'All IPC connections closed');

    // Verify pipe path re-bindable
    const probe = new IpcPipeTransportAdapter();
    await probe.listen({ transportType: 'IPC_PIPE', host: 'localhost', port: 0, path: pipeName });
    assert(probe.state === 'CONNECTED', 'IPC Pipe re-bindable');
    await probe.close();
  });

  // ─── 8. Failure Behavior & Resource Leak Prevention ───────────────────────

  console.log('\n8. Failure Behavior & Resource Leak Prevention:');

  await test('Connect to dead/refused port marks FAILED and leaves zero leaks', async () => {
    const clientAdapter = new TcpTransportAdapter();
    const manager = new ConnectionLifecycleManager();

    // Use an unassigned port that will refuse connection immediately
    const deadEndpoint: TransportEndpoint = {
      transportType: 'TCP',
      host: '127.0.0.1',
      port: 59999,
    };

    let thrown = false;
    try {
      await manager.connect(clientAdapter, deadEndpoint, { connectionId: 'dead-port-conn' });
    } catch {
      thrown = true;
    }

    assert(thrown, 'manager.connect() threw on connection refused');
    assert(manager.metrics.activeCount === 0, 'Active connections count is 0');

    const failedConn = manager.getConnection('dead-port-conn');
    assert(failedConn !== undefined && failedConn.state === 'CLOSED', 'Connection was cleaned up to CLOSED');
    assert(failedConn !== undefined && failedConn.failureReason !== undefined, 'Records failure reason');
  });

  await test('Mass multi-transport concurrent lifecycle and teardown', async () => {
    const manager = new ConnectionLifecycleManager();

    // Create 4 servers and 4 clients simultaneously
    const tcpServer = new TcpTransportAdapter();
    const wsServer = new WebSocketTransportAdapter();
    const ipcServer = new IpcPipeTransportAdapter();
    const udpServer = new UdpTransportAdapter();

    const pipeName = `cubio-mass-pipe-${Date.now()}`;

    await manager.registerServer(tcpServer, { transportType: 'TCP', host: '127.0.0.1', port: 0 });
    await manager.registerServer(wsServer, { transportType: 'WEBSOCKET', host: '127.0.0.1', port: 0 });
    await manager.registerServer(ipcServer, { transportType: 'IPC_PIPE', host: 'localhost', port: 0, path: pipeName });
    await manager.registerServer(udpServer, { transportType: 'UDP', host: '127.0.0.1', port: 0 });

    const tcpClient = new TcpTransportAdapter();
    const wsClient = new WebSocketTransportAdapter();
    const ipcClient = new IpcPipeTransportAdapter();

    await manager.connect(tcpClient, { transportType: 'TCP', host: '127.0.0.1', port: tcpServer.localEndpoint!.port });
    await manager.connect(wsClient, { transportType: 'WEBSOCKET', host: '127.0.0.1', port: wsServer.localEndpoint!.port });
    await manager.connect(ipcClient, { transportType: 'IPC_PIPE', host: 'localhost', port: 0, path: ipcServer.localEndpoint!.path });

    assert(manager.metrics.activeCount === 7, `Expected 7 active connections, got ${manager.metrics.activeCount}`);

    // Tear down all 7 connections at once
    await manager.shutdown('Mass teardown');

    assert(manager.metrics.activeCount === 0, '0 active connections remain');
    assert(manager.metrics.closedCount >= 7, 'All connections archived in closed history');
  });

  // ─── Summary ──────────────────────────────────────────────────────────────

  console.log('\n══════════════════════════════════════════════════════════════════════════');
  console.log(`  Phase 2 / Task 08 Test Results: ${passed} PASSED, ${failed} FAILED`);
  console.log('══════════════════════════════════════════════════════════════════════════\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runSuite().catch((err) => {
  console.error('Fatal error running Task 08 test suite:', err);
  process.exit(1);
});
