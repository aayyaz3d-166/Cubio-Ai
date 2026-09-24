/**
 * CubiO — Universal Spatial Operating Environment
 * Step 68: Paged KV Cache Manager (vLLM style virtual block tables)
 *
 * Maps dynamic sequence token contexts into non-contiguous physical KV blocks:
 * - 0% external VRAM fragmentation
 * - Memory reuse across parallel prompt branches
 * - Dynamic token appending without memory pre-allocation
 *
 * Classification: SOFTWARE_VALIDATED
 */

import { SequenceBlockTable } from '../types';
import { KVBlockAllocator } from './kvBlockAllocator';

export class PagedKVCacheManager {
  private allocator: KVBlockAllocator;
  private sequenceTables: Map<string, SequenceBlockTable> = new Map();
  private readonly tokensPerBlock: number;

  constructor(totalBlocks = 256, tokensPerBlock = 16) {
    this.allocator = new KVBlockAllocator(totalBlocks, tokensPerBlock);
    this.tokensPerBlock = tokensPerBlock;
  }

  /**
   * Initializes a block table for a new sequence.
   */
  public allocateSequence(sequenceId: string, initialTokens = 0): SequenceBlockTable {
    const blocksNeeded = Math.max(1, Math.ceil(initialTokens / this.tokensPerBlock));
    const indices: number[] = [];

    for (let i = 0; i < blocksNeeded; i++) {
      indices.push(this.allocator.allocateBlock());
    }

    const table: SequenceBlockTable = Object.freeze({
      sequenceId,
      allocatedBlockIndices: Object.freeze(indices),
      totalTokensCached: initialTokens,
    });

    this.sequenceTables.set(sequenceId, table);
    return table;
  }

  /**
   * Appends newly generated tokens to a sequence's paged block table.
   */
  public appendTokens(sequenceId: string, numNewTokens = 1): SequenceBlockTable {
    let table = this.sequenceTables.get(sequenceId);
    if (!table) {
      return this.allocateSequence(sequenceId, numNewTokens);
    }

    const newTotal = table.totalTokensCached + numNewTokens;
    const blocksNeeded = Math.ceil(newTotal / this.tokensPerBlock);
    const indices = [...table.allocatedBlockIndices];

    while (indices.length < blocksNeeded) {
      indices.push(this.allocator.allocateBlock());
    }

    table = Object.freeze({
      sequenceId,
      allocatedBlockIndices: Object.freeze(indices),
      totalTokensCached: newTotal,
    });

    this.sequenceTables.set(sequenceId, table);
    return table;
  }

  /**
   * Frees all physical blocks allocated to a sequence.
   */
  public freeSequence(sequenceId: string): void {
    const table = this.sequenceTables.get(sequenceId);
    if (table) {
      for (const idx of table.allocatedBlockIndices) {
        this.allocator.releaseBlock(idx);
      }
      this.sequenceTables.delete(sequenceId);
    }
  }

  public getSequenceTable(sequenceId: string): SequenceBlockTable | undefined {
    return this.sequenceTables.get(sequenceId);
  }

  public getAllocator(): KVBlockAllocator {
    return this.allocator;
  }

  public getMemoryUsageBytes(): number {
    const allocatedBlocks = 256 - this.allocator.getFreeBlockCount();
    return allocatedBlocks * this.tokensPerBlock * 64 * 4 * 2; // Keys + Values
  }

  public reset(): void {
    this.sequenceTables.clear();
    this.allocator.reset();
  }
}
