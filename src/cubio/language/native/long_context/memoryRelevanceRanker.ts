/**
 * CUBiO AI — Phase 6: Task 79
 * Long-Context Memory Integration Layer
 * src/cubio/language/native/long_context/memoryRelevanceRanker.ts
 *
 * Sovereign Deterministic Memory Relevance Ranker.
 * Combines 16D spatial harmonic cosine similarity, token keyword overlap,
 * and epistemic status weighting with strict deterministic tie-breaking.
 * Zero external vector databases or foreign models.
 */

import { CanonicalDomain, DEFAULT_TENANT_ID } from '../../../core/canonicalIdentity';
import { EpistemicStatus } from '../../../epistemic/native/epistemicTypes';
import { NativeLanguageEncoder, SPATIAL_EMBED_DIM } from '../nativeLanguageEncoder';
import { NativeTokenizer } from '../nativeTokenizer';
import {
  InjectedMemoryReference,
  LongContextMemoryConfig,
  DEFAULT_LONG_CONTEXT_CONFIG,
} from './longContextTypes';

export interface CandidateMemoryItem {
  readonly objectId: string;
  readonly tenantId: string;
  readonly domain?: CanonicalDomain;
  readonly checksum: string;
  readonly stateVersion: number;
  readonly epistemicStatus?: EpistemicStatus;
  readonly text: string;
  readonly spatialCellId?: number;
  readonly subject?: string;
  readonly assertionValue?: string;
  readonly provenanceId?: string;
  readonly attributes?: Record<string, any>;
  readonly timestamp?: number;
}

export class MemoryRelevanceRanker {
  private readonly _tokenizer: NativeTokenizer;
  private readonly _encoder: NativeLanguageEncoder;

  constructor(tokenizer?: NativeTokenizer, encoder?: NativeLanguageEncoder) {
    this._tokenizer = tokenizer ?? new NativeTokenizer();
    this._encoder = encoder ?? new NativeLanguageEncoder(this._tokenizer);
  }

  public get tokenizer(): NativeTokenizer {
    return this._tokenizer;
  }

  public get encoder(): NativeLanguageEncoder {
    return this._encoder;
  }

  /**
   * Deterministically computes relevance scores for candidate memory items
   * and returns strictly bounded, ranked references.
   */
  public rankCandidates(
    queryText: string,
    candidates: readonly CandidateMemoryItem[],
    config: Partial<LongContextMemoryConfig> = {}
  ): InjectedMemoryReference[] {
    const threshold = config.relevanceThreshold ?? DEFAULT_LONG_CONTEXT_CONFIG.relevanceThreshold;
    const maxResults = config.maxInjectedReferences ?? DEFAULT_LONG_CONTEXT_CONFIG.maxInjectedReferences;

    if (!queryText || queryText.trim().length === 0 || candidates.length === 0) {
      return [];
    }

    // 1. Encode query representation
    const { sequence: querySeq, representation: queryRep } = this._encoder.encodeText(queryText);
    const queryWords = this._extractKeywordSet(queryText);

    const scoredRefs: InjectedMemoryReference[] = [];

    for (const item of candidates) {
      // Encode candidate representation (safely bounded)
      const candText = item.text.length > 300 ? item.text.slice(0, 300) : item.text;
      const { sequence: candSeq, representation: candRep } = this._encoder.encodeText(candText);
      const candWords = this._extractKeywordSet(item.text + ' ' + (item.subject ?? '') + ' ' + (item.assertionValue ?? ''));

      // 1. Semantic Cosine Similarity (16D normalized dot product calibrated against 0.68 positive baseline)
      let dotProduct = 0.0;
      for (let i = 0; i < SPATIAL_EMBED_DIM; i++) {
        dotProduct += queryRep.sequenceEmbedding[i] * candRep.sequenceEmbedding[i];
      }
      const baseline = 0.68;
      const semanticSim = Math.max(0.0, Math.min(1.0, (dotProduct - baseline) / (1.0 - baseline)));

      // 2. Keyword Jaccard Overlap & Query Coverage
      const keywordSim = this._computeKeywordOverlap(queryWords, candWords, queryText, item.text);

      // 3. Epistemic Confidence Weight
      const epistemicStatus = item.epistemicStatus ?? 'CANONICAL_FACT';
      const epistemicWeight = this._getEpistemicWeight(epistemicStatus);

      // Weighted combination: 60% semantic similarity + 30% keyword overlap + 10% epistemic confidence
      const rawScore = 0.60 * semanticSim + 0.30 * keywordSim + 0.10 * epistemicWeight;
      const relevanceScore = Math.max(0.0, Math.min(1.0, Number(rawScore.toFixed(6))));

      const isRememberedFact =
        epistemicStatus === 'CANONICAL_FACT' || epistemicStatus === 'EMPIRICAL_EVIDENCE';
      const isInferredContent = !isRememberedFact;

      const ref: InjectedMemoryReference = Object.freeze({
        referenceId: `mref_${item.objectId}_v${item.stateVersion}`,
        objectId: item.objectId,
        tenantId: item.tenantId,
        domain: item.domain ?? 'KNOWLEDGE',
        checksum: item.checksum,
        stateVersion: item.stateVersion,
        epistemicStatus,
        relevanceScore,
        isRememberedFact,
        isInferredContent,
        provenanceId: item.provenanceId,
        summaryText: this._createSummary(item.text, 200),
        spatialCellId: item.spatialCellId ?? (querySeq.spatialCellIds.length > 0 ? querySeq.spatialCellIds[0] : 171),
        subject: item.subject,
        assertionValue: item.assertionValue,
        timestamp: item.timestamp ?? Date.now(),
      });

      if (relevanceScore >= threshold) {
        scoredRefs.push(ref);
      }
    }

    // Deterministic tie-breaking:
    // 1. relevanceScore descending
    // 2. stateVersion descending
    // 3. objectId ascending
    scoredRefs.sort((a, b) => {
      const scoreDiff = b.relevanceScore - a.relevanceScore;
      if (Math.abs(scoreDiff) > 1e-6) {
        return scoreDiff;
      }
      if (b.stateVersion !== a.stateVersion) {
        return b.stateVersion - a.stateVersion;
      }
      return a.objectId.localeCompare(b.objectId);
    });

    // Enforce bounded limit
    return scoredRefs.slice(0, maxResults);
  }

