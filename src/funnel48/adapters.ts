/**
 * 3D Memory Studio — Funnel 48
 * LLM Model Adapters & View Model Derivation
 *
 * Adapts LLM records through the authoritative F47 classification & guard boundary.
 */

import { LLMModelRecord, LLMModelViewModel } from './types';
import { RawInputRecord, ClassifiedRecord } from '../funnel47/types';
import { classifyRecord } from '../funnel47/classifier';
import { guard369Encoding, guardDimensionalProjection } from '../funnel47/guards';

/**
 * Converts an LLMModelRecord to an F47 RawInputRecord
 */
export function adaptLLMRecordToRawInput(llm: LLMModelRecord): RawInputRecord {
  return Object.freeze({
    recordId: llm.modelId,
    sourceDomain: llm.sourceDomain,
    sourceUrl: llm.sourceUrl,
    category: llm.modelCategory || 'LLM_MODEL',
    rawValue: llm.rawValue,
    payloadChecksum: llm.originalChecksum,
    metadata: Object.freeze({
      modelName: llm.modelName,
      provider: llm.provider,
      parameterCount: llm.parameterCount,
      licenseType: llm.licenseType,
      explicitlyPermitted: llm.explicitlyAuthorized === true,
    }),
  });
}

/**
 * Classifies an LLM model through F47 and derives a strongly-typed LLMModelViewModel
 */
export function adaptLLMToViewModel(
  llm: LLMModelRecord,
  dimension = 3,
  timestamp = 0
): LLMModelViewModel {
  const rawInput = adaptLLMRecordToRawInput(llm);
  const classified: ClassifiedRecord = classifyRecord(rawInput, undefined, timestamp);

  let sequence369Snippet: string | null = null;
  let formattedCoordinate: string | null = null;
  let coordinateId: string | null = null;

  // HARD SAFETY BOUNDARY: 369 and dimensional projection only executed if GREEN
  if (classified.classification === 'GREEN' && classified.processingAllowed) {
    const encResult = guard369Encoding(classified, timestamp);
    if (encResult.success && encResult.payload) {
      sequence369Snippet = encResult.payload.sequence369.substring(0, 18);
    }

    const dimResult = guardDimensionalProjection(classified, dimension, timestamp);
    if (dimResult.success && dimResult.payload) {
      formattedCoordinate = dimResult.payload.formattedCoordinate;
      coordinateId = `COORD_Z${dimension}_${llm.modelId}`;
    }
  }

  const isRestricted = classified.classification === 'RED' || !classified.processingAllowed;

  return Object.freeze({
    modelId: llm.modelId,
    modelName: llm.modelName,
    provider: llm.provider,
    sourceDomain: llm.sourceDomain,
    sourceUrl: llm.sourceUrl || `https://${llm.sourceDomain}/models/${llm.modelId}`,
    modelCategory: llm.modelCategory,
    parameterCount: llm.parameterCount ?? null,
    licenseType: llm.licenseType ?? null,
    classification: classified.classification,
    classificationStatus: classified.status,
    processingAllowed: classified.processingAllowed,
    classificationRuleId: classified.classificationRuleId,
    classificationReason: classified.classificationReason,
    originalChecksum: llm.originalChecksum,
    recordIdentity: llm.modelId,
    sourceIdentity: llm.sourceDomain,
    coordinateId,
    dimension,
    processingAllowed369: classified.classification === 'GREEN' && classified.processingAllowed,
    dimensionalProcessingAllowed: classified.classification === 'GREEN' && classified.processingAllowed,
    provenance: Object.freeze([
      `PROV_SOURCE:${llm.provider}@${llm.sourceDomain}`,
      `PROV_RULE:${classified.classificationRuleId}`,
      `PROV_CLASS:${classified.classification}:${classified.status}`,
      `PROV_CHK:${llm.originalChecksum}`,
    ]),
    sequence369Snippet,
    formattedCoordinate,
    isRestricted,
  });
}

/**
 * Batch adapts an array of LLMModelRecords into immutable LLMModelViewModels
 */
export function adaptLLMRecordList(
  models: readonly LLMModelRecord[],
  dimension = 3,
  timestamp = 0
): readonly LLMModelViewModel[] {
  return Object.freeze(models.map((m) => adaptLLMToViewModel(m, dimension, timestamp)));
}
