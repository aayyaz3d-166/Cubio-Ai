/**
 * 3D Memory Studio - Core Types & Definitions
 * 7x7x7 Spatial Cube (343 Cells) + 369 Unified Address Space
 */

export interface Coordinate3D {
  x: number; // 0..6
  y: number; // 0..6
  z: number; // 0..6
}

export type MemoryLevel = 1 | 2 | 3;

export interface CellNeighbors {
  xPos: number | null; // X+1 (Right)
  xNeg: number | null; // X-1 (Left)
  yPos: number | null; // Y+1 (Up)
  yNeg: number | null; // Y-1 (Down)
  zPos: number | null; // Z+1 (Forward)
  zNeg: number | null; // Z-1 (Backward)
  allAdjacentIds: number[]; // All valid orthogonal neighbor IDs
}

export interface CellSpatialRelationships {
  // Orthogonal Neighbors
  xPos: number | null; // X+1 (Right)
  xNeg: number | null; // X-1 (Left)
  yPos: number | null; // Y+1 (Up)
  yNeg: number | null; // Y-1 (Down)
  zPos: number | null; // Z+1 (Forward)
  zNeg: number | null; // Z-1 (Backward)
  allAdjacentIds: number[];

  // Hierarchical & Graph Relationships
  sameBlockId: number;
  parentBlockId: number | null;
  childBlockIds: number[];
  prevTokenRef: { blockId: number; cellId: number; token?: string } | null;
  nextTokenRef: { blockId: number; cellId: number; token?: string } | null;
}

export interface MemoryCell {
  id: number; // 0..342 (Linear cell index within local block)
  blockId: number; // Block ID (0, 1, 2, ...)
  address: number; // 26..368 (Spatial 369 address)
  address369: number; // Alias for backward-compatibility
  x: number; // 0..6 (Local block X)
  y: number; // 0..6 (Local block Y)
  z: number; // 0..6 (Local block Z)
  globalCoordinate: [number, number, number]; // [blockOrigin.x + x, blockOrigin.y + y, blockOrigin.z + z]
  state: 0 | 1; // 0 = Inactive/Idle, 1 = Active
  symbol: string | null; // Stored symbol / character
  symbolId?: number | null; // 0..25 if A-Z, or character code
  level: MemoryLevel; // 1, 2, or 3
  stepIndices: number[]; // Sequence steps where this cell was activated
  occurrenceCount: number; // Visit count
  payloadBinary: string; // 8-bit binary representation of symbol
  neighbors: CellNeighbors;
  relationships: CellSpatialRelationships;
  connections: number[]; // Connected cell IDs in sequence graph
  nextCellIds: number[]; // Forward path cell IDs
  prevCellIds: number[]; // Backward path cell IDs
}

export interface MemorySequenceStep {
  step: number;
  char: string;
  symbolId: number; // 0..25 or ASCII code
  address: number; // 369 address
  address369: number; // Alias
  blockId?: number; // Target block ID
  cellId: number; // 0..342
  coordinate: Coordinate3D;
  globalCoordinate?: [number, number, number];
  binary: string;
  level: MemoryLevel;
}

/**
 * Funnel 2: Reusable 7x7x7 Memory Block
 * Every block contains its own 343-cell local coordinate system (0..6 X, 0..6 Y, 0..6 Z)
 */
export interface MemoryBlock {
  blockId: number;
  parentBlockId: number | null;
  level: MemoryLevel;
  origin: [number, number, number]; // Global origin [X, Y, Z]
  dimensions: [number, number, number]; // [7, 7, 7]
  cells: MemoryCell[]; // Exactly 343 cells in this local block
  children: number[]; // Child block IDs
  metadata: {
    title?: string;
    createdAt: string;
    activeCellCount: number;
    tokenCount: number;
    description?: string;
    capacity: number; // 343
    [key: string]: unknown;
  };
}

/**
 * Funnel 2: Root Hierarchical Memory System
 * ROOT contains child blocks (BLOCK 0, BLOCK 1, BLOCK 2...)
 */
