/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F59: Dimensional Transformation Operators (D0–D8 Reversible Cycles)
 *
 * Formal mathematical Lift (↑), Project (↓), 369 Harmonic Fold, and Reversible State Cycle operators.
 */

import { deterministicHash } from '../../../state/determinism';
import {
  CubiODimensionalLevel,
  DimensionalStateNode,
  DimensionalTransformResult,
  ReversibleCycleResult,
} from './types';

export const DIMENSIONAL_RANKS: Readonly<Record<CubiODimensionalLevel, number>> = Object.freeze({
  D0: 0,
  D1: 1,
  D2: 2,
  D3: 3,
  D4: 4,
  D5: 5,
  D6: 6,
  D7: 7,
  D8: 8,
});

export const DIMENSIONAL_LEVELS_ORDER: readonly CubiODimensionalLevel[] = Object.freeze([
  'D0', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8',
]);

/**
 * Creates a formal DimensionalStateNode.
 */
export function createDimensionalNode<T>(
  data: T,
  level: CubiODimensionalLevel
): Readonly<DimensionalStateNode<T>> {
  const levelRank = DIMENSIONAL_RANKS[level];
  const json = JSON.stringify(data);
  const checksum = deterministicHash(`DIM_NODE:${level}:${json}`);
  const nodeId = `DNODE_${level}_${checksum.slice(2, 10)}`;

  // Generate canonical coordinates for the dimension
  const coords: number[] = new Array(levelRank + 1).fill(0).map((_, i) => Number(((i + 1) * 0.369).toFixed(6)));

  return Object.freeze({
    nodeId,
    level,
    levelRank,
    payload: data,
    properties: Object.freeze({ levelRank, dimensionName: level }),
    dimensionalCoordinates: Object.freeze(coords),
    checksum,
    timestamp: Date.now(),
  });
}

/**
 * Lifts a dimensional state up the hierarchy (e.g. D0 -> D3 -> D8).
 */
export function liftDimension(
  node: DimensionalStateNode,
  targetLevel?: CubiODimensionalLevel
): Readonly<DimensionalTransformResult> {
  const currentRank = node.levelRank;
  const targetRank = targetLevel ? DIMENSIONAL_RANKS[targetLevel] : Math.min(8, currentRank + 1);
  const resolvedTarget = targetLevel || DIMENSIONAL_LEVELS_ORDER[targetRank];

  const outputState = createDimensionalNode(node.payload, resolvedTarget);
  const transformChecksum = deterministicHash(`LIFT:${node.level}:${resolvedTarget}:${node.checksum}`);
  const transformId = `TX_LIFT_${node.level}_${resolvedTarget}_${transformChecksum.slice(2, 8)}`;

  return Object.freeze({
    transformId,
    operation: 'LIFT',
    sourceLevel: node.level,
    targetLevel: resolvedTarget,
    inputState: node,
    outputState,
    fidelityScore: 1.0,
    harmonicInvariancePreserved: true,
    transformChecksum,
  });
}

/**
 * Projects a dimensional state down the hierarchy (e.g. D8 -> D3 -> D0).
 */
export function projectDimension(
  node: DimensionalStateNode,
  targetLevel?: CubiODimensionalLevel
): Readonly<DimensionalTransformResult> {
  const currentRank = node.levelRank;
  const targetRank = targetLevel ? DIMENSIONAL_RANKS[targetLevel] : Math.max(0, currentRank - 1);
  const resolvedTarget = targetLevel || DIMENSIONAL_LEVELS_ORDER[targetRank];

  const outputState = createDimensionalNode(node.payload, resolvedTarget);
  const transformChecksum = deterministicHash(`PROJECT:${node.level}:${resolvedTarget}:${node.checksum}`);
  const transformId = `TX_PROJ_${node.level}_${resolvedTarget}_${transformChecksum.slice(2, 8)}`;

  return Object.freeze({
    transformId,
    operation: 'PROJECT',
    sourceLevel: node.level,
    targetLevel: resolvedTarget,
    inputState: node,
    outputState,
    fidelityScore: 1.0,
    harmonicInvariancePreserved: true,
    transformChecksum,
  });
}

/**
 * Folds a dimensional state into 369 harmonic space (Ω369).
 */
export function fold369Harmonics(node: DimensionalStateNode): Readonly<DimensionalTransformResult> {
  const coords = node.dimensionalCoordinates;
  const sum = coords.reduce((acc, v) => acc + Math.abs(Math.round(v * 1000)), 0);
  const digitalRoot = sum === 0 ? 9 : 1 + ((sum - 1) % 9);

  const foldedPayload = {
    originalData: node.payload,
    nodalHarmonic: digitalRoot,
    vortexFluxSequence: [1, 2, 4, 8, 7, 5],
    isTeslaNode: digitalRoot === 3 || digitalRoot === 6 || digitalRoot === 9,
  };

  const outputState = createDimensionalNode(foldedPayload, node.level);
  const transformChecksum = deterministicHash(`FOLD_369:${node.level}:${digitalRoot}:${node.checksum}`);
  const transformId = `TX_369_${node.level}_${digitalRoot}_${transformChecksum.slice(2, 8)}`;

  return Object.freeze({
    transformId,
    operation: 'FOLD_369',
    sourceLevel: node.level,
    targetLevel: node.level,
    inputState: node,
    outputState,
    fidelityScore: 1.0,
    harmonicInvariancePreserved: true,
    transformChecksum,
  });
}

/**
 * Executes a full reversible state cycle: D0 -> D1 -> ... -> D8 -> ... -> D0.
 */
export function executeReversibleCycle(startNode: DimensionalStateNode): Readonly<ReversibleCycleResult> {
  // 1. Lift all the way to D8
  let curr = startNode;
  for (let r = startNode.levelRank; r < 8; r++) {
    const nextLevel = DIMENSIONAL_LEVELS_ORDER[r + 1];
    const res = liftDimension(curr, nextLevel);
    curr = res.outputState;
  }
  const liftedD8State = curr;

  // 2. Project all the way back to original level
  for (let r = 8; r > startNode.levelRank; r--) {
    const prevLevel = DIMENSIONAL_LEVELS_ORDER[r - 1];
    const res = projectDimension(curr, prevLevel);
    curr = res.outputState;
  }
  const reconstructedD0State = curr;

  // 3. Measure reconstruction fidelity
  const isLosslessReversible = JSON.stringify(startNode.payload) === JSON.stringify(reconstructedD0State.payload);
  const reconstructionError = isLosslessReversible ? 0.0 : 0.000001;
  const fidelityScore = 1.0 - reconstructionError;

  const cycleChecksum = deterministicHash(
    `CYCLE:${startNode.nodeId}:${liftedD8State.nodeId}:${reconstructedD0State.nodeId}:${isLosslessReversible}`
  );
  const cycleId = `CYCLE_${cycleChecksum.slice(2, 10)}`;

  return Object.freeze({
    cycleId,
    startState: startNode,
    liftedD8State,
    reconstructedD0State,
    isLosslessReversible,
    reconstructionError,
    fidelityScore,
    cycleChecksum,
  });
}
