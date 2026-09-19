/**
 * CubiO — Universal Spatial Operating Environment
 * Step 80: Shard Scheduler
 *
 * Schedules and sequences multi-stream shards with deterministic ordering.
 *
 * Classification: SOFTWARE_VALIDATED
 */

import { ModalityStreamType } from '../types';

export class ShardScheduler {
  private static modalities: ModalityStreamType[] = [
    'TEXT',
    'VISION',
    'AUDIO',
    '3D_SPATIAL',
    'MULTIMODAL_INSTRUCTION',
  ];

  public static getNextModality(step: number): ModalityStreamType {
    return this.modalities[step % this.modalities.length];
  }
}
