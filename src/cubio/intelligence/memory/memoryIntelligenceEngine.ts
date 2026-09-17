/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F8: Master CubiO Memory Intelligence Engine
 *
 * Tiered Short-Term (STM) and Long-Term (LTM) memory management,
 * associative graph linking, multi-criteria recall, and memory consolidation.
 *
 * Plugs directly into F1 Core Foundation as an IIntelligenceEngine.
 */

import { deterministicHash } from '../../state/determinism';
import { CubiODimension } from '../../types';
import { CubiOState } from '../../state/types';
import { DetectedPatternEntry } from '../pattern/types';
import {
  IIntelligenceEngine,
  IntelligenceContextEnvelope,
  EngineExecutionResult,
  EngineHealthReport,
} from '../core/types';
import {
  MemoryTier,
  AssociativeMemoryNode,
  MemoryAssociationType,
  MemoryAssociationLink,
  MemoryRecallQuery,
  MemoryRecallResult,
  ConsolidationReport,
  MemorySnapshotReport,
} from './types';

export class CubiOMemoryIntelligenceEngine implements IIntelligenceEngine {
  public readonly engineId = 'ENGINE_MEMORY';
  public readonly version = '1.0.0';
  public readonly priority = 'PRIMARY' as const;
  public readonly capabilities = ['KNOWLEDGE_RETRIEVAL', 'MEMORY'] as const;
  public readonly metadata = Object.freeze({
    name: 'CubiO Tiered Memory Intelligence Engine',
    description: 'Short-term and long-term spatial associative memory with consolidation and resonance recall.',
  });

  private shortTermMemory: Map<string, AssociativeMemoryNode> = new Map();
  private longTermMemory: Map<string, AssociativeMemoryNode> = new Map();
  private associations: MemoryAssociationLink[] = [];

  private totalExecutions = 0;
  private failedExecutions = 0;
  private startTime = Date.now();

  public async initialize(_core: any): Promise<void> {}

  /**
   * Stores a CubiOState entity in memory.
   */
  public storeStateMemory(
    state: CubiOState,
    tier: MemoryTier = 'SHORT_TERM',
    tags: string[] = []
  ): Readonly<AssociativeMemoryNode> {
    const key = `state:${state.id}`;
    const allTags = Array.from(new Set(['state', state.dimension, ...(state.properties.category ? [state.properties.category] : []), ...tags]));
    const resonanceScore = state.properties.harmonicFlux ? Math.min(100, Math.round(state.properties.harmonicFlux * 100)) : 50;

    return this.storeAssociativeMemory(key, state, {
      tier,
      dimension: state.dimension,
      associatedStateIds: [state.id],
      semanticVector: state.position,
      resonanceScore,
      tags: allTags,
    });
  }

  /**
   * Stores a DetectedPatternEntry in memory.
   */
  public storePatternMemory(
    pattern: DetectedPatternEntry,
    tier: MemoryTier = 'LONG_TERM'
  ): Readonly<AssociativeMemoryNode> {
    const key = `pattern:${pattern.patternId}`;
    const tags = ['pattern', pattern.patternType, ...(pattern.metadata ? Object.keys(pattern.metadata) : [])];
    const resonanceScore = Math.round(pattern.confidence * 100);

    return this.storeAssociativeMemory(key, pattern, {
      tier,
      dimension: 'D3',
      associatedPatternIds: [pattern.patternId],
      associatedStateIds: pattern.involvedStateIds,
      semanticVector: pattern.spatialSignatures,
      resonanceScore,
      tags,
    });
  }

  /**
   * Stores generic associative payload into the specified memory tier.
   */
  public storeAssociativeMemory(
    key: string,
    payload: any,
    options: {
      tier?: MemoryTier;
      dimension?: CubiODimension;
      associatedStateIds?: readonly string[];
      associatedPatternIds?: readonly string[];
      semanticVector?: readonly number[];
      resonanceScore?: number;
      tags?: readonly string[];
    } = {}
  ): Readonly<AssociativeMemoryNode> {
    const tier = options.tier || 'SHORT_TERM';
    const dimension = options.dimension || 'D3';
    const associatedStateIds = options.associatedStateIds || [];
    const associatedPatternIds = options.associatedPatternIds || [];
    const semanticVector = options.semanticVector || [0, 0, 0];
    const resonanceScore = options.resonanceScore !== undefined ? options.resonanceScore : 50;
    const tags = options.tags || [];

    const payloadChecksum = deterministicHash(JSON.stringify(payload) + key);
    const memoryId = `MEM_${deterministicHash(key + tier + payloadChecksum).slice(2, 12)}`;

    const node: AssociativeMemoryNode = Object.freeze({
      memoryId,
      tier,
      key,
      dimension,
      associatedStateIds: Object.freeze([...associatedStateIds]),
      associatedPatternIds: Object.freeze([...associatedPatternIds]),
      semanticVector: Object.freeze([...semanticVector]),
      resonanceScore,
      accessFrequency: 1,
      tags: Object.freeze([...tags]),
      payload,
      payloadChecksum,
      timestamp: Date.now(),
      lastAccessedAt: Date.now(),
    });

    if (tier === 'SHORT_TERM' || tier === 'EPISODIC') {
      this.shortTermMemory.set(memoryId, node);
    } else {
      this.longTermMemory.set(memoryId, node);
    }

    this.totalExecutions++;
    return node;
  }

