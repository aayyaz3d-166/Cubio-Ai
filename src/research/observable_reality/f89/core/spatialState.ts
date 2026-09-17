/**
 * 3D Memory Studio — Funnel 89
 * Core: Spatial State Generator (S)
 */

import { F89ExperimentType, F89SpatialState, F89SpatialObject } from '../types';

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

export function createSpatialState(
  type: F89ExperimentType,
  variation = 0
): F89SpatialState {
  const canonicalCoord: [number, number, number] = [5, 3, 6];
  let experimentalPositions: readonly number[][];

  switch (type) {
    case 'COMPLETE_OBSERVATION':
      // 7 well-separated objects in full view without occlusions or depth overlaps
      experimentalPositions = [
        [-20, 10, 0],
        [0, 10, 0],
        [20, 10, 0],
        [-20, -10, 0],
        [0, -10, 0],
        [20, -10, 0],
        [0, 0, 0],
      ];
      break;

    case 'DEPTH_AMBIGUITY':
      // Identical (X, Y) layout across variations, but radically different Z depths
      if (variation === 1) {
        experimentalPositions = [
          [-15, 0, -20],
          [0, 0, 15],
          [15, 0, -10],
          [0, 15, 25],
          [0, -15, -5],
          [10, 10, 30],
          [-10, -10, -15],
        ];
      } else if (variation === 2) {
        experimentalPositions = [
          [-15, 0, 25],
          [0, 0, -20],
          [15, 0, 15],
          [0, 15, -15],
          [0, -15, 20],
          [10, 10, -25],
          [-10, -10, 10],
        ];
      } else {
        experimentalPositions = [
          [-15, 0, 0],
          [0, 0, 0],
          [15, 0, 0],
          [0, 15, 0],
          [0, -15, 0],
          [10, 10, 0],
          [-10, -10, 0],
        ];
      }
      break;

    case 'OCCLUDED_OBJECT':
      // Object 1 hidden behind object 0 along the same central view ray
      experimentalPositions = [
        [0, 0, 20],  // Foreground Occluder
        [0, 0, -10], // Background Hidden Object
        [15, 5, 0],  // Lateral Right
        [-15, 5, 0], // Lateral Left
        [0, 15, 0],  // Top Node
        [0, -15, 0], // Bottom Node
        [10, -10, 0],// Diagonal Node
      ];
      break;

    case 'OUTSIDE_FOV_OBJECT':
      // 3 objects inside FOV, 4 objects far outside FOV (>30 deg)
      experimentalPositions = [
        [0, 0, 0],     // Inside FOV
        [10, 0, 0],    // Inside FOV
        [-10, 0, 0],   // Inside FOV
        [150, 0, 0],   // Outside FOV
        [-150, 0, 0],  // Outside FOV
        [0, 150, 0],   // Outside FOV
        [0, -150, 0],  // Outside FOV
      ];
      break;

    case 'DIMENSIONAL_LOSS':
      // 4D coordinates with non-zero W components
      experimentalPositions = [
        [0, 0, 0, 0],
        [10, 0, 0, 10],
        [-10, 0, 0, -10],
        [0, 10, 0, 20],
        [0, -10, 0, -20],
        [10, 10, 0, 30],
        [-10, -10, 0, -30],
      ];
      break;

    case 'MULTI_OBSERVER':
    case 'OBSERVER_MOVEMENT':
    case 'OBSERVATION_HISTORY':
    default:
      // Rich 3D layout featuring near/far depth, lateral separation, and mutual visibility
      experimentalPositions = [
        [0, 0, 15],
        [12, 5, -5],
        [-12, 5, -15],
        [0, 14, 5],
        [0, -14, -10],
        [8, -8, 20],
        [-8, 8, -20],
      ];
      break;
  }

  const objects: F89SpatialObject[] = CANONICAL_RESEARCH_OBJECTS.map((base, idx) => ({
    id: base.id,
    type: base.type,
    canonicalCoordinate: canonicalCoord,
    experimentalWorldPosition: Object.freeze(experimentalPositions[idx]),
    color: base.color,
    label: base.label,
    category: base.category,
  }));

  return Object.freeze({
    stateId: `STATE_F89_${type}_VAR${variation}`,
    experimentType: type,
    isSynthetic: true,
    objects: Object.freeze(objects),
    description: `SYNTHETIC / EXPERIMENTAL SPATIAL STATE: ${type} (Var ${variation})`,
  });
}
