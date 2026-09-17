/**
 * 3D Memory Studio — Funnel 86
 * Core: Experimental Spatial Scenes Generator (S)
 */

import { F86SceneType, F86SpatialScene, F86SpatialObject } from '../types';

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

export function createSpatialScene(type: F86SceneType): F86SpatialScene {
  const canonicalCoord: [number, number, number] = [5, 3, 6];
  let experimentalPositions: readonly number[][];

  switch (type) {
    case 'DIRECT':
      // Well distributed within observer's FOV
      experimentalPositions = [
        [0, 0, 0],
        [12, 0, 0],
        [-12, 0, 0],
        [0, 10, 0],
        [0, -10, 0],
        [8, 8, 0],
        [-8, -8, 0],
      ];
      break;

    case 'OCCLUSION':
      // Arranged directly along the central view ray at different depths
      experimentalPositions = [
        [0, 0, 0],
        [0, 0, 10],
        [0, 0, 20],
        [0, 0, 30],
        [15, 0, 0],
        [-15, 0, 0],
        [0, 15, 0],
      ];
      break;

    case 'PARTIAL_OCCLUSION':
      // Slightly offset in screen space so larger near object partially occludes far object
      experimentalPositions = [
        [0, 0, 20], // Near
        [2, 2, 0],  // Far with slight offset
        [-15, 0, 0],
        [15, 0, 0],
        [0, 15, 0],
        [0, -15, 0],
        [10, 10, 0],
      ];
      break;

    case 'OUTSIDE_FOV':
      // Objects positioned beyond FOV angles
      experimentalPositions = [
        [0, 0, 0],
        [120, 0, 0],
        [-120, 0, 0],
        [0, 100, 0],
        [0, -100, 0],
        [150, 150, 0],
        [-150, -150, 0],
      ];
      break;

    case 'BEHIND_OBSERVER':
      // Objects placed behind observer (z >= 40)
      experimentalPositions = [
        [0, 0, 0],
        [10, 0, 0],
        [0, 0, 50],  // Behind observer at z=40
        [0, 0, 70],  // Far behind
        [0, 10, 60], // Behind elevated
        [-10, 0, 0],
        [0, -10, 0],
      ];
      break;

    case 'DIMENSIONAL_Z4':
      // 4D space variations in W
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

  const objects: F86SpatialObject[] = CANONICAL_RESEARCH_OBJECTS.map((base, idx) => ({
    id: base.id,
    type: base.type,
    canonicalCoordinate: canonicalCoord,
    experimentalWorldPosition: Object.freeze(experimentalPositions[idx]),
    color: base.color,
    label: base.label,
    category: base.category,
  }));

  return Object.freeze({
    sceneId: `SCENE_${type}`,
    sceneType: type,
    isSynthetic: true,
    objects: Object.freeze(objects),
    description: `SYNTHETIC / EXPERIMENTAL SCENE: ${type}`,
  });
}
