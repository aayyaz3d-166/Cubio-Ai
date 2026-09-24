/**
 * CUBiO AI — Phase 2 / Task 16: Transport Performance Benchmark Engine
 * ======================================================================
 *
 * Implements high-precision performance benchmarking for CUBiO transport drivers:
 *   - Measures latency quantiles (min, p50, p95, p99, max, mean, stdDev) using hrtime.
 *   - Measures throughput (MB/s) and packet/message rates (msg/sec, pkt/sec).
 *   - Measures resource consumption (CPU user/system delta, heapUsed delta, rss delta).
 *   - Strictly tests representative payload sizes:
 *       • Small  (256 B): High-frequency telemetry / PING-PONG / heartbeats.
 *       • Medium (2 KB):  Standard domain messages / state updates.
 *       • Large  (32 KB): Multi-packet fragmented streams.
 *   - Separates Localhost Loopback (127.0.0.1) from Physical NIC (192.168.0.103).
 *   - Sustains real production protocol execution (100% full validation & CRC checksums).
 *   - Zero estimation or fabrication: all numbers derived from runtime measurements.
 */

import * as os from 'node:os';
import {
  TcpTransportAdapter,
  WebSocketTransportAdapter,
  IpcPipeTransportAdapter,
  UdpTransportAdapter,
  TransportEndpoint,
  CubiOTransportPipeline,
} from './index';
import { createEnvelope } from '../protocol/v1/protocolEngine';
import { ProtocolPayload, ProtocolPrincipal, ProtocolAddress } from '../protocol/v1/types';

export interface BenchmarkEnvironment {
  readonly cpuModel: string;
  readonly cpuCores: number;
  readonly cpuSpeedMhz: number;
  readonly totalRamGb: string;
  readonly freeRamGb: string;
  readonly osPlatform: string;
  readonly osRelease: string;
  readonly osArch: string;
  readonly nodeVersion: string;
  readonly physicalIp: string;
}

export interface LatencyStats {
  readonly minMs: number;
  readonly p50Ms: number;
  readonly p95Ms: number;
  readonly p99Ms: number;
  readonly maxMs: number;
  readonly meanMs: number;
  readonly stdDevMs: number;
}

export interface ResourceStats {
  readonly cpuUserMs: number;
  readonly cpuSystemMs: number;
  readonly cpuPercent: number;
  readonly heapDeltaKb: number;
  readonly rssDeltaKb: number;
}

export interface BenchmarkResult {
  readonly scenarioName: string;
  readonly transport: 'TCP' | 'WEBSOCKET' | 'IPC' | 'UDP';
  readonly interfaceType: 'LOCALHOST' | 'PHYSICAL_NIC';
  readonly host: string;
  readonly port: number;
  readonly payloadTier: 'SMALL_256B' | 'MEDIUM_2KB' | 'LARGE_32KB';
  readonly payloadBytes: number;
  readonly totalEnvelopes: number;
  readonly successfulEnvelopes: number;
  readonly failedEnvelopes: number;
  readonly totalBytesTransmitted: number;
  readonly totalPacketsProcessed: number;
  readonly durationMs: number;
  readonly throughputMbSec: number;
  readonly messageRateMsgSec: number;
  readonly packetRatePktSec: number;
  readonly latency: LatencyStats;
  readonly resources: ResourceStats;
}

export interface BenchmarkOptions {
  readonly scenarioName: string;
  readonly transport: 'TCP' | 'WEBSOCKET' | 'IPC' | 'UDP';
  readonly interfaceType: 'LOCALHOST' | 'PHYSICAL_NIC';
  readonly host: string;
  readonly port: number;
  readonly pipePath?: string;
  readonly payloadTier: 'SMALL_256B' | 'MEDIUM_2KB' | 'LARGE_32KB';
  readonly iterations: number;
  readonly concurrency?: number;
  readonly mtu?: number;
}

