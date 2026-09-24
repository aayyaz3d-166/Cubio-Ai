/**
 * CUBiO AI — Task 173: Context Segmentation & Chunking
 * src/cubio/model/native_segmentation/segmentAssembler.ts
 *
 * Deterministic Segment Assembler:
 * Reassembles chunk sequences into coherent text streams with
 * rigorous anti-corruption, boundary continuity, and checksum verification.
 */

import * as crypto from 'crypto';
import {
  CanonicalChunk,
  ChunkReference,
  SegmentationIntegrityError,
  SegmentationTenantViolationError,
} from './types.js';
import { ChunkReferenceRegistry } from './chunkReferenceRegistry.js';

export interface AssemblyVerificationResult {
  readonly reconstructedText: string;
  readonly totalChunks: number;
  readonly totalTokens: number;
  readonly isChecksumValid: boolean;
  readonly isBoundaryContinuous: boolean;
  readonly assemblyDigest: string;
}

export class SegmentAssembler {
  /**
   * Reassembles chunks directly from canonical chunks array with full validation.
   */
  public static assembleChunks(
    chunks: readonly CanonicalChunk[],
    expectedTenantId: string
  ): AssemblyVerificationResult {
    if (chunks.length === 0) {
      return {
        reconstructedText: '',
        totalChunks: 0,
        totalTokens: 0,
        isChecksumValid: true,
        isBoundaryContinuous: true,
        assemblyDigest: crypto.createHash('sha256').update('EMPTY_STREAM').digest('hex'),
      };
    }

    // Sort by sequenceIndex
    const sorted = [...chunks].sort((a, b) => a.sequenceIndex - b.sequenceIndex);

    const parts: string[] = [];
    let totalTokens = 0;
    let lastEndChar = -1;
    let isBoundaryContinuous = true;

    for (let i = 0; i < sorted.length; i++) {
      const chunk = sorted[i];

      // 1. Tenant Verification
      if (chunk.tenantId !== expectedTenantId) {
        throw new SegmentationTenantViolationError(expectedTenantId, chunk.tenantId);
      }

      // 2. Checksum Verification (Anti-Tamper)
      const computedChecksum = crypto.createHash('sha256').update(chunk.content).digest('hex');
      if (computedChecksum !== chunk.checksum) {
        throw new SegmentationIntegrityError(
          `Checksum mismatch on chunk "${chunk.chunkId}". Expected ${chunk.checksum}, computed ${computedChecksum}. Content tampering detected.`
        );
      }

      // 3. Sequence Continuity
      if (chunk.sequenceIndex !== i) {
        throw new SegmentationIntegrityError(
          `Sequence discontinuity detected: expected index ${i}, found ${chunk.sequenceIndex}.`
        );
      }

      // Check boundary overlap / gaps
      if (lastEndChar !== -1 && chunk.boundary.startChar > lastEndChar) {
        isBoundaryContinuous = false;
      }
      lastEndChar = chunk.boundary.endChar;

      parts.push(chunk.content);
      totalTokens += chunk.tokenCount;
    }

    const reconstructedText = parts.join('');

    const digestHasher = crypto.createHash('sha256');
    digestHasher.update(`ASSEMBLE:${expectedTenantId}:${chunks.length}:${totalTokens}`);
    for (const c of sorted) {
      digestHasher.update(`:${c.chunkId}:${c.checksum}`);
    }
    const assemblyDigest = digestHasher.digest('hex');

    return Object.freeze({
      reconstructedText,
      totalChunks: sorted.length,
      totalTokens,
      isChecksumValid: true,
      isBoundaryContinuous,
      assemblyDigest,
    });
  }

  /**
   * Reassembles text on-demand from chunk references by fetching content from registry / VDB.
   */
  public static assembleFromReferences(
    refs: readonly ChunkReference[],
    registry: ChunkReferenceRegistry,
    callerTenantId: string
  ): AssemblyVerificationResult {
    const loadedChunks: CanonicalChunk[] = [];

    for (const ref of refs) {
      const content = registry.loadChunkContent(ref, callerTenantId);

      loadedChunks.push({
        chunkId: ref.chunkId,
        objectId: ref.objectId,
        tenantId: ref.tenantId,
        sequenceIndex: ref.sequenceIndex,
        boundary: ref.boundary,
        tokenCount: ref.tokenCount,
        content,
        checksum: ref.checksum,
        spatialCellId: ref.spatialCellId,
        epistemicStatus: ref.epistemicStatus,
        isPinnedAnchor: ref.isPinnedAnchor,
        provenance: ref.provenance,
      });
    }

    return this.assembleChunks(loadedChunks, callerTenantId);
  }
}
