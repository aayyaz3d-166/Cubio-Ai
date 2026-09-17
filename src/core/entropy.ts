/**
 * 3D Spatial Grid Entropy & Information Density Engine
 * 
 * Computes Shannon entropy, spatial information density, transition weights,
 * and high-density information hotspots across the 7x7x7 (343 cells) spatial grid.
 */

import { Coordinate3D, MemoryCell, MemoryGrid3D } from '../types/memory';
import { cellIdToCoordinate, coordinateToCellId } from './address369';

export type DensityCategory = 'EMPTY' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL_HOTSPOT';

export interface CellEntropyData {
  cellId: number; // 0..342
  x: number;
  y: number;
  z: number;
  state: 0 | 1;
  symbol: string | null;
  occurrenceCount: number;
  stepIndices: number[];
  transitionDegree: number; // next + prev connections
  localActiveNeighbors6: number; // 6-axis orthogonal neighbors active
  localActiveNeighbors26: number; // 26 Moore neighborhood active
  probability: number; // p_i = occurrences / totalTokens
  selfInformationBits: number; // I(x) = -log2(p_i)
  localNeighborhoodEntropy: number; // Local Shannon entropy around cell
  informationDensityScore: number; // Normalized 0.00..1.00
  densityCategory: DensityCategory;
}

export interface SliceEntropyData {
  axis: 'X' | 'Y' | 'Z';
  layerIndex: number; // 0..6
  cells: CellEntropyData[][]; // 7x7 matrix [row][col]
  totalActive: number;
  meanDensity: number;
  peakDensity: number;
  peakCell: CellEntropyData | null;
  totalOccurrences: number;
}

export interface GridEntropySummary {
  totalCells: number; // 343
  activeCells: number;
  totalTokens: number;
  globalShannonEntropyBits: number;
  maxPossibleEntropyBits: number;
  entropyEfficiencyPercent: number; // (H_actual / H_max) * 100
  meanInformationDensity: number;
  peakInformationDensity: number;
  peakCell: CellEntropyData | null;
  spatialClusteringIndex: number; // Ratio of active neighbors to isolated cells
  highDensityHotspotCount: number; // Cells with HIGH or CRITICAL_HOTSPOT
  hotspots: CellEntropyData[]; // Sorted by information density descending
  slicesX: SliceEntropyData[];
  slicesY: SliceEntropyData[];
  slicesZ: SliceEntropyData[];
  compositeProjectionZ: number[][]; // 7x7 Max Intensity Projection along Z
  compositeProjectionY: number[][]; // 7x7 Max Intensity Projection along Y
  compositeProjectionX: number[][]; // 7x7 Max Intensity Projection along X
}

/**
 * Calculates Moore 26-neighborhood active count for a given cell (x, y, z)
 */
function getActiveMooreNeighborsCount(
  x: number,
  y: number,
  z: number,
  cellMap: Map<number, MemoryCell>
): number {
  let count = 0;
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dz = -1; dz <= 1; dz++) {
        if (dx === 0 && dy === 0 && dz === 0) continue;
        const nx = x + dx;
        const ny = y + dy;
        const nz = z + dz;
        if (nx >= 0 && nx < 7 && ny >= 0 && ny < 7 && nz >= 0 && nz < 7) {
          const nId = coordinateToCellId(nx, ny, nz);
          const neighbor = cellMap.get(nId);
          if (neighbor && neighbor.state === 1) {
            count++;
          }
        }
      }
    }
  }
  return count;
}

/**
 * Computes comprehensive Entropy & Information Density analysis for a 7x7x7 grid
 */
