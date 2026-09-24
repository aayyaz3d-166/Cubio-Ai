/**
 * CUBiO AI — Task 185: Native Knowledge Acquisition & Ingestion Pipeline
 * src/cubio/model/native_knowledge_acquisition/boundedIngestionStream.ts
 *
 * Memory-Safe Bounded Ingestion Stream:
 * Manages chunked streaming ingestion under strict RAM ceilings,
 * preventing uncontrolled buffer growth and full-memory exhaustion.
 */

import {
  RawKnowledgeDocument,
  IngestionBufferOverflowError,
} from './types';

export interface StreamConfig {
  readonly maxBufferBytes?: number;
  readonly maxBatchSize?: number;
}

export class BoundedIngestionStream {
  public static readonly DEFAULT_MAX_BUFFER_BYTES = 16 * 1024 * 1024; // 16 MB
  public static readonly DEFAULT_MAX_BATCH_SIZE = 64;

  private readonly maxBufferBytes: number;
  private readonly maxBatchSize: number;

  private currentBufferBytes = 0;
  private readonly queue: RawKnowledgeDocument[] = [];

  constructor(config?: StreamConfig) {
    this.maxBufferBytes = config?.maxBufferBytes ?? BoundedIngestionStream.DEFAULT_MAX_BUFFER_BYTES;
    this.maxBatchSize = config?.maxBatchSize ?? BoundedIngestionStream.DEFAULT_MAX_BATCH_SIZE;
  }

  /**
   * Pushes a raw document into the stream buffer, asserting memory ceilings.
   */
  public push(doc: RawKnowledgeDocument): void {
    const docBytes = Buffer.byteLength(doc.content, 'utf8');

    if (this.currentBufferBytes + docBytes > this.maxBufferBytes) {
      throw new IngestionBufferOverflowError(
        this.currentBufferBytes + docBytes,
        this.maxBufferBytes
      );
    }

    if (this.queue.length >= this.maxBatchSize) {
      throw new IngestionBufferOverflowError(
        this.queue.length + 1,
        this.maxBatchSize
      );
    }

    this.queue.push(doc);
    this.currentBufferBytes += docBytes;
  }

  /**
   * Pulls the next batch of documents for processing.
   */
  public pullBatch(batchSize: number = 10): readonly RawKnowledgeDocument[] {
    const batch: RawKnowledgeDocument[] = [];
    while (this.queue.length > 0 && batch.length < batchSize) {
      const doc = this.queue.shift()!;
      const docBytes = Buffer.byteLength(doc.content, 'utf8');
      this.currentBufferBytes = Math.max(0, this.currentBufferBytes - docBytes);
      batch.push(doc);
    }
    return Object.freeze(batch);
  }

  public get pendingCount(): number {
    return this.queue.length;
  }

  public get bufferBytes(): number {
    return this.currentBufferBytes;
  }

  public clear(): void {
    this.queue.length = 0;
    this.currentBufferBytes = 0;
  }
}
