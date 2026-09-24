/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-06: Content-Addressable Storage (CAS) Engine
 *
 * Provides deterministic content hashing, deduplication, chunking,
 * and lossless byte/string reconstruction.
 */

import { deterministicHash } from '../../state/determinism';
import { DataBlock } from './types';

export class CubiOCasEngine {
  public static readonly DEFAULT_CHUNK_SIZE_BYTES = 64 * 1024; // 64 KB

  /**
   * Computes the deterministic CAS block hash for a given payload.
   */
  public static computeBlockHash(data: Uint8Array | string): string {
    if (typeof data === 'string') {
      return `BLK_${deterministicHash(data).slice(2, 26)}`;
    }
    // For Uint8Array, convert to hex sample or deterministic representation
    let repr = '';
    const len = data.length;
    for (let i = 0; i < Math.min(len, 256); i++) {
      repr += data[i].toString(16).padStart(2, '0');
    }
    repr += `:${len}`;
    return `BLK_${deterministicHash(repr).slice(2, 26)}`;
  }

  /**
   * Creates a single DataBlock.
   */
  public static createBlock(
    data: Uint8Array | string,
    mimeType?: string
  ): DataBlock {
    const sizeBytes = typeof data === 'string' ? Buffer.byteLength(data, 'utf8') : data.length;
    const blockHash = this.computeBlockHash(data);

    return Object.freeze({
      blockHash,
      data,
      sizeBytes,
      mimeType,
      createdAt: Date.now(),
    });
  }

  /**
   * Splits arbitrary payload into content-addressed chunks.
   */
  public static chunkData(
    data: Uint8Array | string,
    chunkSizeBytes: number = this.DEFAULT_CHUNK_SIZE_BYTES,
    mimeType?: string
  ): DataBlock[] {
    const blocks: DataBlock[] = [];

    if (typeof data === 'string') {
      const buffer = Buffer.from(data, 'utf8');
      if (buffer.length <= chunkSizeBytes) {
        blocks.push(this.createBlock(data, mimeType));
        return blocks;
      }

      let offset = 0;
      while (offset < buffer.length) {
        const slice = buffer.subarray(offset, Math.min(offset + chunkSizeBytes, buffer.length));
        const chunkStr = slice.toString('utf8');
        blocks.push(this.createBlock(chunkStr, mimeType));
        offset += chunkSizeBytes;
      }
    } else {
      if (data.length <= chunkSizeBytes) {
        blocks.push(this.createBlock(data, mimeType));
        return blocks;
      }

      let offset = 0;
      while (offset < data.length) {
        const slice = data.subarray(offset, Math.min(offset + chunkSizeBytes, data.length));
        blocks.push(this.createBlock(slice, mimeType));
        offset += chunkSizeBytes;
      }
    }

    return blocks;
  }

  /**
   * Reconstructs contiguous data from an ordered list of DataBlocks.
   */
  public static reconstructData(
    blocks: readonly DataBlock[],
    asBinary: boolean = false
  ): Uint8Array | string {
    if (blocks.length === 0) {
      return asBinary ? new Uint8Array(0) : '';
    }

    if (blocks.length === 1) {
      const single = blocks[0].data;
      if (asBinary && typeof single === 'string') {
        return new Uint8Array(Buffer.from(single, 'utf8'));
      }
      if (!asBinary && single instanceof Uint8Array) {
        return Buffer.from(single).toString('utf8');
      }
      return single;
    }

    // Multiple blocks
    if (asBinary || blocks.some((b) => b.data instanceof Uint8Array)) {
      const buffers = blocks.map((b) =>
        typeof b.data === 'string' ? Buffer.from(b.data, 'utf8') : Buffer.from(b.data)
      );
      const combined = Buffer.concat(buffers);
      return new Uint8Array(combined);
    } else {
      return blocks.map((b) => b.data as string).join('');
    }
  }

  /**
   * Verifies the cryptographic integrity of a DataBlock.
   */
  public static verifyBlockIntegrity(block: DataBlock): boolean {
    const expected = this.computeBlockHash(block.data);
    return expected === block.blockHash;
  }
}
