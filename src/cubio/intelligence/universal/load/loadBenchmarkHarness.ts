/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F72: Production Load & Performance Benchmark Harness
 *
 * Implements automated load generation and telemetry benchmarking across 10 load vectors.
 */

import {
  ILoadBenchmarkHarness,
  LoadBenchmarkMetrics,
  LoadTestConfig,
  LoadTestScenario,
} from './types';
import { ConcurrencyThrottle } from './concurrencyThrottle';
import { TelemetryProfiler } from './telemetryProfiler';
import { CubiOUniversalApiGateway } from '../api/universalApiGateway';

export class CubiOLoadBenchmarkHarness implements ILoadBenchmarkHarness {
  private gateway = new CubiOUniversalApiGateway();
  private throttle = new ConcurrencyThrottle(32);
  private profiler = new TelemetryProfiler();

  public async runScenario(
    scenario: LoadTestScenario,
    config: Partial<LoadTestConfig> = {}
  ): Promise<Readonly<LoadBenchmarkMetrics>> {
    const concurrency = config.concurrency || 20;
    const totalIterations = config.totalIterations || 50;
    const conversationTurns = config.conversationTurns || 20;

    this.throttle.resetStats();
    this.profiler.startProfiling();

    const startTime = Date.now();
    let successfulRequests = 0;
    let failedRequests = 0;
    let recoveryTimeMs = 0;

    const workerTasks: Promise<void>[] = [];

    for (let i = 0; i < totalIterations; i++) {
      const task = (async (index: number) => {
        await this.throttle.acquire();
        const reqStart = Date.now();

        try {
          switch (scenario) {
            case 'CONCURRENT_USERS': {
              const res = await this.gateway.handleRequest('/intelligence', 'POST', {
                text: `User ${index}: Query spatial state`,
                parameters: { tenantId: `tenant_${index % 10}` },
              });
              if (res.statusCode === 200) successfulRequests++;
              else failedRequests++;
              break;
            }

            case 'LONG_CONVERSATION': {
              let lastRes: any;
              for (let t = 0; t < conversationTurns; t++) {
                lastRes = await this.gateway.handleRequest('/intelligence', 'POST', {
                  text: `Turn ${t}: Continue reasoning on topic ${index}`,
                  parameters: { sessionId: `sess_${index}` },
                });
              }
              if (lastRes?.statusCode === 200) successfulRequests++;
              else failedRequests++;
              break;
            }

            case 'LARGE_FILES': {
              const dummyContent = 'export class SpatialTransformer { transform() { return true; } }\n'.repeat(50);
              const res = await this.gateway.handleRequest('/intelligence', 'POST', {
                text: 'Analyze large source file',
                files: [{ path: `src/models/LargeModel_${index}.ts`, content: dummyContent }],
              });
              if (res.statusCode === 200) successfulRequests++;
              else failedRequests++;
              break;
            }

            case 'MULTIMODAL': {
              const res = await this.gateway.handleRequest('/intelligence', 'POST', {
                text: 'Multimodal Spatial Directive',
                image: { url: 'https://cubio.space/assets/wireframe.png', width: 512, height: 512 },
                audio: { text: 'Voice directive payload' },
                code: { sourceCode: 'export const X = 1;', language: 'typescript' },
                tools: ['FILESYSTEM'],
              });
              if (res.statusCode === 200) successfulRequests++;
              else failedRequests++;
              break;
            }

            case 'PARALLEL_AGENTS': {
              const res = await this.gateway.handleRequest('/intelligence', 'POST', {
                text: 'Decompose and solve across specialist agents',
                agents: { agentIds: ['MASTER', 'RESEARCH', 'CODING', 'SPATIAL', 'VALIDATOR'] },
              });
              if (res.statusCode === 200) successfulRequests++;
              else failedRequests++;
              break;
            }

            case 'LONG_WORKFLOW': {
              const res = await this.gateway.handleRequest('/intelligence', 'POST', {
                workflows: { action: `AUTONOMOUS_WORKFLOW_RUN_${index}` },
              });
              if (res.statusCode === 200) successfulRequests++;
              else failedRequests++;
              break;
            }

            case 'PROVIDER_LATENCY': {
              const jitter = (index % 5) * 10;
              await new Promise((r) => setTimeout(r, jitter));
              const res = await this.gateway.handleRequest('/intelligence', 'POST', {
                text: 'Latency Jitter Probe',
              });
              if (res.statusCode === 200) successfulRequests++;
              else failedRequests++;
              break;
            }

            case 'MEMORY_PRESSURE': {
              const memoryBlobs: string[] = [];
              for (let b = 0; b < 10; b++) {
                memoryBlobs.push(JSON.stringify({ payload: 'X'.repeat(500) }));
              }
              const res = await this.gateway.handleRequest('/intelligence', 'POST', {
                text: 'Memory pressure probe',
                parameters: { blobsCount: memoryBlobs.length },
              });
              if (res.statusCode === 200) successfulRequests++;
              else failedRequests++;
              break;
            }

            case 'THROUGHPUT_PEAK': {
              const res = await this.gateway.handleRequest('/intelligence', 'POST', {
                text: 'Peak throughput probe',
              });
              if (res.statusCode === 200) successfulRequests++;
              else failedRequests++;
              break;
            }

            case 'CHAOS_FAILURE_RECOVERY': {
              const failoverStart = Date.now();
              const res = await this.gateway.handleRequest('/intelligence', 'POST', {
                text: 'Chaos failover test',
                parameters: { simulateProviderOutage: index % 2 === 0 },
              });
              recoveryTimeMs = Date.now() - failoverStart;
              if (res.statusCode === 200) successfulRequests++;
              else failedRequests++;
              break;
            }
          }
        } catch {
          failedRequests++;
        } finally {
          const reqDuration = Date.now() - reqStart;
          this.profiler.recordLatency(reqDuration);
          this.throttle.release();
        }
      })(i);

      workerTasks.push(task);
    }

    await Promise.all(workerTasks);
    const durationMs = Math.max(1, Date.now() - startTime);

    const telemetry = this.profiler.endProfiling();
    const totalRequests = successfulRequests + failedRequests;
    const errorRate = totalRequests > 0 ? failedRequests / totalRequests : 0;
    const throughputRps = Math.round((totalRequests / (durationMs / 1000)) * 10) / 10;

    return Object.freeze({
      scenario,
      totalRequests,
      successfulRequests,
      failedRequests,
      errorRate,
      minLatencyMs: telemetry.minLatencyMs,
      p50LatencyMs: telemetry.p50LatencyMs,
      p95LatencyMs: telemetry.p95LatencyMs,
      p99LatencyMs: telemetry.p99LatencyMs,
      maxLatencyMs: telemetry.maxLatencyMs,
      throughputRps,
      memoryDeltaMb: telemetry.memoryDeltaMb,
      peakQueueDepth: this.throttle.getPeakQueueDepth(),
      recoveryTimeMs: recoveryTimeMs || telemetry.p50LatencyMs,
      durationMs,
    });
  }

  public async runFullSuite(): Promise<Readonly<Record<LoadTestScenario, LoadBenchmarkMetrics>>> {
    const scenarios: LoadTestScenario[] = [
      'CONCURRENT_USERS',
      'LONG_CONVERSATION',
      'LARGE_FILES',
      'MULTIMODAL',
      'PARALLEL_AGENTS',
      'LONG_WORKFLOW',
      'PROVIDER_LATENCY',
      'MEMORY_PRESSURE',
      'THROUGHPUT_PEAK',
      'CHAOS_FAILURE_RECOVERY',
    ];

    const results: Partial<Record<LoadTestScenario, LoadBenchmarkMetrics>> = {};

    for (const sc of scenarios) {
      results[sc] = await this.runScenario(sc, { totalIterations: 20 });
    }

    return Object.freeze(results as Record<LoadTestScenario, LoadBenchmarkMetrics>);
  }
}
