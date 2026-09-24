/**
 * CUBiO AI — Task 175: Context Compression & Summarization
 * src/cubio/model/native_compression/nativeCompressor.ts
 *
 * Deterministic Native Context Compressor:
 * Generates extractive, structural outline, canonical index, and hybrid
 * summaries with complete lineage, reference preservation, and anti-fabrication checks.
 */

import * as crypto from 'crypto';
import {
  CompressionMode,
  SourceReference,
  CompressionLineage,
  CompressedRepresentation,
  CompressionConfig,
} from './types.js';
import { AntiFabricationVerifier } from './antiFabricationVerifier.js';

export const DEFAULT_COMPRESSION_CONFIG: CompressionConfig = Object.freeze({
  mode: 'HYBRID',
  targetRatio: 0.40,
  minConfidence: 0.80,
  groundingThreshold: 0.85,
  preserveCodeBlocks: true,
  preserveMarkdownHeaders: true,
});

export class NativeCompressor {
  private static summarySequence = 0;

  /**
   * Estimates token count (~4 chars per token).
   */
  public static estimateTokens(text: string): number {
    return Math.max(1, Math.ceil(text.length / 4));
  }

  /**
   * Splits text into individual sentences while preserving delimiters.
   */
  public static splitSentences(text: string): string[] {
    const raw = text.split(/(?<=[.!?])\s+|\n\n+/);
    return raw.map(s => s.trim()).filter(s => s.length > 5);
  }

  /**
   * Computes saliency score for an individual sentence.
   */
  public static scoreSentence(
    sentence: string,
    sentenceIndex: number,
    totalSentences: number,
    freqMap: Map<string, number>
  ): number {
    let score = 0;

    // 1. Position weight (beginning and conclusion boosted)
    if (sentenceIndex === 0) score += 0.35;
    else if (sentenceIndex === totalSentences - 1) score += 0.20;
    else if (sentenceIndex < 3) score += 0.15;

    // 2. Structural marker weight
    if (sentence.startsWith('#')) score += 0.40;
    if (sentence.startsWith('```')) score += 0.30;
    if (/hcp-cell-\d+-\d+-\d+/i.test(sentence)) score += 0.30;

    // 3. Epistemic keyword weight
    const lower = sentence.toLowerCase();
    if (lower.includes('invariant') || lower.includes('axiom') || lower.includes('fact')) score += 0.25;
    if (lower.includes('canonical') || lower.includes('density') || lower.includes('genesis')) score += 0.20;
    if (lower.includes('concurrency') || lower.includes('occ') || lower.includes('provenance')) score += 0.15;

    // 4. Term frequency score
    const words = sentence.toLowerCase().split(/\s+/);
    let termScore = 0;
    for (const w of words) {
      termScore += (freqMap.get(w) ?? 0);
    }
    score += Math.min(0.5, termScore / (words.length * 10));

    return score;
  }

  /**
   * Compresses context stream into a canonical CompressedRepresentation.
   */
  public static compress(params: {
    tenantId: string;
    sourceText: string;
    sourceReferences: readonly SourceReference[];
    sourceDocId?: string;
    config?: Partial<CompressionConfig>;
    spatialCellId?: number;
    epistemicStatus?: string;
  }): CompressedRepresentation {
    const {
      tenantId,
      sourceText,
      sourceReferences,
      sourceDocId = 'DOC_ANONYMOUS',
      config: userConfig,
      spatialCellId,
      epistemicStatus = 'OBSERVATION',
    } = params;

    const cfg: CompressionConfig = { ...DEFAULT_COMPRESSION_CONFIG, ...userConfig };
    const originalTokens = this.estimateTokens(sourceText);
    const targetTokens = cfg.maxCompressedTokens
      ? Math.min(cfg.maxCompressedTokens, Math.max(16, Math.floor(originalTokens * cfg.targetRatio)))
      : Math.max(16, Math.floor(originalTokens * cfg.targetRatio));

    let summaryText = '';

    if (cfg.mode === 'STRUCTURAL_OUTLINE') {
      summaryText = this.compressStructuralOutline(sourceText);
    } else if (cfg.mode === 'CANONICAL_INDEX') {
      summaryText = this.compressCanonicalIndex(sourceText, sourceReferences);
    } else if (cfg.mode === 'EXTRACTIVE') {
      summaryText = this.compressExtractive(sourceText, targetTokens);
    } else {
      // HYBRID
      summaryText = this.compressHybrid(sourceText, targetTokens);
    }

    const compressedTokens = this.estimateTokens(summaryText);
    const compressionRatio = compressedTokens / originalTokens;
    const tokenSavingsPercent = Math.max(0, (1 - compressionRatio) * 100);

    // Anti-fabrication check: verify summary against sourceText and valid source reference metadata
    const refMetadata = sourceReferences.map(
      r => `${r.objectId} ${r.chunkId ?? ''} ${r.checksum} ${r.tokenCount} ${r.epistemicStatus ?? ''}`
    );
    const groundingResult = AntiFabricationVerifier.verifyGrounding(
      summaryText,
      [sourceText, ...refMetadata],
      cfg.groundingThreshold
    );

    const checksum = crypto.createHash('sha256').update(summaryText).digest('hex');
    const seq = (++this.summarySequence).toString().padStart(4, '0');
    const summaryId = `sum_${tenantId.slice(0, 6)}_${checksum.slice(0, 8)}_${seq}_${Date.now().toString(36)}`;

    const confidenceScore = Math.min(
      1.0,
      groundingResult.groundingFidelity * 0.7 + (summaryText.length > 20 ? 0.3 : 0.1)
    );

    const lineage: CompressionLineage = Object.freeze({
      sourceDocIds: Object.freeze([sourceDocId]),
      sourceChunkIds: Object.freeze(sourceReferences.map(r => r.chunkId).filter(Boolean) as string[]),
      originalTokenCount: originalTokens,
      compressedTokenCount: compressedTokens,
      compressionRatio: Number(compressionRatio.toFixed(4)),
      tokenSavingsPercent: Number(tokenSavingsPercent.toFixed(2)),
      confidenceScore: Number(confidenceScore.toFixed(4)),
      groundingFidelity: Number(groundingResult.groundingFidelity.toFixed(4)),
      algorithm: `NATIVE_${cfg.mode}_V1`,
      timestamp: new Date().toISOString(),
    });

    return Object.freeze({
      summaryId,
      tenantId,
      mode: cfg.mode,
      summaryText,
      tokenCount: compressedTokens,
      checksum,
      lineage,
      sourceReferences: Object.freeze([...sourceReferences]),
      epistemicStatus,
      spatialCellId,
      isCanonicalFactPreserved: sourceReferences.length > 0,
    });
  }