export interface RootMemory {
  rootId: 'ROOT';
  level: number;
  blocks: MemoryBlock[];
  activeBlockId: number;
  totalCapacity: number; // blocks.length * 343
  totalActiveCells: number;
  entryRef: { blockId: number; cellId: number } | null;
  sequenceSteps: MemorySequenceStep[];
  metadata: {
    title: string;
    createdAt: string;
    totalAllocatedBlocks: number;
    researchQuestion: string;
    isExpandable: true;
    preservesSpatialRelationships: true;
  };
}

export interface MemoryGrid3D {
  version: string;
  dimension: number; // 7 (7x7x7)
  totalCells: number; // 343
  totalAddressSpace: number; // 369
  symbolCount: number; // 26 (A-Z)
  activeCellCount: number;
  cells: MemoryCell[]; // Exactly 343 cells
  entryCellId: number | null;
  sequenceSteps: MemorySequenceStep[];
  metadata: {
    title: string;
    createdAt: string;
    description?: string;
    checksum?: string;
    encodedTextLength?: number;
  };
}

export interface MemoryFileStructure {
  format: "3dmemory" | "3DMEMORY";
  version: number | string;
  grid: {
    x: number;
    y: number;
    z: number;
    cells?: MemoryCell[];
    activeCellCount?: number;
    entryCellId?: number | null;
    sequenceSteps?: MemorySequenceStep[];
    metadata?: Record<string, unknown>;
  };
  addresses: number; // 369
  cells: MemoryCell[];
  encodedData: {
    stepCount: number;
    activeCellIds: number[];
    sequenceSteps: MemorySequenceStep[];
  };
  metadata: {
    title?: string;
    createdAt?: string;
    checksum?: string;
    totalChars?: number;
    derivationMode?: string;
    [key: string]: unknown;
  };
  checksum?: string;
}

/**
 * Funnel 1 — DERIVE, DON'T STORE Architecture
 * 
 * Minimal Canonical Data Stored:
 * - blockId
 * - cellId
 * - state (0 or 1)
 * - token / reference
 * - sequence (step indices)
 * 
 * Derived at Runtime (Never redundantly stored):
 * cellId → (x, y, z) → Address 369 → Neighbors → Global Position
 */
export interface CanonicalStoredCellRecord {
  blockId: number;        // e.g. 4
  cellId: number;         // e.g. 137 (0..342)
  state: 0 | 1;           // 1 = Active, 0 = Idle
  token: string | null;   // e.g. 'K' or character reference
  sequence: number[];     // e.g. [137] sequence step index list
}

export interface DerivedSpatialAttributes {
  cellId: number;
  blockId: number;
  coordinate: Coordinate3D; // Local (x, y, z) [0..6, 0..6, 0..6]
  x: number;
  y: number;
  z: number;
  address: number; // 26..368 in 369 address space
  address369: number;
  neighbors: CellNeighbors; // 6-way orthogonal neighbors (x±1, y±1, z±1)
  globalCoordinate: [number, number, number]; // blockOrigin + localCoord
  payloadBinary: string; // 8-bit binary representation
  derivationTrace: {
    step1_XYZ: string;
    step2_Address: string;
    step3_Neighbors: string;
  };
}

export interface DeduplicationMetrics {
  storedFieldsCount: number; // 5 fields (blockId, cellId, state, token, sequence)
  rawRedundantFieldsCount: number; // 15 fields (x, y, z, address, address369, neighbors 6-way, globalCoord, binary, etc.)
  eliminatedFieldsCount: number; // 10 fields eliminated
  reductionRatioPercent: number; // ~66% - 85% storage payload reduction
  eliminatedFieldNames: string[];
}

export interface SpatialTokenRecord {
  // --- Canonical Stored Data ---
  blockId: number;
  cellId: number;
  state: number;
  token: string;
  sequence: number;

  // --- Runtime Derived Attributes (Not Redundantly Stored) ---
  address: number;
  coordinate: [number, number, number];
  globalCoordinate?: [number, number, number];
  neighbors?: CellNeighbors;
  derived?: DerivedSpatialAttributes;
}

export interface SpatialInstruction {
  step: number;
  op: 'ALLOC_ACTIVATE' | 'LINK_SEQUENCE';
  token: string;
  symbolId: number;
  address369: number;
  cellId: number;
  coordinate: Coordinate3D;
  binary: string;
  prevCellId: number | null;
  instructionCode: string;
  humanReadable: string;
  record: SpatialTokenRecord;
  canonicalRecord?: CanonicalStoredCellRecord;
}

