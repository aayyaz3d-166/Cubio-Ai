/**
 * CubiO — Step 86 Node Failure Detector
 */

import { NodeRegistry } from './nodeRegistry';
import { HeartbeatMonitor } from './heartbeatMonitor';

export class NodeFailureDetector {
  private readonly registry: NodeRegistry;
  private readonly monitor: HeartbeatMonitor;

  constructor(registry: NodeRegistry, monitor: HeartbeatMonitor) {
    this.registry = registry;
    this.monitor = monitor;
  }

  public detectFailedNodes(): readonly number[] {
    const failed: number[] = [];
    for (const node of this.registry.getAllNodes()) {
      const health = this.monitor.checkNodeHealth(node);
      if (!health.isHealthy) {
        failed.push(node.nodeRank);
      }
    }
    return Object.freeze(failed);
  }
}
