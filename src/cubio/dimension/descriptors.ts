/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 4: Logical State Space Descriptors (D0 through D7)
 *
 * Mathematical and computational specifications for each logical dimension.
 * Explicitly defined as computational state spaces, NOT physical dimensions.
 */

import { CubiODimension, CubiODimensionDescriptor } from './types';

export const CUBIO_DIMENSION_DESCRIPTORS: Readonly<Record<CubiODimension, CubiODimensionDescriptor>> = Object.freeze({
  D0: Object.freeze({
    dimension: 'D0',
    name: 'Input',
    category: 'Ingestion & Raw Stream',
    tensorRank: 1,
    description: 'Raw scalar, tokenized stream, and primitive signal ingestion space.',
    stateSpaceType: 'SCALAR_STREAM',
    primaryAbstraction: 'Signals, raw parameters, sensory pulses, unparsed bytes',
    invariantProperties: Object.freeze(['raw_invariance', 'deterministic_ingestion', 'scalar_bounds']),
  }),

  D1: Object.freeze({
    dimension: 'D1',
    name: 'Structure',
    category: 'Linear & Sequential Organization',
    tensorRank: 1,
    description: '1D sequential structure, syntax trees, token hierarchies, and structured schemas.',
    stateSpaceType: 'SEQUENTIAL_HIERARCHY',
    primaryAbstraction: 'Ordered lists, AST sequences, type signatures, discrete grammar',
    invariantProperties: Object.freeze(['order_preservation', 'syntactic_integrity', 'linear_causality']),
  }),

  D2: Object.freeze({
    dimension: 'D2',
    name: 'Relations',
    category: 'Graph & Relational Topology',
    tensorRank: 2,
    description: '2D relational state space, planar graph adjacency matrices, and directional linkage meshes.',
    stateSpaceType: 'RELATIONAL_GRAPH',
    primaryAbstraction: 'Entity-relationship pairs, adjacency matrices, topological links, network edges',
    invariantProperties: Object.freeze(['graph_connectivity', 'relational_symmetry', 'edge_weight_bounds']),
  }),

  D3: Object.freeze({
    dimension: 'D3',
    name: 'Spatial Representation',
    category: 'Volumetric & Euclidean Geometry',
    tensorRank: 3,
    description: '3D Euclidean volumetric coordinate manifold [x, y, z], transforms, and bounding bounds.',
    stateSpaceType: 'EUCLIDEAN_3D_VOLUMETRIC',
    primaryAbstraction: '3D Cartesian coordinates, transforms, mesh vertices, visual hulls',
    invariantProperties: Object.freeze(['euclidean_distance_metric', 'rigid_transform_invariance', 'volume_positivity']),
  }),

  D4: Object.freeze({
    dimension: 'D4',
    name: 'Memory',
    category: 'Temporal & Holographic Retention',
    tensorRank: 4,
    description: '4D temporal and holographic memory state space incorporating immutable historical lineages.',
    stateSpaceType: 'HOLOGRAPHIC_TEMPORAL',
    primaryAbstraction: 'Episodic memory traces, time-travel snapshots, version DAGs, resonance indices',
    invariantProperties: Object.freeze(['temporal_monotonicity', 'lineage_immutability', 'recall_reproducibility']),
  }),

  D5: Object.freeze({
    dimension: 'D5',
    name: 'Pattern',
    category: 'Harmonic & Invariant Symmetries',
    tensorRank: 5,
    description: '5D harmonic state space governed by 3-6-9 vortex math, recurrent frequencies, and geometric invariants.',
    stateSpaceType: 'HARMONIC_SYMMETRY_369',
    primaryAbstraction: '369 vortex frequencies, digital roots, periodic orbits, invariant manifolds',
    invariantProperties: Object.freeze(['vortex_conservation', 'digital_root_parity', 'harmonic_resonance_lock']),
  }),

  D6: Object.freeze({
    dimension: 'D6',
    name: 'Prediction',
    category: 'Counterfactual & Probabilistic Sandbox',
    tensorRank: 6,
    description: '6D probabilistic simulation space forecasting entropy dissipation, state transitions, and branching paths.',
    stateSpaceType: 'PROBABILISTIC_COUNTERFACTUAL',
    primaryAbstraction: 'State transition forecasting, entropy minimization, risk tensors, simulation branches',
    invariantProperties: Object.freeze(['probabilistic_normalization', 'entropy_gradient_bounds', 'causal_branch_safety']),
  }),

  D7: Object.freeze({
    dimension: 'D7',
    name: 'Higher Abstraction',
    category: 'Meta-Ontology & Universal Nexus',
    tensorRank: 7,
    description: '7D meta-cognitive and universal nexus state space representing domain invariant axioms and cross-domain synthesis.',
    stateSpaceType: 'META_ONTOLOGY_NEXUS',
    primaryAbstraction: 'Universal conceptual graphs, meta-axioms, goal convergence, cross-domain functors',
    invariantProperties: Object.freeze(['axiomatic_consistency', 'functorial_coherence', 'universal_soundness']),
  }),
});
