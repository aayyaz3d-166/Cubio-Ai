/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F59: D0–D8 Dimensional Intelligence Framework Types
 *
 * Core spectrum:
 * D0 (Scalar) -> D1 (Stream) -> D2 (Planar) -> D3 (Spatial) ->
 * D4 (Spacetime) -> D5 (Reasoning) -> D6 (Workflow/Agent) -> D7 (Macro) -> D8 (Metaverse Attractor)
 *
 * Reversible state transformations and 7 Core Use Cases.
 */

export type CubiODimensionalLevel =
  | 'D0' // Scalar / Point Singularity (0D - atomic signals, scalars)
  | 'D1' // Linear Stream / Vector (1D - token sequences, audio waveforms, prompt text)
  | 'D2' // Planar / Structured Matrix (2D - code ASTs, UI layouts, tables, rasters)
  | 'D3' // Volumetric / Spatial Manifold (3D - meshes, voxel grids, scene graphs)
  | 'D4' // Hyper-Spatial / Spacetime (4D - tesseracts, state trajectories, quaternions)
  | 'D5' // Cognitive / Semantic Latent (5D - conceptual graphs, latent embeddings, reasoning DAGs)
  | 'D6' // Multi-Agent / Swarm Workflow (6D - agent topologies, consensus matrices, workflow states)
  | 'D7' // Project / Macro Ecosystem (7D - repository dependency graphs, ADRs, holistic project state)
  | 'D8'; // Universal Super-Intelligence Attractor (8D - global unified state attractor, omni-reversibility bridge)

export type DimensionalUseCase =
  | 'STATE_ABSTRACTION'
  | 'INFORMATION_COMPRESSION'
  | 'REASONING_STATES'
  | 'SPATIAL_STATES'
  | 'WORKFLOW_STATES'
  | 'AGENT_STATES'
  | 'MEMORY_REPRESENTATIONS';

export interface DimensionalStateNode<T = unknown> {
  readonly nodeId: string;
  readonly level: CubiODimensionalLevel;
  readonly levelRank: number; // 0 .. 8
  readonly payload: T;
  readonly properties: Readonly<Record<string, unknown>>;
  readonly dimensionalCoordinates: readonly number[];
  readonly checksum: string;
  readonly timestamp: number;
}

export type DimensionalTransformOperation =
  | 'LIFT'
  | 'PROJECT'
  | 'FOLD_369'
  | 'ISOMORPHIC_MAP'
  | 'REVERSIBLE_CYCLE';

export interface DimensionalTransformResult {
  readonly transformId: string;
  readonly operation: DimensionalTransformOperation;
  readonly sourceLevel: CubiODimensionalLevel;
  readonly targetLevel: CubiODimensionalLevel;
  readonly inputState: DimensionalStateNode;
  readonly outputState: DimensionalStateNode;
  readonly fidelityScore: number; // 0.0 .. 1.0
  readonly harmonicInvariancePreserved: boolean;
  readonly transformChecksum: string;
}

export interface ReversibleCycleResult {
  readonly cycleId: string;
  readonly startState: DimensionalStateNode;
  readonly liftedD8State: DimensionalStateNode;
  readonly reconstructedD0State: DimensionalStateNode;
  readonly isLosslessReversible: boolean;
  readonly reconstructionError: number;
  readonly fidelityScore: number;
  readonly cycleChecksum: string;
}

export interface IUniversalDimensionalEngine {
  classifyDimension(data: unknown): CubiODimensionalLevel;
  createDimensionalNode<T>(data: T, explicitLevel?: CubiODimensionalLevel): DimensionalStateNode<T>;
  liftDimension(node: DimensionalStateNode, targetLevel?: CubiODimensionalLevel): DimensionalTransformResult;
  projectDimension(node: DimensionalStateNode, targetLevel?: CubiODimensionalLevel): DimensionalTransformResult;
  fold369Harmonics(node: DimensionalStateNode): DimensionalTransformResult;
  executeReversibleCycle(startNode: DimensionalStateNode): ReversibleCycleResult;
  executeUseCase(useCase: DimensionalUseCase, input: unknown): DimensionalTransformResult | ReversibleCycleResult;
}
