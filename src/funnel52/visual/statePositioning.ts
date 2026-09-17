/**
 * 3D Memory Studio — Funnel 52
 * Mathematical State Positioning Across Dimensions (Z1..Z16)
 */

import { DimensionalInformationState } from '../../funnel49/types';
import { SimulationDimension, SimulationLifecycleStage, SimulatedStateNode, SimulationClusterType } from '../types';
import { resolveClusterType, CLUSTER_DEFINITIONS } from './clusterLayout';
import { seededRandom } from '../simulation/simulationSeed';

/**
 * Calculates deterministic 3D position (x, y, z) for a state under a given dimension
 */
export function calculateStatePosition(
  state: DimensionalInformationState,
  dimension: SimulationDimension,
  index: number,
  totalCount: number,
  clusterType: SimulationClusterType,
  seed = 42
): { x: number; y: number; z: number; radius: number; colorHex: string } {
  const clusterDef = CLUSTER_DEFINITIONS[clusterType];
  const isGreen = state.classification === 'GREEN';

  // 1D: Linear Arrangement
  if (dimension === 1) {
    const spacing = 35;
    const x = (index - totalCount / 2) * spacing;
    return {
      x,
      y: 0,
      z: 0,
      radius: isGreen ? 8 : 6,
      colorHex: isGreen ? clusterDef.colorHex : '#f43f5e',
    };
  }

  // 2D: Planar Grid Projection
  if (dimension === 2) {
    const cols = Math.ceil(Math.sqrt(totalCount));
    const row = Math.floor(index / cols);
    const col = index % cols;
    const spacing = 55;
    const x = (col - cols / 2) * spacing;
    const y = (row - cols / 2) * spacing;
    return {
      x,
      y,
      z: 0,
      radius: isGreen ? 8 : 6,
      colorHex: isGreen ? clusterDef.colorHex : '#f43f5e',
    };
  }

  // 3D: Interactive 3D Spatial Cluster Orbit
  if (dimension === 3) {
    const angle = (index * 2 * Math.PI) / Math.max(1, totalCount) + seededRandom(state.stateId, seed) * 0.5;
    const r = 40 + (index % 4) * 20;
    const offsetX = Math.cos(angle) * r;
    const offsetY = Math.sin(angle) * r;
    const offsetZ = ((index % 5) - 2) * 25;

    return {
      x: clusterDef.center[0] + offsetX,
      y: clusterDef.center[1] + offsetY,
      z: clusterDef.center[2] + offsetZ,
      radius: isGreen ? 9 : 7,
      colorHex: isGreen ? clusterDef.colorHex : '#f43f5e',
    };
  }

  // 4D..16D: Multidimensional Coordinate Projection
  const coordEntry = state.coordinatesByDimension[dimension] || state.coordinatesByDimension[3];
  const values = coordEntry?.coordinateValues || [3, 6, 9];

  const v0 = values[0] ?? 3;
  const v1 = values[1] ?? 6;
  const v2 = values[2] ?? 9;

  // Higher dimension harmonic offset derived from higher dimensional axes
  let harmonicOffset = 0;
  for (let d = 3; d < values.length; d++) {
    harmonicOffset += (values[d] * 12) / (d + 1);
  }

  const baseRadius = 150 + (v0 * 15);
  const theta = ((v1 * 40 + harmonicOffset) * Math.PI) / 180;
  const phi = ((v2 * 30 + (index * 15)) * Math.PI) / 180;

  const x = baseRadius * Math.sin(phi) * Math.cos(theta);
  const y = baseRadius * Math.sin(phi) * Math.sin(theta);
  const z = baseRadius * Math.cos(phi);

  return {
    x,
    y,
    z,
    radius: isGreen ? 10 : 7,
    colorHex: isGreen ? clusterDef.colorHex : '#f43f5e',
  };
}

/**
 * Derives progressive simulation lifecycle stage based on state age in simulation
 */
export function deriveLifecycleStage(ageMs: number): SimulationLifecycleStage {
  if (ageMs < 200) return 'DISCOVERED';
  if (ageMs < 500) return 'ENCODED';
  if (ageMs < 900) return 'ANCHORED';
  if (ageMs < 1400) return 'CONNECTED';
  if (ageMs < 2000) return 'CLUSTERED';
  if (ageMs < 2700) return 'PROJECTED';
  return 'ACTIVE';
}
