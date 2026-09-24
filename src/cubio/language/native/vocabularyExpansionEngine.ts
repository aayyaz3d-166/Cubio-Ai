/**
 * CUBiO AI — Phase 6: Task 75
 * Native Tokenizer & Vocabulary Expansion Layer
 * src/cubio/language/native/vocabularyExpansionEngine.ts
 *
 * Sovereign Native Vocabulary Expansion Engine.
 * Extracts candidate subwords and terms from governed text corpora using an independent
 * frequency-utility induction algorithm.
 * Guarantees zero third-party dependencies, strictly monotonic ID assignment,
 * and comprehensive provenance auditing.
 */

import * as crypto from 'crypto';
import { DEFAULT_TENANT_ID } from '../../core/canonicalIdentity';
import { NativeVocabulary } from './nativeVocabulary';
import {
  TokenProvenance,
  VocabularyExpansionOptions,
  VocabularyExpansionResult,
  VocabularyExpansionError,
} from './expansionTypes';

export class VocabularyExpansionEngine {
  /**
   * Expands an existing NativeVocabulary instance by extracting high-utility subwords from a corpus.
   */
  public static expandFromCorpus(
    vocab: NativeVocabulary,
    corpus: string | readonly string[],
    options: VocabularyExpansionOptions = {}
  ): { upgradedVocab: NativeVocabulary; result: VocabularyExpansionResult } {
    const startTime = performance.now();
    const texts = Array.isArray(corpus) ? corpus : [corpus];
    const fullCorpusText = texts.join('\n');

    if (!fullCorpusText.trim()) {
      throw new VocabularyExpansionError('Cannot expand vocabulary from an empty or whitespace-only corpus');
    }

    const tenantId = options.tenantId?.trim() || DEFAULT_TENANT_ID;
    const maxNewTokens = options.maxNewTokens ?? 256;
    const minFreq = options.minFrequency ?? 2;
    const minLen = options.minTokenLength ?? 2;
    const maxLen = options.maxTokenLength ?? 32;

    // Determine target version
    let targetVersion = options.targetVersion;
    if (!targetVersion) {
      const parts = vocab.version.split('.').map((p) => parseInt(p, 10));
      if (parts.length === 3 && !isNaN(parts[1])) {
        targetVersion = `${parts[0]}.${parts[1] + 1}.0`;
      } else {
        targetVersion = `${vocab.version}-exp1`;
      }
    }

    // Corpus cryptographic hash for provenance
    const corpusChecksum = crypto
      .createHash('sha256')
      .update(fullCorpusText, 'utf8')
      .digest('hex');

    // 1. Candidate Extraction & Frequency Counting
    const candidateCounts = new Map<string, number>();

    for (const text of texts) {
      // Split on whitespaces to extract word boundaries
      const words = text.split(/\s+/).filter((w) => w.length > 0);

      for (const word of words) {
        // Strip non-letter / non-digit edge punctuation for clean subwords
        const clean = word.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
        if (clean.length < minLen) continue;

        // Count whole clean word
        if (clean.length <= maxLen) {
          candidateCounts.set(clean, (candidateCounts.get(clean) || 0) + 1);
        }

        // Substring n-grams
        const len = clean.length;
        for (let start = 0; start < len; start++) {
          for (let end = start + minLen; end <= Math.min(len, start + maxLen); end++) {
            const sub = clean.slice(start, end);
            candidateCounts.set(sub, (candidateCounts.get(sub) || 0) + 1);
          }
        }
      }
    }

    // 2. Score Candidates by Compression Utility: freq * (len - 1)
    interface ScoredCandidate {
      symbol: string;
      frequency: number;
      score: number;
    }

    const scoredList: ScoredCandidate[] = [];

    for (const [sym, freq] of candidateCounts.entries()) {
      if (freq < minFreq) continue;
      if (vocab.has(sym)) continue; // Already known

      const score = freq * (sym.length - 1);
      scoredList.push({ symbol: sym, frequency: freq, score });
    }

    // Sort deterministically: score descending, then symbol alphabetically
    scoredList.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.symbol.localeCompare(b.symbol);
    });

    // 3. Select Top Candidates
    const selected = scoredList.slice(0, maxNewTokens);
    const now = Date.now();

    const itemsToExpand: { symbol: string; provenance: TokenProvenance }[] = selected.map((c) => ({
      symbol: c.symbol,
      provenance: {
        tokenId: -1, // Assigned sequentially in vocab.expand()
        symbol: c.symbol,
        sourceCorpusChecksum: corpusChecksum,
        frequency: c.frequency,
        utilityScore: c.score,
        addedInVersion: targetVersion,
        timestamp: now,
        tenantId,
      },
    }));

    const previousSize = vocab.size;
    const previousVersion = vocab.version;
    const previousMerkleRoot = vocab.merkleRoot;

    // 4. Perform Monotonic Expansion
    const upgradedVocab = vocab.expand(itemsToExpand, targetVersion);

    const elapsedMs = performance.now() - startTime;
    const addedTokens = itemsToExpand.map((i) => i.symbol);

    const result: VocabularyExpansionResult = Object.freeze({
      previousVersion,
      newVersion: targetVersion,
      previousSize,
      newSize: upgradedVocab.size,
      addedTokensCount: addedTokens.length,
      addedTokens: Object.freeze(addedTokens),
      previousMerkleRoot,
      newMerkleRoot: upgradedVocab.merkleRoot,
      corpusChecksum,
      elapsedMs,
    });

    return { upgradedVocab, result };
  }
}
