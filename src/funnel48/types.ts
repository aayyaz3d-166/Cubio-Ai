/**
 * 3D Memory Studio — Funnel 48
 * Studio Classification & LLM Model Explorer Types
 *
 * Strongly typed structures for LLM model records, classification integration,
 * dedicated LLM Explorer view models, restricted state displays, and test suites.
 */

import { DataClassification, ClassificationStatus, ClassifiedRecord } from '../funnel47/types';

export type LLMFilterType = 'ALL_LLMS' | 'GREEN_LLMS' | 'RED_LLMS';

export interface LLMModelRecord {
  readonly modelId: string;
  readonly modelName: string;
  readonly provider: string;
  readonly sourceDomain: string;
  readonly sourceUrl?: string;
  readonly modelCategory: string; // e.g. 'LLM_MODEL' | 'AI_MODEL' | 'FOUNDATION_MODEL' | 'EMBEDDING_MODEL'
  readonly parameterCount?: string;
  readonly licenseType?: string;
  readonly explicitlyAuthorized: boolean;
  readonly rawValue: unknown;
  readonly originalChecksum: string;
}

export interface LLMModelViewModel {
  readonly modelId: string;
  readonly modelName: string;
  readonly provider: string;
  readonly sourceDomain: string;
  readonly sourceUrl: string;
  readonly modelCategory: string;
  readonly parameterCount: string | null;
  readonly licenseType: string | null;
  readonly classification: DataClassification;
  readonly classificationStatus: ClassificationStatus;
  readonly processingAllowed: boolean;
  readonly classificationRuleId: string;
  readonly classificationReason: string;
  readonly originalChecksum: string;
  readonly recordIdentity: string;
  readonly sourceIdentity: string;
  readonly coordinateId: string | null;
  readonly dimension: number;
  readonly processingAllowed369: boolean;
  readonly dimensionalProcessingAllowed: boolean;
  readonly provenance: readonly string[];
  readonly sequence369Snippet: string | null;
  readonly formattedCoordinate: string | null;
  readonly isRestricted: boolean;
}

export interface LLMExplorerSummary {
  readonly totalLLMs: number;
  readonly greenLLMs: number;
  readonly redLLMs: number;
  readonly authorizedPercentage: number;
  readonly restrictedPercentage: number;
}

export interface LLMExplorerViewModel {
  readonly summary: LLMExplorerSummary;
  readonly activeFilter: LLMFilterType;
  readonly visibleModels: readonly LLMModelViewModel[];
  readonly totalMatchingModels: number;
  readonly pageIndex: number;
  readonly pageSize: number;
  readonly totalPages: number;
  readonly hasMoreUnrendered: boolean;
}

export interface LLMSearchQueryCriteria {
  readonly queryTerm: string;
  readonly classificationFilter?: 'ALL' | 'GREEN' | 'RED';
  readonly providerFilter?: string;
}

export interface LLMSearchResultItem {
  readonly rank: number;
  readonly modelId: string;
  readonly modelName: string;
  readonly provider: string;
  readonly classification: DataClassification;
  readonly matchType: 'EXACT_MODEL_ID' | 'EXACT_NAME' | 'PROVIDER_MATCH' | 'DOMAIN_MATCH' | 'CHECKSUM_MATCH' | 'SUBSTRING_MATCH';
  readonly processingAllowed: boolean;
  readonly formattedCoordinate: string | null;
  readonly payloadChecksum: string;
}

export interface LLMSearchConsoleViewModel {
  readonly queryTerm: string;
  readonly totalFound: number;
  readonly visibleResults: readonly LLMSearchResultItem[];
  readonly rankingPolicy: string;
}

export interface F48TestResult {
  readonly testId: string;
  readonly name: string;
  readonly passed: boolean;
  readonly details: string;
  readonly durationMs: number;
  readonly totalEvaluations?: number;
  readonly collisions?: number;
  readonly variance?: number;
  readonly greenCount?: number;
  readonly redCount?: number;
}

export interface F48SuiteReport {
  readonly suiteName: string;
  readonly totalTests: number;
  readonly passedTests: number;
  readonly failedTests: number;
  readonly allPassed: boolean;
  readonly totalDurationMs: number;
  readonly results: readonly F48TestResult[];
}
