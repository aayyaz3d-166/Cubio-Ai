/**
 * CUBiO AI — Task 173: Context Segmentation & Chunking
 * src/cubio/model/native_segmentation/chunkReferenceRegistry.ts
 *
 * Lightweight Chunk Reference Registry:
 * Holds reference metadata in RAM without duplicating raw text in working memory.
 * Integrates with Primary VDB storage for authoritative canonical persistence.
 */

import {
  CanonicalChunk,
  ChunkReference,
  SegmentationTenantViolationError,
} from './types.js';
import { ModelMemoryCoordinator } from '../native_memory_integration/modelMemoryCoordinator.js';

export class ChunkReferenceRegistry {
  private readonly memoryCoord: ModelMemoryCoordinator;
  // chunkId -> ChunkReference
  private readonly referencesByChunkId = new Map<string, ChunkReference>();
  // tenantId -> sourceDocId -> Set<chunkId>
  private readonly tenantDocMap = new Map<string, Map<string, Set<string>>>();
  // spatialCellId -> Set<chunkId>
  private readonly spatialMap = new Map<number, Set<string>>();

  constructor(memoryCoord?: ModelMemoryCoordinator) {
    this.memoryCoord = memoryCoord ?? new ModelMemoryCoordinator();
  }

  public getMemoryCoordinator(): ModelMemoryCoordinator {
    return this.memoryCoord;
  }

  /**
   * Persists a canonical chunk in Primary VDB and registers its reference in memory.
   */
  public registerAndPersistChunk(chunk: CanonicalChunk, domain?: string): ChunkReference {
    // 1. Persist in authoritative Primary VDB
    this.memoryCoord.persistRecord(
      {
        objectId: chunk.objectId,
        tenantId: chunk.tenantId,
        expectedVersion: 0,
        newContent: chunk.content,
        newSpatialCellId: chunk.spatialCellId,
        newEpistemicStatus: chunk.epistemicStatus,
        promoteToCanonical:
          chunk.isPinnedAnchor &&
          ['FACT', 'AXIOM', 'DERIVED'].includes(chunk.epistemicStatus?.toUpperCase() ?? ''),
      },
      domain ?? 'canonical_chunk'
    );

    // 2. Build lightweight reference without raw text
    const reference: ChunkReference = Object.freeze({
      chunkId: chunk.chunkId,
      objectId: chunk.objectId,
      tenantId: chunk.tenantId,
      sequenceIndex: chunk.sequenceIndex,
      boundary: chunk.boundary,
      tokenCount: chunk.tokenCount,
      byteLength: Buffer.byteLength(chunk.content, 'utf8'),
      checksum: chunk.checksum,
      contentSummary: chunk.content.replace(/\s+/g, ' ').slice(0, 60).trim(),
      spatialCellId: chunk.spatialCellId,
      epistemicStatus: chunk.epistemicStatus,
      isPinnedAnchor: chunk.isPinnedAnchor,
      provenance: chunk.provenance,
    });

    this.referencesByChunkId.set(chunk.chunkId, reference);

    // Update tenant map
    if (!this.tenantDocMap.has(chunk.tenantId)) {
      this.tenantDocMap.set(chunk.tenantId, new Map());
    }
    const docMap = this.tenantDocMap.get(chunk.tenantId)!;
    if (!docMap.has(chunk.provenance.sourceDocId)) {
      docMap.set(chunk.provenance.sourceDocId, new Set());
    }
    docMap.get(chunk.provenance.sourceDocId)!.add(chunk.chunkId);

    // Update spatial map
    if (chunk.spatialCellId !== undefined) {
      if (!this.spatialMap.has(chunk.spatialCellId)) {
        this.spatialMap.set(chunk.spatialCellId, new Set());
      }
      this.spatialMap.get(chunk.spatialCellId)!.add(chunk.chunkId);
    }

    return reference;
  }

  /**
   * Batch registers and persists all chunks from a segmentation result.
   */
  public registerAll(chunks: readonly CanonicalChunk[], domain?: string): readonly ChunkReference[] {
    return chunks.map(c => this.registerAndPersistChunk(c, domain));
  }

  /**
   * Retrieves a chunk reference, strictly enforcing tenant isolation.
   */
  public getReference(chunkId: string, callerTenantId: string): ChunkReference | null {
    const ref = this.referencesByChunkId.get(chunkId);
    if (!ref) return null;

    if (ref.tenantId !== callerTenantId) {
      throw new SegmentationTenantViolationError(callerTenantId, ref.tenantId);
    }

    return ref;
  }

  /**
   * Loads full content on demand from Primary VDB.
   */
  public loadChunkContent(ref: ChunkReference, callerTenantId: string): string {
    if (ref.tenantId !== callerTenantId) {
      throw new SegmentationTenantViolationError(callerTenantId, ref.tenantId);
    }

    const record = this.memoryCoord.getRecord(ref.objectId, callerTenantId);
    if (!record) {
      throw new Error(`Canonical chunk "${ref.chunkId}" not found in VDB.`);
    }

    return record.content;
  }

  /**
   * Queries chunk references for a tenant and document.
   */
  public getDocReferences(sourceDocId: string, callerTenantId: string): readonly ChunkReference[] {
    const docMap = this.tenantDocMap.get(callerTenantId);
    if (!docMap) return [];

    const chunkIds = docMap.get(sourceDocId);
    if (!chunkIds) return [];

    const refs: ChunkReference[] = [];
    for (const cid of chunkIds) {
      const ref = this.referencesByChunkId.get(cid);
      if (ref && ref.tenantId === callerTenantId) {
        refs.push(ref);
      }
    }

    return refs.sort((a, b) => a.sequenceIndex - b.sequenceIndex);
  }

  /**
   * Total registered chunks count.
   */
  public getChunkCount(): number {
    return this.referencesByChunkId.size;
  }

  public clear(): void {
    this.referencesByChunkId.clear();
    this.tenantDocMap.clear();
    this.spatialMap.clear();
  }
}
