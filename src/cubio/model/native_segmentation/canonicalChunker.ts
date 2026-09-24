/**
 * CUBiO AI — Task 173: Context Segmentation & Chunking
 * src/cubio/model/native_segmentation/canonicalChunker.ts
 *
 * Core Canonical Chunking Engine:
 * Generates deterministic chunks with stable IDs, exact boundaries,
 * SHA-256 checksums, and provenance descriptors across all segmentation modes.
 */

import * as crypto from 'crypto';
import {
  CanonicalChunk,
  ChunkReference,
  SegmentationConfig,
  SegmentationMode,
  SegmentationResult,
} from './types.js';
import { BoundaryDetector } from './boundaryDetector.js';

export const DEFAULT_SEGMENTATION_CONFIG: SegmentationConfig = Object.freeze({
  mode: 'HYBRID',
  targetChunkTokens: 512,
  maxChunkTokens: 768,
  minChunkTokens: 128,
  overlapTokens: 0,
  preserveCodeBlocks: true,
  preserveMarkdownHeaders: true,
  pinFirstChunkAsAnchor: true,
});

export class CanonicalChunker {
  /**
   * Estimates token count from character length (~4 chars per token).
   */
  public static estimateTokens(text: string): number {
    return Math.max(1, Math.ceil(text.length / 4));
  }

