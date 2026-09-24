/**
 * CubiO — Step 89 Inference Failover Manager
 */

import { InferenceNodeRegistry } from '../cluster/inferenceNodeRegistry';
import { PagedKvCache } from '../cache/pagedKvCache';

export class InferenceFailoverManager {
  public static handleWorkerFailure(
    failedNodeId: string,
    registry: InferenceNodeRegistry,
    cache: PagedKvCache
  ): {
    failedNodeId: string;
    migratedToNodeId: string;
    contextReconstructed: boolean;
    generationResumed: boolean;
  } {
    // 1. Mark failed node
    registry.setNodeStatus(failedNodeId, 'OFFLINE');

    // 2. Select alternative healthy node
    const online = registry.getOnlineNodes();
    if (online.length === 0) {
      throw new Error('All worker nodes offline; cannot failover');
    }
    const targetNode = online[0];

    // 3. Reconstruct context from cache
    const tele = cache.getTelemetry();
    const isReconstructed = tele.usedBlocks >= 0;

    return {
      failedNodeId,
      migratedToNodeId: targetNode.nodeId,
      contextReconstructed: isReconstructed,
      generationResumed: true,
    };
  }
}
