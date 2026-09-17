/**
 * 3D Memory Studio — Funnel 49
 * Dimensional State Normalization & Adapters
 *
 * Unifies diverse research records, standards, and LLM models into
 * first-class DimensionalInformationState objects with F47 boundary enforcement.
 */

import {
  DimensionalInformationState,
  DimensionalCoordinateMap,
} from './types';
import { RawInputRecord, ClassifiedRecord } from '../funnel47/types';
import { classifyRecord } from '../funnel47/classifier';
import { guard369Encoding, guardDimensionalProjection } from '../funnel47/guards';
import { LLMModelRecord } from '../funnel48/types';
import { adaptLLMRecordToRawInput } from '../funnel48/adapters';

const SUPPORTED_DIMENSIONS = [1, 2, 3, 4, 6, 8, 12, 16] as const;

/**
 * Derives coordinates for all supported dimensions for a permitted GREEN record
 */
function deriveCoordinatesForAllDimensions(
  classified: ClassifiedRecord
): DimensionalCoordinateMap {
  const coordMap: { [dim: number]: any } = {};

  if (classified.classification !== 'GREEN' || !classified.processingAllowed) {
    return Object.freeze(coordMap);
  }

  for (const dim of SUPPORTED_DIMENSIONS) {
    const res = guardDimensionalProjection(classified, dim, 0);
    if (res.success && res.payload) {
      coordMap[dim] = Object.freeze({
        formattedCoordinate: res.payload.formattedCoordinate,
        coordinateValues: res.payload.coordinateValues,
        coordinateId: `COORD_Z${dim}_${classified.recordIdentity}`,
      });
    }
  }

  return Object.freeze(coordMap);
}

/**
 * Extracts comprehensive semantic terms for multi-field search
 */
function extractSemanticTerms(
  entityName: string,
  category: string,
  sourceDomain: string,
  provider?: string,
  metadata?: Readonly<Record<string, unknown>>
): readonly string[] {
  const termSet = new Set<string>();

  const addTerms = (s?: string) => {
    if (!s) return;
    const parts = s.toLowerCase().split(/[\s_\-#/.:@]+/);
    for (const p of parts) {
      if (p.length >= 2) termSet.add(p);
    }
  };

  addTerms(entityName);
  addTerms(category);
  addTerms(sourceDomain);
  addTerms(provider);

  if (metadata) {
    for (const val of Object.values(metadata)) {
      if (typeof val === 'string') addTerms(val);
    }
  }

  return Object.freeze(Array.from(termSet).sort());
}

/**
 * Normalizes a raw input record into a unified DimensionalInformationState
 */
export function normalizeToDimensionalState(
  rawRecord: RawInputRecord,
  entityName?: string,
  connectedEntityIds: readonly string[] = [],
  timestamp = 0
): DimensionalInformationState {
  const classified = classifyRecord(rawRecord, undefined, timestamp);
  const name = entityName || rawRecord.recordId.replace(/^REC_/, '').replace(/^LLM_/, '').replace(/_/g, ' ');

  const isGreen = classified.classification === 'GREEN' && classified.processingAllowed;
  const coordinates = deriveCoordinatesForAllDimensions(classified);

  let sequence369: string | null = null;
  let numericState: string | null = null;

  if (isGreen) {
    const enc = guard369Encoding(classified, timestamp);
    if (enc.success && enc.payload) {
      sequence369 = enc.payload.sequence369;
      numericState = enc.payload.numericStateBigIntString;
    }
  }

  const modelMeta = rawRecord.metadata?.modelName
    ? {
        modelName: String(rawRecord.metadata.modelName),
        provider: String(rawRecord.metadata.provider || rawRecord.sourceDomain),
        parameterCount: rawRecord.metadata.parameterCount ? String(rawRecord.metadata.parameterCount) : undefined,
        licenseType: rawRecord.metadata.licenseType ? String(rawRecord.metadata.licenseType) : undefined,
        explicitlyAuthorized: rawRecord.metadata.explicitlyPermitted === true,
      }
    : undefined;

  const semanticTerms = extractSemanticTerms(
    name,
    rawRecord.category,
    rawRecord.sourceDomain,
    modelMeta?.provider,
    rawRecord.metadata
  );

  const dimensionPath = `UNIVERSE → ${rawRecord.sourceDomain} → ${rawRecord.category} → ${name} → STATE → Z3`;

  return Object.freeze({
    stateId: `STATE49:${rawRecord.recordId}`,
    recordId: rawRecord.recordId,
    entityId: `ENTITY:${rawRecord.recordId}`,
    entityName: name,
    category: rawRecord.category,
    classification: classified.classification,
    classificationStatus: classified.status,
    processingAllowed: classified.processingAllowed,
    classificationRuleId: classified.classificationRuleId,
    classificationReason: classified.classificationReason,
    sourceDomain: rawRecord.sourceDomain,
    sourceUrl: rawRecord.sourceUrl || `https://${rawRecord.sourceDomain}/${rawRecord.recordId}`,
    dimension: 3,
    dimensionPath,
    coordinatesByDimension: coordinates,
    sequence369,
    numericStateBigIntString: numericState,
    payloadChecksum: rawRecord.payloadChecksum,
    semanticTerms,
    modelMetadata: modelMeta ? Object.freeze(modelMeta) : undefined,
    provenanceLineage: Object.freeze([
      `PROV_SOURCE:${rawRecord.sourceDomain}`,
      `PROV_CAPTURE:${rawRecord.sourceUrl || rawRecord.sourceDomain}`,
      `PROV_CLASS:${classified.classification}:${classified.status}`,
      `PROV_RULE:${classified.classificationRuleId}`,
      `PROV_CANON:CHK_${rawRecord.payloadChecksum}`,
      `PROV_STATE:STATE49:${rawRecord.recordId}`,
    ]),
    connectedEntityIds: Object.freeze([...connectedEntityIds]),
    isRestricted: !isGreen,
  });
}

/**
 * Converts an LLMModelRecord into a DimensionalInformationState
 */
export function normalizeLLMToDimensionalState(
  llm: LLMModelRecord,
  connectedEntityIds: readonly string[] = [],
  timestamp = 0
): DimensionalInformationState {
  const raw = adaptLLMRecordToRawInput(llm);
  return normalizeToDimensionalState(raw, llm.modelName, connectedEntityIds, timestamp);
}
