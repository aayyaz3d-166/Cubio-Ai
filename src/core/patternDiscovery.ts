/**
 * Funnel 1: 3D Spatial Pattern Discovery Engine
 * 
 * Analyzes active 3D memory cells across single and multi-block hierarchies to discover:
 * 1. SPATIAL RUNS (+X/-X, +Y/-Y, +Z/-Z, diagonal continuous active cell vectors)
 * 2. SPATIAL REPETITIONS (Periodic token patterns e.g. ABABAB & periodic spatial coordinates)
 * 3. SPATIAL CLUSTERS (6-orthogonal & 26-Moore connected components, density, centroid, bounding box)
 * 4. SEQUENCE PATTERNS (Token sequence order vs spatial trajectory delta vectors)
 * 5. REPEATED SPATIAL SHAPES (Translation-invariant geometric configurations occurring >= 2 times)
 * 
 * Strictly non-destructive. Only detects and characterizes patterns.
 */

import {
  Coordinate3D,
  MemoryBlock,
  MemoryCell,
  MemoryGrid3D,
  MemorySequenceStep,
  RootMemory,
} from '../types/memory';
import {
  PatternType,
  RepeatedSpatialShapePattern,
  SequencePathPattern,
  ShapeOccurrence,
  SpatialClusterPattern,
  SpatialPatternCandidate,
  SpatialRepetitionPattern,
  SpatialRunPattern,
} from '../types/patterns';
import {
  cellIdToCoordinate,
  coordinateToCellId,
  TOTAL_SPATIAL_CELLS,
} from './address369';

// 6 Orthogonal Direction Vectors
const ORTHOGONAL_DIRECTIONS: { dir: [number, number, number]; name: string }[] = [
  { dir: [1, 0, 0], name: '+X' },
  { dir: [-1, 0, 0], name: '-X' },
  { dir: [0, 1, 0], name: '+Y' },
  { dir: [0, -1, 0], name: '-Y' },
  { dir: [0, 0, 1], name: '+Z' },
  { dir: [0, 0, -1], name: '-Z' },
];

// Helper: Get global coordinate key "bx,by,bz|x,y,z"
function makeSpatialKey(blockId: number, x: number, y: number, z: number): string {
  return `${blockId}:${x},${y},${z}`;
}

/**
 * Normalizes input into a unified active cell registry across all blocks
 */
interface UnifiedActiveCell {
  cellId: number;
  blockId: number;
  coord: Coordinate3D;
  globalCoord: [number, number, number];
  symbol: string;
  stepIndices: number[];
  occurrenceCount: number;
  neighbors6: number[];
  cellRef: MemoryCell;
}

function buildUnifiedActiveRegistry(
  gridOrRoot: MemoryGrid3D | RootMemory,
  blocksInput?: MemoryBlock[]
): {
  activeList: UnifiedActiveCell[];
  activeMap: Map<string, UnifiedActiveCell>;
  blocks: MemoryBlock[];
  steps: MemorySequenceStep[];
} {
  const activeList: UnifiedActiveCell[] = [];
  const activeMap = new Map<string, UnifiedActiveCell>();

  let blocks: MemoryBlock[] = [];
  let steps: MemorySequenceStep[] = [];

  if ('blocks' in gridOrRoot && Array.isArray((gridOrRoot as RootMemory).blocks)) {
    const root = gridOrRoot as RootMemory;
    blocks = root.blocks;
    steps = root.sequenceSteps || [];
  } else if (blocksInput && blocksInput.length > 0) {
    blocks = blocksInput;
    steps = (gridOrRoot as MemoryGrid3D).sequenceSteps || [];
  } else {
    // Single grid fallback
    const g = gridOrRoot as MemoryGrid3D;
    steps = g.sequenceSteps || [];
    blocks = [
      {
        blockId: 0,
        parentBlockId: null,
        level: 1,
        origin: [0, 0, 0],
        dimensions: [7, 7, 7],
        cells: g.cells,
        children: [],
        metadata: {
          title: 'Primary Block 0',
          createdAt: new Date().toISOString(),
          activeCellCount: g.activeCellCount,
          tokenCount: steps.length,
          capacity: 343,
        },
      },
    ];
  }

  // Populate active cells
  blocks.forEach((block) => {
    block.cells.forEach((cell) => {
      if (cell.state === 1) {
        const item: UnifiedActiveCell = {
          cellId: cell.id,
          blockId: block.blockId,
          coord: { x: cell.x, y: cell.y, z: cell.z },
          globalCoord: cell.globalCoordinate || [cell.x, cell.y, cell.z],
          symbol: cell.symbol || '·',
          stepIndices: cell.stepIndices || [],
          occurrenceCount: cell.occurrenceCount || (cell.stepIndices?.length || 1),
          neighbors6: cell.neighbors?.allAdjacentIds || [],
          cellRef: cell,
        };
        activeList.push(item);
        activeMap.set(makeSpatialKey(block.blockId, cell.x, cell.y, cell.z), item);
      }
    });
  });

  return { activeList, activeMap, blocks, steps };
}