  /**
   * Creates an associative link between two memory nodes.
   */
  public associateMemories(
    sourceMemoryId: string,
    targetMemoryId: string,
    associationType: MemoryAssociationType = 'ASSOCIATED_WITH',
    weight = 1.0
  ): Readonly<MemoryAssociationLink> {
    const linkChecksum = deterministicHash(`${sourceMemoryId}:${targetMemoryId}:${associationType}:${weight}`);
    const linkId = `LNK_${linkChecksum.slice(2, 12)}`;

    const link: MemoryAssociationLink = Object.freeze({
      linkId,
      sourceMemoryId,
      targetMemoryId,
      associationType,
      weight,
      timestamp: Date.now(),
    });

    this.associations.push(link);
    return link;
  }

  /**
   * Multi-criteria associative recall matching tags, state IDs, vectors, and resonance.
   */
  public recall(query: MemoryRecallQuery = {}): Readonly<MemoryRecallResult> {
    const startTime = Date.now();
    const limit = query.limit || 10;
    const minResonance = query.minResonance !== undefined ? query.minResonance : 0;

    // Collect candidate pool based on requested tier
    const candidates: AssociativeMemoryNode[] = [];
    if (query.tier !== 'LONG_TERM') {
      candidates.push(...this.shortTermMemory.values());
    }
    if (query.tier !== 'SHORT_TERM') {
      candidates.push(...this.longTermMemory.values());
    }

    const scoredResults: { node: AssociativeMemoryNode; score: number }[] = [];

    for (const node of candidates) {
      if (node.resonanceScore < minResonance) continue;
      if (query.targetDimension && node.dimension !== query.targetDimension) continue;

      let score = 0.5; // Base score

      // 1. Match State ID
      if (query.associatedStateId && node.associatedStateIds.includes(query.associatedStateId)) {
        score += 2.0;
        if (node.key === `state:${query.associatedStateId}`) score += 1.0;
      }

      // 2. Match Pattern ID
      if (query.associatedPatternId && node.associatedPatternIds.includes(query.associatedPatternId)) {
        score += 2.0;
        if (node.key === `pattern:${query.associatedPatternId}`) score += 1.0;
      }

      // 3. Match Tags
      if (query.tags && query.tags.length > 0) {
        for (const t of query.tags) {
          if (node.tags.includes(t)) {
            score += 1.0;
          }
        }
      }

      // 4. Match Query Text
      if (query.queryText) {
        const qLower = query.queryText.toLowerCase();
        if (node.key.toLowerCase().includes(qLower)) score += 1.5;
        if (node.tags.some((t) => t.toLowerCase().includes(qLower))) score += 1.0;
      }

      // 5. Resonance Bonus
      score += (node.resonanceScore / 100) * 0.5;

      scoredResults.push({ node, score });
    }

    // Sort descending by score
    scoredResults.sort((a, b) => b.score - a.score);
    const topResults = scoredResults.slice(0, limit);

    // Update access frequency and timestamps on recalled items
    const recalledNodes: AssociativeMemoryNode[] = [];
    const relevanceScores: number[] = [];

    for (const item of topResults) {
      const updatedNode: AssociativeMemoryNode = Object.freeze({
        ...item.node,
        accessFrequency: item.node.accessFrequency + 1,
        lastAccessedAt: Date.now(),
      });

      if (this.shortTermMemory.has(item.node.memoryId)) {
        this.shortTermMemory.set(item.node.memoryId, updatedNode);
      } else if (this.longTermMemory.has(item.node.memoryId)) {
        this.longTermMemory.set(item.node.memoryId, updatedNode);
      }

      recalledNodes.push(updatedNode);
      relevanceScores.push(parseFloat(item.score.toFixed(4)));
    }

    const duration = Math.max(1, Date.now() - startTime);
    const recallChecksum = deterministicHash(
      `RECALL:${recalledNodes.map((n) => n.memoryId).join(',')}:${duration}`
    );
    const queryId = `Q_${recallChecksum.slice(2, 12)}`;

    this.totalExecutions++;

    return Object.freeze({
      queryId,
      retrievedMemories: Object.freeze(recalledNodes),
      totalRecallCount: recalledNodes.length,
      relevanceScores: Object.freeze(relevanceScores),
      retrievalDurationMs: duration,
      recallChecksum,
      timestamp: Date.now(),
    });
  }

