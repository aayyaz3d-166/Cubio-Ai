/**
 * CUBiO AI — Phase 5: Task 71 — Intelligence Runtime Optimization
 * src/cubio/intelligence/optimization/workloadProfiler.ts
 *
 * Sovereign Workload Profiler for native CUBiO runtime layers.
 * Accurately measures CPU duration, latency percentiles, throughput,
 * and heap allocation across Learning, Retrieval, Reasoning, and Inference.
 */

import * as crypto from 'crypto';
import { NativeLearningEngine } from '../../learning/native/nativeLearningEngine';
import { AdaptationCore } from '../../learning/native/adaptationCore';
import { LearningInputSample } from '../../learning/native/learningTypes';
import { NativeInformationIndex } from '../../information/native/nativeInformationIndex';
import { GraphNode } from '../../information/native/indexLayerTypes';
import { ConfidenceCalculator } from '../../epistemic/native/confidenceCalculator';
import { EpistemicEvidenceItem, EpistemicStatus } from '../../epistemic/native/epistemicTypes';
import { ShannonEntropyEngine } from '../../epistemic/native/shannonEntropy';
import {
  WorkloadType,
  WorkloadProfileMetrics,
  LatencyPercentiles,
} from './optimizationTypes';
import { SeedablePRNG } from '../../testing/native/prng';
import { coordinateToCellId, cellIdToAddress369 } from '../../../core/address369';

export function computePercentiles(latencies: number[]): LatencyPercentiles {
  if (latencies.length === 0) {
    return { p50Ms: 0, p95Ms: 0, p99Ms: 0, maxMs: 0, meanMs: 0 };
  }
  const sorted = latencies.slice().sort((a, b) => a - b);
  const n = sorted.length;
  const p50 = sorted[Math.floor(n * 0.50)];
  const p95 = sorted[Math.floor(n * 0.95)];
  const p99 = sorted[Math.floor(n * 0.99)];
  const max = sorted[n - 1];
  const sum = sorted.reduce((acc, v) => acc + v, 0);
  const mean = sum / n;

  return {
    p50Ms: Number(p50.toFixed(4)),
    p95Ms: Number(p95.toFixed(4)),
    p99Ms: Number(p99.toFixed(4)),
    maxMs: Number(max.toFixed(4)),
    meanMs: Number(mean.toFixed(4)),
  };
}

export class WorkloadProfiler {
  /**
   * Profiles Native Learning & Adaptation (forward loss, AdamW step, state export).
   */
  public static profileLearningWorkload(
    iterations = 25,
    phase: 'BASELINE' | 'OPTIMIZED' = 'BASELINE',
    isColdStart = false,
    tenantId = 'tenant_prof_learn',
    seed = 369001
  ): WorkloadProfileMetrics {
    const prng = new SeedablePRNG(seed);
    const initialHeap = process.memoryUsage().heapUsed;
    const core = new AdaptationCore(tenantId, seed);
    const latencies: number[] = [];

    // Pre-generate deterministic samples
    const samples: LearningInputSample[] = [];
    for (let i = 0; i < iterations; i++) {
      const x = prng.nextInt(0, 6);
      const y = prng.nextInt(0, 6);
      const z = prng.nextInt(0, 6);
      const cellId = coordinateToCellId(x, y, z);
      const payload = { sampleIdx: i, z, score: prng.nextFloat(0.1, 0.99) };
      const serialized = JSON.stringify(payload);
      const checksum = crypto.createHash('sha256').update(serialized).digest('hex');

      samples.push({
        sampleId: `SMPL_OPT_${i}`,
        tenantId,
        sourceObjectId: `OBJ_${i}`,
        domain: 'DEFAULT',
        stateVersion: 1,
        cellId,
        epistemicStatus: 'SUPPORTED_HYPOTHESIS',
        confidence: 0.85,
        checksum,
        payload,
        createdAt: Date.now(),
      });
    }

    let lastChecksum = '';
    const totalStart = performance.now();

    for (let i = 0; i < iterations; i++) {
      const sample = samples[i];
      const stepStart = performance.now();

      const batch = {
        batchId: `BATCH_${i}`,
        tenantId,
        samples: [sample],
        seed: seed + i,
        createdAt: Date.now(),
      };

      // Forward pass
      const forwardRes = core.computeForwardAndLoss([sample]);
      // Backward gradients
      const grads = core.computeGradients([sample], forwardRes);
      // Optimizer step
      core.applyOptimizationStep(grads, 0.001);

      latencies.push(performance.now() - stepStart);
      lastChecksum = core.computeParameterChecksum();
    }

    const totalDurationMs = Math.max(0.01, performance.now() - totalStart);
    const finalHeap = process.memoryUsage().heapUsed;

    return Object.freeze({
      workloadType: 'LEARNING',
      phase,
      isColdStart,
      iterations,
      totalDurationMs: Number(totalDurationMs.toFixed(3)),
      throughputOpsPerSec: Math.round((iterations / totalDurationMs) * 1000),
      latencies: computePercentiles(latencies),
      initialHeapBytes: initialHeap,
      finalHeapBytes: finalHeap,
      heapDeltaBytes: finalHeap - initialHeap,
      sampleResultChecksum: lastChecksum,
    });
  }

