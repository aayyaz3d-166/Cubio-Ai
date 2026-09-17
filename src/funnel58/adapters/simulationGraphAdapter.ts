/**
 * 3D Memory Studio — Funnel 58
 * Simulation Graph Synchronizer Adapter
 *
 * Synchronizes F52 simulation world edges into F58 GraphRegistry & GraphModel.
 */

import { SimulationWorldState } from '../../funnel52/types';
import { GraphRegistry } from '../graph/graphRegistry';
import { GraphModel } from '../graph/graphModel';
import { filterAndCreateGraphNodes } from './securityGraphAdapter';
import { resolveRelationship } from '../graph/relationshipResolver';
import { prioritizeAndBoundEdges } from '../graph/graphPrioritizer';

export function synchronizeSimulationToGraph(
  world: SimulationWorldState,
  model: GraphModel,
  registry: GraphRegistry
): void {
  model.clear();
  registry.clear();

  // 1. Create nodes from allSourceStates (or activeNodes fallback)
  const sourceList = world.allSourceStates && world.allSourceStates.length > 0
    ? world.allSourceStates
    : (world.activeNodes || []);

  const { nodes } = filterAndCreateGraphNodes(sourceList);
  for (const node of nodes) {
    model.addNode(node);
  }

  // 2. Map edges from activeEdges
  if (world.activeEdges && world.activeEdges.length > 0) {
    for (const edge of world.activeEdges) {
      const srcNode = model.getNode(edge.sourceNodeId);
      const tgtNode = model.getNode(edge.targetNodeId);

      if (srcNode && tgtNode) {
        const rel = resolveRelationship(
          srcNode as any,
          tgtNode as any,
          (edge.relationshipType as any) || 'SEMANTIC',
          edge.opacity,
          'UNDIRECTED'
        );

        if (rel) {
          rel.sourcePos = [...srcNode.position];
          rel.targetPos = [...tgtNode.position];
          registry.registerRelationship(rel);
        }
      }
    }
  }

  // Construct deterministic semantic, domain, sequence, coordinate, and category edges
  const allNodes = model.getAllNodes();
  const maxNodeScan = Math.min(allNodes.length, 50);
  for (let i = 0; i < maxNodeScan; i++) {
    const maxTarget = Math.min(allNodes.length, i + 6);
    for (let j = i + 1; j < maxTarget; j++) {
      const a = allNodes[i];
      const b = allNodes[j];

      let relType: import('../types').GraphRelationshipType = 'SEMANTIC';
      let strength = 0.5;

      if (a.category === b.category) {
        relType = 'CATEGORY';
        strength = 0.85;
      } else if (j === i + 1) {
        relType = 'SEMANTIC';
        strength = 0.75;
      } else if ((i + j) % 3 === 0) {
        relType = 'DOMAIN';
        strength = 0.65;
      } else if ((i + j) % 4 === 0) {
        relType = 'SEQUENCE';
        strength = 0.55;
      } else if ((i + j) % 5 === 0) {
        relType = 'COORDINATE';
        strength = 0.45;
      } else {
        relType = 'SOURCE';
        strength = 0.5;
      }

      const rel = resolveRelationship(
        a,
        b,
        relType,
        strength,
        (i + j) % 2 === 0 ? 'DIRECTED' : 'UNDIRECTED'
      );
      if (rel) {
        rel.sourcePos = [...a.position];
        rel.targetPos = [...b.position];
        registry.registerRelationship(rel);
      }
    }
  }

  // 3. Recalculate node degrees
  model.recalculateDegrees(registry);

  // 4. Prioritize & enforce budget
  prioritizeAndBoundEdges(registry.getAll(), null);
}
