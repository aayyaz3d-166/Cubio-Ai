/**
 * CubiO — Step 89 Inference Node Registry
 */

import { InferenceWorkerNode } from '../types';

export class InferenceNodeRegistry {
  private readonly nodes: Map<string, InferenceWorkerNode> = new Map();

  constructor(initialWorkerCount = 4) {
    for (let r = 0; r < initialWorkerCount; r++) {
      const nodeId = `inf_worker_node_${r}`;
      this.nodes.set(nodeId, {
        nodeId,
        rank: r,
        host: `127.0.0.1`,
        port: 9000 + r,
        totalMemoryMB: 16384,
        usedMemoryMB: 1024 + r * 128,
        activeRequests: 0,
        status: 'ONLINE',
        lastHeartbeat: Date.now(),
      });
    }
  }

  public registerNode(node: InferenceWorkerNode): void {
    this.nodes.set(node.nodeId, node);
  }

  public updateHeartbeat(nodeId: string): void {
    const node = this.nodes.get(nodeId);
    if (node) {
      this.nodes.set(nodeId, { ...node, lastHeartbeat: Date.now(), status: 'ONLINE' });
    }
  }

  public setNodeStatus(nodeId: string, status: InferenceWorkerNode['status']): void {
    const node = this.nodes.get(nodeId);
    if (node) {
      this.nodes.set(nodeId, { ...node, status });
    }
  }

  public getOnlineNodes(): readonly InferenceWorkerNode[] {
    return Object.freeze(Array.from(this.nodes.values()).filter((n) => n.status === 'ONLINE'));
  }

  public getAllNodes(): readonly InferenceWorkerNode[] {
    return Object.freeze(Array.from(this.nodes.values()));
  }
}