  /**
   * Generates a stable, deterministic chunk ID.
   */
  public static computeStableChunkId(tenantId: string, contentChecksum: string, index: number): string {
    const tenantPrefix = tenantId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);
    const hashPart = contentChecksum.slice(0, 12);
    return `chk_${tenantPrefix}_${hashPart}_${index.toString().padStart(4, '0')}`;
  }

  /**
   * Segments a stream of text into canonical chunks and references.
   */
  public static segmentStream(params: {
    sourceDocId: string;
    tenantId: string;
    content: string;
    config?: Partial<SegmentationConfig>;
    spatialCellId?: number;
    epistemicStatus?: string;
  }): {
    chunks: readonly CanonicalChunk[];
    result: SegmentationResult;
  } {
    const startTime = Date.now();
    const {
      sourceDocId,
      tenantId,
      content,
      config: userConfig,
      spatialCellId,
      epistemicStatus = 'OBSERVATION',
    } = params;

    const cfg: SegmentationConfig = { ...DEFAULT_SEGMENTATION_CONFIG, ...userConfig };
    const targetTokens = cfg.targetChunkTokens;
    const minTokens = userConfig?.minChunkTokens ?? Math.min(cfg.minChunkTokens, Math.max(8, Math.floor(targetTokens * 0.4)));
    const maxTokens = userConfig?.maxChunkTokens ?? (userConfig?.targetChunkTokens ? Math.floor(targetTokens * 1.5) : cfg.maxChunkTokens);

    const targetChars = targetTokens * 4;
    const maxChars = maxTokens * 4;
    const minChars = minTokens * 4;
    const overlapChars = cfg.overlapTokens * 4;

    const boundaries = BoundaryDetector.scanBoundaries(content);
    const totalChars = content.length;

    const chunks: CanonicalChunk[] = [];
    const references: ChunkReference[] = [];

    let cursor = 0;
    let sequenceIndex = 0;
    let tokenOffset = 0;

    while (cursor < totalChars) {
      let cutIndex = totalChars;
      let boundaryType: any = 'STREAM_END';

      if (cfg.mode === 'FIXED_TOKEN') {
        cutIndex = Math.min(totalChars, cursor + targetChars);
        boundaryType = 'TOKEN_WINDOW';
      } else if (cfg.mode === 'STRUCTURAL') {
        // Find next structural heading or code block within [cursor + minChars, cursor + maxChars]
        const structuralBoundaries = boundaries.filter(
          b =>
            (b.type === 'MARKDOWN_HEADING' || b.type === 'CODE_BLOCK') &&
            b.charIndex >= cursor + minChars &&
            b.charIndex <= cursor + maxChars
        );
        if (structuralBoundaries.length > 0) {
          cutIndex = structuralBoundaries[0].charIndex;
          boundaryType = structuralBoundaries[0].type;
        } else if (totalChars - cursor <= maxChars) {
          cutIndex = totalChars;
          boundaryType = 'STREAM_END';
        } else {
          const cut = BoundaryDetector.findBestCut(content, cursor + minChars, cursor + maxChars, boundaries);
          cutIndex = Math.max(cursor + 1, cut.cutIndex);
          boundaryType = cut.type;
        }
      } else {
        // HYBRID / SEMANTIC modes
        const remainingChars = totalChars - cursor;
        if (remainingChars <= targetChars) {
          cutIndex = totalChars;
          boundaryType = 'STREAM_END';
        } else {
          const rangeMin = cursor + minChars;
          const rangeMax = Math.min(totalChars, cursor + maxChars);
          const cut = BoundaryDetector.findBestCut(content, rangeMin, rangeMax, boundaries);
          if (cut.cutIndex <= cursor || cut.cutIndex >= totalChars) {
            cutIndex = Math.min(totalChars, cursor + targetChars);
            boundaryType = 'TOKEN_WINDOW';
          } else {
            cutIndex = cut.cutIndex;
            boundaryType = cut.type;
          }
        }
      }

      const chunkSlice = content.slice(cursor, cutIndex);
      const chunkTokens = this.estimateTokens(chunkSlice);
      const checksum = crypto.createHash('sha256').update(chunkSlice).digest('hex');
      const chunkId = this.computeStableChunkId(tenantId, checksum, sequenceIndex);
      const objectId = `obj_${sourceDocId}_chk_${sequenceIndex.toString().padStart(4, '0')}`;

      // Bounded summary
      const cleanText = chunkSlice.replace(/\s+/g, ' ').trim();
      const contentSummary = cleanText.length > 64 ? cleanText.slice(0, 61) + '...' : cleanText;

      const isPinned = cfg.pinFirstChunkAsAnchor && sequenceIndex === 0;

      const canonicalChunk: CanonicalChunk = Object.freeze({
        chunkId,
        objectId,
        tenantId,
        sequenceIndex,
        boundary: Object.freeze({
          startChar: cursor,
          endChar: cutIndex,
          startToken: tokenOffset,
          endToken: tokenOffset + chunkTokens - 1,
          primaryBoundaryType: boundaryType,
        }),
        tokenCount: chunkTokens,
        content: chunkSlice,
        checksum,
        spatialCellId,
        epistemicStatus,
        isPinnedAnchor: isPinned,
        provenance: Object.freeze({
          sourceDocId,
          creationTimestamp: new Date().toISOString(),
          segmentationMode: cfg.mode,
          generatorVersion: 'CUBIO-TASK-173-CANONICAL-CHUNKER-V1',
        }),
      });

      const reference: ChunkReference = Object.freeze({
        chunkId,
        objectId,
        tenantId,
        sequenceIndex,
        boundary: canonicalChunk.boundary,
        tokenCount: chunkTokens,
        byteLength: Buffer.byteLength(chunkSlice, 'utf8'),
        checksum,
        contentSummary,
        spatialCellId,
        epistemicStatus,
        isPinnedAnchor: isPinned,
        provenance: canonicalChunk.provenance,
      });

      chunks.push(canonicalChunk);
      references.push(reference);

      // Advance cursor: apply overlap if configured and not at end
      tokenOffset += chunkTokens;
      sequenceIndex++;

      if (cutIndex >= totalChars) {
        break;
      }

      // If overlap enabled and remaining text > overlapChars
      if (cfg.overlapTokens > 0 && cutIndex + overlapChars < totalChars) {
        cursor = Math.max(cursor + 1, cutIndex - overlapChars);
      } else {
        cursor = cutIndex;
      }
    }

    // Compute overall segmentation digest
    const digestHasher = crypto.createHash('sha256');
    digestHasher.update(`SEG_DIGEST:${sourceDocId}:${tenantId}:${cfg.mode}:${chunks.length}`);
    for (const c of chunks) {
      digestHasher.update(`:${c.chunkId}:${c.checksum}:${c.boundary.startChar}..${c.boundary.endChar}`);
    }
    const segmentationDigest = digestHasher.digest('hex');

    const totalTokens = chunks.reduce((sum, c) => sum + c.tokenCount, 0);
    const executionTimeMs = Math.max(1, Date.now() - startTime);

    const result: SegmentationResult = Object.freeze({
      sourceDocId,
      tenantId,
      mode: cfg.mode,
      totalChars,
      totalTokens,
      chunkCount: chunks.length,
      references: Object.freeze(references),
      segmentationDigest,
      executionTimeMs,
    });

    return {
      chunks: Object.freeze(chunks),
      result,
    };
  }
}
