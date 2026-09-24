/**
 * CUBiO AI — Phase 2 / Task 16: Transport Performance Benchmark Suite
 * ====================================================================
 *
 * Measures real CUBiO transport performance under controlled conditions:
 *   - Evaluates Latency (min, p50, p95, p99, max, mean, stdDev), Throughput (MB/s),
 *     Message Rate (msg/s), Packet Rate (pkt/s), and CPU/Memory usage.
 *   - Tests representative payload tiers: Small (256 B), Medium (2 KB), Large (32 KB).
 *   - Separates Localhost (127.0.0.1) from Physical Network Interface (192.168.0.103).
 *   - Tests sustained concurrency and failure behavior under active load.
 *   - Preserves 100% production protocol validation & CRC checksum calculations.
 *   - Zero fabricated numbers: derived strictly from high-resolution OS timers.
 *
 * Run with:  npx tsx src/cubio/network/transport/transportBenchmark.test.ts
 */

import {
  getBenchmarkEnvironment,
  executeBenchmarkScenario,
  BenchmarkResult,
} from './transportBenchmark';
import {
  TcpTransportAdapter,
  CubiOTransportPipeline,
  TransportEndpoint,
  PipelineCorruptionError,
} from './index';
import { createEnvelope } from '../protocol/v1/protocolEngine';
import { createPacket } from '../protocol/v1/packetEngine';
import { serializeCanonicalPacket } from '../protocol/v1/canonicalSerializer';
import { ProtocolAddress, ProtocolPrincipal, ProtocolPayload } from '../protocol/v1/types';

let passed = 0;
let failed = 0;
const benchmarkResults: BenchmarkResult[] = [];

