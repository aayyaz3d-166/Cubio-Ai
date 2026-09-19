/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 43: Dataset Pipeline Sharder
 *
 * Deterministically splits datasets into Train / Validation / Test sets,
 * partitioning each split into content-addressed shard slices.
 */

import {
  NormalizedDatasetRecord,
  PipelineDatasetShard,
  DatasetSplitType,
  DatasetSplitConfig,
} from './types';
import { deterministicHash } from '../../state/determinism';

export class DataPipelineSharder {
  private shards: Map<string, PipelineDatasetShard> = new Map();

  /**
   * Splits normalized records and generates shards for each split.
   */
  public generateSplitShards(
    datasetVersionId: string,
    records: readonly NormalizedDatasetRecord[],
    config: DatasetSplitConfig = { trainRatio: 0.8, validationRatio: 0.1, testRatio: 0.1, randomSeed: 369 },
    shardsPerSplit = 2
  ): {
    trainShards: readonly PipelineDatasetShard[];
    valShards: readonly PipelineDatasetShard[];
    testShards: readonly PipelineDatasetShard[];
  } {
    const total = records.length;
    const trainEnd = Math.floor(total * config.trainRatio);
    const valEnd = trainEnd + Math.floor(total * config.validationRatio);

    const trainRecords = records.slice(0, trainEnd);
    const valRecords = records.slice(trainEnd, valEnd);
    const testRecords = records.slice(valEnd);

    const trainShards = this.createShardsForSplit(datasetVersionId, 'TRAIN', trainRecords, shardsPerSplit);
    const valShards = this.createShardsForSplit(datasetVersionId, 'VALIDATION', valRecords, shardsPerSplit);
    const testShards = this.createShardsForSplit(datasetVersionId, 'TEST', testRecords, shardsPerSplit);

    return {
      trainShards: Object.freeze(trainShards),
      valShards: Object.freeze(valShards),
      testShards: Object.freeze(testShards),
    };
  }

  private createShardsForSplit(
    datasetVersionId: string,
    split: DatasetSplitType,
    records: readonly NormalizedDatasetRecord[],
    totalShards: number
  ): PipelineDatasetShard[] {
    const result: PipelineDatasetShard[] = [];
    const count = records.length;
    const perShard = Math.max(1, Math.ceil(count / totalShards));

    for (let i = 0; i < totalShards; i++) {
      const start = i * perShard;
      const end = Math.min(count, start + perShard);
      const shardRecs = records.slice(start, end);

      const shardHash = deterministicHash(
        `SHARD:${datasetVersionId}:${split}:${i}:${shardRecs.map((r) => r.casCid).join(',')}`
      );
      const casRootCid = `bafk_pipe_shard_${shardHash.slice(2, 10)}`;
      const merkleRoot = deterministicHash(`MERKLE_SHARD:${casRootCid}:${Date.now()}`);

      let byteSize = 0;
      for (const r of shardRecs) {
        byteSize += r.byteSize;
      }

      const shard: PipelineDatasetShard = Object.freeze({
        shardId: `SHARD_${datasetVersionId}_${split}_${i}`,
        datasetVersionId,
        split,
        shardIndex: i,
        totalShards,
        sampleCount: shardRecs.length,
        casRootCid,
        merkleRoot: `0x${merkleRoot}`,
        byteSize,
      });

      this.shards.set(shard.shardId, shard);
      result.push(shard);
    }

    return result;
  }

  public getShard(shardId: string): PipelineDatasetShard | undefined {
    return this.shards.get(shardId);
  }

  public reset(): void {
    this.shards.clear();
  }
}