export interface Funnel1EncodeData {
  inputText: string;
  tokens: string[];
  tokenCount: number;
  addresses: number[];
  spatialInstructions: SpatialInstruction[];
  tokenRecords: SpatialTokenRecord[];
  canonicalRecords: CanonicalStoredCellRecord[];
  sequenceOrder: number[];
  deduplicationMetrics: DeduplicationMetrics;
}

export interface CompactStoredCell {
  cellId: number;        // e.g. 12, 47, 137, 290
  state: 1;              // Active cell state
  token: string;         // 'H', 'E', 'L', 'L', 'O'
  sequence: number[];    // sequence step indices [0, 4, ...]
}

export interface CompactBlockFileEntry {
  id: number;
  parentId: string | number;
  level: number;
  origin: [number, number, number];
  dimensions: [number, number, number]; // [7, 7, 7]
  totalImplicitCapacity: number;        // 343
  activeCells: CompactStoredCell[];     // ONLY active cells!
  metadata?: Record<string, unknown>;
}

export interface MemoryFileStructureCompactV2 {
  format: '3dmemory';
  version: 2;
  storageSchema: 'COMPACT_SPARSE_IMPLICIT_GRID';
  architecture: 'FUNNEL_2_COMPACT_MEMORY';
  addressSystem: {
    symbolCount: number;
    spatialCellsPerBlock: number;
    gridDimension: [number, number, number];
    totalAddressSpace: number;
  };
  root: {
    id: string;
    level?: number;
    activeBlockId?: number;
    totalBlocks?: number;
  };
  blocks: CompactBlockFileEntry[];
  sequence: MemorySequenceStep[];
  metadata: {
    title?: string;
    createdAt?: string;
    checksum?: string;
    totalChars?: number;
    totalActiveCells?: number;
    storedCellsCount: number;
    eliminatedEmptyCellsCount: number;
    implicitCapacity: number;
    overheadReductionPercent: number;
    representationOverheadReduction: string;
    [key: string]: unknown;
  };
  checksum?: string;
}

export interface RepresentationComparisonMetrics {
  id: string;
  name: string;
  inputText: string;
  inputLength: number;
  activeCellsCount: number;
  totalImplicitCells: number; // blocks.length * 343
  blocksAllocated: number;

  // OLD .3dmemory (Dense Explicit Representation)
  oldDense: {
    fileSizeBytes: number;
    fileSizeFormatted: string;
    cellObjectsStored: number;
    metadataSizeBytes: number;
    encodeTimeMs: number;
    decodeTimeMs: number;
    memoryUsageBytes: number;
    lossPercent: number;
    isExactMatch: boolean;
    decodedText: string;
    schemaDescription: string;
  };

  // NEW .3dmemory (Compact Sparse Implicit Representation)
  newCompact: {
    fileSizeBytes: number;
    fileSizeFormatted: string;
    cellObjectsStored: number;
    metadataSizeBytes: number;
    encodeTimeMs: number;
    decodeTimeMs: number;
    memoryUsageBytes: number;
    lossPercent: number;
    isExactMatch: boolean;
    decodedText: string;
    schemaDescription: string;
  };

  // Comparative Evaluation
  reduction: {
    bytesSaved: number;
    reductionPercent: number;
    cellsEliminated: number;
    cellEliminationPercent: number;
    speedDeltaMs: number;
    losslessProof: boolean; // loss = 0.00%
    verdict: 'CONFIRMED_OVERHEAD_REDUCTION';
  };
}

export interface Funnel2MemoryData {
  dimension: '7×7×7';
  blockSize: 343;
  totalCells: number; // blocks.length * 343
  activeCells: number;
  idleCells: number;
  activeCellRatio: number;
  orthogonalNeighborsCalculated: number;
  sequenceEdgesCount: number;
  currentLevel: MemoryLevel;
  entryCellId: number | null;
  rootMemory: RootMemory;
  allocatedBlocksCount: number;
  activeBlockId: number;
  isExpandable: true;
  preservesSpatialRelationships: true;
  researchQuestion: string;
  // Compact Sparse Metrics
  sparseActiveCellsCount: number;
  implicitDefaultCellsCount: number;
  overheadReductionRatioPercent: number;
  denseCellObjectsCount: number;
}