  private static compressExtractive(text: string, targetTokens: number): string {
    const sentences = this.splitSentences(text);
    if (sentences.length <= 2) return text;

    // Build frequency map
    const freqMap = new Map<string, number>();
    for (const s of sentences) {
      for (const w of s.toLowerCase().split(/\s+/)) {
        freqMap.set(w, (freqMap.get(w) ?? 0) + 1);
      }
    }

    const scored = sentences.map((s, idx) => ({
      text: s,
      originalIndex: idx,
      score: this.scoreSentence(s, idx, sentences.length, freqMap),
      tokens: this.estimateTokens(s),
    }));

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);

    // Accumulate up to targetTokens
    const selected: typeof scored = [];
    let curTokens = 0;
    for (const item of scored) {
      if (curTokens + item.tokens <= targetTokens || selected.length === 0) {
        selected.push(item);
        curTokens += item.tokens;
      }
    }

    // Restore original document order
    selected.sort((a, b) => a.originalIndex - b.originalIndex);

    return selected.map(item => item.text).join('\n\n');
  }

  private static compressStructuralOutline(text: string): string {
    const lines = text.split('\n');
    const outline: string[] = [];
    let inCode = false;

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('```')) {
        inCode = !inCode;
        outline.push(trimmed);
        continue;
      }
      if (inCode && (trimmed.startsWith('export ') || trimmed.startsWith('function ') || trimmed.startsWith('const '))) {
        outline.push(`  ${trimmed}`);
        continue;
      }
      if (!inCode && (trimmed.startsWith('# ') || trimmed.startsWith('## ') || trimmed.startsWith('### ') || trimmed.startsWith('#### '))) {
        outline.push(trimmed);
        continue;
      }
      if (/hcp-cell-\d+-\d+-\d+/i.test(trimmed)) {
        outline.push(`- Spatial Anchor: ${trimmed}`);
      }
    }

    return outline.length > 0 ? outline.join('\n') : text.slice(0, 200);
  }

  private static compressCanonicalIndex(text: string, references: readonly SourceReference[]): string {
    const lines: string[] = ['# CANONICAL CONTEXT REFERENCE INDEX'];
    lines.push(`Total References: ${references.length}`);

    for (let i = 0; i < references.length; i++) {
      const ref = references[i];
      lines.push(
        `- Ref [${i + 1}]: objectId=${ref.objectId}, tokens=${ref.tokenCount}, checksum=${ref.checksum.slice(0, 12)}..., epistemic=${ref.epistemicStatus ?? 'OBSERVATION'}`
      );
    }

    return lines.join('\n');
  }

  private static compressHybrid(text: string, targetTokens: number): string {
    const outline = this.compressStructuralOutline(text);
    const outlineTokens = this.estimateTokens(outline);

    if (outlineTokens >= targetTokens) {
      return outline;
    }

    const remainingTokens = targetTokens - outlineTokens;
    const extractive = this.compressExtractive(text, remainingTokens);

    return `${outline}\n\n## Key Propositions\n${extractive}`;
  }
}