async function test(name: string, fn: () => void | Promise<void>) {
  try {
    const result = fn();
    if (result instanceof Promise) {
      await result;
    }
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err: any) {
    failed++;
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.stack ?? err.message}`);
  }
}

function assert(condition: boolean, msg?: string) {
  if (!condition) throw new Error(msg ?? 'Assertion failed');
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatResultSummary(res: BenchmarkResult): string {
  return (
    `[${res.transport} | ${res.interfaceType} | ${res.payloadTier}]\n` +
    `    • Latency: p50=${res.latency.p50Ms}ms, p95=${res.latency.p95Ms}ms, p99=${res.latency.p99Ms}ms, mean=${res.latency.meanMs}ms, min=${res.latency.minMs}ms, max=${res.latency.maxMs}ms\n` +
    `    • Rate: ${res.messageRateMsgSec} msg/sec | ${res.packetRatePktSec} pkt/sec\n` +
    `    • Throughput: ${res.throughputMbSec} MB/sec | Total: ${res.successfulEnvelopes}/${res.totalEnvelopes} msgs in ${res.durationMs}ms\n` +
    `    • Resources: CPU=${res.resources.cpuPercent.toFixed(1)}% | HeapDelta=${res.resources.heapDeltaKb > 0 ? '+' : ''}${res.resources.heapDeltaKb.toFixed(1)} KB`
  );
}

async function runBenchmarkSuite() {
  console.log('╔══════════════════════════════════════════════════════════════════════════╗');
  console.log('║    CUBiO AI — Phase 2 / Task 16: Transport Performance Benchmark Suite   ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════╝\n');

  const env = getBenchmarkEnvironment();
  console.log('--- SYSTEM & HARDWARE SPECIFICATIONS ---');
  console.log(`  • Host CPU: ${env.cpuModel} (${env.cpuCores} cores @ ${env.cpuSpeedMhz} MHz)`);
  console.log(`  • Host RAM: ${env.totalRamGb} GB Total (${env.freeRamGb} GB Available)`);
  console.log(`  • Host OS:  ${env.osPlatform} ${env.osRelease} (${env.osArch})`);
  console.log(`  • Runtime:  Node.js ${env.nodeVersion}`);
  console.log(`  • Physical: ${env.physicalIp} (Ethernet Adapter)\n`);

  const basePort = 12800;

  // ═════════════════════════════════════════════════════════════════════════
  // SECTION 1: Localhost Loopback Transport Benchmarks
  // ═════════════════════════════════════════════════════════════════════════
  console.log('--- SECTION 1: Localhost Loopback Benchmarks (127.0.0.1) ---');

  // 1.1 TCP Localhost (Small, Medium, Large)
  await test('1.1 Benchmark Localhost TCP across Small, Medium, and Large payload tiers', async () => {
    // Small
    const resSmall = await executeBenchmarkScenario({
      scenarioName: 'TCP_Localhost_Small',
      transport: 'TCP',
      interfaceType: 'LOCALHOST',
      host: '127.0.0.1',
      port: basePort,
      payloadTier: 'SMALL_256B',
      iterations: 30,
    });
    benchmarkResults.push(resSmall);
    console.log(`    ${formatResultSummary(resSmall)}`);

    // Medium
    const resMed = await executeBenchmarkScenario({
      scenarioName: 'TCP_Localhost_Medium',
      transport: 'TCP',
      interfaceType: 'LOCALHOST',
      host: '127.0.0.1',
      port: basePort + 1,
      payloadTier: 'MEDIUM_2KB',
      iterations: 25,
    });
    benchmarkResults.push(resMed);
    console.log(`    ${formatResultSummary(resMed)}`);

    // Large (Multi-packet fragments)
    const resLarge = await executeBenchmarkScenario({
      scenarioName: 'TCP_Localhost_Large',
      transport: 'TCP',
      interfaceType: 'LOCALHOST',
      host: '127.0.0.1',
      port: basePort + 2,
      payloadTier: 'LARGE_32KB',
      iterations: 15,
      mtu: 2048, // Generates 16+ packets per envelope
    });
    benchmarkResults.push(resLarge);
    console.log(`    ${formatResultSummary(resLarge)}`);

    assert(resSmall.successfulEnvelopes === 30, 'All 30 small TCP envelopes delivered');
    assert(resMed.successfulEnvelopes === 25, 'All 25 medium TCP envelopes delivered');
    assert(resLarge.successfulEnvelopes === 15, 'All 15 large TCP envelopes delivered');
  });

  // 1.2 WebSocket Localhost (Small, Medium, Large)
  await test('1.2 Benchmark Localhost WebSocket across Small, Medium, and Large payload tiers', async () => {
    const resSmall = await executeBenchmarkScenario({
      scenarioName: 'WS_Localhost_Small',
      transport: 'WEBSOCKET',
      interfaceType: 'LOCALHOST',
      host: '127.0.0.1',
      port: basePort + 10,
      payloadTier: 'SMALL_256B',
      iterations: 25,
    });
    benchmarkResults.push(resSmall);
    console.log(`    ${formatResultSummary(resSmall)}`);

    const resMed = await executeBenchmarkScenario({
      scenarioName: 'WS_Localhost_Medium',
      transport: 'WEBSOCKET',
      interfaceType: 'LOCALHOST',
      host: '127.0.0.1',
      port: basePort + 11,
      payloadTier: 'MEDIUM_2KB',
      iterations: 20,
    });
    benchmarkResults.push(resMed);
    console.log(`    ${formatResultSummary(resMed)}`);

    const resLarge = await executeBenchmarkScenario({
      scenarioName: 'WS_Localhost_Large',
      transport: 'WEBSOCKET',
      interfaceType: 'LOCALHOST',
      host: '127.0.0.1',
      port: basePort + 12,
      payloadTier: 'LARGE_32KB',
      iterations: 12,
      mtu: 2048,
    });
    benchmarkResults.push(resLarge);
    console.log(`    ${formatResultSummary(resLarge)}`);

    assert(resSmall.successfulEnvelopes === 25, 'All small WS envelopes delivered');
    assert(resMed.successfulEnvelopes === 20, 'All medium WS envelopes delivered');
    assert(resLarge.successfulEnvelopes === 12, 'All large WS envelopes delivered');
  });

  // 1.3 IPC Named Pipe Localhost (Small, Medium, Large)
  await test('1.3 Benchmark Localhost IPC Named Pipe across Small, Medium, and Large payload tiers', async () => {
    const resSmall = await executeBenchmarkScenario({
      scenarioName: 'IPC_Localhost_Small',
      transport: 'IPC',
      interfaceType: 'LOCALHOST',
      host: 'localhost',
      port: 0,
      pipePath: `cubio_bench_ipc_s_${Date.now()}`,
      payloadTier: 'SMALL_256B',
      iterations: 25,
    });
    benchmarkResults.push(resSmall);
    console.log(`    ${formatResultSummary(resSmall)}`);

    const resMed = await executeBenchmarkScenario({
      scenarioName: 'IPC_Localhost_Medium',
      transport: 'IPC',
      interfaceType: 'LOCALHOST',
      host: 'localhost',
      port: 0,
      pipePath: `cubio_bench_ipc_m_${Date.now()}`,
      payloadTier: 'MEDIUM_2KB',
      iterations: 20,
    });
    benchmarkResults.push(resMed);
    console.log(`    ${formatResultSummary(resMed)}`);

    const resLarge = await executeBenchmarkScenario({
      scenarioName: 'IPC_Localhost_Large',
      transport: 'IPC',
      interfaceType: 'LOCALHOST',
      host: 'localhost',
      port: 0,
      pipePath: `cubio_bench_ipc_l_${Date.now()}`,
      payloadTier: 'LARGE_32KB',
      iterations: 12,
      mtu: 2048,
    });
    benchmarkResults.push(resLarge);
    console.log(`    ${formatResultSummary(resLarge)}`);

    assert(resSmall.successfulEnvelopes === 25, 'All small IPC envelopes delivered');
    assert(resMed.successfulEnvelopes === 20, 'All medium IPC envelopes delivered');
    assert(resLarge.successfulEnvelopes === 12, 'All large IPC envelopes delivered');
  });

  // 1.4 UDP Datagram Localhost (Small, Medium)
  await test('1.4 Benchmark Localhost UDP Datagram across Small and Medium payload tiers', async () => {
    const resSmall = await executeBenchmarkScenario({
      scenarioName: 'UDP_Localhost_Small',
      transport: 'UDP',
      interfaceType: 'LOCALHOST',
      host: '127.0.0.1',
      port: basePort + 20,
      payloadTier: 'SMALL_256B',
      iterations: 25,
    });
    benchmarkResults.push(resSmall);
    console.log(`    ${formatResultSummary(resSmall)}`);

    const resMed = await executeBenchmarkScenario({
      scenarioName: 'UDP_Localhost_Medium',
      transport: 'UDP',
      interfaceType: 'LOCALHOST',
      host: '127.0.0.1',
      port: basePort + 21,
      payloadTier: 'MEDIUM_2KB',
      iterations: 20,
    });
    benchmarkResults.push(resMed);
    console.log(`    ${formatResultSummary(resMed)}`);

    assert(resSmall.successfulEnvelopes === 25, 'All small UDP envelopes delivered');
    assert(resMed.successfulEnvelopes === 20, 'All medium UDP envelopes delivered');
  });

  // ═════════════════════════════════════════════════════════════════════════
  // SECTION 2: Physical Network Interface Benchmarks
  // ═════════════════════════════════════════════════════════════════════════
  console.log('\n--- SECTION 2: Physical Network Interface Benchmarks (192.168.0.103) ---');

  await test('2.1 Benchmark Physical NIC TCP across Small, Medium, and Large payload tiers', async () => {
    const resSmall = await executeBenchmarkScenario({
      scenarioName: 'TCP_PhysicalNIC_Small',
      transport: 'TCP',
      interfaceType: 'PHYSICAL_NIC',
      host: env.physicalIp,
      port: basePort + 30,
      payloadTier: 'SMALL_256B',
      iterations: 25,
    });
    benchmarkResults.push(resSmall);
    console.log(`    ${formatResultSummary(resSmall)}`);

    const resMed = await executeBenchmarkScenario({
      scenarioName: 'TCP_PhysicalNIC_Medium',
      transport: 'TCP',
      interfaceType: 'PHYSICAL_NIC',
      host: env.physicalIp,
      port: basePort + 31,
      payloadTier: 'MEDIUM_2KB',
      iterations: 20,
    });
    benchmarkResults.push(resMed);
    console.log(`    ${formatResultSummary(resMed)}`);

    const resLarge = await executeBenchmarkScenario({
      scenarioName: 'TCP_PhysicalNIC_Large',
      transport: 'TCP',
      interfaceType: 'PHYSICAL_NIC',
      host: env.physicalIp,
      port: basePort + 32,
      payloadTier: 'LARGE_32KB',
      iterations: 12,
      mtu: 2048,
    });
    benchmarkResults.push(resLarge);
    console.log(`    ${formatResultSummary(resLarge)}`);

    assert(resSmall.successfulEnvelopes === 25, 'All small physical NIC TCP envelopes delivered');
    assert(resMed.successfulEnvelopes === 20, 'All medium physical NIC TCP envelopes delivered');
    assert(resLarge.successfulEnvelopes === 12, 'All large physical NIC TCP envelopes delivered');
  });

  await test('2.2 Benchmark Physical NIC UDP across Small and Medium payload tiers', async () => {
    const resSmall = await executeBenchmarkScenario({
      scenarioName: 'UDP_PhysicalNIC_Small',
      transport: 'UDP',
      interfaceType: 'PHYSICAL_NIC',
      host: env.physicalIp,
      port: basePort + 40,
      payloadTier: 'SMALL_256B',
      iterations: 25,
    });
    benchmarkResults.push(resSmall);
    console.log(`    ${formatResultSummary(resSmall)}`);

    const resMed = await executeBenchmarkScenario({
      scenarioName: 'UDP_PhysicalNIC_Medium',
      transport: 'UDP',
      interfaceType: 'PHYSICAL_NIC',
      host: env.physicalIp,
      port: basePort + 41,
      payloadTier: 'MEDIUM_2KB',
      iterations: 20,
    });
    benchmarkResults.push(resMed);
    console.log(`    ${formatResultSummary(resMed)}`);

    assert(resSmall.successfulEnvelopes === 25, 'All small physical NIC UDP envelopes delivered');
    assert(resMed.successfulEnvelopes === 20, 'All medium physical NIC UDP envelopes delivered');
  });

  // ═════════════════════════════════════════════════════════════════════════
  // SECTION 3: High-Concurrency Burst & Connection Stability
  // ═════════════════════════════════════════════════════════════════════════
  console.log('\n--- SECTION 3: High-Concurrency Burst & Connection Stability ---');

  await test('3.1 Sustained burst of 40 concurrent envelopes over real TCP without packet loss', async () => {
    const resBurst = await executeBenchmarkScenario({
      scenarioName: 'TCP_ConcurrentBurst_40',
      transport: 'TCP',
      interfaceType: 'LOCALHOST',
      host: '127.0.0.1',
      port: basePort + 50,
      payloadTier: 'SMALL_256B',
      iterations: 40,
      concurrency: 10, // 10 parallel in-flight streams
    });
    benchmarkResults.push(resBurst);
    console.log(`    ${formatResultSummary(resBurst)}`);

    assert(resBurst.successfulEnvelopes === 40, 'All 40 burst envelopes settled cleanly');
    assert(resBurst.failedEnvelopes === 0, 'Zero burst failures');
  });

  // ═════════════════════════════════════════════════════════════════════════
  // SECTION 4: Failure Behavior Under Active Load
  // ═════════════════════════════════════════════════════════════════════════
  console.log('\n--- SECTION 4: Failure Behavior Under Active Load ---');

  await test('4.1 Injects corrupted checksum during active traffic; validates pipeline defense & recovery', async () => {
    const port = basePort + 60;
    const endpoint: TransportEndpoint = { transportType: 'TCP', host: '127.0.0.1', port };

    const srv = new TcpTransportAdapter();
    const cli = new TcpTransportAdapter();
    const srvPipe = new CubiOTransportPipeline(srv);
    const cliPipe = new CubiOTransportPipeline(cli);

    const clientAddress: ProtocolAddress = {
      coordinate: { network: 'CUBIO' as const, dimension: 0, zone: 1, node: 1, service: 'CLI' },
      uri: 'CUBIO://NETWORK/0/01/00001/CLI',
    };
    const serverAddress: ProtocolAddress = {
      coordinate: { network: 'CUBIO' as const, dimension: 0, zone: 1, node: 2, service: 'SRV' },
      uri: 'CUBIO://NETWORK/0/01/00002/SRV',
    };
    const clientPrincipal: ProtocolPrincipal = {
      cubId: 'CUB-00000001',
      entityType: 'AGENT',
      signature: '0xSIG_CLI',
    };
    const serverPrincipal: ProtocolPrincipal = {
      cubId: 'CUB-00000002',
      entityType: 'NODE',
      signature: '0xSIG_SRV',
    };

    let corruptPacketsDropped = 0;
    srv.onError((err) => {
      if (err.code === 'ERR_TRANSPORT_FRAME_CORRUPTED') corruptPacketsDropped++;
    });

    srvPipe.onEnvelope(async (req) => {
      const resp = createEnvelope({
        kind: 'RESPONSE',
        source: serverAddress,
        destination: req.source,
        sender: serverPrincipal,
        payload: {
          category: 'DIRECT_MESSAGE',
          priority: 'NORMAL',
          contentType: 'application/json',
          body: { echo: req.envelopeId },
          bodyBytes: 32,
        },
        correlationId: req.envelopeId,
      });
      await srvPipe.sendEnvelope(resp);
    });

    try {
      await srv.listen(endpoint);
      await cli.connect(endpoint);
      await sleep(30);

      // 1. Send valid envelope
      const env1 = createEnvelope({
        kind: 'REQUEST',
        source: clientAddress,
        destination: serverAddress,
        sender: clientPrincipal,
        payload: { category: 'DIRECT_MESSAGE', priority: 'NORMAL', contentType: 'application/json', body: { seq: 1 }, bodyBytes: 20 },
      });
      const resp1 = await cliPipe.requestEnvelope(env1, (e) => e.correlationId === env1.envelopeId, { timeoutMs: 1500 });
      assert(resp1.correlationId === env1.envelopeId, 'Pre-corruption envelope processed successfully');

      // 2. Inbound corrupt packet directly injected
      const validPkt = createPacket({
        envelopeId: 'ENV_CORRUPT_LOAD',
        sourceUri: clientAddress.uri,
        destinationUri: serverAddress.uri,
        payloadData: 'INJECTED_CORRUPT_PAYLOAD',
        payloadType: 'UTF8',
        sequenceNumber: 99,
      });
      const corruptPkt = { ...validPkt, checksum: '0xDEADBEEF_TAMPERED' };

      const fakeSession = {
        sessionId: 'test_inject',
        transportType: 'TCP' as const,
        localEndpoint: endpoint,
        remoteEndpoint: endpoint,
        establishedAt: Date.now(),
        protocolVersion: { major: 1, minor: 0, patch: 0 },
        bytesReceived: 50,
        bytesSent: 0,
        packetsReceived: 1,
        packetsSent: 0,
        lastActivityAt: Date.now(),
        state: 'CONNECTED' as const,
      };

      // Call handleInboundPacket directly
      (srv as any).handleInboundPacket(corruptPkt, fakeSession);
      assert(srv.metrics.packetsDropped === 1, 'Server recorded packetDropped on corrupt checksum');

      // 3. Send post-corruption valid envelope (asserting pipeline did not crash or hang)
      const env2 = createEnvelope({
        kind: 'REQUEST',
        source: clientAddress,
        destination: serverAddress,
        sender: clientPrincipal,
        payload: { category: 'DIRECT_MESSAGE', priority: 'NORMAL', contentType: 'application/json', body: { seq: 2 }, bodyBytes: 20 },
      });
      const resp2 = await cliPipe.requestEnvelope(env2, (e) => e.correlationId === env2.envelopeId, { timeoutMs: 1500 });
      assert(resp2.correlationId === env2.envelopeId, 'Post-corruption envelope processed successfully with full recovery');
    } finally {
      cliPipe.dispose();
      srvPipe.dispose();
      await cli.close('done');
      await srv.close('done');
    }
  });

  console.log('\n══════════════════════════════════════════════════════════════════════════');
  console.log(`  Phase 2 Task 16 Results: ${passed} PASSED, ${failed} FAILED`);
  console.log('══════════════════════════════════════════════════════════════════════════\n');

  if (failed > 0) {
    throw new Error(`Task 16 Benchmark suite failed: ${failed} failed tests.`);
  }
}

if (process.argv[1]?.includes('transportBenchmark.test.ts')) {
  runBenchmarkSuite().catch((err) => {
    console.error('Master benchmark suite execution error:', err);
    process.exit(1);
  });
}

export { runBenchmarkSuite, benchmarkResults };