// ============================================================================
// 1. SPATIAL RUN DETECTION
// ============================================================================
export function detectSpatialRuns(
  activeList: UnifiedActiveCell[],
  activeMap: Map<string, UnifiedActiveCell>,
  blocks: MemoryBlock[]
): SpatialRunPattern[] {
  const runs: SpatialRunPattern[] = [];
  const visitedDirectionMap = new Set<string>(); // "blockId:x,y,z:dx,dy,dz"

  // Process all active cells as potential run starters
  for (const cell of activeList) {
    const { blockId, coord } = cell;

    for (const { dir, name } of ORTHOGONAL_DIRECTIONS) {
      const [dx, dy, dz] = dir;
      const startKey = `${blockId}:${coord.x},${coord.y},${coord.z}:${dx},${dy},${dz}`;
      if (visitedDirectionMap.has(startKey)) continue;

      // Check if this cell is the true start of a run in direction dir (i.e. predecessor is NOT active)
      const prevX = coord.x - dx;
      const prevY = coord.y - dy;
      const prevZ = coord.z - dz;
      let hasPredecessor = false;

      if (prevX >= 0 && prevX < 7 && prevY >= 0 && prevY < 7 && prevZ >= 0 && prevZ < 7) {
        if (activeMap.has(makeSpatialKey(blockId, prevX, prevY, prevZ))) {
          hasPredecessor = true;
        }
      }

      if (hasPredecessor) continue;

      // Trace forward
      const runCells: number[] = [cell.cellId];
      const runCoords: Coordinate3D[] = [coord];
      const runSymbols: string[] = [cell.symbol];
      const runSteps: number[] = [...cell.stepIndices];
      let isCrossBlock = false;

      visitedDirectionMap.add(startKey);

      let currX = coord.x + dx;
      let currY = coord.y + dy;
      let currZ = coord.z + dz;
      let currBlockId = blockId;

      while (true) {
        // Handle block boundary transition
        if (currX < 0 || currX >= 7 || currY < 0 || currY >= 7 || currZ < 0 || currZ >= 7) {
          // Check if there is an adjacent child/sibling block in direction
          const nextBlock = blocks.find((b) => b.blockId === currBlockId + 1);
          if (nextBlock) {
            // Wrap coordinate to adjacent block
            const wrappedX = (currX + 7) % 7;
            const wrappedY = (currY + 7) % 7;
            const wrappedZ = (currZ + 7) % 7;
            const crossKey = makeSpatialKey(nextBlock.blockId, wrappedX, wrappedY, wrappedZ);
            const crossCell = activeMap.get(crossKey);

            if (crossCell) {
              isCrossBlock = true;
              currBlockId = nextBlock.blockId;
              currX = wrappedX;
              currY = wrappedY;
              currZ = wrappedZ;
              runCells.push(crossCell.cellId);
              runCoords.push(crossCell.coord);
              runSymbols.push(crossCell.symbol);
              runSteps.push(...crossCell.stepIndices);
              visitedDirectionMap.add(
                `${currBlockId}:${currX},${currY},${currZ}:${dx},${dy},${dz}`
              );
              currX += dx;
              currY += dy;
              currZ += dz;
              continue;
            }
          }
          break;
        }

        const nextKey = makeSpatialKey(currBlockId, currX, currY, currZ);
        const nextCell = activeMap.get(nextKey);
        if (!nextCell) break;

        visitedDirectionMap.add(`${currBlockId}:${currX},${currY},${currZ}:${dx},${dy},${dz}`);
        runCells.push(nextCell.cellId);
        runCoords.push(nextCell.coord);
        runSymbols.push(nextCell.symbol);
        runSteps.push(...nextCell.stepIndices);

        currX += dx;
        currY += dy;
        currZ += dz;
      }

      // Minimum run length of 2 cells
      if (runCells.length >= 2) {
        runs.push({
          id: `RUN-${blockId}-${cell.cellId}-${name}-${runCells.length}`,
          type: 'SPATIAL_RUN',
          startCell: runCells[0],
          endCell: runCells[runCells.length - 1],
          direction: dir,
          directionName: name,
          length: runCells.length,
          cells: runCells,
          coords: runCoords,
          symbols: runSymbols,
          blockId,
          isCrossBlock,
          stepIndices: Array.from(new Set(runSteps)).sort((a, b) => a - b),
        });
      }
    }
  }

  // Sort runs by length descending
  return runs.sort((a, b) => b.length - a.length);
}

