/**
 * CubiO — Step 89 Load Balancer
 */

import { InferenceNodeRegistry } from './inferenceNodeRegistry';
import { InferenceWorkerNode } from '../types';

export class LoadBalancer {
  private readonly registry: InferenceNodeRegistry;
  private rrIndex = 0;

  constructor(registry?: InferenceNodeRegistry) {
    this.registry = registry || new InferenceNodeRegistry();
  }

  public selectNode(strategy: 'ROUND_ROBIN' | 'LEAST_CONNECTIONS' = 'LEAST_CONNECTIONS'): InferenceWorkerNode {
    const online = this.registry.getOnlineNodes();
    if (online.length === 0) {
      throw new Error('No online inference worker nodes available in cluster');
    }

    if (strategy === 'ROUND_ROBIN') {
      const node = online[this.rrIndex % online.length];
      this.rrIndex++;
      return node;
    }

    // Least connections selection
    let bestNode = online[0];
    for (const n of online) {
      if (n.activeRequests < bestNode.activeRequests) {
        bestNode = n;
      }
    }
    return bestNode;
  }

  public getRegistry(): InferenceNodeRegistry {
    return this.registry;
  }
}