  /**
   * Profiles Native Multi-Axis Information Retrieval (Domain, Modality, Spatial Cell).
   */
  public static profileRetrievalWorkload(
    queryCount = 200,
    phase: 'BASELINE' | 'OPTIMIZED' = 'BASELINE',
    isColdStart = false,
    tenantId = 'tenant_prof_ret',
    seed = 369001
  ): WorkloadProfileMetrics {
    const prng = new SeedablePRNG(seed);
    const index = new NativeInformationIndex();
    const nodeCount = 300;

    // Seed index
    for (let i = 0; i < nodeCount; i++) {
      const cellId = i % 343;
      const address369 = cellIdToAddress369(cellId);
      const mod = (['TEXT', 'NUMERIC', 'STRUCTURED', 'AUDIO', 'VISUAL'] as const)[i % 5];
      const node: GraphNode = {
        objectId: `NODE_PROF_${i}`,
        tenantId,
        domain: 'DEFAULT',
        modality: mod,
        stateVersion: 1,
        checksum: `chk_${i}`,
        contentHash: `cnt_${i}`,
      };
      index.indexNode(node, { cellId, address369 });
    }

    const initialHeap = process.memoryUsage().heapUsed;
    const latencies: number[] = [];
    const totalStart = performance.now();
    let hitCount = 0;

    for (let q = 0; q < queryCount; q++) {
      const targetId = `NODE_PROF_${q % nodeCount}`;
      const qStart = performance.now();

      // Point lookup
      const ptr = index.getNodePointer(targetId, tenantId);
      if (ptr) hitCount++;

      // Axis query
      const targetCell = q % 343;
      const cellPointers = index.query({ tenantId, cellId: targetCell });
      if (cellPointers.length > 0) hitCount += cellPointers.length;

      latencies.push(performance.now() - qStart);
    }

    const totalDurationMs = Math.max(0.01, performance.now() - totalStart);
    const finalHeap = process.memoryUsage().heapUsed;
    const resultChecksum = crypto.createHash('sha256').update(`hits:${hitCount}`).digest('hex');

    return Object.freeze({
      workloadType: 'RETRIEVAL',
      phase,
      isColdStart,
      iterations: queryCount,
      totalDurationMs: Number(totalDurationMs.toFixed(3)),
      throughputOpsPerSec: Math.round((queryCount / totalDurationMs) * 1000),
      latencies: computePercentiles(latencies),
      initialHeapBytes: initialHeap,
      finalHeapBytes: finalHeap,
      heapDeltaBytes: finalHeap - initialHeap,
      sampleResultChecksum: resultChecksum,
    });
  }