export function computeGridEntropyAnalysis(
  cells: MemoryCell[],
  totalTokensOverride?: number
): GridEntropySummary {
  const cellMap = new Map<number, MemoryCell>();
  let totalActive = 0;
  let totalOccurrences = 0;

  for (const cell of cells) {
    cellMap.set(cell.id, cell);
    if (cell.state === 1) {
      totalActive++;
      const occ = cell.occurrenceCount || (cell.stepIndices?.length || 1);
      totalOccurrences += occ;
    }
  }

  const totalTokens = totalTokensOverride || Math.max(1, totalOccurrences);

  // 1. Calculate per-cell probabilities and Shannon metrics
  const cellEntropyList: CellEntropyData[] = [];
  let sumPLogP = 0;

  for (let id = 0; id < 343; id++) {
    const cell = cellMap.get(id) || {
      id,
      blockId: 0,
      address: 26 + id,
      address369: 26 + id,
      x: id % 7,
      y: Math.floor(id / 7) % 7,
      z: Math.floor(id / 49),
      globalCoordinate: [id % 7, Math.floor(id / 7) % 7, Math.floor(id / 49)],
      state: 0 as const,
      symbol: null,
      level: 1 as const,
      stepIndices: [],
      occurrenceCount: 0,
      payloadBinary: '00000000',
      neighbors: { xPos: null, xNeg: null, yPos: null, yNeg: null, zPos: null, zNeg: null, allAdjacentIds: [] },
      relationships: {
        xPos: null, xNeg: null, yPos: null, yNeg: null, zPos: null, zNeg: null, allAdjacentIds: [],
        sameBlockId: 0, parentBlockId: null, childBlockIds: [], prevTokenRef: null, nextTokenRef: null,
      },
      connections: [],
      nextCellIds: [],
      prevCellIds: [],
    };

    const coord: Coordinate3D = cellIdToCoordinate(id);
    const x = coord.x;
    const y = coord.y;
    const z = coord.z;

    const state = cell.state;
    const occ = state === 1 ? (cell.occurrenceCount || cell.stepIndices?.length || 1) : 0;
    const transitionDegree = (cell.nextCellIds?.length || 0) + (cell.prevCellIds?.length || 0) + (cell.connections?.length || 0);

    // 6-axis orthogonal active neighbor count
    let localActiveNeighbors6 = 0;
    if (cell.neighbors?.allAdjacentIds) {
      for (const adjId of cell.neighbors.allAdjacentIds) {
        const adj = cellMap.get(adjId);
        if (adj && adj.state === 1) localActiveNeighbors6++;
      }
    }

    // 26 Moore active neighbor count
    const localActiveNeighbors26 = state === 1 || localActiveNeighbors6 > 0
      ? getActiveMooreNeighborsCount(x, y, z, cellMap)
      : 0;

    let probability = 0;
    let selfInformationBits = 0;

    if (state === 1 && occ > 0) {
      probability = occ / totalTokens;
      selfInformationBits = -Math.log2(probability);
      sumPLogP += probability * Math.log2(probability);
    }

    // Local Shannon neighborhood entropy
    let localNeighborhoodEntropy = 0;
    if (transitionDegree > 0) {
      // Transition diversity
      const nextCount = cell.nextCellIds?.length || 0;
      const prevCount = cell.prevCellIds?.length || 0;
      const totalTrans = nextCount + prevCount;
      if (totalTrans > 0) {
        const pNext = nextCount / totalTrans;
        const pPrev = prevCount / totalTrans;
        if (pNext > 0) localNeighborhoodEntropy -= pNext * Math.log2(pNext);
        if (pPrev > 0) localNeighborhoodEntropy -= pPrev * Math.log2(pPrev);
      }
    }

    // Composite Information Density Score (0.0 to 1.0)
    // Factors:
    // 1. Occurrence weight (40%)
    // 2. Transition connectivity (25%)
    // 3. Spatial neighborhood clustering (25%)
    // 4. State presence (10%)
    let informationDensityScore = 0;
    if (state === 1) {
      const occWeight = Math.min(1, occ / Math.max(1, totalTokens * 0.4));
      const transWeight = Math.min(1, transitionDegree / 4);
      const clusterWeight = Math.min(1, localActiveNeighbors26 / 8);
      const baseStateWeight = 0.15;

      informationDensityScore = (
        baseStateWeight +
        occWeight * 0.45 +
        transWeight * 0.20 +
        clusterWeight * 0.20
      );
      informationDensityScore = Math.min(1, Math.max(0, informationDensityScore));
    }

    // Categorization
    let densityCategory: DensityCategory = 'EMPTY';
    if (state === 1) {
      if (informationDensityScore >= 0.75 || occ >= 3) {
        densityCategory = 'CRITICAL_HOTSPOT';
      } else if (informationDensityScore >= 0.5) {
        densityCategory = 'HIGH';
      } else if (informationDensityScore >= 0.25) {
        densityCategory = 'MEDIUM';
      } else {
        densityCategory = 'LOW';
      }
    }

    cellEntropyList.push({
      cellId: id,
      x,
      y,
      z,
      state,
      symbol: cell.symbol,
      occurrenceCount: occ,
      stepIndices: cell.stepIndices || [],
      transitionDegree,
      localActiveNeighbors6,
      localActiveNeighbors26,
      probability: Math.round(probability * 10000) / 10000,
      selfInformationBits: Math.round(selfInformationBits * 100) / 100,
      localNeighborhoodEntropy: Math.round(localNeighborhoodEntropy * 100) / 100,
      informationDensityScore: Math.round(informationDensityScore * 100) / 100,
      densityCategory,
    });
  }

  // Global Shannon Entropy: H = -sum(p * log2(p))
  const globalShannonEntropyBits = totalActive > 0 ? Math.round(-sumPLogP * 100) / 100 : 0;
  const maxPossibleEntropyBits = totalActive > 0 ? Math.round(Math.log2(totalActive) * 100) / 100 : 0;
  const entropyEfficiencyPercent = maxPossibleEntropyBits > 0
    ? Math.round((globalShannonEntropyBits / maxPossibleEntropyBits) * 1000) / 10
    : 100;

  // Rank hotspots (cells with state === 1, sorted by information density desc)
  const hotspots = cellEntropyList
    .filter((c) => c.state === 1)
    .sort((a, b) => b.informationDensityScore - a.informationDensityScore || b.occurrenceCount - a.occurrenceCount);

  const peakCell = hotspots.length > 0 ? hotspots[0] : null;
  const peakInformationDensity = peakCell ? peakCell.informationDensityScore : 0;

  const totalDensitySum = cellEntropyList.reduce((acc, c) => acc + c.informationDensityScore, 0);
  const meanInformationDensity = totalActive > 0 ? Math.round((totalDensitySum / totalActive) * 100) / 100 : 0;

  // Spatial clustering index (mean active Moore neighbors per active cell / 26)
  const totalMooreNeighbors = hotspots.reduce((acc, c) => acc + c.localActiveNeighbors26, 0);
  const spatialClusteringIndex = totalActive > 0
    ? Math.round((totalMooreNeighbors / (totalActive * 8)) * 100) / 100
    : 0;

  const highDensityHotspotCount = hotspots.filter(
    (h) => h.densityCategory === 'CRITICAL_HOTSPOT' || h.densityCategory === 'HIGH'
  ).length;

  // 2. Build Orthogonal Slices for X, Y, Z planes (0..6)
  // Slices Z: XY plane at fixed Z
  const slicesZ: SliceEntropyData[] = [];
  for (let z = 0; z < 7; z++) {
    const matrix: CellEntropyData[][] = [];
    let sliceActive = 0;
    let sliceDensitySum = 0;
    let sliceOccurrences = 0;
    let peakSliceCell: CellEntropyData | null = null;

    for (let y = 0; y < 7; y++) {
      const row: CellEntropyData[] = [];
      for (let x = 0; x < 7; x++) {
        const id = coordinateToCellId(x, y, z);
        const data = cellEntropyList[id];
        row.push(data);
        if (data.state === 1) {
          sliceActive++;
          sliceDensitySum += data.informationDensityScore;
          sliceOccurrences += data.occurrenceCount;
          if (!peakSliceCell || data.informationDensityScore > peakSliceCell.informationDensityScore) {
            peakSliceCell = data;
          }
        }
      }
      matrix.push(row);
    }

    slicesZ.push({
      axis: 'Z',
      layerIndex: z,
      cells: matrix,
      totalActive: sliceActive,
      meanDensity: sliceActive > 0 ? Math.round((sliceDensitySum / sliceActive) * 100) / 100 : 0,
      peakDensity: peakSliceCell ? peakSliceCell.informationDensityScore : 0,
      peakCell: peakSliceCell,
      totalOccurrences: sliceOccurrences,
    });
  }

  // Slices Y: XZ plane at fixed Y
  const slicesY: SliceEntropyData[] = [];
  for (let y = 0; y < 7; y++) {
    const matrix: CellEntropyData[][] = [];
    let sliceActive = 0;
    let sliceDensitySum = 0;
    let sliceOccurrences = 0;
    let peakSliceCell: CellEntropyData | null = null;

    for (let z = 0; z < 7; z++) {
      const row: CellEntropyData[] = [];
      for (let x = 0; x < 7; x++) {
        const id = coordinateToCellId(x, y, z);
        const data = cellEntropyList[id];
        row.push(data);
        if (data.state === 1) {
          sliceActive++;
          sliceDensitySum += data.informationDensityScore;
          sliceOccurrences += data.occurrenceCount;
          if (!peakSliceCell || data.informationDensityScore > peakSliceCell.informationDensityScore) {
            peakSliceCell = data;
          }
        }
      }
      matrix.push(row);
    }

    slicesY.push({
      axis: 'Y',
      layerIndex: y,
      cells: matrix,
      totalActive: sliceActive,
      meanDensity: sliceActive > 0 ? Math.round((sliceDensitySum / sliceActive) * 100) / 100 : 0,
      peakDensity: peakSliceCell ? peakSliceCell.informationDensityScore : 0,
      peakCell: peakSliceCell,
      totalOccurrences: sliceOccurrences,
    });
  }

  // Slices X: YZ plane at fixed X
  const slicesX: SliceEntropyData[] = [];
  for (let x = 0; x < 7; x++) {
    const matrix: CellEntropyData[][] = [];
    let sliceActive = 0;
    let sliceDensitySum = 0;
    let sliceOccurrences = 0;
    let peakSliceCell: CellEntropyData | null = null;

    for (let z = 0; z < 7; z++) {
      const row: CellEntropyData[] = [];
      for (let y = 0; y < 7; y++) {
        const id = coordinateToCellId(x, y, z);
        const data = cellEntropyList[id];
        row.push(data);
        if (data.state === 1) {
          sliceActive++;
          sliceDensitySum += data.informationDensityScore;
          sliceOccurrences += data.occurrenceCount;
          if (!peakSliceCell || data.informationDensityScore > peakSliceCell.informationDensityScore) {
            peakSliceCell = data;
          }
        }
      }
      matrix.push(row);
    }

    slicesX.push({
      axis: 'X',
      layerIndex: x,
      cells: matrix,
      totalActive: sliceActive,
      meanDensity: sliceActive > 0 ? Math.round((sliceDensitySum / sliceActive) * 100) / 100 : 0,
      peakDensity: peakSliceCell ? peakSliceCell.informationDensityScore : 0,
      peakCell: peakSliceCell,
      totalOccurrences: sliceOccurrences,
    });
  }

  // 3. 2D Maximum Intensity Projections (MIP)
  // Along Z: 7x7 where val(y, x) = max_z(density(x, y, z))
  const compositeProjectionZ: number[][] = [];
  for (let y = 0; y < 7; y++) {
    const row: number[] = [];
    for (let x = 0; x < 7; x++) {
      let maxD = 0;
      for (let z = 0; z < 7; z++) {
        const id = coordinateToCellId(x, y, z);
        maxD = Math.max(maxD, cellEntropyList[id].informationDensityScore);
      }
      row.push(Math.round(maxD * 100) / 100);
    }
    compositeProjectionZ.push(row);
  }

  // Along Y: 7x7 where val(z, x) = max_y(density(x, y, z))
  const compositeProjectionY: number[][] = [];
  for (let z = 0; z < 7; z++) {
    const row: number[] = [];
    for (let x = 0; x < 7; x++) {
      let maxD = 0;
      for (let y = 0; y < 7; y++) {
        const id = coordinateToCellId(x, y, z);
        maxD = Math.max(maxD, cellEntropyList[id].informationDensityScore);
      }
      row.push(Math.round(maxD * 100) / 100);
    }
    compositeProjectionY.push(row);
  }

  // Along X: 7x7 where val(z, y) = max_x(density(x, y, z))
  const compositeProjectionX: number[][] = [];
  for (let z = 0; z < 7; z++) {
    const row: number[] = [];
    for (let y = 0; y < 7; y++) {
      let maxD = 0;
      for (let x = 0; x < 7; x++) {
        const id = coordinateToCellId(x, y, z);
        maxD = Math.max(maxD, cellEntropyList[id].informationDensityScore);
      }
      row.push(Math.round(maxD * 100) / 100);
    }
    compositeProjectionX.push(row);
  }

  return {
    totalCells: 343,
    activeCells: totalActive,
    totalTokens,
    globalShannonEntropyBits,
    maxPossibleEntropyBits,
    entropyEfficiencyPercent,
    meanInformationDensity,
    peakInformationDensity,
    peakCell,
    spatialClusteringIndex,
    highDensityHotspotCount,
    hotspots,
    slicesX,
    slicesY,
    slicesZ,
    compositeProjectionZ,
    compositeProjectionY,
    compositeProjectionX,
  };
}

