/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 43: Streaming Dataset Reader
 *
 * Streams raw dataset records in bounded chunks, preventing large dataset files
 * from exhausting physical RAM on 2GB edge profiles.
 */

import {
  RawDatasetRecord,
  StreamingBufferConfig,
} from './types';

export class StreamingDatasetReader {
  private bufferConfig: StreamingBufferConfig;
  private currentCursor = 0;
  private isExhausted = false;

  constructor(bufferConfigOverrides?: Partial<StreamingBufferConfig>) {
    this.bufferConfig = Object.freeze({
      maxPrefetchSamples: 16,
      highWatermark: 16,
      lowWatermark: 4,
      maxResidentBytes: 16 * 1024 * 1024, // 16 MB max resident buffer
      ...bufferConfigOverrides,
    });
  }

  public getBufferConfig(): StreamingBufferConfig {
    return this.bufferConfig;
  }

  public getCursor(): number {
    return this.currentCursor;
  }

  public isStreamExhausted(): boolean {
    return this.isExhausted;
  }

  /**
   * Reads next chunk of raw records up to maxPrefetchSamples.
   */
  public readNextChunk(sourceRecords: readonly RawDatasetRecord[]): readonly RawDatasetRecord[] {
    if (this.currentCursor >= sourceRecords.length) {
      this.isExhausted = true;
      return Object.freeze([]);
    }

    const start = this.currentCursor;
    const end = Math.min(sourceRecords.length, start + this.bufferConfig.maxPrefetchSamples);
    const chunk = sourceRecords.slice(start, end);
    this.currentCursor = end;

    if (this.currentCursor >= sourceRecords.length) {
      this.isExhausted = true;
    }

    return Object.freeze(chunk);
  }

  /**
   * Resumes reading from a saved checkpoint cursor.
   */
  public resumeFromCursor(cursor: number): void {
    this.currentCursor = cursor;
    this.isExhausted = false;
  }

  public reset(): void {
    this.currentCursor = 0;
    this.isExhausted = false;
  }
}
