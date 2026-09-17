/**
 * 3D Memory Studio — Funnel 87
 * Core: Spatial State Generator (S)
 */

import { F87ExperimentType, F87SpatialState, F87SpatialObject } from '../types';

export const CANONICAL_RESEARCH_OBJECTS: readonly {
  id: string;
  type: string;
  label: string;
  category: string;
  color: string;
}[] = [
  { id: 'STATE49:REC_W3C_LDP_CONTAINER', type: 'CORE_CONTAINER', label: 'W3C LDP Container', category: 'STANDARDS', color: '#06b6d4' },
  { id: 'STATE49:LLM_IETF_PROTOCOL_CODER_3B', type: 'PROTOCOL_CODER', label: 'IETF Protocol Coder', category: 'AI_MODEL', color: '#10b981' },
  { id: 'STATE49:REC_SCHEMA_ORG_CREATIVE_WORK', type: 'ONTOLOGY_SCHEMA', label: 'Schema Creative Work', category: 'ONTOLOGY', color: '#f59e0b' },
  { id: 'STATE49:REC_AI_MODEL_AUTHORIZED_EMBEDDINGS', type: 'EMBEDDING_CLUSTER', label: 'AI Auth Embeddings', category: 'SECURITY', color: '#a855f7' },
  { id: 'STATE49:LLM_OPEN_EMBEDDING_7B', type: 'NEURAL_EMBEDDER', label: 'Open Embedding 7B', category: 'AI_MODEL', color: '#ec4899' },
  { id: 'STATE49:LLM_W3C_ONTOLOGY_PARSER_8B', type: 'ONTOLOGY_REASONER', label: 'W3C Ontology Parser', category: 'ONTOLOGY', color: '#3b82f6' },
  { id: 'STATE49:REC_IETF_HTTP2_FRAMING', type: 'PROTOCOL_SPEC', label: 'IETF HTTP2 Framing', category: 'PROTOCOLS', color: '#14b8a6' },
];

export function createSpatialState(type: F87ExperimentType): F87SpatialState {
  const canonicalCoord: [number, number, number] = [5, 3, 6];
  let experimentalPositions: readonly number[][];

  switch (type) {
    case 'DEPTH_STACK':
      // Clear linear depth stack along Z from near to far
      experimentalPositions = [
        [0, 0, 20],  // Near 1 (depth=20 from z=40)
        [5, 0, 10],  // Near 2 (depth=30)
        [-5, 0, 0],  // Mid (depth=40)
        [10, 0, -10], // Mid-Far (depth=50)
        [-10, 0, -20], // Far (depth=60)
        [0, 8, -30],  // Far Elevated (depth=70)
        [0, -8, -40], // Deep Far (depth=80)
      ];
      break;

    case 'PARALLAX_X':
    case 'PARALLAX_Y':
    case 'ORBIT_PARALLAX':
    case 'MOTION_SEQUENCE':
    case 'MULTI_OBSERVER':
      // Pair of objects aligned along same vertical or horizontal slice with large depth difference
      // plus reference surrounding landmarks
      experimentalPositions = [
        [0, 0, 20],   // Near Foreground Node (Depth = 20)
        [0, 0, -25],  // Far Background Node (Depth = 65)
        [15, 5, 0],   // Lateral Right Reference
        [-15, 5, 0],  // Lateral Left Reference
        [0, 15, -10], // Top Landmark
        [10, -10, 10], // Lower Near Reference
        [-10, -10, -20], // Lower Far Reference
      ];
      break;

    case 'DEPTH_ORDER':
      // Strict co-linear depth column
      experimentalPositions = [
        [0, 0, 25],
        [0, 0, 15],
        [0, 0, 5],
        [0, 0, -5],
        [0, 0, -15],
        [0, 0, -25],
        [0, 0, -35],
      ];
      break;

    case 'DIMENSIONAL_PARALLAX':
      // 4D spatial coordinates with varying W
      experimentalPositions = [
        [0, 0, 20, 0],
        [0, 0, -25, 10],
        [15, 5, 0, -10],
        [-15, 5, 0, 20],
        [0, 15, -10, -20],
        [10, -10, 10, 30],
        [-10, -10, -20, -30],
      ];
      break;
  }

  const objects: F87SpatialObject[] = CANONICAL_RESEARCH_OBJECTS.map((base, idx) => ({
    id: base.id,
    type: base.type,
    canonicalCoordinate: canonicalCoord,
    experimentalWorldPosition: Object.freeze(experimentalPositions[idx]),
    color: base.color,
    label: base.label,
    category: base.category,
    isAnchor: idx === 0 || idx === 1,
  }));

  return Object.freeze({
    stateId: `STATE_F87_${type}`,
    experimentType: type,
    isSynthetic: true,
    objects: Object.freeze(objects),
    description: `SYNTHETIC / EXPERIMENTAL SPATIAL STATE: ${type}`,
  });
}