// ============================================================================
// 2. SPATIAL REPETITION DETECTION
// ============================================================================
export function detectSpatialRepetitions(
  steps: MemorySequenceStep[],
  activeMap: Map<string, UnifiedActiveCell>
): SpatialRepetitionPattern[] {
  const repetitions: SpatialRepetitionPattern[] = [];
  if (!steps || steps.length < 3) return repetitions;

  const textTokens = steps.map((s) => s.char);
  const total = textTokens.length;

  // Test candidate pattern period lengths L from 1 to 8
  const maxPeriod = Math.min(8, Math.floor(total / 2));
  const seenPatterns = new Set<string>();

  for (let period = 1; period <= maxPeriod; period++) {
    for (let i = 0; i <= total - period * 2; i++) {
      const candidate = textTokens.slice(i, i + period);
      const candidateStr = candidate.join('');

      // Check how many times it repeats consecutively
      let count = 0;
      let checkIdx = i;

      while (checkIdx + period <= total) {
        const seg = textTokens.slice(checkIdx, checkIdx + period).join('');
        if (seg === candidateStr) {
          count++;
          checkIdx += period;
        } else {
          break;
        }
      }

      if (count >= 2) {
        const totalTokens = count * period;
        const key = `${candidateStr}:${count}:${i}`;
        if (!seenPatterns.has(candidateStr + ':' + totalTokens)) {
          seenPatterns.add(candidateStr + ':' + totalTokens);

          const matchedSteps = steps.slice(i, i + totalTokens);
          const cellIds: number[] = matchedSteps.map((s) => s.cellId);
          const coords: Coordinate3D[] = matchedSteps.map((s) => s.coordinate);
          const blockIds = Array.from(new Set(matchedSteps.map((s) => s.blockId ?? 0)));

          // Check spatial periodicity vector between repeats
          let spatialVector: [number, number, number] | null = null;
          if (coords.length >= period * 2) {
            const dx = coords[period].x - coords[0].x;
            const dy = coords[period].y - coords[0].y;
            const dz = coords[period].z - coords[0].z;
            spatialVector = [dx, dy, dz];
          }

          repetitions.push({
            id: `REP-${candidateStr}-${count}x-${i}`,
            type: 'REPETITION',
            pattern: candidate,
            patternString: candidateStr,
            repetitions: count,
            totalTokens,
            periodLength: period,
            cells: Array.from(new Set(cellIds)),
            coords,
            startStep: i,
            endStep: i + totalTokens - 1,
            blockIds,
            spatialPeriodicityVector: spatialVector,
          });

          // Jump forward by matched segment to avoid identical substrings
          i += totalTokens - 1;
        }
      }
    }
  }

  return repetitions.sort((a, b) => b.totalTokens - a.totalTokens);
}