export function getBenchmarkEnvironment(): BenchmarkEnvironment {
  const cpus = os.cpus();
  const interfaces = os.networkInterfaces();
  let physicalIp = '127.0.0.1';

  outer: for (const name of Object.keys(interfaces)) {
    const list = interfaces[name];
    if (!list) continue;
    for (const net of list) {
      if (net.family === 'IPv4' && !net.internal && net.address !== '127.0.0.1') {
        physicalIp = net.address;
        break outer;
      }
    }
  }

  return Object.freeze({
    cpuModel: cpus[0]?.model || 'Unknown CPU',
    cpuCores: cpus.length,
    cpuSpeedMhz: cpus[0]?.speed || 0,
    totalRamGb: (os.totalmem() / 1e9).toFixed(2),
    freeRamGb: (os.freemem() / 1e9).toFixed(2),
    osPlatform: os.platform(),
    osRelease: os.release(),
    osArch: os.arch(),
    nodeVersion: process.version,
    physicalIp,
  });
}

export function computeLatencyStats(latenciesMs: readonly number[]): LatencyStats {
  if (latenciesMs.length === 0) {
    return { minMs: 0, p50Ms: 0, p95Ms: 0, p99Ms: 0, maxMs: 0, meanMs: 0, stdDevMs: 0 };
  }

  const sorted = [...latenciesMs].sort((a, b) => a - b);
  const n = sorted.length;
  const minMs = sorted[0];
  const maxMs = sorted[n - 1];

  const p50Index = Math.floor(n * 0.50);
  const p95Index = Math.min(n - 1, Math.floor(n * 0.95));
  const p99Index = Math.min(n - 1, Math.floor(n * 0.99));

  const p50Ms = sorted[p50Index];
  const p95Ms = sorted[p95Index];
  const p99Ms = sorted[p99Index];

  const sum = sorted.reduce((acc, v) => acc + v, 0);
  const meanMs = sum / n;

  const variance = sorted.reduce((acc, v) => acc + Math.pow(v - meanMs, 2), 0) / n;
  const stdDevMs = Math.sqrt(variance);

  return Object.freeze({
    minMs: Number(minMs.toFixed(3)),
    p50Ms: Number(p50Ms.toFixed(3)),
    p95Ms: Number(p95Ms.toFixed(3)),
    p99Ms: Number(p99Ms.toFixed(3)),
    maxMs: Number(maxMs.toFixed(3)),
    meanMs: Number(meanMs.toFixed(3)),
    stdDevMs: Number(stdDevMs.toFixed(3)),
  });
}

function generatePayloadBody(tier: 'SMALL_256B' | 'MEDIUM_2KB' | 'LARGE_32KB'): any {
  if (tier === 'SMALL_256B') {
    return {
      type: 'TELEMETRY_HEARTBEAT',
      timestamp: Date.now(),
      status: 'OK',
      load: 0.12,
      metrics: [1, 2, 3, 4, 5],
      padding: 'x'.repeat(120),
    };
  } else if (tier === 'MEDIUM_2KB') {
    return {
      type: 'STATE_DELTA',
      seq: 100,
      timestamp: Date.now(),
      coordinates: { dimension: 0, zone: 1, node: 42 },
      vector: Array.from({ length: 48 }, (_, i) => Math.sin(i)),
      notes: 'Standard chat message payload for CUBiO multi-agent coordination.',
      padding: 'A'.repeat(1600),
    };
  } else {
    return {
      type: 'BULK_KNOWLEDGE_TRANSFER',
      snapshotId: 'SNAP-9999',
      timestamp: Date.now(),
      stateMatrix: Array.from({ length: 120 }, (_, i) => ({
        id: `ROW-${i}`,
        values: [i * 1.5, i * 2.5, i * 3.5],
        label: `Row label for row index ${i}`,
      })),
      payloadPadding: 'K'.repeat(24000),
    };
  }
}

function makeProtocolPayload<T>(body: T): ProtocolPayload<T> {
  const serialized = JSON.stringify(body);
  return {
    category: 'DIRECT_MESSAGE',
    priority: 'NORMAL',
    contentType: 'application/json',
    body,
    bodyBytes: Buffer.byteLength(serialized, 'utf8'),
  };
}

