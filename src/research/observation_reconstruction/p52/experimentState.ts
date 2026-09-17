/**
 * 3D Memory Studio — Phase 5: Observation & Reconstruction
 * Funnel P5.2: Underlying Experiment State Factory
 *
 * Provides the immutable underlying reality X (7 canonical records preserving [5, 3, 6])
 * and controlled test states for ambiguity resolution and payload non-recoverability tests.
 */

import { UnderlyingState, StructuralRecord } from './types';

export function simpleHash(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export const CANONICAL_P52_RECORDS: readonly StructuralRecord[] = Object.freeze([
  {
    id: 'STATE49:REC_W3C_LDP_CONTAINER',
    entityName: 'W3C LDP Container',
    canonicalPosition: [5, 3, 6] as const,
    category: 'STANDARDS',
    color: '#06b6d4',
    relationships: ['STATE49:REC_IETF_HTTP2_FRAMING'],
    internalPayload: 'PAYLOAD_W3C_CONTAINER_V1_SECRET',
  },
  {
    id: 'STATE49:LLM_IETF_PROTOCOL_CODER_3B',
    entityName: 'IETF Protocol Coder 3B',
    canonicalPosition: [5, 3, 6] as const,
    category: 'AI_MODEL',
    color: '#06b6d4',
    relationships: ['STATE49:REC_IETF_HTTP2_FRAMING'],
    internalPayload: 'PAYLOAD_LLM_CODER_WEIGHTS_HASH_99',
  },
  {
    id: 'STATE49:REC_SCHEMA_ORG_CREATIVE_WORK',
    entityName: 'Schema.org Creative Work',
    canonicalPosition: [5, 3, 6] as const,
    category: 'ONTOLOGY',
    color: '#06b6d4',
    relationships: ['STATE49:LLM_W3C_ONTOLOGY_PARSER_8B'],
    internalPayload: 'PAYLOAD_SCHEMA_VOCAB_ENCODING',
  },
  {
    id: 'STATE49:REC_AI_MODEL_AUTHORIZED_EMBEDDINGS',
    entityName: 'AI Authorized Embeddings',
    canonicalPosition: [5, 3, 6] as const,
    category: 'SECURITY',
    color: '#06b6d4',
    relationships: ['STATE49:LLM_OPEN_EMBEDDING_7B'],
    internalPayload: 'PAYLOAD_AUTH_EMBEDDING_SIGNATURE_KEY',
  },
  {
    id: 'STATE49:LLM_OPEN_EMBEDDING_7B',
    entityName: 'Open Embedding 7B',
    canonicalPosition: [5, 3, 6] as const,
    category: 'AI_MODEL',
    color: '#06b6d4',
    relationships: ['STATE49:REC_AI_MODEL_AUTHORIZED_EMBEDDINGS'],
    internalPayload: 'PAYLOAD_OPEN_EMBED_TENSOR_STATE',
  },
  {
    id: 'STATE49:LLM_W3C_ONTOLOGY_PARSER_8B',
    entityName: 'W3C Ontology Parser 8B',
    canonicalPosition: [5, 3, 6] as const,
    category: 'ONTOLOGY',
    color: '#06b6d4',
    relationships: ['STATE49:REC_SCHEMA_ORG_CREATIVE_WORK'],
    internalPayload: 'PAYLOAD_ONTOLOGY_AST_TREE_CACHE',
  },
  {
    id: 'STATE49:REC_IETF_HTTP2_FRAMING',
    entityName: 'IETF HTTP/2 Framing',
    canonicalPosition: [5, 3, 6] as const,
    category: 'PROTOCOLS',
    color: '#06b6d4',
    relationships: ['STATE49:REC_W3C_LDP_CONTAINER', 'STATE49:LLM_IETF_PROTOCOL_CODER_3B'],
    internalPayload: 'PAYLOAD_HTTP2_BINARY_STREAM_SPEC',
  },
]);

export function createCanonicalUnderlyingState(): UnderlyingState {
  const serialized = JSON.stringify(CANONICAL_P52_RECORDS);
  const checksum = simpleHash(serialized);

  return Object.freeze({
    stateId: 'P52_CANONICAL_REALITY_X',
    checksum,
    records: CANONICAL_P52_RECORDS,
    timestamp: 0,
  });
}

export function computeStateChecksum(state: UnderlyingState): string {
  return simpleHash(JSON.stringify(state.records));
}

/**
 * Creates two test states differing ONLY in internal payloads (not in geometry/positions).
 */
export function createPayloadVariantStates(): { stateA: UnderlyingState; stateB: UnderlyingState } {
  const recordsA: StructuralRecord[] = CANONICAL_P52_RECORDS.map((r) => ({
    ...r,
    internalPayload: `PAYLOAD_SECRET_A_${r.id}`,
  }));
  const recordsB: StructuralRecord[] = CANONICAL_P52_RECORDS.map((r) => ({
    ...r,
    internalPayload: `PAYLOAD_SECRET_B_${r.id}`,
  }));

  const stateA: UnderlyingState = Object.freeze({
    stateId: 'P52_PAYLOAD_TEST_A',
    checksum: simpleHash(JSON.stringify(recordsA)),
    records: Object.freeze(recordsA),
    timestamp: 0,
  });

  const stateB: UnderlyingState = Object.freeze({
    stateId: 'P52_PAYLOAD_TEST_B',
    checksum: simpleHash(JSON.stringify(recordsB)),
    records: Object.freeze(recordsB),
    timestamp: 0,
  });

  return { stateA, stateB };
}

/**
 * Creates two states differing in depth (Z coordinate) to test spatial ambiguity under dimensional collapse.
 */
export function createSpatialAmbiguityStates(): { stateNear: UnderlyingState; stateFar: UnderlyingState } {
  const recordsNear: StructuralRecord[] = [
    {
      id: 'AMB_RECORD_1',
      entityName: 'Spatial Node Alpha',
      canonicalPosition: [5, 3, 6] as const,
      category: 'TEST',
      color: '#06b6d4',
      relationships: [],
      internalPayload: 'PAYLOAD_NEAR',
    },
  ];

  const recordsFar: StructuralRecord[] = [
    {
      id: 'AMB_RECORD_1',
      entityName: 'Spatial Node Alpha',
      canonicalPosition: [5, 3, 30] as const, // Different Z (30 vs 6)
      category: 'TEST',
      color: '#06b6d4',
      relationships: [],
      internalPayload: 'PAYLOAD_FAR',
    },
  ];

  const stateNear: UnderlyingState = Object.freeze({
    stateId: 'P52_SPATIAL_NEAR_Z6',
    checksum: simpleHash(JSON.stringify(recordsNear)),
    records: Object.freeze(recordsNear),
    timestamp: 0,
  });

  const stateFar: UnderlyingState = Object.freeze({
    stateId: 'P52_SPATIAL_FAR_Z30',
    checksum: simpleHash(JSON.stringify(recordsFar)),
    records: Object.freeze(recordsFar),
    timestamp: 0,
  });

  return { stateNear, stateFar };
}
