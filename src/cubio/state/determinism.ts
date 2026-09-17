/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 2: State Model Determinism & Checksums
 *
 * Enforces strict reproducible checksums and IDs across all state universe mutations.
 * Invariant: σ² = 0 across all executions.
 */

import { CubiOState, CubiORelationship, CubiOMemoryRef } from './types';

export function deterministicHash(input: string): string {
  let h1 = 0xdeadbeef ^ 0;
  let h2 = 0x41c6ce57 ^ 0;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const hashVal = 4294967296 * (2097151 & h2) + (h1 >>> 0);
  return `0x${hashVal.toString(16).padStart(16, '0').toUpperCase()}`;
}

export function generateDeterministicStateId(nameOrPrefix: string, seq = 0): string {
  const clean = nameOrPrefix.replace(/[^a-zA-Z0-9_-]/g, '_').toUpperCase();
  const seed = `${clean}_${seq}`;
  return `ST_${clean}_${deterministicHash(seed).slice(2, 10)}`;
}

export function generateDeterministicRelationshipId(
  sourceId: string,
  targetId: string,
  type: string
): string {
  const seed = `${sourceId}:${type}:${targetId}`;
  return `REL_${deterministicHash(seed).slice(2, 12)}`;
}

export function computeRelationshipChecksum(
  targetStateId: string,
  type: string,
  weight: number
): string {
  return deterministicHash(`${targetStateId}:${type}:${weight.toFixed(4)}`);
}

export function computeMemoryRefChecksum(key: string, type: string, resonanceIndex: number): string {
  return deterministicHash(`${key}:${type}:${resonanceIndex}`);
}

export function computeStateChecksum(
  id: string,
  position: readonly number[],
  dimension: string,
  properties: Readonly<Record<string, any>>,
  relationships: readonly CubiORelationship[],
  memory: readonly CubiOMemoryRef[],
  parent: string | null,
  children: readonly string[]
): string {
  // Sort properties and relationships for strict canonical determinism
  const sortedPropKeys = Object.keys(properties).sort();
  const propRepr = sortedPropKeys.map((k) => `${k}=${JSON.stringify(properties[k])}`).join(';');
  const relRepr = relationships.map((r) => `${r.targetStateId}:${r.type}:${r.weight}`).sort().join(';');
  const memRepr = memory.map((m) => `${m.key}:${m.type}:${m.resonanceIndex}`).sort().join(';');
  const childRepr = [...children].sort().join(',');

  const raw = [
    `ID:${id}`,
    `POS:[${position.map((p) => p.toFixed(4)).join(',')}]`,
    `DIM:${dimension}`,
    `PROPS:${propRepr}`,
    `RELS:${relRepr}`,
    `MEM:${memRepr}`,
    `PARENT:${parent || 'NULL'}`,
    `CHILDREN:${childRepr}`,
  ].join('|');

  return deterministicHash(raw);
}

export function computeUniverseChecksum(states: Readonly<Record<string, CubiOState>>): string {
  const sortedIds = Object.keys(states).sort();
  const raw = sortedIds.map((id) => `${id}:${states[id].checksum}`).join('||');
  return `0xUNIV_${deterministicHash(raw).slice(2, 14)}`;
}