export async function executeBenchmarkScenario(options: BenchmarkOptions): Promise<BenchmarkResult> {
  const {
    scenarioName,
    transport,
    interfaceType,
    host,
    port,
    pipePath,
    payloadTier,
    iterations,
    concurrency = 1,
    mtu,
  } = options;

  // 1. Initialize Server & Client Transport Adapters
  let srvAdapter: any;
  let cliAdapter: any;
  let endpoint: TransportEndpoint;

  if (transport === 'TCP') {
    srvAdapter = new TcpTransportAdapter();
    cliAdapter = new TcpTransportAdapter();
    endpoint = { transportType: 'TCP', host, port };
  } else if (transport === 'WEBSOCKET') {
    srvAdapter = new WebSocketTransportAdapter();
    cliAdapter = new WebSocketTransportAdapter();
    endpoint = { transportType: 'WEBSOCKET', host, port };
  } else if (transport === 'IPC') {
    srvAdapter = new IpcPipeTransportAdapter();
    cliAdapter = new IpcPipeTransportAdapter();
    endpoint = { transportType: 'IPC_PIPE', host: 'localhost', port: 0, path: pipePath || `cubio_bench_${Date.now()}` };
  } else {
    srvAdapter = new UdpTransportAdapter();
    cliAdapter = new UdpTransportAdapter();
    endpoint = { transportType: 'UDP', host, port };
  }

  const srvPipeline = new CubiOTransportPipeline(srvAdapter);
  const cliPipeline = new CubiOTransportPipeline(cliAdapter);

  // Address and principal fixtures
  const clientAddress: ProtocolAddress = {
    coordinate: { network: 'CUBIO' as const, dimension: 0, zone: 1, node: 1, service: 'BENCH_CLI' },
    uri: 'CUBIO://NETWORK/0/01/00001/BENCH_CLI',
  };
  const serverAddress: ProtocolAddress = {
    coordinate: { network: 'CUBIO' as const, dimension: 0, zone: 1, node: 2, service: 'BENCH_SRV' },
    uri: 'CUBIO://NETWORK/0/01/00002/BENCH_SRV',
  };
  const clientPrincipal: ProtocolPrincipal = {
    cubId: 'CUB-00000001',
    entityType: 'AGENT',
    signature: '0xSIG_BENCH_CLI',
  };
  const serverPrincipal: ProtocolPrincipal = {
    cubId: 'CUB-00000002',
    entityType: 'NODE',
    signature: '0xSIG_BENCH_SRV',
  };

  // Wire server echo handler
  srvPipeline.onEnvelope(async (req) => {
    const resp = createEnvelope({
      kind: 'RESPONSE',
      source: serverAddress,
      destination: req.source,
      sender: serverPrincipal,
      payload: makeProtocolPayload({ echo: req.envelopeId, status: 'OK' }),
      correlationId: req.envelopeId,
    });
    try {
      await srvPipeline.sendEnvelope(resp);
    } catch {}
  });

  await srvAdapter.listen(endpoint);
  await cliAdapter.connect(endpoint);
  await new Promise((r) => setTimeout(r, 40));

  if (transport === 'UDP') {
    if (cliAdapter.localEndpoint) {
      const cliHost =
        !cliAdapter.localEndpoint.host || cliAdapter.localEndpoint.host === '0.0.0.0'
          ? host
          : cliAdapter.localEndpoint.host;
      srvAdapter.setRemoteEndpoint({
        transportType: 'UDP',
        host: cliHost,
        port: cliAdapter.localEndpoint.port,
      });
    }
  }

  // Prepare payload template
  const rawBody = generatePayloadBody(payloadTier);
  const protoPayload = makeProtocolPayload(rawBody);
  const payloadBytes = protoPayload.bodyBytes;

  const latenciesMs: number[] = [];
  let successful = 0;
  let failed = 0;

  // Resource baseline
  const startCpu = process.cpuUsage();
  const startMem = process.memoryUsage();
  const startHr = process.hrtime.bigint();

  // 2. Execute Benchmark Transactions
  if (concurrency <= 1) {
    // Sequential execution
    for (let i = 0; i < iterations; i++) {
      const envelope = createEnvelope({
        kind: 'REQUEST',
        source: clientAddress,
        destination: serverAddress,
        sender: clientPrincipal,
        payload: protoPayload,
        nonce: `nonce_bench_${i}_${Date.now()}`,
      });

      const reqStart = process.hrtime.bigint();
      try {
        const response = await cliPipeline.requestEnvelope(
          envelope,
          (incoming) => incoming.correlationId === envelope.envelopeId,
          { timeoutMs: 3000, sendOptions: mtu ? { mtu } : undefined }
        );
        const reqEnd = process.hrtime.bigint();
        const latencyMs = Number(reqEnd - reqStart) / 1_000_000;
        latenciesMs.push(latencyMs);

        if (response && response.correlationId === envelope.envelopeId) {
          successful++;
        } else {
          failed++;
        }
      } catch (err) {
        failed++;
      }
    }
  } else {
    // Concurrent execution in batches of `concurrency`
    for (let i = 0; i < iterations; i += concurrency) {
      const batchSize = Math.min(concurrency, iterations - i);
      const batchPromises: Promise<void>[] = [];

      for (let j = 0; j < batchSize; j++) {
        const idx = i + j;
        const envelope = createEnvelope({
          kind: 'REQUEST',
          source: clientAddress,
          destination: serverAddress,
          sender: clientPrincipal,
          payload: protoPayload,
          nonce: `nonce_bench_${idx}_${Date.now()}`,
        });

        const p = (async () => {
          const reqStart = process.hrtime.bigint();
          try {
            const response = await cliPipeline.requestEnvelope(
              envelope,
              (incoming) => incoming.correlationId === envelope.envelopeId,
              { timeoutMs: 4000, sendOptions: mtu ? { mtu } : undefined }
            );
            const reqEnd = process.hrtime.bigint();
            const latencyMs = Number(reqEnd - reqStart) / 1_000_000;
            latenciesMs.push(latencyMs);

            if (response && response.correlationId === envelope.envelopeId) {
              successful++;
            } else {
              failed++;
            }
          } catch {
            failed++;
          }
        })();

        batchPromises.push(p);
      }

      await Promise.all(batchPromises);
    }
  }

  const endHr = process.hrtime.bigint();
  const endCpu = process.cpuUsage(startCpu);
  const endMem = process.memoryUsage();

  const totalDurationMs = Number(endHr - startHr) / 1_000_000;

  // Cleanup
  cliPipeline.dispose();
  srvPipeline.dispose();
  await cliAdapter.close('benchmark completed');
  await srvAdapter.close('benchmark completed');

  // Compute stats
  const latency = computeLatencyStats(latenciesMs);

  const totalBytes = (cliAdapter.metrics.bytesSent + cliAdapter.metrics.bytesReceived) +
                     (srvAdapter.metrics.bytesSent + srvAdapter.metrics.bytesReceived);
  const totalPackets = (cliAdapter.metrics.packetsSent + cliAdapter.metrics.packetsReceived) +
                       (srvAdapter.metrics.packetsSent + srvAdapter.metrics.packetsReceived);

  const throughputMbSec = totalDurationMs > 0 ? (totalBytes / (1024 * 1024)) / (totalDurationMs / 1000) : 0;
  const messageRateMsgSec = totalDurationMs > 0 ? (successful / (totalDurationMs / 1000)) : 0;
  const packetRatePktSec = totalDurationMs > 0 ? (totalPackets / (totalDurationMs / 1000)) : 0;

  const cpuUserMs = endCpu.user / 1000;
  const cpuSystemMs = endCpu.system / 1000;
  const totalCpuMs = cpuUserMs + cpuSystemMs;
  const cpuPercent = totalDurationMs > 0 ? (totalCpuMs / totalDurationMs) * 100 : 0;

  const heapDeltaKb = (endMem.heapUsed - startMem.heapUsed) / 1024;
  const rssDeltaKb = (endMem.rss - startMem.rss) / 1024;

  return Object.freeze({
    scenarioName,
    transport,
    interfaceType,
    host,
    port,
    payloadTier,
    payloadBytes,
    totalEnvelopes: iterations,
    successfulEnvelopes: successful,
    failedEnvelopes: failed,
    totalBytesTransmitted: totalBytes,
    totalPacketsProcessed: totalPackets,
    durationMs: Number(totalDurationMs.toFixed(2)),
    throughputMbSec: Number(throughputMbSec.toFixed(3)),
    messageRateMsgSec: Number(messageRateMsgSec.toFixed(1)),
    packetRatePktSec: Number(packetRatePktSec.toFixed(1)),
    latency,
    resources: Object.freeze({
      cpuUserMs: Number(cpuUserMs.toFixed(2)),
      cpuSystemMs: Number(cpuSystemMs.toFixed(2)),
      cpuPercent: Number(cpuPercent.toFixed(2)),
      heapDeltaKb: Number(heapDeltaKb.toFixed(2)),
      rssDeltaKb: Number(rssDeltaKb.toFixed(2)),
    }),
  });
}