// ============================================================================
// 3. SPATIAL CLUSTER DETECTION
// ============================================================================
export function detectSpatialClusters(
  activeList: UnifiedActiveCell[],
  activeMap: Map<string, UnifiedActiveCell>,
  blocks: MemoryBlock[]
): SpatialClusterPattern[] {
  const clusters: SpatialClusterPattern[] = [];
  const visited = new Set<string>();

  let clusterCounter = 1;

  // Run BFS connected component detection for each block
  for (const block of blocks) {
    const blockActive = activeList.filter((c) => c.blockId === block.blockId);

    for (const startCell of blockActive) {
      const startKey = makeSpatialKey(block.blockId, startCell.coord.x, startCell.coord.y, startCell.coord.z);
      if (visited.has(startKey)) continue;

      const clusterCells: UnifiedActiveCell[] = [];
      const queue: UnifiedActiveCell[] = [startCell];
      visited.add(startKey);

      while (queue.length > 0) {
        const current = queue.shift()!;
        clusterCells.push(current);

        // Check Moore 26-neighborhood for clustering
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            for (let dz = -1; dz <= 1; dz++) {
              if (dx === 0 && dy === 0 && dz === 0) continue;
              const nx = current.coord.x + dx;
              const ny = current.coord.y + dy;
              const nz = current.coord.z + dz;
              if (nx >= 0 && nx < 7 && ny >= 0 && ny < 7 && nz >= 0 && nz < 7) {
                const nKey = makeSpatialKey(block.blockId, nx, ny, nz);
                if (activeMap.has(nKey) && !visited.has(nKey)) {
                  visited.add(nKey);
                  queue.push(activeMap.get(nKey)!);
                }
              }
            }
          }
        }
      }

      // We define a cluster as >= 2 connected active cells
      if (clusterCells.length >= 2) {
        let minX = 7, minY = 7, minZ = 7;
        let maxX = 0, maxY = 0, maxZ = 0;
        let sumX = 0, sumY = 0, sumZ = 0;

        clusterCells.forEach((c) => {
          minX = Math.min(minX, c.coord.x);
          minY = Math.min(minY, c.coord.y);
          minZ = Math.min(minZ, c.coord.z);
          maxX = Math.max(maxX, c.coord.x);
          maxY = Math.max(maxY, c.coord.y);
          maxZ = Math.max(maxZ, c.coord.z);
          sumX += c.coord.x;
          sumY += c.coord.y;
          sumZ += c.coord.z;
        });

        const dimX = maxX - minX + 1;
        const dimY = maxY - minY + 1;
        const dimZ = maxZ - minZ + 1;
        const volume = dimX * dimY * dimZ;
        const cellCount = clusterCells.length;
        const density = Math.round((cellCount / volume) * 100) / 100;
        const centroid: [number, number, number] = [
          Math.round((sumX / cellCount) * 10) / 10,
          Math.round((sumY / cellCount) * 10) / 10,
          Math.round((sumZ / cellCount) * 10) / 10,
        ];

        // Shannon entropy of symbols inside cluster
        const symMap = new Map<string, number>();
        clusterCells.forEach((c) => symMap.set(c.symbol, (symMap.get(c.symbol) || 0) + 1));
        let entropy = 0;
        symMap.forEach((cnt) => {
          const p = cnt / cellCount;
          entropy -= p * Math.log2(p);
        });

        clusters.push({
          id: `CLUSTER-B${block.blockId}-#${clusterCounter}`,
          type: 'CLUSTER',
          clusterId: clusterCounter++,
          cells: clusterCells.map((c) => c.cellId),
          coords: clusterCells.map((c) => c.coord),
          symbols: clusterCells.map((c) => c.symbol),
          cellCount,
          density,
          centroid,
          boundingBox: {
            min: [minX, minY, minZ],
            max: [maxX, maxY, maxZ],
            dimensions: [dimX, dimY, dimZ],
            volume,
          },
          activeRatio: Math.round((cellCount / 343) * 1000) / 10,
          entropy: Math.round(entropy * 100) / 100,
          neighborhoodType: 'MOORE_26',
          blockId: block.blockId,
        });
      }
    }
  }

  return clusters.sort((a, b) => b.cellCount - a.cellCount);
}

