/**
 * 3D Memory Studio — Funnel 52
 * Simulation World State Generator & Stepper
 */

import {
  SimulationWorldState,
  SimulatedStateNode,
  SimulationDimension,
  SimulationSpeed,
} from '../types';
import { getStandardInformationUniverseFixture } from '../../funnel49/model';
import { DimensionalInformationState } from '../../funnel49/types';
import { resolveClusterType, buildClusters } from '../visual/clusterLayout';
import { calculateStatePosition, deriveLifecycleStage } from '../visual/statePositioning';
import { buildSimulatedEdges } from '../visual/graphLayout';
import { generateSimulatedParticles, stepSimulatedParticles } from '../visual/particleField';
import { analyzeDimensionProjection } from '../visual/dimensionProjection';
import { formatSimulationTime } from './simulationClock';

/**
 * Creates the initial SimulationWorldState
 */
export function createInitialSimulationWorld(
  sourceStates?: readonly DimensionalInformationState[],
  initialDimension: SimulationDimension = 3,
  seed = 42
): SimulationWorldState {
  const allStates = sourceStates || getStandardInformationUniverseFixture().states;
  // Filter GREEN permitted states for active simulation
  const greenStates = allStates.filter((s) => s.classification === 'GREEN' && s.processingAllowed);
  const redStates = allStates.filter((s) => s.classification === 'RED');

  const clusters = buildClusters(greenStates);
  const particles = generateSimulatedParticles(48);

  const initialProjection = analyzeDimensionProjection(initialDimension, initialDimension);

  const initialWorld: SimulationWorldState = Object.freeze({
    simulationTimeMs: 0,
    frameCount: 0,
    isRunning: true,
    isPaused: false,
    speed: 1 as SimulationSpeed,
    activeDimension: initialDimension,
    allSourceStates: allStates,
    activeNodes: Object.freeze([]),
    activeEdges: Object.freeze([]),
    clusters,
    particles,
    projection: initialProjection,
    telemetry: Object.freeze({
      memoryStatesCount: allStates.length,
      activeNodesCount: 0,
      relationshipsCount: 0,
      dimension: initialDimension,
      sequence369Count: 0,
      greenCount: greenStates.length,
      redCount: redStates.length,
      fps: 60,
      simulationTimeMs: 0,
      simulationTimeFormatted: '00:00.0',
      frameCount: 0,
    }),
    camera: Object.freeze({
      rotX: 15,
      rotY: 25,
      zoom: 1.0,
      panX: 0,
      panY: 0,
    }),
    selectedStateId: null,
    highlightedStateIds: Object.freeze([]),
    searchQuery: '',
    activeFilter: 'ALL',
    seed,
  });

  return stepSimulationWorld(initialWorld, 1);
}

/**
 * Steps the SimulationWorldState forward by deltaMs
 */
export function stepSimulationWorld(
  world: SimulationWorldState,
  deltaMs: number
): SimulationWorldState {
  if (!world.isRunning || world.isPaused) {
    return world;
  }

  const speedMult = world.speed;
  const scaledDelta = deltaMs * speedMult;
  const nextSimTimeMs = world.simulationTimeMs + scaledDelta;
  const nextFrameCount = world.frameCount + 1;

  // Filter allowed states based on active filter
  let candidateStates = world.allSourceStates;
  if (world.activeFilter === 'GREEN') {
    candidateStates = candidateStates.filter((s) => s.classification === 'GREEN');
  } else if (world.activeFilter === 'RED') {
    candidateStates = candidateStates.filter((s) => s.classification === 'RED');
  } else if (world.activeFilter === 'AI_MODEL') {
    candidateStates = candidateStates.filter((s) => s.category.toUpperCase().includes('AI') || s.category.toUpperCase().includes('LLM'));
  }

  // Authoritative F47 security check: strictly GREEN states can receive coordinates & 369 in active simulation
  const permittedGreenStates = candidateStates.filter((s) => s.classification === 'GREEN' && s.processingAllowed);

  // Progressive state emergence: 1 state introduced every 120ms of simulation time (bounded to max 50 states)
  const maxSimulatedNodes = Math.min(50, permittedGreenStates.length);
  const targetNodeCount = Math.min(
    maxSimulatedNodes,
    Math.max(1, Math.floor(nextSimTimeMs / 120) + 1)
  );

  const activeGreenSubset = permittedGreenStates.slice(0, targetNodeCount);

  // Generate simulated state nodes
  const nodes: SimulatedStateNode[] = activeGreenSubset.map((state, idx) => {
    const clusterType = resolveClusterType(state.category, state.sourceDomain, state.classification);
    const pos = calculateStatePosition(
      state,
      world.activeDimension,
      idx,
      targetNodeCount,
      clusterType,
      world.seed
    );

    // Compute age of this node in the simulation
    const stateIntroTimeMs = idx * 120;
    const nodeAgeMs = Math.max(0, nextSimTimeMs - stateIntroTimeMs);
    const lifecycleStage = deriveLifecycleStage(nodeAgeMs);

    const coordEntry = state.coordinatesByDimension[world.activeDimension] || state.coordinatesByDimension[3];
    const isSelected = world.selectedStateId === state.stateId;
    const isHighlighted = world.highlightedStateIds.includes(state.stateId);

    return Object.freeze({
      stateId: state.stateId,
      recordId: state.recordId,
      entityName: state.entityName,
      category: state.category,
      sourceDomain: state.sourceDomain,
      classification: state.classification,
      processingAllowed: state.processingAllowed,
      lifecycleStage,
      sequence369: state.sequence369,
      numericStateBigIntString: state.numericStateBigIntString,
      checksum: state.payloadChecksum,
      formattedCoordinate: coordEntry?.formattedCoordinate || 'X3.Y6.Z9',
      coordinateValues: coordEntry?.coordinateValues || Object.freeze([3, 6, 9]),
      x: pos.x,
      y: pos.y,
      z: pos.z,
      radius: isSelected ? pos.radius + 3 : pos.radius,
      colorHex: isHighlighted ? '#f59e0b' : pos.colorHex,
      clusterId: clusterType,
      isSelected,
      isHighlighted,
      sourceState: state,
    });
  });

  // Generate bounded relational edges (max 100)
  const edges = buildSimulatedEdges(nodes, 100);

  // Step ambient particles
  const steppedParticles = stepSimulatedParticles(world.particles, deltaMs, speedMult);

  // Telemetry computation
  const sequence369Count = nodes.filter((n) => n.sequence369 !== null).length;
  const greenCount = nodes.filter((n) => n.classification === 'GREEN').length;
  const redCount = world.allSourceStates.filter((s) => s.classification === 'RED').length;

  const telemetry = Object.freeze({
    memoryStatesCount: world.allSourceStates.length,
    activeNodesCount: nodes.length,
    relationshipsCount: edges.length,
    dimension: world.activeDimension,
    sequence369Count,
    greenCount,
    redCount,
    fps: 60,
    simulationTimeMs: nextSimTimeMs,
    simulationTimeFormatted: formatSimulationTime(nextSimTimeMs),
    frameCount: nextFrameCount,
  });

  return Object.freeze({
    ...world,
    simulationTimeMs: nextSimTimeMs,
    frameCount: nextFrameCount,
    activeNodes: Object.freeze(nodes),
    activeEdges: edges,
    particles: steppedParticles,
    telemetry,
  });
}
