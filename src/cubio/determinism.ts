/**
 * CubiO — Universal Spatial Operating Environment
 * Deterministic Engine & Initial Mock Generator
 */

import {
  CubiOStudioState,
  CubiOStateNode,
  CubiOMemoryNode,
  CubiOHarmonic369,
  CubiOIntelligenceQuery,
  CubiONetworkPeer,
  CubiOFileNode,
  CubiOActivityLogEntry,
} from './types';
import { CubiOState } from './state/types';
import { CubiOStateFactory } from './state/stateEngine';

export function deterministicCubiOHash(input: string): string {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash + input.charCodeAt(i)) & 0xffffffff;
  }
  return `0x${(hash >>> 0).toString(16).padStart(8, '0').toUpperCase()}`;
}

export function generateInitialCubiOState(): CubiOStudioState {
  const now = Date.now();

  const rel1 = CubiOStateFactory.createRelationship('STATE_001_GENESIS', 'STATE_002_TRIADIC', 'PARENT_OF', 1.0);
  const rel2 = CubiOStateFactory.createRelationship('STATE_002_TRIADIC', 'STATE_003_HYPERCUBE', 'RESONATES_WITH', 0.95);

  const memRef1 = CubiOStateFactory.createMemoryRef('spatial.anchor.cube_origin', 'SPATIAL', 9);
  const memRef2 = CubiOStateFactory.createMemoryRef('episodic.core.boot_sequence', 'EPISODIC', 6);
  const memRef3 = CubiOStateFactory.createMemoryRef('holographic.369.resonance_field', 'HOLOGRAPHIC', 3);

  const s1: CubiOState = CubiOStateFactory.createState(
    'Genesis Spatial Singularity',
    [0, 0, 0],
    'D3',
    { entropy: 0.012, resonanceFrequency: 369.0, status: 'ACTIVE', scale: 1.0 },
    [rel1],
    [memRef1],
    null,
    ['STATE_002_TRIADIC'],
    'STATE_001_GENESIS'
  );

  const s2: CubiOState = CubiOStateFactory.createState(
    'Triadic Harmonic Manifold',
    [1.5, 3.0, 4.5, 0.0],
    'D4',
    { entropy: 0.045, resonanceFrequency: 432.0, status: 'BRANCHED', scale: 1.25 },
    [rel2],
    [memRef2],
    'STATE_001_GENESIS',
    ['STATE_003_HYPERCUBE'],
    'STATE_002_TRIADIC'
  );

  const s3: CubiOState = CubiOStateFactory.createState(
    '5D Tesseract Projection Node',
    [0, 5, 0, 1.0, 0.5],
    'D5',
    { entropy: 0.089, resonanceFrequency: 528.0, status: 'ARCHIVED', scale: 2.0 },
    [],
    [memRef3],
    'STATE_002_TRIADIC',
    [],
    'STATE_003_HYPERCUBE'
  );

  const states: CubiOState[] = [s1, s2, s3];

  const memories: CubiOMemoryNode[] = [
    {
      memoryId: 'MEM_01_SPATIAL_ANCHOR',
      key: 'spatial.anchor.cube_origin',
      type: 'SPATIAL',
      dimension: 'D3',
      resonanceIndex: 9,
      payload: { x: 0, y: 0, z: 0, rotationVector: [0, 1, 0] },
      checksum: deterministicCubiOHash('MEM_SPATIAL_ANCHOR'),
      timestamp: now - 3200000,
    },
    {
      memoryId: 'MEM_02_EPISODIC_BOOT',
      key: 'episodic.core.boot_sequence',
      type: 'EPISODIC',
      dimension: 'D3',
      resonanceIndex: 6,
      payload: { initTimeMs: 142, subsystemsReady: 10, status: 'ALL_ENGINES_NOMINAL' },
      checksum: deterministicCubiOHash('MEM_EPISODIC_BOOT'),
      timestamp: now - 2800000,
    },
    {
      memoryId: 'MEM_03_HOLOGRAPHIC_VORTEX',
      key: 'holographic.369.resonance_field',
      type: 'HOLOGRAPHIC',
      dimension: 'D4',
      resonanceIndex: 3,
      payload: { fluxRatio: 1.618, harmonicTiers: [3, 6, 9, 12, 18, 24, 27] },
      checksum: deterministicCubiOHash('MEM_HOLOGRAPHIC_VORTEX'),
      timestamp: now - 1200000,
    },
  ];

  const harmonic: CubiOHarmonic369 = {
    triad: [3, 6, 9],
    vortexState: 9,
    harmonicFlux: 0.963,
    phaseShift: 36.9,
    quantumPolarity: 1.0,
    resonanceScore: 99.8,
    activeFrequencyHz: 369.0,
  };

  const queries: CubiOIntelligenceQuery[] = [
    {
      queryId: 'QRY_001_TOPOLOGY',
      prompt: 'Verify 3D to 4D rotational symmetry of the central hypercube.',
      reasoningSteps: [
        'Step 1: Ingest Central Cube vertices (8 spatial nodes).',
        'Step 2: Apply 3-6-9 harmonic rotation matrix along W-axis.',
        'Step 3: Evaluate geometric projection in D4 manifold space.',
        'Step 4: Confirm zero dimensional torsion (ΔTorsion = 0).',
      ],
      inferredConclusion: 'Central hypercube preserves 4D rotational invariance with 99.9% topological coherence.',
      confidence: 0.999,
      status: 'RESOLVED',
      timestamp: now - 500000,
    },
    {
      queryId: 'QRY_002_PREDICTION',
      prompt: 'Predict state entropy upon shifting to Dimension D7.',
      reasoningSteps: [
        'Step 1: Compute dimensional manifold expansion tensor.',
        'Step 2: Trace memory recall across 7 hyper-slices.',
        'Step 3: Measure quantum harmonic dissipation.',
      ],
      inferredConclusion: 'State entropy will remain constrained below 0.095 with active 369 resonance lock.',
      confidence: 0.984,
      status: 'RESOLVED',
      timestamp: now - 200000,
    },
  ];

  const peers: CubiONetworkPeer[] = [
    {
      peerId: 'NODE_ALPHA_01',
      nodeName: 'CubiO-Core-Tokyo',
      address: '10.0.36.91:8080',
      latencyMs: 14,
      status: 'CONNECTED',
      syncedBlocks: 3690,
    },
    {
      peerId: 'NODE_BETA_02',
      nodeName: 'CubiO-Hyper-Frankfurt',
      address: '10.0.36.92:8080',
      latencyMs: 28,
      status: 'CONNECTED',
      syncedBlocks: 3690,
    },
    {
      peerId: 'NODE_GAMMA_03',
      nodeName: 'CubiO-Quantum-SanFrancisco',
      address: '10.0.36.93:8080',
      latencyMs: 42,
      status: 'SYNCHRONIZING',
      syncedBlocks: 3684,
    },
  ];

  const files: CubiOFileNode[] = [
    {
      fileId: 'FILE_01',
      cid: 'QmCubiO369GenesisTesseractBlockV1',
      name: 'genesis_central_cube.obj',
      sizeBytes: 1048576,
      dimension: 'D3',
      type: 'SPATIAL_OBJECT',
      updatedAt: now - 4000000,
    },
    {
      fileId: 'FILE_02',
      cid: 'QmCubiOStateSnapshotD4Resonance',
      name: 'snapshot_d4_resonance.cubio',
      sizeBytes: 524288,
      dimension: 'D4',
      type: 'STATE_SNAPSHOT',
      updatedAt: now - 1500000,
    },
    {
      fileId: 'FILE_03',
      cid: 'QmCubiONeuralSpatialInferenceV3',
      name: 'spatial_intelligence_weights.bin',
      sizeBytes: 4194304,
      dimension: 'D5',
      type: 'NEURAL_WEIGHT',
      updatedAt: now - 800000,
    },
  ];

  const activityLogs: CubiOActivityLogEntry[] = [
    {
      logId: 'LOG_01',
      timestamp: now - 3600000,
      level: 'SUCCESS',
      subsystem: 'CORE',
      message: 'CubiO Core Kernel initialized with status ONLINE.',
    },
    {
      logId: 'LOG_02',
      timestamp: now - 3400000,
      level: 'RESONANCE',
      subsystem: 'ENGINE_369',
      message: '369 Harmonic Engine locked to fundamental frequency 369.00 Hz.',
    },
    {
      logId: 'LOG_03',
      timestamp: now - 3000000,
      level: 'INFO',
      subsystem: 'DIMENSION',
      message: 'Dimension Engine mapped coordinates across manifolds D2 through D7.',
    },
    {
      logId: 'LOG_04',
      timestamp: now - 2500000,
      level: 'INFO',
      subsystem: 'MEMORY',
      message: 'Memory Engine cached 3 initial holographic spatial records.',
    },
    {
      logId: 'LOG_05',
      timestamp: now - 1800000,
      level: 'SUCCESS',
      subsystem: 'NETWORK',
      message: 'P2P Mesh connection established with 3 remote cluster nodes.',
    },
    {
      logId: 'LOG_06',
      timestamp: now - 1200000,
      level: 'INFO',
      subsystem: 'FS',
      message: 'CubiO Virtual File System mounted CAS block root.',
    },
    {
      logId: 'LOG_07',
      timestamp: now - 600000,
      level: 'SUCCESS',
      subsystem: 'INTELLIGENCE',
      message: 'Spatial Intelligence Engine executed topological proof QRY_001_TOPOLOGY.',
    },
  ];

  return {
    coreStatus: 'ONLINE',
    activeDimension: 'D3',
    activeStateId: 'STATE_001_GENESIS',
    states: Object.freeze(states),
    memories: Object.freeze(memories),
    harmonic: Object.freeze(harmonic),
    queries: Object.freeze(queries),
    peers: Object.freeze(peers),
    files: Object.freeze(files),
    activityLogs: Object.freeze(activityLogs),
    settings: Object.freeze({
      theme: 'CYBER_DARK',
      renderQuality: 'HIGH',
      enableHolographicGrid: true,
      autoRotateCube: true,
      resonanceFrequencyHz: 369.0,
      activeP2PNetwork: true,
    }),
    selectedCubeFace: null,
    activeTabLeft: 'STATES',
    activeTabRight: 'INTELLIGENCE',
  };
}