// ============================================================================
// 4. SEQUENCE PATTERN DETECTION
// ============================================================================
export function detectSequencePaths(
  steps: MemorySequenceStep[]
): SequencePathPattern[] {
  const paths: SequencePathPattern[] = [];
  if (!steps || steps.length < 3) return paths;

  // Segment steps into predictable spatial trajectories
  let currentStartIdx = 0;

  while (currentStartIdx < steps.length - 2) {
    const stepA = steps[currentStartIdx];
    const stepB = steps[currentStartIdx + 1];

    const initialDelta: [number, number, number] = [
      stepB.coordinate.x - stepA.coordinate.x,
      stepB.coordinate.y - stepA.coordinate.y,
      stepB.coordinate.z - stepA.coordinate.z,
    ];

    const movements: [number, number, number][] = [initialDelta];
    const movementNames: string[] = [formatMovementName(initialDelta)];
    const pathCells: number[] = [stepA.cellId, stepB.cellId];
    const pathCoords: Coordinate3D[] = [stepA.coordinate, stepB.coordinate];
    const pathSymbols: string[] = [stepA.char, stepB.char];
    const stepIndices: number[] = [stepA.step, stepB.step];

    let endIdx = currentStartIdx + 1;

    // Extend while sequence follows linear or predictable step delta
    while (endIdx + 1 < steps.length) {
      const curr = steps[endIdx];
      const next = steps[endIdx + 1];
      const delta: [number, number, number] = [
        next.coordinate.x - curr.coordinate.x,
        next.coordinate.y - curr.coordinate.y,
        next.coordinate.z - curr.coordinate.z,
      ];

      // Check similarity of delta vector
      const isSameVector =
        delta[0] === initialDelta[0] &&
        delta[1] === initialDelta[1] &&
        delta[2] === initialDelta[2];

      const isUnitStep =
        Math.abs(delta[0]) <= 1 && Math.abs(delta[1]) <= 1 && Math.abs(delta[2]) <= 1;

      if (isSameVector || (isUnitStep && movements.length < 8)) {
        movements.push(delta);
        movementNames.push(formatMovementName(delta));
        pathCells.push(next.cellId);
        pathCoords.push(next.coordinate);
        pathSymbols.push(next.char);
        stepIndices.push(next.step);
        endIdx++;
      } else {
        break;
      }
    }

    if (pathCells.length >= 3) {
      // Calculate predictability score
      const constantMovementCount = movements.filter(
        (m) => m[0] === initialDelta[0] && m[1] === initialDelta[1] && m[2] === initialDelta[2]
      ).length;
      const predictability = Math.round((constantMovementCount / movements.length) * 100);

      paths.push({
        id: `SEQ-PATH-${stepA.step}-${steps[endIdx].step}`,
        type: 'SEQUENCE_PATH',
        pathId: `SEQ-${paths.length + 1}`,
        startCell: stepA.cellId,
        endCell: steps[endIdx].cellId,
        startToken: stepA.char,
        endToken: steps[endIdx].char,
        tokenCount: pathCells.length,
        cells: pathCells,
        coords: pathCoords,
        symbols: pathSymbols,
        movements,
        movementNames,
        isPredictableTrajectory: predictability >= 70,
        predictabilityScore: predictability,
        trajectoryDescription: `Path length ${pathCells.length} from [${stepA.coordinate.x},${stepA.coordinate.y},${stepA.coordinate.z}] with ${movementNames.slice(0, 3).join(' → ')}${movementNames.length > 3 ? '...' : ''}`,
        stepIndices,
        blockId: stepA.blockId ?? 0,
      });

      currentStartIdx = endIdx;
    } else {
      currentStartIdx++;
    }
  }

  return paths.sort((a, b) => b.tokenCount - a.tokenCount);
}

