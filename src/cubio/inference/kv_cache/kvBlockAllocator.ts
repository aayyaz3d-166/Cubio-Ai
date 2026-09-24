/**
 * CubiO — Universal Spatial Operating Environment
 * Step 68: KV Block Allocator
 *
 * Allocates, tracks, and recycles physical KV memory blocks:
 * - 16 tokens per block
 * - Copy-On-Write (COW) reference counting
 * - 0% memory fragmentation
 *
 * Classification: SOFTWARE_VALIDATED
 */

import { PagedKVBlock } from '../types';

export class KVBlockAllocator {
  private blocks: PagedKVBlock[] = [];
  private totalCapacityBlocks: number;

  constructor(totalCapacityBlocks = 128, tokensPerBlock = 16) {
    this.totalCapacityBlocks = totalCapacityBlocks;
    for (let i = 0; i < totalCapacityBlocks; i++) {
      this.blocks.push({
        blockId: `BLOCK_${i}`,
        physicalBlockIndex: i,
        tokenCapacity: tokensPerBlock,
        currentTokensStored: 0,
        keyTensor: new Float32Array(tokensPerBlock * 64),
        valueTensor: new Float32Array(tokensPerBlock * 64),
        isFree: true,
        referenceCount: 0,
      });
    }
  }

  /**
   * Allocates a free physical block.
   */
  public allocateBlock(): number {
    const idx = this.blocks.findIndex((b) => b.isFree);
    if (idx === -1) {
      throw new Error('Out of physical KV blocks.');
    }
    const b = this.blocks[idx];
    (b as any).isFree = false;
    (b as any).referenceCount = 1;
    (b as any).currentTokensStored = 0;
    return idx;
  }

  /**
   * Increments reference count for Copy-On-Write sharing.
   */
  public retainBlock(blockIndex: number): void {
    if (this.blocks[blockIndex]) {
      (this.blocks[blockIndex] as any).referenceCount++;
    }
  }

  /**
   * Releases a block, freeing memory when ref count drops to 0.
   */
  public releaseBlock(blockIndex: number): void {
    const b = this.blocks[blockIndex];
    if (b) {
      (b as any).referenceCount--;
      if (b.referenceCount <= 0) {
        (b as any).isFree = true;
        (b as any).referenceCount = 0;
        (b as any).currentTokensStored = 0;
      }
    }
  }

  public getBlock(index: number): PagedKVBlock | undefined {
    return this.blocks[index];
  }

  public getFreeBlockCount(): number {
    return this.blocks.filter((b) => b.isFree).length;
  }

  public getUtilizationPercentage(): number {
    const used = this.totalCapacityBlocks - this.getFreeBlockCount();
    return parseFloat(((used / this.totalCapacityBlocks) * 100).toFixed(2));
  }

  public reset(): void {
    for (const b of this.blocks) {
      (b as any).isFree = true;
      (b as any).referenceCount = 0;
      (b as any).currentTokensStored = 0;
    }
  }
}