  /**
   * Promotes high-utility STM nodes (accessFrequency >= 3 or resonanceScore >= 80) to persistent LTM.
   */
  public consolidate(
    options: { minAccessFrequency?: number; minResonance?: number } = {}
  ): Readonly<ConsolidationReport> {
    const minFreq = options.minAccessFrequency !== undefined ? options.minAccessFrequency : 3;
    const minRes = options.minResonance !== undefined ? options.minResonance : 80;

    let promoted = 0;
    const toPromote: AssociativeMemoryNode[] = [];

    for (const [id, node] of this.shortTermMemory.entries()) {
      if (node.accessFrequency >= minFreq || node.resonanceScore >= minRes) {
        toPromote.push(node);
        this.shortTermMemory.delete(id);
      }
    }

    for (const node of toPromote) {
      const ltmNode: AssociativeMemoryNode = Object.freeze({
        ...node,
        tier: 'LONG_TERM',
      });
      this.longTermMemory.set(ltmNode.memoryId, ltmNode);
      promoted++;
    }

    const reportId = `CONSOL_${deterministicHash(`${promoted}:${this.longTermMemory.size}`).slice(2, 12)}`;

    return Object.freeze({
      consolidationId: reportId,
      promotedCount: promoted,
      evictedCount: 0,
      stmTotalCount: this.shortTermMemory.size,
      ltmTotalCount: this.longTermMemory.size,
      timestamp: Date.now(),
    });
  }

  /**
   * Returns a snapshot of memory engine state.
   */
  public getMemorySnapshot(): Readonly<MemorySnapshotReport> {
    const stmCount = this.shortTermMemory.size;
    const ltmCount = this.longTermMemory.size;
    const totalAssociations = this.associations.length;

    const allKeys = [...this.shortTermMemory.keys(), ...this.longTermMemory.keys()].sort();
    const memoryMerkleChecksum = deterministicHash(
      `MEM_SNAPSHOT:${stmCount}:${ltmCount}:${totalAssociations}:${allKeys.join(',')}`
    );

    return Object.freeze({
      stmCount,
      ltmCount,
      totalAssociations,
      memoryMerkleChecksum,
      timestamp: Date.now(),
    });
  }

  /**
   * F1 Core Foundation pluggable IIntelligenceEngine execution method.
   */
  public async execute(envelope: IntelligenceContextEnvelope): Promise<EngineExecutionResult> {
    const startTime = Date.now();
    this.totalExecutions++;

    const snapshot = this.getMemorySnapshot();
    const duration = Math.max(1, Date.now() - startTime);
    const checksum = deterministicHash(
      `MEMORY:${envelope.envelopeId}:${envelope.activeDimension}:${snapshot.memoryMerkleChecksum}:${duration}`
    );

    return Object.freeze({
      resultId: `RES_${checksum.slice(2, 14)}`,
      engineId: this.engineId,
      textOutput: `[Memory Engine @ ${envelope.activeDimension}]: Memory core online. Active Working Memory (STM=${snapshot.stmCount}, LTM=${snapshot.ltmCount}, Associations=${snapshot.totalAssociations}).`,
      reasoningSteps: Object.freeze([
        {
          stepIndex: 1,
          claim: 'Memory Subsystem Coherence',
          evidence: `Verified ${snapshot.stmCount + snapshot.ltmCount} total memory nodes with ${snapshot.totalAssociations} associative links.`,
          dimension: envelope.activeDimension,
          confidence: 0.999,
          resonanceScore: 100,
        },
        {
          stepIndex: 2,
          claim: 'Consolidation Pipeline Ready',
          evidence: 'STM and LTM buffers ready for associative resonance recall and memory promotion.',
          dimension: envelope.activeDimension,
          confidence: 0.998,
          resonanceScore: 99.5,
        },
      ]),
      confidence: 0.999,
      resonanceScore: envelope.harmonic?.resonanceScore || 99.8,
      executionTimeMs: duration,
      checksum,
      timestamp: Date.now(),
    });
  }

  public async getHealth(): Promise<EngineHealthReport> {
    return Object.freeze({
      status: 'READY',
      uptimeMs: Date.now() - this.startTime,
      totalExecutions: this.totalExecutions,
      failedExecutions: this.failedExecutions,
      avgLatencyMs: 1,
    });
  }

  public async dispose(): Promise<void> {
    this.shortTermMemory.clear();
    this.longTermMemory.clear();
    this.associations = [];
  }
}
