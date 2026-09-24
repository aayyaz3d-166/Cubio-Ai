/**
 * CUBiO AI — Task 173: Context Segmentation & Chunking
 * src/cubio/model/native_segmentation/segmentationCoordinator.ts
 *
 * Master Facade for Context Segmentation & Chunking:
 * Orchestrates Boundary Detection, Canonical Chunking, VDB Persistence,
 * and Anti-Tamper Reassembly with Task 171/172 integration.
 */

import * as crypto from 'crypto';
import {
  IS_ACTUATION_BLOCKED,
  CanonicalChunk,
  ChunkReference,
  SegmentationConfig,
  SegmentationResult,
  SegmentationIntegrityError,
  SegmentationTenantViolationError,
} from './types.js';
import { CanonicalChunker } from './canonicalChunker.js';
import { ChunkReferenceRegistry } from './chunkReferenceRegistry.js';
import { SegmentAssembler, AssemblyVerificationResult } from './segmentAssembler.js';
import { SegmentationGovernor } from './segmentationGovernor.js';
import { ModelMemoryCoordinator } from '../native_memory_integration/modelMemoryCoordinator.js';
import { LongContextCoordinator } from '../native_long_context/longContextCoordinator.js';

export class SegmentationCoordinator {
  private readonly registry: ChunkReferenceRegistry;

  constructor(registry?: ChunkReferenceRegistry) {
    SegmentationGovernor.assertActuationLockout();
    this.registry = registry ?? new ChunkReferenceRegistry();
  }

  public getRegistry(): ChunkReferenceRegistry {
    return this.registry;
  }

  public getMemoryCoordinator(): ModelMemoryCoordinator {
    return this.registry.getMemoryCoordinator();
  }

  /**
   * Slices an input stream into canonical chunks, registers references in memory,
   * and persists full chunks canonically in Primary VDB.
   */
  public segmentAndPersist(params: {
    sourceDocId: string;
    tenantId: string;
    content: string;
    config?: Partial<SegmentationConfig>;
    spatialCellId?: number;
    epistemicStatus?: string;
    domain?: string;
  }): {
    chunks: readonly CanonicalChunk[];
    result: SegmentationResult;
  } {
    SegmentationGovernor.assertActuationLockout(params.content);
    SegmentationGovernor.assertStreamBudget(params.content.length);

    // 1. Segment stream into canonical chunks
    const { chunks, result } = CanonicalChunker.segmentStream(params);

    // 2. Persist in VDB & register references
    this.registry.registerAll(chunks, params.domain);

    return { chunks, result };
  }

  /**
   * Reassembles a document's chunks from VDB on demand and verifies continuity & integrity.
   */
  public reassembleDocument(sourceDocId: string, callerTenantId: string): AssemblyVerificationResult {
    const refs = this.registry.getDocReferences(sourceDocId, callerTenantId);
    if (refs.length === 0) {
      throw new Error(`No chunks registered for doc "${sourceDocId}" under tenant "${callerTenantId}".`);
    }

    return SegmentAssembler.assembleFromReferences(refs, this.registry, callerTenantId);
  }

  /**
   * Bridges segmented chunks directly into Task 171 Long-Context Index.
   */
  public bridgeToLongContext(
    chunks: readonly CanonicalChunk[],
    longContextCoord: LongContextCoordinator
  ): number {
    let count = 0;
    for (const chunk of chunks) {
      longContextCoord.ingestBlock({
        chunkId: chunk.chunkId,
        objectId: chunk.objectId,
        tenantId: chunk.tenantId,
        tokenStart: chunk.boundary.startToken,
        tokenEnd: chunk.boundary.endToken,
        tokenCount: chunk.tokenCount,
        content: chunk.content,
        expectedVersion: 0,
        spatialCellId: chunk.spatialCellId,
        epistemicStatus: chunk.epistemicStatus,
        isPinned: chunk.isPinnedAnchor,
      });
      count++;
    }
    return count;
  }

  /**
   * Exports document segmentation snapshot in streaming .3dmemory checkpoint format.
   */
  public exportSnapshot(sourceDocId: string, tenantId: string): {
    format: '.3dmemory';
    snapshotId: string;
    tenantId: string;
    sourceDocId: string;
    references: readonly ChunkReference[];
    isActuationBlocked: boolean;
    checksum: string;
  } {
    const refs = this.registry.getDocReferences(sourceDocId, tenantId);

    const hasher = crypto.createHash('sha256');
    hasher.update(`3DMEM_SEG:${tenantId}:${sourceDocId}:${refs.length}`);
    for (const r of refs) {
      hasher.update(`:${r.chunkId}:${r.checksum}:${r.boundary.startChar}..${r.boundary.endChar}`);
    }
    const checksum = hasher.digest('hex');

    return Object.freeze({
      format: '.3dmemory',
      snapshotId: `snap_seg_${Date.now()}`,
      tenantId,
      sourceDocId,
      references: refs,
      isActuationBlocked: IS_ACTUATION_BLOCKED,
      checksum,
    });
  }

  /**
   * Restores and verifies a segmentation snapshot from .3dmemory format.
   */
  public restoreSnapshot(snapshot: any, callerTenantId: string): boolean {
    if (snapshot.format !== '.3dmemory') {
      throw new SegmentationIntegrityError(`Invalid snapshot format "${snapshot.format}", expected ".3dmemory".`);
    }

    if (callerTenantId !== snapshot.tenantId) {
      throw new SegmentationTenantViolationError(callerTenantId, snapshot.tenantId);
    }

    const hasher = crypto.createHash('sha256');
    hasher.update(`3DMEM_SEG:${snapshot.tenantId}:${snapshot.sourceDocId}:${snapshot.references.length}`);
    for (const r of snapshot.references) {
      hasher.update(`:${r.chunkId}:${r.checksum}:${r.boundary.startChar}..${r.boundary.endChar}`);
    }
    const computed = hasher.digest('hex');

    if (computed !== snapshot.checksum) {
      throw new SegmentationIntegrityError(
        `Snapshot checksum mismatch: expected ${snapshot.checksum}, computed ${computed}. Tampering detected.`
      );
    }

    return true;
  }
}
