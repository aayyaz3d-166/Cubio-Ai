/**
 * 3D Memory Studio — Funnel 48
 * LLM Explorer View Models & Restricted State Inspector
 */

import { LLMModelViewModel, LLMExplorerViewModel, LLMFilterType } from './types';
import { summarizeLLMModels, filterLLMModels, selectBoundedLLMWindow } from './selectors';

/**
 * Derives the complete LLM Explorer view model
 */
export function createLLMExplorerViewModel(
  models: readonly LLMModelViewModel[],
  filterType: LLMFilterType = 'ALL_LLMS',
  pageIndex = 0,
  pageSize = 20,
  maxBudget = 50
): LLMExplorerViewModel {
  const summary = summarizeLLMModels(models);
  const filtered = filterLLMModels(models, filterType);
  const windowResult = selectBoundedLLMWindow(filtered, pageIndex, pageSize, maxBudget);

  return Object.freeze({
    summary,
    activeFilter: filterType,
    visibleModels: windowResult.visibleModels,
    totalMatchingModels: windowResult.totalMatching,
    pageIndex,
    pageSize,
    totalPages: windowResult.totalPages,
    hasMoreUnrendered: windowResult.hasMoreUnrendered,
  });
}

/**
 * Builds an explicit restricted-state inspector summary for RED LLM models
 */
export function createRestrictedStateInspectorSummary(model: LLMModelViewModel): {
  readonly title: string;
  readonly modelId: string;
  readonly modelName: string;
  readonly category: string;
  readonly status: string;
  readonly processingBlocked: {
    readonly encoding369: string;
    readonly dimensionalPlacement: string;
    readonly semanticGraph: string;
    readonly reason: string;
    readonly ruleId: string;
  };
  readonly safeMetadata: {
    readonly provider: string;
    readonly sourceDomain: string;
    readonly originalChecksum: string;
    readonly parameterCount: string | null;
  };
} {
  return Object.freeze({
    title: '🔴 RED / BLOCKED — PROCESSING RESTRICTED',
    modelId: model.modelId,
    modelName: model.modelName,
    category: model.modelCategory,
    status: model.classificationStatus,
    processingBlocked: Object.freeze({
      encoding369: 'BLOCKED',
      dimensionalPlacement: 'BLOCKED',
      semanticGraph: 'BLOCKED',
      reason: model.classificationReason,
      ruleId: model.classificationRuleId,
    }),
    safeMetadata: Object.freeze({
      provider: model.provider,
      sourceDomain: model.sourceDomain,
      originalChecksum: model.originalChecksum,
      parameterCount: model.parameterCount,
    }),
  });
}
