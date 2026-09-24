/**
 * CubiO — Step 89 Paged KV-Cache
 */

import { PagedKvBlock, CacheTelemetry } from '../types';

export class PagedKvCache {
  public static readonly BLOCK_SIZE = 16;
  public static readonly MAX_BLOCKS = 2048;

  private readonly blocks: Map<string, PagedKvBlock> = new Map();
  private readonly sessionBlockTables: Map<string, string[]> = new Map();
  private hits = 0;
  private misses = 0;

  public getOrCreateBlock(sessionId: string, blockIndex: number, tokens: readonly number[]): PagedKvBlock {
    const blockId = `block_${sessionId}_${blockIndex}`;
    let block = this.blocks.get(blockId);

    if (block) {
      this.hits++;
      block.lastAccessed = Date.now();
      return block;
    }

    this.misses++;
    if (this.blocks.size >= PagedKvCache.MAX_BLOCKS) {
      this.evictLruBlock();
    }

    const newBlock: PagedKvBlock = {
      blockId,
      sessionId,
      tokenStartOffset: blockIndex * PagedKvCache.BLOCK_SIZE,
      tokenLength: tokens.length,
      keys: [...tokens.map((t) => Math.sin(t * 0.1))],
      values: [...tokens.map((t) => Math.cos(t * 0.1))],
      lastAccessed: Date.now(),
    };

    this.blocks.set(blockId, newBlock);

    if (!this.sessionBlockTables.has(sessionId)) {
      this.sessionBlockTables.set(sessionId, []);
    }
    this.sessionBlockTables.get(sessionId)!.push(blockId);

    return newBlock;
  }

  private evictLruBlock(): void {
    let oldestTime = Infinity;
    let oldestId = '';

    for (const [id, block] of this.blocks.entries()) {
      if (block.lastAccessed < oldestTime) {
        oldestTime = block.lastAccessed;
        oldestId = id;
      }
    }

    if (oldestId) {
      const block = this.blocks.get(oldestId);
      if (block) {
        const table = this.sessionBlockTables.get(block.sessionId);
        if (table) {
          const idx = table.indexOf(oldestId);
          if (idx !== -1) table.splice(idx, 1);
        }
      }
      this.blocks.delete(oldestId);
    }
  }

  public getTelemetry(): CacheTelemetry {
    const total = this.hits + this.misses;
    const rate = total > 0 ? parseFloat(((this.hits / total) * 100).toFixed(2)) : 100.0;
    const memMB = parseFloat(((this.blocks.size * 128) / (1024 * 1024)).toFixed(2));

    return Object.freeze({
      totalBlocks: PagedKvCache.MAX_BLOCKS,
      usedBlocks: this.blocks.size,
      cacheHits: this.hits,
      cacheMisses: this.misses,
      hitRatePercent: rate,
      memoryAllocatedMB: memMB,
    });
  }
}