function formatMovementName(delta: [number, number, number]): string {
  const parts: string[] = [];
  if (delta[0] > 0) parts.push(`+${delta[0]}X`);
  else if (delta[0] < 0) parts.push(`${delta[0]}X`);
  if (delta[1] > 0) parts.push(`+${delta[1]}Y`);
  else if (delta[1] < 0) parts.push(`${delta[1]}Y`);
  if (delta[2] > 0) parts.push(`+${delta[2]}Z`);
  else if (delta[2] < 0) parts.push(`${delta[2]}Z`);
  return parts.length > 0 ? parts.join(',') : '0';
}

// ============================================================================
// 5. REPEATED SPATIAL SHAPES DETECTION
// ============================================================================
export function detectRepeatedSpatialShapes(
  activeList: UnifiedActiveCell[],
  activeMap: Map<string, UnifiedActiveCell>,
  clusters: SpatialClusterPattern[],
  blocks: MemoryBlock[]
): RepeatedSpatialShapePattern[] {
  const shapeMap = new Map<
    string,
    {
      offsets: [number, number, number][];
      occurrences: ShapeOccurrence[];
    }
  >();

  // Strategy A: Canonical signature of small spatial clusters (size 2..12)
  clusters.forEach((cluster) => {
    if (cluster.cellCount >= 2 && cluster.cellCount <= 16) {
      // Find min coordinate as origin
      let minX = 7, minY = 7, minZ = 7;
      cluster.coords.forEach((c) => {
        minX = Math.min(minX, c.x);
        minY = Math.min(minY, c.y);
        minZ = Math.min(minZ, c.z);
      });

      // Relative offsets canonical string
      const relativeOffsets: [number, number, number][] = cluster.coords
        .map((c) => [c.x - minX, c.y - minY, c.z - minZ] as [number, number, number])
        .sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2]);

      const signature = relativeOffsets.map((o) => `${o[0]},${o[1]},${o[2]}`).join('|');

      const occ: ShapeOccurrence = {
        occurrenceIndex: 0,
        originCellId: coordinateToCellId(minX, minY, minZ),
        originCoord: { x: minX, y: minY, z: minZ },
        blockId: cluster.blockId,
        cells: cluster.cells,
        coords: cluster.coords,
        symbols: cluster.symbols,
      };

      if (!shapeMap.has(signature)) {
        shapeMap.set(signature, { offsets: relativeOffsets, occurrences: [occ] });
      } else {
        const entry = shapeMap.get(signature)!;
        occ.occurrenceIndex = entry.occurrences.length;
        entry.occurrences.push(occ);
      }
    }
  });

  // Strategy B: Sliding geometric sub-shapes (2x2 squares, 3-lines, L-shapes) across all active cells
  const candidateOffsets: [number, number, number][][] = [
    // 2x2 Square on XY
    [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0]],
    // 2x2 Square on XZ
    [[0, 0, 0], [1, 0, 0], [0, 0, 1], [1, 0, 1]],
    // 2x2 Square on YZ
    [[0, 0, 0], [0, 1, 0], [0, 0, 1], [0, 1, 1]],
    // 3-Cell L-Shape
    [[0, 0, 0], [1, 0, 0], [0, 1, 0]],
    // 3-Cell Diagonal
    [[0, 0, 0], [1, 1, 0], [2, 2, 0]],
  ];

  for (const offsets of candidateOffsets) {
    const signature = offsets.map((o) => `${o[0]},${o[1]},${o[2]}`).join('|');
    const matchedOccurrences: ShapeOccurrence[] = [];

    for (const block of blocks) {
      for (let x = 0; x < 7; x++) {
        for (let y = 0; y < 7; y++) {
          for (let z = 0; z < 7; z++) {
            // Check if all offset cells are active
            let allActive = true;
            const occCells: number[] = [];
            const occCoords: Coordinate3D[] = [];
            const occSymbols: string[] = [];

            for (const [ox, oy, oz] of offsets) {
              const tx = x + ox;
              const ty = y + oy;
              const tz = z + oz;
              if (tx < 0 || tx >= 7 || ty < 0 || ty >= 7 || tz < 0 || tz >= 7) {
                allActive = false;
                break;
              }
              const key = makeSpatialKey(block.blockId, tx, ty, tz);
              const cell = activeMap.get(key);
              if (!cell) {
                allActive = false;
                break;
              }
              occCells.push(cell.cellId);
              occCoords.push(cell.coord);
              occSymbols.push(cell.symbol);
            }

            if (allActive) {
              matchedOccurrences.push({
                occurrenceIndex: matchedOccurrences.length,
                originCellId: coordinateToCellId(x, y, z),
                originCoord: { x, y, z },
                blockId: block.blockId,
                cells: occCells,
                coords: occCoords,
                symbols: occSymbols,
              });
            }
          }
        }
      }
    }

    if (matchedOccurrences.length >= 2) {
      if (!shapeMap.has(signature)) {
        shapeMap.set(signature, { offsets, occurrences: matchedOccurrences });
      } else {
        const existing = shapeMap.get(signature)!;
        matchedOccurrences.forEach((m) => {
          if (!existing.occurrences.some((o) => o.blockId === m.blockId && o.originCellId === m.originCellId)) {
            m.occurrenceIndex = existing.occurrences.length;
            existing.occurrences.push(m);
          }
        });
      }
    }
  }

  // Filter to only shapes with >= 2 occurrences
  const repeatedShapes: RepeatedSpatialShapePattern[] = [];
  let shapeCounter = 1;

  shapeMap.forEach(({ offsets, occurrences }, signature) => {
    if (occurrences.length >= 2) {
      const cellsPerOcc = offsets.length;
      const totalCellsCovered = occurrences.reduce((acc, o) => acc + o.cells.length, 0);

      repeatedShapes.push({
        id: `SHAPE-${shapeCounter++}-${signature.slice(0, 12)}`,
        type: 'REPEATED_SHAPE',
        shapeSignature: signature,
        shapeName: `Shape Pattern ${shapeCounter - 1} (${cellsPerOcc} cells × ${occurrences.length} occurrences)`,
        cellsPerOccurrence: cellsPerOcc,
        occurrences,
        occurrenceCount: occurrences.length,
        totalCellsCovered,
        relativeOffsets: offsets,
      });
    }
  });

  return repeatedShapes.sort((a, b) => b.totalCellsCovered - a.totalCellsCovered);
}

