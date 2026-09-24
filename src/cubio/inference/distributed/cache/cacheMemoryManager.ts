/**
 * CubiO — Step 89 Cache Memory Manager
 */

import { PagedKvCache } from './pagedKvCache';

export class CacheMemoryManager {
  public static checkBudget(cache: PagedKvCache): {
    withinBudget: boolean;
    allocatedMB: number;
    maxBudgetMB: number;
  } {
    const tele = cache.getTelemetry();
    const maxBudgetMB = 1024;
    return {
      withinBudget: tele.memoryAllocatedMB <= maxBudgetMB,
      allocatedMB: tele.memoryAllocatedMB,
      maxBudgetMB,
    };
  }
}
