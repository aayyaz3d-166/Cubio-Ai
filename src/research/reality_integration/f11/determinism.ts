/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel F11: Deterministic ID Generators & Checksum Engine (σ² = 0)
 *
 * Enforces strictly reproducible hashing and identification.
 */

import { WorldEntity, WorldRelation, Inference } from './types';

/**
 * Pure djb2-based deterministic hash function returning 8-character hex string.
 */
export function deterministicHash(input: string): string {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash + input.charCodeAt(i)) & 0xffffffff;
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function generateDeterministicEntityId(modelId: string, name: string, seq: number): string {
  const hash = deterministicHash(`${modelId}:${name}:${seq}`);
  return `WENT_${hash}`;
}

export function generateDeterministicRelationId(
  modelId: string,
  relType: string,
  srcId: string,
  tgtId: string,
  seq: number
): string {
  const hash = deterministicHash(`${modelId}:${relType}:${srcId}:${tgtId}:${seq}`);
  return `WREL_${hash}`;
}

export function generateDeterministicInferenceId(
  modelId: string,
  ruleId: string,
  seq: number
): string {
  const hash = deterministicHash(`${modelId}:${ruleId}:${seq}`);
  return `INF_${hash}`;
}

export function generateDeterministicQueryId(modelId: string, seq: number): string {
  const hash = deterministicHash(`${modelId}:QUERY:${seq}`);
  return `QRY_${hash}`;
}

export function generateDeterministicReasoningTraceId(queryId: string, seq: number): string {
  const hash = deterministicHash(`${queryId}:TRACE:${seq}`);
  return `TRACE_${hash}`;
}

export function generateDeterministicEvidenceId(
  sourceId: string,
  type: string,
  seq: number
): string {
  const hash = deterministicHash(`${sourceId}:${type}:${seq}`);
  return `EVID_${hash}`;
}

export function generateDeterministicConstraintId(modelId: string, seq: number): string {
  const hash = deterministicHash(`${modelId}:CST:${seq}`);
  return `CST_${hash}`;
}

export function generateDeterministicPlanId(modelId: string, goal: string, seq: number): string {
  const hash = deterministicHash(`${modelId}:${goal}:${seq}`);
  return `PLAN_F11_${hash}`;
}

export function generateDeterministicSnapshotId(modelId: string, version: number): string {
  const hash = deterministicHash(`${modelId}:VER_${version}`);
  return `SNAP_F11_${hash}`;
}

export function generateDeterministicLineageId(modelId: string, entityId: string): string {
  const hash = deterministicHash(`${modelId}:${entityId}:LINEAGE`);
  return `LIN_F11_${hash}`;
}

export function generateDeterministicCausalityId(modelId: string, seq: number): string {
  const hash = deterministicHash(`${modelId}:CAUSAL:${seq}`);
  return `CAUS_F11_${hash}`;
}

// ─── Checksum Computations ───

export function computeEntityChecksum(
  name: string,
  type: string,
  origin: string,
  coords?: readonly [number, number, number]
): string {
  const coordStr = coords ? coords.map((n) => n.toFixed(4)).join(',') : 'NO_COORDS';
  return `CS_ENT_${deterministicHash(`${name}:${type}:${origin}:${coordStr}`)}`;
}

export function computeRelationChecksum(
  srcId: string,
  tgtId: string,
  relType: string,
  confidence: number
): string {
  return `CS_REL_${deterministicHash(`${srcId}:${tgtId}:${relType}:${confidence.toFixed(4)}`)}`;
}

export function computeGraphChecksum(relations: readonly WorldRelation[]): string {
  if (relations.length === 0) return 'CS_GRAPH_EMPTY';
  const sorted = [...relations].sort((a, b) => a.relationId.localeCompare(b.relationId));
  const payload = sorted.map((r) => r.relationChecksum).join(';');
  return `CS_GRAPH_${deterministicHash(payload)}`;
}

export function computeInferenceChecksum(inferences: readonly Inference[]): string {
  if (inferences.length === 0) return 'CS_INF_EMPTY';
  const sorted = [...inferences].sort((a, b) => a.inferenceId.localeCompare(b.inferenceId));
  const payload = sorted.map((i) => i.inferenceChecksum).join(';');
  return `CS_INF_${deterministicHash(payload)}`;
}

export function computeWorldModelChecksum(
  entities: Readonly<Record<string, WorldEntity>>,
  relations: readonly WorldRelation[],
  version: number
): string {
  const entKeys = Object.keys(entities).sort();
  const entPayload = entKeys.map((k) => entities[k].entityChecksum).join('|');
  const relPayload = computeGraphChecksum(relations);
  return `CS_WMODEL_${deterministicHash(`V${version}:${entPayload}:${relPayload}`)}`;
}

export function computeExecutionHash(
  realityChecksum: string,
  modelChecksum: string,
  graphChecksum: string,
  inferenceChecksum: string
): string {
  return `SIG_F11_${deterministicHash(`${realityChecksum}:${modelChecksum}:${graphChecksum}:${inferenceChecksum}`)}`;
}
