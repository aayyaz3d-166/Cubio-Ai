/**
 * 3D Memory Studio — Funnel 50
 * Simulation Data Normalization & Spatial Node Generator
 *
 * Converts verified InformationUniverseIndex states into bounded 3D visual simulation nodes
 * and knowledge graph edges without mutating underlying datasets.
 */

import {
  SimulationNode,
  SimulationEdge,
  SimulationClusterType,
  Spatial3DVector,
} from './types';
import { DimensionalInformationState, InformationUniverseIndex } from '../funnel49/types';
import { getStandardInformationUniverseFixture, getScaleBenchmarkUniverseIndex } from '../funnel49/model';

const CLUSTER_OFFSETS: Record<SimulationClusterType, Spatial3DVector> = {
  STANDARDS: { x: -200, y: 150, z: 0 },
  PROTOCOLS: { x: -200, y: -150, z: 50 },
  ONTOLOGY: { x: 0, y: 200, z: -50 },
  AI_LLM: { x: 250, y: 100, z: 50 },
  TAXONOMY: { x: 100, y: -200, z: 0 },
  INFORMATION_THEORY: { x: -100, y: 0, z: 150 },
  SECURITY: { x: 250, y: -200, z: -100 },
};

/**
 * Determines simulation cluster from state category and record ID
 */
export function determineSimulationCluster(state: DimensionalInformationState): SimulationClusterType {
  const cat = state.category.toUpperCase();
  const id = state.recordId.toUpperCase();

  if (cat.includes('AI_MODEL') || cat.includes('LLM') || id.startsWith('LLM_')) {
    return 'AI_LLM';
  }
  if (cat.includes('PII') || cat.includes('CREDENTIAL') || cat.includes('MALWARE') || cat.includes('DARKWEB') || state.sourceDomain.includes('darkweb')) {
    return 'SECURITY';
  }
  if (cat.includes('PROTOCOL') || id.includes('HTTP2') || id.includes('RFC')) {
    return 'PROTOCOLS';
  }
  if (cat.includes('ONTOLOGY') || id.includes('SCHEMA') || id.includes('RDF')) {
    return 'ONTOLOGY';
  }
  if (cat.includes('STANDARD') || id.includes('W3C') || id.includes('ISO')) {
    return 'STANDARDS';
  }
  return 'TAXONOMY';
}

/**
 * Calculates deterministic 3D spatial position for a node based on cluster and coordinates
 */
export function calculateNode3DPosition(
  state: DimensionalInformationState,
  cluster: SimulationClusterType,
  indexInCluster: number,
  dimension = 3
): Spatial3DVector {
  const offset = CLUSTER_OFFSETS[cluster] || { x: 0, y: 0, z: 0 };

  // For permitted GREEN states, incorporate Z3 coordinate values if present
  if (state.classification === 'GREEN' && state.coordinatesByDimension[3]) {
    const coords = state.coordinatesByDimension[3].coordinateValues;
    const cx = ((coords[0] ?? 1) - 1) * 40;
    const cy = ((coords[1] ?? 1) - 1) * 40;
    const cz = ((coords[2] ?? 1) - 1) * 40;
    return Object.freeze({
      x: offset.x + cx + (indexInCluster % 3) * 35,
      y: offset.y + cy + Math.floor(indexInCluster / 3) * 35,
      z: offset.z + cz,
    });
  }

  // For RED states, arrange in an isolated restricted ring
  const angle = (indexInCluster * 2 * Math.PI) / 8;
  const radius = 60;
  return Object.freeze({
    x: offset.x + Math.cos(angle) * radius,
    y: offset.y + Math.sin(angle) * radius,
    z: offset.z,
  });
}

/**
 * Adapts an InformationUniverseIndex into SimulationNodes
 */
export function buildSimulationNodes(
  index: InformationUniverseIndex,
  dimension = 3,
  selectedNodeId?: string
): readonly SimulationNode[] {
  const clusterCounts: Partial<Record<SimulationClusterType, number>> = {};

  return Object.freeze(
    index.states.map((state) => {
      const cluster = determineSimulationCluster(state);
      const idxInCluster = clusterCounts[cluster] || 0;
      clusterCounts[cluster] = idxInCluster + 1;

      const position3D = calculateNode3DPosition(state, cluster, idxInCluster, dimension);
      const isGreen = state.classification === 'GREEN';
      const isLLM = cluster === 'AI_LLM';
      const isSelected = selectedNodeId === state.stateId || selectedNodeId === state.recordId;

      let colorHex = isGreen ? '#10b981' : '#f43f5e'; // Emerald green vs Crimson red
      if (isLLM && isGreen) colorHex = '#38bdf8'; // Sky blue for authorized LLMs
      if (isLLM && !isGreen) colorHex = '#e11d48'; // Dark crimson for unauthorized LLMs

      return Object.freeze({
        nodeId: `SIM_NODE:${state.recordId}`,
        stateId: state.stateId,
        recordId: state.recordId,
        entityName: state.entityName,
        cluster,
        classification: state.classification,
        classificationStatus: state.classificationStatus,
        processingAllowed: state.processingAllowed,
        position3D,
        colorHex,
        radius: isLLM ? 14 : 10,
        isSelected,
        isHighlighted: false,
        sequence369Snippet: state.sequence369 ? state.sequence369.substring(0, 12) : null,
        formattedCoordinateZ3: state.coordinatesByDimension[3]?.formattedCoordinate ?? null,
        formattedCoordinateZ8: state.coordinatesByDimension[8]?.formattedCoordinate ?? null,
        payloadChecksum: state.payloadChecksum,
        isLLMModel: isLLM,
        modelProvider: state.modelMetadata?.provider,
        rawState: state,
      });
    })
  );
}

/**
 * Builds Knowledge Graph edges connecting simulation nodes
 */
export function buildSimulationEdges(nodes: readonly SimulationNode[]): readonly SimulationEdge[] {
  const edges: SimulationEdge[] = [];
  const nodeMap = new Map(nodes.map((n) => [n.recordId, n]));

  // Connect related nodes inside clusters
  for (let i = 0; i < nodes.length; i++) {
    const current = nodes[i];

    // Find next node in same cluster
    for (let j = i + 1; j < nodes.length; j++) {
      const next = nodes[j];
      if (current.cluster === next.cluster) {
        edges.push(
          Object.freeze({
            edgeId: `EDGE:${current.recordId}->${next.recordId}`,
            sourceNodeId: current.nodeId,
            targetNodeId: next.nodeId,
            relationType: current.cluster === 'AI_LLM' ? 'MODEL_FAMILY_RELATION' : 'ONTOLOGICAL_REFERENCE',
            confidence: 0.95,
            isInferred: false,
            colorHex: current.classification === 'GREEN' ? '#06b6d4' : '#9f1239',
          })
        );
        break; // Keep to 1 edge per pair for bounded graph density
      }
    }
  }

  return Object.freeze(edges);
}
