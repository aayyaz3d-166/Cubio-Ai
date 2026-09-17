/**
 * CUBiO AI — Phase 25: 343-Cell HCP Lattice & Address 369 Engine
 * Protocol: CUBIO-P25-INTELLIGENCE-CORE-GENESIS-001
 */

import {
  Coordinate3D,
  HCPCoordinate,
  LatticeCell343,
  LatticeCellState,
  Address369Triad,
  TrajectoryPathVector,
} from '../types';
import {
  coordinateToCellId,
  cellIdToCoordinate,
  cellIdToAddress369,
  coordinateToAddress,
  TOTAL_SPATIAL_CELLS,
  TOTAL_ADDRESS_SPACE,
} from '../../../core/address369';

export const TOTAL_LATTICE_CELLS = TOTAL_SPATIAL_CELLS; // 7 x 7 x 7 = 343
export const TOTAL_369_ADDRESSES = TOTAL_ADDRESS_SPACE; // 369

/**
 * Calculates digital root of an integer (1..9)
 */
export function calculateDigitalRoot(n: number): number {
  if (n <= 0) return 9;
  return 1 + ((n - 1) % 9);
}

/**
 * Maps a digital root to Triad classification
 */
export function classifyTriad(root: number): Address369Triad {
  if (root === 9) return 'TRIAD_9';
  if (root === 6) return 'TRIAD_6';
  if (root === 3) return 'TRIAD_3';
  return 'MODULAR_BASE';
}

/**
 * Converts 3D lattice coordinate (x, y, z in 0..6) to HCP coordinates (u, v, w)
 */
export function convertCubicToHCP(x: number, y: number, z: number): HCPCoordinate {
  const u = x + 0.5 * (y % 2);
  const v = y * (Math.sqrt(3) / 2);
  const w = z * Math.sqrt(2 / 3);
  return [
    parseFloat(u.toFixed(4)),
    parseFloat(v.toFixed(4)),
    parseFloat(w.toFixed(4)),
  ];
}

/**
 * Canonical deterministic mapping from 3D coordinates (x, y, z) to Address 369 [26..368]
 * Delegates to canonical coordinateToAddress (26 + cellId).
 */
export function mapCoordsToAddress369(x: number, y: number, z: number): number {
  return coordinateToAddress(x, y, z);
}

/**
 * Generates the complete 343-cell lattice state
 */
export function generate343CellLattice(): readonly LatticeCell343[] {
  const cells: LatticeCell343[] = new Array(TOTAL_LATTICE_CELLS);

  for (let cellId = 0; cellId < TOTAL_LATTICE_CELLS; cellId++) {
    const { x, y, z } = cellIdToCoordinate(cellId);
    const linearIndex = cellId;
    const address369 = cellIdToAddress369(linearIndex);
    const root = calculateDigitalRoot(address369);
    const triadType = classifyTriad(root);

    // Deterministic initial states and densities based on geometry
    let state: LatticeCellState = 'IDLE';
    let density = 0.2;
    let label = 'Cell (' + x + ',' + y + ',' + z + ')';

    if (root === 9) {
      state = 'ACTIVE';
      density = 0.95;
      label = 'Vortex Anchor 9 [Addr ' + address369 + ']';
    } else if (root === 3 || root === 6) {
      state = 'HOT';
      density = 0.75;
      label = 'Harmonic Anchor ' + root + ' [Addr ' + address369 + ']';
    } else if (x === 3 && y === 3 && z === 3) {
      state = 'ACTIVE';
      density = 1.0;
      label = 'Lattice Origin Center [Addr ' + address369 + ']';
    } else if ((x + y + z) % 5 === 0) {
      state = 'ACTIVE';
      density = 0.55;
    }

    cells[cellId] = {
      id: 'CELL_' + x + '_' + y + '_' + z,
      x,
      y,
      z,
      linearIndex,
      address369,
      harmonicRoot: root,
      triadType,
      density,
      state,
      label,
      activeTrajectory: false,
      knowledgeClusterId: 'CLUSTER_' + root,
    };
  }

  return Object.freeze(cells);
}

/**
 * Interpolates trajectory waypoints between two lattice cells in 3D
 */
export function generateTrajectoryPath(
  source: LatticeCell343,
  target: LatticeCell343,
  stage: string = 'REASONING_HOP'
): TrajectoryPathVector {
  const numWaypoints = 6;
  const waypoints: Coordinate3D[] = [];

  for (let i = 0; i <= numWaypoints; i++) {
    const t = i / numWaypoints;
    const x = source.x + (target.x - source.x) * t;
    const y = source.y + (target.y - source.y) * t + Math.sin(t * Math.PI) * 0.4;
    const z = source.z + (target.z - source.z) * t;
    waypoints.push([
      parseFloat(x.toFixed(3)),
      parseFloat(y.toFixed(3)),
      parseFloat(z.toFixed(3)),
    ]);
  }

  return {
    id: 'TRAJ_' + source.id + '_TO_' + target.id + '_' + Date.now(),
    sourceCellId: source.id,
    targetCellId: target.id,
    waypoints: Object.freeze(waypoints),
    progress: 1.0,
    stage,
    active: true,
  };
}
