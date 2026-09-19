/**
 * CubiO — Step 86 Node Failure Simulator
 */

import { NodeRegistry } from '../cluster/nodeRegistry';

export class NodeFailureSimulator {
  public static simulateSingleNodeFailure(registry: NodeRegistry, failRank = 2): readonly number[] {
    registry.updateNodeStatus(failRank, 'OFFLINE');
    return [failRank];
  }

  public static simulateMultiNodeFailure(registry: NodeRegistry, failRanks = [1, 4]): readonly number[] {
    for (const r of failRanks) {
      registry.updateNodeStatus(r, 'OFFLINE');
    }
    return failRanks;
  }
}
