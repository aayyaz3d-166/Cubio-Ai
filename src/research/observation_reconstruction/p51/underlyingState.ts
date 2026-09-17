/**
 * 3D Memory Studio — Phase 5: Observation & Reconstruction
 * P5.1: Underlying State Factory
 *
 * Creates the canonical immutable underlying reality X that all observers share.
 * Uses the same 7 GREEN authoritative records from the existing funnel49 fixture.
 */

import { P51UnderlyingState, P51AuthoritativeRecord } from './types';

function simpleHash(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

const CANONICAL_RECORDS: readonly P51AuthoritativeRecord[] = Object.freeze([
  {
    id: 'STATE49:REC_W3C_LDP_CONTAINER',
    entityName: 'W3C LDP Container',
    canonicalPosition: [5, 3, 6] as const,
    category: 'STANDARDS',
    color: '#06b6d4',
    properties: { domain: 'w3.org', type: 'CORE_CONTAINER' },
  },
  {
    id: 'STATE49:LLM_IETF_PROTOCOL_CODER_3B',
    entityName: 'IETF Protocol Coder 3B',
    canonicalPosition: [5, 3, 6] as const,
    category: 'AI_MODEL',
    color: '#06b6d4',
    properties: { domain: 'ietf.org', type: 'PROTOCOL_CODER', params: '3B' },
  },
  {
    id: 'STATE49:REC_SCHEMA_ORG_CREATIVE_WORK',
    entityName: 'Schema.org Creative Work',
    canonicalPosition: [5, 3, 6] as const,
    category: 'ONTOLOGY',
    color: '#06b6d4',
    properties: { domain: 'schema.org', type: 'ONTOLOGY_SCHEMA' },
  },
  {
    id: 'STATE49:REC_AI_MODEL_AUTHORIZED_EMBEDDINGS',
    entityName: 'AI Authorized Embeddings',
    canonicalPosition: [5, 3, 6] as const,
    category: 'SECURITY',
    color: '#06b6d4',
    properties: { domain: 'internal', type: 'EMBEDDING_CLUSTER' },
  },
  {
    id: 'STATE49:LLM_OPEN_EMBEDDING_7B',
    entityName: 'Open Embedding 7B',
    canonicalPosition: [5, 3, 6] as const,
    category: 'AI_MODEL',
    color: '#06b6d4',
    properties: { domain: 'open-models', type: 'NEURAL_EMBEDDER', params: '7B' },
  },
  {
    id: 'STATE49:LLM_W3C_ONTOLOGY_PARSER_8B',
    entityName: 'W3C Ontology Parser 8B',
    canonicalPosition: [5, 3, 6] as const,
    category: 'ONTOLOGY',
    color: '#06b6d4',
    properties: { domain: 'w3.org', type: 'ONTOLOGY_REASONER', params: '8B' },
  },
  {
    id: 'STATE49:REC_IETF_HTTP2_FRAMING',
    entityName: 'IETF HTTP/2 Framing',
    canonicalPosition: [5, 3, 6] as const,
    category: 'PROTOCOLS',
    color: '#06b6d4',
    properties: { domain: 'ietf.org', type: 'PROTOCOL_SPEC' },
  },
]);

export function createCanonicalUnderlyingState(): P51UnderlyingState {
  const serialized = JSON.stringify(CANONICAL_RECORDS);
  const checksum = simpleHash(serialized);

  return Object.freeze({
    stateId: 'P51_UNDERLYING_REALITY_X',
    checksum,
    records: CANONICAL_RECORDS,
    timestamp: 0,
  });
}

export function computeStateChecksum(state: P51UnderlyingState): string {
  return simpleHash(JSON.stringify(state.records));
}

/**
 * Creates a variant underlying state for ambiguity testing.
 * The variant has different internal properties but produces
 * identical 3D canonical coordinates, testing whether projection
 * can distinguish between them.
 */
export function createVariantUnderlyingState(variantId: string): P51UnderlyingState {
  const variantRecords: P51AuthoritativeRecord[] = CANONICAL_RECORDS.map((r) => ({
    ...r,
    properties: { ...r.properties, variant: variantId, hiddenPayload: `secret_${variantId}_${r.id}` },
  }));

  const serialized = JSON.stringify(variantRecords);
  return Object.freeze({
    stateId: `P51_VARIANT_${variantId}`,
    checksum: simpleHash(serialized),
    records: Object.freeze(variantRecords),
    timestamp: 0,
  });
}
