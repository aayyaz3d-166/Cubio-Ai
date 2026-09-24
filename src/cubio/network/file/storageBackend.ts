/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-13: Storage Backend Adapter for Replaceable Storage Providers
 *
 * Implements IStorageBackend adapting NET-06 CubiOCasEngine and Storage Repositories.
 */

import { deterministicHash } from '../../state/determinism';
import { CubiOCasEngine } from '../storage/casEngine';
import { DataBlock } from '../storage/types';
import { IStorageBackend } from './types';

export class CubiOCasStorageBackend implements IStorageBackend {
  private blockStore: Map<string, DataBlock> = new Map();

  public async putContent(
    content: string | Uint8Array,
    mimeType: string = 'application/octet-stream',
    ownerCubId: string = 'SYSTEM'
  ): Promise<{ casHash: string; sizeBytes: number; storageObjectId: string }> {
    const block = CubiOCasEngine.createBlock(content, mimeType);
    this.blockStore.set(block.blockHash, block);

    const casHash = block.blockHash;
    const sizeBytes = block.sizeBytes;
    const storageObjectId = `OBJ_${deterministicHash(`${ownerCubId}:${casHash}`).slice(2, 18)}`;

    return {
      casHash,
      sizeBytes,
      storageObjectId,
    };
  }

  public async getContent(casHashOrObjectId: string): Promise<string | Uint8Array | undefined> {
    const block = this.blockStore.get(casHashOrObjectId);
    if (!block) return undefined;
    return block.data;
  }

  public async verifyIntegrity(casHash: string): Promise<boolean> {
    const block = this.blockStore.get(casHash);
    if (!block) return false;
    return CubiOCasEngine.verifyBlockIntegrity(block);
  }
}