  private _extractKeywordSet(text: string): Set<string> {
    const set = new Set<string>();
    const tokens = text.toLowerCase().split(/[^a-z0-9_]+/);
    for (const t of tokens) {
      if (t.length >= 2) {
        set.add(t);
      }
    }
    return set;
  }

  private _computeKeywordOverlap(
    querySet: Set<string>,
    candSet: Set<string>,
    queryRaw: string,
    candRaw: string
  ): number {
    if (querySet.size === 0 || candSet.size === 0) return 0.0;

    let intersectionCount = 0;
    for (const word of querySet) {
      if (candSet.has(word)) {
        intersectionCount++;
      }
    }

    const queryCoverage = querySet.size > 0 ? intersectionCount / querySet.size : 0.0;
    const unionSize = new Set([...querySet, ...candSet]).size;
    const jaccard = unionSize > 0 ? intersectionCount / unionSize : 0.0;

    // Substring bonus
    const cleanQuery = queryRaw.trim().toLowerCase();
    const cleanCand = candRaw.trim().toLowerCase();
    const hasSubstring = cleanCand.includes(cleanQuery) || cleanQuery.includes(cleanCand);
    const substringBonus = hasSubstring ? 0.35 : 0.0;

    return Math.min(1.0, 0.70 * queryCoverage + 0.30 * jaccard + substringBonus);
  }

  private _getEpistemicWeight(status: EpistemicStatus): number {
    switch (status) {
      case 'CANONICAL_FACT':
        return 1.0;
      case 'EMPIRICAL_EVIDENCE':
        return 0.85;
      case 'SUPPORTED_HYPOTHESIS':
        return 0.60;
      case 'PROVISIONAL_ASSUMPTION':
        return 0.45;
      case 'WEAKENED_HYPOTHESIS':
        return 0.30;
      case 'REJECTED_HYPOTHESIS':
        return 0.10;
      case 'EPISTEMIC_UNKNOWN':
      default:
        return 0.20;
    }
  }

  private _createSummary(text: string, maxLength: number): string {
    const clean = text.replace(/\s+/g, ' ').trim();
    if (clean.length <= maxLength) {
      return clean;
    }
    return clean.slice(0, maxLength - 3) + '...';
  }
}
