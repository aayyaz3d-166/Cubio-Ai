/**
 * 3D Memory Studio — Funnel 88
 * Core: Information State & Spatial Configurations Generator (S)
 */

import { F88ExperimentType, F88SpatialState, F88SpatialObject } from '../types';

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

export function createInformationState(
  type: F88ExperimentType,
  variation = 0
): F88SpatialState {
  const canonicalCoord: [number, number, number] = [5, 3, 6];
  let experimentalPositions: readonly number[][];

  switch (type) {
    case 'UNIQUE_RECONSTRUCTION':
      // 2D planar layout with full visibility (zero Z ambiguity, zero occlusion)
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
      // Identical (X, Y) layout across variations, but radically different Z depths!
      // Variation 0: Z = [0, 0, 0, 0, 0, 0, 0]
      // Variation 1: Z = [-20, 10, -15, 25, -5, 30, -10]
      // Variation 2: Z = [30, -25, 20, -10, 15, -30, 5]
      if (variation === 1) {
        experimentalPositions = [
          [-15, 0, -20],
          [0, 0, 10],
          [15, 0, -15],
          [0, 15, 25],
          [0, -15, -5],
          [10, 10, 30],
          [-10, -10, -10],
        ];
      } else if (variation === 2) {
        experimentalPositions = [
          [-15, 0, 30],
          [0, 0, -25],
          [15, 0, 20],
          [0, 15, -10],
          [0, -15, 15],
          [10, 10, -30],
          [-10, -10, 5],
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

    case 'PERSPECTIVE_AMBIGUITY':
      // Object at [x, y, z] scaled vs Object at [2x, 2y, 2z] producing identical ray
      if (variation === 1) {
        experimentalPositions = [
          [0, 0, 10], // Near
          [10, 5, 10],
          [-10, 5, 10],
          [0, 10, 10],
          [0, -10, 10],
          [10, -10, 10],
          [-10, -10, 10],
        ];
      } else {
        experimentalPositions = [
          [0, 0, 20], // Farther
          [10, 5, 20],
          [-10, 5, 20],
          [0, 10, 20],
          [0, -10, 20],
          [10, -10, 20],
          [-10, -10, 20],
        ];
      }
      break;

    case 'OCCLUSION_LOSS':
      // Target object hidden completely behind foreground object
      experimentalPositions = [
        [0, 0, 20],  // Front Occluder
        [0, 0, -10], // Hidden Behind Occluder (Same Ray!)
        [15, 0, 0],  // Visible Lateral
        [-15, 0, 0], // Visible Lateral
        [0, 15, 0],  // Visible Top
        [0, -15, 0], // Visible Bottom
        [10, 10, 0], // Visible Diagonal
      ];
      break;

    case 'FOV_LOSS':
      // Objects inside FOV are identical, but objects outside FOV vary!
      if (variation === 1) {
        experimentalPositions = [
          [0, 0, 0],     // Inside FOV
          [10, 0, 0],    // Inside FOV
          [-10, 0, 0],   // Inside FOV
          [150, 0, 0],   // Outside FOV (Variant 1: +150)
          [-150, 0, 0],  // Outside FOV
          [0, 150, 0],   // Outside FOV
          [0, -150, 0],  // Outside FOV
        ];
      } else {
        experimentalPositions = [
          [0, 0, 0],     // Inside FOV
          [10, 0, 0],    // Inside FOV
          [-10, 0, 0],   // Inside FOV
          [250, 50, 0],  // Outside FOV (Variant 0: +250)
          [-250, -50, 0],// Outside FOV
          [0, 250, 0],   // Outside FOV
          [0, -250, 0],  // Outside FOV
        ];
      }
      break;

    case 'PROJECTION_COLLAPSE':
    case 'EQUIVALENCE_CLASSES':
      // 4D space variations in W
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
    default:
      experimentalPositions = [
        [0, 0, 15],
        [10, 5, 0],
        [-10, 5, -10],
        [0, 12, 5],
        [0, -12, -5],
        [8, -8, 20],
        [-8, 8, -20],
      ];
      break;
  }

  const objects: F88SpatialObject[] = CANONICAL_RESEARCH_OBJECTS.map((base, idx) => ({
    id: base.id,
    type: base.type,
    canonicalCoordinate: canonicalCoord,
    experimentalWorldPosition: Object.freeze(experimentalPositions[idx]),
    color: base.color,
    label: base.label,
    category: base.category,
  }));

  return Object.freeze({
    stateId: `STATE_F88_${type}_VAR${variation}`,
    experimentType: type,
    isSynthetic: true,
    objects: Object.freeze(objects),
    description: `SYNTHETIC / EXPERIMENTAL INFORMATION STATE: ${type} (Var ${variation})`,
  });
}