export interface ReconstructStepDetail {
  step: number;
  blockId: number;
  cellId: number;
  localCoord: [number, number, number];
  globalCoord: [number, number, number];
  resolvedAddress: number;
  resolvedToken: string;
  payloadBinary: string;
  stepTrace: string;
}

export interface Funnel3ReconstructData {
  searchMethod: '369_PATH_TRAVERSAL';
  pathCellIds: number[];
  traversedSteps: number;
  decodedTokens: string[];
  decodedText: string;
  isExactMatch: boolean;
  lossPercentage: number;
  totalLatencyMs: number;
  pipelineStages: {
    stage1Memory: string;
    stage2LocateBlock: string;
    stage3LocateCell: string;
    stage4ResolveAddress: string;
    stage5ResolveToken: string;
    stage6SequenceOrder: string;
    stage7OriginalData: string;
  };
  reconstructSteps: ReconstructStepDetail[];
}

export interface MemoryBlockFileEntry {
  id: number;
  parentId: string | number;
  level: number;
  origin: [number, number, number];
  dimensions: [number, number, number];
  cells: MemoryCell[];
  metadata?: Record<string, unknown>;
}

export interface MemoryFileStructureV2 {
  format: '3dmemory';
  version: 2;
  addressSystem: {
    symbolCount: number;
    spatialCellsPerBlock: number;
  };
  root: {
    id: string;
    level?: number;
    activeBlockId?: number;
    totalBlocks?: number;
  };
  blocks: MemoryBlockFileEntry[];
  sequence: MemorySequenceStep[];
  metadata: {
    title?: string;
    createdAt?: string;
    checksum?: string;
    totalChars?: number;
    totalActiveCells?: number;
    isExpandable?: boolean;
    researchQuestion?: string;
    [key: string]: unknown;
  };
  checksum?: string;
}

export interface ThreeFunnelPipeline {
  funnel1: Funnel1EncodeData;
  funnel2: Funnel2MemoryData;
  funnel3: Funnel3ReconstructData;
}

export interface EncodeResult {
  success: boolean;
  grid: MemoryGrid3D;
  steps: MemorySequenceStep[];
  spatialInstructions?: SpatialInstruction[];
  tokenRecords?: SpatialTokenRecord[];
  textLength: number;
  uniqueCellsActivated: number;
  encodingTimeMs: number;
}

export interface DecodeResult {
  success: boolean;
  decodedText: string;
  stepsDecoded: number;
  lossPercentage: number;
  isExactMatch: boolean;
  decodingTimeMs: number;
  error?: string;
}

export interface NearestCellInfo {
  cellId: number;
  address: number;
  address369: number;
  coordinate: Coordinate3D;
  symbol: string | null;
  state: 0 | 1;
  euclideanDistance: number;
  manhattanDistance: number;
  deltaVector: { dx: number; dy: number; dz: number };
}

export interface MemoryMetrics {
  originalTextSizeBits: number;
  originalTextSizeBytes: number;
  activeCellsCount: number;
  totalCellsCount: number;
  activeCellRatio: number;
  fileSizeBytes: number;
  spatialStateBits: number;
  informationLossPercent: number;
  compressionRatio: number;
}

export interface TrajectoryPath {
  startCellId: number;
  endCellId: number;
  startCoord: Coordinate3D;
  endCoord: Coordinate3D;
  pathCellIds: number[];
  pathCoords: Coordinate3D[];
  stepCount: number;
  euclideanLength: number;
  manhattanLength: number;
}

export interface BenchmarkCaseResult {
  id: string;
  name: string;
  input: string;
  inputLength: number;
  encodedActiveCells: number;
  fileSizeBytes: number;
  decodedText: string;
  pass: boolean;
  lossPercent: number;
  encodeTimeMs: number;
  decodeTimeMs: number;
  totalTimeMs: number;
}

export interface SystemTestResult {
  name: string;
  description: string;
  passed: boolean;
  details: string;
  durationMs: number;
}
