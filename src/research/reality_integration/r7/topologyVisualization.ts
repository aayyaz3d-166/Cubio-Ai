/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R7: Topology Visualization Engine
 *
 * Visualizes graph topology overlay distinguishing direct vs multi-hop paths.
 */

import { WorkspaceTopologyBinding } from '../r6/types';
import { R7VisualTopologyEdge } from './types';
import {
  generateDeterministicVisualTopologyEdgeId,
  deterministicHash,
} from './determinism';

export class TopologyVisualizationEngine {
  public static createTopologyEdge(
    sourceNodeId: string,
    targetNodeId: string,
    isDirect = true,
    hopCount = 1
  ): R7VisualTopologyEdge {
    const visualEdgeId = generateDeterministicVisualTopologyEdgeId(sourceNodeId, targetNodeId);
    const raw = JSON.stringify([visualEdgeId, sourceNodeId, targetNodeId, isDirect, hopCount]);
    const visualChecksum = `CS_VEDGE_${deterministicHash(raw)}`;

    return Object.freeze({
      visualEdgeId,
      sourceNodeId,
      targetNodeId,
      isDirect,
      hopCount,
      visualChecksum,
    });
  }

  public static createTopologyEdgesFromPairs(
    pairs: readonly { source: string; target: string; isDirect?: boolean; hopCount?: number }[]
  ): readonly R7VisualTopologyEdge[] {
    return Object.freeze(
      pairs.map((p) =>
        TopologyVisualizationEngine.createTopologyEdge(
          p.source,
          p.target,
          p.isDirect ?? true,
          p.hopCount ?? 1
        )
      )
    );
  }
}
