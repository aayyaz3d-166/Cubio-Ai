/**
 * CUBiO AI — Phase 6: Task 90 — Native Language Intelligence Optimization
 * src/cubio/language/native/optimization/languageWorkloadProfiler.ts
 *
 * Sovereign Workload Profiler for native language intelligence runtime layers.
 * Accurately measures CPU duration, latency percentiles (p50, p95, p99, mean),
 * throughput (ops/sec), heap delta, and output checksums across all 8 pillars:
 * 1. TOKEN_PROCESSING
 * 2. MEMORY_RETRIEVAL
 * 3. REASONING_EVALUATION
 * 4. GENERATION_SYNTHESIS
 * 5. SPATIAL_LANGUAGE
 * 6. MULTILINGUAL_TRANSFER
 * 7. MULTIMODAL_QA
 * 8. LONG_CONTEXT_NEEDLE
 */

import * as crypto from 'crypto';
import { SeedablePRNG } from '../../../testing/native/prng';
import {
  EpistemicEvidenceItem,
  EpistemicStatus,
  EpistemicType,
  EvidencePolarity,
} from '../../../epistemic/native/epistemicTypes';
import { NativeTokenizer } from '../nativeTokenizer';
import {
  LanguageWorkloadType,
  LanguageWorkloadMetrics,
  LanguageLatencyPercentiles,
} from './languageOptimizationTypes';
import { OptimizedTokenProcessor } from './optimizedTokenProcessor';
import { OptimizedLanguageRetriever } from './optimizedLanguageRetriever';
import { OptimizedLanguageReasoner } from './optimizedLanguageReasoner';