  /**
   * Profiles Epistemic Reasoning & Confidence Calculation.
   */
  public static profileReasoningWorkload(
    hypothesisCount = 100,
    phase: 'BASELINE' | 'OPTIMIZED' = 'BASELINE',
    isColdStart = false,
    tenantId = 'tenant_prof_reason',
    seed = 369001
  ): WorkloadProfileMetrics {
    const prng = new SeedablePRNG(seed);
    const initialHeap = process.memoryUsage().heapUsed;
    const latencies: number[] = [];

    // Pre-generate hypotheses and evidence sets
    const workloads: { sup: EpistemicEvidenceItem[]; contra: EpistemicEvidenceItem[] }[] = [];
    for (let h = 0; h < hypothesisCount; h++) {
      const sup: EpistemicEvidenceItem[] = [
        {
          id: `EV_SUP_${h}_1`,
          tenantId,
          domain: 'DEFAULT',
          strength: prng.nextFloat(0.6, 0.95),
          polarity: 'SUPPORTING',
          sourceChecksum: `src_sup_${h}`,
          evidenceType: 'EMPIRICAL',
          createdAt: Date.now(),
        },
        {
          id: `EV_SUP_${h}_2`,
          tenantId,
          domain: 'DEFAULT',
          strength: prng.nextFloat(0.4, 0.8),
          polarity: 'SUPPORTING',
          sourceChecksum: `src_sup2_${h}`,
          evidenceType: 'ANALYTICAL',
          createdAt: Date.now(),
        },
      ];
      const contra: EpistemicEvidenceItem[] = h % 3 === 0 ? [
        {
          id: `EV_CONTRA_${h}`,
          tenantId,
          domain: 'DEFAULT',
          strength: prng.nextFloat(0.1, 0.3),
          polarity: 'CONTRADICTING',
          sourceChecksum: `src_contra_${h}`,
          evidenceType: 'EMPIRICAL',
          createdAt: Date.now(),
        },
      ] : [];

      workloads.push({ sup, contra });
    }

    const totalStart = performance.now();
    let sumConfidence = 0;

    for (let i = 0; i < hypothesisCount; i++) {
      const item = workloads[i];
      const stepStart = performance.now();

      const res = ConfidenceCalculator.calculate(item.sup, item.contra, 'HYPOTHESIS');
      sumConfidence += res.confidence;

      // Also compute Shannon entropy distribution
      const probDist = [res.confidence, 1.0 - res.confidence];
      const entropy = ShannonEntropyEngine.computeShannonEntropy(probDist);
      sumConfidence += entropy;

      latencies.push(performance.now() - stepStart);
    }

    const totalDurationMs = Math.max(0.01, performance.now() - totalStart);
    const finalHeap = process.memoryUsage().heapUsed;
    const resultChecksum = crypto.createHash('sha256').update(sumConfidence.toFixed(4)).digest('hex');

    return Object.freeze({
      workloadType: 'REASONING',
      phase,
      isColdStart,
      iterations: hypothesisCount,
      totalDurationMs: Number(totalDurationMs.toFixed(3)),
      throughputOpsPerSec: Math.round((hypothesisCount / totalDurationMs) * 1000),
      latencies: computePercentiles(latencies),
      initialHeapBytes: initialHeap,
      finalHeapBytes: finalHeap,
      heapDeltaBytes: finalHeap - initialHeap,
      sampleResultChecksum: resultChecksum,
    });
  }

  /**
   * Profiles Sequential Inference & Decision Lifecycle.
   */
  public static profileInferenceWorkload(
    requestCount = 50,
    phase: 'BASELINE' | 'OPTIMIZED' = 'BASELINE',
    isColdStart = false,
    tenantId = 'tenant_prof_inf',
    seed = 369001
  ): WorkloadProfileMetrics {
    const prng = new SeedablePRNG(seed);
    const initialHeap = process.memoryUsage().heapUsed;
    const latencies: number[] = [];

    const totalStart = performance.now();
    let decisionAccumulator = 0;

    for (let i = 0; i < requestCount; i++) {
      const startStep = performance.now();
      const cellId = prng.nextInt(0, 342);
      const address369 = cellIdToAddress369(cellId);

      // Deterministic decision formulation
      const decisionToken = `DECISION_${tenantId}_${i}_${cellId}_${address369}`;
      const decisionHash = crypto.createHash('sha256').update(decisionToken).digest('hex');
      decisionAccumulator += parseInt(decisionHash.slice(0, 4), 16);

      latencies.push(performance.now() - startStep);
    }

    const totalDurationMs = Math.max(0.01, performance.now() - totalStart);
    const finalHeap = process.memoryUsage().heapUsed;
    const resultChecksum = crypto.createHash('sha256').update(String(decisionAccumulator)).digest('hex');

    return Object.freeze({
      workloadType: 'INFERENCE',
      phase,
      isColdStart,
      iterations: requestCount,
      totalDurationMs: Number(totalDurationMs.toFixed(3)),
      throughputOpsPerSec: Math.round((requestCount / totalDurationMs) * 1000),
      latencies: computePercentiles(latencies),
      initialHeapBytes: initialHeap,
      finalHeapBytes: finalHeap,
      heapDeltaBytes: finalHeap - initialHeap,
      sampleResultChecksum: resultChecksum,
    });
  }
}