// ============================================================================
// MAIN FUNNEL 1 ENTRY POINT: DISCOVER ALL SPATIAL PATTERNS
// ============================================================================
export interface Funnel1DiscoveryResult {
  runs: SpatialRunPattern[];
  repetitions: SpatialRepetitionPattern[];
  clusters: SpatialClusterPattern[];
  sequencePaths: SequencePathPattern[];
  repeatedShapes: RepeatedSpatialShapePattern[];
  activeCellsCount: number;
  totalPatterns: number;
  discoveryDurationMs: number;
}

export function discoverAllSpatialPatterns(
  gridOrRoot: MemoryGrid3D | RootMemory,
  blocksInput?: MemoryBlock[]
): Funnel1DiscoveryResult {
  const t0 = performance.now();

  const { activeList, activeMap, blocks, steps } = buildUnifiedActiveRegistry(
    gridOrRoot,
    blocksInput
  );

  // 1. Spatial Runs
  const runs = detectSpatialRuns(activeList, activeMap, blocks);

  // 2. Spatial Repetitions
  const repetitions = detectSpatialRepetitions(steps, activeMap);

  // 3. Spatial Clusters
  const clusters = detectSpatialClusters(activeList, activeMap, blocks);

  // 4. Sequence Paths
  const sequencePaths = detectSequencePaths(steps);

  // 5. Repeated Shapes
  const repeatedShapes = detectRepeatedSpatialShapes(activeList, activeMap, clusters, blocks);

  const totalPatterns =
    runs.length +
    repetitions.length +
    clusters.length +
    sequencePaths.length +
    repeatedShapes.length;

  const t1 = performance.now();

  return {
    runs,
    repetitions,
    clusters,
    sequencePaths,
    repeatedShapes,
    activeCellsCount: activeList.length,
    totalPatterns,
    discoveryDurationMs: Math.round((t1 - t0) * 100) / 100,
  };
}
