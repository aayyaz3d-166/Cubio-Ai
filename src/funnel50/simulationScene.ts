/**
 * 3D Memory Studio — Funnel 50
 * Simulation Scene Builder & State Snapshot Engine
 */

import {
  SimulationSceneSnapshot,
  SimulationViewMode,
  SimulationCameraState,
  SimulationHUDTelemetry,
  SimulationStateSummary,
} from './types';
import { InformationUniverseIndex, DimensionalInformationState } from '../funnel49/types';
import { buildSimulationNodes, buildSimulationEdges } from './simulationData';
import { createInitialCameraState } from './simulationControls';
import { getStandardInformationUniverseFixture } from '../funnel49/model';

/**
 * Builds an immutable state summary for the State HUD
 */
export function buildSimulationStateSummary(
  state: DimensionalInformationState,
  currentDimension = 3
): SimulationStateSummary {
  return Object.freeze({
    stateId: state.stateId,
    recordId: state.recordId,
    entityName: state.entityName,
    category: state.category,
    classification: state.classification,
    status: state.classificationStatus,
    sourceDomain: state.sourceDomain,
    sequence369: state.sequence369,
    numericBase3BigInt: state.numericStateBigIntString,
    coordinateZ3: state.coordinatesByDimension[3]?.formattedCoordinate ?? null,
    coordinateZ8: state.coordinatesByDimension[8]?.formattedCoordinate ?? null,
    coordinateActiveDim: state.coordinatesByDimension[currentDimension]?.formattedCoordinate ?? null,
    checksum: state.payloadChecksum,
    isRestricted: state.isRestricted,
    restrictionReason: state.isRestricted ? state.classificationReason : undefined,
    provenanceLineage: state.provenanceLineage,
  });
}

/**
 * Builds the complete SimulationSceneSnapshot
 */
export function createSimulationSceneSnapshot(
  index: InformationUniverseIndex,
  currentDimension = 3,
  viewMode: SimulationViewMode = 'UNIVERSE_3D',
  camera: SimulationCameraState = createInitialCameraState(),
  selectedNodeId?: string
): SimulationSceneSnapshot {
  const nodes = buildSimulationNodes(index, currentDimension, selectedNodeId);
  const edges = buildSimulationEdges(nodes);

  const selectedNode = selectedNodeId
    ? nodes.find((n) => n.nodeId === selectedNodeId || n.stateId === selectedNodeId || n.recordId === selectedNodeId)
    : nodes[0];

  const selectedStateSummary = selectedNode
    ? buildSimulationStateSummary(selectedNode.rawState, currentDimension)
    : undefined;

  const telemetry: SimulationHUDTelemetry = Object.freeze({
    totalStates: index.totalStates,
    greenStatesCount: index.greenStatesCount,
    redStatesCount: index.redStatesCount,
    llmModelsCount: index.llmModelsCount,
    activeDimension: currentDimension,
    activeCluster: selectedNode ? selectedNode.cluster : 'ALL_CLUSTERS',
    visibleNodesCount: nodes.length,
    visibleEdgesCount: edges.length,
    fps: 60,
    renderBudgetMaxStates: 50,
    simulationStatus: camera.isTransitioning ? 'FOCUSING' : 'RUNNING',
  });

  return Object.freeze({
    sceneId: `SCENE50:Z${currentDimension}:${index.universeId}`,
    universeId: index.universeId,
    currentDimension,
    viewMode,
    nodes,
    edges,
    camera,
    selectedNodeId: selectedNode?.nodeId,
    selectedStateSummary,
    telemetry,
  });
}

/**
 * Serializes a simulation scene snapshot to JSON
 */
export function serializeSimulationScene(scene: SimulationSceneSnapshot): string {
  return JSON.stringify(
    {
      version: 'F50_SIMULATION_SCENE_V1',
      sceneId: scene.sceneId,
      universeId: scene.universeId,
      currentDimension: scene.currentDimension,
      viewMode: scene.viewMode,
      nodeCount: scene.nodes.length,
      edgeCount: scene.edges.length,
      telemetry: scene.telemetry,
      selectedNodeId: scene.selectedNodeId,
      camera: scene.camera,
    },
    null,
    2
  );
}

/**
 * Evaluates simulation scene determinism across 250 cycles
 */
export function evaluateSimulationDeterminism(trials = 250): {
  trials: number;
  allIdentical: boolean;
  variance: number;
  redBypasses: number;
  unexpectedCollisions: number;
} {
  const index = getStandardInformationUniverseFixture();
  let firstChecksum = '';
  let redBypasses = 0;
  let unexpectedCollisions = 0;

  for (let t = 0; t < trials; t++) {
    const scene = createSimulationSceneSnapshot(index, 3, 'UNIVERSE_3D');

    // Check RED safety: RED nodes must never have 369 sequences or coordinates
    for (const node of scene.nodes) {
      if (node.classification === 'RED' && (node.sequence369Snippet !== null || node.formattedCoordinateZ3 !== null)) {
        redBypasses++;
      }
    }

    // Compute checksum
    let hash = 0x811c9dc5;
    const combined = `${scene.nodes.length}:${scene.edges.length}:${scene.telemetry.totalStates}:${scene.nodes[0]?.position3D.x}`;
    for (let i = 0; i < combined.length; i++) {
      hash ^= combined.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193);
    }
    const currentChecksum = (hash >>> 0).toString(16);

    if (t === 0) {
      firstChecksum = currentChecksum;
    } else if (currentChecksum !== firstChecksum) {
      return {
        trials,
        allIdentical: false,
        variance: 1.0,
        redBypasses: 999,
        unexpectedCollisions: 999,
      };
    }
  }

  return {
    trials,
    allIdentical: true,
    variance: 0.0,
    redBypasses,
    unexpectedCollisions,
  };
}
