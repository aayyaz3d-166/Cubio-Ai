/**
 * 3D Memory Studio — Funnel 85
 * Core: Experimental Spatial Configuration Generator (S)
 *
 * Distinguishes Immutable Reality X from Synthetic Experimental Spatial Arrangements.
 */

import { F85ExperimentType, F85SpatialConfiguration, F85SpatialObject } from '../types';

export const CANONICAL_7_OBJECTS_BASE: readonly {
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

export function createSpatialConfiguration(type: F85ExperimentType): F85SpatialConfiguration {
  const canonicalCoord: [number, number, number] = [5, 3, 6];

  let experimentalPositions: readonly number[][];

  switch (type) {
    case 'SAME_POSITION':
      experimentalPositions = [
        [5, 3, 6],
        [5, 3, 6],
        [5, 3, 6],
        [5, 3, 6],
        [5, 3, 6],
        [5, 3, 6],
        [5, 3, 6],
      ];
      break;

    case 'X_SEPARATION':
      experimentalPositions = [
        [-30, 0, 0],
        [-20, 0, 0],
        [-10, 0, 0],
        [0, 0, 0],
        [10, 0, 0],
        [20, 0, 0],
        [30, 0, 0],
      ];
      break;

    case 'Y_SEPARATION':
      experimentalPositions = [
        [0, -30, 0],
        [0, -20, 0],
        [0, -10, 0],
        [0, 0, 0],
        [0, 10, 0],
        [0, 20, 0],
        [0, 30, 0],
      ];
      break;

    case 'Z_DEPTH':
      experimentalPositions = [
        [0, 0, -30],
        [0, 0, -20],
        [0, 0, -10],
        [0, 0, 0],
        [0, 0, 10],
        [0, 0, 20],
        [0, 0, 30],
      ];
      break;

    case 'CUBE_3D':
      experimentalPositions = [
        [0, 0, 0],
        [10, 0, 0],
        [0, 10, 0],
        [0, 0, 10],
        [10, 10, 0],
        [10, 0, 10],
        [0, 10, 10],
      ];
      break;

    case 'DIMENSIONAL_Z4':
      experimentalPositions = [
        [0, 0, 0, 0],
        [10, 0, 0, 10],
        [0, 10, 0, -10],
        [0, 0, 10, 20],
        [10, 10, 0, -20],
        [10, 0, 10, 30],
        [0, 10, 10, -30],
      ];
      break;
  }

  const objects: F85SpatialObject[] = CANONICAL_7_OBJECTS_BASE.map((base, idx) => ({
    id: base.id,
    type: base.type,
    canonicalCoordinate: canonicalCoord,
    experimentalWorldPosition: Object.freeze(experimentalPositions[idx]),
    color: base.color,
    label: base.label,
    category: base.category,
  }));

  return Object.freeze({
    configId: `CONFIG_${type}`,
    experimentType: type,
    isSynthetic: true,
    objects: Object.freeze(objects),
    description: `SYNTHETIC / EXPERIMENTAL SPATIAL CONFIGURATION: ${type}`,
  });
}
