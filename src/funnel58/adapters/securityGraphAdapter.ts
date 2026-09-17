/**
 * 3D Memory Studio — Funnel 58
 * Security Graph Adapter & F47 Gate
 *
 * Ensures only GREEN states form nodes and relationships in the graph.
 */

import { GraphRelationship, GraphNode } from '../types';
import { DimensionalInformationState } from '../../funnel49/types';
import { SimulatedStateNode } from '../../funnel52/types';

export interface GraphSecurityReport {
  readonly greenNodesCreated: number;
  readonly redNodesBlocked: number;
  readonly greenRelationshipsCreated: number;
  readonly redRelationshipsBlocked: number;
}

export function filterAndCreateGraphNodes(
  states: readonly (DimensionalInformationState | SimulatedStateNode)[]
): { nodes: GraphNode[]; blockedCount: number } {
  const nodes: GraphNode[] = [];
  let blockedCount = 0;

  for (const s of states) {
    if (s.classification === 'GREEN' && s.processingAllowed) {
      const pos: [number, number, number] =
        'x' in s ? [s.x, s.y, s.z] : [0, 0, 0];

      nodes.push({
        stateId: s.stateId,
        entityName: s.entityName,
        category: s.category,
        classification: 'GREEN',
        position: pos,
        visible: true,
        selected: false,
        highlighted: false,
        degree: 0,
        inDegree: 0,
        outDegree: 0,
      });
    } else {
      blockedCount++;
    }
  }

  return { nodes, blockedCount };
}