export function computePercentiles(latencies: number[]): LanguageLatencyPercentiles {
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

function createEvidenceItem(
  id: string,
  polarity: EvidencePolarity,
  strength: number,
  tenantId: string
): EpistemicEvidenceItem {
  return {
    mathType: 'EPISTEMIC_EVIDENCE',
    id,
    tenantId,
    domain: 'KNOWLEDGE',
    observationId: `obs_${id}`,
    subject: 'cell_reasoning',
    predicate: 'grounding_state',
    observedValue: 1,
    polarity,
    strength,
    epistemicType: 'EVIDENCE',
    epistemicStatus: 'EMPIRICAL_EVIDENCE',
    confidence: strength,
    justification: `Observation for ${id}`,
    timestamp: Date.now(),
    checksum: crypto.createHash('sha256').update(id).digest('hex'),
  };
}

export class LanguageWorkloadProfiler {
  /**
   * 1. TOKEN_PROCESSING Pillar: Profiling Tokenization & Vocabulary Lookup.
   */
  public static profileTokenProcessing(
    iterations = 50,
    phase: 'BASELINE' | 'OPTIMIZED' = 'BASELINE',
    isColdStart = false,
    tenantId = 'tenant_prof_token'
  ): LanguageWorkloadMetrics {
    const rawSentences = [
      'The sovereign CUBiO architecture grounds intelligence in canonical spatial memory.',
      'Native tokens map to a certified 343 cell lattice with Formula A addressing.',
      'Epistemic verification calibrates facts, evidence, hypotheses and unknown boundaries.',
      'Deterministic knowledge structures eliminate hallucination without external models.',
      'Multimodal pathways preserve single identity across text, vision, and audio frames.',
    ];

    const initialHeap = process.memoryUsage().heapUsed;
    const latencies: number[] = [];

    const baselineTokenizer = new NativeTokenizer();
    const optimizedProcessor = new OptimizedTokenProcessor(undefined, 256);

    if (isColdStart && phase === 'OPTIMIZED') {
      optimizedProcessor.clearCache(tenantId);
    }

    let resultAcc = '';
    const totalStart = performance.now();

    for (let i = 0; i < iterations; i++) {
      const sentence = rawSentences[i % rawSentences.length];
      const stepStart = performance.now();

      if (phase === 'BASELINE') {
        const seq = baselineTokenizer.tokenize(sentence, { tenantId });
        resultAcc += `${seq.length}:${seq.checksum};`;
      } else {
        const seq = optimizedProcessor.tokenize(sentence, { tenantId });
        resultAcc += `${seq.length}:${seq.checksum};`;
      }

      latencies.push(performance.now() - stepStart);
    }

    const totalDurationMs = Math.max(0.01, performance.now() - totalStart);
    const finalHeap = process.memoryUsage().heapUsed;
    const sampleResultChecksum = crypto.createHash('sha256').update(resultAcc).digest('hex');

    const cacheStats = phase === 'OPTIMIZED' ? optimizedProcessor.sequenceCache.getStats() : null;

    return Object.freeze({
      workloadType: 'TOKEN_PROCESSING',
      phase,
      isColdStart,
      iterations,
      totalDurationMs: Number(totalDurationMs.toFixed(3)),
      throughputOpsPerSec: Number(((iterations / totalDurationMs) * 1000).toFixed(1)),
      latencies: computePercentiles(latencies),
      initialHeapBytes: initialHeap,
      finalHeapBytes: finalHeap,
      heapDeltaBytes: Math.max(0, finalHeap - initialHeap),
      cacheHits: cacheStats ? cacheStats.hits : 0,
      cacheMisses: cacheStats ? cacheStats.misses : iterations,
      evictionCount: cacheStats ? cacheStats.evictionCount : 0,
      sampleResultChecksum,
    });
  }

  /**
   * 2. MEMORY_RETRIEVAL Pillar: Profiling Sparse Memory Inverted Index vs Linear Scan.
   */
  public static profileMemoryRetrieval(
    iterations = 60,
    phase: 'BASELINE' | 'OPTIMIZED' = 'BASELINE',
    isColdStart = false,
    tenantId = 'tenant_prof_mem'
  ): LanguageWorkloadMetrics {
    const initialHeap = process.memoryUsage().heapUsed;
    const latencies: number[] = [];

    // Setup corpus of 40 documents
    const documents = Array.from({ length: 40 }, (_, idx) => ({
      objectId: `doc_${idx}`,
      tenantId,
      cellId: idx * 7,
      text: `Canonical document ${idx} storing sovereign memory cell ${idx * 7} for lattice grounding.`,
    }));

    const retriever = new OptimizedLanguageRetriever(undefined, undefined, 256, tenantId);
    for (let i = 0; i < documents.length; i++) {
      retriever.indexItem(documents[i]);
    }

    if (isColdStart && phase === 'OPTIMIZED') {
      retriever.clear(tenantId);
      for (let i = 0; i < documents.length; i++) {
        retriever.indexItem(documents[i]);
      }
    }

    const queries = [
      'sovereign memory cell 14',
      'canonical document 21 lattice',
      'storing memory cell 35',
      'grounding for lattice 7',
    ];

    let resultAcc = '';
    const totalStart = performance.now();

    for (let i = 0; i < iterations; i++) {
      const q = queries[i % queries.length];
      const stepStart = performance.now();

      if (phase === 'BASELINE') {
        const qTerms = q.toLowerCase().split(' ');
        const matches = documents.filter((d) => {
          const lower = d.text.toLowerCase();
          return qTerms.some((term) => lower.includes(term));
        });
        resultAcc += `${matches.length};`;
      } else {
        const results = retriever.query(q, { tenantId, limit: 5 });
        resultAcc += `${results.length};`;
      }

      latencies.push(performance.now() - stepStart);
    }

    const totalDurationMs = Math.max(0.01, performance.now() - totalStart);
    const finalHeap = process.memoryUsage().heapUsed;
    const sampleResultChecksum = crypto.createHash('sha256').update(resultAcc).digest('hex');

    const cacheStats = phase === 'OPTIMIZED' ? retriever.queryCache.getStats() : null;

    return Object.freeze({
      workloadType: 'MEMORY_RETRIEVAL',
      phase,
      isColdStart,
      iterations,
      totalDurationMs: Number(totalDurationMs.toFixed(3)),
      throughputOpsPerSec: Number(((iterations / totalDurationMs) * 1000).toFixed(1)),
      latencies: computePercentiles(latencies),
      initialHeapBytes: initialHeap,
      finalHeapBytes: finalHeap,
      heapDeltaBytes: Math.max(0, finalHeap - initialHeap),
      cacheHits: cacheStats ? cacheStats.hits : 0,
      cacheMisses: cacheStats ? cacheStats.misses : iterations,
      evictionCount: cacheStats ? cacheStats.evictionCount : 0,
      sampleResultChecksum,
    });
  }

  /**
   * 3. REASONING_EVALUATION Pillar: Profiling Epistemic Confidence & Entropy Calculation.
   */
  public static profileReasoningEvaluation(
    iterations = 50,
    phase: 'BASELINE' | 'OPTIMIZED' = 'BASELINE',
    isColdStart = false,
    tenantId = 'tenant_prof_reason'
  ): LanguageWorkloadMetrics {
    const initialHeap = process.memoryUsage().heapUsed;
    const latencies: number[] = [];

    const reasoner = new OptimizedLanguageReasoner(256, tenantId);
    if (isColdStart && phase === 'OPTIMIZED') {
      reasoner.clear(tenantId);
    }

    const sup1 = [createEvidenceItem('s1', 'SUPPORTING', 0.9, tenantId), createEvidenceItem('s2', 'SUPPORTING', 0.85, tenantId)];
    const con1: EpistemicEvidenceItem[] = [];

    const sup2 = [createEvidenceItem('s3', 'SUPPORTING', 0.6, tenantId)];
    const con2 = [createEvidenceItem('c1', 'CONTRADICTING', 0.4, tenantId)];

    const sup3 = [
      createEvidenceItem('s5', 'SUPPORTING', 0.95, tenantId),
      createEvidenceItem('s6', 'SUPPORTING', 0.92, tenantId),
      createEvidenceItem('s7', 'SUPPORTING', 0.88, tenantId),
    ];
    const con3: EpistemicEvidenceItem[] = [];

    const testPairs = [
      { sup: sup1, con: con1, type: 'FACT' as EpistemicType },
      { sup: sup2, con: con2, type: 'HYPOTHESIS' as EpistemicType },
      { sup: sup3, con: con3, type: 'HYPOTHESIS' as EpistemicType },
    ];

    let resultAcc = '';
    const totalStart = performance.now();

    for (let i = 0; i < iterations; i++) {
      const pair = testPairs[i % testPairs.length];
      const stepStart = performance.now();

      if (phase === 'BASELINE') {
        const sum = pair.sup.reduce((acc, e) => acc + e.strength, 0) - pair.con.reduce((acc, e) => acc + e.strength, 0);
        const score = Math.max(0, Math.min(1, 0.5 + sum * 0.2));
        resultAcc += `${score.toFixed(3)};`;
      } else {
        const res = reasoner.evaluateEpistemicConfidence(pair.sup, pair.con, pair.type, tenantId);
        resultAcc += `${res.confidence.toFixed(3)};`;
      }

      latencies.push(performance.now() - stepStart);
    }

    const totalDurationMs = Math.max(0.01, performance.now() - totalStart);
    const finalHeap = process.memoryUsage().heapUsed;
    const sampleResultChecksum = crypto.createHash('sha256').update(resultAcc).digest('hex');

    const cacheStats = phase === 'OPTIMIZED' ? reasoner.epistemicCache.getStats() : null;

    return Object.freeze({
      workloadType: 'REASONING_EVALUATION',
      phase,
      isColdStart,
      iterations,
      totalDurationMs: Number(totalDurationMs.toFixed(3)),
      throughputOpsPerSec: Number(((iterations / totalDurationMs) * 1000).toFixed(1)),
      latencies: computePercentiles(latencies),
      initialHeapBytes: initialHeap,
      finalHeapBytes: finalHeap,
      heapDeltaBytes: Math.max(0, finalHeap - initialHeap),
      cacheHits: cacheStats ? cacheStats.hits : 0,
      cacheMisses: cacheStats ? cacheStats.misses : iterations,
      evictionCount: cacheStats ? cacheStats.evictionCount : 0,
      sampleResultChecksum,
    });
  }

  /**
   * 4. GENERATION_SYNTHESIS Pillar: Profiling Knowledge Synthesis & Verification.
   */
  public static profileGenerationSynthesis(
    iterations = 40,
    phase: 'BASELINE' | 'OPTIMIZED' = 'BASELINE',
    isColdStart = false,
    tenantId = 'tenant_prof_gen'
  ): LanguageWorkloadMetrics {
    const initialHeap = process.memoryUsage().heapUsed;
    const latencies: number[] = [];

    const statements = [
      'The certified lattice contains exactly 343 discrete cells.',
      'CUBiO spatial addressing strictly uses Formula A 369.',
      'Unknown boundaries are produced when evidence is insufficient.',
    ];

    const processor = new OptimizedTokenProcessor(undefined, 256);
    if (isColdStart && phase === 'OPTIMIZED') {
      processor.clearCache(tenantId);
    }

    let resultAcc = '';
    const totalStart = performance.now();

    for (let i = 0; i < iterations; i++) {
      const stmt = statements[i % statements.length];
      const stepStart = performance.now();

      if (phase === 'BASELINE') {
        const claims = stmt.split('.').filter((s) => s.trim().length > 0);
        const hash = crypto.createHash('sha256').update(claims.join('|')).digest('hex');
        resultAcc += `${claims.length}:${hash.slice(0, 8)};`;
      } else {
        const seq = processor.tokenize(stmt, { tenantId });
        resultAcc += `${seq.length}:${seq.checksum.slice(0, 8)};`;
      }

      latencies.push(performance.now() - stepStart);
    }

    const totalDurationMs = Math.max(0.01, performance.now() - totalStart);
    const finalHeap = process.memoryUsage().heapUsed;
    const sampleResultChecksum = crypto.createHash('sha256').update(resultAcc).digest('hex');

    const cacheStats = phase === 'OPTIMIZED' ? processor.sequenceCache.getStats() : null;

    return Object.freeze({
      workloadType: 'GENERATION_SYNTHESIS',
      phase,
      isColdStart,
      iterations,
      totalDurationMs: Number(totalDurationMs.toFixed(3)),
      throughputOpsPerSec: Number(((iterations / totalDurationMs) * 1000).toFixed(1)),
      latencies: computePercentiles(latencies),
      initialHeapBytes: initialHeap,
      finalHeapBytes: finalHeap,
      heapDeltaBytes: Math.max(0, finalHeap - initialHeap),
      cacheHits: cacheStats ? cacheStats.hits : 0,
      cacheMisses: cacheStats ? cacheStats.misses : iterations,
      evictionCount: cacheStats ? cacheStats.evictionCount : 0,
      sampleResultChecksum,
    });
  }

  /**
   * 5. SPATIAL_LANGUAGE Pillar: Profiling Spatial Command & 343-Cell Relational Queries.
   */
  public static profileSpatialLanguage(
    iterations = 60,
    phase: 'BASELINE' | 'OPTIMIZED' = 'BASELINE',
    isColdStart = false,
    tenantId = 'tenant_prof_spatial'
  ): LanguageWorkloadMetrics {
    const initialHeap = process.memoryUsage().heapUsed;
    const latencies: number[] = [];

    const reasoner = new OptimizedLanguageReasoner(256, tenantId);
    if (isColdStart && phase === 'OPTIMIZED') {
      reasoner.clear(tenantId);
    }

    const cellPairs = [
      { origin: 0, target: 49 },
      { origin: 100, target: 101 },
      { origin: 171, target: 172 },
      { origin: 342, target: 341 },
    ];

    let resultAcc = '';
    const totalStart = performance.now();

    for (let i = 0; i < iterations; i++) {
      const pair = cellPairs[i % cellPairs.length];
      const stepStart = performance.now();

      if (phase === 'BASELINE') {
        const ox = Math.floor(pair.origin / 49);
        const oy = Math.floor((pair.origin % 49) / 7);
        const oz = pair.origin % 7;
        const tx = Math.floor(pair.target / 49);
        const ty = Math.floor((pair.target % 49) / 7);
        const tz = pair.target % 7;
        const dist = Math.sqrt((tx - ox) ** 2 + (ty - oy) ** 2 + (tz - oz) ** 2);
        resultAcc += `${dist.toFixed(2)};`;
      } else {
        const res = reasoner.evaluateSpatialRelation(pair.origin, pair.target, tenantId);
        resultAcc += `${res.distance.toFixed(2)};`;
      }

      latencies.push(performance.now() - stepStart);
    }

    const totalDurationMs = Math.max(0.01, performance.now() - totalStart);
    const finalHeap = process.memoryUsage().heapUsed;
    const sampleResultChecksum = crypto.createHash('sha256').update(resultAcc).digest('hex');

    const cacheStats = phase === 'OPTIMIZED' ? reasoner.spatialCache.getStats() : null;

    return Object.freeze({
      workloadType: 'SPATIAL_LANGUAGE',
      phase,
      isColdStart,
      iterations,
      totalDurationMs: Number(totalDurationMs.toFixed(3)),
      throughputOpsPerSec: Number(((iterations / totalDurationMs) * 1000).toFixed(1)),
      latencies: computePercentiles(latencies),
      initialHeapBytes: initialHeap,
      finalHeapBytes: finalHeap,
      heapDeltaBytes: Math.max(0, finalHeap - initialHeap),
      cacheHits: cacheStats ? cacheStats.hits : 0,
      cacheMisses: cacheStats ? cacheStats.misses : iterations,
      evictionCount: cacheStats ? cacheStats.evictionCount : 0,
      sampleResultChecksum,
    });
  }

  /**
   * 6. MULTILINGUAL_TRANSFER Pillar: Profiling Concept Alignment Across 7 Languages.
   */
  public static profileMultilingualTransfer(
    iterations = 50,
    phase: 'BASELINE' | 'OPTIMIZED' = 'BASELINE',
    isColdStart = false,
    tenantId = 'tenant_prof_multilingual'
  ): LanguageWorkloadMetrics {
    const initialHeap = process.memoryUsage().heapUsed;
    const latencies: number[] = [];

    const reasoner = new OptimizedLanguageReasoner(256, tenantId);
    if (isColdStart && phase === 'OPTIMIZED') {
      reasoner.clear(tenantId);
    }

    const transfers = [
      { concept: 'knowledge', src: 'en', tgt: 'de' },
      { concept: 'reasoning', src: 'en', tgt: 'fr' },
      { concept: 'memory', src: 'en', tgt: 'es' },
      { concept: 'spatial', src: 'en', tgt: 'zh' },
    ];

    let resultAcc = '';
    const totalStart = performance.now();

    for (let i = 0; i < iterations; i++) {
      const item = transfers[i % transfers.length];
      const stepStart = performance.now();

      if (phase === 'BASELINE') {
        const str = `${item.src}->${item.tgt}:${item.concept.toUpperCase()}`;
        resultAcc += `${str};`;
      } else {
        const res = reasoner.transferConcept(item.concept, item.src, item.tgt, tenantId);
        resultAcc += `${res.targetConcept};`;
      }

      latencies.push(performance.now() - stepStart);
    }

    const totalDurationMs = Math.max(0.01, performance.now() - totalStart);
    const finalHeap = process.memoryUsage().heapUsed;
    const sampleResultChecksum = crypto.createHash('sha256').update(resultAcc).digest('hex');

    const cacheStats = phase === 'OPTIMIZED' ? reasoner.multilingualCache.getStats() : null;

    return Object.freeze({
      workloadType: 'MULTILINGUAL_TRANSFER',
      phase,
      isColdStart,
      iterations,
      totalDurationMs: Number(totalDurationMs.toFixed(3)),
      throughputOpsPerSec: Number(((iterations / totalDurationMs) * 1000).toFixed(1)),
      latencies: computePercentiles(latencies),
      initialHeapBytes: initialHeap,
      finalHeapBytes: finalHeap,
      heapDeltaBytes: Math.max(0, finalHeap - initialHeap),
      cacheHits: cacheStats ? cacheStats.hits : 0,
      cacheMisses: cacheStats ? cacheStats.misses : iterations,
      evictionCount: cacheStats ? cacheStats.evictionCount : 0,
      sampleResultChecksum,
    });
  }

  /**
   * 7. MULTIMODAL_QA Pillar: Profiling Cross-Modal Consistency Checks.
   */
  public static profileMultimodalQA(
    iterations = 50,
    phase: 'BASELINE' | 'OPTIMIZED' = 'BASELINE',
    isColdStart = false,
    tenantId = 'tenant_prof_multimodal'
  ): LanguageWorkloadMetrics {
    const initialHeap = process.memoryUsage().heapUsed;
    const latencies: number[] = [];

    const reasoner = new OptimizedLanguageReasoner(256, tenantId);
    if (isColdStart && phase === 'OPTIMIZED') {
      reasoner.clear(tenantId);
    }

    const probes = [
      { text: 'Visual frame confirms red sphere in cell 49', hash: 'vis_hash_49' },
      { text: 'Audio spectrum indicates 440Hz tone in cell 100', hash: 'aud_hash_100' },
      { text: 'Structured telemetry aligns with spatial coordinates', hash: 'struct_hash_171' },
    ];

    let resultAcc = '';
    const totalStart = performance.now();

    for (let i = 0; i < iterations; i++) {
      const probe = probes[i % probes.length];
      const stepStart = performance.now();

      if (phase === 'BASELINE') {
        const h = crypto.createHash('sha256').update(probe.text + probe.hash).digest('hex').slice(0, 8);
        resultAcc += `${h};`;
      } else {
        const res = reasoner.evaluateMultimodalConsistency(probe.text, probe.hash, tenantId);
        resultAcc += `${res.isConsistent}:${res.confidence};`;
      }

      latencies.push(performance.now() - stepStart);
    }

    const totalDurationMs = Math.max(0.01, performance.now() - totalStart);
    const finalHeap = process.memoryUsage().heapUsed;
    const sampleResultChecksum = crypto.createHash('sha256').update(resultAcc).digest('hex');

    const cacheStats = phase === 'OPTIMIZED' ? reasoner.multimodalCache.getStats() : null;

    return Object.freeze({
      workloadType: 'MULTIMODAL_QA',
      phase,
      isColdStart,
      iterations,
      totalDurationMs: Number(totalDurationMs.toFixed(3)),
      throughputOpsPerSec: Number(((iterations / totalDurationMs) * 1000).toFixed(1)),
      latencies: computePercentiles(latencies),
      initialHeapBytes: initialHeap,
      finalHeapBytes: finalHeap,
      heapDeltaBytes: Math.max(0, finalHeap - initialHeap),
      cacheHits: cacheStats ? cacheStats.hits : 0,
      cacheMisses: cacheStats ? cacheStats.misses : iterations,
      evictionCount: cacheStats ? cacheStats.evictionCount : 0,
      sampleResultChecksum,
    });
  }

  /**
   * 8. LONG_CONTEXT_NEEDLE Pillar: Profiling Needle-in-a-Haystack Retrieval Across Deep Context.
   */
  public static profileLongContextNeedle(
    iterations = 50,
    phase: 'BASELINE' | 'OPTIMIZED' = 'BASELINE',
    isColdStart = false,
    tenantId = 'tenant_prof_needle'
  ): LanguageWorkloadMetrics {
    const initialHeap = process.memoryUsage().heapUsed;
    const latencies: number[] = [];

    const corpus = Array.from({ length: 80 }, (_, idx) => ({
      objectId: `haystack_${idx}`,
      tenantId,
      cellId: idx,
      text: `Haystack background text ${idx} with arbitrary noise information and token distributions.`,
    }));

    const needleDoc = {
      objectId: 'target_needle_369',
      tenantId,
      cellId: 171,
      text: 'The secret sovereign needle contains special code-word PHOENIX_369 in center cell.',
    };
    corpus.push(needleDoc);

    const retriever = new OptimizedLanguageRetriever(undefined, undefined, 256, tenantId);
    for (let i = 0; i < corpus.length; i++) {
      retriever.indexItem(corpus[i]);
    }

    if (isColdStart && phase === 'OPTIMIZED') {
      retriever.clear(tenantId);
      for (let i = 0; i < corpus.length; i++) {
        retriever.indexItem(corpus[i]);
      }
    }

    const needleQuery = 'secret sovereign needle PHOENIX_369';

    let resultAcc = '';
    const totalStart = performance.now();

    for (let i = 0; i < iterations; i++) {
      const stepStart = performance.now();

      if (phase === 'BASELINE') {
        const matches = corpus.filter((d) => d.text.includes('PHOENIX_369'));
        resultAcc += `${matches.length > 0 ? matches[0].objectId : 'none'};`;
      } else {
        const results = retriever.query(needleQuery, { tenantId, limit: 1 });
        resultAcc += `${results.length > 0 ? results[0].objectId : 'none'};`;
      }

      latencies.push(performance.now() - stepStart);
    }

    const totalDurationMs = Math.max(0.01, performance.now() - totalStart);
    const finalHeap = process.memoryUsage().heapUsed;
    const sampleResultChecksum = crypto.createHash('sha256').update(resultAcc).digest('hex');

    const cacheStats = phase === 'OPTIMIZED' ? retriever.queryCache.getStats() : null;

    return Object.freeze({
      workloadType: 'LONG_CONTEXT_NEEDLE',
      phase,
      isColdStart,
      iterations,
      totalDurationMs: Number(totalDurationMs.toFixed(3)),
      throughputOpsPerSec: Number(((iterations / totalDurationMs) * 1000).toFixed(1)),
      latencies: computePercentiles(latencies),
      initialHeapBytes: initialHeap,
      finalHeapBytes: finalHeap,
      heapDeltaBytes: Math.max(0, finalHeap - initialHeap),
      cacheHits: cacheStats ? cacheStats.hits : 0,
      cacheMisses: cacheStats ? cacheStats.misses : iterations,
      evictionCount: cacheStats ? cacheStats.evictionCount : 0,
      sampleResultChecksum,
    });
  }

  /**
   * Profiles a given pillar by workload type.
   */
  public static profileWorkload(
    workloadType: LanguageWorkloadType,
    iterations = 50,
    phase: 'BASELINE' | 'OPTIMIZED' = 'BASELINE',
    isColdStart = false,
    tenantId = 'tenant_prof'
  ): LanguageWorkloadMetrics {
    switch (workloadType) {
      case 'TOKEN_PROCESSING':
        return this.profileTokenProcessing(iterations, phase, isColdStart, tenantId);
      case 'MEMORY_RETRIEVAL':
        return this.profileMemoryRetrieval(iterations, phase, isColdStart, tenantId);
      case 'REASONING_EVALUATION':
        return this.profileReasoningEvaluation(iterations, phase, isColdStart, tenantId);
      case 'GENERATION_SYNTHESIS':
        return this.profileGenerationSynthesis(iterations, phase, isColdStart, tenantId);
      case 'SPATIAL_LANGUAGE':
        return this.profileSpatialLanguage(iterations, phase, isColdStart, tenantId);
      case 'MULTILINGUAL_TRANSFER':
        return this.profileMultilingualTransfer(iterations, phase, isColdStart, tenantId);
      case 'MULTIMODAL_QA':
        return this.profileMultimodalQA(iterations, phase, isColdStart, tenantId);
      case 'LONG_CONTEXT_NEEDLE':
        return this.profileLongContextNeedle(iterations, phase, isColdStart, tenantId);
    }
  }
}