/**
 * Returns a heat color string for a normalized entropy score (0.0 to 1.0)
 */
export function getEntropyHeatColor(
  score: number,
  colorScheme: 'CYBER' | 'THERMAL' | 'NEON' = 'CYBER',
  state: 0 | 1 = 1
): { bg: string; border: string; text: string; glow?: string } {
  if (state === 0 || score <= 0) {
    return {
      bg: 'rgba(18, 18, 22, 0.6)',
      border: 'rgba(40, 40, 48, 0.4)',
      text: 'rgba(100, 100, 115, 0.4)',
    };
  }

  if (colorScheme === 'CYBER') {
    if (score >= 0.75) {
      return {
        bg: 'rgba(244, 63, 94, 0.85)', // Neon Rose
        border: 'rgba(251, 113, 133, 1)',
        text: '#FFFFFF',
        glow: '0 0 10px rgba(244, 63, 94, 0.6)',
      };
    }
    if (score >= 0.5) {
      return {
        bg: 'rgba(245, 158, 11, 0.8)', // Amber
        border: 'rgba(251, 191, 36, 0.9)',
        text: '#FFFFFF',
        glow: '0 0 8px rgba(245, 158, 11, 0.4)',
      };
    }
    if (score >= 0.25) {
      return {
        bg: 'rgba(6, 182, 212, 0.7)', // Cyan
        border: 'rgba(34, 211, 238, 0.8)',
        text: '#FFFFFF',
      };
    }
    return {
      bg: 'rgba(30, 58, 138, 0.6)', // Deep Slate Blue
      border: 'rgba(59, 130, 246, 0.5)',
      text: '#93C5FD',
    };
  }

  if (colorScheme === 'THERMAL') {
    if (score >= 0.75) {
      return {
        bg: 'rgba(220, 38, 38, 0.85)', // Red Hot
        border: 'rgba(248, 113, 113, 1)',
        text: '#FFFFFF',
        glow: '0 0 10px rgba(220, 38, 38, 0.5)',
      };
    }
    if (score >= 0.5) {
      return {
        bg: 'rgba(234, 88, 12, 0.8)', // Orange
        border: 'rgba(251, 146, 60, 0.9)',
        text: '#FFFFFF',
      };
    }
    if (score >= 0.25) {
      return {
        bg: 'rgba(202, 138, 4, 0.7)', // Yellow
        border: 'rgba(250, 204, 21, 0.8)',
        text: '#000000',
      };
    }
    return {
      bg: 'rgba(16, 185, 129, 0.6)', // Emerald Green
      border: 'rgba(52, 211, 153, 0.5)',
      text: '#FFFFFF',
    };
  }

  // NEON
  if (score >= 0.75) {
    return {
      bg: 'rgba(217, 70, 239, 0.85)', // Fuchsia Neon
      border: 'rgba(240, 171, 252, 1)',
      text: '#FFFFFF',
      glow: '0 0 10px rgba(217, 70, 239, 0.6)',
    };
  }
  if (score >= 0.5) {
    return {
      bg: 'rgba(168, 85, 247, 0.8)', // Purple
      border: 'rgba(192, 132, 252, 0.9)',
      text: '#FFFFFF',
    };
  }
  if (score >= 0.25) {
    return {
      bg: 'rgba(16, 185, 129, 0.7)', // Electric Lime
      border: 'rgba(52, 211, 153, 0.8)',
      text: '#000000',
    };
  }
  return {
    bg: 'rgba(6, 78, 59, 0.6)', // Forest Dark
    border: 'rgba(16, 185, 129, 0.5)',
    text: '#A7F3D0',
  };
}
